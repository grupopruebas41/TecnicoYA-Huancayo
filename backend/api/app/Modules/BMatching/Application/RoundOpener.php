<?php

namespace App\Modules\BMatching\Application;

use App\Modules\BMatching\Jobs\ExpireOfferRound;
use App\Modules\CNotifications\Application\Inbox;
use App\Modules\CNotifications\Application\Outbox;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Abre una ronda desde una ejecución completada (RN-10.2, RN-11.1, RN-12):
 * - automática: hasta max_simultaneous_offers candidatos en orden, sin quien ya tuvo oferta en la solicitud; si un
 *   empate cruza el corte, entra el de verified_at más antiguo y el grupo queda con tie_break = verified_at (D-65);
 * - directa: solo el técnico objetivo, aunque otros puntúen mejor.
 * Cada oferta guarda la tarifa notificada, avisa en la bandeja del técnico y deja sus eventos en el outbox. El plazo
 * es [available_at, available_at + offer_sla_minutes) con la versión de reglas de la solicitud (D-21, D-24).
 */
final class RoundOpener
{
    public function __construct(
        private readonly MatchingRules $rules,
        private readonly Inbox $inbox,
        private readonly Outbox $outbox,
    ) {}

    public function open(object $request, object $run): ?object
    {
        $parameters = $this->rules->parameters((int) $request->rule_version_id);
        $direct = SearchState::isDirect($request);
        $selected = $this->select($request, $run, $direct, (int) $parameters['max_simultaneous_offers']);
        if ($selected === []) {
            return null;
        }
        $now = CarbonImmutable::now();
        $expiresAt = $now->addMinutes((int) $parameters['offer_sla_minutes']);
        $roundId = DB::table('offer_rounds')->insertGetId([
            'request_id' => $request->id, 'matching_run_id' => $run->id, 'search_generation' => $request->search_generation,
            'round_no' => 1 + (int) DB::table('offer_rounds')->where('request_id', $request->id)->max('round_no'),
            'kind' => $direct ? 'direct' : 'automatic', 'status' => 'open', 'opened_at' => $now, 'expires_at' => $expiresAt,
        ]);
        $labels = DB::table('subcategories as s')->crossJoin('districts as d')->where('s.id', $request->subcategory_id)
            ->where('d.id', $request->district_id)->first(['s.name as subcategory', 'd.name as district']);
        foreach ($selected as $candidate) {
            $this->offer($request, $roundId, $candidate, $now, $expiresAt, $labels);
        }
        ExpireOfferRound::dispatch($roundId, (int) $request->search_generation)->delay($expiresAt)->afterCommit();

        return DB::table('offer_rounds')->find($roundId);
    }

    /** @return object[] candidatos elegidos para la ronda */
    private function select(object $request, object $run, bool $direct, int $max): array
    {
        $offered = DB::table('offers')->where('request_id', $request->id)->pluck('technician_id')->all();
        $pool = DB::table('matching_candidates as c')->join('technician_profiles as t', 't.id', '=', 'c.technician_id')
            ->where('c.matching_run_id', $run->id)->where('c.eligible', 1)->whereNotIn('c.technician_id', $offered)
            ->when($direct, fn ($q) => $q->where('c.technician_id', $request->target_technician_id))
            ->when(! $direct && $request->source === 'profile', fn ($q) => $q->where('c.technician_id', '<>', $request->target_technician_id))
            ->orderBy('c.rank_position')->orderBy('t.verified_at')->orderBy('c.technician_id')
            ->get(['c.*', 't.verified_at', 't.user_id']);

        $selected = [];
        foreach ($pool->groupBy('rank_position') as $group) {
            $room = $max - count($selected);
            if ($room <= 0) {
                break;
            }
            if ($group->count() > $room) {
                // D-65: el empate cruza el corte; decide la verificación más antigua (el orden ya la aplica).
                DB::table('matching_candidates')->whereIn('id', $group->pluck('id'))->update(['tie_break' => 'verified_at']);
            }
            array_push($selected, ...$group->take($room)->all());
        }

        return $selected;
    }

    private function offer(object $request, int $roundId, object $candidate, CarbonImmutable $now, CarbonImmutable $expiresAt, object $labels): void
    {
        $snapshot = json_decode($candidate->input_snapshot, true, 512, JSON_THROW_ON_ERROR);
        $offerId = DB::table('offers')->insertGetId([
            'round_id' => $roundId, 'request_id' => $request->id, 'technician_id' => $candidate->technician_id,
            'matching_candidate_id' => $candidate->id, 'status' => 'pending', 'available_at' => $now, 'expires_at' => $expiresAt,
            'reference_fee_snapshot' => $snapshot['fee'], 'currency' => $snapshot['currency'],
            'service_rate_version_id' => $snapshot['service_rate_version_id'],
        ]);
        $deadline = $expiresAt->setTimezone(Eligibility::TIMEZONE)->format('H:i');
        $this->inbox->notify((int) $candidate->user_id, 'offer.created', 'Nueva solicitud para ti',
            "{$labels->subcategory} en {$labels->district}. Responde antes de las $deadline.", 'offer', $offerId);
        $this->outbox->record('offer.created', "technicians.{$candidate->technician_id}", 'offer', $offerId, [
            'offer_id' => $offerId, 'request_id' => $request->id, 'status' => 'pending', 'version' => 1, 'expires_at' => $expiresAt->toISOString(),
        ]);
    }
}
