<?php

// TC-017 · HU-S02-03 · RF-C04, RF-C09 · AC-S02-03-01
// Solo lectura: no hay dato que guardar, por eso no aplica la verificación de validación CRUD.
use Database\Factories\AnnouncementFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('TC-017: entrega el comunicado vigente dirigido a técnicos solo al técnico', function () {
    // Dado un comunicado vigente solo para técnicos y otro vigente para ambos roles
    $forTechnicians = AnnouncementFactory::new()->forRoles(['technician'])->create(['title' => 'Solo para técnicos']);
    $general = AnnouncementFactory::new()->forRoles(['client', 'technician'])->create(['title' => 'Para todos']);

    // Cuando un cliente consulta sus comunicados
    Sanctum::actingAs(UserFactory::new()->client()->create());
    $clientItems = $this->getJson('/api/v1/announcements')->assertOk()->json('data');

    // Entonces recibe el general pero no el de técnicos
    expect(Sprint02::itemsWith($clientItems, 'id', $general->id))->toHaveCount(1)
        ->and(Sprint02::itemsWith($clientItems, 'id', $forTechnicians->id))->toBe([]);

    // Cuando un técnico consulta sus comunicados, recibe ambos
    Sanctum::actingAs(UserFactory::new()->technician()->create());
    $technicianItems = $this->getJson('/api/v1/announcements')->assertOk()->json('data');
    expect(Sprint02::itemsWith($technicianItems, 'id', $forTechnicians->id))->toHaveCount(1)
        ->and(Sprint02::itemsWith($technicianItems, 'id', $general->id))->toHaveCount(1);
});
