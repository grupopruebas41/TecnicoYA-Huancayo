<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Solo se admite aprobar: el rechazo y la solicitud de cambios siguen pendientes de P22. */
final class ReviewTechnicianRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['approve'])],
            'reason' => ['required', 'string', 'min:5', 'max:2000'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
