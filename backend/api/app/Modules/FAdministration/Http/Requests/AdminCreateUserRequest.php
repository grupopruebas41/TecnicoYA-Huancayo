<?php

namespace App\Modules\FAdministration\Http\Requests;

use Closure;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/**
 * D-85: alta de usuario desde el panel. Mismos datos y validaciones del registro (D-80), sin contraseña ni
 * aceptación de términos (la persona los define al activar), con el rol administrador y un motivo obligatorio.
 * Para dar de alta un administrador, quien lo crea reingresa su contraseña (`current_password`), con un límite de
 * 5 fallos cada 15 minutos por cuenta; para clientes y técnicos ese campo está prohibido.
 */
final class AdminCreateUserRequest extends RegisterAccountRequest
{
    public const RECONFIRM_ATTEMPTS = 5;

    public const RECONFIRM_DECAY_SECONDS = 900;

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
            'current_password' => $this->input('account_type') === 'admin'
                ? ['required', 'string', 'bail', fn (string $attribute, mixed $value, Closure $fail) => $this->reconfirm($value, $fail)]
                : ['prohibited'],
        ]);
    }

    private function reconfirm(mixed $value, Closure $fail): void
    {
        $key = 'admin-reconfirm:'.$this->user()->id;
        if (RateLimiter::tooManyAttempts($key, self::RECONFIRM_ATTEMPTS)) {
            $fail(__('api.reconfirm_locked', ['minutes' => (int) ceil(RateLimiter::availableIn($key) / 60)]));

            return;
        }
        if (! is_string($value) || ! Hash::check($value, $this->user()->password)) {
            RateLimiter::hit($key, self::RECONFIRM_DECAY_SECONDS);
            $fail(__('api.current_password_invalid'));

            return;
        }
        RateLimiter::clear($key);
    }
}
