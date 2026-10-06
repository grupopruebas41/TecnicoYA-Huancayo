<?php

namespace App\Modules\FAdministration\Http\Requests;

class UpdateProfileRequest extends AccountRequest
{
    public function rules(): array
    {
        return $this->privilegedFields() + [
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^\+?[0-9 ()-]+$/'],
            'expected_version' => ['required', 'integer', 'min:1'],
            'email' => ['prohibited'], 'password' => ['prohibited'], 'password_confirmation' => ['prohibited'],
            'account_type' => ['prohibited'], 'client_type' => ['prohibited'],
        ];
    }
}
