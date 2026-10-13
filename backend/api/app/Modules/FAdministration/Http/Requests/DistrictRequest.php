<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Alta (POST) y edición versionada (PATCH) de un distrito de cobertura (D-15); el código no se edita. */
final class DistrictRequest extends FormRequest
{
    public function rules(): array
    {
        $editing = $this->isMethod('patch');

        return [
            'name' => [...($editing ? ['sometimes'] : []), 'required', 'string', 'min:2', 'max:120',
                Rule::unique('districts', 'name')->ignore($this->route('district'))],
            'active' => $editing ? ['sometimes', 'required', 'boolean'] : ['prohibited'],
            'expected_version' => $editing ? ['required', 'integer', 'min:1'] : ['prohibited'],
            'code' => ['prohibited'],
        ];
    }
}
