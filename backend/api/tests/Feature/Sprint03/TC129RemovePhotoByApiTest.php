<?php

// TC-129 · HU-S03-02 · RF-03, RF-33 · Módulo A · AUTH-01
// Se excluye la variante «retirar tras el envío»: no hay regla aprobada y no cuenta para aprobar el caso.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\MediaFileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

it('TC-129: solo el titular retira la foto de una solicitud no enviada; otro cliente es denegado', function () {
    // Dado una solicitud no enviada con una foto
    $owner = ClientProfileFactory::new()->create();
    Sanctum::actingAs($owner->user);
    $request = $this->postJson('/api/v1/requests', Sprint03::requestPayload(DistrictFactory::new()->create()->id))->assertCreated()->json('data');
    $photo = MediaFileFactory::new()->create(['owner_id' => $owner->user_id]);
    $version = $this->postJson("/api/v1/requests/{$request['id']}/attachments", ['media_id' => $photo->id, 'expected_version' => $request['version']])
        ->assertCreated()->json('data.version');
    $url = "/api/v1/requests/{$request['id']}/attachments/{$photo->id}";

    // Cuando otro cliente intenta retirarla, se deniega en español y la foto queda intacta
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $denied = $this->deleteJson($url, ['expected_version' => $version])->assertNotFound();
    Sprint01::assertSpanishText((string) $denied->json('message'));
    $this->assertDatabaseHas('request_attachments', ['request_id' => $request['id'], 'media_id' => $photo->id]);

    // Cuando el titular la retira sin versión, no se retira y el mensaje está en español
    Sanctum::actingAs($owner->user);
    Sprint01::assertSpanishValidation($this->deleteJson($url, []), ['expected_version']);
    $this->assertDatabaseHas('request_attachments', ['request_id' => $request['id'], 'media_id' => $photo->id]);

    // Cuando el titular la retira con la versión vigente
    $this->deleteJson($url, ['expected_version' => $version])->assertNoContent();

    // Entonces la foto deja de estar vinculada, pero el archivo sigue siendo suyo y privado
    $this->assertDatabaseMissing('request_attachments', ['media_id' => $photo->id]);
    expect($this->getJson("/api/v1/requests/{$request['id']}")->json('data.attachments'))->toBe([]);
    $this->assertDatabaseHas('media_files', ['id' => $photo->id, 'owner_id' => $owner->user_id, 'visibility' => 'private']);
});
