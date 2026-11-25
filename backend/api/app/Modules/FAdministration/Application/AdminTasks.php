<?php

namespace App\Modules\FAdministration\Application;

use App\Shared\Rules\RuleBook;
use App\Shared\Rules\RulesUnavailable;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * «Tareas pendientes» del Inicio del administrador (Fase A2, D-118): cada una con su contador y la sección a la que lleva.
 * Los umbrales salen de la versión vigente de las reglas (v4, D-121); sin ellos, las tareas que los usan van en null y
 * no se inventan. Número fijo de consultas.
 */
final class AdminTasks
{
    private const PERFORMANCE_DAYS = 30;

    public function __construct(private readonly RuleBook $rules, private readonly OperationalAlerts $alerts) {}

    /**
     * Cada tarea lleva su umbral en limit (minutos o días, según la tarea; null si no tiene) para que el panel lo muestre
     * sin fijarlo en el frontend.
     *
     * @return list<array{key: string, count: ?int, section: string, limit: ?int}>
     */
    public function list(): array
    {
        $limits = $this->limits();
        $alertLimits = $this->alertLimits();
        $alerts = $this->alerts->counts();
        $now = CarbonImmutable::now();

        return [
            ['key' => 'documents_to_review', 'section' => 'verification',
                'count' => DB::table('technician_documents')->where('review_status', 'pending')->count(), 'limit' => null],
            ['key' => 'unassigned_requests', 'section' => 'alerts', 'count' => $alerts['unassigned'] ?? null,
                'limit' => $alertLimits['unassigned_alert_minutes'] ?? null],
            ['key' => 'pending_expiring', 'section' => 'alerts', 'count' => $alerts['pending_expiring'] ?? null,
                'limit' => $alertLimits['pending_expiring_alert_minutes'] ?? null],
            ['key' => 'keyword_misses', 'section' => 'keywords', 'count' => $limits === null ? null
                : DB::table('keyword_misses')->where('last_seen_at', '>=', $now->subDays($limits['keyword_misses_recent_days']))->count(), 'limit' => $limits['keyword_misses_recent_days'] ?? null],
            ['key' => 'iot_unattended', 'section' => 'iot', 'count' => $alerts['iot_unattended'] ?? null,
                'limit' => $alertLimits['iot_failure_alert_minutes'] ?? null],
            ['key' => 'low_performance', 'section' => 'performance', 'count' => $limits === null ? null : $this->lowPerformance($limits, $now),
                'limit' => self::PERFORMANCE_DAYS],
        ];
    }

    /** Umbrales de las alertas operativas (D-118) para mostrarlos junto a su tarea; vacío antes de la v4. */
    private function alertLimits(): array
    {
        try {
            $values = $this->rules->values($this->rules->currentVersionId());
        } catch (RulesUnavailable) {
            return [];
        }

        return array_intersect_key($values, array_flip(['unassigned_alert_minutes', 'pending_expiring_alert_minutes', 'iot_failure_alert_minutes']));
    }

    /** Umbrales de D-118 de la versión vigente, o null si no los trae (antes de la v4). */
    private function limits(): ?array
    {
        try {
            $version = $this->rules->currentVersionId();

            return collect(['keyword_misses_recent_days', 'low_performance_min_offers', 'low_performance_acceptance_percent',
                'low_performance_expired_offers'])->mapWithKeys(fn (string $code) => [$code => $this->rules->integer($version, $code)])->all();
        } catch (RulesUnavailable) {
            return null;
        }
    }

    /**
     * Técnicos con desempeño bajo en 30 días: con low_performance_min_offers o más ofertas decididas (aceptadas,
     * rechazadas o vencidas), aceptación menor a low_performance_acceptance_percent o low_performance_expired_offers
     * vencidas o más.
     */
    private function lowPerformance(array $limits, CarbonImmutable $now): int
    {
        return app(LowPerformance::class)->technicians($limits, $now)->count();
    }
}
