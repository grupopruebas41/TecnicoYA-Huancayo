<?php

namespace App\Modules\FAdministration\Application;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Emparejamiento en vivo (Fase A3): solicitudes que buscan técnico con su ronda actual y sus ofertas abiertas (con el
 * vencimiento para la cuenta regresiva), las que están en el pendiente de 24 h y las ofertas vencidas de las últimas 24 h.
 * Sin datos personales: servicio, distrito y nombres públicos de los técnicos. Número fijo de consultas y nada de SQL
 * propio de un motor (DEF-83). La hora del servidor va en server_time para que el panel calcule la cuenta regresiva.
 */
final class AdminMatchingBoard
{
    private const EXPIRED_WINDOW_HOURS = 24;

    public function snapshot(): array
    {
        $now = CarbonImmutable::now();
        $iso = fn (?string $value) => $value === null ? null : CarbonImmutable::parse($value)->toISOString();
        $requests = DB::table('service_requests as s')->join('subcategories as sc', 'sc.id', '=', 's.subcategory_id')
            ->join('specialties as sp', 'sp.id', '=', 'sc.specialty_id')->join('districts as d', 'd.id', '=', 's.district_id')
            ->whereIn('s.status', OperationalAlerts::UNASSIGNED)
            ->whereNotExists(fn ($q) => $q->from('participations as p')->whereColumn('p.request_id', 's.id')->whereIn('p.status', ['assigned', 'in_progress']))
            ->orderBy('s.submitted_at')->orderBy('s.id')
            ->get(['s.id', 's.status', 's.search_generation', 's.submitted_at', 's.pending_expires_at', 'sp.name as specialty',
                'sc.name as subcategory', 'd.name as district']);
        $ids = $requests->pluck('id')->all();
        $rounds = DB::table('offer_rounds')->whereIn('request_id', $ids)->orderByDesc('search_generation')->orderByDesc('round_no')
            ->get(['id', 'request_id', 'search_generation', 'round_no', 'status', 'opened_at', 'expires_at'])->groupBy('request_id');
        $open = DB::table('offers as o')->join('technician_profiles as t', 't.id', '=', 'o.technician_id')->whereIn('o.request_id', $ids)
            ->where('o.status', 'pending')->orderBy('o.expires_at')->orderBy('o.id')
            ->get(['o.id', 'o.request_id', 'o.expires_at', 't.id as technician_id', 't.display_name'])->groupBy('request_id');
        $expired = DB::table('offers as o')->join('technician_profiles as t', 't.id', '=', 'o.technician_id')
            ->join('service_requests as s', 's.id', '=', 'o.request_id')->join('subcategories as sc', 'sc.id', '=', 's.subcategory_id')
            ->where('o.status', 'expired')->where('o.updated_at', '>=', $now->subHours(self::EXPIRED_WINDOW_HOURS))
            ->orderByDesc('o.updated_at')->orderByDesc('o.id')->limit(50)
            ->get(['o.id', 'o.request_id', 'o.expires_at', 't.id as technician_id', 't.display_name', 'sc.name as subcategory']);

        $present = function (object $row) use ($rounds, $open, $iso) {
            $round = ($rounds[$row->id] ?? collect())->first(fn (object $item) => (int) $item->search_generation === (int) $row->search_generation);

            return [
                'id' => (int) $row->id, 'status' => $row->status, 'specialty' => $row->specialty, 'subcategory' => $row->subcategory,
                'district' => $row->district, 'submitted_at' => $iso($row->submitted_at), 'pending_expires_at' => $iso($row->pending_expires_at),
                'round' => $round === null ? null : ['round_no' => (int) $round->round_no, 'status' => $round->status,
                    'opened_at' => $iso($round->opened_at), 'expires_at' => $iso($round->expires_at)],
                'open_offers' => ($open[$row->id] ?? collect())->map(fn (object $offer) => ['id' => (int) $offer->id,
                    'technician' => ['id' => (int) $offer->technician_id, 'name' => $offer->display_name], 'expires_at' => $iso($offer->expires_at)])->values()->all(),
            ];
        };

        return [
            'searching' => $requests->where('status', 'sent')->map($present)->values()->all(),
            'pending' => $requests->where('status', 'pending_availability')->map($present)->values()->all(),
            'expired_offers' => $expired->map(fn (object $offer) => ['id' => (int) $offer->id, 'request_id' => (int) $offer->request_id,
                'subcategory' => $offer->subcategory, 'technician' => ['id' => (int) $offer->technician_id, 'name' => $offer->display_name],
                'expires_at' => $iso($offer->expires_at)])->all(),
            'server_time' => $now->toISOString(),
        ];
    }
}
