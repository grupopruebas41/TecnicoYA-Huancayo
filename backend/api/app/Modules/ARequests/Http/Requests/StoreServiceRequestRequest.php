<?php

namespace App\Modules\ARequests\Http\Requests;

use App\Modules\ARequests\Domain\TargetTechnicianOffers;
use App\Modules\FAdministration\Domain\ActiveSubcategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Solicitud en cinco pasos (RN-04). Descripción de 20 a 1000 caracteres (D-12), dirección de 5 a 255 (D-56) e
 * inicio programado no anterior a la hora del servidor (D-55). El cliente no fija importes, estado ni titular.
 */
final class StoreServiceRequestRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'subcategory_id' => ['required', 'integer', new ActiveSubcategory('api.subcategory_unavailable')],
            'description' => self::DESCRIPTION,
            'district_id' => ['required', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'address' => self::ADDRESS,
            'mode' => ['required', Rule::in(['asap', 'scheduled'])],
            'preferred_start_at' => ['exclude_unless:mode,scheduled', 'required', 'date', 'after_or_equal:now'],
            'preferred_end_at' => ['exclude_unless:mode,scheduled', 'required', 'date', 'after:preferred_start_at'],
            'source' => ['required', Rule::in(['automatic', 'profile'])],
            'target_technician_id' => ['exclude_unless:source,profile', 'required', 'integer',
                new TargetTechnicianOffers($this->input('subcategory_id'))],
            'reference_fee' => ['prohibited'], 'client_id' => ['prohibited'], 'status' => ['prohibited'],
        ];
    }

    public const DESCRIPTION = ['required', 'string', 'min:20', 'max:1000'];

    public const ADDRESS = ['required', 'string', 'min:5', 'max:255'];

    /** Mensajes compartidos con la corrección y la revalidación del envío. */
    public static function sharedMessages(): array
    {
        return [
            'description.min' => __('api.description_length'), 'description.max' => __('api.description_length'),
            'address.min' => __('api.address_length'), 'address.max' => __('api.address_length'),
            'district_id.exists' => __('api.out_of_coverage'),
            'preferred_start_at.after_or_equal' => __('api.scheduled_start_past'),
        ];
    }

    public function messages(): array
    {
        return self::sharedMessages() + [
            'preferred_start_at.required' => __('api.scheduled_start_required'),
            'preferred_end_at.required' => __('api.scheduled_end_required'),
            'preferred_end_at.after' => __('api.scheduled_end_order'),
        ];
    }
}
