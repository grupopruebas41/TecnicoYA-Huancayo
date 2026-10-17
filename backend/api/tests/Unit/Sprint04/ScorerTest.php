<?php

// S04-TC-014 · HU-S04-02 · RF-06, RF-08 · D-20: P = wC·C + wT·T + wH·H + wE·E, calculado a mano.
use App\Modules\BMatching\Domain\Scorer;

it('S04-TC-014 puntúa 75 sobre 100 con cuatro aportes calculados a mano [TC-041]', function () {
    $result = (new Scorer)->score(
        ['proximity' => 1.0, 'price' => 0.5, 'history' => 0.8, 'experience' => 0.4],
        ['proximity' => 35, 'price' => 20, 'history' => 30, 'experience' => 15],
    );

    expect($result['score'])->toEqualWithDelta(75.0, 1e-9)
        ->and($result['contributions'])->toEqualWithDelta(['proximity' => 35.0, 'price' => 10.0, 'history' => 24.0, 'experience' => 6.0], 1e-9)
        ->and(array_sum($result['contributions']))->toEqualWithDelta($result['score'], 1e-9);
});
