<?php

// S01-TC-055 a 063 y 071 · HU-S01-04 a HU-S01-06 · RF-33, RF-C01 · AUTH-01
// Tabla de decisión rol × ruta: anónimo, cliente, técnico, administrador y cuenta suspendida (CONTRATO-API.md §2).
use App\Models\User;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

/** Usuario con sesión abierta antes de ser suspendido. */
function s01SuspendAfterLogin(User $user): User
{
    Sanctum::actingAs($user);
    User::query()->whereKey($user->id)->update(['is_active' => false]);

    return $user;
}

function s01NewSubcategory(): array
{
    return ['specialty_id' => Sprint02::specialtyId(), 'name' => 'Subcategoría de la tabla de decisión'];
}

it('S01-TC-055 responde 401 en español a GET /me sin sesión', function () {
    $response = $this->getJson('/api/v1/me');
    $response->assertUnauthorized()->assertJsonPath('error.code', 'UNAUTHENTICATED')->assertJsonMissingPath('data');
    Sprint01::assertSpanishText((string) $response->json('message'));
});

it('S01-TC-056 responde 403 a GET /me de una cuenta suspendida sin exponer sus datos', function () {
    $user = s01SuspendAfterLogin(UserFactory::new()->client()->create(['name' => 'Nombre que no debe salir', 'phone' => '064123456']));

    $response = $this->getJson('/api/v1/me');

    $response->assertForbidden()->assertJsonPath('error.code', 'FORBIDDEN')
        ->assertJsonMissing(['name' => $user->name])->assertJsonMissing(['phone' => '064123456']);
    Sprint01::assertSpanishText((string) $response->json('message'));
});

it('S01-TC-057 responde 403 a PATCH /me de una cuenta suspendida sin cambiar el perfil', function () {
    $user = s01SuspendAfterLogin(UserFactory::new()->client()->create());

    $this->patchJson('/api/v1/me', ['name' => 'Cambio no permitido', 'expected_version' => $user->version])->assertForbidden();

    expect($user->fresh()->name)->toBe($user->name)->and($user->fresh()->version)->toBe($user->version);
});

it('S01-TC-058 deniega con 403 la ruta administrativa a un técnico y audita el rechazo [TC-007]', function () {
    $technician = UserFactory::new()->technician()->create();
    Sanctum::actingAs($technician);
    $before = DB::table('subcategories')->count();

    $response = $this->postJson('/api/v1/admin/subcategories', s01NewSubcategory());

    $response->assertForbidden();
    Sprint01::assertSpanishText((string) $response->json('message'));
    expect(DB::table('subcategories')->count())->toBe($before);
    $this->assertDatabaseHas('audit_entries', [
        'actor_id' => $technician->id, 'action' => 'permission.denied', 'permission_used' => 'catalog.manage',
    ]);
});

it('S01-TC-059 responde 401 a la ruta administrativa sin sesión [TC-007]', function () {
    $before = DB::table('subcategories')->count();

    $this->postJson('/api/v1/admin/subcategories', s01NewSubcategory())
        ->assertUnauthorized()->assertJsonPath('error.code', 'UNAUTHENTICATED');

    expect(DB::table('subcategories')->count())->toBe($before);
});

it('S01-TC-060 deniega la ruta administrativa a un administrador suspendido aunque su rol tenga el permiso [TC-007]', function () {
    $admin = s01SuspendAfterLogin(Sprint02::admin());
    $before = DB::table('subcategories')->count();

    $this->postJson('/api/v1/admin/subcategories', s01NewSubcategory())->assertForbidden();

    expect(DB::table('subcategories')->count())->toBe($before)
        ->and(DB::table('role_permissions')->where('role_id', $admin->role_id)->count())->toBeGreaterThan(0);
});

it('S01-TC-061 permite la ruta administrativa al administrador activo con catalog.manage [TC-007]', function () {
    Sanctum::actingAs(Sprint02::admin());

    $this->postJson('/api/v1/admin/subcategories', s01NewSubcategory())->assertCreated();

    $this->assertDatabaseHas('subcategories', ['name' => 'Subcategoría de la tabla de decisión']);
});

it('S01-TC-062 devuelve en GET /me del cliente solo lo propio de su rol y ningún secreto [TC-005]', function () {
    Sanctum::actingAs(UserFactory::new()->client()->create());

    $response = $this->getJson('/api/v1/me')->assertOk();

    $response->assertJsonPath('data.role.code', 'client')->assertJsonPath('data.permissions', [])
        ->assertJsonMissingPath('data.technician_profile')->assertJsonMissingPath('data.password')
        ->assertJsonMissingPath('data.remember_token')->assertJsonMissingPath('data.email');
});

it('S01-TC-063 devuelve en GET /me del administrador los permisos del rol y sus concesiones individuales [TC-005]', function () {
    $admin = Sprint02::admin();
    $extra = DB::table('permissions')->insertGetId(['code' => 'reports.read', 'description' => 'Permiso sintético de prueba']);
    DB::table('user_permissions')->insert([
        'user_id' => $admin->id, 'permission_id' => $extra, 'granted_by' => Sprint02::admin()->id, 'granted_at' => now(),
    ]);
    Sanctum::actingAs($admin);

    $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.role.code', 'admin')
        ->assertJsonPath('data.permissions', ['announcements.manage', 'catalog.manage', 'dashboard.view', 'reports.read', 'technicians.verify', 'users.manage']);
});

it('S01-TC-071 sirve el mismo catálogo público a anónimo, cliente, técnico, administrador y cuenta suspendida [TC-012]', function () {
    $expected = $this->getJson('/api/v1/catalog/specialties')->assertOk()->json('data');
    expect($expected)->toHaveCount(3);
    $actors = [
        UserFactory::new()->client()->create(), UserFactory::new()->technician()->create(), Sprint02::admin(),
        UserFactory::new()->client()->create(['is_active' => false]),
    ];

    foreach ($actors as $actor) {
        Sprint01::forgetSession();
        Sanctum::actingAs($actor);
        expect($this->getJson('/api/v1/catalog/specialties')->assertOk()->json('data'))->toBe($expected);
    }
});
