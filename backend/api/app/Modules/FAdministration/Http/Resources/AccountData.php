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
            'given_names' => $user->given_names, 'family_names' => $user->family_names,
            'role' => ['code' => $role], 'version' => (int) $user->version,
            'permissions' => app(EffectivePermissions::class)->codes($user),
        ];
        if ($role === 'client') {
            // D-80: el distrito principal precarga la nueva solicitud; la dirección de referencia no se expone.
            $client = DB::table('client_profiles')->where('user_id', $user->id)->first(['client_type', 'district_id']);
            $data['client_profile'] = $client ? [
                'client_type' => $client->client_type, 'district_id' => $client->district_id === null ? null : (int) $client->district_id,
            ] : null;
        }
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
