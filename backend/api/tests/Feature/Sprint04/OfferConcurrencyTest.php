<?php

// S04-TC-040 · HU-S04-05 · RN-10.1: aceptar y rechazar a la vez la misma oferta. Dos procesos PHP reales arrancan juntos
// tras una barrera GET_LOCK; la base no va dentro de una transacción de la prueba (CommittedDatabase) para que los
// procesos vean los datos y compitan por el bloqueo de fila.
use Illuminate\Support\Facades\DB;
use Tests\Support\CommittedDatabase;
use Tests\Support\Sprint04;

uses(CommittedDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

it('S04-TC-040 deja una sola respuesta cuando llegan a la vez aceptar y rechazar', function () {
    $technician = Sprint04::technician();
    Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $offer = Sprint04::offerTo($request->id, $technician->id);
    $uri = "/api/v1/offers/{$offer->id}/response";

    $results = Sprint04::race([
        ['user' => $technician->user, 'method' => 'POST', 'uri' => $uri, 'body' => ['decision' => 'accept', 'expected_version' => 1]],
        ['user' => $technician->user, 'method' => 'POST', 'uri' => $uri, 'body' => ['decision' => 'reject', 'expected_version' => 1]],
    ]);

    $statuses = array_column($results, 0);
    sort($statuses);
    $loser = array_values(array_filter($results, fn ($r) => $r[0] === 409))[0] ?? null;
    $after = Sprint04::offerTo($request->id, $technician->id);
    expect($statuses)->toBe([200, 409])
        ->and($loser[1]['error']['code'])->toBe('STALE_VERSION')
        ->and((int) $after->version)->toBe(2)
        ->and($after->status)->toBeIn(['accepted', 'rejected'])
        ->and(DB::table('request_events')->whereIn('event_type', ['offer.accepted', 'offer.rejected'])->count())->toBe(1);
});
