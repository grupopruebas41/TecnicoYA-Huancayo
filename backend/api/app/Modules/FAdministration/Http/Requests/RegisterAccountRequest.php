<?php

namespace App\Modules\FAdministration\Http\Requests;

use Closure;
use Illuminate\Validation\Rule;

class RegisterAccountRequest extends AccountRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeEmail();
    }

    public function rules(): array
    {
        return $this->privilegedFields() + [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:254', Rule::unique('users', 'email')],
            // Se conserva el mínimo histórico; 72 bytes evita truncamiento de bcrypt.
            'password' => ['required', 'string', 'min:8', 'confirmed', function (string $attribute, mixed $value, Closure $fail) {
                if (is_string($value) && strlen($value) > 72) {
                    $fail(__('api.password_bytes'));
                }
            }],
            'account_type' => ['required', Rule::in(['client', 'technician'])],
            'client_type' => ['required_if:account_type,client', 'prohibited_unless:account_type,client', Rule::in(['household', 'mype'])],
        ];
    }
}
