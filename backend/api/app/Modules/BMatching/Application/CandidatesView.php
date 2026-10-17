<?php

namespace App\Modules\BMatching\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Lo que el titular ve de la búsqueda (contrato S4 §5.1 y §5.4). Solo las ofertas aceptadas de la ronda vigente o,
 * en direct_declined, hasta 3 alternativas sin oferta. Nunca puntaje ni factores (SEC-S04-01): la tarjeta pública,
 * la tarifa referencial, la distancia aproximada por zona (D-64) y el tiempo estimado (D-69).
 */
final class CandidatesView
{
    public const MAX_ALTERNATIVES = 3;

    public function __construct(private readonly SearchState $state) {}

    public function forClient(User $user, int $requestId): array
    {
        $request = $this->own($user, $requestId);
        $phase = $this->state->phase($request);
        $round = $this->state->currentRound($request);
        $accepted = $phase === 'awaiting_choice' ? DB::table('offers as o')->join('matching_candidates as c', 'c.id', '=', 'o.matching_candidate_id')
            ->where('o.round_id', $round->id)->where('o.status', 'accepted')->orderBy('c.rank_position')->orderBy('o.id')
            ->get(['o.id as offer_id', 'o.technician_id', 'o.reference_fee_snapshot as fee', 'o.currency', 'c.rank_position', 'c.tie_group', 'c.input_snapshot'])
            ->map(fn (object $row) => ['offer_id' => $row->offer_id] + $this->card($row))->all() : [];

        return [
            'phase' => $phase, 'request_version' => (int) $request->version,
            'round' => $round ? ['id' => $round->id, 'round_no' => (int) $round->round_no, 'kind' => $round->kind, 'status' => $round->status] : null,
            'accepted' => $accepted,
            'alternatives' => $phase === 'direct_declined' ? $this->alternatives($request) : [],
        ];
    }

    /** Campos de búsqueda del detalle de la solicitud para el titular. */
    public function searchSummary(object $request): array
    {
        $phase = $this->state->phase($request);
        $round = $this->state->currentRound($request);
        $counts = $round ? DB::table('offers')->where('round_id', $round->id)->selectRaw('count(*) as total, sum(status = ?) as accepted', ['accepted'])->first() : null;

        return [
            'phase' => $phase, 'search_generation' => (int) $request->search_generation,
            'search' => [
                'current_round' => $round ? ['id' => $round->id, 'round_no' => (int) $round->round_no, 'kind' => $round->kind, 'status' => $round->status,
                    'opened_at' => OfferView::iso($round->opened_at), 'expires_at' => OfferView::iso($round->expires_at),
                    'offers_total' => (int) $counts->total, 'accepted_count' => (int) $counts->accepted] : null,
                'pending_since' => OfferView::iso($request->pending_since), 'pending_expires_at' => OfferView::iso($request->pending_expires_at),
                'alternatives_available' => $phase === 'direct_declined' && $this->alternatives($request) !== [],
            ],
            'assignment' => $this->assignment($request),
        ];
    }

    private function alternatives(object $request): array
    {
        $run = DB::table('matching_runs')->where('request_id', $request->id)->where('search_generation', $request->search_generation)
            ->where('status', 'completed')->orderByDesc('id')->first();
        if (! $run) {
            return [];
        }
        $offered = DB::table('offers')->where('request_id', $request->id)->pluck('technician_id')->all();

        return DB::table('matching_candidates')->where('matching_run_id', $run->id)->where('eligible', 1)
            ->where('technician_id', '<>', $request->target_technician_id)->whereNotIn('technician_id', $offered)
            ->orderBy('rank_position')->orderBy('technician_id')->limit(self::MAX_ALTERNATIVES)
            ->get(['technician_id', 'rank_position', 'tie_group', 'input_snapshot'])
            ->map(function (object $row) {
                $snapshot = json_decode($row->input_snapshot, true, 512, JSON_THROW_ON_ERROR);
                $row->fee = $snapshot['fee'];
                $row->currency = $snapshot['currency'];

                return $this->card($row);
            })->all();
    }

    private function card(object $row): array
    {
        $snapshot = json_decode($row->input_snapshot, true, 512, JSON_THROW_ON_ERROR);
        $technician = DB::table('technician_profiles')->where('id', $row->technician_id)->first(['id', 'display_name', 'provider_type']);
        $minutes = $snapshot['estimate']['minutes'] ?? null;

        return [
            'rank_position' => $row->rank_position === null ? null : (int) $row->rank_position,
            'tie_group' => $row->tie_group === null ? null : (int) $row->tie_group,
            'technician' => ['id' => $technician->id, 'display_name' => $technician->display_name,
                'provider_type' => $technician->provider_type, 'rating' => ['average' => null, 'count' => 0]],
            'reference_fee' => ['amount' => $row->fee, 'currency' => $row->currency, 'is_reference' => true],
            'distance' => $snapshot['distance_km'] === null ? null
                : ['km' => $snapshot['distance_km'], 'approximate' => true, 'label' => 'aproximada por zona'],
            'estimate' => $minutes === null ? ['status' => 'new', 'minutes' => null, 'label' => 'Nuevo, sin estimación']
                : ['status' => 'estimated', 'minutes' => $minutes, 'label' => 'Tiempo estimado: '.$this->duration($minutes)],
        ];
    }

    private function duration(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        return trim(($hours > 0 ? "$hours h " : '').($rest > 0 || $hours === 0 ? "$rest min" : ''));
    }

    private function assignment(object $request): ?array
    {
        $participation = DB::table('participations')->where('request_id', $request->id)->where('slot', 'primary')->first();
        if (! $participation) {
            return null;
        }
        $appointment = DB::table('appointments')->where('participation_id', $participation->id)->first();

        return [
            'participation' => ['id' => $participation->id, 'slot' => $participation->slot, 'status' => $participation->status,
                'technician_id' => (int) $participation->technician_id,
                'reference_fee' => ['amount' => $participation->reference_fee_snapshot, 'currency' => $participation->currency, 'is_reference' => true],
                'assigned_at' => OfferView::iso($participation->assigned_at)],
            'appointment' => $appointment ? ['id' => $appointment->id, 'status' => $appointment->status,
                'starts_at' => OfferView::iso($appointment->starts_at), 'ends_at' => OfferView::iso($appointment->ends_at)] : null,
        ];
    }

    private function own(User $user, int $requestId): object
    {
        $request = DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->where('r.id', $requestId)->where('c.user_id', $user->id)->first(['r.*']);
        abort_unless($request, 404);

        return $request;
    }
}
