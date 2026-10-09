<?php

// TC-008 · HU-S01-04 · RF-33 · AC-S01-04-02
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S01-TC-006 rechaza el alta administrativa desde el registro público [TC-008]', function () {
    // Dado un visitante sin sesión privilegiada
    $payload = Sprint01::registrationPayload('admin');

    // Cuando solicita registro con account_type=admin
    $response = $this->postJson('/api/v1/auth/register', $payload);

    // Entonces el alta se rechaza en español y no se crea ninguna cuenta
    Sprint01::assertSpanishValidation($response, ['account_type']);
    $this->assertDatabaseMissing('users', ['email' => $payload['email']]);
    $this->assertDatabaseCount('users', 0);
});
