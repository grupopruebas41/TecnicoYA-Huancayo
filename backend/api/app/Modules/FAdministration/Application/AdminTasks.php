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

    /** @return list<array{key: string, count: ?int, section: string}> */
    public function list(): array
    {
        $limits = $this->limits();
        $alerts = $this->alerts->counts();
        $now = CarbonImmutable::now();

        return [
            ['key' => 'documents_to_review', 'section' => 'verification',
                'count' => DB::table('technician_documents')->where('review_status', 'pending')->count()],
            ['key' => 'unassigned_requests', 'section' => 'alerts', 'count' => $alerts['unassigned'] ?? null],
            ['key' => 'pending_expiring', 'section' => 'alerts', 'count' => $alerts['pending_expiring'] ?? null],
            ['key' => 'keyword_misses', 'section' => 'keywords', 'count' => $limits === null ? null
                : DB::table('keyword_misses')->where('last_seen_at', '>=', $now->subDays($limits['keyword_misses_recent_days']))->count()],
            ['key' => 'iot_unattended', 'section' => 'iot', 'count' => $alerts['iot_unattended'] ?? null],
            ['key' => 'low_performance', 'section' => 'performance', 'count' => $limits === null ? null : $this->lowPerformance($limits, $now)],
        ];
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
        $rows = DB::table('offers')->where('available_at', '>=', $now->subDays(self::PERFORMANCE_DAYS))
            ->whereIn('status', ['accepted', 'rejected', 'expired'])->groupBy('technician_id')
            ->get(['technician_id', DB::raw('COUNT(*) as decided'), DB::raw("SUM(status = 'accepted') as accepted"),
                DB::raw("SUM(status = 'expired') as expired")]);

        return $rows->filter(fn (object $row) => (int) $row->decided >= $limits['low_performance_min_offers']
            && ((int) $row->accepted * 100 < $limits['low_performance_acceptance_percent'] * (int) $row->decided
                || (int) $row->expired >= $limits['low_performance_expired_offers']))->count();
    }
}
