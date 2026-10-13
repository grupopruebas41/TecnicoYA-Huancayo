<?php

// TC-025 · HU-S02-07 · RF-05, RF-07, RF-C06 · AC-S02-07-01
// Tarifas sintéticas; la relación con la tarifa de catálogo sigue pendiente de P16.
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

it('S02-TC-010 crea la versión 2 de la tarifa y conserva la versión 1 sin sobrescribirla [TC-025]', function () {
    // Dado un servicio con tarifa referencial 50 en su versión 1
    $service = TechnicianServiceFactory::new()->create(['reference_fee' => '50.00']);
    $technician = $service->technician;
    Sanctum::actingAs($technician->user);

    // Cuando envía una tarifa no numérica, no se guarda y el mensaje está en español
    $invalid = $this->putJson('/api/v1/technicians/me/services', [
        'services' => [['subcategory_id' => $service->subcategory_id, 'reference_fee' => 'sesenta']],
        'expected_version' => $technician->version,
    ]);
    Sprint01::assertSpanishValidation($invalid, ['services.0.reference_fee']);
    expect(DB::table('service_rate_versions')->where('technician_service_id', $service->id)->count())->toBe(1);

    // Cuando el propietario cambia la referencia a 60
    $this->putJson('/api/v1/technicians/me/services', [
        'services' => [['subcategory_id' => $service->subcategory_id, 'reference_fee' => '60.00']],
        'expected_version' => $technician->version,
    ])->assertOk();

    // Entonces existe la versión 2 con 60 y la versión 1 conserva 50
    $versions = DB::table('service_rate_versions')->where('technician_service_id', $service->id)
        ->orderBy('version_no')->get(['version_no', 'reference_fee', 'changed_by']);
    expect($versions->map(fn ($v) => [$v->version_no, $v->reference_fee])->all())->toBe([[1, '50.00'], [2, '60.00']])
        ->and($versions[1]->changed_by)->toBe($technician->user_id);
    $this->assertDatabaseHas('technician_services', ['id' => $service->id, 'reference_fee' => '60.00', 'current_rate_version' => 2]);
});
