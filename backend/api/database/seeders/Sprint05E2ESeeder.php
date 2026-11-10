<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Datos E2E del adelanto del Sprint 5 (panel del cliente). Sobre los del Sprint 4 (e2e-client no tiene solicitudes y
 * e2e-client-limit tiene 3 activas, que cuentan como 3 pedidos, D-95) deja, para la Fase 3 (D-101):
 * - e2e-technician-perfil: «Técnica E2E de perfil completo», Refrigeración comercial (vitrinas), con forma de trabajo,
 *   garantía, «qué incluye», disponibilidad todo el día, dos trabajos publicados sin fotos y 5 reseñas de ejemplo.
 * - e2e-demo-rosa y e2e-demo-diego: Rosa Quispe y Diego Huamán, con la misma ficha del DemoSeeder
 *   (DemoTechnicianProfiles), para las capturas y para probar el perfil con datos completos.
 * Cada siembra devuelve «qué incluye» a su texto original (S05-TC-214 lo cambia). Datos sintéticos.
 */
final class Sprint05E2ESeeder extends Seeder
{
    public const INCLUDES = 'Revisión de temperatura y limpieza del condensador.';

    public function run(): void
    {
        E2EDatabaseGuard::ensureIsolated();
        $this->call(Sprint04E2ESeeder::class);
        DB::transaction(function () {
            $this->profileTechnician();
            $this->demoTechnicians();
            $this->premiumClient();
        });
    }

    /**
     * Fase 6 (D-98, D-99): e2e-client-premium, una bodega sintética con plan Premium, equipos y sensores simulados (los
     * mismos datos que demo-mype en el DemoSeeder). La bienvenida y el tutorial ya están vistos.
     */
    private function premiumClient(): void
    {
        $district = (int) DB::table('districts')->where('code', 'EL-TAMBO')->value('id');
        $user = User::firstOrNew(['email' => 'e2e-client-premium@example.test']);
        $user->forceFill(['name' => 'Bodega E2E Premium', 'given_names' => 'Bodega', 'family_names' => 'E2E Premium', 'phone' => '900000099',
            'is_active' => true, 'role_id' => DB::table('roles')->where('code', 'client')->value('id'), 'theme_preference' => 'light',
            'password' => env('TECNICOYA_E2E_PASSWORD'), 'email_verified_at' => $user->email_verified_at ?? now()])->save();
        DB::table('client_profiles')->updateOrInsert(['user_id' => $user->id], ['client_type' => 'mype', 'business_name' => 'Bodega E2E S. A. C.',
            'district_id' => $district, 'default_address' => 'Av. Sintética 742, El Tambo', 'onboarding_completed_at' => now(),
            'tour_completed_at' => now(), 'updated_at' => now()]);
        app(DemoPremium::class)->run($user->id, (int) DB::table('client_profiles')->where('user_id', $user->id)->value('id'), $district);
    }

    /** D-101: los dos técnicos de demostración, con cuentas E2E (la contraseña es TECNICOYA_E2E_PASSWORD). */
    private function demoTechnicians(): void
    {
        $builder = app(DemoSeeder::class);
        foreach (['refrigeracion' => 'rosa', 'computo' => 'diego'] as $code => $alias) {
            $data = DemoTechnicianProfiles::PROFILES[$code];
            $user = User::firstOrNew(['email' => "e2e-demo-$alias@example.test"]);
            $user->forceFill([
                'name' => $data['name'], 'given_names' => $data['given'], 'family_names' => $data['family'], 'phone' => '900000098',
                'is_active' => true, 'role_id' => DB::table('roles')->where('code', 'technician')->value('id'),
                'password' => env('TECNICOYA_E2E_PASSWORD'), 'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
            $builder->technician($user, $data, 'active', 'approved');
            $technician = (int) DB::table('technician_profiles')->where('user_id', $user->id)->value('id');
            $builder->portfolio($technician, $user->id, "demo-tecnico-$code", $data['portfolio']);
            $builder->reviews($technician, $data['reviews']);
        }
    }

    private function profileTechnician(): void
    {
        $district = (int) DB::table('districts')->where('code', 'HUANCAYO')->value('id');
        $user = User::firstOrNew(['email' => 'e2e-technician-perfil@example.test']);
        $user->forceFill([
            'name' => 'Técnica E2E de perfil completo', 'phone' => '900000097', 'is_active' => true,
            'role_id' => DB::table('roles')->where('code', 'technician')->value('id'), 'password' => env('TECNICOYA_E2E_PASSWORD'),
        ])->save();
        DB::table('technician_profiles')->updateOrInsert(['user_id' => $user->id], [
            'display_name' => 'Técnica E2E de perfil completo', 'bio' => 'Perfil sintético con todas las secciones para las pruebas E2E.',
            'work_style' => 'Diagnóstico antes de cotizar.', 'warranty_text' => 'Garantía sintética de 30 días.',
            'status' => 'active', 'verification_status' => 'approved', 'experience_years' => 8, 'verified_at' => now()->subMonth(),
            'base_district_id' => $district, 'updated_at' => now(),
        ]);
        $technician = (int) DB::table('technician_profiles')->where('user_id', $user->id)->value('id');
        $subcategory = (int) DB::table('subcategories')->where('code', 'frio-vitrinas')->value('id');
        if (! DB::table('technician_services')->where('technician_id', $technician)->where('subcategory_id', $subcategory)->exists()) {
            $service = DB::table('technician_services')->insertGetId(['technician_id' => $technician, 'subcategory_id' => $subcategory,
                'reference_fee' => '110.00', 'experience_years' => 8]);
            DB::table('service_rate_versions')->insert(['technician_service_id' => $service, 'version_no' => 1, 'reference_fee' => '110.00',
                'currency' => 'PEN', 'changed_by' => $user->id, 'effective_from' => now()]);
        }
        DB::table('technician_services')->where('technician_id', $technician)->update(['active' => 1, 'includes' => self::INCLUDES]);
        DB::table('technician_districts')->updateOrInsert(['technician_id' => $technician, 'district_id' => $district], ['active' => 1]);
        DB::table('technician_pauses')->where('technician_id', $technician)->whereNull('cancelled_at')->update(['cancelled_at' => now()]);
        if (! DB::table('availability_slots')->where('technician_id', $technician)->exists()) {
            foreach (range(1, 7) as $weekday) {
                DB::table('availability_slots')->insert(['technician_id' => $technician, 'kind' => 'weekly', 'weekday' => $weekday,
                    'local_start' => '00:00:00', 'local_end' => '23:59:59', 'valid_from' => '2026-01-01', 'timezone' => 'America/Lima']);
            }
        }
        foreach (['Vitrina sintética recuperada', 'Cámara sintética revisada'] as $index => $title) {
            if (! DB::table('portfolio_items')->where('technician_id', $technician)->where('title', $title)->exists()) {
                DB::table('portfolio_items')->insert(['technician_id' => $technician, 'subcategory_id' => $subcategory, 'title' => $title,
                    'description' => 'Trabajo sintético para las pruebas E2E.', 'performed_on' => now()->subDays(10 + $index)->toDateString(),
                    'status' => 'published']);
            }
        }
        if (! DB::table('technician_review_samples')->where('technician_id', $technician)->exists()) {
            foreach ([5, 5, 4, 4, 5] as $index => $rating) {
                DB::table('technician_review_samples')->insert(['technician_id' => $technician, 'rating' => $rating,
                    'comment' => 'Reseña sintética de ejemplo número '.($index + 1).'.', 'author_label' => 'Cliente sintético',
                    'reviewed_on' => now()->subDays($index + 1)->toDateString()]);
            }
        }
    }
}
