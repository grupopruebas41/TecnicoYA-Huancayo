<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Models\User;
use App\Modules\FAdministration\Application\AuditAdminAccess;
use App\Modules\FAdministration\Http\Requests\ForgotPasswordRequest;
use App\Modules\FAdministration\Http\Requests\ResetPasswordRequest;
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

        return response()->json(['message' => __('api.password_reset_link_sent')], 202);
    }

    public function reset(ResetPasswordRequest $request, AuditAdminAccess $audit): JsonResponse
    {
        $resetUser = null;
        $status = Password::broker()->reset($request->validated(), function (User $user, string $password) use (&$resetUser) {
            DB::transaction(function () use ($user, $password) {
                $user->forceFill([
                    'password' => $password, 'remember_token' => Str::random(60), 'auth_version' => $user->auth_version + 1,
                ])->save();
                // Cierra todas las sesiones de la cuenta, como la suspensión de D-32.
                DB::table('sessions')->where('user_id', $user->id)->delete();
            });
            $resetUser = $user;
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => __('api.password_reset_invalid')]);
        }
        $audit->passwordReset($resetUser);

        return response()->json(['message' => __('api.password_reset_done')]);
    }
}
