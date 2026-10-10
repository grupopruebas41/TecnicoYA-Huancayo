<?php

// TC-018 · HU-S02-03 · RF-C04, RF-C09 · AC-S02-03-02
// Permiso: announcements.manage (identificador propuesto para la capacidad «A comunicaciones» del diseño).
use Database\Factories\AnnouncementFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S02-TC-004 duplica un comunicado publicado como borrador que no aparece en ningún panel [TC-018]', function () {
    // Dado un comunicado publicado para ambos roles
    $published = AnnouncementFactory::new()->forRoles(['client', 'technician'])->create(['title' => 'Mantenimiento programado']);
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);
    $before = DB::table('announcements')->count();

    // Cuando se intenta duplicar un comunicado inexistente, no se crea nada y el mensaje está en español
    $missing = $this->postJson('/api/v1/admin/announcements/'.Str::uuid().'/duplicates');
    $missing->assertNotFound();
    Sprint01::assertSpanishText((string) $missing->json('message'));
    expect(DB::table('announcements')->count())->toBe($before);

    // Cuando el administrador duplica el publicado
    $copyId = $this->postJson("/api/v1/admin/announcements/{$published->id}/duplicates")
        ->assertCreated()->assertJsonPath('data.status', 'draft')->json('data.id');

    // Entonces existe una copia en borrador, de su autoría y con la misma audiencia
    expect($copyId)->not->toBe($published->id);
    $this->assertDatabaseHas('announcements', [
        'id' => $copyId, 'title' => 'Mantenimiento programado', 'status' => 'draft', 'created_by' => $admin->id,
    ]);
    expect(DB::table('announcement_audiences')->where('announcement_id', $copyId)->count())->toBe(2);

    // Y la copia no aparece en el panel del cliente ni del técnico; el original sí
    foreach ([UserFactory::new()->client()->create(), UserFactory::new()->technician()->create()] as $reader) {
        Sanctum::actingAs($reader);
        $items = $this->getJson('/api/v1/announcements')->assertOk()->json('data');
        expect(Sprint02::itemsWith($items, 'id', $copyId))->toBe([])
            ->and(Sprint02::itemsWith($items, 'id', $published->id))->toHaveCount(1);
    }
});
