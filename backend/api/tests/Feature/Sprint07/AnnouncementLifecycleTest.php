<?php

// S07-TC-098 a 104 · Adelanto del Sprint 7 (bloque B, D-84) · Editar un comunicado en cualquier estado, restaurar
// un retirado como borrador y eliminarlo de forma definitiva. «Retirar» sigue igual (S02-TC-028): eliminar es la
// acción nueva, solo para borradores, vencidos y retirados, con confirmación escrita y auditoría con la foto previa.
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint07;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Carbon::setTestNow('2026-10-27 12:00:00');
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->admin = Sprint02::admin();
});

afterEach(fn () => Carbon::setTestNow());

function s07lBanner(object $test, int $width = 1920, int $height = 640): int
{
    return $test->actingAs($test->admin)->post('/api/v1/media', ['purpose' => 'announcement',
        'file' => Sprint07::jpeg($width, $height)], ['Accept' => 'application/json'])->assertCreated()->json('data.id');
}

function s07lMake(object $test, array $overrides = [], bool $publish = true): array
{
    $item = $test->actingAs($test->admin)->postJson('/api/v1/admin/announcements', $overrides + [
        'source' => 'image', 'kind' => 'promotion', 'title' => 'Campaña de mantenimiento', 'image_media_id' => s07lBanner($test),
        'alt_text' => 'Promoción: 20 % de descuento en mantenimiento preventivo', 'audiences' => ['client'],
        'starts_at' => '2026-10-27T11:00:00Z', 'ends_at' => '2026-11-03T11:00:00Z',
    ])->assertCreated()->json('data');

    return $publish ? $test->actingAs($test->admin)->postJson("/api/v1/admin/announcements/{$item['id']}/publication",
        ['expected_version' => $item['version']])->assertOk()->json('data') : $item;
}

function s07lAdminItem(object $test, string $id): ?array
{
    return collect($test->actingAs($test->admin)->getJson('/api/v1/admin/announcements')->assertOk()->json('data'))->firstWhere('id', $id);
}

function s07lAudit(string $action): array
{
    return DB::table('audit_entries')->where('action', $action)->orderBy('id')->get()
        ->map(fn (object $row) => [json_decode((string) $row->before_values, true), json_decode((string) $row->after_values, true)])->all();
}

function s07lDelete(object $test, array $item, string $confirmation = 'ELIMINAR', ?int $version = null)
{
    return $test->actingAs($test->admin)->deleteJson("/api/v1/admin/announcements/{$item['id']}/permanent",
        ['expected_version' => $version ?? $item['version'], 'confirmation' => $confirmation]);
}

it('S07-TC-098 edita un comunicado vigente con su versión: se ve de inmediato en el panel, rechaza la versión vieja y audita antes y después', function () {
    $live = s07lMake($this);
    $edited = $this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$live['id']}", [
        'title' => 'Campaña de mantenimiento 25 %', 'kind' => 'notice', 'alt_text' => 'Promoción: 25 % de descuento en mantenimiento preventivo',
        'expected_version' => $live['version'],
    ])->assertOk()->json('data');
    expect($edited)->toMatchArray(['status' => 'published', 'phase' => 'active', 'version' => $live['version'] + 1, 'kind' => 'notice']);

    $stale = $this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$live['id']}",
        ['title' => 'Cambio perdido', 'expected_version' => $live['version']]);
    $stale->assertStatus(409)->assertJsonPath('error.code', 'STALE_VERSION');
    expect(DB::table('announcements')->where('id', $live['id'])->value('title'))->toBe('Campaña de mantenimiento 25 %');

    Sprint01::forgetSession();
    Sanctum::actingAs(UserFactory::new()->client()->create());
    $feed = $this->getJson('/api/v1/announcements')->assertOk()->json('data');
    expect($feed)->toHaveCount(1)->and($feed[0])->toMatchArray(['title' => 'Campaña de mantenimiento 25 %', 'kind' => 'notice',
        'alt_text' => 'Promoción: 25 % de descuento en mantenimiento preventivo']);

    expect(s07lAudit('announcement.published_edited'))->toBe([[
        ['id' => $live['id'], 'title' => 'Campaña de mantenimiento', 'kind' => 'promotion', 'alt_text' => 'Promoción: 20 % de descuento en mantenimiento preventivo'],
        ['id' => $live['id'], 'title' => 'Campaña de mantenimiento 25 %', 'kind' => 'notice', 'alt_text' => 'Promoción: 25 % de descuento en mantenimiento preventivo'],
    ]]);
    expect(DB::table('audit_entries')->where('action', 'announcement.updated')->count())->toBe(0);
});

it('S07-TC-099 reemplaza la imagen principal y la móvil de un publicado, y el enlace de un Genially, validando el reemplazo', function () {
    $live = s07lMake($this);
    $mobile = s07lBanner($this, 1080, 720);
    $main = s07lBanner($this);
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$live['id']}",
        ['image_media_id' => s07lBanner($this, 1920, 1080), 'expected_version' => $live['version']]), ['image_media_id']);

    $edited = $this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$live['id']}",
        ['image_media_id' => $main, 'mobile_media_id' => $mobile, 'expected_version' => $live['version']])->assertOk()->json('data');
    expect($edited)->toMatchArray(['image_media_id' => $main, 'mobile_media_id' => $mobile, 'version' => $live['version'] + 1])
        ->and($edited['image_url'])->toEndWith("/api/v1/media/$main");

    $genially = s07lMake($this, ['source' => 'genially', 'image_media_id' => null, 'genially_url' => 'https://view.genially.com/66f1c2a0b3e4d5f6']);
    $this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$genially['id']}",
        ['genially_url' => 'https://view.genially.com/77a2d3b4c5/novedades?x=1', 'expected_version' => $genially['version']])
        ->assertOk()->assertJsonPath('data.genially_url', 'https://view.genially.com/77a2d3b4c5/novedades');
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$genially['id']}",
        ['genially_url' => 'https://genially.example.test/77a2d3b4c5', 'expected_version' => $genially['version'] + 1]), ['genially_url']);
});

it('S07-TC-100 restaura un retirado como borrador con su versión y auditoría; antes de restaurarlo no se edita', function () {
    $live = s07lMake($this);
    $other = s07lMake($this, ['title' => 'Otro comunicado']);
    $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$live['id']}")->assertNoContent();
    $retired = s07lAdminItem($this, $live['id']);

    $this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$live['id']}", ['title' => 'Sin restaurar', 'expected_version' => $retired['version']])
        ->assertStatus(409)->assertJsonPath('error.code', 'ANNOUNCEMENT_RETIRED');
    $this->actingAs($this->admin)->postJson("/api/v1/admin/announcements/{$live['id']}/restoration", ['expected_version' => $retired['version'] - 1])
        ->assertStatus(409)->assertJsonPath('error.code', 'STALE_VERSION');
    $this->actingAs($this->admin)->postJson("/api/v1/admin/announcements/{$other['id']}/restoration", ['expected_version' => $other['version']])
        ->assertStatus(409)->assertJsonPath('error.code', 'ANNOUNCEMENT_NOT_RETIRED');

    $draft = $this->actingAs($this->admin)->postJson("/api/v1/admin/announcements/{$live['id']}/restoration", ['expected_version' => $retired['version']])
        ->assertOk()->json('data');
    expect($draft)->toMatchArray(['status' => 'draft', 'phase' => 'draft', 'retired_at' => null, 'version' => $retired['version'] + 1,
        'positions' => ['client' => 3]]);
    expect(s07lAudit('announcement.restored'))->toBe([[['id' => $live['id'], 'status' => 'retired'], ['id' => $live['id'], 'status' => 'draft']]]);
    $this->actingAs($this->admin)->patchJson("/api/v1/admin/announcements/{$live['id']}", ['title' => 'Corregido', 'expected_version' => $draft['version']])
        ->assertOk()->assertJsonPath('data.title', 'Corregido');
});

it('S07-TC-101 elimina de forma definitiva un borrador, un vencido y un retirado, con auditoría de la foto previa', function () {
    $draft = s07lMake($this, ['title' => 'Borrador para eliminar', 'audiences' => ['client', 'technician']], false);
    $expired = s07lMake($this, ['title' => 'Vencido para eliminar', 'ends_at' => '2026-10-27T12:30:00Z']);
    $retiredLive = s07lMake($this, ['title' => 'Retirado para eliminar']);
    $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$retiredLive['id']}")->assertNoContent();
    $retired = s07lAdminItem($this, $retiredLive['id']);
    Carbon::setTestNow('2026-10-27 13:00:00');
    $expired = s07lAdminItem($this, $expired['id']);
    expect($expired['phase'])->toBe('expired');

    foreach ([$draft, $expired, $retired] as $item) {
        s07lDelete($this, $item)->assertOk()->assertJsonPath('data.id', $item['id']);
        $this->assertDatabaseMissing('announcements', ['id' => $item['id']]);
        $this->assertDatabaseMissing('announcement_audiences', ['announcement_id' => $item['id']]);
    }
    s07lDelete($this, $draft)->assertNotFound();

    $snapshots = s07lAudit('announcement.deleted');
    expect($snapshots)->toHaveCount(3)->and($snapshots[0][0])->toMatchArray([
        'id' => $draft['id'], 'title' => 'Borrador para eliminar', 'status' => 'draft', 'source' => 'image', 'kind' => 'promotion',
        'audiences' => ['client', 'technician'], 'starts_at' => '2026-10-27T11:00:00.000000Z', 'ends_at' => '2026-11-03T11:00:00.000000Z',
        'image_media_id' => $draft['image_media_id'],
    ])->and($snapshots[1][0]['status'])->toBe('published')->and($snapshots[2][0]['status'])->toBe('retired');
    expect(DB::table('audit_entries')->where('action', 'announcement.deleted')->pluck('actor_id')->unique()->all())->toBe([$this->admin->id]);
});

it('S07-TC-102 al eliminar retira las imágenes que ningún otro comunicado usa y reordena el carrusel que queda', function () {
    $first = s07lMake($this, ['title' => 'Primero']);
    $shared = s07lMake($this, ['title' => 'Imagen compartida', 'mobile_media_id' => s07lBanner($this, 1080, 720)], false);
    $third = s07lMake($this, ['title' => 'Tercero']);
    $copyId = $this->actingAs($this->admin)->postJson("/api/v1/admin/announcements/{$shared['id']}/duplicates")->assertCreated()->json('data.id');
    expect(collect([$first, $shared, $third])->map(fn ($item) => s07lAdminItem($this, $item['id'])['positions']['client'])->all())->toBe([1, 2, 3]);

    s07lDelete($this, $shared)->assertOk();
    expect(DB::table('media_files')->whereIn('id', [$shared['image_media_id'], $shared['mobile_media_id']])->whereNotNull('retired_at')->count())->toBe(0);
    s07lDelete($this, s07lAdminItem($this, $copyId))->assertOk();
    expect(DB::table('media_files')->whereIn('id', [$shared['image_media_id'], $shared['mobile_media_id']])->whereNotNull('retired_at')->count())->toBe(2)
        ->and(DB::table('media_files')->where('id', $first['image_media_id'])->value('retired_at'))->toBeNull();

    expect(s07lAdminItem($this, $first['id'])['positions']['client'])->toBe(1)
        ->and(s07lAdminItem($this, $third['id'])['positions']['client'])->toBe(2);
    expect(s07lAudit('announcement.deleted')[1][1])->toMatchArray(['id' => $copyId,
        'retired_media' => [$shared['image_media_id'], $shared['mobile_media_id']]]);
});

it('S07-TC-103 no elimina un vigente ni un programado, ni sin escribir ELIMINAR ni con la versión vieja', function () {
    $live = s07lMake($this, ['title' => 'Vigente']);
    $scheduled = s07lMake($this, ['title' => 'Programado', 'starts_at' => '2026-10-29T11:00:00Z']);
    $draft = s07lMake($this, ['title' => 'Borrador'], false);

    foreach ([$live, $scheduled] as $item) {
        $response = s07lDelete($this, $item)->assertStatus(409)->assertJsonPath('error.code', 'ANNOUNCEMENT_DELETE_PUBLISHED');
        Sprint01::assertSpanishText((string) $response->json('message'));
    }
    Sprint01::assertSpanishValidation(s07lDelete($this, $draft, 'eliminar'), ['confirmation']);
    Sprint01::assertSpanishValidation(s07lDelete($this, $draft, ''), ['confirmation']);
    s07lDelete($this, $draft, 'ELIMINAR', $draft['version'] + 1)->assertStatus(409)->assertJsonPath('error.code', 'STALE_VERSION');

    expect(DB::table('announcements')->count())->toBe(3)->and(DB::table('audit_entries')->where('action', 'announcement.deleted')->count())->toBe(0);
});

it('S07-TC-104 niega a cliente y técnico editar un publicado, restaurar y eliminar, sin cambiar nada', function () {
    $live = s07lMake($this);
    $draft = s07lMake($this, ['title' => 'Borrador'], false);
    $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$draft['id']}")->assertNoContent();
    $before = DB::table('announcements')->orderBy('id')->get()->toArray();

    foreach ([UserFactory::new()->client()->create(), TechnicianProfileFactory::new()->approved()->create()->user] as $actor) {
        Sprint01::forgetSession();
        Sanctum::actingAs($actor);
        $this->patchJson("/api/v1/admin/announcements/{$live['id']}", ['title' => 'Intruso', 'expected_version' => $live['version']])->assertForbidden();
        $this->postJson("/api/v1/admin/announcements/{$draft['id']}/restoration", ['expected_version' => 2])->assertForbidden();
        $this->deleteJson("/api/v1/admin/announcements/{$draft['id']}/permanent", ['expected_version' => 2, 'confirmation' => 'ELIMINAR'])->assertForbidden();
    }

    expect(DB::table('announcements')->orderBy('id')->get()->toArray())->toEqual($before);
});
