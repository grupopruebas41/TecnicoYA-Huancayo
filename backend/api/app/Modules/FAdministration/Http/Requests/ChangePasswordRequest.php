<?php

namespace App\Modules\FAdministration\Http\Requests;

use Closure;
use Illuminate\Support\Facades\Hash;

/** POST /me/password: pide la contraseña actual; la nueva sigue las reglas del registro y debe ser distinta. */
class ChangePasswordRequest extends AccountRequest
{
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', function (string $attribute, mixed $value, Closure $fail) {
                if (! is_string($value) || ! Hash::check($value, $this->user()->password)) {
                    $fail(__('api.current_password_invalid'));
                }
            }],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password', function (string $attribute, mixed $value, Closure $fail) {
                if (is_string($value) && strlen($value) > 72) {
                    $fail(__('api.password_bytes'));
                }
            }],
        ];
    }

    public function messages(): array
    {
        return ['password.different' => __('api.password_same_as_current')];
    }
}
