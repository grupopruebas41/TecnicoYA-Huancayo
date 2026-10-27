<?php

// S04-TC-115 · HU-S04-03 · RF-11; RN-09 · D-64: la distancia es la de la matriz de distritos entre el distrito base del
// técnico y el de la solicitud, aproximada por zona y sin coordenadas. Matriz sintética de prueba.
// S04-TC-138 · DIST-02 (opción A, definitiva en el cierre S4.6): sin distrito base, el técnico sigue elegible con C = 0.
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

function s04Distance(int $from, int $to, string $km): void
{
    DB::table('district_distances')->updateOrInsert(
        ['from_district_id' => min($from, $to), 'to_district_id' => max($from, $to)],
        ['km' => $km, 'source' => 'Matriz sintética de prueba'],
    );
}

it('S04-TC-115 mide la distancia desde el distrito base con la matriz de distritos [TC-043]', function () {
    $tambo = Sprint04::district('EL-TAMBO');
    $chilca = Sprint04::district('CHILCA');
    s04Distance($tambo, $chilca, '6.000');
    s04Distance($chilca, $chilca, '1.000');
    $far = Sprint04::technician(['districts' => [$chilca], 'base' => $tambo]);
    $near = Sprint04::technician(['districts' => [$chilca], 'base' => $chilca]);
    $request = Sprint04::sentRequest(['district_id' => $chilca]);

    Sprint04::prepare($request->id);

    $farSnapshot = json_decode(Sprint04::candidate($request->id, $far->id)->input_snapshot, true);
    $nearSnapshot = json_decode(Sprint04::candidate($request->id, $near->id)->input_snapshot, true);
    expect($farSnapshot['distance_km'])->toBe('6.000')
        ->and($farSnapshot['distance_source'])->toBe('Matriz sintética de prueba')
        ->and($nearSnapshot['distance_km'])->toBe('1.000')
        ->and(array_intersect(['lat', 'lng', 'latitude', 'longitude'], array_keys($farSnapshot)))->toBe([]);

    Sprint04::respond($this, $far, Sprint04::offerTo($request->id, $far->id), 'accept')->assertOk();
    Sprint04::respond($this, $near, Sprint04::offerTo($request->id, $near->id), 'reject')->assertOk();
    Sanctum::actingAs(Sprint04::clientUser($request));
    $this->getJson("/api/v1/requests/{$request->id}/candidates")->assertOk()
        ->assertJsonPath('data.accepted.0.distance', ['km' => '6.000', 'approximate' => true, 'label' => 'aproximada por zona']);
});

it('S04-TC-138 un técnico sin distrito base sigue elegible con cercanía 0 y distancia null (DIST-02, opción A)', function () {
    $chilca = Sprint04::district('CHILCA');
    s04Distance($chilca, $chilca, '1.000');
    $tambo = Sprint04::district('EL-TAMBO');
    s04Distance($tambo, $chilca, '6.000');
    Sprint04::technician(['districts' => [$chilca], 'base' => $tambo]); // el más lejano fija la referencia (C = 0)
    $withoutBase = Sprint04::technician(['districts' => [$chilca]]);
    DB::table('technician_profiles')->where('id', $withoutBase->id)->update(['base_district_id' => null]);
    $withBase = Sprint04::technician(['districts' => [$chilca], 'base' => $chilca]);
    $request = Sprint04::sentRequest(['district_id' => $chilca]);

    Sprint04::prepare($request->id);

    $missing = Sprint04::candidate($request->id, $withoutBase->id);
    $declared = Sprint04::candidate($request->id, $withBase->id);
    expect([(int) $missing->eligible, $missing->exclusion_code, (float) $missing->proximity_factor])->toBe([1, null, 0.0])
        ->and(json_decode($missing->input_snapshot, true)['distance_km'])->toBeNull()
        ->and((float) $declared->proximity_factor)->toBe(0.833333) // 1 − 1 km / 6 km
        ->and(Sprint04::offerTo($request->id, $withoutBase->id))->not->toBeNull();

    Sprint04::respond($this, $withoutBase, Sprint04::offerTo($request->id, $withoutBase->id), 'accept')->assertOk();
    Sanctum::actingAs(Sprint04::clientUser($request));
    $this->getJson("/api/v1/requests/{$request->id}/candidates")->assertOk()->assertJsonPath('data.accepted.0.distance', null);
});
