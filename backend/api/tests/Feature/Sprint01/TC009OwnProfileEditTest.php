<?php

// TC-009 · HU-S01-05 · RF-28, RF-33, RF-C06 · AC-S01-05-01
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('TC-009: guarda nombre y teléfono propios e incrementa la versión sin cambiar permisos', function () {
    // Dado una cuenta con versión de perfil vigente
    [$client] = Sprint01::registerThroughApi($this);
    Sanctum::actingAs($client);
    $version = $client->version;

    // Cuando envía un nombre inválido, no se guarda y el mensaje está en español
    $invalid = $this->patchJson('/api/v1/me', ['name' => '', 'expected_version' => $version]);
    Sprint01::assertSpanishValidation($invalid, ['name']);
    $this->assertDatabaseHas('users', ['id' => $client->id, 'name' => 'Persona de prueba', 'version' => $version]);

    // Cuando actualiza nombre y teléfono permitidos
    $this->patchJson('/api/v1/me', [
        'name' => 'Nombre actualizado',
        'phone' => '900000002',
        'expected_version' => $version,
    ])->assertOk()->assertJsonPath('data.version', $version + 1);

    // Entonces se guardan, la versión sube en uno y el rol no cambia
    $this->assertDatabaseHas('users', [
        'id' => $client->id,
        'name' => 'Nombre actualizado',
        'phone' => '900000002',
        'role_id' => $client->role_id,
        'version' => $version + 1,
    ]);
    $this->assertDatabaseMissing('user_permissions', ['user_id' => $client->id]);
});
