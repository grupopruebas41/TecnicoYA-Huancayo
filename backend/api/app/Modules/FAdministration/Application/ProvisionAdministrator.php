<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ProvisionAdministrator
{
    public function execute(string $email, string $name, string $password): User
    {
        return DB::transaction(function () use ($email, $name, $password) {
            $role = DB::table('roles')->where('code', 'admin')->where('active', 1)->first();
            if (! $role || User::query()->where('email', $email)->exists()) {
                throw new AdministratorProvisioningRefused('Autorización no disponible o cuenta ya existente.');
            }
            $user = new User;
            $user->forceFill([
                'name' => $name, 'email' => $email, 'password' => $password,
                'role_id' => $role->id, 'is_active' => true,
            ])->save();
            DB::table('audit_entries')->insert([
                'actor_kind' => 'system', 'action' => 'administrator.provisioned',
                'subject_type' => 'user', 'subject_id' => $user->id,
                'reason' => 'Alta administrativa autorizada mediante consola del servidor.',
                'after_values' => json_encode(['role_id' => $role->id], JSON_THROW_ON_ERROR),
                'correlation_id' => (string) Str::uuid(), 'occurred_at' => now(),
                'source_code' => 'tecnicoya:provision-admin',
            ]);

            return $user;
        });
    }
}
