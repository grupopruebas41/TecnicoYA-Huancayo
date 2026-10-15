<?php

// TC-127 · HU-S03-02 · RF-03, RF-33 · Módulo A · AC-04.2, RN-22
// Solo lectura protegida: no aplica la verificación de validación CRUD. El acceso del técnico
// notificado se añade con las ofertas (Sprint 4) y se comprobará entonces como control positivo.
use Database\Factories\MediaFileFactory;
use Database\Factories\ServiceRequestFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
});

it('S03-TC-014 oculta fotos, descripción y dirección de una solicitud a un técnico no notificado [TC-127]', function () {
    // Dado una solicitud con foto privada y un técnico habilitado sin oferta ni asignación
    $request = ServiceRequestFactory::new()->create([
        'description' => 'Descripción privada de la falla.', 'address' => 'Dirección exacta privada 789',
    ]);
    $owner = $request->client->user;
    $photo = MediaFileFactory::new()->create(['owner_id' => $owner->id, 'mime_type' => 'image/png']);
    DB::table('request_attachments')->insert(['request_id' => $request->id, 'media_id' => $photo->id, 'uploaded_by' => $owner->id]);
    $content = Storage::disk('local')->get($photo->storage_key);
    Sanctum::actingAs(TechnicianProfileFactory::new()->approved()->create()->user);

    // Cuando intenta ver el detalle y descargar la foto conociendo sus identificadores
    $detail = $this->getJson("/api/v1/requests/{$request->id}");
    $download = $this->get("/api/v1/media/{$photo->id}", ['Accept' => 'application/json']);

    // Entonces ambos se deniegan en español sin exponer foto, descripción ni dirección
    $detail->assertNotFound();
    $download->assertNotFound();
    Sprint01::assertSpanishText((string) $detail->json('message'));
    expect($detail->getContent().$download->getContent())
        ->not->toContain('Descripción privada')->not->toContain('Dirección exacta')->not->toContain($content);

    // Y la foto sigue vinculada y visible para su propietario
    Sanctum::actingAs($owner);
    expect(array_column($this->getJson("/api/v1/requests/{$request->id}")->assertOk()->json('data.attachments'), 'media_id'))->toBe([$photo->id]);
});
