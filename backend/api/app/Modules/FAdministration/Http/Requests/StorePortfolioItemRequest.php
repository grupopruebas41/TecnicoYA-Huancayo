<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\PortfolioImage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Trabajo de portafolio: alta (POST) y edición versionada (PATCH). De 1 a 5 imágenes propias, públicas y
 * revisadas (D-46); nunca un documento de verificación.
 */
final class StorePortfolioItemRequest extends FormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('patch') ? ['sometimes', 'required'] : ['required'];

        return [
            'technician_id' => ['prohibited'],
            'title' => [...$required, 'string', 'min:2', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'subcategory_id' => ['nullable', 'integer', Rule::exists('subcategories', 'id')],
            'performed_on' => ['nullable', 'date'],
            'status' => [...$required, Rule::in(['draft', 'published'])],
            'media_ids' => [...$required, 'array', 'min:1', 'max:5'],
            'media_ids.*' => ['integer', 'distinct', new PortfolioImage((int) $this->user()->id)],
            'expected_version' => $this->isMethod('patch') ? ['required', 'integer', 'min:1'] : ['prohibited'],
        ];
    }
}
