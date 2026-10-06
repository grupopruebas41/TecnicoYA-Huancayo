<?php

namespace App\Shared\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;

final class EffectivePermissions
{
    public function accountEnabled(User $user): bool
    {
        return DB::table('users')->join('roles', 'roles.id', '=', 'users.role_id')
            ->where('users.id', $user->id)->where('users.is_active', true)
            ->whereNull('users.anonymized_at')->where('roles.active', true)->exists();
    }

    public function codes(User $user): array
    {
        if (! $this->accountEnabled($user)) {
            return [];
        }
        $role = DB::table('users')->join('roles', 'roles.id', '=', 'users.role_id')
            ->where('users.id', $user->id)->first(['roles.id', 'roles.code']);
        $codes = DB::table('role_permissions')->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_id', $role->id)->pluck('permissions.code');

        // T05: concesiones individuales administrativas; no escalamiento público.
        if ($role->code === 'admin') {
            $codes = $codes->merge(DB::table('user_permissions')
                ->join('permissions', 'permissions.id', '=', 'user_permissions.permission_id')
                ->where('user_id', $user->id)->pluck('permissions.code'));
        }

        return $codes->unique()->sort()->values()->all();
    }

    public function allows(User $user, string $permission): bool
    {
        return in_array($permission, $this->codes($user), true);
    }
}
