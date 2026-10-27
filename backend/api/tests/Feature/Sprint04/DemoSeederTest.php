<?php

// S04-TC-139 · Cierre S4.6 · DemoSeeder: datos de demostración solo en desarrollo (APP_ENV=local), con la contraseña de
// TECNICOYA_DEMO_PASSWORD, cuentas @example.test, la foto de cada subcategoría y comunicados con imágenes válidas
// (D-83). Es idempotente y no pisa la foto que el administrador ya eligió.
use App\Models\User;
use App\Modules\FAdministration\Domain\AnnouncementImages;
use Database\Factories\UserFactory;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\SeedingRefused;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function s04Demo(?string $password): void
{
    $name = 'TECNICOYA_DEMO_PASSWORD';
    putenv($password === null ? $name : "$name=$password");
    if ($password === null) {
        unset($_ENV[$name], $_SERVER[$name]);
    } else {
        $_ENV[$name] = $_SERVER[$name] = $password;
    }
}

function s04DemoCounts(): array
{
    return collect(['users', 'client_profiles', 'technician_profiles', 'technician_services', 'service_rate_versions', 'technician_districts',
        'availability_slots', 'media_files', 'announcements', 'announcement_audiences'])->mapWithKeys(fn ($t) => [$t => DB::table($t)->count()])->all();
}

beforeEach(function () {
    Storage::fake('public');
    $this->environment = $this->app['env'];
});

afterEach(function () {
    $this->app['env'] = $this->environment;
    s04Demo(null);
});

it('S04-TC-139 DemoSeeder solo en desarrollo, con contraseña por variable, fotos de subcategorías y comunicados válidos', function () {
    $password = Str::password(20);
    s04Demo($password);
    expect(fn () => $this->seed(DemoSeeder::class))->toThrow(SeedingRefused::class, 'APP_ENV=local')
        ->and(User::query()->count())->toBe(0);

    $this->app['env'] = 'local';
    s04Demo('corta');
    expect(fn () => $this->seed(DemoSeeder::class))->toThrow(SeedingRefused::class, 'TECNICOYA_DEMO_PASSWORD');
    s04Demo(null);
    expect(fn () => $this->seed(DemoSeeder::class))->toThrow(SeedingRefused::class, 'TECNICOYA_DEMO_PASSWORD')
        ->and(User::query()->count())->toBe(0);

    // El administrador ya eligió la foto de una subcategoría: el seeder no la pisa.
    $this->seed(CatalogSeeder::class);
    $owner = UserFactory::new()->create(['email' => 'admin-previo@example.test'])->id;
    $chosen = DB::table('media_files')->insertGetId(['owner_id' => $owner, 'disk' => 'public', 'storage_key' => 'media/elegida.png',
        'original_name' => 'elegida.png', 'mime_type' => 'image/png', 'byte_size' => 1, 'sha256' => str_repeat('a', 64),
        'visibility' => 'public', 'scan_status' => 'clean', 'purpose' => 'catalog']);
    DB::table('subcategories')->where('code', 'computo-redes')->update(['carousel_media_id' => $chosen]);

    s04Demo($password);
    $this->seed(DemoSeeder::class);
    $first = s04DemoCounts();
    $this->seed(DemoSeeder::class);
    expect(s04DemoCounts())->toBe($first);

    $accounts = User::query()->orderBy('email')->get();
    expect($accounts->pluck('email')->every(fn ($email) => str_ends_with($email, '@example.test')))->toBeTrue()
        ->and($accounts->pluck('email')->all())->toContain('demo-admin@example.test', 'demo-cliente@example.test', 'demo-mype@example.test',
            'demo-tecnico-computo@example.test', 'demo-tecnico-pendiente@example.test')
        ->and($accounts->where('email', '!=', 'admin-previo@example.test')->every(fn (User $user) => Hash::check($password, $user->password)))->toBeTrue()
        ->and(DB::table('users')->where('password', $password)->exists())->toBeFalse()
        ->and(DB::table('technician_profiles')->where('verification_status', 'approved')->whereNotNull('base_district_id')->count())->toBe(3)
        ->and(DB::table('technician_profiles')->where('verification_status', 'pending')->count())->toBe(1);

    expect(DB::table('subcategories')->whereNull('carousel_media_id')->count())->toBe(0)
        ->and(DB::table('subcategories')->where('code', 'computo-redes')->value('carousel_media_id'))->toBe($chosen);
    $photo = DB::table('media_files')->where('id', DB::table('subcategories')->where('code', 'computo-hardware')->value('carousel_media_id'))->first();
    expect([$photo->purpose, $photo->visibility, $photo->mime_type])->toBe(['catalog', 'public', 'image/png'])
        ->and(Storage::disk('public')->exists($photo->storage_key))->toBeTrue();

    $announcements = DB::table('announcements')->where('status', 'published')->get();
    $images = app(AnnouncementImages::class);
    expect($announcements)->toHaveCount(3)
        ->and($announcements->every(fn ($a) => $a->source === 'image' && $images->valid($a->image_media_id, 'main')
            && $images->valid($a->mobile_media_id, 'mobile') && $a->ends_at > now()))->toBeTrue()
        ->and(DB::table('announcement_audiences')->pluck('position')->every(fn ($p) => $p > 0))->toBeTrue();
});
