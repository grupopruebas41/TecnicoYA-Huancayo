<?php

namespace App\Modules\ARequests\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Proyección autorizada de solicitudes (no exporta el modelo). En este incremento solo el cliente titular
 * ve su solicitud; el acceso del técnico notificado o asignado llega con las ofertas (Sprint 4).
 */
final class ServiceRequestView
{
    public function listFor(User $user): array
    {
        return DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->where('c.user_id', $user->id)->orderByDesc('r.id')
            ->get(['r.id', 'r.status', 'r.mode', 'r.source', 'r.created_at', 'r.submitted_at', 'r.version'])
            ->map(fn (object $row) => (array) $row)->all();
    }

    public function detailFor(User $user, int $id): array
    {
        $row = DB::table('service_requests as r')
            ->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->join('subcategories as s', 's.id', '=', 'r.subcategory_id')
            ->join('districts as d', 'd.id', '=', 'r.district_id')
            ->where('r.id', $id)->where('c.user_id', $user->id)
            ->first(['r.*', 's.name as subcategory_name', 'd.name as district_name']);
        abort_unless($row, 404);

        return [
            'id' => $row->id, 'status' => $row->status, 'version' => (int) $row->version,
            'subcategory' => ['id' => $row->subcategory_id, 'name' => $row->subcategory_name],
            'district' => ['id' => $row->district_id, 'name' => $row->district_name],
            'description' => $row->description, 'address' => $row->address, 'mode' => $row->mode,
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
