<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Validation\Rule;

/** D-85: edición de datos de un usuario con versión y motivo. El rol y la contraseña no se cambian desde aquí. */
final class AdminUpdateUserRequest extends AccountRequest
{
    protected function prepareForValidation(): void
    {
        $this->normalizeEmail();
    }

    public function messages(): array
    {
        return ['phone.regex' => __('api.phone_format', ['attribute' => 'teléfono'])];
    }

    public function rules(): array
    {
        return $this->privilegedFields() + [
            'given_names' => ['sometimes', 'required', 'string', 'min:2', 'max:50'],
            'family_names' => ['sometimes', 'required', 'string', 'min:2', 'max:50'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:254', Rule::unique('users', 'email')->ignore((int) $this->route('user'))],
            'phone' => ['sometimes', 'required', 'string', 'regex:/^9\d{8}$/'],
            'district_id' => ['sometimes', 'required', 'integer', Rule::exists('districts', 'id')->where('active', 1)],
            'client_type' => ['sometimes', 'required', Rule::in(['household', 'mype'])],
            'business_name' => ['sometimes', 'nullable', 'string', 'max:180'],
            'reference_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'password' => ['prohibited'], 'password_confirmation' => ['prohibited'], 'name' => ['prohibited'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
