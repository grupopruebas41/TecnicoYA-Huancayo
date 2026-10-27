<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Solicitudes en solo lectura para el panel (bloque C, D-85; permiso dashboard.view). El listado no expone la
 * dirección; el detalle agrega la descripción, el resumen de ofertas y la línea de tiempo de request_events.
 */
final class AdminRequests
{
    public function list(array $filters): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = (int) ($filters['per_page'] ?? 20);
        $query = $this->base()
            ->when($filters['status'] ?? null, fn (Builder $q, string $status) => $q->where('s.status', $status))
            ->when($filters['district_id'] ?? null, fn (Builder $q, $id) => $q->where('s.district_id', (int) $id))
            ->when($filters['specialty_id'] ?? null, fn (Builder $q, $id) => $q->where('sc.specialty_id', (int) $id))
            ->when($filters['created_from'] ?? null, fn (Builder $q, string $from) => $q->where('s.created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['created_to'] ?? null, fn (Builder $q, string $to) => $q->where('s.created_at', '<=', Carbon::parse($to)->endOfDay()))
            ->when($filters['q'] ?? null, fn (Builder $q, $number) => $q->where('s.id', (int) $number));
        $total = (clone $query)->count();
        $rows = $query->orderByDesc('s.created_at')->orderByDesc('s.id')->offset(($page - 1) * $perPage)->limit($perPage)->get();

        return ['items' => $rows->map(fn (object $row) => $this->present($row))->all(), 'page' => $page, 'per_page' => $perPage, 'total' => $total];
    }

    public function detail(int $id): array
    {
        $row = $this->base()->addSelect(['s.description', 's.mode', 's.preferred_start_at', 's.preferred_end_at',
            's.reference_fee_snapshot', 's.currency', 's.cancellation_reason'])->where('s.id', $id)->first();
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
            ],
            'client' => ['id' => (int) $row->client_user_id, 'name' => $row->client_name],
            'technician' => $row->technician_id === null ? null : ['id' => (int) $row->technician_id, 'name' => $row->technician_name],
            'offers' => ['total' => (int) $offers->sum()] + collect(['pending', 'accepted', 'rejected', 'expired', 'withdrawn'])
                ->mapWithKeys(fn (string $status) => [$status => (int) ($offers[$status] ?? 0)])->all(),
            'timeline' => $timeline->map(fn (object $event) => ['event_type' => $event->event_type, 'from_status' => $event->from_status,
                'to_status' => $event->to_status, 'summary' => $event->summary, 'actor' => $event->actor, 'occurred_at' => $iso($event->occurred_at)])->all(),
        ];
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
