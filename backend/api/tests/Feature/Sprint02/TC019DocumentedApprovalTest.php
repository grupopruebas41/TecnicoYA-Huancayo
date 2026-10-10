<?php

// TC-019 · HU-S02-04 · RF-07, RF-30, RF-33 · AC-S02-04-01
// Requisitos de aprobación según RN-24 (teléfono, servicios con tarifa, zona, experiencia y evidencia).
// Permiso: technicians.verify (identificador propuesto para la capacidad «A verificador» del diseño).
use Database\Factories\DistrictFactory;
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
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
});

it('S02-TC-005 aprueba al técnico pendiente y registra la decisión, su autor y su fecha [TC-019]', function () {
    // Dado un perfil pendiente con teléfono, servicio con tarifa, zona y evidencia
    $technician = TechnicianProfileFactory::new()->create();
    TechnicianServiceFactory::new()->create(['technician_id' => $technician->id]);
    DB::table('technician_districts')->insert(['technician_id' => $technician->id, 'district_id' => DistrictFactory::new()->create()->id]);
    $document = TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id]);
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);
    $url = "/api/v1/admin/technicians/{$technician->id}/reviews";

    // Cuando aprueba sin motivo, no se guarda nada y el mensaje está en español
    $invalid = $this->postJson($url, ['decision' => 'approve', 'reason' => '', 'expected_version' => $technician->version]);
    Sprint01::assertSpanishValidation($invalid, ['reason']);
    $this->assertDatabaseCount('technician_reviews', 0);
    $this->assertDatabaseHas('technician_profiles', ['id' => $technician->id, 'status' => 'pending_verification']);

    // Cuando el administrador autorizado aprueba la revisión
    $this->postJson($url, [
        'decision' => 'approve',
        'reason' => 'Identidad, servicios, zona y evidencia revisados.',
        'expected_version' => $technician->version,
    ])->assertCreated()->assertJsonPath('data.decision', 'approve');

    // Entonces se registra la decisión con autor, fecha y evidencia revisada
    $review = DB::table('technician_reviews')->where('technician_id', $technician->id)->sole();
    expect($review->reviewer_id)->toBe($admin->id)
        ->and($review->decision)->toBe('approve')
        ->and($review->reviewed_at)->not->toBeNull();
    $this->assertDatabaseHas('review_documents', ['review_id' => $review->id, 'document_id' => $document->id]);

    // Y el perfil queda habilitado, con la intervención auditada
    $this->assertDatabaseHas('technician_profiles', [
        'id' => $technician->id, 'status' => 'active', 'verification_status' => 'approved', 'verified_by' => $admin->id,
    ]);
    $this->assertDatabaseHas('audit_entries', [
        'actor_id' => $admin->id, 'action' => 'technician.review', 'subject_type' => 'technician_profile', 'subject_id' => $technician->id,
    ]);
});
