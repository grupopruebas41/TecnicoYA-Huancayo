<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RegisterAccount
{
    public function execute(array $data): User
    {
        try {
            return DB::transaction(function () use ($data) {
                $role = DB::table('roles')->where('code', $data['account_type'])->where('active', 1)->first();
                abort_unless($role, 503, __('api.authorization_unavailable'));

                $user = new User;
                $user->forceFill([
                    'name' => $data['name'], 'email' => $data['email'], 'password' => $data['password'],
                    'role_id' => $role->id, 'is_active' => true,
                ])->save();

                if ($data['account_type'] === 'client') {
                    DB::table('client_profiles')->insert(['user_id' => $user->id, 'client_type' => $data['client_type']]);
                } else {
                    DB::table('technician_profiles')->insert([
                        'user_id' => $user->id, 'display_name' => $data['name'],
                        'status' => 'pending_verification', 'verification_status' => 'pending', 'available_now' => false,
                    ]);
                }

                return $user->refresh();
            });
        } catch (UniqueConstraintViolationException $error) {
            // Una carrera por el mismo correo también devuelve validación, no una traza SQL.
            if (User::query()->where('email', $data['email'])->exists()) {
                throw ValidationException::withMessages(['email' => __('validation.unique', ['attribute' => 'correo'])]);
            }
            throw $error;
        }
    }
}
