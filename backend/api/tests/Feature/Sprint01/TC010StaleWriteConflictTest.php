<?php

// TC-010 · HU-S01-05 · RF-28, RF-33, RF-C06 · AC-S01-05-02
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S01-TC-008 responde 409 ante una versión obsoleta y conserva la edición más reciente [TC-010]', function () {
    // Dado un perfil que cambió después de cargar el formulario
    [$client] = Sprint01::registerThroughApi($this);
    Sanctum::actingAs($client);
    $loadedVersion = $client->version;
    $this->patchJson('/api/v1/me', ['name' => 'Edición vigente', 'expected_version' => $loadedVersion])
        ->assertOk();

    // Cuando se envía una edición con la versión anterior
    $response = $this->patchJson('/api/v1/me', ['name' => 'Edición obsoleta', 'expected_version' => $loadedVersion]);

    // Entonces la API informa conflicto en español y no sobrescribe la edición vigente
    $response->assertConflict();
    Sprint01::assertSpanishText((string) $response->json('message'));
    $this->assertDatabaseHas('users', [
        'id' => $client->id,
        'name' => 'Edición vigente',
        'version' => $loadedVersion + 1,
    ]);
});
