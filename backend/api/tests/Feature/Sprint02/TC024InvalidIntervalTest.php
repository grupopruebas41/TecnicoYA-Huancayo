<?php

// TC-024 · HU-S02-06 · RF-05, RF-07 · AC-S02-06-02
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S02-TC-009 rechaza en español una franja que termina antes de empezar y conserva el horario anterior [TC-024]', function () {
    // Dado un técnico con un horario ya guardado
    $technician = TechnicianProfileFactory::new()->approved()->create();
    $district = DistrictFactory::new()->create();
    Sanctum::actingAs($technician->user);
    $saved = $this->putJson('/api/v1/technicians/me/availability', [
        'slots' => [['weekday' => 2, 'start' => '09:00', 'end' => '13:00']],
        'district_ids' => [$district->id],
        'pause' => null,
        'expected_version' => $technician->version,
    ])->assertOk()->json('data.version');
    $before = DB::table('availability_slots')->where('technician_id', $technician->id)->get()->toArray();

    // Cuando envía una franja cuyo fin es anterior al inicio
    $response = $this->putJson('/api/v1/technicians/me/availability', [
        'slots' => [['weekday' => 2, 'start' => '15:00', 'end' => '11:00']],
        'district_ids' => [$district->id],
        'pause' => null,
        'expected_version' => $saved,
    ]);

    // Entonces recibe el error en español y el horario anterior no cambia
    Sprint01::assertSpanishValidation($response, ['slots.0.end']);
    expect(DB::table('availability_slots')->where('technician_id', $technician->id)->get()->toArray())->toEqual($before);
    $this->assertDatabaseHas('technician_profiles', ['id' => $technician->id, 'version' => $saved]);
});
