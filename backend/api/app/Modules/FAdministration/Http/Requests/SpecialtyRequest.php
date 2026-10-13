<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\ReviewedImage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Alta (POST) y edición versionada (PATCH) de una especialidad; el código no se edita. */
final class SpecialtyRequest extends FormRequest
{
    public function rules(): array
    {
        $editing = $this->isMethod('patch');

        return [
            'name' => [...($editing ? ['sometimes'] : []), 'required', 'string', 'min:2', 'max:120',
                Rule::unique('specialties', 'name')->ignore($this->route('specialty'))],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'image_id' => ['sometimes', 'nullable', 'integer', new ReviewedImage],
            'active' => $editing ? ['sometimes', 'required', 'boolean'] : ['prohibited'],
            'expected_version' => $editing ? ['required', 'integer', 'min:1'] : ['prohibited'],
            'code' => ['prohibited'],
        ];
    }
}
