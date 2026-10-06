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

            foreach (['name', 'phone'] as $field) {
                if (array_key_exists($field, $data)) {
                    $user->setAttribute($field, $data[$field]);
                }
            }
            $user->version++;
            $user->save();

            return $user;
        });
    }
}
