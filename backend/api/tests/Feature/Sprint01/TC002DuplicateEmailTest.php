<?php

// TC-002 · HU-S01-01 · RF-28 · AC-S01-01-02
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S01-TC-001 rechaza el correo duplicado normalizado sin crear otro usuario ni perfil [TC-002]', function () {
    // Dado una cuenta ya registrada
    $payload = Sprint01::registrationPayload();
    $this->postJson('/api/v1/auth/register', $payload)->assertCreated();

    // Cuando se registra otra cuenta con el mismo correo en mayúsculas y con espacios
    $payload['email'] = '  '.strtoupper($payload['email']).'  ';
    $response = $this->postJson('/api/v1/auth/register', $payload);

    // Entonces se rechaza en español y no se crea usuario ni perfil adicional
    Sprint01::assertSpanishValidation($response, ['email']);
    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseCount('client_profiles', 1);
});
