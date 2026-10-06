<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Horario semanal, zonas y pausa propios. Duración y compatibilidad con citas: P05/P16 (no se valida aquí). */
final class UpdateAvailabilityRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'technician_id' => ['prohibited'],
            'slots' => ['present', 'array', 'max:21'],
            'slots.*.weekday' => ['required', 'integer', 'min:1', 'max:7'],
            'slots.*.start' => ['required', 'date_format:H:i'],
            'slots.*.end' => ['required', 'date_format:H:i', 'after:slots.*.start'],
            'district_ids' => ['present', 'array', 'max:20'],
            'district_ids.*' => ['integer', 'distinct', Rule::exists('districts', 'id')->where('active', 1)],
            'pause' => ['present', 'nullable', 'array'],
            'pause.starts_at' => ['required_with:pause', 'date'],
            'pause.ends_at' => ['nullable', 'date', 'after:pause.starts_at'],
            'pause.reason' => ['nullable', 'string', 'max:255'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
