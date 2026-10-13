<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Decisión de verificación (D-13, D-50): aprobar o rechazar, siempre con motivo. */
final class ReviewTechnicianRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['approve', 'reject'])],
            'reason' => ['required', 'string', 'min:5', 'max:2000'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
