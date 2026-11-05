<?php

// S04-TC-144 · DEF-61 · RN-10: una oferta vencida siempre responde que venció, aunque la versión que trae el técnico ya no
// sea la vigente porque el barrido la venció primero. Antes respondía STALE_VERSION: «La información cambió».
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
});

it('S04-TC-144 una oferta vencida responde OFFER_EXPIRED aunque la versión sea vieja; otra versión vieja sigue siendo STALE_VERSION [DEF-61]', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $offer = Sprint04::offerTo($request->id, $technician->id);
    $round = Sprint04::rounds($request->id)[0];
    Sanctum::actingAs($technician->user);
    $respond = fn (int $version) => $this->postJson("/api/v1/offers/{$offer->id}/response",
        ['decision' => 'accept', 'expected_version' => $version], ['Idempotency-Key' => (string) Str::uuid()]);

    // Una versión vieja en una oferta vigente sigue siendo un conflicto de versión.
    $respond((int) $offer->version + 5)->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');

    // Pasó el plazo, pero el barrido todavía no la venció: la versión vieja también debe decir que venció.
    $this->travelTo(now()->addMinutes(11));
    $respond((int) $offer->version + 5)->assertConflict()->assertJsonPath('error.code', 'OFFER_EXPIRED');

    Sprint04::expireRound($round->id);
    expect(DB::table('offers')->find($offer->id)->status)->toBe('expired')
        ->and((int) DB::table('offers')->find($offer->id)->version)->toBeGreaterThan((int) $offer->version);

    $response = $respond((int) $offer->version);
    $response->assertConflict()->assertJsonPath('error.code', 'OFFER_EXPIRED');
    Sprint01::assertSpanishText($response->json('error.message'));
    expect($response->json('error.message'))->toBe('La oferta venció. Ya no puedes responderla.');
});
