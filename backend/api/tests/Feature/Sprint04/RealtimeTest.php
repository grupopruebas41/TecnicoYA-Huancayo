<?php

// S04-TC-064 a 067 · HU-S04-09 · RF-29; SEC-S04-02, SEC-S04-05 · D-70: eventos de Reverb publicados desde el outbox con
// event_id y versión; canales privados autorizados por rol (contrato §2 y §8) y cargas sin datos personales.
use App\Modules\CNotifications\Events\OutboxBroadcast;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Event::fake([OutboxBroadcast::class]);
});

/** Eventos emitidos como [canal, tipo, carga]. */
function s04Broadcasts(): array
{
    return Event::dispatched(OutboxBroadcast::class)->map(fn ($call) => [$call[0]->broadcastOn()[0]->name, $call[0]->broadcastAs(), $call[0]->broadcastWith()])->all();
}

function s04ChannelAuth(object $test, string $channel)
{
    return $test->postJson('/api/v1/broadcasting/auth', ['socket_id' => '1234.5678', 'channel_name' => $channel]);
}

it('S04-TC-064 publica solo lo confirmado, con identificador de evento y versión', function () {
    $technicians = [Sprint04::technician(), Sprint04::technician(), Sprint04::technician()];
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);

    $this->artisan('tecnicoya:sweep')->assertSuccessful();

    $broadcasts = s04Broadcasts();
    $offers = array_values(array_filter($broadcasts, fn ($b) => $b[1] === 'offer.created'));
    $updates = array_values(array_filter($broadcasts, fn ($b) => $b[1] === 'request.updated'));
    $requestVersion = (int) DB::table('service_requests')->where('id', $request->id)->value('version');
    sort($offers);
    expect(array_column($offers, 0))->toEqualCanonicalizing(array_map(fn ($t) => "private-technicians.{$t->id}", $technicians))
        ->and(array_unique(array_map(fn ($o) => $o[2]['version'], $offers)))->toBe([1])
        ->and($updates)->toHaveCount(1)
        ->and($updates[0][0])->toBe("private-requests.{$request->id}")
        ->and($updates[0][2]['version'])->toBe($requestVersion)
        ->and(count(array_unique(array_map(fn ($b) => $b[2]['event_id'], $broadcasts))))->toBe(count($broadcasts));
});

it('S04-TC-065 autoriza el canal privado de la solicitud solo al titular [TC-056]', function () {
    $notified = Sprint04::technician();
    $outsider = Sprint04::technician(['subcategory' => 'computo-redes']);
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $channel = "private-requests.{$request->id}";

    s04ChannelAuth($this, $channel)->assertUnauthorized();
    Sanctum::actingAs(Sprint04::clientUser($request));
    s04ChannelAuth($this, $channel)->assertOk()->assertJsonStructure(['auth']);
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    s04ChannelAuth($this, $channel)->assertForbidden();
    Sanctum::actingAs($outsider->user);
    s04ChannelAuth($this, $channel)->assertForbidden();
    Sanctum::actingAs($notified->user);
    s04ChannelAuth($this, $channel)->assertForbidden();
});

it('S04-TC-066 autoriza el canal privado del técnico solo a ese técnico activo', function () {
    $a = Sprint04::technician();
    $b = Sprint04::technician();
    $channel = "private-technicians.{$a->id}";

    Sanctum::actingAs($a->user);
    s04ChannelAuth($this, $channel)->assertOk();
    Sanctum::actingAs($b->user);
    s04ChannelAuth($this, $channel)->assertForbidden();
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    s04ChannelAuth($this, $channel)->assertForbidden();
    DB::table('technician_profiles')->where('id', $a->id)->update(['status' => 'suspended']);
    Sanctum::actingAs($a->user);
    s04ChannelAuth($this, $channel)->assertForbidden();
});

it('S04-TC-067 publica eventos sin dirección, descripción, teléfono ni correo', function () {
    Sprint04::technician();
    $request = Sprint04::sentRequest();
    $client = Sprint04::clientUser($request);
    DB::table('users')->where('id', $client->id)->update(['phone' => '987654321']);
    Sprint04::prepare($request->id);

    $this->artisan('tecnicoya:sweep')->assertSuccessful();

    $allowed = ['event_id', 'type', 'request_id', 'offer_id', 'notification_id', 'status', 'phase', 'version', 'expires_at', 'occurred_at'];
    $broadcasts = s04Broadcasts();
    expect($broadcasts)->not->toBeEmpty();
    foreach ($broadcasts as [, , $payload]) {
        expect(array_diff(array_keys($payload), $allowed))->toBe([])
            ->and(json_encode($payload))->not->toContain('Jirón sintético')->not->toContain('no enciende')
            ->not->toContain('987654321')->not->toContain($client->email);
    }
});
