<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Solicitudes del panel (bloque C, D-85; permiso dashboard.view). El listado no expone la dirección. Fase A3: el detalle
 * suma el cliente sin datos sensibles (sin correo, teléfono ni dirección), las subcategorías, cada oferta con sus tiempos
 * y las acciones que permite D-120; y el CSV de la vista filtrada. Los segundos se calculan en PHP (MySQL y SQLite).
 */
final class AdminRequests
{
    /** Tope de filas del CSV: más allá, el panel avisa que se cortó y pide filtrar. */
    public const EXPORT_LIMIT = 5000;

    public function list(array $filters): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = (int) ($filters['per_page'] ?? 20);
        $query = $this->filtered($filters);
        $total = (clone $query)->count();
        $rows = $query->orderByDesc('s.created_at')->orderByDesc('s.id')->offset(($page - 1) * $perPage)->limit($perPage)->get();

        return ['items' => $rows->map(fn (object $row) => $this->present($row))->all(), 'page' => $page, 'per_page' => $perPage, 'total' => $total];
    }

    /** Filas de la vista filtrada para el CSV, de la más nueva a la más antigua, hasta EXPORT_LIMIT + 1 (para saber si se cortó). */
    public function exportRows(array $filters): array
    {
        return $this->filtered($filters)->orderByDesc('s.created_at')->orderByDesc('s.id')->limit(self::EXPORT_LIMIT + 1)->get()
            ->map(fn (object $row) => $this->present($row))->all();
    }

    private function filtered(array $filters): Builder
    {
        return $this->base()
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('s.status', $status))
            ->when($filters['district_id'] ?? null, fn (Builder $q, $id) => $q->where('s.district_id', (int) $id))
            ->when($filters['specialty_id'] ?? null, fn (Builder $q, $id) => $q->where('sc.specialty_id', (int) $id))
            ->when($filters['created_from'] ?? null, fn (Builder $q, string $from) => $q->where('s.created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['created_to'] ?? null, fn (Builder $q, string $to) => $q->where('s.created_at', '<=', Carbon::parse($to)->endOfDay()))
            ->when($filters['q'] ?? null, fn (Builder $q, $number) => $q->where('s.id', (int) $number));
    }

    public function detail(int $id, bool $canIntervene = false): array
    {
        $row = $this->base()->leftJoin('districts as cd', 'cd.id', '=', 'cp.district_id')
            ->addSelect(['s.description', 's.mode', 's.preferred_start_at', 's.preferred_end_at', 's.version', 's.subcategory_id',
                's.reference_fee_snapshot', 's.currency', 's.cancellation_reason', 'cp.plan as client_plan', 'cd.name as client_district',
                'p.status as participation_status'])
            ->where('s.id', $id)->first();
        abort_unless($row, 404);
        $offers = DB::table('offers')->where('request_id', $id)->groupBy('status')->selectRaw('status, COUNT(*) as total')->pluck('total', 'status');
        $timeline = DB::table('request_events as e')->leftJoin('users as actor', 'actor.id', '=', 'e.actor_id')->where('e.request_id', $id)
            ->orderBy('e.occurred_at')->orderBy('e.id')
            ->get(['e.event_type', 'e.from_status', 'e.to_status', 'e.summary', 'e.occurred_at', 'actor.name as actor']);
        $iso = fn (?string $value) => $value === null ? null : Carbon::parse($value)->toISOString();

        return [
            'request' => $this->present($row) + [
                'description' => $row->description, 'mode' => $row->mode,
                'preferred_start_at' => $iso($row->preferred_start_at), 'preferred_end_at' => $iso($row->preferred_end_at),
                'reference_fee' => $row->reference_fee_snapshot === null ? null : ['amount' => $row->reference_fee_snapshot, 'currency' => $row->currency],
                'cancellation_reason' => $row->cancellation_reason,
                'version' => (int) $row->version, 'subcategories' => $this->subcategories($row),
            ],
            'client' => ['id' => (int) $row->client_user_id, 'name' => $row->client_name, 'district' => $row->client_district,
                'plan' => $row->client_plan ?? 'free'],
            'technician' => $row->technician_id === null ? null : ['id' => (int) $row->technician_id, 'name' => $row->technician_name],
            'offers' => ['total' => (int) $offers->sum()] + collect(['pending', 'accepted', 'rejected', 'expired', 'withdrawn'])
                ->mapWithKeys(fn (string $status) => [$status => (int) ($offers[$status] ?? 0)])->all(),
            'timeline' => $timeline->map(fn (object $event) => ['event_type' => $event->event_type, 'from_status' => $event->from_status,
                'to_status' => $event->to_status, 'summary' => $event->summary, 'actor' => $event->actor, 'occurred_at' => $iso($event->occurred_at)])->all(),
            // Fase A3: cada oferta enviada con su técnico, ronda, estado y tiempos; y las acciones de D-120.
            'offer_list' => $this->offerList($id),
            'actions' => RequestIntervention::actions($row, in_array($row->participation_status, ['assigned', 'in_progress'], true), $canIntervene),
        ];
    }

    private function offerList(int $id): array
    {
        $iso = fn (?string $value) => $value === null ? null : Carbon::parse($value)->toISOString();

        return DB::table('offers as o')->join('offer_rounds as r', 'r.id', '=', 'o.round_id')
            ->join('technician_profiles as t', 't.id', '=', 'o.technician_id')->where('o.request_id', $id)
            ->orderBy('r.search_generation')->orderBy('r.round_no')->orderBy('o.id')
            ->get(['o.id', 'o.status', 'o.available_at', 'o.expires_at', 'o.responded_at', 'r.round_no', 'r.search_generation', 't.id as technician_id',
                't.display_name as technician_name'])
            ->map(fn (object $offer) => [
                'id' => (int) $offer->id, 'technician' => ['id' => (int) $offer->technician_id, 'name' => $offer->technician_name],
                'round_no' => (int) $offer->round_no, 'search_generation' => (int) $offer->search_generation, 'status' => $offer->status,
                'available_at' => $iso($offer->available_at), 'expires_at' => $iso($offer->expires_at), 'responded_at' => $iso($offer->responded_at),
                'response_seconds' => $offer->responded_at === null ? null
                    : (int) Carbon::parse($offer->available_at)->diffInSeconds(Carbon::parse($offer->responded_at)),
            ])->all();
    }

    /** Nombres de las subcategorías de la solicitud: las del pedido (D-95) o, si no tiene, la principal. */
    private function subcategories(object $row): array
    {
        $names = DB::table('request_subcategories as rs')->join('subcategories as c', 'c.id', '=', 'rs.subcategory_id')
            ->where('rs.request_id', $row->id)->orderBy('c.name')->pluck('c.name')->all();

        return $names === [] ? [$row->subcategory] : $names;
    }

    private function base(): Builder
    {
        return DB::table('service_requests as s')
            ->join('subcategories as sc', 'sc.id', '=', 's.subcategory_id')->join('specialties as sp', 'sp.id', '=', 'sc.specialty_id')
            ->join('districts as d', 'd.id', '=', 's.district_id')
            ->join('client_profiles as cp', 'cp.id', '=', 's.client_id')->join('users as cu', 'cu.id', '=', 'cp.user_id')
            ->leftJoin('participations as p', fn ($join) => $join->on('p.request_id', '=', 's.id')->where('p.status', '!=', 'cancelled'))
            ->leftJoin('technician_profiles as tp', 'tp.id', '=', 'p.technician_id')
            ->select(['s.id', 's.status', 's.created_at', 's.submitted_at', 'sc.name as subcategory', 'sp.name as specialty', 'd.name as district',
                'cu.id as client_user_id', 'cu.name as client_name', 'tp.id as technician_id', 'tp.display_name as technician_name']);
    }

    private function present(object $row): array
    {
        return [
            'id' => (int) $row->id, 'status' => $row->status, 'specialty' => $row->specialty, 'subcategory' => $row->subcategory,
            'district' => $row->district, 'client' => $row->client_name,
            'technician' => $row->technician_id === null ? null : ['id' => (int) $row->technician_id, 'name' => $row->technician_name],
            'created_at' => Carbon::parse($row->created_at)->toISOString(),
            'submitted_at' => $row->submitted_at === null ? null : Carbon::parse($row->submitted_at)->toISOString(),
        ];
    }
}
