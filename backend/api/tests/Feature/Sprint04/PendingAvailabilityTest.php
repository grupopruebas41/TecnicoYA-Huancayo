<?php

// S04-TC-059 a 063 y 119 · HU-S04-08 · RF-14; RN-11.2, RN-11.3 · D-11, D-21, D-67: sin elegibles la solicitud queda
// pendiente 24 h desde el primer pendiente; vence una sola vez y libera el cupo; se reintenta cada 5 min.
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint03;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

function s04Pending(): object
{
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);

    return DB::table('service_requests')->find($request->id);
}

it('S04-TC-059 deja pendiente con plazo de 24 h cuando no hay elegibles [TC-053]', function () {
    $start = CarbonImmutable::now();

    $row = s04Pending();

    expect($row->status)->toBe('pending_availability')
        ->and(CarbonImmutable::parse($row->pending_since)->equalTo($start))->toBeTrue()
        ->and(CarbonImmutable::parse($row->pending_expires_at)->equalTo($start->addHours(24)))->toBeTrue()
        ->and(Sprint04::events($row->id, 'request.pending'))->toBe(1);
});

it('S04-TC-060 no expira el pendiente a las 23:59', function () {
    $row = s04Pending();
    $this->travel(23 * 60 + 59)->minutes();

    Sprint04::expirePending($row->id);

    $after = DB::table('service_requests')->find($row->id);
    expect($after->status)->toBe('pending_availability')
        ->and($after->pending_expires_at)->toBe($row->pending_expires_at)
        ->and($after->closed_at)->toBeNull();
});

it('S04-TC-061 expira el pendiente a las 24:00 una sola vez [TC-054]', function () {
    $row = s04Pending();
    $this->travel(24)->hours();

    Sprint04::expirePending($row->id);
    Sprint04::expirePending($row->id);

    $after = DB::table('service_requests')->find($row->id);
    expect($after->status)->toBe('expired')
        ->and($after->closed_at)->not->toBeNull()
        ->and($after->pending_expires_at)->toBe($row->pending_expires_at)
        ->and(Sprint04::events($row->id, 'request.expired'))->toBe(1)
        ->and(DB::table('offer_rounds')->count())->toBe(0);
});

it('S04-TC-062 conserva el primer plazo al volver al pendiente', function () {
    $row = s04Pending();
    $this->travel(2)->hours();
    Sprint04::technician();
    Sprint04::retryPending($row->id);
    $round = Sprint04::rounds($row->id)[0];

    $this->travel(10)->minutes();
    Sprint04::expireRound($round->id);

    $after = DB::table('service_requests')->find($row->id);
    expect($after->status)->toBe('pending_availability')
        ->and($after->pending_since)->toBe($row->pending_since)
        ->and($after->pending_expires_at)->toBe($row->pending_expires_at);
});

it('S04-TC-063 libera el cupo de activas cuando una solicitud expira', function () {
    $client = ClientProfileFactory::new()->create();
    $expiring = Sprint04::sentRequest(['client_id' => $client->id]);
    Sprint04::sentRequest(['client_id' => $client->id]);
    Sprint04::sentRequest(['client_id' => $client->id]);
    Sprint04::prepare($expiring->id);
    $this->travel(24)->hours();
    Sprint04::expirePending($expiring->id);

    Sanctum::actingAs($client->user);
    $fourth = Sprint03::register($this, Sprint04::district());

    Sprint03::submit($this, $fourth['id'], $fourth['version'])->assertAccepted();
    expect(DB::table('service_requests')->where('id', $expiring->id)->value('status'))->toBe('expired');
});

it('S04-TC-119 reintenta el pendiente cada 5 minutos solo con técnicos nuevos', function () {
    $previous = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $this->travel(10)->minutes();
    Sprint04::expireRound(Sprint04::rounds($request->id)[0]->id);
    $pending = DB::table('service_requests')->find($request->id);
    $start = CarbonImmutable::parse($pending->pending_since);

    $this->travelTo($start->addMinutes(3));
    $newcomer = Sprint04::technician();
    $this->travelTo($start->addSeconds(299));
    $this->artisan('tecnicoya:sweep')->assertSuccessful();
    $roundsAt459 = count(Sprint04::rounds($request->id));
    $this->travelTo($start->addMinutes(5));
    $this->artisan('tecnicoya:sweep')->assertSuccessful();

    $rounds = Sprint04::rounds($request->id);
    expect($pending->status)->toBe('pending_availability')
        ->and($roundsAt459)->toBe(1)
        ->and($rounds)->toHaveCount(2)
        ->and(Sprint04::offeredIn($rounds[1]->id))->toBe([$newcomer->id])
        ->and(Sprint04::offeredIn($rounds[1]->id))->not->toContain($previous->id)
        ->and(DB::table('service_requests')->where('id', $request->id)->value('pending_expires_at'))->toBe($pending->pending_expires_at);
});
