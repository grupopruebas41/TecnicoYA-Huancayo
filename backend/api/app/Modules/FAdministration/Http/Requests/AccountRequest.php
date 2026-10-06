<?php

namespace App\Modules\FAdministration\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class AccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // La ruta determina identidad/permiso; el registro es público.
    }

    protected function normalizeEmail(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }

    protected function privilegedFields(): array
    {
        return array_fill_keys([
            'role', 'role_id', 'permissions', 'is_active', 'status', 'verification_status',
            'verified', 'verified_by', 'verified_at', 'available_now', 'auth_version',
            'version', 'user_id', 'id', 'client_id', 'email_verified_at', 'anonymized_at',
        ], ['prohibited']);
    }
}
