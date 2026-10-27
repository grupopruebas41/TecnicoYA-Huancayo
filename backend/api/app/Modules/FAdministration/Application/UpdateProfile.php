<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final class UpdateProfile
{
    public function execute(User $actor, array $data): User
    {
        return DB::transaction(function () use ($actor, $data) {
            // La identidad viene de la sesión. Nunca se acepta user_id desde el formulario.
            $user = User::query()->lockForUpdate()->findOrFail($actor->id);
            abort_unless($user->is_active, 403, __('api.forbidden'));
            abort_unless($user->version === (int) $data['expected_version'], 409, __('api.stale_version'));

            foreach (['name', 'phone', 'given_names', 'family_names', 'theme_preference', 'avatar_media_id'] as $field) {
                if (array_key_exists($field, $data)) {
                    $user->setAttribute($field, $data[$field]);
                }
            }
            // D-75: con nombres y apellidos, name es el nombre para mostrar.
            if (array_key_exists('given_names', $data)) {
                $user->name = trim($data['given_names'].' '.$data['family_names']);
            }
            // D-91 (PERFIL-02): distrito principal y dirección de referencia del cliente, con la versión del usuario.
            $client = array_intersect_key(['district_id' => 'district_id', 'reference_address' => 'default_address'], $data);
            if ($client !== []) {
                $profile = DB::table('client_profiles')->where('user_id', $user->id)->lockForUpdate()->first();
                DB::table('client_profiles')->where('id', $profile->id)->update(array_combine(array_values($client),
                    array_map(fn (string $field) => $data[$field], array_keys($client))) + ['version' => $profile->version + 1, 'updated_at' => now()]);
            }
            $user->version++;
            $user->save();

            return $user;
        });
    }
}
