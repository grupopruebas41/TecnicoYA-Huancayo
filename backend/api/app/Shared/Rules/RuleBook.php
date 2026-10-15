<?php

namespace App\Shared\Rules;

use Illuminate\Support\Facades\DB;
use RuntimeException;

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

        return $id ?? throw new RuntimeException('No hay una versión de reglas vigente.');
    }

    public function integer(int $versionId, string $code): int
    {
        $value = DB::table('rule_values as v')->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')
            ->where('v.rule_version_id', $versionId)->where('p.code', $code)->value('v.value_json');

        return $value === null ? throw new RuntimeException("Falta el parámetro $code.") : (int) json_decode($value, flags: JSON_THROW_ON_ERROR);
    }
}
