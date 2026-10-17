<?php

namespace App\Modules\BMatching\Domain;

/**
 * Normalización relativa por ejecución, puntaje y orden (D-20, RN-06, RN-07, RN-09).
 * - C = clamp(1 − d / Dref) y C = 1 si Dref = 0; sin distancia conocida, C = 0 (no aporta cercanía).
 * - T = (pmax − p) / (pmax − pmin) y equal_price_factor si todas las tarifas coinciden.
 * - H llega calculado (historial); E = clamp(a / Aref) y E = 0 si Aref = 0.
 * El orden usa el puntaje sin redondear y, a igual puntaje, el promedio real. El empate persistente comparte
 * posición y tie_group, sin depender del id ni del orden de entrada.
 */
final class Ranker
{
    /** Precisión con la que se guarda el puntaje (decimal 10,6): dos puntajes iguales a esa escala empatan. */
    private const SCALE = 6;

    public function __construct(private readonly Scorer $scorer = new Scorer) {}

    /**
     * @param  array<int, array{technician_id:int, distance_km:?float, fee:float|string, experience_years:int, history_factor:float, average:?float}>  $inputs
     * @return array{references: array{dref: float, aref: float}, candidates: array<int, array>}
     */
    public function rank(array $inputs, array $weights, array $params): array
    {
        $distances = array_filter(array_column($inputs, 'distance_km'), fn ($d) => $d !== null);
        $fees = array_map('floatval', array_column($inputs, 'fee'));
        $years = array_map('intval', array_column($inputs, 'experience_years'));
        $dref = $distances === [] ? 0.0 : (float) max($distances);
        $aref = $years === [] ? 0.0 : (float) max($years);
        $pmax = $fees === [] ? 0.0 : max($fees);
        $pmin = $fees === [] ? 0.0 : min($fees);

        $candidates = [];
        foreach ($inputs as $input) {
            $factors = [
                'proximity' => $this->proximity($input['distance_km'], $dref),
                'price' => $pmax === $pmin ? (float) $params['equal_price_factor'] : ($pmax - (float) $input['fee']) / ($pmax - $pmin),
                'history' => (float) $input['history_factor'],
                'experience' => $aref === 0.0 ? 0.0 : $this->clamp($input['experience_years'] / $aref),
            ];
            $candidates[$input['technician_id']] = ['factors' => $factors] + $this->scorer->score($factors, $weights);
        }
        $order = $this->order(array_map(fn (array $input) => [
            'technician_id' => $input['technician_id'], 'score' => $candidates[$input['technician_id']]['score'], 'average' => $input['average'],
        ], $inputs));
        foreach ($order as $id => $position) {
            $candidates[$id] += $position;
        }

        return ['references' => ['dref' => $dref, 'aref' => $aref], 'candidates' => $candidates];
    }

    /**
     * @param  array<int, array{technician_id:int, score:float, average:?float}>  $scored
     * @return array<int, array{rank_position:int, tie_group:?int}> por id de técnico
     */
    public function order(array $scored): array
    {
        usort($scored, fn (array $a, array $b) => $this->key($b) <=> $this->key($a));
        $groups = [];
        foreach ($scored as $entry) {
            $groups[implode('|', $this->key($entry))][] = $entry['technician_id'];
        }
        $result = [];
        $position = 1;
        foreach ($groups as $members) {
            foreach ($members as $id) {
                $result[$id] = ['rank_position' => $position, 'tie_group' => count($members) > 1 ? $position : null];
            }
            $position += count($members);
        }

        return $result;
    }

    /** Clave de orden: puntaje a la escala guardada y promedio real (sin promedio va después). */
    private function key(array $entry): array
    {
        return [round((float) $entry['score'], self::SCALE), $entry['average'] === null ? -1.0 : round((float) $entry['average'], 2)];
    }

    private function proximity(?float $distance, float $dref): float
    {
        if ($distance === null) {
            return 0.0;
        }

        return $dref === 0.0 ? 1.0 : $this->clamp(1 - $distance / $dref);
    }

    private function clamp(float $value): float
    {
        return max(0.0, min(1.0, $value));
    }
}
