<?php

// TC-021 · HU-S02-05 · RF-C06, RF-33 · AC-S02-05-01
// La imagen ya está almacenada y revisada; la política de subida y sus límites siguen en P17 (TC-022).
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
});

it('S02-TC-007 publica un trabajo con su imagen en la galería pública sin documentos de verificación [TC-021]', function () {
    // Dado un técnico propietario de una imagen apta y de un documento de verificación
    $technician = TechnicianProfileFactory::new()->approved()->create();
    $image = MediaFileFactory::new()->publicImage()->create(['owner_id' => $technician->user_id]);
    $document = TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id]);
    Sanctum::actingAs($technician->user);

    // Cuando envía un título vacío o un documento como imagen, no se guarda y el mensaje está en español
    $invalid = $this->postJson('/api/v1/technicians/me/portfolio', [
        'title' => '', 'media_ids' => [$document->media_id], 'status' => 'published',
    ]);
    Sprint01::assertSpanishValidation($invalid, ['title', 'media_ids.0']);
    $this->assertDatabaseCount('portfolio_items', 0);

    // Cuando publica un trabajo con título, descripción e imagen propia
    $this->postJson('/api/v1/technicians/me/portfolio', [
        'title' => 'Reparación de placa base',
        'description' => 'Cambio de condensadores en una placa de escritorio.',
        'media_ids' => [$image->id],
        'status' => 'published',
    ])->assertCreated();

    // Entonces aparece en su galería pública, sin sesión, solo con la imagen del trabajo
    app('auth')->forgetGuards();
    $gallery = $this->getJson("/api/v1/technicians/{$technician->id}/portfolio")->assertOk()->json('data');
    expect($gallery)->toHaveCount(1)
        ->and($gallery[0]['title'])->toBe('Reparación de placa base')
        ->and(array_column($gallery[0]['images'], 'media_id'))->toBe([$image->id]);
    expect(json_encode($gallery))->not->toContain('/api/v1/media/'.$document->media_id);
    expect(DB::table('portfolio_images')->where('media_id', $document->media_id)->exists())->toBeFalse();
});
