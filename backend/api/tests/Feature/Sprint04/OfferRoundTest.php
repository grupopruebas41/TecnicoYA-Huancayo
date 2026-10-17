<?php

// S04-TC-023, 027, 028, 030 y 114 · HU-S04-04 · RF-13, RF-15; RN-10.2 · D-21, D-25, D-65: ronda de hasta tres ofertas
// simultáneas, tarifa notificada, preparación idempotente y corte de ronda con empate.
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

it('S04-TC-023 conserva en la oferta la tarifa notificada aunque el técnico la cambie', function () {
    $technician = Sprint04::technician(['fee' => '90.00']);
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $rate = DB::table('service_rate_versions as v')->join('technician_services as s', 's.id', '=', 'v.technician_service_id')
        ->where('s.technician_id', $technician->id)->value('v.id');

    Sanctum::actingAs($technician->user);
    $this->putJson('/api/v1/technicians/me/services', [
        'services' => [['subcategory_id' => Sprint04::subcategory(), 'reference_fee' => '120.00']],
        'expected_version' => (int) $technician->version,
    ])->assertOk();

    $offer = Sprint04::offerTo($request->id, $technician->id);
    expect($offer->reference_fee_snapshot)->toBe('90.00')
        ->and((int) $offer->service_rate_version_id)->toBe((int) $rate)
        ->and(DB::table('service_rate_versions')->count())->toBe(2);
    $this->getJson("/api/v1/offers/{$offer->id}")->assertOk()->assertJsonPath('data.reference_fee.amount', '90.00');
});

it('S04-TC-027 abre la primera ronda con exactamente tres ofertas a los tres primeros [TC-045]', function () {
    $ordered = array_map(fn ($fee) => Sprint04::technician(['fee' => $fee]), ['60.00', '70.00', '80.00', '90.00', '100.00']);
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    $round = Sprint04::rounds($request->id)[0];
    $top = array_map(fn ($t) => $t->id, array_slice($ordered, 0, 3));
    sort($top);
    expect($round->kind)->toBe('automatic')
        ->and((int) $round->round_no)->toBe(1)
        ->and(Sprint04::offeredIn($round->id))->toBe($top);
    foreach (DB::table('offers')->get() as $offer) {
        expect(CarbonImmutable::parse($offer->expires_at)->equalTo(CarbonImmutable::parse($offer->available_at)->addMinutes(10)))->toBeTrue();
    }
});

it('S04-TC-028 ofrece a todos cuando hay menos elegibles que el máximo', function () {
    Sprint04::technician();
    Sprint04::technician();
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(DB::table('offers')->where('request_id', $request->id)->count())->toBe(2)
        ->and(DB::table('service_requests')->where('id', $request->id)->value('status'))->toBe('sent')
        ->and(DB::table('service_requests')->where('id', $request->id)->value('pending_since'))->toBeNull();
});

it('S04-TC-030 no duplica la ronda al preparar dos veces la misma generación', function () {
    foreach (range(1, 5) as $i) {
        Sprint04::technician();
    }
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);
    Sprint04::prepare($request->id);

    expect(DB::table('matching_runs')->count())->toBe(1)
        ->and(DB::table('offer_rounds')->count())->toBe(1)
        ->and(DB::table('offers')->count())->toBe(3);
});

it('S04-TC-114 resuelve el empate del corte por la verificación más antigua', function () {
    Sprint04::technician(['fee' => '60.00']);
    Sprint04::technician(['fee' => '70.00']);
    $recent = Sprint04::technician(['fee' => '90.00', 'profile' => ['verified_at' => now()->subDays(10)]]);
    $older = Sprint04::technician(['fee' => '90.00', 'profile' => ['verified_at' => now()->subDays(100)]]);
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    $round = Sprint04::rounds($request->id)[0];
    $recentCandidate = Sprint04::candidate($request->id, $recent->id);
    $olderCandidate = Sprint04::candidate($request->id, $older->id);
    expect(Sprint04::offeredIn($round->id))->toContain($older->id)->not->toContain($recent->id)
        ->and($recentCandidate->tie_group)->not->toBeNull()
        ->and($recentCandidate->tie_group)->toBe($olderCandidate->tie_group)
        ->and($recentCandidate->tie_break)->toBe('verified_at')
        ->and($olderCandidate->tie_break)->toBe('verified_at');
});
