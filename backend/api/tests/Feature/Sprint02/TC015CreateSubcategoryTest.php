<?php

// TC-015 · HU-S02-02 · RF-C01, RF-C02 · AC-S02-02-01
// Imagen: archivo ya almacenado y revisado (scan_status=clean). La política de subida sigue en P17.
use Database\Factories\MediaFileFactory;
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
    Sprint01::actAsSpa($this);
});

it('TC-015: crea una subcategoría con imagen revisada y la ofrece en su especialidad con la foto del carrusel', function () {
    // Dado un administrador autorizado, una especialidad activa y una imagen revisada
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);
    $specialtyId = Sprint02::specialtyId();
    $image = MediaFileFactory::new()->publicImage()->create(['owner_id' => $admin->id]);
    $unreviewed = MediaFileFactory::new()->publicImage()->pendingScan()->create(['owner_id' => $admin->id]);
    $before = DB::table('subcategories')->count();

    // Cuando envía un nombre vacío o una imagen sin revisar, no se guarda y el mensaje está en español
    $invalid = $this->postJson('/api/v1/admin/subcategories', [
        'specialty_id' => $specialtyId, 'name' => '', 'image_id' => $unreviewed->id,
    ]);
    Sprint01::assertSpanishValidation($invalid, ['name', 'image_id']);
    expect(DB::table('subcategories')->count())->toBe($before);

    // Cuando crea la subcategoría con la imagen revisada
    $this->postJson('/api/v1/admin/subcategories', [
        'specialty_id' => $specialtyId,
        'name' => 'Reparación de tabletas',
        'reference_fee' => '45.00',
        'image_id' => $image->id,
    ])->assertCreated()->assertJsonPath('data.name', 'Reparación de tabletas');

    // Entonces queda activa en su especialidad, con la imagen como foto de carrusel
    $this->assertDatabaseHas('subcategories', [
        'specialty_id' => $specialtyId, 'name' => 'Reparación de tabletas',
        'carousel_media_id' => $image->id, 'active' => 1,
    ]);
    $listed = Sprint02::itemsWith(
        $this->getJson("/api/v1/catalog/subcategories?specialty_id=$specialtyId")->assertOk()->json('data'),
        'name', 'Reparación de tabletas'
    );
    expect($listed)->toHaveCount(1)
        ->and($listed[0]['image_url'])->toEndWith("/api/v1/media/{$image->id}");
});
