<?php

// HU-S02-04 · RF-07, RF-30, RF-33 · Bandeja, ficha, aprobación, rechazo (D-13, D-50) y suspensión (D-32, D-50).
// Contrato S2 §9. La suspensión no tiene pantalla en S2.
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
});

it('S02-TC-031 lista la bandeja de técnicos por estado sin correo, teléfono ni contraseña', function () {
    $pending = Sprint02::readyTechnician();
    $rejected = TechnicianProfileFactory::new()->create(['verification_status' => 'rejected']);
    $active = TechnicianProfileFactory::new()->approved()->create();
    $suspended = TechnicianProfileFactory::new()->approved()->create(['status' => 'suspended']);
    Sanctum::actingAs(Sprint02::admin());

    $inbox = $this->getJson('/api/v1/admin/technicians?status=pending')->assertOk();

    expect(array_column($inbox->json('data'), 'id'))->toBe([$pending->id])
        ->and($inbox->json('data.0.documents_count'))->toBe(1)
        ->and($inbox->json('data.0.verification_status'))->toBe('pending');
    expect($inbox->getContent())->not->toContain('900000010')->not->toContain('@example.test')->not->toContain('password');
    expect(array_column($this->getJson('/api/v1/admin/technicians?status=rejected')->json('data'), 'id'))->toBe([$rejected->id]);
    expect(array_column($this->getJson('/api/v1/admin/technicians?status=active')->json('data'), 'id'))->toBe([$active->id]);
    expect(array_column($this->getJson('/api/v1/admin/technicians?status=suspended')->json('data'), 'id'))->toBe([$suspended->id]);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/admin/technicians?status=todos'), ['status']);
});

it('S02-TC-032 muestra la ficha con checklist, servicios, zonas y documentos sin exponer el archivo ni datos privados', function () {
    $technician = Sprint02::readyTechnician();
    DB::table('technician_profiles')->where('id', $technician->id)->update(['bio' => 'Técnico sintético de cómputo.']);
    $document = DB::table('technician_documents')->where('technician_id', $technician->id)->sole();
    $district = DB::table('districts')->find(DB::table('technician_districts')->where('technician_id', $technician->id)->value('district_id'));
    Sanctum::actingAs(Sprint02::admin());

    $card = $this->getJson("/api/v1/admin/technicians/{$technician->id}")->assertOk();

    expect($card->json('data.checklist'))->toBe([
        'teléfono' => true, 'servicios con tarifa' => true, 'zona de atención' => true, 'experiencia declarada' => true, 'evidencia documental' => true,
    ]);
    expect($card->json('data.services'))->toHaveCount(1)->and($card->json('data.districts'))->toHaveCount(1)
        ->and($card->json('data.documents.0.id'))->toBe($document->id)
        ->and($card->json('data.documents.0.url'))->toEndWith("/api/v1/media/{$document->media_id}")
        ->and($card->json('data.reviews'))->toBe([]);
    // Refuerzo S2.6 (mutación): cada campo de la ficha, de sus servicios y de sus zonas.
    $card->assertJsonPath('data.id', $technician->id)->assertJsonPath('data.display_name', $technician->display_name)
        ->assertJsonPath('data.bio', 'Técnico sintético de cómputo.')->assertJsonPath('data.experience_years', $technician->experience_years)
        ->assertJsonPath('data.status', 'pending_verification')->assertJsonPath('data.verification_status', 'pending')
        ->assertJsonPath('data.version', $technician->version);
    expect($card->json('data.services'))->toBe([[
        'subcategory_id' => Sprint02::subcategoryId(),
        'subcategory_name' => DB::table('subcategories')->where('id', Sprint02::subcategoryId())->value('name'),
        'reference_fee' => '50.00',
    ]])->and($card->json('data.districts'))->toBe([['id' => $district->id, 'name' => $district->name]]);
    expect($card->getContent())->not->toContain('storage_key')->not->toContain('CONTENIDO-SINTETICO')
        ->not->toContain('900000010')->not->toContain('password');
    $this->getJson('/api/v1/admin/technicians/999999')->assertNotFound();
});

it('S02-TC-033 VAL-02 no aprueba a un técnico con requisitos faltantes y lista en español lo que falta', function () {
    $technician = TechnicianProfileFactory::new()->create();
    Sanctum::actingAs(Sprint02::admin());

    $response = $this->postJson("/api/v1/admin/technicians/{$technician->id}/reviews", [
        'decision' => 'approve', 'reason' => 'Revisión completa del expediente.', 'expected_version' => $technician->version,
    ]);

    Sprint01::assertSpanishValidation($response, ['decision']);
    expect($response->json('errors.decision.0'))->toContain('zona de atención')->toContain('evidencia documental')
        ->toContain('servicios con tarifa');
    $this->assertDatabaseHas('technician_profiles', ['id' => $technician->id, 'status' => 'pending_verification', 'version' => $technician->version]);
    $this->assertDatabaseCount('technician_reviews', 0);
});

it('S02-TC-034 CRUD-01 rechaza con motivo sin habilitar y deja que el técnico pida una nueva revisión', function () {
    $technician = Sprint02::readyTechnician();
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/technicians/{$technician->id}/reviews", [
        'decision' => 'reject', 'reason' => 'Falta el certificado vigente.', 'expected_version' => $technician->version,
    ])->assertCreated()->assertJsonPath('data.decision', 'reject');

    $this->assertDatabaseHas('technician_profiles', [
        'id' => $technician->id, 'status' => 'pending_verification', 'verification_status' => 'rejected', 'version' => $technician->version + 1,
    ]);
    $this->assertDatabaseHas('technician_reviews', ['technician_id' => $technician->id, 'decision' => 'reject', 'reason' => 'Falta el certificado vigente.']);
    $this->assertDatabaseHas('audit_entries', ['actor_id' => $admin->id, 'action' => 'technician.review', 'subject_id' => $technician->id]);
    // Refuerzo S2.6 (mutación): la ficha muestra la revisión con su decisión, motivo y fecha.
    $reviewedAt = DB::table('technician_reviews')->where('technician_id', $technician->id)->value('reviewed_at');
    expect($this->getJson("/api/v1/admin/technicians/{$technician->id}")->assertOk()->json('data.reviews'))->toBe([[
        'decision' => 'reject', 'reason' => 'Falta el certificado vigente.', 'reviewed_at' => Carbon::parse($reviewedAt)->toISOString(),
    ]]);

    Sprint01::forgetSession();
    Sanctum::actingAs($technician->user);
    $this->getJson('/api/v1/technicians/me/profile')->assertOk()
        ->assertJsonPath('data.verification_status', 'rejected')->assertJsonPath('data.last_review.reason', 'Falta el certificado vigente.');
    $this->postJson('/api/v1/technicians/me/verification-request', ['expected_version' => $technician->version + 1])
        ->assertOk()->assertJsonPath('data.verification_status', 'pending');
    $this->postJson('/api/v1/technicians/me/verification-request', ['expected_version' => $technician->version + 2])->assertConflict();

    Sprint01::forgetSession();
    Sanctum::actingAs($admin);
    expect(array_column($this->getJson('/api/v1/admin/technicians?status=pending')->json('data'), 'id'))->toContain($technician->id);
});

it('S02-TC-035 suspende con motivo cerrando sesiones y conservando el portafolio, y lo reactiva con motivo', function () {
    $technician = TechnicianProfileFactory::new()->approved()->create();
    $image = MediaFileFactory::new()->publicImage()->create(['owner_id' => $technician->user_id]);
    $item = DB::table('portfolio_items')->insertGetId(['technician_id' => $technician->id, 'title' => 'Trabajo previo', 'status' => 'published']);
    DB::table('portfolio_images')->insert(['portfolio_id' => $item, 'media_id' => $image->id, 'position' => 0]);
    DB::table('sessions')->insert(['id' => 'sesion-sintetica-s02', 'user_id' => $technician->user_id, 'payload' => '', 'last_activity' => now()->timestamp]);
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);

    $this->postJson("/api/v1/admin/technicians/{$technician->id}/suspension", [
        'reason' => 'Incumplimiento reiterado documentado.', 'expected_version' => $technician->version,
    ])->assertOk()->assertJsonPath('data.status', 'suspended');

    $this->assertDatabaseHas('technician_profiles', ['id' => $technician->id, 'status' => 'suspended']);
    $this->assertDatabaseMissing('sessions', ['user_id' => $technician->user_id]);
    $this->assertDatabaseHas('portfolio_items', ['id' => $item, 'status' => 'published']);
    $this->assertDatabaseHas('audit_entries', ['action' => 'technician.suspended', 'subject_id' => $technician->id, 'reason' => 'Incumplimiento reiterado documentado.']);
    Sprint01::forgetSession();
    $this->getJson("/api/v1/technicians/{$technician->id}/portfolio")->assertNotFound();

    Sanctum::actingAs($admin);
    $this->postJson("/api/v1/admin/technicians/{$technician->id}/reactivation", [
        'reason' => 'Descargo aceptado por el comité.', 'expected_version' => $technician->version + 1,
    ])->assertOk()->assertJsonPath('data.status', 'active');
    $this->assertDatabaseHas('audit_entries', ['action' => 'technician.reactivated', 'subject_id' => $technician->id]);
    Sprint01::forgetSession();
    expect($this->getJson("/api/v1/technicians/{$technician->id}/portfolio")->assertOk()->json('data'))->toHaveCount(1);
});

it('S02-TC-036 rechaza con 409 las transiciones de verificación no permitidas sin cambiar estado ni versión', function () {
    $active = TechnicianProfileFactory::new()->approved()->create();
    $suspended = TechnicianProfileFactory::new()->approved()->create(['status' => 'suspended']);
    Sanctum::actingAs(Sprint02::admin());
    $review = fn (string $decision) => ['decision' => $decision, 'reason' => 'Revisión fuera de flujo.', 'expected_version' => 1];
    $motive = ['reason' => 'Acción fuera de flujo.', 'expected_version' => 1];

    $this->postJson("/api/v1/admin/technicians/{$active->id}/reviews", $review('approve'))->assertConflict();
    $this->postJson("/api/v1/admin/technicians/{$active->id}/reviews", $review('reject'))->assertConflict();
    $this->postJson("/api/v1/admin/technicians/{$suspended->id}/suspension", $motive)->assertConflict();
    $this->postJson("/api/v1/admin/technicians/{$active->id}/reactivation", $motive)->assertConflict();

    $this->assertDatabaseHas('technician_profiles', ['id' => $active->id, 'status' => 'active', 'version' => 1]);
    $this->assertDatabaseHas('technician_profiles', ['id' => $suspended->id, 'status' => 'suspended', 'version' => 1]);
    $this->assertDatabaseCount('technician_reviews', 0);
});

it('S02-TC-037 AUTH-01 impide la autoaprobación y la verificación a un administrador sin technicians.verify', function () {
    $technician = Sprint02::readyTechnician();
    Sanctum::actingAs($technician->user);
    $approve = ['decision' => 'approve', 'reason' => 'Me apruebo a mí mismo.', 'expected_version' => $technician->version];

    $this->postJson("/api/v1/admin/technicians/{$technician->id}/reviews", $approve)->assertForbidden();

    Sprint02::revokeFromAdminRole('technicians.verify');
    Sprint01::forgetSession();
    Sanctum::actingAs(Sprint02::admin());
    $this->getJson('/api/v1/admin/technicians?status=pending')->assertForbidden();
    $this->getJson("/api/v1/admin/technicians/{$technician->id}")->assertForbidden();
    $this->postJson("/api/v1/admin/technicians/{$technician->id}/reviews", $approve)->assertForbidden();
    $this->postJson("/api/v1/admin/technicians/{$technician->id}/suspension", ['reason' => 'Sin permiso.', 'expected_version' => 1])->assertForbidden();

    $this->assertDatabaseHas('technician_profiles', ['id' => $technician->id, 'status' => 'pending_verification', 'version' => $technician->version]);
    $this->assertDatabaseCount('technician_reviews', 0);
});
