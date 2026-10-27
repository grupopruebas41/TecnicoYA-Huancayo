<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Models\User;
use App\Modules\FAdministration\Application\AuditAdminAccess;
use App\Modules\FAdministration\Http\Requests\ForgotPasswordRequest;
use App\Modules\FAdministration\Http\Requests\ResetPasswordRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** D-80: recuperación de contraseña por enlace; nunca revela si el correo existe. */
final class PasswordResetController
{
    public function forgot(ForgotPasswordRequest $request, AuditAdminAccess $audit): JsonResponse
    {
        $user = User::query()->where('email', $request->validated('email'))
            ->where('is_active', true)->whereNull('anonymized_at')->first();
        // RESET_THROTTLED (un pedido por minuto por cuenta) también responde igual.
        if ($user && Password::broker()->sendResetLink(['email' => $user->email]) === Password::RESET_LINK_SENT) {
            $audit->passwordResetRequested($user);
        }

        // Mismo sobre data que el resto de la API: la SPA lo exige para confirmar el resultado.
        return ApiResponse::data(['message' => __('api.password_reset_link_sent')], 202);
    }

    public function reset(ResetPasswordRequest $request, AuditAdminAccess $audit): JsonResponse
    {
        $resetUser = null;
        // D-85: una cuenta dada de alta por un administrador se activa con el mismo formulario y el broker de 72 horas.
        $target = User::query()->where('email', $request->validated('email'))->first();
        $activating = $target !== null && $target->invited_at !== null && $target->activated_at === null;
        $status = Password::broker($activating ? 'activations' : null)->reset($request->validated(), function (User $user, string $password) use (&$resetUser, $activating) {
            DB::transaction(function () use ($user, $password, $activating) {
                $user->forceFill([
                    'password' => $password, 'remember_token' => Str::random(60), 'auth_version' => $user->auth_version + 1,
                ] + ($activating ? ['activated_at' => now(), 'email_verified_at' => $user->email_verified_at ?? now()] : []))->save();
                // Cierra todas las sesiones de la cuenta, como la suspensión de D-32.
                DB::table('sessions')->where('user_id', $user->id)->delete();
            });
            $resetUser = $user;
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => __('api.password_reset_invalid')]);
        }
        $audit->passwordReset($resetUser);

        return ApiResponse::data(['message' => __('api.password_reset_done')]);
    }
}
