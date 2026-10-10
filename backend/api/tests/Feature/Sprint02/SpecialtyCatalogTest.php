<?php

// HU-S02-02 · RF-C01, RF-C02 · Catálogo administrable: especialidades y subcategorías (contrato S2 §7).
// Desactivar conserva identidad y referencias (RT-05); las fotos son imágenes públicas revisadas (D-47).
use Database\Factories\DistrictFactory;
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
});

it('S02-TC-013 CRUD-01 crea una especialidad con foto revisada, código estable y auditoría', function () {
    $admin = Sprint02::admin();
    $image = MediaFileFactory::new()->publicImage()->create(['owner_id' => $admin->id]);
    Sanctum::actingAs($admin);

    $created = $this->postJson('/api/v1/admin/specialties', [
        'name' => 'Climatización', 'description' => 'Aire acondicionado de ventana y split.', 'image_id' => $image->id,
    ])->assertCreated();

    $created->assertJsonPath('data.name', 'Climatización')->assertJsonPath('data.code', 'climatizacion')
        ->assertJsonPath('data.image_id', $image->id)->assertJsonPath('data.active', true)->assertJsonPath('data.version', 1);
    expect($created->json('data.image_url'))->toEndWith("/api/v1/media/{$image->id}");
    $listed = Sprint02::itemsWith($this->getJson('/api/v1/admin/specialties')->assertOk()->json('data'), 'code', 'climatizacion');
    expect($listed)->toHaveCount(1)->and($listed[0]['subcategories'])->toBe([]);
    $this->assertDatabaseHas('specialties', ['code' => 'climatizacion', 'hero_media_id' => $image->id, 'active' => 1]);
    $this->assertDatabaseHas('audit_entries', [
        'actor_id' => $admin->id, 'action' => 'catalog.specialty.created', 'subject_type' => 'specialty', 'subject_id' => $created->json('data.id'),
    ]);
});

it('S02-TC-014 VAL-02 rechaza en español una especialidad sin nombre o con un nombre repetido, sin escribir nada', function () {
    Sanctum::actingAs(Sprint02::admin());

    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/specialties', ['name' => '']), ['name']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/specialties', ['name' => 'Cómputo']), ['name']);

    $this->assertDatabaseCount('specialties', 3);
    $this->assertDatabaseMissing('audit_entries', ['action' => 'catalog.specialty.created']);
});

it('S02-TC-015 CRUD-01 desactiva una especialidad: sale del catálogo público y del carrusel y conserva subcategorías y servicios', function () {
    $admin = Sprint02::admin();
    $specialty = Sprint02::specialtyId('computo');
    $subcategory = Sprint02::subcategoryId();
    DB::table('subcategories')->where('id', $subcategory)
        ->update(['carousel_media_id' => MediaFileFactory::new()->publicImage()->create(['owner_id' => $admin->id])->id]);
    $service = TechnicianServiceFactory::new()->create([
        'technician_id' => TechnicianProfileFactory::new()->approved()->create()->id, 'subcategory_id' => $subcategory,
    ]);
    $subcategoriesBefore = DB::table('subcategories')->where('specialty_id', $specialty)->orderBy('id')->get()->toArray();
    Sanctum::actingAs($admin);

    $this->patchJson("/api/v1/admin/specialties/$specialty", [
        'active' => false, 'expected_version' => Sprint02::version('specialties', $specialty),
    ])->assertOk()->assertJsonPath('data.active', false);

    Sprint01::forgetSession();
    expect(array_column($this->getJson('/api/v1/catalog/specialties')->assertOk()->json('data'), 'code'))->not->toContain('computo');
    expect($this->getJson("/api/v1/catalog/subcategories?specialty_id=$specialty")->assertOk()->json('data'))->toBe([]);
    expect(array_column($this->getJson('/api/v1/catalog/carousel')->assertOk()->json('data'), 'specialty_id'))->not->toContain($specialty);
    expect(DB::table('subcategories')->where('specialty_id', $specialty)->orderBy('id')->get()->toArray())->toEqual($subcategoriesBefore);
    $this->assertDatabaseHas('technician_services', ['id' => $service->id, 'subcategory_id' => $subcategory, 'active' => 1]);
});

it('S02-TC-016 CRUD-01 reactiva una subcategoría: vuelve al catálogo y el técnico puede ofrecerla', function () {
    $subcategory = Sprint02::subcategoryId();
    $specialty = Sprint02::specialtyId('computo');
    DB::table('subcategories')->where('id', $subcategory)->update(['active' => 0, 'version' => 2]);
    Sanctum::actingAs(Sprint02::admin());

    $this->patchJson("/api/v1/admin/subcategories/$subcategory", ['active' => true, 'expected_version' => 2])
        ->assertOk()->assertJsonPath('data.active', true)->assertJsonPath('data.version', 3);

    expect(array_column($this->getJson("/api/v1/catalog/subcategories?specialty_id=$specialty")->json('data'), 'id'))->toContain($subcategory);
    $technician = TechnicianProfileFactory::new()->approved()->create();
    Sprint01::forgetSession();
    Sanctum::actingAs($technician->user);
    $this->putJson('/api/v1/technicians/me/services', [
        'services' => [['subcategory_id' => $subcategory, 'reference_fee' => '60.00']], 'expected_version' => $technician->version,
    ])->assertOk();
    $this->assertDatabaseHas('technician_services', ['technician_id' => $technician->id, 'subcategory_id' => $subcategory, 'active' => 1]);
});

it('S02-TC-017 VAL-02 rechaza una subcategoría con especialidad inactiva, nombre repetido o imagen no revisada', function () {
    $admin = Sprint02::admin();
    DB::table('specialties')->where('code', 'electricidad')->update(['active' => 0]);
    $repeated = DB::table('subcategories')->where('id', Sprint02::subcategoryId())->value('name');
    $pending = MediaFileFactory::new()->publicImage()->pendingScan()->create(['owner_id' => $admin->id]);
    $before = DB::table('subcategories')->count();
    Sanctum::actingAs($admin);

    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/subcategories', [
        'specialty_id' => Sprint02::specialtyId('electricidad'), 'name' => 'Tableros trifásicos',
    ]), ['specialty_id']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/subcategories', [
        'specialty_id' => Sprint02::specialtyId('computo'), 'name' => $repeated,
    ]), ['name']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/subcategories', [
        'specialty_id' => Sprint02::specialtyId('computo'), 'name' => 'Redes domésticas nuevas', 'image_id' => $pending->id,
    ]), ['image_id']);

    expect(DB::table('subcategories')->count())->toBe($before);
});

it('S02-TC-018 CRUD-02 rechaza con 409 la edición de una especialidad o subcategoría con versión vieja', function () {
    $specialty = Sprint02::specialtyId('computo');
    $subcategory = Sprint02::subcategoryId();
    Sanctum::actingAs(Sprint02::admin());

    $this->patchJson("/api/v1/admin/specialties/$specialty", ['name' => 'Cómputo y redes', 'expected_version' => 1])->assertOk();
    $this->patchJson("/api/v1/admin/specialties/$specialty", ['name' => 'Otro nombre', 'expected_version' => 1])
        ->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');
    $this->patchJson("/api/v1/admin/subcategories/$subcategory", ['name' => 'Hardware de escritorio', 'expected_version' => 1])->assertOk();
    $this->patchJson("/api/v1/admin/subcategories/$subcategory", ['name' => 'Otro nombre', 'expected_version' => 1])
        ->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');

    $this->assertDatabaseHas('specialties', ['id' => $specialty, 'name' => 'Cómputo y redes', 'version' => 2]);
    $this->assertDatabaseHas('subcategories', ['id' => $subcategory, 'name' => 'Hardware de escritorio', 'version' => 2]);
});

it('S02-TC-019 AUTH-01 niega el catálogo administrativo a cliente, técnico y administrador sin catalog.manage', function () {
    $specialty = Sprint02::specialtyId('computo');
    $subcategory = Sprint02::subcategoryId();
    $district = DistrictFactory::new()->create();
    Sprint02::revokeFromAdminRole('catalog.manage');
    $admin = Sprint02::admin();
    $before = [DB::table('specialties')->get()->toArray(), DB::table('subcategories')->get()->toArray(), DB::table('districts')->get()->toArray()];
    $actors = [UserFactory::new()->client()->create(), TechnicianProfileFactory::new()->approved()->create()->user, $admin];

    foreach ($actors as $actor) {
        Sprint01::forgetSession();
        Sanctum::actingAs($actor);
        $this->postJson('/api/v1/admin/specialties', ['name' => 'Intrusa'])->assertForbidden();
        $this->patchJson("/api/v1/admin/specialties/$specialty", ['active' => false, 'expected_version' => 1])->assertForbidden();
        $this->postJson('/api/v1/admin/subcategories', ['specialty_id' => $specialty, 'name' => 'Intrusa'])->assertForbidden();
        $this->patchJson("/api/v1/admin/subcategories/$subcategory", ['active' => false, 'expected_version' => 1])->assertForbidden();
        $this->postJson('/api/v1/admin/districts', ['name' => 'Intruso'])->assertForbidden();
        $this->patchJson("/api/v1/admin/districts/{$district->id}", ['active' => false, 'expected_version' => 1])->assertForbidden();
    }

    expect([DB::table('specialties')->get()->toArray(), DB::table('subcategories')->get()->toArray(), DB::table('districts')->get()->toArray()])
        ->toEqual($before);
    $this->assertDatabaseHas('audit_entries', ['actor_id' => $admin->id, 'action' => 'permission.denied', 'permission_used' => 'catalog.manage']);
});
