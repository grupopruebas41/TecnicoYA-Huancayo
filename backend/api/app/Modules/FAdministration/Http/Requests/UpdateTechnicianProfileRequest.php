<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Bio y experiencia del técnico de la sesión; el estado y la verificación nunca se editan aquí (SEC-S02-01). */
final class UpdateTechnicianProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'experience_years' => ['sometimes', 'required', 'integer', 'min:0', 'max:60'],
            'expected_version' => ['required', 'integer', 'min:1'],
            'status' => ['prohibited'], 'verification_status' => ['prohibited'], 'technician_id' => ['prohibited'],
            'user_id' => ['prohibited'], 'version' => ['prohibited'],
        ];
    }
}
