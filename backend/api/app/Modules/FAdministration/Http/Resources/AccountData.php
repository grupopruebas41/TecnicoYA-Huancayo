<?php

namespace App\Modules\FAdministration\Http\Resources;

use App\Models\User;
use App\Shared\Auth\EffectivePermissions;
use Illuminate\Support\Facades\DB;

final class AccountData
{
    public static function from(User $user): array
    {
        $role = DB::table('roles')->where('id', $user->role_id)->value('code');
        $data = [
            'id' => (string) $user->id, 'name' => $user->name, 'phone' => $user->phone,
            'role' => ['code' => $role], 'version' => (int) $user->version,
            'permissions' => app(EffectivePermissions::class)->codes($user),
        ];
        if ($role === 'technician') {
            $profile = DB::table('technician_profiles')->where('user_id', $user->id)
                ->first(['status', 'verification_status', 'available_now']);
            $data['technician_profile'] = $profile ? [
                'status' => $profile->status, 'verification_status' => $profile->verification_status,
                'available_now' => (bool) $profile->available_now,
            ] : null;
        }

        return $data;
    }
}
