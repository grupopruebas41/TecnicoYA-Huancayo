<?php

// S05-TC-014 a 019 · Panel del cliente (adelanto S5, D-87) · NOTIF-02 (D-90): marca de leída solo del dueño, filtros y
// contador de no leídas en la bandeja (adelanto parcial de HU-S08-03 [TC-106]; las preferencias siguen en el S8).
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->owner = ClientProfileFactory::new()->create()->user;
    $this->other = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($this->owner);
});

function s05Notification(int $userId, string $type = 'request.pending', ?string $readAt = null): int
{
    return DB::table('notifications')->insertGetId([
        'user_id' => $userId, 'type' => $type, 'title' => 'Aviso sintético', 'body' => 'Texto sintético del aviso.',
        'subject_type' => 'service_request', 'subject_id' => 1, 'event_id' => (string) Str::uuid(), 'status' => 'sent',
        'read_at' => $readAt, 'created_at' => now(), 'updated_at' => now(),
    ]);
}

it('S05-TC-014 marca como leída una notificación propia y repetir no cambia la fecha [TC-106]', function () {
    $id = s05Notification($this->owner->id);

    $first = $this->postJson("/api/v1/notifications/$id/read")->assertOk()->json('data');
    $this->travel(10)->minutes();
    $again = $this->postJson("/api/v1/notifications/$id/read")->assertOk()->json('data');

    expect($first['id'])->toBe($id)
        ->and(CarbonImmutable::parse($first['read_at'])->equalTo(CarbonImmutable::parse(Sprint04::NOW, 'UTC')))->toBeTrue()
        ->and($again['read_at'])->toBe($first['read_at'])
        ->and(CarbonImmutable::parse(DB::table('notifications')->where('id', $id)->value('read_at'))->equalTo(CarbonImmutable::parse(Sprint04::NOW, 'UTC')))->toBeTrue();
});

it('S05-TC-015 no deja marcar una notificación ajena ni una inexistente [TC-106]', function () {
    $foreign = s05Notification($this->other->id);

    $this->postJson("/api/v1/notifications/$foreign/read")->assertNotFound();
    $this->postJson('/api/v1/notifications/999999/read')->assertNotFound();

    expect(DB::table('notifications')->where('id', $foreign)->value('read_at'))->toBeNull();
});

it('S05-TC-016 marcar todas cambia solo las propias sin leer y devuelve cuántas cambió', function () {
    s05Notification($this->owner->id);
    s05Notification($this->owner->id);
    $already = s05Notification($this->owner->id, readAt: '2026-10-19 10:00:00');
    $foreign = s05Notification($this->other->id);

    $this->postJson('/api/v1/notifications/read-all')->assertOk()->assertJsonPath('data.updated', 2);
    $this->postJson('/api/v1/notifications/read-all')->assertOk()->assertJsonPath('data.updated', 0);

    expect(DB::table('notifications')->where('user_id', $this->owner->id)->whereNull('read_at')->count())->toBe(0)
        ->and(DB::table('notifications')->where('id', $already)->value('read_at'))->toStartWith('2026-10-19 10:00:00')
        ->and(DB::table('notifications')->where('id', $foreign)->value('read_at'))->toBeNull();
});

it('S05-TC-017 la bandeja filtra por leídas, no leídas y tipo, y rechaza un estado desconocido', function () {
    $unread = s05Notification($this->owner->id, 'request.pending');
    $read = s05Notification($this->owner->id, 'request.pending', '2026-10-19 10:00:00');
    $assigned = s05Notification($this->owner->id, 'request.assigned');
    s05Notification($this->other->id, 'request.pending');

    $ids = fn (string $query) => array_column($this->getJson("/api/v1/notifications?$query")->assertOk()->json('data.items'), 'id');

    expect($ids('state=unread'))->toEqualCanonicalizing([$unread, $assigned])
        ->and($ids('state=read'))->toBe([$read])
        ->and($ids('type=request.assigned'))->toBe([$assigned])
        ->and($ids('state=unread&type=request.pending'))->toBe([$unread]);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/notifications?state=archived'), ['state']);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/notifications?type='.str_repeat('x', 61)), ['type']);
});

it('S05-TC-018 el contador de no leídas cuenta todas las propias sin importar el filtro ni la página', function () {
    foreach (range(1, 3) as $n) {
        s05Notification($this->owner->id);
    }
    s05Notification($this->owner->id, readAt: '2026-10-19 10:00:00');
    s05Notification($this->other->id);

    expect($this->getJson('/api/v1/notifications?per_page=1')->assertOk()->json('data.unread_count'))->toBe(3)
        ->and($this->getJson('/api/v1/notifications?state=read')->assertOk()->json('data.unread_count'))->toBe(3);
});

it('S05-TC-019 marcar como leída exige sesión', function () {
    $id = s05Notification($this->owner->id);
    Sprint01::forgetSession();

    $this->postJson("/api/v1/notifications/$id/read")->assertUnauthorized();
    $this->postJson('/api/v1/notifications/read-all')->assertUnauthorized();

    expect(DB::table('notifications')->where('id', $id)->value('read_at'))->toBeNull();
});
