<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\PortfolioImage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Trabajo de portafolio. Cantidad y formatos de imágenes siguen pendientes de P17: aquí solo pertenencia y revisión. */
final class StorePortfolioItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'technician_id' => ['prohibited'],
            'title' => ['required', 'string', 'min:2', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'subcategory_id' => ['nullable', 'integer', Rule::exists('subcategories', 'id')],
            'performed_on' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'media_ids' => ['required', 'array', 'min:1'],
            'media_ids.*' => ['integer', 'distinct', new PortfolioImage((int) $this->user()->id)],
        ];
    }
}
