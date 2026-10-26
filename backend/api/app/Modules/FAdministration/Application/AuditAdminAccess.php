<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * D-44: audita el acceso de cuentas administradoras (SEC-S01-05). Los demás roles no se auditan en S1.
 * Nunca registra contraseñas ni datos de la sesión.
 */
final class AuditAdminAccess
{
    public function __construct(private readonly AuditTrail $audit) {}

    public function succeeded(User $user): void
    {
        if ($this->isAdmin($user)) {
            $this->audit->record($user, 'auth.login', null, 'user', $user->id, 'Inicio de sesión de administrador.');
        }
    }

    /** El intento fallido no tiene actor autenticado: la cuenta afectada queda como sujeto. */
    public function failed(string $email): void
    {
        $user = User::query()->where('email', $email)->first();
        if ($user && $this->isAdmin($user)) {
            $this->audit->record(null, 'auth.login_failed', null, 'user', $user->id,
                'Intento fallido de inicio de sesión de administrador.');
        }
    }

    public function loggedOut(?User $user): void
    {
        if ($user && $this->isAdmin($user)) {
            $this->audit->record($user, 'auth.logout', null, 'user', $user->id, 'Cierre de sesión de administrador.');
        }
    }

    /** D-80: la recuperación no tiene actor autenticado; la cuenta afectada queda como sujeto, sin token. */
    public function passwordResetRequested(User $user): void
    {
        if ($this->isAdmin($user)) {
            $this->audit->record(null, 'auth.password_reset_requested', null, 'user', $user->id,
                'Solicitud de enlace para restablecer la contraseña de un administrador.');
        }
    }

    public function passwordReset(User $user): void
    {
        if ($this->isAdmin($user)) {
            $this->audit->record(null, 'auth.password_reset', null, 'user', $user->id,
                'Contraseña de administrador restablecida con enlace; sesiones cerradas.');
        }
    }

    private function isAdmin(User $user): bool
    {
        return DB::table('roles')->where('id', $user->role_id)->value('code') === 'admin';
    }
}
