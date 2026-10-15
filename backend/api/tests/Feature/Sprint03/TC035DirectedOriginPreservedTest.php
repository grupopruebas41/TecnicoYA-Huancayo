<?php

// TC-035 · HU-S03-05 · RF-01, RF-02, RF-C06 · AC-S03-05-01
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
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

it('S03-TC-006 conserva el origen desde perfil y el técnico elegido sin asignarlo automáticamente [TC-035]', function () {
    // Dado un técnico habilitado que ofrece la subcategoría seleccionada
    $technician = TechnicianProfileFactory::new()->approved()->create();
    $service = TechnicianServiceFactory::new()->create(['technician_id' => $technician->id]);
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $district = DistrictFactory::new()->create();

    // Cuando envía origen «perfil» sin técnico objetivo, no se guarda y el mensaje está en español
    $invalid = $this->postJson('/api/v1/requests', Sprint03::requestPayload($district->id, ['source' => 'profile']));
    Sprint01::assertSpanishValidation($invalid, ['target_technician_id']);
    $this->assertDatabaseCount('service_requests', 0);

    // Cuando pulsa «Solicitar servicio» desde el perfil y confirma
    $data = $this->postJson('/api/v1/requests', Sprint03::requestPayload($district->id, [
        'subcategory_id' => $service->subcategory_id, 'source' => 'profile', 'target_technician_id' => $technician->id,
    ]))->assertCreated()->json('data');

    // Entonces la solicitud conserva origen y técnico objetivo, y queda registrada sin asignación
    expect($data['source'])->toBe('profile')
        ->and($data['target_technician_id'])->toBe($technician->id)
        ->and($data['status'])->toBe('registered');
    $this->assertDatabaseHas('service_requests', [
        'id' => $data['id'], 'source' => 'profile', 'target_technician_id' => $technician->id, 'status' => 'registered',
    ]);
});
