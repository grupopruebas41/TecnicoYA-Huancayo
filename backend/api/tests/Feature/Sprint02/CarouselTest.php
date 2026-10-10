<?php

// HU-S02-01 · RF-C08 · Carrusel público de la landing (contrato S2 §3.1; D-47).
use Database\Factories\MediaFileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->owner = Sprint02::admin();
    // Cuatro subcategorías activas de Cómputo en orden de catálogo.
    $this->subcategories = DB::table('subcategories')->where('specialty_id', Sprint02::specialtyId('computo'))
        ->orderBy('display_order')->orderBy('id')->limit(4)->pluck('id')->all();
});

function s02CarouselImage(object $test, array $state = []): int
{
    return MediaFileFactory::new()->publicImage()->create(['owner_id' => $test->owner->id] + $state)->id;
}

it('S02-TC-022 sirve sin sesión solo las subcategorías activas con imagen pública revisada [TC-013]', function () {
    [$withImage, $withoutImage, $pending, $private] = $this->subcategories;
    $image = s02CarouselImage($this);
    DB::table('subcategories')->where('id', $withImage)->update(['carousel_media_id' => $image]);
    DB::table('subcategories')->where('id', $pending)->update(['carousel_media_id' => s02CarouselImage($this, ['scan_status' => 'pending'])]);
    DB::table('subcategories')->where('id', $private)->update(['carousel_media_id' => MediaFileFactory::new()->create(['owner_id' => $this->owner->id])->id]);

    $response = $this->getJson('/api/v1/catalog/carousel')->assertOk();

    $items = $response->json('data');
    expect(array_column($items, 'subcategory_id'))->toBe([$withImage])
        ->and(array_keys($items[0]))->toEqualCanonicalizing(['subcategory_id', 'specialty_id', 'specialty_name', 'name', 'description', 'image_url'])
        ->and($items[0]['specialty_name'])->toBe('Cómputo')
        ->and($items[0]['image_url'])->toEndWith("/api/v1/media/$image");
    expect($response->getContent())->not->toContain('storage_key')->not->toContain('owner_id');
    expect(array_column($items, 'subcategory_id'))->not->toContain($withoutImage);
});

it('S02-TC-023 excluye del carrusel la imagen retirada, la subcategoría inactiva y la especialidad inactiva', function () {
    [$retired, $inactive, $visible] = $this->subcategories;
    DB::table('subcategories')->where('id', $retired)->update(['carousel_media_id' => s02CarouselImage($this, ['retired_at' => now()])]);
    DB::table('subcategories')->where('id', $inactive)->update(['carousel_media_id' => s02CarouselImage($this), 'active' => 0]);
    DB::table('subcategories')->where('id', $visible)->update(['carousel_media_id' => s02CarouselImage($this)]);
    $electric = DB::table('subcategories')->where('specialty_id', Sprint02::specialtyId('electricidad'))->value('id');
    DB::table('subcategories')->where('id', $electric)->update(['carousel_media_id' => s02CarouselImage($this)]);
    DB::table('specialties')->where('code', 'electricidad')->update(['active' => 0]);

    $items = $this->getJson('/api/v1/catalog/carousel')->assertOk()->json('data');

    expect(array_column($items, 'subcategory_id'))->toBe([$visible]);
});
