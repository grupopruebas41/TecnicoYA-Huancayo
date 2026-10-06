<?php

namespace App\Modules\FAdministration\Http\Requests;

use App\Modules\FAdministration\Domain\ActiveSubcategory;
use Illuminate\Foundation\Http\FormRequest;

/** Servicios y tarifas referenciales propios. La tarifa 0 y su relación con el catálogo siguen en P16. */
final class UpdateServicesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'technician_id' => ['prohibited'],
            'services' => ['present', 'array', 'max:30'],
            'services.*.subcategory_id' => ['required', 'integer', 'distinct', new ActiveSubcategory],
            'services.*.reference_fee' => ['required', 'numeric', 'min:0', 'max:100000'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
