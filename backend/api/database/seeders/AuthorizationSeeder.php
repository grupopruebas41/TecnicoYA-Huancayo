<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthorizationSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            foreach (['client' => 'Cliente', 'technician' => 'Especialista técnico', 'admin' => 'Administrador'] as $code => $name) {
                if (! DB::table('roles')->where('code', $code)->exists()) {
                    DB::table('roles')->insert(['code' => $code, 'name' => $name]);
                }
            }

            // Solo se siembra el permiso aprobado para S1, sin cuentas ni claves iniciales.
            if (! DB::table('permissions')->where('code', 'catalog.manage')->exists()) {
                DB::table('permissions')->insert([
                    'code' => 'catalog.manage', 'description' => 'Administrar el catálogo de servicios',
                ]);
                $adminId = DB::table('roles')->where('code', 'admin')->value('id');
                $permissionId = DB::table('permissions')->where('code', 'catalog.manage')->value('id');
                DB::table('role_permissions')->insert(['role_id' => $adminId, 'permission_id' => $permissionId]);
                $this->audit('authorization.seed', 'role', $adminId, ['permission' => 'catalog.manage']);
            }

            // La transición conserva users.role y nunca sustituye un role_id ya asignado.
            foreach (DB::table('roles')->get(['id', 'code']) as $role) {
                $users = DB::table('users')->whereNull('role_id')->where('role', $role->code)->lockForUpdate()->get(['id']);
                foreach ($users as $user) {
                    DB::table('users')->where('id', $user->id)->update(['role_id' => $role->id]);
                    $this->audit('authorization.backfill', 'user', $user->id, ['role_id' => $role->id]);
                }
            }
        });
    }

    private function audit(string $action, string $subject, int $id, array $values): void
    {
        DB::table('audit_entries')->insert([
            'actor_kind' => 'system', 'action' => $action, 'subject_type' => $subject,
            'subject_id' => $id, 'reason' => 'Inicialización y transición de autorización del Sprint 1',
            'after_values' => json_encode($values, JSON_THROW_ON_ERROR),
            'correlation_id' => (string) Str::uuid(), 'occurred_at' => now(),
            'source_code' => 'AuthorizationSeeder',
        ]);
    }
}
