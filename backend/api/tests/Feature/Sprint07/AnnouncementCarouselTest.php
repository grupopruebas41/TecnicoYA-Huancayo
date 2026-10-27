<?php

// S07-TC-078 a 087 · Adelanto del Sprint 7 (bloque B, D-83) · Comunicados en carrusel: origen imagen o Genially,
// tipo, texto alternativo, imagen principal y móvil revisadas con medidas validadas en el servidor, orden por
// audiencia, despublicar y fase de vigencia. Las pruebas S2 de comunicados (S02-TC-003, 004 y 024 a 030) siguen
// cubriendo el comunicado de texto, que la API conserva cuando no se envía `source`.
use Database\Factories\AnnouncementFactory;
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
    Carbon::setTestNow('2026-10-26 12:00:00');
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->admin = Sprint02::admin();
});

afterEach(fn () => Carbon::setTestNow());

function s07Banner(object $test, int $width = 1920, int $height = 640, ?int $bytes = null, bool $exif = false): int
{
    return $test->actingAs($test->admin)->post('/api/v1/media', ['purpose' => 'announcement',
        'file' => Sprint07::jpeg($width, $height, $bytes, $exif)], ['Accept' => 'application/json'])->assertCreated()->json('data.id');
}

function s07Carousel(array $overrides = []): array
{
    return $overrides + [
        'source' => 'image', 'kind' => 'promotion', 'title' => 'Campaña de mantenimiento',
        'alt_text' => 'Promoción: 20 % de descuento en mantenimiento preventivo hasta fin de mes',
        'audiences' => ['client'], 'starts_at' => '2026-10-26T11:00:00Z', 'ends_at' => '2026-11-02T11:00:00Z',
    ];
}

function s07Create(object $test, array $payload): array
{
    return $test->actingAs($test->admin)->postJson('/api/v1/admin/announcements', $payload)->assertCreated()->json('data');
}

function s07Publish(object $test, array $item): array
{
    return $test->actingAs($test->admin)->postJson("/api/v1/admin/announcements/{$item['id']}/publication",
        ['expected_version' => $item['version']])->assertOk()->json('data');
}

function s07Feed(object $test, string $role): array
{
    Sprint01::forgetSession();
    Sanctum::actingAs(UserFactory::new()->{$role}()->create());

    return $test->getJson('/api/v1/announcements')->assertOk()->json('data');
}

it('S07-TC-078 la imagen de comunicado exige announcements.manage, JPG o WebP de hasta 600 KB y se guarda sin EXIF', function () {
    Sprint01::forgetSession();
    $this->actingAs(UserFactory::new()->client()->create())->post('/api/v1/media', ['purpose' => 'announcement',
        'file' => Sprint07::jpeg(1920, 640)], ['Accept' => 'application/json'])->assertForbidden();
    Sprint01::forgetSession();

    $png = $this->actingAs($this->admin)->post('/api/v1/media', ['purpose' => 'announcement',
        'file' => Sprint02::upload('foto.png')], ['Accept' => 'application/json']);
    Sprint01::assertSpanishValidation($png, ['file']);
    $tooBig = $this->actingAs($this->admin)->post('/api/v1/media', ['purpose' => 'announcement',
        'file' => Sprint07::jpeg(1920, 640, 600 * 1024 + 1)], ['Accept' => 'application/json']);
    Sprint01::assertSpanishValidation($tooBig, ['file']);
    expect($tooBig->json('errors.file.0'))->toContain('600 KB');

    $limit = s07Banner($this, 1920, 640, 600 * 1024);
    $clean = s07Banner($this, 1920, 640, null, true);
    $stored = DB::table('media_files')->where('id', $clean)->first();
    expect($stored->purpose)->toBe('announcement')->and($stored->scan_status)->toBe('clean')
        ->and(Storage::disk('public')->get($stored->storage_key))->not->toContain("Exif\0\0")
        ->and(DB::table('media_files')->where('id', $limit)->value('byte_size'))->toBe(600 * 1024);

    Sprint02::revokeFromAdminRole('announcements.manage');
    $this->actingAs($this->admin)->post('/api/v1/media', ['purpose' => 'announcement',
        'file' => Sprint07::jpeg(1920, 640)], ['Accept' => 'application/json'])->assertForbidden();
});

it('S07-TC-079 el comunicado de imagen exige imagen 3:1 de al menos 1440 × 480, texto alternativo y tipo', function () {
    $missing = $this->actingAs($this->admin)->postJson('/api/v1/admin/announcements',
        ['source' => 'image', 'title' => 'Sin imagen', 'audiences' => ['client'], 'starts_at' => '2026-10-26T13:00:00Z', 'ends_at' => '2026-10-27T13:00:00Z']);
    Sprint01::assertSpanishValidation($missing, ['image_media_id', 'alt_text', 'kind']);

    foreach ([[1440, 479], [1920, 1080], [1200, 400]] as [$width, $height]) {
        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/announcements', s07Carousel(['image_media_id' => s07Banner($this, $width, $height)]));
        Sprint01::assertSpanishValidation($response, ['image_media_id']);
    }
    $avatar = $this->actingAs($this->admin)->post('/api/v1/media', ['purpose' => 'avatar',
        'file' => Sprint07::jpeg(1920, 640)], ['Accept' => 'application/json'])->json('data.id');
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/announcements',
        s07Carousel(['image_media_id' => $avatar])), ['image_media_id']);
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/announcements',
        s07Carousel(['image_media_id' => s07Banner($this), 'kind' => 'oferta'])), ['kind']);
    expect(DB::table('announcements')->count())->toBe(0);

    $image = s07Banner($this, 1440, 480);
    $item = s07Create($this, s07Carousel(['image_media_id' => $image]));
    expect($item)->toMatchArray(['source' => 'image', 'kind' => 'promotion', 'image_media_id' => $image,
        'image_url' => url("/api/v1/media/$image"), 'mobile_image_url' => null, 'genially_url' => null, 'body' => '',
        'alt_text' => 'Promoción: 20 % de descuento en mantenimiento preventivo hasta fin de mes', 'status' => 'draft']);
});

it('S07-TC-080 la imagen móvil es opcional, solo para el origen imagen y en proporción 3:2 de al menos 810 × 540', function () {
    $base = ['image_media_id' => s07Banner($this)];
    foreach ([[1080, 640], [800, 533]] as [$width, $height]) {
        Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/announcements',
            s07Carousel($base + ['mobile_media_id' => s07Banner($this, $width, $height)])), ['mobile_media_id']);
    }
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/announcements',
        s07Carousel(['source' => 'genially', 'genially_url' => 'https://view.genially.com/66f1c2a0b3e4d5f6a7b8c9d0',
            'mobile_media_id' => s07Banner($this, 1080, 720)])), ['mobile_media_id']);

    $mobile = s07Banner($this, 810, 540);
    $item = s07Create($this, s07Carousel($base + ['mobile_media_id' => $mobile]));
    expect($item['mobile_media_id'])->toBe($mobile)->and($item['mobile_image_url'])->toBe(url("/api/v1/media/$mobile"));
});

it('S07-TC-081 el enlace de Genially solo acepta https://view.genially.com/<id> y se normaliza', function () {
    $rejected = ['http://view.genially.com/66f1c2a0b3e4d5f6a7b8c9d0', 'https://view.genially.com.evil.test/66f1c2a0b3e4d5f6a7b8c9d0',
        'https://genially.com/66f1c2a0b3e4d5f6a7b8c9d0', 'https://view.genially.com/', 'javascript:alert(1)',
        'https://user@view.genially.com/66f1c2a0b3e4d5f6a7b8c9d0', 'https://view.genially.com:8443/66f1c2a0b3e4d5f6a7b8c9d0',
        'https://view.genially.com/66f1c2/../../evil', 'https://view.genially.com/<script>'];
    foreach ($rejected as $url) {
        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/announcements', s07Carousel(['source' => 'genially', 'genially_url' => $url]));
        Sprint01::assertSpanishValidation($response, ['genially_url']);
    }
    expect(DB::table('announcements')->count())->toBe(0);

    $item = s07Create($this, s07Carousel(['source' => 'genially',
        'genially_url' => ' https://VIEW.Genially.com/66f1c2a0b3e4d5f6a7b8c9d0/interactive-content-promo/?utm_source=x#inicio ']));
    expect($item)->toMatchArray(['source' => 'genially', 'genially_url' => 'https://view.genially.com/66f1c2a0b3e4d5f6a7b8c9d0',
        'image_media_id' => null]);
    $cover = s07Banner($this);
    $withCover = s07Create($this, s07Carousel(['source' => 'genially', 'genially_url' => 'https://view.genially.com/abc123def456',
        'image_media_id' => $cover]));
    expect($withCover['image_url'])->toBe(url("/api/v1/media/$cover"));
});

it('S07-TC-082 el panel recibe los comunicados vigentes de su audiencia en el orden del carrusel, con sus datos de imagen o Genially', function () {
    $legacy = AnnouncementFactory::new()->forRoles(['client', 'technician'])->create(['title' => 'Aviso de texto']);
    $image = s07Banner($this);
    $mobile = s07Banner($this, 1080, 720);
    $promo = s07Publish($this, s07Create($this, s07Carousel(['image_media_id' => $image, 'mobile_media_id' => $mobile,
        'audiences' => ['client', 'technician'], 'link_url' => 'https://example.test/promo', 'link_label' => 'Ver promoción'])));
    $genially = s07Publish($this, s07Create($this, s07Carousel(['source' => 'genially', 'kind' => 'news', 'title' => 'Novedades',
        'genially_url' => 'https://view.genially.com/abc123def456', 'alt_text' => 'Presentación interactiva de las novedades de noviembre'])));
    s07Create($this, s07Carousel(['image_media_id' => s07Banner($this), 'title' => 'Borrador oculto']));

    $client = s07Feed($this, 'client');
    expect(array_column($client, 'id'))->toBe([$promo['id'], $genially['id'], $legacy->id]);
    expect($client[0])->toMatchArray(['source' => 'image', 'kind' => 'promotion', 'image_url' => url("/api/v1/media/$image"),
        'mobile_image_url' => url("/api/v1/media/$mobile"), 'genially_url' => null, 'link_url' => 'https://example.test/promo',
        'alt_text' => 'Promoción: 20 % de descuento en mantenimiento preventivo hasta fin de mes', 'position' => 1])
        ->and($client[1])->toMatchArray(['source' => 'genially', 'genially_url' => 'https://view.genially.com/abc123def456', 'image_url' => null])
        ->and($client[2])->toMatchArray(['source' => 'text', 'title' => 'Aviso de texto', 'image_url' => null]);
    expect(array_column(s07Feed($this, 'technician'), 'id'))->toBe([$promo['id'], $legacy->id]);
});

it('S07-TC-083 reordena el carrusel de una audiencia con el conjunto completo, sin tocar la otra, con permiso y auditoría', function () {
    $both = s07Publish($this, s07Create($this, s07Carousel(['image_media_id' => s07Banner($this), 'audiences' => ['client', 'technician'], 'title' => 'Ambos'])));
    $first = s07Publish($this, s07Create($this, s07Carousel(['image_media_id' => s07Banner($this), 'title' => 'Clientes A'])));
    $draft = s07Create($this, s07Carousel(['image_media_id' => s07Banner($this), 'title' => 'Clientes borrador']));
    $technicians = s07Create($this, s07Carousel(['image_media_id' => s07Banner($this), 'audiences' => ['technician'], 'title' => 'Técnicos']));
    $order = [$draft['id'], $first['id'], $both['id']];

    Sprint01::forgetSession();
    $this->actingAs(UserFactory::new()->client()->create())->putJson('/api/v1/admin/announcements/order', ['audience' => 'client', 'ids' => $order])->assertForbidden();
    Sprint01::forgetSession();
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->putJson('/api/v1/admin/announcements/order',
        ['audience' => 'client', 'ids' => [$first['id'], $both['id']]]), ['ids']);
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->putJson('/api/v1/admin/announcements/order',
        ['audience' => 'client', 'ids' => [...$order, $technicians['id']]]), ['ids']);
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->putJson('/api/v1/admin/announcements/order',
        ['audience' => 'admin', 'ids' => $order]), ['audience']);

    $this->actingAs($this->admin)->putJson('/api/v1/admin/announcements/order', ['audience' => 'client', 'ids' => $order])
        ->assertOk()->assertJsonPath('data.ids', $order);
    $list = collect($this->actingAs($this->admin)->getJson('/api/v1/admin/announcements')->assertOk()->json('data'))->keyBy('id');
    expect($list[$draft['id']]['positions'])->toBe(['client' => 1])
        ->and($list[$first['id']]['positions'])->toBe(['client' => 2])
        ->and($list[$both['id']]['positions'])->toBe(['client' => 3, 'technician' => 1])
        ->and($list[$technicians['id']]['positions'])->toBe(['technician' => 2]);
    expect(array_column(s07Feed($this, 'client'), 'id'))->toBe([$first['id'], $both['id']]);
    expect(DB::table('audit_entries')->where('action', 'announcement.reordered')->where('permission_used', 'announcements.manage')->count())->toBe(1);
});

it('S07-TC-084 despublica un comunicado: vuelve a borrador, sale del panel, controla la versión y deja auditoría', function () {
    $published = s07Publish($this, s07Create($this, s07Carousel(['image_media_id' => s07Banner($this)])));
    $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$published['id']}/publication",
        ['expected_version' => $published['version'] - 1])->assertStatus(409);

    $draft = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$published['id']}/publication",
        ['expected_version' => $published['version']])->assertOk()->json('data');
    expect($draft['status'])->toBe('draft')->and($draft['version'])->toBe($published['version'] + 1)
        ->and(s07Feed($this, 'client'))->toBe([]);
    Sprint01::forgetSession();
    $again = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$published['id']}/publication",
        ['expected_version' => $draft['version']])->assertStatus(409)->assertJsonPath('error.code', 'ANNOUNCEMENT_NOT_PUBLISHED');
    Sprint01::assertSpanishText((string) $again->json('message'));
    expect(DB::table('audit_entries')->where('action', 'announcement.unpublished')->count())->toBe(1);
});

it('S07-TC-085 duplicar copia el origen, la imagen, el tipo y el texto alternativo, y la copia va al final del carrusel', function () {
    $image = s07Banner($this);
    $source = s07Publish($this, s07Create($this, s07Carousel(['image_media_id' => $image, 'mobile_media_id' => s07Banner($this, 1080, 720)])));
    $copyId = $this->actingAs($this->admin)->postJson("/api/v1/admin/announcements/{$source['id']}/duplicates")->assertCreated()->json('data.id');

    $copy = collect($this->actingAs($this->admin)->getJson('/api/v1/admin/announcements')->json('data'))->firstWhere('id', $copyId);
    expect($copy)->toMatchArray(['status' => 'draft', 'source' => 'image', 'kind' => 'promotion', 'image_media_id' => $image,
        'mobile_media_id' => $source['mobile_media_id'], 'alt_text' => $source['alt_text'], 'positions' => ['client' => 2]]);
});

it('S07-TC-086 el listado del administrador indica la fase: borrador, programado, vigente, vencido o retirado', function () {
    $make = fn (string $title, string $from, string $to) => s07Create($this, s07Carousel(['image_media_id' => s07Banner($this),
        'title' => $title, 'starts_at' => $from, 'ends_at' => $to]));
    $draft = $make('Borrador', '2026-10-26T11:00:00Z', '2026-10-27T11:00:00Z');
    $scheduled = s07Publish($this, $make('Programado', '2026-10-28T11:00:00Z', '2026-10-29T11:00:00Z'));
    $active = s07Publish($this, $make('Vigente', '2026-10-26T11:00:00Z', '2026-10-26T12:00:01Z'));
    $retired = s07Publish($this, $make('Retirado', '2026-10-26T11:00:00Z', '2026-10-27T11:00:00Z'));
    $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$retired['id']}")->assertNoContent();

    $phase = fn () => collect($this->actingAs($this->admin)->getJson('/api/v1/admin/announcements')->json('data'))->pluck('phase', 'id');
    expect($phase()->all())->toMatchArray([$draft['id'] => 'draft', $scheduled['id'] => 'scheduled', $active['id'] => 'active', $retired['id'] => 'retired']);
    Carbon::setTestNow('2026-10-26 12:00:01');
    expect($phase()[$active['id']])->toBe('expired');
});

it('S07-TC-087 no publica un comunicado de imagen cuya imagen se retiró después de guardarlo', function () {
    $image = s07Banner($this);
    $draft = s07Create($this, s07Carousel(['image_media_id' => $image]));
    DB::table('media_files')->where('id', $image)->update(['retired_at' => now()]);

    $response = $this->actingAs($this->admin)->postJson("/api/v1/admin/announcements/{$draft['id']}/publication", ['expected_version' => $draft['version']]);
    Sprint01::assertSpanishValidation($response, ['image_media_id']);
    expect(DB::table('announcements')->where('id', $draft['id'])->value('status'))->toBe('draft');
});
