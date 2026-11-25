<?php

namespace App\Modules\FAdministration\Application;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Técnicos con desempeño bajo (D-118) en los últimos 30 días: con low_performance_min_offers o más ofertas decididas
 * (aceptadas, rechazadas o vencidas) y aceptación menor a low_performance_acceptance_percent o
 * low_performance_expired_offers vencidas o más. Una sola fuente para la tarea del Inicio y la alerta de seguimiento.
 */
final class LowPerformance
{
    public const DAYS = 30;

    /** @param array{low_performance_min_offers:int, low_performance_acceptance_percent:int, low_performance_expired_offers:int} $limits */
    public function technicians(array $limits, CarbonImmutable $now): Collection
    {
        $rows = DB::table('offers as o')->join('technician_profiles as t', 't.id', '=', 'o.technician_id')
            ->where('o.available_at', '>=', $now->subDays(self::DAYS))->whereIn('o.status', ['accepted', 'rejected', 'expired'])
            ->groupBy('o.technician_id', 't.display_name')->orderBy('o.technician_id')
            ->get(['o.technician_id', 't.display_name', DB::raw('COUNT(*) as decided'), DB::raw("SUM(CASE WHEN o.status = 'accepted' THEN 1 ELSE 0 END) as accepted"),
                DB::raw("SUM(CASE WHEN o.status = 'expired' THEN 1 ELSE 0 END) as expired")]);

        return $rows->filter(fn (object $row) => (int) $row->decided >= $limits['low_performance_min_offers']
            && ((int) $row->accepted * 100 < $limits['low_performance_acceptance_percent'] * (int) $row->decided
                || (int) $row->expired >= $limits['low_performance_expired_offers']))
            ->map(fn (object $row) => ['id' => (int) $row->technician_id, 'name' => $row->display_name, 'offers' => (int) $row->decided,
                'accepted' => (int) $row->accepted, 'expired' => (int) $row->expired])->values();
    }
}
