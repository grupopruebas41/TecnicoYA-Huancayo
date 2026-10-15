<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Datos E2E del Sprint 3 (contrato S3 §7). Sprint02E2ESeeder deja las cuentas de S1 y S2 (e2e-client sin solicitudes
 * y e2e-technician-active con Reparación de hardware en Huancayo y portafolio). Aquí se agregan, de forma idempotente:
 * - e2e-client-limit@example.test con 3 solicitudes enviadas (S03-TC-068);
 * - e2e-client-mixed@example.test con una registrada y una enviada (S03-TC-067);
 * - e2e-technician-frio@example.test: activo en Refrigeración doméstica y El Tambo, con WhatsApp y documento (S03-TC-065);
 * - e2e-technician-paused@example.test: activo pero con pausa vigente, fuera de la búsqueda (D-57);
 * - tarifa referencial en dos subcategorías por rubro.
 * Todas las cuentas usan TECNICOYA_E2E_PASSWORD. Datos sintéticos.
 */
final class Sprint03E2ESeeder extends Seeder
{
    private const FEES = ['computo-hardware' => '80.00', 'computo-mantenimiento' => '60.00', 'frio-domestico' => '90.00', 'frio-vitrinas' => '120.00'];

    public function run(): void
    {
        $this->call(Sprint02E2ESeeder::class);
        DB::transaction(function () {
            foreach (self::FEES as $code => $fee) {
                DB::table('subcategories')->where('code', $code)->update(['reference_fee' => $fee]);
            }
            $huancayo = (int) DB::table('districts')->where('code', 'HUANCAYO')->value('id');
            $tambo = (int) DB::table('districts')->where('code', 'EL-TAMBO')->value('id');

            $frio = $this->technician('frio', 'Técnico E2E de refrigeración', '+51900000098');
            $this->offer($frio, 'frio-domestico', $tambo);
            if (! DB::table('technician_documents')->where('technician_id', $frio->id)->exists()) {
                DB::table('technician_documents')->insert([
                    'technician_id' => $frio->id, 'media_id' => $this->document($frio->user_id), 'document_type' => 'Certificado técnico',
                    'review_status' => 'approved',
                ]);
            }

            $paused = $this->technician('paused', 'Técnico E2E en pausa', null);
            $this->offer($paused, 'computo-hardware', $huancayo);
            DB::table('technician_pauses')->updateOrInsert(['technician_id' => $paused->id],
                ['starts_at' => now()->subHour(), 'ends_at' => null, 'cancelled_at' => null, 'reason' => 'Pausa sintética E2E']);

            $this->client('limit', ['sent', 'sent', 'sent'], $huancayo);
            $this->client('mixed', ['registered', 'sent'], $huancayo);
        });
    }

    private function technician(string $suffix, string $name, ?string $whatsapp): object
    {
        $user = User::firstOrNew(['email' => "e2e-technician-$suffix@example.test"]);
        $user->forceFill([
            'name' => $name, 'phone' => '900000097', 'is_active' => true,
            'role_id' => DB::table('roles')->where('code', 'technician')->value('id'),
            'password' => env('TECNICOYA_E2E_PASSWORD'),
        ])->save();
        DB::table('technician_profiles')->updateOrInsert(['user_id' => $user->id], [
            'display_name' => $name, 'bio' => 'Perfil sintético para las pruebas E2E.', 'status' => 'active',
            'verification_status' => 'approved', 'experience_years' => 7, 'whatsapp' => $whatsapp, 'version' => 1,
            'verified_at' => now(), 'updated_at' => now(),
        ]);

        return DB::table('technician_profiles')->where('user_id', $user->id)->first();
    }

    private function offer(object $technician, string $subcategoryCode, int $district): void
    {
        $subcategory = (int) DB::table('subcategories')->where('code', $subcategoryCode)->value('id');
        if (! DB::table('technician_services')->where('technician_id', $technician->id)->exists()) {
            $service = DB::table('technician_services')->insertGetId([
                'technician_id' => $technician->id, 'subcategory_id' => $subcategory, 'reference_fee' => '70.00',
            ]);
            DB::table('service_rate_versions')->insert([
                'technician_service_id' => $service, 'version_no' => 1, 'reference_fee' => '70.00', 'currency' => 'PEN',
                'changed_by' => $technician->user_id, 'effective_from' => now(),
            ]);
        }
        DB::table('technician_districts')->updateOrInsert(['technician_id' => $technician->id, 'district_id' => $district], ['active' => 1]);
    }

    /** Cliente con solicitudes en los estados indicados; no se duplican al volver a sembrar. */
    private function client(string $suffix, array $statuses, int $district): void
    {
        $user = User::firstOrNew(['email' => "e2e-client-$suffix@example.test"]);
        $user->forceFill([
            'name' => "Cliente E2E $suffix", 'is_active' => true,
            'role_id' => DB::table('roles')->where('code', 'client')->value('id'),
            'password' => env('TECNICOYA_E2E_PASSWORD'),
        ])->save();
        DB::table('client_profiles')->updateOrInsert(['user_id' => $user->id], ['client_type' => 'household', 'updated_at' => now()]);
        $clientId = (int) DB::table('client_profiles')->where('user_id', $user->id)->value('id');
        if (DB::table('service_requests')->where('client_id', $clientId)->exists()) {
            return;
        }
        $subcategory = DB::table('subcategories')->where('code', 'computo-hardware')->first(['id', 'reference_fee']);
        $ruleVersion = DB::table('rule_versions')->where('version_no', 1)->value('id');
        foreach ($statuses as $index => $status) {
            $sent = $status === 'sent';
            $id = DB::table('service_requests')->insertGetId([
                'client_id' => $clientId, 'subcategory_id' => $subcategory->id, 'district_id' => $district,
                'description' => 'Solicitud sintética E2E número '.($index + 1).' con detalle suficiente.',
                'address' => 'Calle sintética E2E '.($index + 1), 'mode' => 'asap', 'source' => 'automatic', 'status' => $status,
                'reference_fee_snapshot' => $subcategory->reference_fee, 'submitted_at' => $sent ? now() : null,
                'rule_version_id' => $sent ? $ruleVersion : null, 'version' => $sent ? 2 : 1,
            ]);
            DB::table('request_events')->insert([
                'request_id' => $id, 'actor_id' => $user->id, 'event_type' => $sent ? 'request.submitted' : 'request.registered',
                'from_status' => $sent ? 'registered' : null, 'to_status' => $status, 'summary' => 'Dato sintético E2E.',
                'occurred_at' => now(), 'correlation_id' => 'e2e-s03', 'request_version' => $sent ? 2 : 1,
            ]);
        }
    }

    private function document(int $ownerId): int
    {
        $content = file_get_contents(base_path('tests/fixtures/sprint02/documento.pdf'));
        $key = 'media/e2e-s03-documento-frio.pdf';
        Storage::disk('local')->put($key, $content);
        DB::table('media_files')->updateOrInsert(['disk' => 'local', 'storage_key' => $key], [
            'owner_id' => $ownerId, 'original_name' => 'e2e-s03-documento-frio.pdf', 'mime_type' => 'application/pdf',
            'byte_size' => strlen($content), 'sha256' => hash('sha256', $content), 'visibility' => 'private',
            'scan_status' => 'clean', 'purpose' => 'document',
        ]);

        return (int) DB::table('media_files')->where('storage_key', $key)->value('id');
    }
}
