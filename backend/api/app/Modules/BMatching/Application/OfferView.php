<?php

namespace App\Modules\BMatching\Application;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Bandeja de ofertas del técnico (contrato S4 §4.1 y §4.2). Solo las propias; la ajena responde 404. La dirección
 * exacta va en null hasta que ese técnico sea el asignado (SEC-S04-05).
 */
final class OfferView
{
    public function __construct(private readonly OwnTechnician $technicians) {}

    public static function iso(?string $value): ?string
    {
        return $value === null ? null : Carbon::parse($value, 'UTC')->toISOString();
    }

    public function listFor(User $user, array $filters): array
    {
        $query = DB::table('offers')->where('technician_id', $this->technicians->idFor($user))
            ->when(isset($filters['status']), fn ($q) => $q->whereIn('status', $filters['status']));
        $perPage = (int) ($filters['per_page'] ?? 20);
        $page = (int) ($filters['page'] ?? 1);
        $total = (clone $query)->count();

        return [
            'items' => $this->present($query->orderByDesc('available_at')->orderByDesc('id')->forPage($page, $perPage)->get()),
            'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'last_page' => max(1, (int) ceil($total / $perPage))],
        ];
    }

    public function detailFor(User $user, int $offerId): array
    {
        $offer = DB::table('offers')->where('id', $offerId)->where('technician_id', $this->technicians->idFor($user))->get();
        abort_if($offer->isEmpty(), 404);

        return $this->present($offer)[0];
    }

    private function present(Collection $offers): array
    {
        $rounds = DB::table('offer_rounds')->whereIn('id', $offers->pluck('round_id'))->get()->keyBy('id');
        $requests = DB::table('service_requests as r')->join('subcategories as s', 's.id', '=', 'r.subcategory_id')
            ->join('districts as d', 'd.id', '=', 'r.district_id')->whereIn('r.id', $offers->pluck('request_id'))
            ->get(['r.*', 's.name as subcategory_name', 'd.name as district_name'])->keyBy('id');
        $assigned = DB::table('participations')->whereIn('request_id', $offers->pluck('request_id'))
            ->whereIn('status', ['assigned', 'in_progress', 'completed'])->get(['request_id', 'technician_id']);
        $evidence = DB::table('request_attachments')->whereIn('request_id', $offers->pluck('request_id'))->orderBy('position')
            ->get(['request_id', 'media_id'])->groupBy('request_id');
        $symptoms = DB::table('request_symptoms as r')->join('subcategory_symptoms as y', 'y.id', '=', 'r.symptom_id')
            ->whereIn('r.request_id', $offers->pluck('request_id'))->orderBy('y.position')->orderBy('y.id')
            ->get(['r.request_id', 'y.name'])->groupBy('request_id');

        return $offers->map(function (object $offer) use ($rounds, $requests, $assigned, $evidence, $symptoms) {
            $request = $requests[$offer->request_id];
            $round = $rounds[$offer->round_id];
            $isAssigned = $assigned->contains(fn ($p) => (int) $p->request_id === (int) $offer->request_id && (int) $p->technician_id === (int) $offer->technician_id);

            return [
                'id' => $offer->id, 'status' => $offer->status, 'version' => (int) $offer->version,
                'round' => ['id' => $round->id, 'round_no' => (int) $round->round_no, 'kind' => $round->kind],
                'available_at' => self::iso($offer->available_at), 'expires_at' => self::iso($offer->expires_at),
                'responded_at' => self::iso($offer->responded_at),
                'reference_fee' => ['amount' => $offer->reference_fee_snapshot, 'currency' => $offer->currency, 'is_reference' => true],
                'request' => [
                    'id' => $request->id, 'subcategory' => ['id' => $request->subcategory_id, 'name' => $request->subcategory_name],
                    'district' => ['id' => $request->district_id, 'name' => $request->district_name], 'mode' => $request->mode,
                    'preferred_start_at' => self::iso($request->preferred_start_at), 'preferred_end_at' => self::iso($request->preferred_end_at),
                    'description' => $request->description,
                    // D-92: la urgencia es informativa para el técnico; no cambia el matching.
                    'urgency' => $request->urgency, 'brand' => $request->brand, 'model' => $request->model,
                    'symptoms' => $symptoms->get($request->id, collect())->pluck('name')->all(),
                    'evidence' => $evidence->get($request->id, collect())->map(fn ($e) => ['media_id' => $e->media_id, 'url' => url("/api/v1/media/{$e->media_id}")])->values()->all(),
                    'address' => $isAssigned ? $request->address : null,
                ],
            ];
        })->values()->all();
    }
}
