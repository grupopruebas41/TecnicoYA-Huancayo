<?php

// TC-020 · HU-S02-04 · RF-07, RF-30, RF-33 · AC-S02-04-02
// Solo lectura protegida: no hay dato que guardar, por eso no aplica la verificación de validación CRUD.
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
});

it('TC-020: deniega a un técnico el documento privado de otro sin revelar su contenido', function () {
    // Dado el documento privado de un técnico y otro técnico autenticado
    $document = TechnicianDocumentFactory::new()->create();
    $media = $document->media;
    $content = Storage::disk('local')->get($media->storage_key);
    $owner = $document->technician->user;
    $intruder = TechnicianProfileFactory::new()->create()->user;

    // Cuando el otro técnico solicita el archivo por su identificador
    Sanctum::actingAs($intruder);
    $denied = $this->get("/api/v1/media/{$media->id}", ['Accept' => 'application/json']);

    // Entonces se deniega en español y el contenido no aparece
    $denied->assertNotFound();
    expect($denied->getContent())->not->toContain($content);
    Sprint01::assertSpanishText((string) $denied->json('message'));

    // Y su propietario sí puede descargarlo
    Sanctum::actingAs($owner);
    expect($this->get("/api/v1/media/{$media->id}")->assertOk()->streamedContent())->toBe($content);
});
