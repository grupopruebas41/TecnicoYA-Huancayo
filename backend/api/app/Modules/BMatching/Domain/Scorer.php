<?php

namespace App\Modules\BMatching\Domain;

/** D-20: P = wC·C + wT·T + wH·H + wE·E, con los pesos en puntos sobre 100 de la versión de reglas. */
final class Scorer
{
    public const FACTORS = ['proximity', 'price', 'history', 'experience'];

    /**
     * @param  array<string, float>  $factors  valores de 0 a 1
     * @param  array<string, float>  $weights  pesos que suman 100
     * @return array{score: float, contributions: array<string, float>}
     */
    public function score(array $factors, array $weights): array
    {
        $contributions = [];
        foreach (self::FACTORS as $factor) {
            $contributions[$factor] = (float) $weights[$factor] * (float) $factors[$factor];
        }

        return ['score' => array_sum($contributions), 'contributions' => $contributions];
    }
}
