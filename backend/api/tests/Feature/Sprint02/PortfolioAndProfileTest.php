<?php

// HU-S02-05 · RF-C06, RF-33 · Portafolio (editar y retirar), documentos privados y perfil propio del técnico
// (D-46, D-47, D-50; contrato S2 §5). Archivos en discos falsos.
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianDocumentFactory;
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
});

/** Trabajo publicado de un técnico con una imagen propia; devuelve [id del trabajo, id de la imagen]. */
function s02PortfolioItem(object $technician, string $title = 'Reparación de placa base'): array
{
    $image = MediaFileFactory::new()->publicImage()->create(['owner_id' => $technician->user_id]);
    $id = DB::table('portfolio_items')->insertGetId(['technician_id' => $technician->id, 'title' => $title, 'status' => 'published']);
    DB::table('portfolio_images')->insert(['portfolio_id' => $id, 'media_id' => $image->id, 'position' => 0]);

    return [$id, $image->id];
}

it('S02-TC-042 CRUD-01 edita y retira un trabajo propio: sale de la galería y se conservan filas e imágenes', function () {
    $technician = TechnicianProfileFactory::new()->approved()->create();
    [$item] = s02PortfolioItem($technician);
    $images = MediaFileFactory::new()->publicImage()->count(6)->create(['owner_id' => $technician->user_id])->pluck('id')->all();
    Sanctum::actingAs($technician->user);
    $url = "/api/v1/technicians/me/portfolio/$item";

    Sprint01::assertSpanishValidation($this->patchJson($url, ['media_ids' => $images, 'expected_version' => 1]), ['media_ids']);
    $this->patchJson($url, ['title' => 'Cambio de compresor', 'media_ids' => [$images[0]], 'expected_version' => 1])->assertOk()
        ->assertJsonPath('data.title', 'Cambio de compresor')->assertJsonPath('data.version', 2)
        ->assertJsonPath('data.images.0.media_id', $images[0]);
    Sprint01::forgetSession();
    expect($this->getJson("/api/v1/technicians/{$technician->id}/portfolio")->json('data.0.title'))->toBe('Cambio de compresor');

    Sanctum::actingAs($technician->user);
    $this->deleteJson($url)->assertNoContent();
    $this->deleteJson($url)->assertNotFound();

    Sprint01::forgetSession();
    expect($this->getJson("/api/v1/technicians/{$technician->id}/portfolio")->assertOk()->json('data'))->toBe([]);
    $this->assertDatabaseHas('portfolio_items', ['id' => $item, 'status' => 'retired']);
    $this->assertDatabaseHas('portfolio_images', ['portfolio_id' => $item, 'media_id' => $images[0]]);
    $this->assertDatabaseHas('media_files', ['id' => $images[0], 'retired_at' => null]);
});

it('S02-TC-043 AUTH-01 no deja editar ni retirar el trabajo de otro técnico', function () {
    $owner = TechnicianProfileFactory::new()->approved()->create();
    [$item] = s02PortfolioItem($owner);
    $before = DB::table('portfolio_items')->find($item);
    Sanctum::actingAs(TechnicianProfileFactory::new()->approved()->create()->user);

    $this->patchJson("/api/v1/technicians/me/portfolio/$item", ['title' => 'Trabajo ajeno', 'expected_version' => 1])->assertNotFound();
    $this->deleteJson("/api/v1/technicians/me/portfolio/$item")->assertNotFound();

    expect(DB::table('portfolio_items')->find($item))->toEqual($before);
});

it('S02-TC-044 CRUD-01 guarda documentos privados: solo el dueño y el verificador los descargan y hay un máximo de 5 [TC-020]', function () {
    $technician = TechnicianProfileFactory::new()->create();
    $portfolioImage = MediaFileFactory::new()->publicImage()->create(['owner_id' => $technician->user_id]);
    Sanctum::actingAs($technician->user);

    $upload = $this->post('/api/v1/media', ['file' => Sprint02::upload('documento.pdf'), 'purpose' => 'document'], ['Accept' => 'application/json'])
        ->assertCreated()->assertJsonPath('data.visibility', 'private')->assertJsonPath('data.mime_type', 'application/pdf');
    $media = $upload->json('data.id');
    $this->postJson('/api/v1/technicians/me/documents', ['media_id' => $media, 'document_type' => 'Certificado técnico'])
        ->assertCreated()->assertJsonPath('data.review_status', 'pending');
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/documents', ['media_id' => $media, 'document_type' => 'Copia']), ['media_id']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/documents', [
        'media_id' => $portfolioImage->id, 'document_type' => 'Foto',
    ]), ['media_id']);
    expect(array_column($this->getJson('/api/v1/technicians/me/profile')->json('data.documents'), 'media_id'))->toBe([$media]);
    $this->get($upload->json('data.url'))->assertOk();

    Sprint01::forgetSession();
    $this->get($upload->json('data.url'))->assertNotFound();
    Sanctum::actingAs(TechnicianProfileFactory::new()->approved()->create()->user);
    $this->get($upload->json('data.url'))->assertNotFound();
    Sprint01::forgetSession();
    Sanctum::actingAs(Sprint02::admin());
    $this->get($upload->json('data.url'))->assertOk();

    TechnicianDocumentFactory::new()->count(4)->create(['technician_id' => $technician->id]);
    $sixth = MediaFileFactory::new()->privateDocument()->create(['owner_id' => $technician->user_id, 'purpose' => 'document']);
    Sprint01::forgetSession();
    Sanctum::actingAs($technician->user);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/documents', [
        'media_id' => $sixth->id, 'document_type' => 'Sexto documento',
    ]), ['media_id']);
    expect(DB::table('technician_documents')->where('technician_id', $technician->id)->count())->toBe(5);
});

it('S02-TC-045 CRUD-01 lee el perfil técnico propio completo y edita bio y experiencia con versión', function () {
    $technician = TechnicianProfileFactory::new()->approved()->create();
    DB::table('portfolio_items')->insert(['technician_id' => $technician->id, 'title' => 'Borrador privado', 'status' => 'draft']);
    DB::table('technician_pauses')->insert(['technician_id' => $technician->id, 'starts_at' => now()->addDay(), 'reason' => 'Viaje']);
    TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id]);
    Sanctum::actingAs($technician->user);

    $profile = $this->getJson('/api/v1/technicians/me/profile')->assertOk();

    $profile->assertJsonPath('data.id', $technician->id)->assertJsonPath('data.status', 'active')
        ->assertJsonPath('data.verification_status', 'approved')->assertJsonPath('data.portfolio.0.status', 'draft')
        ->assertJsonPath('data.availability.pause.reason', 'Viaje')->assertJsonPath('data.last_review', null);
    expect($profile->json('data.documents'))->toHaveCount(1);
    expect($profile->getContent())->not->toContain('@example.test')->not->toContain('password');
    $version = $profile->json('data.version');

    $this->patchJson('/api/v1/technicians/me/profile', [
        'bio' => 'Diez años en refrigeración comercial.', 'experience_years' => 10, 'expected_version' => $version,
    ])->assertOk()->assertJsonPath('data.bio', 'Diez años en refrigeración comercial.')->assertJsonPath('data.version', $version + 1);
    Sprint01::assertSpanishValidation($this->patchJson('/api/v1/technicians/me/profile', [
        'status' => 'active', 'experience_years' => 61, 'expected_version' => $version + 1,
    ]), ['status', 'experience_years']);
    $this->assertDatabaseHas('technician_profiles', ['id' => $technician->id, 'experience_years' => 10, 'version' => $version + 1]);

    Sprint01::forgetSession();
    Sanctum::actingAs(UserFactory::new()->client()->create());
    $this->getJson('/api/v1/technicians/me/profile')->assertForbidden();
});
