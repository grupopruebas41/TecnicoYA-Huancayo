<?php

use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('TC-012: sirve solo categorías activas y valida el filtro sin inventar resultados', function () {
    $this->seed(CatalogSeeder::class);
    $specialty = DB::table('specialties')->orderBy('display_order')->first();
    $this->getJson('/api/v1/catalog/specialties')->assertOk()->assertJsonCount(3, 'data');
    $this->getJson('/api/v1/catalog/subcategories?specialty_id=inválido')->assertUnprocessable();
    $this->getJson('/api/v1/catalog/subcategories')->assertUnprocessable();
    $this->getJson('/api/v1/catalog/subcategories?specialty_id=99999')->assertUnprocessable();
    $hidden = DB::table('subcategories')->where('specialty_id', $specialty->id)->first();
    DB::table('subcategories')->where('id', $hidden->id)->update(['active' => 0]);
    $this->getJson('/api/v1/catalog/subcategories?specialty_id='.$specialty->id)
        ->assertOk()->assertJsonMissing(['code' => $hidden->code]);
    DB::table('specialties')->where('id', $specialty->id)->update(['active' => 0]);
    $this->getJson('/api/v1/catalog/specialties')->assertOk()->assertJsonCount(2, 'data');
    $this->getJson('/api/v1/catalog/subcategories?specialty_id='.$specialty->id)->assertOk()->assertJsonCount(0, 'data');
});
