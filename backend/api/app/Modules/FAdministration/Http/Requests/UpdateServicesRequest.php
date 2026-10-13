<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\ActiveSubcategory;
use Illuminate\Foundation\Http\FormRequest;

/** Servicios y tarifas referenciales propios: de S/ 1,00 a S/ 5 000,00 con 2 decimales como máximo (D-48). */
final class UpdateServicesRequest extends FormRequest
{
    public const MIN_FEE = 1;

    public const MAX_FEE = 5000;

    public function rules(): array
    {
        return [
            'technician_id' => ['prohibited'],
            'services' => ['present', 'array', 'max:30'],
            'services.*.subcategory_id' => ['required', 'integer', 'distinct', new ActiveSubcategory],
            'services.*.reference_fee' => ['required', 'numeric', 'decimal:0,2', 'min:'.self::MIN_FEE, 'max:'.self::MAX_FEE],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'services.*.reference_fee.min' => __('api.rate_range'),
            'services.*.reference_fee.max' => __('api.rate_range'),
            'services.*.reference_fee.decimal' => __('api.rate_decimals'),
        ];
    }
}
