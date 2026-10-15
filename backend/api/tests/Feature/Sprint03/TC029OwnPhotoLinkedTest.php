<?php

// TC-029 · HU-S03-02 · RF-03, RF-33 · AC-S03-02-01
// La imagen ya está almacenada (Storage::fake); formatos y límites de subida siguen en P17 (TC-130).
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
});

it('S03-TC-001 vincula la foto propia solo a su solicitud y la muestra al propietario en el resumen [TC-029]', function () {
    // Dado una solicitud registrada propia y una imagen válida del cliente
    $client = ClientProfileFactory::new()->create();
    Sanctum::actingAs($client->user);
    $district = DistrictFactory::new()->create();
    $first = $this->postJson('/api/v1/requests', Sprint03::requestPayload($district->id))->assertCreated()->json('data');
    $second = $this->postJson('/api/v1/requests', Sprint03::requestPayload($district->id))->assertCreated()->json('data');
    $photo = MediaFileFactory::new()->create(['owner_id' => $client->user_id, 'mime_type' => 'image/png']);

    // Cuando adjunta un identificador inexistente, no se guarda y el mensaje está en español
    $invalid = $this->postJson("/api/v1/requests/{$first['id']}/attachments", ['media_id' => 999999, 'expected_version' => $first['version']]);
    Sprint01::assertSpanishValidation($invalid, ['media_id']);
    $this->assertDatabaseCount('request_attachments', 0);

    // Cuando adjunta la imagen y consulta el resumen
    $this->postJson("/api/v1/requests/{$first['id']}/attachments", ['media_id' => $photo->id, 'expected_version' => $first['version']])
        ->assertCreated();
    $summary = $this->getJson("/api/v1/requests/{$first['id']}")->assertOk()->json('data');

    // Entonces la foto aparece en esa solicitud, sigue privada y la ve su propietario
    expect(array_column($summary['attachments'], 'media_id'))->toBe([$photo->id]);
    $this->assertDatabaseHas('media_files', ['id' => $photo->id, 'visibility' => 'private']);
    $this->get("/api/v1/media/{$photo->id}")->assertOk();

    // Y no puede vincularse además a otra solicitud
    $again = $this->postJson("/api/v1/requests/{$second['id']}/attachments", ['media_id' => $photo->id, 'expected_version' => $second['version']]);
    Sprint01::assertSpanishValidation($again, ['media_id']);
    expect(DB::table('request_attachments')->where('media_id', $photo->id)->pluck('request_id')->all())->toBe([$first['id']]);
});
