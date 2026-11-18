<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\PortfolioImage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Trabajo de portafolio: alta (POST) y edición versionada (PATCH). De 1 a 5 imágenes propias, públicas y
 * revisadas (D-46); nunca un documento de verificación.
 * Fase T4: cada imagen nueva lleva su texto alternativo (`image_captions`, en el mismo orden que media_ids, hasta
 * 180 caracteres). Al editar, las imágenes que ya estaban en el trabajo pueden ir sin texto y conservan el suyo.
 */
final class StorePortfolioItemRequest extends FormRequest
{
    public const CAPTION_MAX = 180;

    public function rules(): array
    {
        $required = $this->isMethod('patch') ? ['sometimes', 'required'] : ['required'];
        $images = count((array) $this->input('media_ids', []));

        return [
            'technician_id' => ['prohibited'],
            'title' => [...$required, 'string', 'min:2', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'subcategory_id' => ['nullable', 'integer', Rule::exists('subcategories', 'id')],
            'performed_on' => ['nullable', 'date', 'before_or_equal:today'],
            'status' => [...$required, Rule::in(['draft', 'published'])],
            'media_ids' => [...$required, 'array', 'min:1', 'max:5'],
            'media_ids.*' => ['integer', 'distinct', new PortfolioImage((int) $this->user()->id)],
            // D-101 (propuesta): etapa de cada imagen, en el mismo orden que media_ids.
            'image_stages' => ['sometimes', 'nullable', 'array', 'size:'.$images],
            'image_stages.*' => ['nullable', Rule::in(['before', 'after'])],
            'image_captions' => [$this->isMethod('patch') ? 'sometimes' : 'required', 'nullable', 'array', 'size:'.$images],
            'image_captions.*' => ['nullable', 'string', 'max:'.self::CAPTION_MAX],
            'expected_version' => $this->isMethod('patch') ? ['required', 'integer', 'min:1'] : ['prohibited'],
        ];
    }

    /** Texto alternativo obligatorio en cada imagen que no estaba ya en el trabajo. */
    public function after(): array
    {
        return [function (Validator $validator) {
            $mediaIds = $this->input('media_ids');
            if (! is_array($mediaIds) || $validator->errors()->hasAny(['media_ids', 'image_captions'])) {
                return;
            }
            $item = $this->route('item');
            $kept = $item === null ? collect() : DB::table('portfolio_images')->where('portfolio_id', (int) $item)->pluck('media_id')->map(fn ($id) => (int) $id);
            $captions = array_values((array) $this->input('image_captions', []));
            foreach (array_values($mediaIds) as $index => $mediaId) {
                $caption = $captions[$index] ?? null;
                if (! $kept->contains((int) $mediaId) && (! is_string($caption) || trim($caption) === '')
                    && ! $validator->errors()->has("image_captions.$index")) {
                    $validator->errors()->add("image_captions.$index", __('api.image_caption_required'));
                }
            }
        }];
    }

    public function messages(): array
    {
        return ['performed_on.before_or_equal' => __('api.performed_on_future'), 'image_stages.size' => __('api.image_stages_count'),
            'image_stages.array' => __('api.image_stages_count'), 'image_stages.*.in' => __('api.image_stage'),
            'image_captions.required' => __('api.image_captions_count'), 'image_captions.size' => __('api.image_captions_count'),
            'image_captions.array' => __('api.image_captions_count'), 'image_captions.*.max' => __('api.image_caption_max')];
    }
}
