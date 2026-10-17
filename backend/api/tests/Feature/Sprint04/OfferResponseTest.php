<?php

// S04-TC-033 a 036, 039 y 041 a 043 · HU-S04-05 · RF-15, RF-16; RN-10.1 · D-21: el plazo es [disponible, vence) y el
// servidor lo comprueba bajo bloqueo aunque el job no haya corrido. Límites 9:59, 10:00 y 10:01 con reloj controlado.
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->technicians = [Sprint04::technician(['fee' => '60.00']), Sprint04::technician(['fee' => '70.00']), Sprint04::technician(['fee' => '80.00'])];
    $this->request = Sprint04::sentRequest();
    Sprint04::prepare($this->request->id);
    $this->round = Sprint04::rounds($this->request->id)[0];
    $this->offer = Sprint04::offerTo($this->request->id, $this->technicians[0]->id);
    $this->start = CarbonImmutable::parse($this->offer->available_at, 'UTC');
});

it('S04-TC-033 acepta a los 9:59 dentro del plazo sin asignar todavía [TC-047]', function () {
    $this->travelTo($this->start->addSeconds(599));

    Sprint04::respond($this, $this->technicians[0], $this->offer, 'accept')->assertOk()
        ->assertJsonPath('data.status', 'accepted')->assertJsonPath('data.version', 2)->assertJsonPath('data.round.status', 'open');

    expect(Sprint04::offerTo($this->request->id, $this->technicians[0]->id)->responded_at)->not->toBeNull()
        ->and(DB::table('participations')->count())->toBe(0)
        ->and(DB::table('appointments')->count())->toBe(0);
});

it('S04-TC-034 rechaza a los 10:00 exactos aunque el job de vencimiento no corrió [TC-048]', function () {
    $this->travelTo($this->start->addMinutes(10));

    Sprint04::respond($this, $this->technicians[0], $this->offer, 'accept')->assertConflict()
        ->assertJsonPath('error.code', 'OFFER_EXPIRED')->assertJsonPath('error.message', 'La oferta venció. Ya no puedes responderla.');

    expect(Sprint04::offerTo($this->request->id, $this->technicians[0]->id)->status)->toBe('pending');
});

it('S04-TC-035 rechaza a los 10:01 y el job vence la oferta una sola vez', function () {
    $this->travelTo($this->start->addSeconds(601));

    Sprint04::respond($this, $this->technicians[0], $this->offer, 'accept')->assertConflict()->assertJsonPath('error.code', 'OFFER_EXPIRED');
    Sprint04::expireRound($this->round->id);
    Sprint04::expireRound($this->round->id);

    expect(Sprint04::offerTo($this->request->id, $this->technicians[0]->id)->status)->toBe('expired')
        ->and(DB::table('request_events')->where('event_type', 'offer.expired')->where('metadata->offer_id', $this->offer->id)->count())->toBe(1);
});

it('S04-TC-036 guarda el rechazo con motivo y mantiene la ronda si quedan pendientes', function () {
    $this->travel(3)->minutes();

    Sprint04::respond($this, $this->technicians[0], $this->offer, 'reject', body: ['reason' => 'No tengo repuestos para ese modelo.'])
        ->assertOk()->assertJsonPath('data.status', 'rejected');

    $offer = Sprint04::offerTo($this->request->id, $this->technicians[0]->id);
    expect($offer->responded_at)->not->toBeNull()
        ->and($offer->response_reason)->toBe('No tengo repuestos para ese modelo.')
        ->and(DB::table('offer_rounds')->where('id', $this->round->id)->value('status'))->toBe('open')
        ->and(Sprint04::rounds($this->request->id))->toHaveCount(1);
});

it('S04-TC-039 no vence una aceptación confirmada antes de que corra el job', function () {
    $this->travelTo($this->start->addSeconds(599));
    Sprint04::respond($this, $this->technicians[0], $this->offer, 'accept')->assertOk();

    $this->travelTo($this->start->addSeconds(601));
    Sprint04::expireRound($this->round->id);

    expect(Sprint04::offerTo($this->request->id, $this->technicians[0]->id)->status)->toBe('accepted')
        ->and(DB::table('offer_rounds')->where('id', $this->round->id)->value('status'))->toBe('awaiting_choice')
        ->and(Sprint04::rounds($this->request->id))->toHaveCount(1);
});

it('S04-TC-041 revalida la elegibilidad del técnico al aceptar', function () {
    Sprint04::pause($this->technicians[0]->id, CarbonImmutable::now()->subMinute());
    $this->travel(2)->minutes();

    Sprint04::respond($this, $this->technicians[0], $this->offer, 'accept')->assertConflict()
        ->assertJsonPath('error.code', 'TECHNICIAN_UNAVAILABLE')->assertJsonPath('error.message', 'Ya no estás disponible para esta solicitud.');

    expect(Sprint04::offerTo($this->request->id, $this->technicians[0]->id)->status)->toBe('pending');
});

it('S04-TC-042 responde igual con la misma clave y rechaza otro cuerpo con esa clave', function () {
    $key = (string) Str::uuid();

    $first = Sprint04::respond($this, $this->technicians[0], $this->offer, 'accept', $key)->assertOk()->json('data');
    $second = Sprint04::respond($this, $this->technicians[0], $this->offer, 'accept', $key)->assertOk()->json('data');
    Sprint04::respond($this, $this->technicians[0], $this->offer, 'reject', $key)->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');

    expect($second)->toBe($first)
        ->and(Sprint04::offerTo($this->request->id, $this->technicians[0]->id)->status)->toBe('accepted')
        ->and((int) Sprint04::offerTo($this->request->id, $this->technicians[0]->id)->version)->toBe(2)
        ->and(DB::table('request_events')->where('event_type', 'offer.accepted')->count())->toBe(1);
});

it('S04-TC-043 rechaza en el servidor una respuesta inválida', function () {
    Sprint04::respond($this, $this->technicians[0], $this->offer, 'maybe', body: ['expected_version' => null])
        ->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_FAILED')
        ->assertJsonPath('error.fields.decision.0', 'La respuesta debe ser aceptar o rechazar.')
        ->assertJsonValidationErrors(['expected_version']);

    $offer = Sprint04::offerTo($this->request->id, $this->technicians[0]->id);
    expect($offer->status)->toBe('pending')->and((int) $offer->version)->toBe(1);
});
