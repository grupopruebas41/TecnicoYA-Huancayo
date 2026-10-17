<?php

// S04-TC-044, 047 a 051, 070 y 117 · HU-S04-06 · RF-18; RN-10.3 · D-22, D-23, D-25, D-66: el cliente elige entre los
// que aceptaron cuando se cierra la ronda; elegir revalida la disponibilidad, crea la participación y la reserva.
use App\Models\TechnicianProfile;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

/** Prepara y hace responder: accept para los indicados, reject para los de $reject; el resto queda pendiente. */
function s04Respond(object $test, object $request, array $accept, array $reject = []): void
{
    Sprint04::prepare($request->id);
    foreach (array_merge(array_map(fn ($t) => [$t, 'accept'], $accept), array_map(fn ($t) => [$t, 'reject'], $reject)) as [$technician, $decision]) {
        Sprint04::respond($test, $technician, Sprint04::offerTo($request->id, $technician->id), $decision)->assertOk();
    }
}

it('S04-TC-044 crea la participación y la reserva al elegir una aceptación válida [TC-049]', function () {
    $a = Sprint04::technician(['fee' => '60.00']);
    $b = Sprint04::technician(['fee' => '70.00']);
    $request = Sprint04::scheduled('2026-10-27', '15:00', '17:00');
    s04Respond($this, $request, [$a, $b]);
    $offerA = Sprint04::offerTo($request->id, $a->id);

    Sprint04::select($this, $request, $offerA->id)->assertOk()
        ->assertJsonPath('data.request.status', 'assigned')->assertJsonPath('data.participation.slot', 'primary')
        ->assertJsonPath('data.participation.reference_fee.amount', '60.00')->assertJsonPath('data.appointment.status', 'confirmed');

    $row = DB::table('service_requests')->find($request->id);
    $appointment = DB::table('appointments')->where('request_id', $request->id)->first();
    $event = DB::table('request_events')->where('request_id', $request->id)->where('event_type', 'request.assigned')->first();
    expect($row->status)->toBe('assigned')
        ->and((int) $row->search_generation)->toBe(2)
        ->and(DB::table('participations')->where('request_id', $request->id)->value('reference_fee_snapshot'))->toBe($offerA->reference_fee_snapshot)
        ->and(CarbonImmutable::parse($appointment->starts_at)->equalTo(CarbonImmutable::parse($request->preferred_start_at)))->toBeTrue()
        ->and(CarbonImmutable::parse($appointment->ends_at)->equalTo(CarbonImmutable::parse($request->preferred_end_at)))->toBeTrue()
        ->and(Sprint04::offerTo($request->id, $b->id)->status)->toBe('withdrawn')
        ->and(Sprint04::rounds($request->id)[0]->status)->toBe('closed')
        ->and((int) $event->actor_id)->toBe(Sprint04::clientUser($request)->id);
});

it('S04-TC-047 no deja elegir mientras la ronda sigue abierta', function () {
    $a = Sprint04::technician(['fee' => '60.00']);
    Sprint04::technician(['fee' => '70.00']);
    Sprint04::technician(['fee' => '80.00']);
    $request = Sprint04::sentRequest();
    s04Respond($this, $request, [$a]);

    Sprint04::select($this, $request, Sprint04::offerTo($request->id, $a->id)->id)->assertConflict()
        ->assertJsonPath('error.code', 'ROUND_NOT_CLOSED')->assertJsonPath('error.message', 'Espera a que respondan todos o venza el plazo.');

    expect(DB::table('participations')->count())->toBe(0);
});

it('S04-TC-048 no deja elegir una oferta de una solicitud ajena', function () {
    $technician = Sprint04::technician();
    $mine = Sprint04::sentRequest();
    $theirs = Sprint04::sentRequest();
    s04Respond($this, $mine, [$technician]);
    s04Respond($this, $theirs, [$technician]);
    $theirOffer = Sprint04::offerTo($theirs->id, $technician->id);

    Sprint04::select($this, $mine, $theirOffer->id)->assertUnprocessable()->assertJsonValidationErrors(['offer_id']);
    Sanctum::actingAs(Sprint04::clientUser($mine));
    $this->postJson("/api/v1/requests/{$theirs->id}/selection", ['offer_id' => $theirOffer->id, 'expected_version' => (int) DB::table('service_requests')->where('id', $theirs->id)->value('version')],
        ['Idempotency-Key' => (string) Str::uuid()])->assertNotFound();

    expect(DB::table('participations')->count())->toBe(0);
});

it('S04-TC-049 revalida al elegir que el técnico siga disponible', function () {
    $a = Sprint04::technician(['fee' => '60.00']);
    $b = Sprint04::technician(['fee' => '70.00']);
    $request = Sprint04::sentRequest();
    s04Respond($this, $request, [$a, $b]);
    DB::table('technician_profiles')->where('id', $a->id)->update(['status' => 'suspended']);

    Sprint04::select($this, $request, Sprint04::offerTo($request->id, $a->id)->id)->assertConflict()
        ->assertJsonPath('error.code', 'TECHNICIAN_UNAVAILABLE')->assertJsonPath('error.message', 'El técnico ya no está disponible. Elige otra opción.');

    expect(Sprint04::offerTo($request->id, $a->id)->status)->toBe('withdrawn')
        ->and(Sprint04::offerTo($request->id, $b->id)->status)->toBe('accepted')
        ->and(Sprint04::rounds($request->id)[0]->status)->toBe('awaiting_choice')
        ->and(DB::table('service_requests')->where('id', $request->id)->value('status'))->toBe('sent');
});

it('S04-TC-050 abre la siguiente ronda si la única aceptada deja de estar disponible', function () {
    $technicians = array_map(fn ($fee) => Sprint04::technician(['fee' => $fee]), ['60.00', '70.00', '80.00', '90.00', '95.00']);
    $request = Sprint04::sentRequest();
    s04Respond($this, $request, [$technicians[0]], [$technicians[1], $technicians[2]]);
    Sprint04::pause($technicians[0]->id, CarbonImmutable::now()->subMinute());

    Sprint04::select($this, $request, Sprint04::offerTo($request->id, $technicians[0]->id)->id)->assertConflict()
        ->assertJsonPath('error.code', 'TECHNICIAN_UNAVAILABLE');

    $rounds = Sprint04::rounds($request->id);
    expect($rounds)->toHaveCount(2)
        ->and($rounds[0]->status)->toBe('closed')
        ->and(Sprint04::offeredIn($rounds[1]->id))->toBe([$technicians[3]->id, $technicians[4]->id]);
});

it('S04-TC-051 responde igual a la misma elección con la misma clave', function () {
    $a = Sprint04::technician();
    $request = Sprint04::sentRequest();
    s04Respond($this, $request, [$a]);
    $version = (int) DB::table('service_requests')->where('id', $request->id)->value('version');
    $key = (string) Str::uuid();
    $offerId = Sprint04::offerTo($request->id, $a->id)->id;

    $first = Sprint04::select($this, $request, $offerId, $version, $key)->assertOk()->json('data');
    $second = Sprint04::select($this, $request, $offerId, $version, $key)->assertOk()->json('data');

    expect($second)->toBe($first)
        ->and(DB::table('participations')->where('request_id', $request->id)->count())->toBe(1)
        ->and(DB::table('appointments')->where('request_id', $request->id)->count())->toBe(1);
});

it('S04-TC-070 muestra al titular solo las aceptaciones de su solicitud, sin puntaje', function () {
    $accepted = Sprint04::technician(['fee' => '60.00']);
    $rejected = Sprint04::technician(['fee' => '70.00']);
    Sprint04::technician(['fee' => '80.00']);
    $request = Sprint04::sentRequest();
    s04Respond($this, $request, [$accepted], [$rejected]);
    $this->travel(10)->minutes();
    Sprint04::expireRound(Sprint04::rounds($request->id)[0]->id);

    Sanctum::actingAs(Sprint04::clientUser($request));
    $response = $this->getJson("/api/v1/requests/{$request->id}/candidates")->assertOk()->assertJsonPath('data.phase', 'awaiting_choice');
    $cards = $response->json('data.accepted');
    expect(array_column($cards, 'offer_id'))->toBe([Sprint04::offerTo($request->id, $accepted->id)->id])
        ->and($cards[0]['technician']['id'])->toBe($accepted->id)
        ->and($cards[0]['reference_fee']['amount'])->toBe('60.00')
        ->and(json_encode($response->json()))->not->toContain('score')->not->toContain('factor');

    Sanctum::actingAs(Sprint04::clientUser(Sprint04::sentRequest()));
    $this->getJson("/api/v1/requests/{$request->id}/candidates")->assertNotFound();
});

it('S04-TC-117 reserva dos horas al elegir en una solicitud inmediata', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    s04Respond($this, $request, [$technician]);

    Sprint04::select($this, $request, Sprint04::offerTo($request->id, $technician->id)->id)->assertOk();

    $appointment = DB::table('appointments')->where('request_id', $request->id)->first();
    expect(CarbonImmutable::parse($appointment->starts_at)->equalTo(CarbonImmutable::now()))->toBeTrue()
        ->and(CarbonImmutable::parse($appointment->ends_at)->equalTo(CarbonImmutable::now()->addHours(2)))->toBeTrue()
        ->and($appointment->status)->toBe('confirmed');
    $this->travel(1)->hours();
    $later = Sprint04::sentRequest();
    Sprint04::prepare($later->id);
    expect(Sprint04::candidate($later->id, $technician->id)->exclusion_code)->toBe('appointment_within_2h')
        ->and(TechnicianProfile::query()->find($technician->id)->status)->toBe('active');
});
