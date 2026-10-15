<?php

// S03-TC-016 y 017 · HU-S03-01 · RF-01 · D-12: descripción de 20 a 1000 caracteres (TC-123).
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
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
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->districtId = DistrictFactory::new()->create()->id;
});

it('S03-TC-016 rechaza una descripción de 19 caracteres, también rodeada de espacios, y acepta 20 [TC-123]', function () {
    $before = Sprint03::requestTablesSnapshot();

    foreach ([str_repeat('a', 19), '   '.str_repeat('a', 19).'   '] as $description) {
        $response = $this->postJson('/api/v1/requests', Sprint03::requestPayload($this->districtId, ['description' => $description]));
        Sprint01::assertSpanishValidation($response, ['description']);
    }
    expect(Sprint03::requestTablesSnapshot())->toBe($before);

    $created = Sprint03::register($this, $this->districtId, ['description' => str_repeat('b', 20)]);
    expect($created['description'])->toBe(str_repeat('b', 20));
});

it('S03-TC-017 acepta 1000 caracteres, rechaza 1001 al registrar y al corregir sin cambiar versión ni texto [TC-123]', function () {
    $created = Sprint03::register($this, $this->districtId, ['description' => str_repeat('c', 1000)]);
    expect(mb_strlen($created['description']))->toBe(1000);

    $tooLong = $this->postJson('/api/v1/requests', Sprint03::requestPayload($this->districtId, ['description' => str_repeat('d', 1001)]));
    Sprint01::assertSpanishValidation($tooLong, ['description']);
    $this->assertDatabaseCount('service_requests', 1);

    $patch = $this->patchJson("/api/v1/requests/{$created['id']}", ['description' => str_repeat('e', 1001), 'expected_version' => $created['version']]);
    Sprint01::assertSpanishValidation($patch, ['description']);
    $row = DB::table('service_requests')->find($created['id']);
    expect($row->description)->toBe(str_repeat('c', 1000))
        ->and((int) $row->version)->toBe($created['version']);
});
