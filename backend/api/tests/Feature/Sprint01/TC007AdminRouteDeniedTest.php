<?php

// TC-007 · HU-S01-04 · RF-33 · AC-S01-04-01
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('TC-007: deniega con 403 una ruta administrativa a un cliente autenticado', function () {
    // Ruta registrada solo en esta prueba: verifica los middleware reales sin adelantar el panel del Sprint 7.
    Route::middleware(['api', 'auth:sanctum', 'account.active', 'permission:catalog.manage'])
        ->get('/__tests/admin-access', fn () => ['private_marker' => 'restricted']);

    // Dado un cliente autenticado
    $client = UserFactory::new()->client()->create();
    Sanctum::actingAs($client);
    $permissionsBefore = DB::table('user_permissions')->count();

    // Cuando consulta directamente la ruta administrativa
    $response = $this->getJson('/__tests/admin-access');

    // Entonces recibe 403 en español, sin datos ni cambios administrativos
    $response->assertForbidden()->assertJsonMissing(['private_marker' => 'restricted']);
    Sprint01::assertSpanishText((string) $response->json('message'));
    expect(DB::table('user_permissions')->count())->toBe($permissionsBefore);
});
