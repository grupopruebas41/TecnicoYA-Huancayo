<?php

namespace App\Modules\BMatching\Application;

use App\Shared\Rules\RuleBook;
use Illuminate\Support\Facades\DB;

/**
 * Parámetros y pesos del matching de una versión de reglas (D-24, D-63). Devuelve null si a la versión le falta
 * algo: las solicitudes enviadas con la v1 no tienen parámetros de matching (RULES_INCOMPLETE). No es final para
 * que las pruebas puedan simular una versión con pesos inválidos (S04-TC-020).
 */
class MatchingRules
{
    public const REQUIRED = [
        'offer_sla_minutes', 'max_simultaneous_offers', 'pending_hours', 'new_technician_history_factor',
        'history_real_after_completed_services', 'equal_price_factor',
    ];

    private readonly RuleBook $rules;

    public function __construct(?RuleBook $rules = null)
    {
        $this->rules = $rules ?? new RuleBook;
    }

    /** @return array<string, int|float>|null */
    public function parameters(int $ruleVersionId): ?array
    {
        $values = array_intersect_key($this->rules->values($ruleVersionId), array_flip(self::REQUIRED));

        return count($values) === count(self::REQUIRED) ? $values : null;
    }

    /** @return array{proximity: float, price: float, history: float, experience: float}|null */
    public function weights(int $ruleVersionId): ?array
    {
        $row = DB::table('matching_weights')->where('rule_version_id', $ruleVersionId)->first();

        return $row === null ? null : [
            'proximity' => (float) $row->proximity_weight, 'price' => (float) $row->price_weight,
            'history' => (float) $row->history_weight, 'experience' => (float) $row->experience_weight,
        ];
    }
}
