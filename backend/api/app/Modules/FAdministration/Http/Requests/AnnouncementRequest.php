<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\AnnouncementImages;
use App\Modules\FAdministration\Domain\GeniallyUrl;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Alta (POST) y edición de borrador (PATCH) de un comunicado (contrato S2 §8.2 y S07 §8). El texto se guarda tal
 * cual y la SPA lo muestra como texto; el enlace solo admite http y https (SEC-S02-03).
 * D-83: el origen `image` exige imagen principal 3:1 revisada, el origen `genially` un enlace de view.genially.com
 * (portada opcional) y ambos, tipo y texto alternativo. Sin `source`, el alta sigue siendo el comunicado de texto
 * del S2. En PATCH, las exigencias del origen se aplican cuando se envía `source`.
 */
final class AnnouncementRequest extends FormRequest
{
    public const KINDS = ['promotion', 'raffle', 'news', 'notice'];

    protected function prepareForValidation(): void
    {
        $normalized = GeniallyUrl::normalize($this->input('genially_url'));
        if ($normalized !== null) {
            $this->merge(['genially_url' => $normalized]);
        }
    }

    public function rules(): array
    {
        $editing = $this->isMethod('patch');
        $required = $editing ? ['sometimes', 'required'] : ['required'];
        $source = $this->input('source', $editing ? null : 'text');
        $rich = in_array($source, ['image', 'genially'], true);

        return [
            'source' => ['sometimes', 'string', Rule::in(['text', 'image', 'genially'])],
            'kind' => [Rule::requiredIf($rich), 'nullable', 'string', Rule::in(self::KINDS)],
            'title' => [...$required, 'string', 'min:3', 'max:120'],
            // En imagen y Genially, el mensaje está en la imagen: el cuerpo es opcional.
            'body' => $source === 'text' ? [...$required, 'string', 'max:5000'] : ['sometimes', 'nullable', 'string', 'max:5000'],
            'alt_text' => [Rule::requiredIf($rich), 'nullable', 'string', 'min:5', 'max:250'],
            'image_media_id' => [Rule::requiredIf($source === 'image'), 'nullable', 'integer', $this->image('main', 'api.announcement_image')],
            'mobile_media_id' => ['nullable', 'integer', function (string $attribute, mixed $value, Closure $fail) use ($source) {
                if ($source !== 'image' || ! app(AnnouncementImages::class)->valid($value, 'mobile')) {
                    $fail(__('api.announcement_mobile_image'));
                }
            }],
            'genially_url' => [Rule::requiredIf($source === 'genially'), 'nullable', 'string', function (string $attribute, mixed $value, Closure $fail) {
                if (GeniallyUrl::normalize($value) !== $value) {
                    $fail(__('api.genially_url'));
                }
            }],
            'audiences' => [...$required, 'array', 'min:1', 'max:2'],
            'audiences.*' => ['required', 'string', 'distinct', Rule::in(['client', 'technician'])],
            'starts_at' => [...$required, 'date'],
            'ends_at' => [...$required, 'date', ...($this->has('starts_at') ? ['after:starts_at'] : [])],
            'priority' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'link_url' => ['sometimes', 'nullable', 'string', 'max:2048', 'url:http,https'],
            'link_label' => ['sometimes', 'nullable', 'string', 'max:40', 'required_with:link_url'],
            'expected_version' => $editing ? ['required', 'integer', 'min:1'] : ['prohibited'],
            'status' => ['prohibited'], 'id' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'link_url.url' => __('api.link_scheme'),
            'image_media_id.required' => __('api.announcement_image'),
            'genially_url.required' => __('api.genially_url'),
        ];
    }

    private function image(string $slot, string $message): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($slot, $message) {
            if (! app(AnnouncementImages::class)->valid($value, $slot)) {
                $fail(__($message));
            }
        };
    }
}
