<?php

// TC-119 · HU-S03-01 · RF-01, RF-02 · Módulo A, VAL-02
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Queue::fake();
    Sprint01::actAsSpa($this);
});

it('TC-119: rechaza en la API, sin React, una solicitud con datos obligatorios ausentes o inválidos', function () {
    // Dado un cliente autenticado y un cuerpo válido de referencia
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $valid = Sprint03::requestPayload(DistrictFactory::new()->create()->id);
    $variants = [
        'subcategory_id' => array_diff_key($valid, ['subcategory_id' => 1]),
        'description' => ['description' => ''] + $valid,
        'district_id' => array_diff_key($valid, ['district_id' => 1]),
        'address' => ['address' => '   '] + $valid,
    ];
    $variants['subcategory_id_tipo'] = ['subcategory_id' => 'computo-hardware'] + $valid;

    foreach ($variants as $name => $payload) {
        // Cuando envía el cuerpo con una sola anomalía directamente a la API
        $response = $this->postJson('/api/v1/requests', $payload);

        // Entonces recibe 422 con el mensaje en español del campo afectado
        Sprint01::assertSpanishValidation($response, [str_replace('_tipo', '', $name)]);
        expect($response->getContent())->not->toContain('SQLSTATE')->not->toContain('vendor');
    }

    // Y no se crea solicitud, evento ni trabajo de matching
    expect(Sprint03::requestTablesSnapshot())->toBe(['service_requests' => 0, 'request_events' => 0, 'request_attachments' => 0]);
    Queue::assertNothingPushed();
});
