<?php

namespace App\Modules\BMatching\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Perfil técnico de la sesión para las rutas de ofertas. Un técnico suspendido no responde ni ve ofertas (D-32). */
final class OwnTechnician
{
    public function idFor(User $user): int
    {
        $profile = DB::table('technician_profiles')->where('user_id', $user->id)->first(['id', 'status']);
        abort_unless($profile && $profile->status !== 'suspended', 403);

        return (int) $profile->id;
    }
}
