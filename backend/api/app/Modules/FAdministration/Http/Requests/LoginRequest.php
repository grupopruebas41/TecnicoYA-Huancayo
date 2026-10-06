<?php

namespace App\Modules\FAdministration\Http\Requests;

class LoginRequest extends AccountRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeEmail();
    }

    public function rules(): array
    {
        return ['email' => ['required', 'string', 'email', 'max:254'], 'password' => ['required', 'string']];
    }
}
