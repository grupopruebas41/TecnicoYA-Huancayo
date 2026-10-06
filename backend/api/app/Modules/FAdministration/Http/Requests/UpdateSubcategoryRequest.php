<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\ReviewedImage;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateSubcategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'reference_fee' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100000'],
            'image_id' => ['sometimes', 'nullable', 'integer', new ReviewedImage],
            'active' => ['sometimes', 'required', 'boolean'],
            'expected_version' => ['required', 'integer', 'min:1'],
            'specialty_id' => ['prohibited'], 'code' => ['prohibited'],
        ];
    }
}
