<?php

// S04-TC-015 a 019 · HU-S04-02 · RF-06, RF-08, RF-09; RN-07, RN-09 · D-20: normalización relativa por ejecución,
// casos sin división, desempate por promedio real y empate persistente. Datos sintéticos calculados a mano.
use App\Modules\BMatching\Domain\Ranker;

const S04_WEIGHTS = ['proximity' => 35, 'price' => 20, 'history' => 30, 'experience' => 15];
const S04_PARAMS = ['equal_price_factor' => 0.5];

function s04Input(int $id, ?float $km, float $fee, int $years, float $history = 0.5, ?float $average = null): array
{
    return ['technician_id' => $id, 'distance_km' => $km, 'fee' => $fee, 'experience_years' => $years,
        'history_factor' => $history, 'average' => $average];
}

it('S04-TC-015 normaliza por ejecución y puntúa 73, 50 y 30 calculados a mano', function () {
    $ranked = (new Ranker)->rank([
        s04Input(1, 0.0, 80, 2), s04Input(2, 2.0, 100, 5), s04Input(3, 4.0, 120, 10),
    ], S04_WEIGHTS, S04_PARAMS);

    expect($ranked['references'])->toEqual(['dref' => 4.0, 'aref' => 10.0])
        ->and($ranked['candidates'][1]['factors'])->toEqualWithDelta(['proximity' => 1.0, 'price' => 1.0, 'history' => 0.5, 'experience' => 0.2], 1e-9)
        ->and($ranked['candidates'][2]['factors'])->toEqualWithDelta(['proximity' => 0.5, 'price' => 0.5, 'history' => 0.5, 'experience' => 0.5], 1e-9)
        ->and($ranked['candidates'][3]['factors'])->toEqualWithDelta(['proximity' => 0.0, 'price' => 0.0, 'history' => 0.5, 'experience' => 1.0], 1e-9)
        ->and($ranked['candidates'][1]['score'])->toEqualWithDelta(73.0, 1e-9)
        ->and($ranked['candidates'][2]['score'])->toEqualWithDelta(50.0, 1e-9)
        ->and($ranked['candidates'][3]['score'])->toEqualWithDelta(30.0, 1e-9)
        ->and(array_map(fn ($c) => $c['rank_position'], $ranked['candidates']))->toBe([1 => 1, 2 => 2, 3 => 3]);
});

it('S04-TC-016 con datos iguales no divide por cero y deja a los tres empatados', function () {
    $ranked = (new Ranker)->rank([s04Input(7, 0.0, 90, 0), s04Input(8, 0.0, 90, 0), s04Input(9, 0.0, 90, 0)], S04_WEIGHTS, S04_PARAMS);

    foreach ([7, 8, 9] as $id) {
        expect($ranked['candidates'][$id]['factors'])->toEqualWithDelta(['proximity' => 1.0, 'price' => 0.5, 'history' => 0.5, 'experience' => 0.0], 1e-9)
            ->and($ranked['candidates'][$id]['score'])->toEqualWithDelta(60.0, 1e-9)
            ->and($ranked['candidates'][$id]['rank_position'])->toBe(1)
            ->and($ranked['candidates'][$id]['tie_group'])->toBe(1);
    }
});

it('S04-TC-017 desempata por promedio real 4,8 antes que 4,2 [TC-042]', function () {
    $order = (new Ranker)->order([
        ['technician_id' => 21, 'score' => 70.0, 'average' => 4.2],
        ['technician_id' => 22, 'score' => 70.0, 'average' => 4.8],
    ]);

    expect($order[22])->toBe(['rank_position' => 1, 'tie_group' => null])
        ->and($order[21])->toBe(['rank_position' => 2, 'tie_group' => null]);
});

it('S04-TC-018 informa el empate persistente sin depender del id ni del orden de entrada', function () {
    $entrada = [
        ['technician_id' => 40, 'score' => 66.5, 'average' => null],
        ['technician_id' => 12, 'score' => 66.5, 'average' => null],
        ['technician_id' => 30, 'score' => 50.0, 'average' => null],
    ];
    $directo = (new Ranker)->order($entrada);
    $invertido = (new Ranker)->order(array_reverse($entrada));

    expect($directo[40])->toBe(['rank_position' => 1, 'tie_group' => 1])
        ->and($directo[12])->toBe(['rank_position' => 1, 'tie_group' => 1])
        ->and($directo[30])->toBe(['rank_position' => 3, 'tie_group' => null]);
    ksort($directo);
    ksort($invertido);
    expect($invertido)->toBe($directo);
});

it('S04-TC-019 ordena por el puntaje sin redondear aunque ambos se muestren como 75', function () {
    $order = (new Ranker)->order([
        ['technician_id' => 5, 'score' => 75.000000, 'average' => null],
        ['technician_id' => 6, 'score' => 75.000001, 'average' => null],
    ]);

    expect(round(75.000001, 2))->toBe(round(75.0, 2))
        ->and($order[6])->toBe(['rank_position' => 1, 'tie_group' => null])
        ->and($order[5])->toBe(['rank_position' => 2, 'tie_group' => null]);
});
