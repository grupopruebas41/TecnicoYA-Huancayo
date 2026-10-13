<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Perfil técnico del usuario de la sesión, bloqueado y con control de versión. Nunca desde un id enviado. */
final class OwnTechnicianProfile
{
    public function lockFor(User $user, ?int $expectedVersion = null): object
    {
        $profile = DB::table('technician_profiles')->where('user_id', $user->id)->lockForUpdate()->first();
        abort_unless($profile, 403, __('api.forbidden'));
        if ($expectedVersion !== null) {
            abort_unless((int) $profile->version === $expectedVersion, 409);
        }

        return $profile;
    }

    /** Id del perfil técnico de la sesión, solo para lectura. */
    public function idFor(User $user): int
    {
        $id = DB::table('technician_profiles')->where('user_id', $user->id)->value('id');
        abort_unless($id, 403, __('api.forbidden'));

        return (int) $id;
    }

    public function bumpVersion(object $profile): int
    {
        $next = (int) $profile->version + 1;
        DB::table('technician_profiles')->where('id', $profile->id)->update(['version' => $next, 'updated_at' => now()]);

        return $next;
    }
}
