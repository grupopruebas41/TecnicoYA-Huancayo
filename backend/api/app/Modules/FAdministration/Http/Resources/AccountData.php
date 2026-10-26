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
                ->first(['id', 'status', 'verification_status', 'available_now']);
            $data['technician_profile'] = $profile ? [
                'status' => $profile->status, 'verification_status' => $profile->verification_status,
                'available_now' => (bool) $profile->available_now,
                // D-80: rubros declarados en el registro; la tarifa se carga en «Servicios y tarifas».
                'declared_subcategories' => DB::table('technician_declared_subcategories as d')
                    ->join('subcategories as s', 's.id', '=', 'd.subcategory_id')->where('d.technician_id', $profile->id)
                    ->orderBy('s.display_order')->orderBy('s.id')->get(['s.id', 's.name', 's.specialty_id'])
                    ->map(fn ($row) => ['id' => (int) $row->id, 'name' => $row->name, 'specialty_id' => (int) $row->specialty_id])->all(),
            ] : null;
        }

        return $data;
    }
}
