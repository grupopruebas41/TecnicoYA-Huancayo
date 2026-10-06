<?php

// TC-030 · HU-S03-02 · RF-03, RF-33 · AC-S03-02-02
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

it('TC-030: deniega vincular el archivo privado de otro cliente y lo mantiene privado', function () {
    // Dado un archivo privado de otro cliente
    $owner = ClientProfileFactory::new()->create();
    $foreign = MediaFileFactory::new()->create(['owner_id' => $owner->user_id]);
    $content = Storage::disk('local')->get($foreign->storage_key);

    // Y una solicitud propia del atacante
    $attacker = ClientProfileFactory::new()->create();
    Sanctum::actingAs($attacker->user);
    $request = $this->postJson('/api/v1/requests', Sprint03::requestPayload(DistrictFactory::new()->create()->id))
        ->assertCreated()->json('data');

    // Cuando intenta vincular el identificador ajeno
    $response = $this->postJson("/api/v1/requests/{$request['id']}/attachments", [
        'media_id' => $foreign->id, 'expected_version' => $request['version'],
    ]);

    // Entonces se deniega en español, no se vincula y el archivo sigue privado
    Sprint01::assertSpanishValidation($response, ['media_id']);
    $this->assertDatabaseMissing('request_attachments', ['media_id' => $foreign->id]);
    $this->assertDatabaseHas('media_files', ['id' => $foreign->id, 'visibility' => 'private', 'owner_id' => $owner->user_id]);
    $download = $this->get("/api/v1/media/{$foreign->id}", ['Accept' => 'application/json'])->assertNotFound();
    expect($download->getContent())->not->toContain($content);
});
