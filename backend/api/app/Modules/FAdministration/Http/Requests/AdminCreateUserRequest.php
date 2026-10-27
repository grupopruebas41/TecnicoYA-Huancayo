<?php

namespace App\Modules\FAdministration\Http\Requests;

/**
 * D-85: alta de usuario desde el panel. Mismos datos y validaciones del registro (D-80), sin contraseña ni
 * aceptación de términos (la persona los define al activar), con el rol administrador y un motivo obligatorio.
 */
final class AdminCreateUserRequest extends RegisterAccountRequest
{
    public function rules(): array
    {
        $rules = parent::rules();
        unset($rules['terms_accepted'], $rules['name']);

        return array_merge($rules, [
            'name' => ['prohibited'],
            'given_names' => ['required', 'string', 'min:2', 'max:50'],
            'family_names' => ['required', 'string', 'min:2', 'max:50'],
            'password' => ['prohibited'], 'password_confirmation' => ['prohibited'], 'terms_accepted' => ['prohibited'],
            'account_type' => ['required', 'in:client,technician,admin'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);
    }
}
