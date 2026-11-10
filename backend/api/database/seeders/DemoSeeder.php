<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Datos de demostración SOLO para desarrollo (`APP_ENV=local`):
 * `TECNICOYA_DEMO_PASSWORD=… php artisan db:seed --class=DemoSeeder`.
 * - Llama a DatabaseSeeder (permisos, catálogo y distritos).
 * - Cuentas sintéticas @example.test (administrador, dos clientes, tres técnicos verificados y uno pendiente). Todas
 *   usan la contraseña de TECNICOYA_DEMO_PASSWORD, que nunca se versiona.
 * - Foto de cada subcategoría sin foto, tomada de frontend/web/public/media/services/subcategorias; las que el
 *   administrador ya eligió no se tocan.
 * - Tres comunicados publicados con imagen principal y móvil (D-83), recortadas de esas fotos.
 * - Fase 3 (D-101): Rosa Quispe (refrigeración) y Diego Huamán (cómputo) con perfil completo, servicios con «qué incluye»,
 *   disponibilidad, distritos, portafolio y 5 reseñas de ejemplo (DemoTechnicianProfiles). Las fotos del portafolio solo
 *   se usan si existen en database/seeders/demo-media/.
 * Es idempotente: repetirlo no duplica cuentas, archivos, servicios ni comunicados.
 */
final class DemoSeeder extends Seeder
{
    public const PASSWORD_VARIABLE = 'TECNICOYA_DEMO_PASSWORD';

    public const MIN_PASSWORD_LENGTH = 12;

    private const PHOTOS = 'frontend/web/public/media/services/subcategorias';

    private const TECHNICIANS = [
        'computo' => ['name' => 'Técnico Demo Cómputo', 'base' => 'HUANCAYO', 'districts' => ['HUANCAYO', 'EL-TAMBO', 'CHILCA'],
            'services' => ['computo-hardware' => '60.00', 'computo-redes' => '80.00', 'computo-software' => '50.00']],
        'refrigeracion' => ['name' => 'Técnica Demo Refrigeración', 'base' => 'EL-TAMBO', 'districts' => ['EL-TAMBO', 'HUANCAYO'],
            'services' => ['frio-vitrinas' => '120.00', 'frio-mantenimiento' => '90.00']],
        'electricidad' => ['name' => 'Técnico Demo Electricidad', 'base' => 'CHILCA', 'districts' => ['CHILCA', 'HUANCAYO'],
            'services' => ['electricidad-residencial' => '70.00', 'electricidad-tableros' => '150.00']],
    ];

    private const ANNOUNCEMENTS = [
        'bienvenida' => ['title' => 'Bienvenido a TécnicoYa (demostración)', 'kind' => 'news', 'audiences' => ['client', 'technician'],
            'body' => 'Comunicado de ejemplo para desarrollo: así se ve el carrusel con imagen principal y móvil.',
            'alt' => 'Técnico revisando el cableado de una red'],
        'refrigeracion' => ['title' => 'Mantenimiento preventivo de refrigeración (demostración)', 'kind' => 'promotion', 'audiences' => ['client'],
            'body' => 'Ejemplo de promoción para clientes. No es una oferta real.', 'alt' => 'Técnico limpiando el condensador de un equipo de frío'],
        'tecnicos' => ['title' => 'Declara tu distrito base (demostración)', 'kind' => 'notice', 'audiences' => ['technician'],
            'body' => 'Aviso de ejemplo para técnicos: con el distrito base declarado la cercanía suma en el matching.',
            'alt' => 'Técnico trabajando en un tablero eléctrico'],
    ];

    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new SeedingRefused('DemoSeeder solo corre en desarrollo (APP_ENV=local).');
        }
        $password = env(self::PASSWORD_VARIABLE);
        if (! is_string($password) || mb_strlen($password) < self::MIN_PASSWORD_LENGTH) {
            throw new SeedingRefused('Define '.self::PASSWORD_VARIABLE.' con al menos '.self::MIN_PASSWORD_LENGTH.' caracteres.');
        }
        $this->call(DatabaseSeeder::class);

        DB::transaction(function () use ($password) {
            $admin = $this->account('demo-admin', 'admin', 'Administración', 'Demo', '900000101', $password);
            $cliente = $this->account('demo-cliente', 'client', 'Cliente', 'Demo Hogar', '900000102', $password);
            $this->client($cliente, 'household', 'HUANCAYO');
            $mype = $this->account('demo-mype', 'client', 'Cliente', 'Demo MYPE', '900000103', $password);
            $this->client($mype, 'mype', 'EL-TAMBO', 'Bodega Demo S. A. C.');
            // Fase 6 (D-98): demo-cliente queda free y demo-mype premium, con equipos y sensores simulados.
            DB::table('client_profiles')->where('user_id', $cliente->id)->update(['plan' => 'free', 'plan_since' => null]);
            app(DemoPremium::class)->run($mype->id, (int) DB::table('client_profiles')->where('user_id', $mype->id)->value('id'), $this->district('EL-TAMBO'));
            foreach (self::TECHNICIANS as $code => $base) {
                $data = (DemoTechnicianProfiles::PROFILES[$code] ?? []) + $base;
                $user = $this->account("demo-tecnico-$code", 'technician', $data['given'] ?? $data['name'], $data['family'] ?? 'Demo', '900000110', $password);
                $this->technician($user, $data, 'active', 'approved');
                $technician = (int) DB::table('technician_profiles')->where('user_id', $user->id)->value('id');
                $this->portfolio($technician, $user->id, "demo-tecnico-$code", $data['portfolio'] ?? []);
                $this->reviews($technician, $data['reviews'] ?? []);
            }
            $pending = $this->account('demo-tecnico-pendiente', 'technician', 'Técnico Demo', 'Por verificar', '900000120', $password);
            $this->technician($pending, ['name' => 'Técnico Demo por verificar', 'base' => 'HUANCAYO', 'districts' => ['HUANCAYO'],
                'services' => ['computo-mantenimiento' => '45.00']], 'pending_verification', 'pending');

            $this->subcategoryPhotos($admin->id);
            foreach (self::ANNOUNCEMENTS as $slug => $data) {
                $this->announcement($admin->id, $slug, $data);
            }
        });
    }

    private function account(string $alias, string $role, string $givenNames, string $familyNames, string $phone, string $password): User
    {
        $user = User::firstOrNew(['email' => "$alias@example.test"]);
        $user->forceFill([
            'name' => "$givenNames $familyNames", 'given_names' => $givenNames, 'family_names' => $familyNames, 'phone' => $phone,
            'role_id' => DB::table('roles')->where('code', $role)->value('id'), 'is_active' => true, 'password' => $password,
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        return $user;
    }

    private function client(User $user, string $type, string $district, ?string $business = null): void
    {
        DB::table('client_profiles')->updateOrInsert(['user_id' => $user->id], [
            'client_type' => $type, 'business_name' => $business, 'district_id' => $this->district($district), 'updated_at' => now(),
        ]);
    }

    /** Perfil, servicios con «qué incluye», distritos y franjas del técnico; también lo usa Sprint05E2ESeeder (D-101). */
    public function technician(User $user, array $data, string $status, string $verification): void
    {
        DB::table('technician_profiles')->updateOrInsert(['user_id' => $user->id], [
            'display_name' => $data['name'], 'bio' => $data['bio'] ?? null, 'work_style' => $data['work_style'] ?? null,
            'warranty_text' => $data['warranty'] ?? null, 'status' => $status,
            'verification_status' => $verification, 'experience_years' => $data['years'] ?? 6, 'available_now' => false,
            'verified_at' => $verification === 'approved' ? now()->subMonth() : null, 'base_district_id' => $this->district($data['base']),
            'updated_at' => now(),
        ]);
        $technician = (int) DB::table('technician_profiles')->where('user_id', $user->id)->value('id');
        foreach ($data['services'] as $code => $service) {
            [$fee, $includes] = is_array($service) ? $service : [$service, null];
            $subcategory = (int) DB::table('subcategories')->where('code', $code)->value('id');
            $existing = DB::table('technician_services')->where('technician_id', $technician)->where('subcategory_id', $subcategory);
            if ($existing->exists()) {
                $existing->update(['includes' => $includes]);

                continue;
            }
            $service = DB::table('technician_services')->insertGetId([
                'technician_id' => $technician, 'subcategory_id' => $subcategory, 'reference_fee' => $fee,
                'experience_years' => $data['years'] ?? 6, 'includes' => $includes,
            ]);
            DB::table('service_rate_versions')->insert([
                'technician_service_id' => $service, 'version_no' => 1, 'reference_fee' => $fee, 'currency' => 'PEN',
                'changed_by' => $user->id, 'effective_from' => now(),
            ]);
        }
        foreach ($data['districts'] as $district) {
            DB::table('technician_districts')->updateOrInsert(['technician_id' => $technician, 'district_id' => $this->district($district)], ['active' => 1]);
        }
        if (! DB::table('availability_slots')->where('technician_id', $technician)->exists()) {
            foreach ($data['slots'] ?? array_map(fn ($day) => [$day, '08:00', '18:00'], range(1, 6)) as [$weekday, $start, $end]) {
                DB::table('availability_slots')->insert(['technician_id' => $technician, 'kind' => 'weekly', 'weekday' => $weekday,
                    'local_start' => "$start:00", 'local_end' => "$end:00", 'valid_from' => now()->toDateString(), 'timezone' => 'America/Lima']);
            }
        }
    }

    /** Trabajos publicados (por título, sin duplicar); fotos «antes» y «después» solo si el equipo las dejó en demo-media. */
    public function portfolio(int $technician, int $ownerId, string $alias, array $items): void
    {
        foreach (array_values($items) as $index => [$title, $code, $description, $daysAgo]) {
            if (DB::table('portfolio_items')->where('technician_id', $technician)->where('title', $title)->exists()) {
                continue;
            }
            $item = DB::table('portfolio_items')->insertGetId([
                'technician_id' => $technician, 'subcategory_id' => DB::table('subcategories')->where('code', $code)->value('id'),
                'title' => $title, 'description' => $description, 'performed_on' => now()->subDays($daysAgo)->toDateString(), 'status' => 'published',
            ]);
            $position = 0;
            foreach (['antes' => 'before', 'despues' => 'after'] as $suffix => $stage) {
                $file = $this->demoMedia("$alias-".($index + 1)."-$suffix");
                if ($file !== null) {
                    DB::table('portfolio_images')->insert(['portfolio_id' => $item, 'media_id' => $this->media($ownerId, $file, basename($file), 'portfolio'),
                        'position' => $position++, 'stage' => $stage, 'caption' => ($stage === 'before' ? 'Antes: ' : 'Después: ').$title]);
                }
            }
        }
    }

    private function demoMedia(string $name): ?string
    {
        foreach (['webp', 'png', 'jpg'] as $extension) {
            $path = database_path("seeders/demo-media/$name.$extension");
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    /** D-101: reseñas de ejemplo, solo en local; no son calificaciones y el panel las rotula como demostración. */
    public function reviews(int $technician, array $reviews): void
    {
        if ($reviews === [] || DB::table('technician_review_samples')->where('technician_id', $technician)->exists()) {
            return;
        }
        foreach ($reviews as [$rating, $author, $comment, $daysAgo]) {
            DB::table('technician_review_samples')->insert(['technician_id' => $technician, 'rating' => $rating, 'author_label' => $author,
                'comment' => $comment, 'reviewed_on' => now()->subDays($daysAgo)->toDateString()]);
        }
    }

    /** Foto de cada subcategoría que todavía no tiene una (computo-hardware → computo/hardware.png). */
    private function subcategoryPhotos(int $adminId): void
    {
        $folder = base_path('../../'.self::PHOTOS);
        foreach (DB::table('subcategories')->whereNull('carousel_media_id')->get(['id', 'code']) as $subcategory) {
            [$prefix, $suffix] = explode('-', $subcategory->code, 2) + [1 => ''];
            $file = ($prefix === 'frio' ? 'refrigeracion' : $prefix).'/'.($suffix === 'domestico' ? 'domestica' : $suffix).'.png';
            if (is_file("$folder/$file")) {
                DB::table('subcategories')->where('id', $subcategory->id)
                    ->update(['carousel_media_id' => $this->media($adminId, "$folder/$file", "subcategoria-{$subcategory->code}.png", 'catalog')]);
            }
        }
    }

    private function announcement(int $adminId, string $slug, array $data): void
    {
        if (DB::table('announcements')->where('title', $data['title'])->exists()) {
            return;
        }
        $images = database_path('seeders/data/demo');
        $id = (string) Str::uuid();
        DB::table('announcements')->insert([
            'id' => $id, 'title' => $data['title'], 'body' => $data['body'],
            'audience' => count($data['audiences']) > 1 ? 'both' : $data['audiences'][0], 'status' => 'published',
            'source' => 'image', 'kind' => $data['kind'], 'alt_text' => $data['alt'],
            'image_media_id' => $this->media($adminId, "$images/comunicado-$slug-principal.webp", "comunicado-$slug-principal.webp", 'announcement'),
            'mobile_media_id' => $this->media($adminId, "$images/comunicado-$slug-movil.webp", "comunicado-$slug-movil.webp", 'announcement'),
            'starts_at' => now()->subHour(), 'duration_days' => 90, 'ends_at' => now()->addDays(90),
            'created_by' => $adminId, 'updated_by' => $adminId, 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach ($data['audiences'] as $role) {
            $roleId = (int) DB::table('roles')->where('code', $role)->value('id');
            $position = (int) DB::table('announcement_audiences')->where('role_id', $roleId)->max('position') + 1;
            DB::table('announcement_audiences')->insert(['announcement_id' => $id, 'role_id' => $roleId, 'position' => $position]);
        }
    }

    /** Archivo público con la misma forma que deja POST /media; se reutiliza si ya existe. */
    private function media(int $ownerId, string $path, string $name, string $purpose): int
    {
        $key = "media/demo/$name";
        $content = (string) file_get_contents($path);
        Storage::disk('public')->put($key, $content);
        DB::table('media_files')->updateOrInsert(['disk' => 'public', 'storage_key' => $key], [
            'owner_id' => $ownerId, 'original_name' => $name,
            'mime_type' => match (strtolower(pathinfo($name, PATHINFO_EXTENSION))) { 'webp' => 'image/webp', 'jpg' => 'image/jpeg', default => 'image/png' },
            'byte_size' => strlen($content), 'sha256' => hash('sha256', $content), 'visibility' => 'public',
            'scan_status' => 'clean', 'purpose' => $purpose,
        ]);

        return (int) DB::table('media_files')->where('disk', 'public')->where('storage_key', $key)->value('id');
    }

    private function district(string $code): int
    {
        return (int) DB::table('districts')->where('code', $code)->value('id');
    }
}
