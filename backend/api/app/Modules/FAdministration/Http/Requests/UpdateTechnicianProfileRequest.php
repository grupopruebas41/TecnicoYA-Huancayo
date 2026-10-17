<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Bio, experiencia y distrito base del técnico de la sesión; el estado y la verificación nunca se editan aquí
 * (SEC-S02-01).
 */
final class UpdateTechnicianProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'experience_years' => ['sometimes', 'required', 'integer', 'min:0', 'max:60'],
            // D-64: distrito base desde el que se mide la distancia del matching; solo un distrito activo.
            'base_district_id' => ['sometimes', 'nullable', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'expected_version' => ['required', 'integer', 'min:1'],
            'status' => ['prohibited'], 'verification_status' => ['prohibited'], 'technician_id' => ['prohibited'],
            'user_id' => ['prohibited'], 'version' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return ['base_district_id.integer' => __('api.base_district'), 'base_district_id.exists' => __('api.base_district')];
    }
}
