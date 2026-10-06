<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\ReviewedImage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateSubcategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'specialty_id' => ['required', 'integer', Rule::exists('specialties', 'id')->where('active', 1)],
            'name' => ['required', 'string', 'min:2', 'max:180',
                Rule::unique('subcategories', 'name')->where('specialty_id', (int) $this->input('specialty_id'))],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'reference_fee' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100000'],
            'image_id' => ['sometimes', 'nullable', 'integer', new ReviewedImage],
        ];
    }
}
