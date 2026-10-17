<?php

namespace App\Modules\BMatching\Application;

use App\Modules\CNotifications\Application\Inbox;
use App\Modules\CNotifications\Application\Outbox;
use App\Shared\Http\ApiResponse;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Proceso interno del matching (contrato S4 §3). Cada paso bloquea primero la solicitud y después la ronda y las
 * ofertas (orden fijo de bloqueo) y termina sin efectos si el job trae una generación que ya no es la vigente
 * (TC-058), dejando el registro técnico job.stale_generation.
 */
final class MatchingFlow
{
    public function __construct(
        private readonly Matcher $matcher,
        private readonly RoundOpener $opener,
        private readonly RequestProgress $progress,
        private readonly MatchingRules $rules,
        private readonly Inbox $inbox,
        private readonly Outbox $outbox,
    ) {}

    /** Paso 1: ejecuta el matching de la generación y abre la ronda en el mismo job. Una sola vez por generación. */
    public function prepare(int $requestId, int $generation): void
    {
        $started = hrtime(true);
        DB::transaction(function () use ($requestId, $generation, $started) {
            $request = $this->current($requestId, $generation, 'PrepareMatching');
            if (! $request || $request->status !== 'sent' || DB::table('matching_runs')->where('request_id', $requestId)
                ->where('search_generation', $generation)->exists()) {
                return;
            }
            $run = $this->matcher->run($request, $generation > 1 ? 'alternative' : 'submission');
            if ($run->status === 'completed') {
                $this->openFrom($request, $run);
            }
            DB::table('matching_runs')->where('id', $run->id)->update(['duration_ms' => round((hrtime(true) - $started) / 1e6, 3)]);
        });
    }

    /** Paso 2 explícito: abre la siguiente ronda si la solicitud sigue buscando y no hay una ronda viva. */
    public function openRound(int $requestId, int $generation): void
    {
        DB::transaction(function () use ($requestId, $generation) {
            $request = $this->current($requestId, $generation, 'OpenOfferRound');
            if (! $request || ! in_array($request->status, ['sent', 'pending_availability'], true)
                || DB::table('offer_rounds')->where('request_id', $requestId)->where('search_generation', $generation)
                    ->whereIn('status', ['open', 'awaiting_choice'])->exists()) {
                return;
            }
            $this->searchAgain($request, $request->status === 'pending_availability' ? 'pending_retry' : 'reassignment');
        });
    }

    /** Paso 3: vence las ofertas pendientes de una ronda cuyo plazo terminó (D-21: a los 10:00 exactos ya venció). */
    public function expireRound(int $roundId, int $generation): void
    {
        DB::transaction(function () use ($roundId, $generation) {
            $requestId = DB::table('offer_rounds')->where('id', $roundId)->value('request_id');
            $request = $requestId ? $this->current((int) $requestId, $generation, 'ExpireOfferRound') : null;
            $round = $request ? DB::table('offer_rounds')->where('id', $roundId)->lockForUpdate()->first() : null;
            if (! $round || $round->status !== 'open' || now()->lt($round->expires_at)) {
                return;
            }
            $pending = DB::table('offers')->where('round_id', $roundId)->where('status', 'pending')->orderBy('id')->get();
            foreach ($pending as $offer) {
                $this->changeOffer($request, $offer, 'expired', 'offer.expired', 'La oferta venció sin respuesta.');
            }
            $this->settle($request, $round);
        });
    }

    /** Paso 4 (D-67): reintenta el pendiente solo con técnicos que nunca tuvieron oferta; conserva el primer plazo. */
    public function retryPending(int $requestId, int $generation): void
    {
        DB::transaction(function () use ($requestId, $generation) {
            $request = $this->current($requestId, $generation, 'RetryPendingMatching');
            if ($request && $request->status === 'pending_availability') {
                $this->searchAgain($request, 'pending_retry');
            }
        });
    }

    /** Paso 5 (RN-11.3): a las 24 h exactas el pendiente expira, una sola vez, y deja de contar para D-11. */
    public function expirePending(int $requestId, int $generation): void
    {
        DB::transaction(function () use ($requestId, $generation) {
            $request = $this->current($requestId, $generation, 'ExpirePendingRequest');
            if (! $request || $request->status !== 'pending_availability' || now()->lt($request->pending_expires_at)) {
                return;
            }
            $this->progress->advance($request, ['status' => 'expired', 'closed_at' => now()], 'request.expired',
                'La solicitud expiró sin técnicos disponibles en 24 horas.');
            $this->notifyClient($request, 'request.expired', 'Tu solicitud expiró',
                'No encontramos técnicos disponibles en 24 horas. Puedes crear otra solicitud.');
        });
    }

    /**
     * Tras cada respuesta, vencimiento o retiro: si quedan pendientes, la ronda sigue; con alguna aceptación pasa a
     * elección (D-22); sin aceptaciones se cierra y se abre la siguiente (automática) o se ofrecen alternativas (directa).
     */
    public function settle(object $request, object $round): object
    {
        $statuses = DB::table('offers')->where('round_id', $round->id)->pluck('status');
        if ($statuses->contains('pending')) {
            return $request;
        }
        if ($statuses->contains('accepted')) {
            if ($round->status !== 'open') {
                return $request;
            }
            $this->changeRound($round, 'awaiting_choice');
            $this->notifyClient($request, 'request.awaiting_choice', 'Elige a tu técnico', 'Uno o más técnicos aceptaron tu solicitud.');

            return $this->progress->advance($request, [], 'round.awaiting_choice', 'La ronda terminó con aceptaciones.', ['round_id' => $round->id]);
        }
        $this->changeRound($round, 'closed');
        if ($round->kind === 'direct') {
            $this->notifyClient($request, 'request.direct_declined', 'Tu técnico no respondió', 'Puedes autorizar la búsqueda de otros técnicos.');

            return $this->progress->advance($request, [], 'matching.direct_declined', 'El técnico elegido no aceptó la solicitud dirigida.', ['round_id' => $round->id]);
        }

        return $this->searchAgain($request, 'reassignment');
    }

    public function changeOffer(object $request, object $offer, string $status, string $event, string $summary, ?int $actorId = null, array $extra = []): void
    {
        $version = (int) $offer->version + 1;
        DB::table('offers')->where('id', $offer->id)->update($extra + ['status' => $status, 'version' => $version, 'updated_at' => now()]);
        DB::table('request_events')->insert([
            'request_id' => $request->id, 'actor_id' => $actorId, 'event_type' => $event, 'from_status' => $offer->status,
            'to_status' => $status, 'summary' => $summary, 'metadata' => json_encode(['offer_id' => $offer->id]),
            'occurred_at' => now(), 'correlation_id' => ApiResponse::meta()['request_id'],
            'request_version' => $request->version,
        ]);
        $this->outbox->record('offer.updated', "technicians.{$offer->technician_id}", 'offer', $offer->id, [
            'offer_id' => $offer->id, 'request_id' => $request->id, 'status' => $status, 'version' => $version,
        ]);
    }

    public function changeRound(object $round, string $status): void
    {
        DB::table('offer_rounds')->where('id', $round->id)->update([
            'status' => $status, 'version' => (int) $round->version + 1, 'updated_at' => now(),
            'closed_at' => $status === 'closed' ? now() : null,
        ]);
    }

    /** Ejecuta el matching otra vez (los datos pueden haber cambiado) y abre la ronda o deja la solicitud pendiente. */
    public function searchAgain(object $request, string $trigger): object
    {
        $run = $this->matcher->run($request, $trigger);

        return $run->status === 'completed' ? $this->openFrom($request, $run) : $request;
    }

    private function openFrom(object $request, object $run): object
    {
        $round = $this->opener->open($request, $run);
        if ($round) {
            return $this->progress->advance($request, ['status' => 'sent'], 'round.opened',
                "Ronda {$round->round_no} abierta.", ['round_id' => $round->id, 'run_id' => $run->id]);
        }
        if (SearchState::isDirect($request)) {
            $this->notifyClient($request, 'request.direct_declined', 'Tu técnico no está disponible', 'Puedes autorizar la búsqueda de otros técnicos.');

            return $this->progress->advance($request, [], 'matching.direct_unavailable',
                'El técnico elegido no está disponible; no se contactó a nadie más.', ['run_id' => $run->id]);
        }
        if ($request->status === 'pending_availability') {
            return $request;
        }
        // D-21: el plazo de 24 h corre desde el primer pendiente y no se reinicia.
        $since = $request->pending_since === null ? CarbonImmutable::now() : CarbonImmutable::parse($request->pending_since, 'UTC');
        $hours = (int) $this->rules->parameters((int) $request->rule_version_id)['pending_hours'];
        $this->notifyClient($request, 'request.pending', 'Buscando técnicos disponibles',
            'Seguiremos buscando durante 24 horas desde el primer intento.');

        return $this->progress->advance($request, [
            'status' => 'pending_availability', 'pending_since' => $since,
            'pending_expires_at' => $request->pending_expires_at ?? $since->addHours($hours),
        ], 'request.pending', 'Sin técnicos elegibles: la solicitud queda pendiente de disponibilidad.', ['run_id' => $run->id]);
    }

    /** Bloquea la solicitud; si la generación del job ya no es la vigente, la descarta y lo registra. */
    private function current(int $requestId, int $generation, string $job): ?object
    {
        $request = DB::table('service_requests')->where('id', $requestId)->lockForUpdate()->first();
        if ($request && (int) $request->search_generation !== $generation) {
            Log::info('job.stale_generation', ['job' => $job, 'request_id' => $requestId,
                'job_generation' => $generation, 'current_generation' => (int) $request->search_generation]);

            return null;
        }

        return $request;
    }

    private function notifyClient(object $request, string $type, string $title, string $body): void
    {
        $userId = (int) DB::table('client_profiles')->where('id', $request->client_id)->value('user_id');
        $this->inbox->notify($userId, $type, $title, $body, 'service_request', (int) $request->id);
    }
}
