<?php

// S03-TC-018 a 022 · HU-S03-02 · RF-03, RF-33 · D-12 y D-47: evidencias privadas de la solicitud (TC-130).
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
    Storage::fake('public');
    Sprint01::actAsSpa($this);
    $this->client = ClientProfileFactory::new()->create()->user;
});

it('S03-TC-018 guarda la evidencia del cliente como privada, revisada y sin EXIF [TC-130]', function () {
    Sanctum::actingAs($this->client);

    $response = $this->post('/api/v1/media', ['purpose' => 'evidence', 'file' => Sprint02::upload('foto-con-exif.jpg')])
        ->assertCreated();

    expect($response->json('data'))->toMatchArray(['purpose' => 'evidence', 'visibility' => 'private', 'mime_type' => 'image/jpeg']);
    $row = DB::table('media_files')->find($response->json('data.id'));
    expect($row->owner_id)->toBe($this->client->id)
        ->and($row->disk)->toBe('local')
        ->and($row->scan_status)->toBe('clean');
    Storage::disk('local')->assertExists($row->storage_key);
    Storage::disk('public')->assertMissing($row->storage_key);
    expect(Storage::disk('local')->get($row->storage_key))->not->toContain('Exif');
    $this->get("/api/v1/media/{$row->id}")->assertOk();
});

it('S03-TC-019 acepta una evidencia de 5 MB exactos y rechaza 5 MB más 1 KB sin guardar nada [TC-130]', function () {
    Sanctum::actingAs($this->client);

    $this->post('/api/v1/media', ['purpose' => 'evidence', 'file' => Sprint02::jpegOfSize(5120 * 1024)])->assertCreated();
    $tooLarge = $this->post('/api/v1/media', ['purpose' => 'evidence', 'file' => Sprint02::jpegOfSize(5121 * 1024)]);

    Sprint01::assertSpanishValidation($tooLarge, ['file']);
    expect($tooLarge->json('errors.file.0'))->toBe('El archivo no debe superar 5 MB.');
    $this->assertDatabaseCount('media_files', 1);
    expect(Storage::disk('local')->allFiles())->toHaveCount(1);
});

it('S03-TC-020 rechaza por su contenido un PDF y un GIF renombrados como JPG [TC-130]', function () {
    Sanctum::actingAs($this->client);

    foreach ([Sprint02::upload('documento.pdf', 'falla.jpg'), Sprint02::upload('foto.gif', 'falla.jpg')] as $file) {
        $response = $this->post('/api/v1/media', ['purpose' => 'evidence', 'file' => $file]);
        Sprint01::assertSpanishValidation($response, ['file']);
        expect(array_keys($response->json('errors')))->toBe(['file'])
            ->and($response->json('errors.file.0'))->toBe('El archivo debe ser una imagen JPG, PNG o WebP.');
    }
    $this->assertDatabaseCount('media_files', 0);
    expect(Storage::disk('local')->allFiles())->toBe([]);
});

it('S03-TC-021 admite la quinta foto y rechaza la sexta sin cambiar adjuntos ni versión [TC-130]', function () {
    Sanctum::actingAs($this->client);
    $request = Sprint03::register($this, DistrictFactory::new()->create()->id);
    $version = $request['version'];
    $photos = MediaFileFactory::new()->count(6)->create(['owner_id' => $this->client->id, 'mime_type' => 'image/png']);

    foreach ($photos->take(5) as $photo) {
        $version = $this->postJson("/api/v1/requests/{$request['id']}/attachments", ['media_id' => $photo->id, 'expected_version' => $version])
            ->assertCreated()->json('data.version');
    }
    $sixth = $this->postJson("/api/v1/requests/{$request['id']}/attachments", ['media_id' => $photos->last()->id, 'expected_version' => $version]);

    Sprint01::assertSpanishValidation($sixth, ['media_id']);
    expect($sixth->json('errors.media_id.0'))->toContain('máximo de 5 fotos');
    expect(DB::table('request_attachments')->where('request_id', $request['id'])->count())->toBe(5)
        ->and(Sprint02::version('service_requests', $request['id']))->toBe($version);
});

it('S03-TC-022 solo el cliente sube evidencias: técnico y administrador 403 y anónimo 401', function () {
    $this->post('/api/v1/media', ['purpose' => 'evidence', 'file' => Sprint02::upload('foto.png')])->assertUnauthorized();

    Sanctum::actingAs(TechnicianProfileFactory::new()->approved()->create()->user);
    $this->post('/api/v1/media', ['purpose' => 'evidence', 'file' => Sprint02::upload('foto.png')])->assertForbidden();

    Sanctum::actingAs(Sprint02::admin());
    $this->post('/api/v1/media', ['purpose' => 'evidence', 'file' => Sprint02::upload('foto.png')])->assertForbidden();

    $this->assertDatabaseCount('media_files', 0);
    expect(Storage::disk('local')->allFiles())->toBe([]);
});
