<?php

namespace App\Modules\FAdministration\Application;

use App\Shared\Rules\RuleBook;
use App\Shared\Rules\RulesUnavailable;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Alertas operativas del administrador (D-118), con los umbrales de la versión de reglas vigente (D-121). Una sola fuente
 * para la lista priorizada de la Fase A3 (items) y para los contadores del menú y de las tareas (counts). Los minutos se
 * calculan en PHP para que funcione igual en MySQL y en SQLite (DEF-83). Número fijo de consultas.
 *
 * Revisión del #70: cada alerta trae su nivel (urgent: sin técnico hace más de 24 h y fallas IoT; attention: sin técnico
 * hace más del umbral, pendiente por vencer y rondas vencidas en cadena; follow_up: desempeño bajo), el servicio y el
 * distrito de la solicitud y las rondas de la búsqueda vigente que cerraron sin aceptación.
 */
final class OperationalAlerts
{
    /** Estados de una solicitud enviada que todavía no tiene técnico asignado. */
    public const UNASSIGNED = ['sent', 'pending_availability'];

    /** Orden de prioridad: lo que está por vencer, lo que espera, lo que se repite, los sensores y el desempeño. */
    public const PRIORITY = ['pending_expiring' => 1, 'unassigned' => 2, 'expired_chain' => 3, 'iot_unattended' => 4, 'low_performance' => 5];

    /** Sin técnico desde hace un día o más: pasa de «Atención» a «Urgente». */
    public const URGENT_UNASSIGNED_MINUTES = 1440;

    public function __construct(private readonly RuleBook $rules, private readonly LowPerformance $performance) {}

    /**
     * Conteo por tipo y total; null si la versión vigente no trae los umbrales (antes de la v4), para no inventar un
     * contador con valores fijos en el código.
     *
     * @return array{unassigned: int, pending_expiring: int, expired_chain: int, iot_unattended: int, low_performance: int, total: int}|null
     */
    public function counts(): ?array
    {
        $items = $this->items();
        if ($items === null) {
            return null;
        }
        $counts = array_map(fn () => 0, array_flip(array_keys(self::PRIORITY)));
        foreach ($items as $item) {
            $counts[$item['type']]++;
        }

        return $counts + ['total' => count($items)];
    }

    /**
     * Lista priorizada (null sin umbrales). Cada alerta trae su tipo, nivel, la solicitud, la alerta IoT o el técnico, los
     * minutos que correspondan (de espera, restantes o desde la falla) y las acciones posibles; «rematch» solo con $canRematch.
     */
    public function items(bool $canRematch = false): ?array
    {
        try {
            $version = $this->rules->currentVersionId();
            $limits = [
                'unassigned' => $this->rules->integer($version, 'unassigned_alert_minutes'),
                'pending' => $this->rules->integer($version, 'pending_expiring_alert_minutes'),
                'rounds' => $this->rules->integer($version, 'expired_rounds_alert_count'),
                'iot' => $this->rules->integer($version, 'iot_failure_alert_minutes'),
            ];
            $performance = collect(['low_performance_min_offers', 'low_performance_acceptance_percent', 'low_performance_expired_offers'])
                ->mapWithKeys(fn (string $code) => [$code => $this->rules->integer($version, $code)])->all();
        } catch (RulesUnavailable) {
            return null;
        }
        $now = CarbonImmutable::now();
        $actions = fn (bool $rematch) => $rematch && $canRematch ? ['open', 'rematch'] : ['open'];
        $assigned = DB::table('participations')->whereIn('status', ['assigned', 'in_progress'])->pluck('request_id')->flip();
        $items = [];

        $waiting = DB::table('service_requests')->whereIn('status', self::UNASSIGNED)
            ->where('submitted_at', '<', $now->subMinutes($limits['unassigned']))->get(['id', 'status', 'submitted_at']);
        foreach ($waiting as $row) {
            $minutes = (int) floor(CarbonImmutable::parse($row->submitted_at)->diffInMinutes($now));
            $items[] = ['type' => 'unassigned', 'level' => $minutes >= self::URGENT_UNASSIGNED_MINUTES ? 'urgent' : 'attention',
                'request_id' => (int) $row->id, 'alert_id' => null, 'minutes' => $minutes, 'actions' => $actions(! isset($assigned[$row->id]))];
        }
        $expiring = DB::table('service_requests')->where('status', 'pending_availability')
            ->where('pending_expires_at', '>', $now)->where('pending_expires_at', '<=', $now->addMinutes($limits['pending']))
            ->get(['id', 'pending_expires_at']);
        foreach ($expiring as $row) {
            $items[] = ['type' => 'pending_expiring', 'level' => 'attention', 'request_id' => (int) $row->id, 'alert_id' => null,
                'minutes' => (int) ceil($now->diffInSeconds(CarbonImmutable::parse($row->pending_expires_at)) / 60), 'actions' => $actions(true)];
        }
        $closed = $this->closedRounds();
        foreach ($this->expiredChains($closed, $limits['rounds']) as $requestId) {
            $items[] = ['type' => 'expired_chain', 'level' => 'attention', 'request_id' => $requestId, 'alert_id' => null, 'minutes' => null,
                'rounds' => $limits['rounds'], 'actions' => $actions(! isset($assigned[$requestId]))];
        }
        $failures = DB::table('iot_alerts as a')->join('iot_devices as d', 'd.id', '=', 'a.device_id')->where('a.kind', 'threshold')
            ->where('a.severity', 'failure')->whereNull('a.resolved_at')->whereNull('a.request_id')
            ->where('a.started_at', '<', $now->subMinutes($limits['iot']))->get(['a.id', 'a.started_at', 'a.message', 'd.name as device']);
        foreach ($failures as $row) {
            $items[] = ['type' => 'iot_unattended', 'level' => 'urgent', 'request_id' => null, 'alert_id' => (int) $row->id,
                'minutes' => (int) floor(CarbonImmutable::parse($row->started_at)->diffInMinutes($now)), 'device' => $row->device,
                'message' => $row->message, 'actions' => ['iot']];
        }
        foreach ($this->performance->technicians($performance, $now) as $technician) {
            $items[] = ['type' => 'low_performance', 'level' => 'follow_up', 'request_id' => null, 'alert_id' => null, 'minutes' => null,
                'technician' => ['id' => $technician['id'], 'name' => $technician['name']], 'offers' => $technician['offers'],
                'accepted' => $technician['accepted'], 'expired' => $technician['expired'], 'days' => LowPerformance::DAYS, 'actions' => ['review']];
        }

        $items = $this->withRequests($items, $closed);
        usort($items, fn (array $a, array $b) => [self::PRIORITY[$a['type']], $this->urgency($a)] <=> [self::PRIORITY[$b['type']], $this->urgency($b)]);

        return array_map(fn (array $item) => $item + ['priority' => self::PRIORITY[$item['type']]], $items);
    }

    /** Especialidad, subcategoría y distrito de cada solicitud con alerta, y sus rondas vigentes cerradas sin aceptación. */
    private function withRequests(array $items, $closed): array
    {
        $ids = array_values(array_unique(array_filter(array_column($items, 'request_id'))));
        $services = DB::table('service_requests as s')->join('subcategories as sc', 'sc.id', '=', 's.subcategory_id')
            ->join('specialties as sp', 'sp.id', '=', 'sc.specialty_id')->join('districts as d', 'd.id', '=', 's.district_id')
            ->whereIn('s.id', $ids)->get(['s.id', 'sp.name as specialty', 'sc.name as subcategory', 'd.name as district'])->keyBy('id');

        return array_map(function (array $item) use ($services, $closed) {
            $service = $item['request_id'] === null ? null : $services[$item['request_id']] ?? null;
            if ($service === null) {
                return $item;
            }

            return $item + ['request' => ['specialty' => $service->specialty, 'subcategory' => $service->subcategory, 'district' => $service->district],
                'rounds_without_acceptance' => ($closed[$item['request_id']] ?? collect())->filter(fn (object $round) => $round->status === 'closed'
                    && (int) $round->accepted === 0)->count()];
        }, $items);
    }

    /** Dentro de un tipo: por vencer, lo que menos le queda; lo demás, lo que más espera; luego por número. */
    private function urgency(array $item): array
    {
        $minutes = $item['minutes'] ?? 0;

        return [$item['type'] === 'pending_expiring' ? $minutes : -$minutes, $item['request_id'] ?? $item['alert_id'] ?? $item['technician']['id'] ?? 0];
    }

    /** Rondas de la búsqueda vigente de las solicitudes sin técnico, de la última a la primera, con sus aceptadas. */
    private function closedRounds()
    {
        return DB::table('offer_rounds as o')->join('service_requests as s', fn ($join) => $join->on('s.id', '=', 'o.request_id')
            ->on('s.search_generation', '=', 'o.search_generation'))
            ->whereIn('s.status', self::UNASSIGNED)
            ->leftJoin('offers as f', fn ($join) => $join->on('f.round_id', '=', 'o.id')->where('f.status', 'accepted'))
            ->groupBy('o.id', 'o.request_id', 'o.round_no', 'o.status')
            ->orderBy('o.request_id')->orderByDesc('o.round_no')
            ->get(['o.request_id', 'o.round_no', 'o.status', DB::raw('COUNT(f.id) as accepted')])->groupBy('request_id');
    }

    /** Solicitudes sin técnico cuyas últimas $rounds rondas de la búsqueda vigente cerraron sin ninguna oferta aceptada. */
    private function expiredChains($closed, int $rounds): array
    {
        return $closed->filter(function ($list) use ($rounds) {
            $last = $list->take($rounds);

            return $last->count() === $rounds && $last->every(fn (object $round) => $round->status === 'closed' && (int) $round->accepted === 0);
        })->keys()->map(fn ($id) => (int) $id)->values()->all();
    }
}
