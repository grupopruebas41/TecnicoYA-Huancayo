<?php

// HU-S02-05 · RF-C06, RF-33 · POST /media: tipo real por contenido, límite de 5 MB y retirada de EXIF
// (D-46, D-47; contrato S2 §4). Todo archivo va a discos falsos (Storage::fake).
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->technician = TechnicianProfileFactory::new()->approved()->create();
});

/** Sube un archivo como lo haría la SPA (multipart con Accept JSON). */
function s02Upload(object $test, $file, string $purpose = 'portfolio')
{
    return $test->post('/api/v1/media', ['file' => $file, 'purpose' => $purpose], ['Accept' => 'application/json']);
}

function s02NothingStored(): void
{
    expect(DB::table('media_files')->count())->toBe(0)
        ->and(Storage::disk('public')->allFiles())->toBe([])
        ->and(Storage::disk('local')->allFiles())->toBe([]);
}

it('S02-TC-038 CRUD-01 sube imágenes de portafolio JPG, PNG y WebP como públicas, revisadas y sin EXIF [TC-021]', function () {
    Sanctum::actingAs($this->technician->user);

    $response = s02Upload($this, Sprint02::upload('foto-con-exif.jpg'))->assertCreated()
        ->assertJsonPath('data.purpose', 'portfolio')->assertJsonPath('data.visibility', 'public')
        ->assertJsonPath('data.mime_type', 'image/jpeg');

    $media = DB::table('media_files')->where('id', $response->json('data.id'))->sole();
    $stored = Storage::disk($media->disk)->get($media->storage_key);
    expect($media->owner_id)->toBe($this->technician->user_id)
        ->and($media->scan_status)->toBe('clean')
        ->and($stored)->not->toContain('SINTETICO-EXIF')->not->toContain("Exif\0\0")
        ->and(substr($stored, 0, 2))->toBe("\xFF\xD8")
        ->and((new finfo(FILEINFO_MIME_TYPE))->buffer($stored))->toBe('image/jpeg')
        ->and($media->byte_size)->toBe(strlen($stored))
        ->and($media->sha256)->toBe(hash('sha256', $stored));
    s02Upload($this, Sprint02::upload('foto.png'))->assertCreated()->assertJsonPath('data.mime_type', 'image/png');
    s02Upload($this, Sprint02::upload('foto.webp'))->assertCreated()->assertJsonPath('data.mime_type', 'image/webp');
    Sprint01::forgetSession();
    $this->get($response->json('data.url'))->assertOk();
});

it('S02-TC-039 VAL-02 rechaza en español un texto con extensión .jpg, un GIF y un propósito ajeno al rol, sin guardar nada [TC-022]', function () {
    Sanctum::actingAs($this->technician->user);

    Sprint01::assertSpanishValidation(s02Upload($this, Sprint02::upload('no-es-imagen.jpg', 'foto.jpg')), ['file']);
    Sprint01::assertSpanishValidation(s02Upload($this, Sprint02::upload('foto.gif')), ['file']);
    Sprint01::assertSpanishValidation(s02Upload($this, Sprint02::upload('foto.png'), 'avatar'), ['purpose']);
    s02Upload($this, Sprint02::upload('foto.png'), 'catalog')->assertForbidden();
    Sprint01::forgetSession();
    Sanctum::actingAs(UserFactory::new()->client()->create());
    s02Upload($this, Sprint02::upload('foto.png'))->assertForbidden();

    s02NothingStored();
});

it('S02-TC-040 acepta una imagen de exactamente 5 MB (5 242 880 bytes)', function () {
    Sanctum::actingAs($this->technician->user);
    $file = Sprint02::jpegOfSize(5_242_880);
    expect($file->getSize())->toBe(5_242_880);

    s02Upload($this, $file)->assertCreated();

    expect(DB::table('media_files')->count())->toBe(1);
});

it('S02-TC-041 VAL-02 rechaza una imagen de 5 MB más un byte sin guardar nada', function () {
    Sanctum::actingAs($this->technician->user);
    $file = Sprint02::jpegOfSize(5_242_881);
    expect($file->getSize())->toBe(5_242_881);

    Sprint01::assertSpanishValidation(s02Upload($this, $file), ['file']);

    s02NothingStored();
});
