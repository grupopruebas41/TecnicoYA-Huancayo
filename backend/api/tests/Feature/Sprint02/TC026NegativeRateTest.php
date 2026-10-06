<?php

// TC-026 · HU-S02-07 · RF-05, RF-07, RF-C06 · AC-S02-07-02
// La tarifa 0 no se prueba: su aceptación sigue pendiente de P16.
use Database\Factories\TechnicianServiceFactory;
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

it('TC-026: rechaza en español una tarifa negativa sin crear versión ni cambiar la vigente', function () {
    // Dado un técnico editando su propio servicio con tarifa 50
    $service = TechnicianServiceFactory::new()->create(['reference_fee' => '50.00']);
    $technician = $service->technician;
    Sanctum::actingAs($technician->user);

    // Cuando envía una tarifa referencial negativa
    $response = $this->putJson('/api/v1/technicians/me/services', [
        'services' => [['subcategory_id' => $service->subcategory_id, 'reference_fee' => '-10.00']],
        'expected_version' => $technician->version,
    ]);

    // Entonces la API la rechaza en español, sin versión nueva ni cambio de la vigente
    Sprint01::assertSpanishValidation($response, ['services.0.reference_fee']);
    expect(DB::table('service_rate_versions')->where('technician_service_id', $service->id)->pluck('version_no')->all())->toBe([1]);
    $this->assertDatabaseHas('technician_services', ['id' => $service->id, 'reference_fee' => '50.00', 'current_rate_version' => 1]);
    $this->assertDatabaseHas('technician_profiles', ['id' => $technician->id, 'version' => $technician->version]);
});
