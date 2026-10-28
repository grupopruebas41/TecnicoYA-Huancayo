<?php

namespace App\Modules\ARequests\Application;

use App\Models\User;
use App\Modules\BMatching\Application\CandidatesView;
use App\Modules\BMatching\Application\SearchState;
use Illuminate\Support\Facades\DB;

/**
 * Proyección autorizada de solicitudes (no exporta el modelo). El titular ve su solicitud con la fase de búsqueda y
 * la asignación (S4); el técnico notificado (con una oferta en cualquier ronda) ve el mismo detalle sin dirección
 * hasta que lo asignen y sin la búsqueda (SEC-S04-05). Cualquier otro recibe 404.
 */
final class ServiceRequestView
{
    public function __construct(
        private readonly SearchState $state,
        private readonly CandidatesView $candidates,
        private readonly ClientTimeline $timeline,
    ) {}

    public function listFor(User $user): array
    {
        return DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->join('subcategories as s', 's.id', '=', 'r.subcategory_id')->join('districts as d', 'd.id', '=', 'r.district_id')
            ->where('c.user_id', $user->id)->orderByDesc('r.id')->get(['r.*', 's.name as subcategory_name', 'd.name as district_name'])
            ->map(fn (object $row) => [
                'id' => $row->id, 'status' => $row->status, 'phase' => $this->state->phase($row), 'mode' => $row->mode,
                'source' => $row->source, 'created_at' => $row->created_at, 'submitted_at' => $row->submitted_at, 'version' => $row->version,
                // Panel del cliente (D-87): datos de las tarjetas de «Mis solicitudes».
                'subcategory' => ['id' => $row->subcategory_id, 'name' => $row->subcategory_name],
                'district' => ['id' => $row->district_id, 'name' => $row->district_name], 'updated_at' => $row->updated_at,
            ])->all();
    }

    public function detailFor(User $user, int $id): array
    {
        $row = DB::table('service_requests as r')
            ->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->join('subcategories as s', 's.id', '=', 'r.subcategory_id')
            ->join('districts as d', 'd.id', '=', 'r.district_id')
            ->where('r.id', $id)
            ->first(['r.*', 'c.user_id as owner_user_id', 's.name as subcategory_name', 'd.name as district_name']);
        abort_unless($row, 404);
        if ((int) $row->owner_user_id === $user->id) {
            return $this->detail($row, $row->address) + $this->candidates->searchSummary($row)
                + ['timeline' => $this->timeline->forOwner($row->id)];
        }
        $technicianId = DB::table('technician_profiles')->where('user_id', $user->id)->value('id');
        abort_unless($technicianId && DB::table('offers')->where('request_id', $id)->where('technician_id', $technicianId)->exists(), 404);
        $assigned = DB::table('participations')->where('request_id', $id)->where('technician_id', $technicianId)
            ->whereIn('status', ['assigned', 'in_progress', 'completed'])->exists();

        return $this->detail($row, $assigned ? $row->address : null);
    }

    private function detail(object $row, ?string $address): array
    {
        return [
            'id' => $row->id, 'status' => $row->status, 'version' => (int) $row->version,
            'subcategory' => ['id' => $row->subcategory_id, 'name' => $row->subcategory_name],
            'district' => ['id' => $row->district_id, 'name' => $row->district_name],
            'description' => $row->description, 'address' => $address, 'mode' => $row->mode,
            'preferred_start_at' => $row->preferred_start_at, 'preferred_end_at' => $row->preferred_end_at,
            'source' => $row->source, 'target_technician_id' => $row->target_technician_id,
            'reference_fee' => $this->referenceFee($row),
            'attachments' => $this->attachments($row->id),
            'submitted_at' => $row->submitted_at,
        ];
    }

    /** Monto referencial con su procedencia; nunca un cobro (RF-04). */
    private function referenceFee(object $row): array
    {
        return [
            'amount' => $row->reference_fee_snapshot,
            'currency' => $row->currency,
            'source' => $row->reference_fee_snapshot === null ? null : 'subcategory',
            'is_reference' => true,
            'is_payment' => false,
        ];
    }

    private function attachments(int $requestId): array
    {
        return DB::table('request_attachments')->where('request_id', $requestId)->orderBy('position')
            ->get(['media_id', 'position', 'caption'])
            ->map(fn (object $item) => (array) $item + ['url' => url("/api/v1/media/{$item->media_id}")])->all();
    }
}
