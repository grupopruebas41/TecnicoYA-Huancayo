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
 */
final class OperationalAlerts
{
    /** Estados de una solicitud enviada que todavía no tiene técnico asignado. */
    public const UNASSIGNED = ['sent', 'pending_availability'];

    /** Orden de prioridad: primero lo que está por vencer, luego lo que espera, lo que se repite y los sensores. */
    public const PRIORITY = ['pending_expiring' => 1, 'unassigned' => 2, 'expired_chain' => 3, 'iot_unattended' => 4];

    public function __construct(private readonly RuleBook $rules) {}

    /**
     * Conteo por tipo y total; null si la versión vigente no trae los umbrales (antes de la v4), para no inventar un
     * contador con valores fijos en el código.
     *
     * @return array{unassigned: int, pending_expiring: int, expired_chain: int, iot_unattended: int, total: int}|null
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

        return ['unassigned' => $counts['unassigned'], 'pending_expiring' => $counts['pending_expiring'],
            'expired_chain' => $counts['expired_chain'], 'iot_unattended' => $counts['iot_unattended'], 'total' => count($items)];
    }

    /**
     * Lista priorizada (null sin umbrales). Cada alerta trae su tipo, la solicitud o la alerta IoT, los minutos que
     * correspondan (de espera, restantes o desde la falla) y las acciones posibles; «rematch» solo con $canRematch.
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
            $items[] = ['type' => 'unassigned', 'request_id' => (int) $row->id, 'alert_id' => null,
                'minutes' => (int) floor(CarbonImmutable::parse($row->submitted_at)->diffInMinutes($now)),
                'actions' => $actions(! isset($assigned[$row->id]))];
        }
        $expiring = DB::table('service_requests')->where('status', 'pending_availability')
            ->where('pending_expires_at', '>', $now)->where('pending_expires_at', '<=', $now->addMinutes($limits['pending']))
            ->get(['id', 'pending_expires_at']);
        foreach ($expiring as $row) {
            $items[] = ['type' => 'pending_expiring', 'request_id' => (int) $row->id, 'alert_id' => null,
                'minutes' => (int) ceil($now->diffInSeconds(CarbonImmutable::parse($row->pending_expires_at)) / 60), 'actions' => $actions(true)];
        }
        foreach ($this->expiredChains($limits['rounds']) as $requestId) {
            $items[] = ['type' => 'expired_chain', 'request_id' => $requestId, 'alert_id' => null, 'minutes' => null,
                'rounds' => $limits['rounds'], 'actions' => $actions(! isset($assigned[$requestId]))];
        }
        $failures = DB::table('iot_alerts')->where('kind', 'threshold')->where('severity', 'failure')->whereNull('resolved_at')
            ->whereNull('request_id')->where('started_at', '<', $now->subMinutes($limits['iot']))->get(['id', 'started_at']);
        foreach ($failures as $row) {
            $items[] = ['type' => 'iot_unattended', 'request_id' => null, 'alert_id' => (int) $row->id,
                'minutes' => (int) floor(CarbonImmutable::parse($row->started_at)->diffInMinutes($now)), 'actions' => ['iot']];
        }

        usort($items, fn (array $a, array $b) => [self::PRIORITY[$a['type']], $this->urgency($a)] <=> [self::PRIORITY[$b['type']], $this->urgency($b)]);

        return array_map(fn (array $item) => $item + ['priority' => self::PRIORITY[$item['type']]], $items);
    }

    /** Dentro de un tipo: por vencer, lo que menos le queda; lo demás, lo que más espera; luego por número. */
    private function urgency(array $item): array
    {
        $minutes = $item['minutes'] ?? 0;

        return [$item['type'] === 'pending_expiring' ? $minutes : -$minutes, $item['request_id'] ?? $item['alert_id']];
    }

    /** Solicitudes sin técnico cuyas últimas $rounds rondas de la búsqueda vigente cerraron sin ninguna oferta aceptada. */
    private function expiredChains(int $rounds): array
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
        })->keys()->map(fn ($id) => (int) $id)->values()->all();
    }
}
