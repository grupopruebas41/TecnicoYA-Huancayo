<?php

namespace App\Modules\FAdministration\Application;

use App\Shared\Rules\RuleBook;
use App\Shared\Rules\RulesUnavailable;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Alertas operativas del administrador (D-118), con los umbrales de la versión de reglas vigente (D-121). Fase A1: solo
 * los conteos para el menú; la lista priorizada con su acción llega en la Fase A3. Número fijo de consultas.
 */
final class OperationalAlerts
{
    /** Estados de una solicitud enviada que todavía no tiene técnico asignado. */
    public const UNASSIGNED = ['sent', 'pending_availability'];

    public function __construct(private readonly RuleBook $rules) {}

    /**
     * Conteo por tipo y total; null si la versión vigente no trae los umbrales (antes de la v4), para no inventar un
     * contador con valores fijos en el código.
     *
     * @return array{unassigned: int, pending_expiring: int, expired_chain: int, iot_unattended: int, total: int}|null
     */
    public function counts(): ?array
    {
        try {
            $version = $this->rules->currentVersionId();
            $limits = [
                'unassigned' => $this->rules->integer($version, 'unassigned_alert_minutes'),
                'pending' => $this->rules->integer($version, 'pending_expiring_alert_minutes'),
                'rounds' => $this->rules->integer($version, 'expired_rounds_alert_count'),
                'iot' => $this->rules->integer($version, 'iot_failure_alert_minutes'),
            ];
        } catch (RulesUnavailable) {
            return null;
        }
        $now = CarbonImmutable::now();
        $counts = [
            'unassigned' => DB::table('service_requests')->whereIn('status', self::UNASSIGNED)
                ->where('submitted_at', '<', $now->subMinutes($limits['unassigned']))->count(),
            'pending_expiring' => DB::table('service_requests')->where('status', 'pending_availability')
                ->where('pending_expires_at', '>', $now)->where('pending_expires_at', '<=', $now->addMinutes($limits['pending']))->count(),
            'expired_chain' => $this->expiredChains($limits['rounds']),
            'iot_unattended' => DB::table('iot_alerts')->where('kind', 'threshold')->where('severity', 'failure')
                ->whereNull('resolved_at')->whereNull('request_id')->where('started_at', '<', $now->subMinutes($limits['iot']))->count(),
        ];

        return $counts + ['total' => array_sum($counts)];
    }

    /** Solicitudes sin técnico cuyas últimas $rounds rondas de la búsqueda vigente cerraron sin ninguna oferta aceptada. */
    private function expiredChains(int $rounds): int
    {
        $rows = DB::table('offer_rounds as o')->join('service_requests as s', fn ($join) => $join->on('s.id', '=', 'o.request_id')
            ->on('s.search_generation', '=', 'o.search_generation'))
            ->whereIn('s.status', self::UNASSIGNED)
            ->leftJoin('offers as f', fn ($join) => $join->on('f.round_id', '=', 'o.id')->where('f.status', 'accepted'))
            ->groupBy('o.id', 'o.request_id', 'o.round_no', 'o.status')
            ->orderBy('o.request_id')->orderByDesc('o.round_no')
            ->get(['o.request_id', 'o.round_no', 'o.status', DB::raw('COUNT(f.id) as accepted')]);

        return $rows->groupBy('request_id')->filter(function ($list) use ($rounds) {
            $last = $list->take($rounds);

            return $last->count() === $rounds && $last->every(fn (object $round) => $round->status === 'closed' && (int) $round->accepted === 0);
        })->count();
    }
}
