<?php

// TC-134 · HU-S02-06, HU-S02-07 · RF-04, RF-05, RF-33 · Módulo A, AUTH-01
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

it('TC-134: impide que otro técnico o un cliente cambien la disponibilidad o la tarifa ajena', function () {
    // Dado un técnico con horario y tarifa vigentes
    $service = TechnicianServiceFactory::new()->create(['reference_fee' => '50.00']);
    $owner = $service->technician;
    $district = DistrictFactory::new()->create();
    Sanctum::actingAs($owner->user);
    $this->putJson('/api/v1/technicians/me/availability', [
        'slots' => [['weekday' => 4, 'start' => '08:00', 'end' => '16:00']],
        'district_ids' => [$district->id], 'pause' => null, 'expected_version' => $owner->version,
    ])->assertOk();
    $slots = DB::table('availability_slots')->where('technician_id', $owner->id)->get()->toArray();
    $rates = DB::table('service_rate_versions')->where('technician_service_id', $service->id)->get()->toArray();
    $attack = [
        'technician_id' => $owner->id,
        'services' => [['subcategory_id' => $service->subcategory_id, 'reference_fee' => '1.00']],
        'slots' => [['weekday' => 4, 'start' => '00:00', 'end' => '01:00']],
        'district_ids' => [$district->id], 'pause' => null, 'expected_version' => 1,
    ];

    // Cuando un cliente intenta modificarlas, se deniega en español
    Sanctum::actingAs(UserFactory::new()->client()->create());
    foreach (['availability', 'services'] as $resource) {
        $denied = $this->putJson("/api/v1/technicians/me/$resource", $attack)->assertForbidden();
        Sprint01::assertSpanishText((string) $denied->json('message'));
    }

    // Cuando otro técnico envía el identificador del propietario, el campo se rechaza en español
    Sanctum::actingAs(TechnicianProfileFactory::new()->approved()->create()->user);
    foreach (['availability', 'services'] as $resource) {
        Sprint01::assertSpanishValidation($this->putJson("/api/v1/technicians/me/$resource", $attack), ['technician_id']);
    }

    // Entonces el horario y las versiones de tarifa del propietario no cambian
    expect(DB::table('availability_slots')->where('technician_id', $owner->id)->get()->toArray())->toEqual($slots)
        ->and(DB::table('service_rate_versions')->where('technician_service_id', $service->id)->get()->toArray())->toEqual($rates);
    $this->assertDatabaseHas('technician_services', ['id' => $service->id, 'reference_fee' => '50.00']);
});
