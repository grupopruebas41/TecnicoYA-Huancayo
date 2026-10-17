<?php

namespace App\Modules\BMatching\Application;

use App\Models\User;
use App\Modules\BMatching\Jobs\PrepareMatching;
use App\Modules\CNotifications\Application\Inbox;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Elección del cliente y búsqueda alternativa (contrato S4 §5.2 y §5.3; RN-10.3, D-22, D-25, D-66).
 * - Se elige entre los que aceptaron y solo con la ronda cerrada a respuestas.
 * - Elegir revalida al técnico bajo su bloqueo (orden: solicitud, ronda, ofertas, técnico), así dos clientes no
 *   reservan la misma franja; si ya no está disponible, su oferta queda retirada y la elección responde 409.
 * - La asignación crea la participación principal y la cita (la franja programada o [ahora, ahora + 2 h) en una
 *   inmediata) y sube la generación para que los jobs pendientes no tengan efecto.
 * Corre dentro de la transacción de Idempotency.
 */
final class ClientSelection
{
    public function __construct(
        private readonly MatchingFlow $flow,
        private readonly Eligibility $eligibility,
        private readonly RequestProgress $progress,
        private readonly SearchState $state,
        private readonly Inbox $inbox,
    ) {}

    /** @return array{0:int,1:array} */
    public function select(User $user, int $requestId, array $data): array
    {
        $request = $this->lockOwn($user, $requestId);
        if ((int) $request->version !== (int) $data['expected_version'] || $request->status !== 'sent') {
            return $this->error('STALE_VERSION', __('api.stale_version'));
        }
        $round = $this->state->currentRound($request);
        if (! $round || $round->status !== 'awaiting_choice') {
            return $this->error('ROUND_NOT_CLOSED', __('api.round_not_closed'));
        }
        $round = DB::table('offer_rounds')->where('id', $round->id)->lockForUpdate()->first();
        $offer = DB::table('offers')->where('id', $data['offer_id'])->where('round_id', $round->id)
            ->where('status', 'accepted')->lockForUpdate()->first();
        if (! $offer) {
            throw ValidationException::withMessages(['offer_id' => __('api.offer_not_accepted')]);
        }
        // Toda cita del técnico se confirma con este bloqueo tomado; con READ COMMITTED la revalidación que sigue ve
        // la cita que otra elección confirmó mientras esta esperaba (S04-TC-045).
        DB::table('technician_profiles')->where('id', $offer->technician_id)->lockForUpdate()->first();
        $code = $this->eligibility->codeFor($request, (int) $offer->technician_id);
        if ($code !== null) {
            return $this->unavailable($user, $request, $round, $offer, $code);
        }

        return [200, $this->assign($user, $request, $round, $offer)];
    }

    /** @return array{0:int,1:array} */
    public function searchAlternatives(User $user, int $requestId, array $data): array
    {
        $request = $this->lockOwn($user, $requestId);
        if ((int) $request->version !== (int) $data['expected_version']) {
            return $this->error('STALE_VERSION', __('api.stale_version'));
        }
        if ($this->state->phase($request) !== 'direct_declined') {
            return $this->error('NO_ALTERNATIVES_PENDING', __('api.no_alternatives_pending'));
        }
        $generation = (int) $request->search_generation + 1;
        $updated = $this->progress->advance($request, ['search_generation' => $generation], 'request.alternative_search',
            'El cliente autorizó la búsqueda de otros técnicos.', [], $user->id);
        PrepareMatching::dispatch($request->id, $generation)->afterCommit();

        return [202, ['id' => $updated->id, 'status' => $updated->status, 'phase' => $this->state->phase($updated),
            'version' => (int) $updated->version, 'search_generation' => $generation]];
    }

    private function assign(User $user, object $request, object $round, object $offer): array
    {
        $now = CarbonImmutable::now();
        [$startsAt, $endsAt] = $request->mode === 'scheduled'
            ? [CarbonImmutable::parse($request->preferred_start_at, 'UTC'), CarbonImmutable::parse($request->preferred_end_at, 'UTC')]
            : [$now, $now->addHours(2)];
        $participationId = DB::table('participations')->insertGetId([
            'request_id' => $request->id, 'technician_id' => $offer->technician_id, 'offer_id' => $offer->id, 'slot' => 'primary',
            'status' => 'assigned', 'reference_fee_snapshot' => $offer->reference_fee_snapshot, 'currency' => $offer->currency, 'assigned_at' => $now,
        ]);
        $appointmentId = DB::table('appointments')->insertGetId([
            'request_id' => $request->id, 'participation_id' => $participationId, 'technician_id' => $offer->technician_id,
            'starts_at' => $startsAt, 'ends_at' => $endsAt, 'status' => 'confirmed',
        ]);
        foreach (DB::table('offers')->where('round_id', $round->id)->whereIn('status', ['accepted', 'pending'])
            ->where('id', '<>', $offer->id)->orderBy('id')->get() as $other) {
            $this->flow->changeOffer($request, $other, 'withdrawn', 'offer.withdrawn', 'Oferta retirada: el cliente eligió a otro técnico.');
        }
        $this->flow->changeRound($round, 'closed');
        $updated = $this->progress->advance($request, ['status' => 'assigned', 'search_generation' => (int) $request->search_generation + 1],
            'request.assigned', 'El cliente eligió al técnico.', ['offer_id' => $offer->id, 'participation_id' => $participationId], $user->id);
        $technicianUser = (int) DB::table('technician_profiles')->where('id', $offer->technician_id)->value('user_id');
        $this->inbox->notify($technicianUser, 'request.assigned', 'Te eligieron para una solicitud',
            'El cliente te eligió. Ya puedes ver la dirección de la atención.', 'service_request', (int) $request->id);

        return [
            'request' => ['id' => $updated->id, 'status' => $updated->status, 'phase' => $updated->status, 'version' => (int) $updated->version],
            'participation' => ['id' => $participationId, 'slot' => 'primary', 'status' => 'assigned', 'technician_id' => (int) $offer->technician_id,
                'reference_fee' => ['amount' => $offer->reference_fee_snapshot, 'currency' => $offer->currency, 'is_reference' => true],
                'assigned_at' => $now->toISOString()],
            'appointment' => ['id' => $appointmentId, 'status' => 'confirmed', 'starts_at' => $startsAt->toISOString(), 'ends_at' => $endsAt->toISOString()],
        ];
    }

    /** El elegido dejó de estar disponible: su oferta queda retirada y, si no queda ninguna aceptada, sigue la búsqueda. */
    private function unavailable(User $user, object $request, object $round, object $offer, string $code): array
    {
        $this->flow->changeOffer($request, $offer, 'withdrawn', 'offer.withdrawn', 'Oferta retirada: el técnico ya no está disponible.', $user->id);
        $remaining = DB::table('offers')->where('round_id', $round->id)->where('status', 'accepted')->exists();
        if ($remaining) {
            $this->progress->advance($request, [], 'selection.unavailable', 'El técnico elegido ya no está disponible.', ['offer_id' => $offer->id], $user->id);
        } else {
            $this->flow->settle($request, $round); // sin aceptadas: cierra y sigue la búsqueda (o alternativas si es directa)
        }

        return in_array($code, ['schedule_conflict', 'appointment_within_2h'], true)
            ? $this->error('SCHEDULE_CONFLICT', __('api.schedule_conflict'))
            : $this->error('TECHNICIAN_UNAVAILABLE', __('api.technician_unavailable_client'));
    }

    private function lockOwn(User $user, int $requestId): object
    {
        $request = DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->where('r.id', $requestId)->where('c.user_id', $user->id)->lockForUpdate()->first(['r.*']);
        abort_unless($request, 404);

        return $request;
    }

    private function error(string $code, string $message): array
    {
        return [409, ['error' => ['code' => $code, 'message' => $message]]];
    }
}
