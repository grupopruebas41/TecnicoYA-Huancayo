<?php

// TC-032 · HU-S03-03 · RF-01, RF-04, RF-C02 · AC-S03-03-02 · RN-03
// Distritos sintéticos: el catálogo real de cobertura sigue pendiente de P03.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

it('S03-TC-004 informa fuera de cobertura y no registra la solicitud de un distrito fuera del catálogo activo [TC-032]', function () {
    // Dado un distrito que no pertenece al catálogo activo y otro inexistente
    $closed = DistrictFactory::new()->inactive()->create();
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);

    foreach ([$closed->id, 999999] as $districtId) {
        // Cuando intenta confirmar una solicitud para ese distrito
        $response = $this->postJson('/api/v1/requests', Sprint03::requestPayload($districtId));

        // Entonces se informa «fuera de cobertura» en español y no se guarda nada
        Sprint01::assertSpanishValidation($response, ['district_id']);
        expect($response->json('errors.district_id.0'))->toContain('fuera de cobertura');
    }
    $this->assertDatabaseCount('service_requests', 0);
    $this->assertDatabaseCount('request_events', 0);
});
