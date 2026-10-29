<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class Sprint01E2ESeeder extends Seeder
{
    public function run(): void
    {
        E2EDatabaseGuard::ensureIsolated();
        $password = env('TECNICOYA_E2E_PASSWORD');
        if (!is_string($password) || strlen($password) < 24) {
            throw new SeedingRefused('Configurar una contraseña sintética de prueba.');
        }
        // D-80: el registro detallado de las Cypress del S1 necesita distritos activos.
        // D-94: también el diccionario del buscador «¿Qué se malogró?».
        $this->call([AuthorizationSeeder::class, CatalogSeeder::class, DistrictSeeder::class, KeywordSeeder::class]);
        DB::transaction(function () use ($password) {
            foreach (['client', 'technician', 'admin'] as $code) {
                $user = User::firstOrNew(['email' => "e2e-{$code}@example.test"]);
                $user->forceFill([
                    'name' => "E2E {$code}", 'role_id' => DB::table('roles')->where('code', $code)->sole()->id,
                    'password' => $password, 'is_active' => true,
                ])->save();
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
