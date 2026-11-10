<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * Fase T1 del panel del técnico: «Cerrar las otras sesiones» desde Seguridad, para los tres roles. Conserva la sesión
 * actual, borra las demás y sube auth_version (como el cambio de contraseña). Se audita sin datos de la sesión.
 */
final class RevokeOtherSessions
{
    public function __construct(private readonly AuditTrail $audit) {}

    public function execute(User $actor, ?string $currentSessionId): int
    {
        return DB::transaction(function () use ($actor, $currentSessionId) {
            $user = User::query()->lockForUpdate()->findOrFail($actor->id);
            $closed = DB::table('sessions')->where('user_id', $user->id)
                ->when($currentSessionId, fn ($query) => $query->where('id', '!=', $currentSessionId))->delete();
            $user->forceFill(['auth_version' => $user->auth_version + 1])->save();
            $this->audit->record($user, 'auth.sessions_revoked', null, 'user', $user->id,
                'Cierre de las otras sesiones desde Seguridad.', [], ['closed' => $closed]);

            return $closed;
        });
    }
}
