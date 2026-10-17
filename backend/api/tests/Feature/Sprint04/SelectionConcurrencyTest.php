<?php

// S04-TC-045 y 046 · HU-S04-06 · RF-18; RN-10.3 · D-25: elecciones simultáneas con dos procesos PHP reales y barrera
// GET_LOCK (sin sleep). El orden de bloqueo es solicitud, ronda, ofertas y técnico (contrato §3).
use App\Models\TechnicianProfile;
use Illuminate\Support\Facades\DB;
use Tests\Support\CommittedDatabase;
use Tests\Support\Sprint04;

uses(CommittedDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

/** Prepara la solicitud; los técnicos indicados aceptan y el resto rechaza, así la ronda queda en elección. */
function s04AcceptAll(object $test, object $request, array $technicians): void
{
    Sprint04::prepare($request->id);
    $accepting = array_map(fn ($t) => $t->id, $technicians);
    foreach (DB::table('offers')->where('request_id', $request->id)->get() as $offer) {
        $technician = TechnicianProfile::query()->findOrFail($offer->technician_id);
        Sprint04::respond($test, $technician, $offer, in_array($technician->id, $accepting, true) ? 'accept' : 'reject')->assertOk();
    }
}

it('S04-TC-045 confirma una sola cita cuando dos clientes eligen al mismo técnico en franjas solapadas [TC-050]', function () {
    $shared = Sprint04::technician(['fee' => '60.00']);
    $first = Sprint04::scheduled('2026-10-27', '15:00', '17:00');
    $second = Sprint04::scheduled('2026-10-27', '16:00', '18:00');
    $otherFirst = Sprint04::technician(['fee' => '90.00']);
    s04AcceptAll($this, $first, [$shared, $otherFirst]);
    $otherSecond = Sprint04::technician(['fee' => '95.00']);
    s04AcceptAll($this, $second, [$shared, $otherSecond]);
    $offerFirst = Sprint04::offerTo($first->id, $shared->id);
    $offerSecond = Sprint04::offerTo($second->id, $shared->id);

    $results = Sprint04::race([
        ['user' => Sprint04::clientUser($first), 'method' => 'POST', 'uri' => "/api/v1/requests/{$first->id}/selection",
            'body' => ['offer_id' => $offerFirst->id, 'expected_version' => (int) DB::table('service_requests')->where('id', $first->id)->value('version')]],
        ['user' => Sprint04::clientUser($second), 'method' => 'POST', 'uri' => "/api/v1/requests/{$second->id}/selection",
            'body' => ['offer_id' => $offerSecond->id, 'expected_version' => (int) DB::table('service_requests')->where('id', $second->id)->value('version')]],
    ]);

    $statuses = array_column($results, 0);
    sort($statuses);
    $loser = array_values(array_filter($results, fn ($r) => $r[0] === 409))[0] ?? null;
    $loserRequest = $results[0][0] === 409 ? $first : $second;
    expect($statuses)->toBe([200, 409])
        ->and($loser[1]['error']['code'])->toBe('SCHEDULE_CONFLICT')
        ->and(DB::table('appointments')->where('technician_id', $shared->id)->where('status', 'confirmed')->count())->toBe(1)
        ->and(DB::table('service_requests')->where('id', $loserRequest->id)->value('status'))->toBe('sent')
        ->and(Sprint04::offerTo($loserRequest->id, $shared->id)->status)->toBe('withdrawn')
        ->and(Sprint04::rounds($loserRequest->id)[0]->status)->toBe('awaiting_choice');
});

it('S04-TC-046 acepta una sola elección cuando el mismo cliente elige dos veces a la vez', function () {
    $a = Sprint04::technician(['fee' => '60.00']);
    $b = Sprint04::technician(['fee' => '70.00']);
    $request = Sprint04::sentRequest();
    s04AcceptAll($this, $request, [$a, $b]);
    $version = (int) DB::table('service_requests')->where('id', $request->id)->value('version');
    $client = Sprint04::clientUser($request);
    $uri = "/api/v1/requests/{$request->id}/selection";

    $results = Sprint04::race([
        ['user' => $client, 'method' => 'POST', 'uri' => $uri, 'body' => ['offer_id' => Sprint04::offerTo($request->id, $a->id)->id, 'expected_version' => $version]],
        ['user' => $client, 'method' => 'POST', 'uri' => $uri, 'body' => ['offer_id' => Sprint04::offerTo($request->id, $b->id)->id, 'expected_version' => $version]],
    ]);

    $statuses = array_column($results, 0);
    sort($statuses);
    $loser = array_values(array_filter($results, fn ($r) => $r[0] === 409))[0] ?? null;
    expect($statuses)->toBe([200, 409])
        ->and($loser[1]['error']['code'])->toBe('STALE_VERSION')
        ->and(DB::table('participations')->where('request_id', $request->id)->where('slot', 'primary')->count())->toBe(1)
        ->and(DB::table('appointments')->where('request_id', $request->id)->count())->toBe(1);
});
