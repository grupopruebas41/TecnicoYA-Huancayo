<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// D-121 (ADM-16) y D-118 (ADM-13): versión 4 de las reglas, publicada por migración como la 2 y la 3 (D-63). Copia los
// valores y los pesos de la v3 y suma lo que estaba fijo en el código (garantía, mantenimiento y factor IoT de D-103) y
// los umbrales de las alertas operativas del administrador. Ninguno se edita desde el panel (D-115: editable = 0).
return new class extends Migration
{
    private const EFFECTIVE = '2026-11-24 00:00:00';

    /** código => [tipo, unidad, valor, mínimo, descripción] */
    private const PARAMETERS = [
        'warranty_days' => ['integer', 'días', 30, 1, 'Días de garantía de ejemplo desde el cierre del servicio (D-103).'],
        'maintenance_reminder_days' => ['integer', 'días', 180, 1, 'Días entre mantenimientos preventivos de un equipo con sensor (D-103).'],
        'iot_attention_tolerance_factor' => ['decimal', 'veces la tolerancia', 2, 1, 'Hasta cuántas veces la tolerancia un sensor está en atención; más allá, en falla (D-103).'],
        'unassigned_alert_minutes' => ['integer', 'minutos', 30, 1, 'Minutos desde el envío sin técnico asignado para alertar al administrador (D-118).'],
        'pending_expiring_alert_minutes' => ['integer', 'minutos', 120, 1, 'Minutos o menos que le quedan al pendiente de 24 h para alertar (D-118).'],
        'expired_rounds_alert_count' => ['integer', 'rondas', 2, 1, 'Rondas seguidas cerradas sin oferta aceptada para alertar (D-118).'],
        'iot_failure_alert_minutes' => ['integer', 'minutos', 60, 1, 'Minutos de una falla IoT abierta sin solicitud para alertar (D-118).'],
        'low_performance_min_offers' => ['integer', 'ofertas', 5, 1, 'Ofertas en 30 días para evaluar el desempeño de un técnico (D-118).'],
        'low_performance_acceptance_percent' => ['integer', '%', 40, 0, 'Aceptación por debajo de la cual el desempeño es bajo (D-118).'],
        'low_performance_expired_offers' => ['integer', 'ofertas', 3, 1, 'Ofertas vencidas en 30 días desde las que el desempeño es bajo (D-118).'],
        'keyword_misses_recent_days' => ['integer', 'días', 7, 1, 'Días en que una búsqueda sin resultado cuenta como nueva (D-118).'],
    ];

    public function up(): void
    {
        $previous = DB::table('rule_versions')->where('version_no', 3)->value('id');
        $values = DB::table('rule_values as v')->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')
            ->where('v.rule_version_id', $previous)->pluck('v.value_json', 'p.code')
            ->map(fn (string $json) => json_decode($json, flags: JSON_THROW_ON_ERROR))->all();
        foreach (self::PARAMETERS as $code => [$type, $unit, $value, $min, $description]) {
            DB::table('rule_parameters')->insert([
                'code' => $code, 'value_type' => $type, 'unit' => $unit, 'description' => $description,
                'min_value' => $min, 'max_value' => null, 'required' => 1, 'editable' => 0,
            ]);
            $values[$code] = $value;
        }
        ksort($values);
        $weights = (array) DB::table('matching_weights')->where('rule_version_id', $previous)
            ->first(['proximity_weight', 'price_weight', 'history_weight', 'experience_weight']);
        $versionId = DB::table('rule_versions')->insertGetId([
            'version_no' => 4, 'status' => 'published',
            'change_reason' => 'Garantía, mantenimiento, factor IoT y umbrales de las alertas del administrador como reglas (D-121, D-118).',
            'effective_at' => self::EFFECTIVE, 'published_at' => self::EFFECTIVE,
            'content_hash' => hash('sha256', json_encode(['values' => $values, 'weights' => $weights], JSON_THROW_ON_ERROR)),
        ]);
        $ids = DB::table('rule_parameters')->pluck('id', 'code');
        foreach ($values as $code => $value) {
            DB::table('rule_values')->insert(['rule_version_id' => $versionId, 'parameter_id' => $ids[$code], 'value_json' => json_encode($value)]);
        }
        DB::table('matching_weights')->insert(['rule_version_id' => $versionId] + $weights);
    }

    public function down(): void
    {
        $version = DB::table('rule_versions')->where('version_no', 4)->value('id');
        if ($version) {
            if (DB::table('service_requests')->where('rule_version_id', $version)->exists()) {
                throw new RuntimeException('Hay solicitudes con la versión 4 de las reglas; no se puede revertir.');
            }
            DB::table('matching_weights')->where('rule_version_id', $version)->delete();
            DB::table('rule_values')->where('rule_version_id', $version)->delete();
            DB::table('rule_versions')->where('id', $version)->delete();
        }
        DB::table('rule_parameters')->whereIn('code', array_keys(self::PARAMETERS))->delete();
    }
};
