<?php

namespace Database\Seeders;

use App\Models\User;
use App\Shared\Rules\RuleBook;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Datos E2E del adelanto del Sprint 7, panel del administrador (PLAN-PANEL-ADMIN.md). Sobre los del Sprint 5 deja:
 * - e2e-admin-nuevo (Fase A1): administrador que vuelve a su primera visita en cada siembra (bienvenida y tutorial, D-117).
 * - e2e-client-alertas (Fase A1): cliente con una solicitud enviada hace 45 minutos y sin técnico, que cuenta como
 *   «Solicitud sin técnico» y como alerta operativa (más de 30 minutos, D-118). No pasa por el matching al sembrarse.
 * - e2e-client-intervencion (Fase A3): cliente con una solicitud enviada hace 10 minutos, para cancelarla con motivo.
 * e2e-admin (S1) sigue con la bienvenida vista (E2EFirstVisits). Datos sintéticos; la contraseña es TECNICOYA_E2E_PASSWORD.
 */
final class Sprint07E2ESeeder extends Seeder
{
    public function run(RuleBook $rules): void
    {
        E2EDatabaseGuard::ensureIsolated();
        $this->call(Sprint05E2ESeeder::class);
        DB::transaction(function () use ($rules) {
            $this->newAdmin();
            $this->sentRequest('e2e-client-alertas', 'Cliente E2E alertas', 45, 'Solicitud sintética E2E del Sprint 7 sin técnico asignado.', $rules);
            $this->sentRequest('e2e-client-intervencion', 'Cliente E2E intervención', 10, 'Solicitud sintética E2E del Sprint 7 para cancelar.', $rules);
        });
    }

    private function newAdmin(): void
    {
        $user = User::firstOrNew(['email' => 'e2e-admin-nuevo@example.test']);
        $user->forceFill([
            'name' => 'Administración E2E nueva', 'given_names' => 'Administración', 'family_names' => 'E2E nueva', 'phone' => '900000095',
            'role_id' => DB::table('roles')->where('code', 'admin')->value('id'), 'password' => env('TECNICOYA_E2E_PASSWORD'),
            'is_active' => true, 'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();
        app(DemoSeeder::class)->firstVisit($user->id, true);
        // Tema claro fijo, como el resto de las cuentas E2E: las Cypress no dependen del tema del sistema.
        DB::table('users')->where('id', $user->id)->update(['theme_preference' => 'light']);
    }

    /**
     * Cliente de Chilca con una sola solicitud enviada hace $minutes minutos. Cada siembra borra lo anterior del cliente con
     * la limpieza completa del S4 (ofertas, rondas, avisos y eventos que hayan creado las Cypress, como el reenvío).
     */
    private function sentRequest(string $alias, string $name, int $minutes, string $description, RuleBook $rules): void
    {
        $user = User::firstOrNew(['email' => "$alias@example.test"]);
        $user->forceFill([
            'name' => $name, 'is_active' => true, 'role_id' => DB::table('roles')->where('code', 'client')->value('id'),
            'password' => env('TECNICOYA_E2E_PASSWORD'), 'onboarding_completed_at' => now(), 'tour_completed_at' => now(),
        ])->save();
        $district = (int) DB::table('districts')->where('code', 'CHILCA')->value('id');
        DB::table('client_profiles')->updateOrInsert(['user_id' => $user->id], ['client_type' => 'household', 'district_id' => $district,
            'updated_at' => now()]);
        $clientId = (int) DB::table('client_profiles')->where('user_id', $user->id)->value('id');
        app(Sprint04E2ESeeder::class)->reset([$clientId]);
        $subcategory = DB::table('subcategories')->where('code', 'electricidad-tableros')->first(['id', 'reference_fee']);
        DB::table('service_requests')->insert([
            'client_id' => $clientId, 'subcategory_id' => $subcategory->id, 'district_id' => $district,
            'description' => $description, 'address' => 'Avenida sintética E2E 707',
            'mode' => 'asap', 'source' => 'automatic', 'status' => 'sent', 'reference_fee_snapshot' => $subcategory->reference_fee,
            'rule_version_id' => $rules->currentVersionId(), 'submitted_at' => now()->subMinutes($minutes), 'search_generation' => 1, 'version' => 2,
        ]);
        // DEF-85: registrada y enviada en la línea de tiempo, como las crea el flujo real (S07-TC-237).
        app(DemoTimeline::class)->backfill([$clientId]);
    }
}
