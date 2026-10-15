<?php

// S03-TC-023 y 024 · HU-S03-02 · RF-03, RF-33: quién ve cada foto y fotos de una solicitud enviada.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($this->client);
    $request = Sprint03::register($this, DistrictFactory::new()->create()->id);
    $this->photo = MediaFileFactory::new()->create(['owner_id' => $this->client->id, 'mime_type' => 'image/png']);
    $version = $this->postJson("/api/v1/requests/{$request['id']}/attachments", ['media_id' => $this->photo->id, 'expected_version' => $request['version']])
        ->assertCreated()->json('data.version');
    $this->sent = Sprint03::submit($this, $request['id'], $version)->assertAccepted()->json('data');
});

it('S03-TC-023 solo el titular descarga la foto de su solicitud; los demás reciben 404 [TC-127]', function () {
    $url = "/api/v1/media/{$this->photo->id}";
    $this->get($url)->assertOk();

    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->get($url)->assertNotFound();

    Sanctum::actingAs(TechnicianProfileFactory::new()->approved()->create()->user);
    $this->get($url)->assertNotFound();

    Sanctum::actingAs(Sprint02::admin()); // tiene technicians.verify, pero no es un documento de verificación
    $this->get($url)->assertNotFound();

    Sprint01::forgetSession();
    $this->get($url)->assertNotFound();
    $this->assertDatabaseHas('media_files', ['id' => $this->photo->id, 'visibility' => 'private']);
});

it('S03-TC-024 no retira la foto de una solicitud enviada y no registra evento [TC-129]', function () {
    $this->deleteJson("/api/v1/requests/{$this->sent['id']}/attachments/{$this->photo->id}", ['expected_version' => $this->sent['version']])
        ->assertConflict();

    $this->assertDatabaseHas('request_attachments', ['request_id' => $this->sent['id'], 'media_id' => $this->photo->id]);
    expect(DB::table('request_events')->where('request_id', $this->sent['id'])->where('event_type', 'request.attachment_removed')->exists())->toBeFalse()
        ->and(Sprint02::version('service_requests', $this->sent['id']))->toBe($this->sent['version']);
});
