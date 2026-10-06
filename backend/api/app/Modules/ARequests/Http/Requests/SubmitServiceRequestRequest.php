<?php

namespace App\Modules\ARequests\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

/** Confirmación del quinto paso. La clave Idempotency-Key es obligatoria en este comando. */
final class SubmitServiceRequestRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'expected_version' => ['required', 'integer', 'min:1'],
            'summary_confirmed' => ['required', 'accepted'],
        ];
    }

    protected function passedValidation(): void
    {
        $key = (string) $this->header('Idempotency-Key');
        if ($key === '' || strlen($key) > 255) {
            throw ValidationException::withMessages(['idempotency_key' => __('api.idempotency_key_required')]);
        }
    }
}
