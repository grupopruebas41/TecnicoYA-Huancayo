<?php

namespace App\Modules\ARequests\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Corrección del resumen antes de enviar: descripción, dirección y distrito. Cambiar servicio, origen o
 * modalidad exige registrar otra solicitud (no se recalcula la tarifa referencial de la fotografía).
 */
final class UpdateServiceRequestRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'required', 'string'],
            'address' => ['sometimes', 'required', 'string'],
            'district_id' => ['sometimes', 'required', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'expected_version' => ['required', 'integer', 'min:1'],
            'subcategory_id' => ['prohibited'], 'source' => ['prohibited'], 'target_technician_id' => ['prohibited'],
            'mode' => ['prohibited'], 'preferred_start_at' => ['prohibited'], 'preferred_end_at' => ['prohibited'],
            'status' => ['prohibited'], 'client_id' => ['prohibited'], 'reference_fee' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return ['district_id.exists' => __('api.out_of_coverage')];
    }
}
