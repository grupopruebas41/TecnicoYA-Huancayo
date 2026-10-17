<?php

// S04-TC-128 · HU-S04-03 · RF-11 · D-64: el técnico declara su distrito base en PATCH /technicians/me/profile (solo un
// distrito activo, validado en el servidor) y GET lo devuelve. De él se mide la distancia del matching.
use Database\Factories\DistrictFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

it('S04-TC-128 guarda un distrito base activo y rechaza uno inactivo', function () {
    $technician = Sprint04::technician();
    $inactive = DistrictFactory::new()->inactive()->create();
    Sanctum::actingAs($technician->user);

    $this->patchJson('/api/v1/technicians/me/profile', ['base_district_id' => $inactive->id, 'expected_version' => 1])
        ->assertUnprocessable()->assertJsonPath('error.fields.base_district_id.0', 'Selecciona un distrito activo.');
    expect(DB::table('technician_profiles')->where('id', $technician->id)->value('base_district_id'))->toBeNull();

    $this->patchJson('/api/v1/technicians/me/profile', ['base_district_id' => Sprint04::district('EL-TAMBO'), 'expected_version' => 1])->assertOk();

    $this->getJson('/api/v1/technicians/me/profile')->assertOk()->assertJsonPath('data.base_district_id', Sprint04::district('EL-TAMBO'));
});
