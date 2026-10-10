<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Datos E2E del Sprint 2 (contrato S2 §10). Sprint01E2ESeeder aplica la guarda de base aislada y crea las cuentas
 * e2e-client, e2e-technician (pendiente e incompleto) y e2e-admin. Aquí se agregan, de forma idempotente:
 * - e2e-technician-ready@example.test: pendiente con la checklist completa (para aprobar o rechazar);
 * - e2e-technician-active@example.test: activo, con servicio, franja, zona y un trabajo publicado;
 * - distritos semilla, un comunicado publicado y un borrador, y una subcategoría con foto para el carrusel.
 * Todas las cuentas usan TECNICOYA_E2E_PASSWORD. Datos sintéticos.
 */
final class Sprint02E2ESeeder extends Seeder
{
    public function run(): void
    {
        $this->call([Sprint01E2ESeeder::class, DistrictSeeder::class]);
        DB::transaction(function () {
            $admin = User::query()->where('email', 'e2e-admin@example.test')->sole();
            $district = (int) DB::table('districts')->where('code', 'HUANCAYO')->value('id');
            $subcategory = (int) DB::table('subcategories')->where('code', 'computo-hardware')->value('id');

            DB::table('subcategories')->where('id', $subcategory)
                ->update(['carousel_media_id' => $this->media($admin->id, 'e2e-s02-carrusel.png', 'catalog')]);

            $ready = $this->technician('ready', 'Técnico E2E listo', 'pending_verification', 'pending');
            $this->offer($ready, $subcategory, $district);
            DB::table('technician_documents')->updateOrInsert(
                ['media_id' => $this->media($ready->user_id, 'e2e-s02-documento.pdf', 'document')],
                ['technician_id' => $ready->id, 'document_type' => 'Certificado técnico', 'review_status' => 'pending'],
            );

            $active = $this->technician('active', 'Técnico E2E activo', 'active', 'approved');
            $this->offer($active, $subcategory, $district);
            if (! DB::table('portfolio_items')->where('technician_id', $active->id)->exists()) {
                $item = DB::table('portfolio_items')->insertGetId([
                    'technician_id' => $active->id, 'title' => 'Mantenimiento de equipo de prueba', 'status' => 'published',
                ]);
                DB::table('portfolio_images')->insert([
                    'portfolio_id' => $item, 'media_id' => $this->media($active->user_id, 'e2e-s02-trabajo.png', 'portfolio'), 'position' => 0,
                ]);
            }

            $this->announcement($admin->id, 'Aviso E2E publicado', 'published');
            $this->announcement($admin->id, 'Aviso E2E en borrador', 'draft');
        });
    }

    private function technician(string $suffix, string $name, string $status, string $verification): object
    {
        $user = User::firstOrNew(['email' => "e2e-technician-$suffix@example.test"]);
        $user->forceFill([
            'name' => $name, 'phone' => '900000099', 'is_active' => true,
            'role_id' => DB::table('roles')->where('code', 'technician')->value('id'),
            'password' => env('TECNICOYA_E2E_PASSWORD'),
        ])->save();
        DB::table('technician_profiles')->updateOrInsert(['user_id' => $user->id], [
            'display_name' => $name, 'status' => $status, 'verification_status' => $verification,
            'experience_years' => 5, 'available_now' => false, 'version' => 1, 'updated_at' => now(),
        ]);

        return DB::table('technician_profiles')->where('user_id', $user->id)->first();
    }

    /** Servicio con tarifa versión 1, franja de lunes y zona. */
    private function offer(object $technician, int $subcategory, int $district): void
    {
        if (! DB::table('technician_services')->where('technician_id', $technician->id)->exists()) {
            $service = DB::table('technician_services')->insertGetId([
                'technician_id' => $technician->id, 'subcategory_id' => $subcategory, 'reference_fee' => '50.00',
            ]);
            DB::table('service_rate_versions')->insert([
                'technician_service_id' => $service, 'version_no' => 1, 'reference_fee' => '50.00', 'currency' => 'PEN',
                'changed_by' => $technician->user_id, 'effective_from' => now(),
            ]);
            DB::table('availability_slots')->insert([
                'technician_id' => $technician->id, 'kind' => 'weekly', 'weekday' => 1, 'local_start' => '08:00',
                'local_end' => '12:00', 'valid_from' => now()->toDateString(), 'timezone' => 'America/Lima',
            ]);
        }
        DB::table('technician_districts')->updateOrInsert(['technician_id' => $technician->id, 'district_id' => $district], ['active' => 1]);
    }

    /** Archivo sintético en el disco del slot, con la misma forma que deja POST /media. */
    private function media(int $ownerId, string $name, string $purpose): int
    {
        $public = $purpose !== 'document';
        $source = $purpose === 'document' ? 'documento.pdf' : 'foto.png';
        $content = file_get_contents(base_path("tests/fixtures/sprint02/$source"));
        $key = "media/$name";
        Storage::disk($public ? 'public' : 'local')->put($key, $content);
        DB::table('media_files')->updateOrInsert(['disk' => $public ? 'public' : 'local', 'storage_key' => $key], [
            'owner_id' => $ownerId, 'original_name' => $name, 'mime_type' => $public ? 'image/png' : 'application/pdf',
            'byte_size' => strlen($content), 'sha256' => hash('sha256', $content), 'visibility' => $public ? 'public' : 'private',
            'scan_status' => 'clean', 'purpose' => $purpose,
        ]);

        return (int) DB::table('media_files')->where('storage_key', $key)->value('id');
    }

    private function announcement(int $adminId, string $title, string $status): void
    {
        if (DB::table('announcements')->where('title', $title)->exists()) {
            return;
        }
        $id = (string) Str::uuid();
        DB::table('announcements')->insert([
            'id' => $id, 'title' => $title, 'body' => 'Comunicado sintético para las pruebas E2E.', 'audience' => 'both',
            'status' => $status, 'starts_at' => now()->subHour(), 'ends_at' => now()->addDays(7), 'duration_days' => 7,
            'created_by' => $adminId, 'updated_by' => $adminId, 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (DB::table('roles')->whereIn('code', ['client', 'technician'])->pluck('id') as $roleId) {
            DB::table('announcement_audiences')->insert(['announcement_id' => $id, 'role_id' => $roleId]);
        }
    }
}
