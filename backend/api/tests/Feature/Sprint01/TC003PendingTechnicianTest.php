<?php

// TC-003 · HU-S01-02 · RF-28, RF-33 · AC-S01-02-01
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S01-TC-002 registra al técnico como pendiente de verificación y solo le deja editar datos básicos [TC-003]', function () {
    // Dado un técnico sin cuenta previa que completa el registro
    [$technician] = Sprint01::registerThroughApi($this, 'technician');

    // Entonces su perfil queda pendiente y no disponible
    $this->assertDatabaseHas('technician_profiles', [
        'user_id' => $technician->id,
        'status' => 'pending_verification',
        'verification_status' => 'pending',
        'available_now' => 0,
    ]);
    Sanctum::actingAs($technician);

    // Cuando envía un dato básico inválido, no se guarda y el mensaje está en español
    $invalid = $this->patchJson('/api/v1/me', ['name' => '', 'expected_version' => $technician->version]);
    Sprint01::assertSpanishValidation($invalid, ['name']);
    $this->assertDatabaseHas('users', ['id' => $technician->id, 'name' => 'Persona de prueba']);

    // Cuando edita sus datos básicos válidos, se guardan sin cambiar la verificación
    $this->patchJson('/api/v1/me', [
        'name' => 'Técnico de prueba',
        'phone' => '900000001',
        'expected_version' => $technician->version,
    ])->assertOk();
    $this->assertDatabaseHas('users', ['id' => $technician->id, 'name' => 'Técnico de prueba']);
    $this->assertDatabaseHas('technician_profiles', [
        'user_id' => $technician->id,
        'status' => 'pending_verification',
        'verification_status' => 'pending',
    ]);
});
