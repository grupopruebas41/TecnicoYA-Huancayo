<?php

// S03-TC-025 y 026 · HU-S03-01 y 02 · RF-01, RF-03: actualizaciones perdidas entre dos pestañas.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\MediaFileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($this->client);
    $this->request = Sprint03::register($this, DistrictFactory::new()->create()->id);
});

it('S03-TC-025 rechaza adjuntar con la versión que otra pestaña ya cambió', function () {
    $this->patchJson("/api/v1/requests/{$this->request['id']}", ['description' => 'Corregida en la primera pestaña.', 'expected_version' => $this->request['version']])
        ->assertOk();
    $photo = MediaFileFactory::new()->create(['owner_id' => $this->client->id, 'mime_type' => 'image/png']);

    $stale = $this->postJson("/api/v1/requests/{$this->request['id']}/attachments", ['media_id' => $photo->id, 'expected_version' => $this->request['version']]);

    $stale->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');
    $this->assertDatabaseCount('request_attachments', 0);
});

it('S03-TC-026 conserva la primera corrección cuando otra llega con la misma versión [TC-027]', function () {
    $url = "/api/v1/requests/{$this->request['id']}";
    $first = $this->patchJson($url, ['description' => 'Primera corrección de la descripción.', 'expected_version' => $this->request['version']])
        ->assertOk()->json('data');
    $second = $this->patchJson($url, ['description' => 'Segunda corrección que llegó tarde.', 'expected_version' => $this->request['version']]);

    expect($first['version'])->toBe($this->request['version'] + 1);
    $second->assertConflict();
    $row = DB::table('service_requests')->find($this->request['id']);
    expect($row->description)->toBe('Primera corrección de la descripción.')
        ->and((int) $row->version)->toBe($first['version']);
});
