<?php

namespace App\Modules\ARequests\Http\Requests;

use App\Modules\ARequests\Domain\TargetTechnicianOffers;
use App\Modules\FAdministration\Domain\ActiveSubcategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Solicitud en cinco pasos (RN-04). Descripción sin longitud mínima/máxima: P17 (TC-123 bloqueado).
 * El cliente no fija importes, estado ni titular: se rechazan explícitamente.
 */
final class StoreServiceRequestRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'subcategory_id' => ['required', 'integer', new ActiveSubcategory('api.subcategory_unavailable')],
            'description' => ['required', 'string'],
            'district_id' => ['required', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'address' => ['required', 'string'],
            'mode' => ['required', Rule::in(['asap', 'scheduled'])],
            'preferred_start_at' => ['exclude_unless:mode,scheduled', 'required', 'date'],
            'preferred_end_at' => ['exclude_unless:mode,scheduled', 'required', 'date', 'after:preferred_start_at'],
            'source' => ['required', Rule::in(['automatic', 'profile'])],
            'target_technician_id' => ['exclude_unless:source,profile', 'required', 'integer',
                new TargetTechnicianOffers($this->input('subcategory_id'))],
            'reference_fee' => ['prohibited'], 'client_id' => ['prohibited'], 'status' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'district_id.exists' => __('api.out_of_coverage'),
            'preferred_start_at.required' => __('api.scheduled_start_required'),
            'preferred_end_at.required' => __('api.scheduled_end_required'),
        ];
    }
}
