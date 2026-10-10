<?php

use Database\Factories\MediaFileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

/** Fila esperada del catálogo público de subcategorías, con los campos en el orden del contrato. */
function s01CatalogExpectedRow(object $row): array
{
    return [
        'id' => (int) $row->id, 'specialty_id' => (int) $row->specialty_id, 'code' => $row->code,
        'name' => $row->name, 'description' => $row->description,
        'image_url' => $row->carousel_media_id ? url("/api/v1/media/{$row->carousel_media_id}") : null,
    ];
}

it('S01-TC-010 sirve solo categorías activas y valida el filtro sin inventar resultados [TC-012]', function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    $specialty = DB::table('specialties')->orderBy('display_order')->first();
    $this->getJson('/api/v1/catalog/specialties')->assertOk()->assertJsonCount(3, 'data');
    $this->getJson('/api/v1/catalog/subcategories?specialty_id=inválido')->assertUnprocessable();
    $this->getJson('/api/v1/catalog/subcategories')->assertUnprocessable();
    $this->getJson('/api/v1/catalog/subcategories?specialty_id=99999')->assertUnprocessable();
    // Un valor que MySQL convertiría a un ID existente ('1abc' = 1) se rechaza por no ser entero.
    $this->getJson("/api/v1/catalog/subcategories?specialty_id={$specialty->id}abc")->assertUnprocessable();

    // Orden: la última subcategoría pasa a display_order 0 y debe salir primera; una lleva foto de carrusel.
    $rows = DB::table('subcategories')->where('specialty_id', $specialty->id)->orderBy('display_order')->orderBy('id')->get();
    $last = $rows->last();
    $image = MediaFileFactory::new()->publicImage()->create(['owner_id' => Sprint02::admin()->id]);
    DB::table('subcategories')->where('id', $last->id)->update(['display_order' => 0, 'carousel_media_id' => $image->id]);
    $expected = DB::table('subcategories')->where('specialty_id', $specialty->id)
        ->orderBy('display_order')->orderBy('id')->get()->map(fn (object $row) => s01CatalogExpectedRow($row))->all();
    $served = $this->getJson('/api/v1/catalog/subcategories?specialty_id='.$specialty->id)->assertOk()->json('data');
    expect($served)->toBe($expected)
        ->and($served)->toHaveCount($rows->count())
        ->and($served[0]['id'])->toBe((int) $last->id)
        ->and($served[0]['image_url'])->toEndWith("/api/v1/media/{$image->id}")
        ->and(array_keys($served[1]))->toBe(['id', 'specialty_id', 'code', 'name', 'description', 'image_url'])
        ->and($served[1]['image_url'])->toBeNull();

    $hidden = DB::table('subcategories')->where('specialty_id', $specialty->id)->where('id', '!=', $last->id)->first();
    DB::table('subcategories')->where('id', $hidden->id)->update(['active' => 0]);
    $this->getJson('/api/v1/catalog/subcategories?specialty_id='.$specialty->id)
        ->assertOk()->assertJsonCount($rows->count() - 1, 'data')->assertJsonMissing(['code' => $hidden->code]);
    DB::table('specialties')->where('id', $specialty->id)->update(['active' => 0]);
    $this->getJson('/api/v1/catalog/specialties')->assertOk()->assertJsonCount(2, 'data');
    $this->getJson('/api/v1/catalog/subcategories?specialty_id='.$specialty->id)->assertOk()->assertJsonCount(0, 'data');
});
