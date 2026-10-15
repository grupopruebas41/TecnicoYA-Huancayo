<?php

// TC-121 · HU-S03-03 · RF-01 · Módulo A · RN-04
// No se prueban fechas pasadas ni duración de la franja: siguen pendientes de P05/P16.
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

it('S03-TC-012 rechaza en español la modalidad programada sin fecha u hora y acepta la completa [TC-121]', function () {
    // Dado una solicitud con modalidad programada
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $base = Sprint03::requestPayload(DistrictFactory::new()->create()->id, ['mode' => 'scheduled']);
    $start = now()->addDays(2)->setTime(9, 0)->toIso8601String();
    $end = now()->addDays(2)->setTime(11, 0)->toIso8601String();
    $variants = [
        [['preferred_end_at' => $end], ['preferred_start_at']],
        [['preferred_start_at' => $start], ['preferred_end_at']],
        [[], ['preferred_start_at', 'preferred_end_at']],
    ];

    foreach ($variants as [$dates, $missing]) {
        // Cuando se envía sin fecha de inicio, sin fin o sin ambas
        $response = $this->postJson('/api/v1/requests', $dates + $base);

        // Entonces se rechaza con mensaje en español sobre cada dato faltante, sin códigos internos
        Sprint01::assertSpanishValidation($response, $missing);
        expect($response->getContent())->not->toContain('scheduled');
    }
    $this->assertDatabaseCount('service_requests', 0);

    // Y con fecha y hora completas se registra
    $this->postJson('/api/v1/requests', ['preferred_start_at' => $start, 'preferred_end_at' => $end] + $base)
        ->assertCreated()->assertJsonPath('data.mode', 'scheduled');
});
