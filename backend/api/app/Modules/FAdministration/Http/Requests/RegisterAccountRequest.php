<?php

namespace App\Modules\FAdministration\Http\Requests;

use Closure;
use Illuminate\Validation\Rule;

class RegisterAccountRequest extends AccountRequest
{
    /** Celular peruano: 9 dígitos que empiezan en 9 (D-80). */
    private const PERU_MOBILE = 'regex:/^9\d{8}$/';

    protected function prepareForValidation(): void
    {
        $this->normalizeEmail();
    }

    public function messages(): array
    {
        return [
            'phone.regex' => __('api.phone_format', ['attribute' => 'teléfono']),
            'whatsapp.regex' => __('api.phone_format', ['attribute' => 'WhatsApp']),
        ];
    }

    public function rules(): array
    {
        $activeDistrict = Rule::exists('districts', 'id')->where('active', 1);
        $client = 'prohibited_unless:account_type,client';
        $technician = 'prohibited_unless:account_type,technician';

        return $this->privilegedFields() + [
            // D-75: nombres y apellidos componen name; name solo se sigue aceptando por compatibilidad con el S1.
            'name' => ['required_without:given_names', 'prohibits:given_names,family_names', 'string', 'min:2', 'max:100'],
            'given_names' => ['required_without:name', 'string', 'min:2', 'max:50'],
            'family_names' => ['required_without:name', 'required_with:given_names', 'string', 'min:2', 'max:50'],
            'email' => ['required', 'string', 'email', 'max:254', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', self::PERU_MOBILE],
            // Se conserva el mínimo histórico; 72 bytes evita truncamiento de bcrypt.
            'password' => ['required', 'string', 'min:8', 'confirmed', function (string $attribute, mixed $value, Closure $fail) {
                if (is_string($value) && strlen($value) > 72) {
                    $fail(__('api.password_bytes'));
                }
            }],
            'account_type' => ['required', Rule::in(['client', 'technician'])],
            'terms_accepted' => ['accepted'],
            // Cliente (D-80): distrito principal activo, MYPE con razón social opcional y dirección privada opcional.
            'client_type' => ['required_if:account_type,client', $client, Rule::in(['household', 'mype'])],
            'district_id' => ['required_if:account_type,client', $client, 'integer', $activeDistrict],
            'business_name' => ['nullable', $client, 'prohibited_unless:client_type,mype', 'string', 'max:180'],
            'reference_address' => ['nullable', $client, 'string', 'max:255'],
            // Técnico (D-64 y D-80): distrito base, distritos que atiende, especialidades y experiencia.
            'base_district_id' => ['required_if:account_type,technician', $technician, 'integer', $activeDistrict],
            'district_ids' => ['required_if:account_type,technician', $technician, 'array', 'max:20'],
            'district_ids.*' => ['integer', 'distinct', $activeDistrict],
            'specialty_ids' => ['required_if:account_type,technician', $technician, 'array', 'min:1', 'max:10'],
            'specialty_ids.*' => ['integer', 'distinct', Rule::exists('specialties', 'id')->where('active', 1)],
            'experience_years' => ['required_if:account_type,technician', $technician, 'integer', 'min:0', 'max:50'],
            'whatsapp' => ['nullable', $technician, 'string', self::PERU_MOBILE],
        ];
    }
}
