<?php

namespace App\Shared\Rules;

use Illuminate\Support\Facades\DB;

/**
 * Lectura de la versión de reglas vigente (D-58; reglas formalizadas §8.2 y §8.6): la publicada con
 * effective_at más reciente que no sea futura. Los valores salen de la base, nunca de constantes (§7).
 */
final class RuleBook
{
    public function currentVersionId(): int
    {
        $id = DB::table('rule_versions')->where('status', 'published')->where('effective_at', '<=', now())
            ->orderByDesc('effective_at')->orderByDesc('version_no')->value('id');

        return $id ?? throw new RulesUnavailable('No hay una versión de reglas vigente.');
    }

    public function integer(int $versionId, string $code): int
    {
        $values = $this->values($versionId);

        return array_key_exists($code, $values) ? (int) $values[$code] : throw new RulesUnavailable("Falta el parámetro $code.");
    }

    /**
     * D-121: parámetros que eran constantes del código (D-103) y se formalizaron en la versión 4 de las reglas.
     */
    public const FORMALIZED = ['warranty_days', 'maintenance_reminder_days', 'iot_attention_tolerance_factor'];

    /**
     * Valor vigente de un parámetro formalizado (D-121): el de la versión publicada y vigente más reciente que lo trae.
     * Antes de su primera versión regía el mismo valor como constante (D-103), así que, si ninguna versión vigente lo
     * trae, vale el de la primera versión publicada que lo definió. Nunca un valor fijo en el código.
     */
    public function formalized(string $code): int|float
    {
        if (! in_array($code, self::FORMALIZED, true)) {
            throw new RulesUnavailable("$code no es un parámetro formalizado.");
        }
        $base = fn () => DB::table('rule_values as v')->join('rule_versions as r', 'r.id', '=', 'v.rule_version_id')
            ->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')->where('p.code', $code)->where('r.status', 'published');
        $row = $base()->where('r.effective_at', '<=', now())->orderByDesc('r.effective_at')->orderByDesc('r.version_no')
            ->first(['p.value_type', 'v.value_json'])
            ?? $base()->orderBy('r.version_no')->first(['p.value_type', 'v.value_json'])
            ?? throw new RulesUnavailable("Falta el parámetro $code.");

        return $this->cast($row->value_type, json_decode($row->value_json, flags: JSON_THROW_ON_ERROR));
    }

    /** @return array<string, int|float|bool|string> valores de la versión, con el tipo de su parámetro */
    public function values(int $versionId): array
    {
        return DB::table('rule_values as v')->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')
            ->where('v.rule_version_id', $versionId)->get(['p.code', 'p.value_type', 'v.value_json'])
            ->mapWithKeys(fn (object $row) => [$row->code => $this->cast($row->value_type, json_decode($row->value_json, flags: JSON_THROW_ON_ERROR))])
            ->all();
    }

    private function cast(string $type, mixed $value): int|float|bool|string
    {
        return match ($type) {
            'integer' => (int) $value,
            'decimal' => (float) $value,
            'boolean' => (bool) $value,
            default => (string) $value,
        };
    }
}
