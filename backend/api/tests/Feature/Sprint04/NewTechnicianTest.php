<?php

// S04-TC-021, 022 y 116 · HU-S04-03 · RF-11, RF-12; RN-08 · D-20, D-69: historial neutro sin reseñas y tiempo
// estimado por mediana con 3 o más participaciones finalizadas en la subcategoría.
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

function s04Snapshot(int $requestId, int $technicianId): array
{
    return json_decode(Sprint04::candidate($requestId, $technicianId)->input_snapshot, true);
}

it('S04-TC-021 muestra al técnico nuevo con historial neutro y sin estimación [TC-044]', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    Sprint04::respond($this, $technician, Sprint04::offerTo($request->id, $technician->id), 'accept')->assertOk();

    expect((float) Sprint04::candidate($request->id, $technician->id)->rating_factor)->toBe(0.5)
        ->and(s04Snapshot($request->id, $technician->id)['history'])->toBe('new');
    Sanctum::actingAs(Sprint04::clientUser($request));
    $this->getJson("/api/v1/requests/{$request->id}/candidates")->assertOk()
        ->assertJsonPath('data.accepted.0.estimate', ['status' => 'new', 'minutes' => null, 'label' => 'Nuevo, sin estimación'])
        ->assertJsonPath('data.accepted.0.technician.rating', ['average' => null, 'count' => 0]);
});

it('S04-TC-022 mantiene H neutro con tres servicios finalizados y ninguna reseña', function () {
    $technician = Sprint04::technician();
    foreach ([45, 50, 55] as $minutes) {
        Sprint04::completedService($technician->id, $minutes);
    }
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    $snapshot = s04Snapshot($request->id, $technician->id);
    expect((float) Sprint04::candidate($request->id, $technician->id)->rating_factor)->toBe(0.5)
        ->and($snapshot['history'])->toBe('no_reviews')
        ->and($snapshot['completed_services'])->toBe(3)
        ->and($snapshot['average'])->toBeNull();
});

it('S04-TC-116 estima por la mediana de la misma subcategoría con historial suficiente [TC-140]', function () {
    $experienced = Sprint04::technician();
    foreach ([60, 150, 90] as $minutes) {
        Sprint04::completedService($experienced->id, $minutes);
    }
    Sprint04::completedService($experienced->id, 30, 'computo-redes');
    $short = Sprint04::technician();
    foreach ([60, 90] as $minutes) {
        Sprint04::completedService($short->id, $minutes);
    }
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Snapshot($request->id, $experienced->id)['estimate'])->toBe(['status' => 'estimated', 'minutes' => 90])
        ->and(s04Snapshot($request->id, $short->id)['estimate'])->toBe(['status' => 'new', 'minutes' => null]);
});
