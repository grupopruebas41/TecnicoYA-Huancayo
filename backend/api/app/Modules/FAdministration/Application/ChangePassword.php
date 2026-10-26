<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * Cambio de contraseña desde Mi perfil: conserva la sesión actual, cierra las demás (como D-32) y sube auth_version.
 * Se audita para administradores (D-44), sin valores.
 */
final class ChangePassword
{
    public function __construct(private readonly AuditTrail $audit) {}

    public function execute(User $actor, string $password, ?string $currentSessionId): void
    {
        DB::transaction(function () use ($actor, $password, $currentSessionId) {
            $user = User::query()->lockForUpdate()->findOrFail($actor->id);
            $user->forceFill(['password' => $password, 'auth_version' => $user->auth_version + 1])->save();
            DB::table('sessions')->where('user_id', $user->id)
                ->when($currentSessionId, fn ($query) => $query->where('id', '!=', $currentSessionId))->delete();
            if (DB::table('roles')->where('id', $user->role_id)->value('code') === 'admin') {
                $this->audit->record($user, 'auth.password_changed', null, 'user', $user->id,
                    'Cambio de contraseña de administrador desde su perfil; otras sesiones cerradas.');
            }
        });
    }
}
