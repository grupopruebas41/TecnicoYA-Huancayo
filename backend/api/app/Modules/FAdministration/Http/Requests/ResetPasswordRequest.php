<?php

namespace App\Modules\FAdministration\Http\Requests;

use Closure;

class ResetPasswordRequest extends AccountRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeEmail();
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:254'],
            'token' => ['required', 'string', 'max:255'],
            // Mismas reglas que el registro (S1): mínimo 8 caracteres y 72 bytes como máximo.
            'password' => ['required', 'string', 'min:8', 'confirmed', function (string $attribute, mixed $value, Closure $fail) {
                if (is_string($value) && strlen($value) > 72) {
                    $fail(__('api.password_bytes'));
                }
            }],
        ];
    }
}
