<?php

// TC-034 · HU-S03-04 · RF-C06 · AC-S03-04-02
// Solo lectura: no hay dato que guardar, por eso no aplica la verificación de validación CRUD.
// Las reseñas públicas llegan con el Sprint 6; aquí la lista está vacía.
use Database\Factories\ClientProfileFactory;
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
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
    Storage::fake('public');
    Sprint01::actAsSpa($this);
});

it('S03-TC-005 muestra al cliente bio, servicios y portafolio del técnico sin documentos ni contacto privado [TC-034]', function () {
    // Dado un técnico con bio pública, documento privado, WhatsApp, teléfono y un trabajo publicado
    $technician = TechnicianProfileFactory::new()->approved()->create(['bio' => 'Especialista en placas de escritorio.']);
    DB::table('technician_profiles')->where('id', $technician->id)->update(['whatsapp' => '999888777']);
    $service = TechnicianServiceFactory::new()->create(['technician_id' => $technician->id, 'reference_fee' => '55.00']);
    $document = TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id]);
    $image = MediaFileFactory::new()->publicImage()->create(['owner_id' => $technician->user_id]);
    $itemId = DB::table('portfolio_items')->insertGetId(['technician_id' => $technician->id, 'title' => 'Cambio de fuente', 'status' => 'published']);
    DB::table('portfolio_images')->insert(['portfolio_id' => $itemId, 'media_id' => $image->id, 'position' => 0]);
    $pending = TechnicianProfileFactory::new()->create();

    // Cuando un cliente consulta su perfil antes de cualquier asignación
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $response = $this->getJson("/api/v1/technicians/{$technician->id}")->assertOk();

    // Entonces recibe bio, servicio con tarifa referencial y portafolio público
    expect($response->json('data.bio'))->toBe('Especialista en placas de escritorio.')
        ->and($response->json('data.services.0.subcategory_id'))->toBe($service->subcategory_id)
        ->and($response->json('data.services.0.reference_fee'))->toBe('55.00')
        ->and($response->json('data.portfolio.0.title'))->toBe('Cambio de fuente')
        ->and($response->json('data.reviews'))->toBe([]);

    // Y no recibe documentos privados, WhatsApp ni teléfono
    $content = $response->getContent();
    expect($content)->not->toContain('999888777')->not->toContain('900000010')
        ->not->toContain('/api/v1/media/'.$document->media_id)->not->toContain('documento-sintetico');
    $response->assertJsonMissingPath('data.documents')->assertJsonMissingPath('data.whatsapp')->assertJsonMissingPath('data.phone');

    // Y un perfil aún no habilitado no se publica
    $this->getJson("/api/v1/technicians/{$pending->id}")->assertNotFound();
});
