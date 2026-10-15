<?php

// TC-036 · HU-S03-05 · RF-01, RF-02, RF-C06 · AC-S03-05-02
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

it('S03-TC-007 rechaza un técnico objetivo que no ofrece la subcategoría sin sustituirlo por otro [TC-036]', function () {
    // Dado un técnico precargado que ofrece hardware pero no redes, y otro que sí ofrece redes
    $target = TechnicianProfileFactory::new()->approved()->create();
    TechnicianServiceFactory::new()->create(['technician_id' => $target->id]);
    $networks = (int) DB::table('subcategories')->where('code', 'computo-redes')->value('id');
    TechnicianServiceFactory::new()->create([
        'technician_id' => TechnicianProfileFactory::new()->approved()->create()->id, 'subcategory_id' => $networks,
    ]);
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $before = Sprint03::requestTablesSnapshot();

    // Cuando se envía la combinación manipulada (técnico objetivo + subcategoría que no ofrece)
    $response = $this->postJson('/api/v1/requests', Sprint03::requestPayload(DistrictFactory::new()->create()->id, [
        'subcategory_id' => $networks, 'source' => 'profile', 'target_technician_id' => $target->id,
    ]));

    // Entonces la API rechaza la incompatibilidad en español y no crea ni sustituye nada
    Sprint01::assertSpanishValidation($response, ['target_technician_id']);
    expect(Sprint03::requestTablesSnapshot())->toBe($before);
});
