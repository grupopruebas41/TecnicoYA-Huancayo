<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

final class Sprint01E2ESeeder extends Seeder
{
    public function run(): void
    {
        $connection = config('database.connections.mysql');
        if (!app()->environment('testing') || config('database.default') !== 'mysql'
            || $connection['host'] !== 'mysql-test'
            || $connection['database'] !== 'tecnicoya_test'
            || $connection['username'] !== 'tecnicoya_test') {
            throw new RuntimeException('Fixtures E2E permitidos solo en la base aislada.');
        }
        $password = env('TECNICOYA_E2E_PASSWORD');
        if (!is_string($password) || strlen($password) < 24) {
            throw new RuntimeException('Configurar una contraseña sintética de prueba.');
        }
        $this->call([AuthorizationSeeder::class, CatalogSeeder::class]);
        DB::transaction(function () use ($password) {
            foreach (['client', 'technician', 'admin'] as $code) {
                $roleId = DB::table('roles')->where('code', $code)->sole()->id;
                $user = User::query()->updateOrCreate(['email' => "e2e-{$code}@example.test"], [
                    'role_id' => $roleId, 'name' => "E2E {$code}",
                    'password' => Hash::make($password), 'is_active' => true,
                ]);
                if ($code === 'client') {
                    DB::table('client_profiles')->updateOrInsert(['user_id' => $user->id], [
                        'client_type' => 'household', 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
                if ($code === 'technician') {
                    DB::table('technician_profiles')->updateOrInsert(['user_id' => $user->id], [
                        'display_name' => 'Técnico E2E', 'status' => 'pending_verification',
                        'verification_status' => 'pending', 'available_now' => false,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
        });
    }
}
