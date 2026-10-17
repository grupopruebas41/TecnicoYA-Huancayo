<?php

// S04-TC-020, 025 y 026 · HU-S04-02 · RF-06; RN-28 · D-20, D-24, D-63: pesos válidos, ejecución reproducible y
// versión de reglas de la solicitud aunque se publique otra.
use App\Modules\BMatching\Application\MatchingRules;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

/** Publica una versión nueva que copia la vigente y cambia los valores indicados. */
function s04PublishVersion(array $changes): int
{
    $current = DB::table('rule_versions')->where('status', 'published')->orderByDesc('version_no')->first();
    $id = DB::table('rule_versions')->insertGetId([
        'version_no' => $current->version_no + 1, 'status' => 'published', 'change_reason' => 'Versión sintética de prueba.',
        'effective_at' => now(), 'published_at' => now(),
    ]);
    foreach (DB::table('rule_values as v')->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')
        ->where('v.rule_version_id', $current->id)->get(['v.parameter_id', 'p.code', 'v.value_json']) as $value) {
        DB::table('rule_values')->insert(['rule_version_id' => $id, 'parameter_id' => $value->parameter_id,
            'value_json' => array_key_exists($value->code, $changes) ? json_encode($changes[$value->code]) : $value->value_json]);
    }
    $weights = (array) DB::table('matching_weights')->where('rule_version_id', $current->id)->first();
    DB::table('matching_weights')->insert(['rule_version_id' => $id] + array_intersect_key($weights,
        array_flip(['proximity_weight', 'price_weight', 'history_weight', 'experience_weight'])));

    return $id;
}

it('S04-TC-020 rechaza en MySQL los pesos que no suman 100 y no aplica pesos inválidos', function () {
    $draft = DB::table('rule_versions')->insertGetId(['version_no' => 90, 'status' => 'draft', 'change_reason' => 'Borrador sintético.']);
    expect(fn () => DB::table('matching_weights')->insert([
        'rule_version_id' => $draft, 'proximity_weight' => 35, 'price_weight' => 20, 'history_weight' => 30, 'experience_weight' => 14.99,
    ]))->toThrow(QueryException::class);

    app()->instance(MatchingRules::class, new class extends MatchingRules
    {
        public function weights(int $ruleVersionId): array
        {
            return ['proximity' => 35, 'price' => 20, 'history' => 30, 'experience' => 14.99];
        }
    });
    Sprint04::technician();
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    $run = Sprint04::run($request->id);
    expect($run->status)->toBe('failed')
        ->and($run->failure_code)->toBe('INVALID_WEIGHTS')
        ->and(DB::table('offers')->count())->toBe(0)
        ->and(DB::table('offer_rounds')->count())->toBe(0);
});

it('S04-TC-025 conserva la fotografía de la ejecución anterior al ejecutar otra generación', function () {
    $a = Sprint04::technician(['years' => 5]);
    Sprint04::technician(['years' => 10]);
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $first = Sprint04::run($request->id);

    DB::table('technician_services')->where('technician_id', $a->id)->update(['experience_years' => 20]);
    DB::table('service_requests')->where('id', $request->id)->update(['search_generation' => 2]);
    Sprint04::prepare($request->id, 2);

    $second = Sprint04::run($request->id);
    $rules = json_decode(DB::table('matching_runs')->find($first->id)->rules_snapshot, true);
    expect($second->id)->not->toBe($first->id)
        ->and((int) $second->search_generation)->toBe(2)
        ->and($rules['algorithm_version'])->toBe('matching_v1')
        ->and($rules['weights'])->toEqual(['proximity' => 35, 'price' => 20, 'history' => 30, 'experience' => 15])
        ->and($rules['parameters']['offer_sla_minutes'])->toBe(10)
        ->and((float) DB::table('matching_candidates')->where('matching_run_id', $first->id)->where('technician_id', $a->id)->value('experience_factor'))->toBe(0.5)
        ->and((float) DB::table('matching_candidates')->where('matching_run_id', $second->id)->where('technician_id', $a->id)->value('experience_factor'))->toBe(1.0);
});

it('S04-TC-026 aplica la versión de reglas de la solicitud aunque otra esté vigente', function () {
    Sprint04::technician();
    $request = Sprint04::sentRequest();
    $this->travel(1)->minutes();
    $newer = s04PublishVersion(['offer_sla_minutes' => 15]);

    Sprint04::prepare($request->id);

    $offer = DB::table('offers')->where('request_id', $request->id)->first();
    expect(CarbonImmutable::parse($offer->available_at)->diffInMinutes(CarbonImmutable::parse($offer->expires_at)))->toEqual(10)
        ->and((int) Sprint04::run($request->id)->rule_version_id)->toBe((int) $request->rule_version_id)
        ->and((int) $request->rule_version_id)->not->toBe($newer);
});
