<?php

namespace App\Modules\BMatching\Application;

use App\Modules\BMatching\Domain\Ranker;
use Illuminate\Support\Facades\DB;

/**
 * Una ejecución del matching (algoritmo matching_v1, D-19 y D-20) para la generación vigente de la solicitud. Guarda
 * la fotografía de reglas y, por candidato, factores, puntaje, orden o motivo de exclusión e insumos sin dirección
 * (matching_runs y matching_candidates). Usa la versión de reglas de la solicitud aunque haya otra vigente (D-24).
 */
final class Matcher
{
    public const ALGORITHM = 'matching_v1';

    public function __construct(
        private readonly MatchingRules $rules,
        private readonly Eligibility $eligibility,
        private readonly Ranker $ranker,
    ) {}

    public function run(object $request, string $trigger): object
    {
        $runId = DB::table('matching_runs')->insertGetId([
            'request_id' => $request->id, 'search_generation' => $request->search_generation, 'run_trigger' => $trigger,
            'attempt_no' => 1 + (int) DB::table('matching_runs')->where('request_id', $request->id)
                ->where('search_generation', $request->search_generation)->max('attempt_no'),
            'rule_version_id' => $request->rule_version_id, 'algorithm_version' => self::ALGORITHM,
            'status' => 'running', 'started_at' => now(),
        ]);
        $parameters = $this->rules->parameters((int) $request->rule_version_id);
        $weights = $this->rules->weights((int) $request->rule_version_id);
        $failure = match (true) {
            $parameters === null || $weights === null => 'RULES_INCOMPLETE',
            abs(array_sum($weights) - 100) > 1e-9 => 'INVALID_WEIGHTS',
            default => null,
        };
        if ($failure === null) {
            $eligible = $this->rankCandidates($runId, $request, $parameters, $weights);
        }
        DB::table('matching_runs')->where('id', $runId)->update([
            'status' => $failure === null ? 'completed' : 'failed', 'failure_code' => $failure,
            'rules_snapshot' => json_encode(['rule_version_id' => (int) $request->rule_version_id, 'algorithm_version' => self::ALGORITHM,
                'parameters' => $parameters, 'weights' => $weights], JSON_THROW_ON_ERROR),
            'eligible_count' => $eligible ?? 0, 'finished_at' => now(),
        ]);

        return DB::table('matching_runs')->find($runId);
    }

    /** Evalúa, puntúa y guarda a todos los técnicos; devuelve cuántos quedaron elegibles. */
    private function rankCandidates(int $runId, object $request, array $parameters, array $weights): int
    {
        $evaluated = $this->eligibility->evaluate($request);
        $eligibleIds = array_keys(array_filter($evaluated, fn (array $e) => $e['code'] === null));
        $history = new TechnicianHistory($eligibleIds, (int) $request->subcategory_id, (int) $parameters['history_real_after_completed_services']);
        $distances = $this->distances($evaluated, $eligibleIds, (int) $request->district_id);
        $rates = DB::table('service_rate_versions')->whereIn('technician_service_id', array_map(fn ($id) => $evaluated[$id]['service']->id, $eligibleIds))
            ->orderBy('version_no')->pluck('id', 'technician_service_id');

        $inputs = [];
        $snapshots = [];
        foreach ($eligibleIds as $id) {
            $service = $evaluated[$id]['service'];
            $distance = $distances[$id] ?? null;
            $inputs[] = ['technician_id' => $id, 'distance_km' => $distance === null ? null : (float) $distance->km,
                'fee' => (float) $service->reference_fee, 'experience_years' => (int) $service->experience_years,
                'history_factor' => (float) $parameters['new_technician_history_factor'], 'average' => null];
            $snapshots[$id] = [
                'fee' => $service->reference_fee, 'currency' => $service->currency, 'fee_source' => 'technician_service',
                'technician_service_id' => $service->id, 'service_rate_version_id' => $rates[$service->id] ?? null,
                'experience_years' => (int) $service->experience_years,
                'distance_km' => $distance?->km, 'distance_source' => $distance?->source,
                'base_district_id' => $evaluated[$id]['technician']->base_district_id,
            ] + $history->snapshot($id);
        }
        $ranked = $this->ranker->rank($inputs, $weights, $parameters)['candidates'];

        $rows = [];
        foreach ($evaluated as $id => $evaluation) {
            $candidate = $ranked[$id] ?? null;
            $rows[] = [
                'matching_run_id' => $runId, 'technician_id' => $id, 'eligible' => $candidate ? 1 : 0, 'exclusion_code' => $evaluation['code'],
                'proximity_factor' => $candidate['factors']['proximity'] ?? null, 'price_factor' => $candidate['factors']['price'] ?? null,
                'rating_factor' => $candidate['factors']['history'] ?? null, 'experience_factor' => $candidate['factors']['experience'] ?? null,
                'score' => $candidate['score'] ?? null, 'rank_position' => $candidate['rank_position'] ?? null, 'tie_group' => $candidate['tie_group'] ?? null,
                'input_snapshot' => json_encode($snapshots[$id] ?? ['exclusion_code' => $evaluation['code']], JSON_THROW_ON_ERROR),
            ];
        }
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('matching_candidates')->insert($chunk);
        }

        return count($eligibleIds);
    }

    /** D-64: km de la matriz entre el distrito base del técnico y el de la solicitud (par canónico). */
    private function distances(array $evaluated, array $eligibleIds, int $districtId): array
    {
        $bases = [];
        foreach ($eligibleIds as $id) {
            if ($evaluated[$id]['technician']->base_district_id !== null) {
                $bases[$id] = (int) $evaluated[$id]['technician']->base_district_id;
            }
        }
        $matrix = DB::table('district_distances')
            ->where(fn ($q) => $q->where('to_district_id', $districtId)->whereIn('from_district_id', array_unique($bases)))
            ->orWhere(fn ($q) => $q->where('from_district_id', $districtId)->whereIn('to_district_id', array_unique($bases)))
            ->get()->keyBy(fn (object $row) => $row->from_district_id === $districtId ? $row->to_district_id : $row->from_district_id);

        return array_filter(array_map(fn (int $base) => $matrix->get($base), $bases));
    }
}
