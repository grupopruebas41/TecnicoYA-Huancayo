<?php

// HU-S02-03 · RF-C04, RF-C09 · Comunicados: crear, editar (solo borrador, D-51), publicar, eliminar (retirar)
// y vigencia [inicio, fin) (D-21). Contrato S2 §8.
use Database\Factories\AnnouncementFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Carbon::setTestNow('2026-10-12 12:00:00');
    Sprint01::actAsSpa($this);
});

afterEach(fn () => Carbon::setTestNow());

function s02Announcement(array $overrides = []): array
{
    return $overrides + [
        'title' => 'Mantenimiento programado', 'body' => 'El sábado no habrá atención de 08:00 a 10:00.',
        'audiences' => ['technician'], 'starts_at' => '2026-10-12T13:00:00Z', 'ends_at' => '2026-10-14T13:00:00Z',
        'priority' => 0, 'link_url' => 'https://example.test/aviso', 'link_label' => 'Ver detalle',
    ];
}

/** IDs de los comunicados que ve un usuario en su panel. */
function s02VisibleTo(object $test, $user): array
{
    Sprint01::forgetSession();
    Sanctum::actingAs($user);

    return array_column($test->getJson('/api/v1/announcements')->assertOk()->json('data'), 'id');
}

/** Valores [antes, después] de cada auditoría de una acción, en orden de registro. */
function s02AuditValues(string $action): array
{
    $decode = fn (?string $json) => $json === null ? null : json_decode($json, true);

    return DB::table('audit_entries')->where('action', $action)->orderBy('id')->get()
        ->map(fn (object $row) => [$decode($row->before_values), $decode($row->after_values)])->all();
}

it('S02-TC-024 CRUD-01 crea un comunicado en borrador con audiencias y vigencia, sin mostrarlo en paneles', function () {
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);

    $created = $this->postJson('/api/v1/admin/announcements', s02Announcement(['starts_at' => '2026-10-12T11:00:00Z']))->assertCreated()
        ->assertJsonPath('data.status', 'draft')->assertJsonPath('data.audiences', ['technician'])
        ->assertJsonPath('data.version', 1)->assertJsonPath('data.retired_at', null);
    $id = $created->json('data.id');

    expect(DB::table('announcement_audiences')->where('announcement_id', $id)->pluck('role_id')->all())
        ->toBe([DB::table('roles')->where('code', 'technician')->value('id')]);
    expect(s02VisibleTo($this, TechnicianProfileFactory::new()->approved()->create()->user))->not->toContain($id);
    $this->assertDatabaseHas('audit_entries', ['actor_id' => $admin->id, 'action' => 'announcement.created']);
});

it('S02-TC-025 VAL-02 rechaza fechas invertidas, audiencia vacía y un enlace javascript: sin guardar nada', function () {
    Sanctum::actingAs(Sprint02::admin());

    $invalid = $this->postJson('/api/v1/admin/announcements', s02Announcement([
        'starts_at' => '2026-10-14T13:00:00Z', 'ends_at' => '2026-10-13T13:00:00Z', 'audiences' => [], 'link_url' => 'javascript:alert(1)',
    ]));

    Sprint01::assertSpanishValidation($invalid, ['ends_at', 'audiences', 'link_url']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/announcements', s02Announcement(['audiences' => ['admin']])), ['audiences.0']);
    $this->assertDatabaseCount('announcements', 0);
    $this->assertDatabaseCount('announcement_audiences', 0);
});

it('S02-TC-026 CRUD-02 edita un borrador con su versión, rechaza la versión vieja y no edita uno publicado', function () {
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);
    $draft = $this->postJson('/api/v1/admin/announcements', s02Announcement())->assertCreated()->json('data.id');
    $published = AnnouncementFactory::new()->forRoles(['client'])->create();

    $this->patchJson("/api/v1/admin/announcements/$draft", ['title' => 'Mantenimiento reprogramado', 'expected_version' => 1])
        ->assertOk()->assertJsonPath('data.title', 'Mantenimiento reprogramado')->assertJsonPath('data.version', 2);
    $this->patchJson("/api/v1/admin/announcements/$draft", ['title' => 'Título perdido', 'expected_version' => 1])
        ->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');
    $this->patchJson("/api/v1/admin/announcements/{$published->id}", ['title' => 'Cambio silencioso', 'expected_version' => 1])
        ->assertConflict()->assertJsonPath('error.code', 'ANNOUNCEMENT_NOT_EDITABLE');

    $this->assertDatabaseHas('announcements', ['id' => $draft, 'title' => 'Mantenimiento reprogramado', 'version' => 2]);
    $this->assertDatabaseHas('announcements', ['id' => $published->id, 'title' => $published->title, 'version' => 1]);

    // Refuerzo S2.6 (mutación): vigencia, audiencias, autor y auditoría de la edición; un fin que no es posterior al inicio guardado.
    Carbon::setTestNow('2026-10-12 12:30:00');
    $this->patchJson("/api/v1/admin/announcements/$draft", [
        'audiences' => ['client', 'technician'], 'starts_at' => '2026-10-13T13:00:00Z', 'ends_at' => '2026-10-16T13:00:00Z', 'expected_version' => 2,
    ])->assertOk()->assertJsonPath('data.audiences', ['client', 'technician'])->assertJsonPath('data.version', 3)
        ->assertJsonPath('data.starts_at', '2026-10-13T13:00:00.000000Z')->assertJsonPath('data.ends_at', '2026-10-16T13:00:00.000000Z');
    Sprint01::assertSpanishValidation($this->patchJson("/api/v1/admin/announcements/$draft", [
        'ends_at' => '2026-10-13T13:00:00Z', 'expected_version' => 3,
    ]), ['ends_at']);
    $this->assertDatabaseHas('announcements', [
        'id' => $draft, 'audience' => 'both', 'duration_days' => 3, 'version' => 3, 'updated_by' => $admin->id, 'updated_at' => '2026-10-12 12:30:00',
    ]);
    expect(s02AuditValues('announcement.updated'))->toBe([
        [['id' => $draft, 'title' => 'Mantenimiento programado'], ['id' => $draft, 'title' => 'Mantenimiento reprogramado']],
        [['id' => $draft, 'title' => 'Mantenimiento reprogramado'], ['id' => $draft]],
    ]);
});

it('S02-TC-027 CRUD-01 publica un borrador vigente para su audiencia y no publica uno ya vencido', function () {
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);
    $draft = $this->postJson('/api/v1/admin/announcements', s02Announcement([
        'audiences' => ['client'], 'starts_at' => '2026-10-12T11:00:00Z',
    ]))->json('data.id');
    $expired = $this->postJson('/api/v1/admin/announcements', s02Announcement([
        'starts_at' => '2026-10-10T11:00:00Z', 'ends_at' => '2026-10-11T11:00:00Z',
    ]))->json('data.id');

    Carbon::setTestNow('2026-10-12 12:10:00');
    $this->postJson("/api/v1/admin/announcements/$draft/publication", ['expected_version' => 1])
        ->assertOk()->assertJsonPath('data.status', 'published')->assertJsonPath('data.version', 2);
    Sprint01::assertSpanishValidation($this->postJson("/api/v1/admin/announcements/$expired/publication", ['expected_version' => 1]), ['ends_at']);

    $this->assertDatabaseHas('audit_entries', ['actor_id' => $admin->id, 'action' => 'announcement.published']);
    $this->assertDatabaseHas('announcements', ['id' => $expired, 'status' => 'draft']);
    $this->assertDatabaseHas('announcements', ['id' => $draft, 'version' => 2, 'updated_by' => $admin->id, 'updated_at' => '2026-10-12 12:10:00']);
    expect(s02AuditValues('announcement.published'))->toBe([[['id' => $draft, 'status' => 'draft'], ['id' => $draft, 'status' => 'published']]]);
    expect(s02VisibleTo($this, UserFactory::new()->client()->create()))->toContain($draft);
    expect(s02VisibleTo($this, TechnicianProfileFactory::new()->approved()->create()->user))->not->toContain($draft);
});

it('S02-TC-028 CRUD-01 elimina un comunicado retirándolo de los paneles, con auditoría y sin borrar la fila', function () {
    $admin = Sprint02::admin();
    $client = UserFactory::new()->client()->create();
    $announcement = AnnouncementFactory::new()->forRoles(['client', 'technician'])->create();
    $live = AnnouncementFactory::new()->forRoles(['technician'])->create();
    $draft = AnnouncementFactory::new()->forRoles(['technician'])->create(['status' => 'draft']);
    expect(s02VisibleTo($this, $client))->toContain($announcement->id);

    Sprint01::forgetSession();
    Sanctum::actingAs($admin);
    Carbon::setTestNow('2026-10-12 12:20:00');
    $this->deleteJson("/api/v1/admin/announcements/{$announcement->id}")->assertNoContent();
    $this->deleteJson("/api/v1/admin/announcements/{$announcement->id}")->assertNotFound();

    $retired = Sprint02::itemsWith($this->getJson('/api/v1/admin/announcements?status=retired')->assertOk()->json('data'), 'id', $announcement->id);
    expect($retired)->toHaveCount(1)->and($retired[0]['retired_at'])->not->toBeNull();
    $this->assertDatabaseHas('audit_entries', ['actor_id' => $admin->id, 'action' => 'announcement.retired']);

    // Refuerzo S2.6 (mutación): filtros de la bandeja, fila retirada con autor y versión, y valores auditados.
    $listed = fn (string $query) => array_column($this->getJson("/api/v1/admin/announcements$query")->assertOk()->json('data'), 'id');
    expect($listed('?status=retired'))->toBe([$announcement->id])
        ->and($listed('?status=draft'))->toBe([$draft->id])
        ->and($listed('?status=published'))->toBe([$live->id])
        ->and($listed(''))->toEqualCanonicalizing([$announcement->id, $live->id, $draft->id]);
    $this->assertDatabaseHas('announcements', [
        'id' => $announcement->id, 'status' => 'archived', 'version' => 2, 'retired_at' => '2026-10-12 12:20:00',
        'updated_by' => $admin->id, 'updated_at' => '2026-10-12 12:20:00',
    ]);
    expect(s02AuditValues('announcement.retired'))
        ->toBe([[['id' => $announcement->id, 'status' => 'published'], ['id' => $announcement->id, 'status' => 'retired']]]);
    expect(s02VisibleTo($this, $client))->not->toContain($announcement->id);
});

it('S02-TC-029 muestra el comunicado desde su inicio exacto y lo oculta exactamente al terminar [inicio, fin)', function () {
    $client = UserFactory::new()->client()->create();
    $announcement = AnnouncementFactory::new()->forRoles(['client'])->create([
        'starts_at' => Carbon::parse('2026-10-12 13:00:00'), 'ends_at' => Carbon::parse('2026-10-12 15:00:00'),
    ]);
    Sanctum::actingAs($client);

    $ids = function (string $moment) {
        Carbon::setTestNow($moment);

        return array_column($this->getJson('/api/v1/announcements')->assertOk()->json('data'), 'id');
    };

    expect($ids('2026-10-12 12:59:59'))->not->toContain($announcement->id)
        ->and($ids('2026-10-12 13:00:00'))->toContain($announcement->id)
        ->and($ids('2026-10-12 14:59:59'))->toContain($announcement->id)
        ->and($ids('2026-10-12 15:00:00'))->not->toContain($announcement->id);
});

it('S02-TC-030 AUTH-01 niega a cliente y técnico toda la administración de comunicados sin cambiar nada', function () {
    $published = AnnouncementFactory::new()->forRoles(['client'])->create();
    $draft = AnnouncementFactory::new()->forRoles(['client'])->create(['status' => 'draft']);
    $before = DB::table('announcements')->orderBy('id')->get()->toArray();

    foreach ([UserFactory::new()->client()->create(), TechnicianProfileFactory::new()->approved()->create()->user] as $actor) {
        Sprint01::forgetSession();
        Sanctum::actingAs($actor);
        $this->getJson('/api/v1/admin/announcements')->assertForbidden();
        $this->postJson('/api/v1/admin/announcements', s02Announcement())->assertForbidden();
        $this->patchJson("/api/v1/admin/announcements/{$draft->id}", ['title' => 'Intruso', 'expected_version' => 1])->assertForbidden();
        $this->postJson("/api/v1/admin/announcements/{$draft->id}/publication", ['expected_version' => 1])->assertForbidden();
        $this->deleteJson("/api/v1/admin/announcements/{$published->id}")->assertForbidden();
        $this->postJson("/api/v1/admin/announcements/{$published->id}/duplicates")->assertForbidden();
    }

    expect(DB::table('announcements')->orderBy('id')->get()->toArray())->toEqual($before);
});
