<?php

// TC-004 · HU-S01-02 · RF-28, RF-33 · AC-S01-02-02
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('TC-004: rechaza que el técnico se autoactive y conserva el estado persistido', function () {
    // Dado una cuenta técnica pendiente
    [$technician] = Sprint01::registerThroughApi($this, 'technician');
    Sanctum::actingAs($technician);
    $privileged = ['verification_status', 'status', 'permissions', 'role_id'];

    // Cuando envía verificación aprobada, estado activo, permisos y rol en su edición de perfil
    $response = $this->patchJson('/api/v1/me', [
        'verification_status' => 'approved',
        'status' => 'active',
        'permissions' => ['catalog.manage'],
        'role_id' => 1,
        'expected_version' => $technician->version,
    ]);

    // Entonces se rechazan los campos privilegiados con mensajes en español
    Sprint01::assertSpanishValidation($response, $privileged);

    // Y nada de lo persistido cambia
    $this->assertDatabaseHas('technician_profiles', [
        'user_id' => $technician->id,
        'status' => 'pending_verification',
        'verification_status' => 'pending',
    ]);
    expect($technician->fresh()->role_id)->toBe($technician->role_id)
        ->and($technician->fresh()->version)->toBe($technician->version);
    $this->assertDatabaseMissing('user_permissions', ['user_id' => $technician->id]);
});
