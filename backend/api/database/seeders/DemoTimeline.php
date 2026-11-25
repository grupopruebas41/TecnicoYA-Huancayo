<?php

namespace Database\Seeders;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * DEF-85 (revisión del #70): las solicitudes de demostración se insertan directo en la base, sin pasar por el flujo que
 * escribe request_events, y el detalle del administrador (y el seguimiento del cliente, D-89) quedaba «Sin eventos
 * registrados». Esta clase arma la línea de tiempo de cada solicitud de los clientes indicados que no tenga eventos, con
 * los mismos tipos y textos del flujo real y las fechas que ya guarda la solicitud: registrada, enviada, cada ronda con
 * sus ofertas respondidas o vencidas, pendiente de 24 h, asignada, cancelada o vencida. Solo DemoSeeder (APP_ENV=local).
 */
final class DemoTimeline
{
    /** @param list<int> $clientIds */
    public function backfill(array $clientIds): int
    {
        $requests = DB::table('service_requests as s')->join('client_profiles as c', 'c.id', '=', 's.client_id')
            ->whereIn('s.client_id', $clientIds)->whereNotExists(fn ($q) => $q->from('request_events as e')->whereColumn('e.request_id', 's.id'))
            ->orderBy('s.id')->get(['s.*', 'c.user_id as client_user_id']);
        foreach ($requests as $request) {
            $this->write($request);
        }

        return $requests->count();
    }

    private function write(object $request): void
    {
        $at = fn (?string $value) => $value === null ? null : CarbonImmutable::parse($value, 'UTC');
        $submitted = $at($request->submitted_at) ?? $at($request->created_at);
        $events = [
            [$submitted->subMinutes(2), 'request.registered', null, 'registered', 'Solicitud registrada por el cliente.', $request->client_user_id],
            [$submitted, 'request.submitted', 'registered', 'sent', 'Solicitud enviada por el cliente.', $request->client_user_id],
        ];
        $rounds = DB::table('offer_rounds')->where('request_id', $request->id)->orderBy('opened_at')->orderBy('id')->get();
        $offers = DB::table('offers')->where('request_id', $request->id)->orderBy('id')->get()->groupBy('round_id');
        foreach ($rounds as $round) {
            $events[] = [$at($round->opened_at), 'round.opened', 'sent', 'sent', "Ronda {$round->round_no} abierta.", null];
            foreach ($offers[$round->id] ?? [] as $offer) {
                $event = match ($offer->status) {
                    'expired' => [$at($offer->expires_at), 'offer.expired', 'La oferta venció sin respuesta.'],
                    'accepted' => [$at($offer->responded_at), 'offer.accepted', 'El técnico aceptó la oferta.'],
                    'rejected' => [$at($offer->responded_at), 'offer.rejected', 'El técnico rechazó la oferta.'],
                    default => null,
                };
                if ($event !== null && $event[0] !== null) {
                    $events[] = [$event[0], $event[1], 'pending', $offer->status, $event[2], null];
                }
            }
        }
        if ($request->pending_since !== null) {
            $events[] = [$at($request->pending_since), 'request.pending', 'sent', 'pending_availability',
                'Sin técnicos elegibles: la solicitud queda pendiente de disponibilidad.', null];
        }
        $assigned = DB::table('participations')->where('request_id', $request->id)->whereNotNull('assigned_at')->value('assigned_at');
        if ($assigned !== null) {
            $events[] = [$at($assigned), 'request.assigned', 'sent', 'assigned', 'El cliente eligió al técnico.', $request->client_user_id];
        }
        if ($request->cancelled_at !== null) {
            $events[] = [$at($request->cancelled_at), 'request.cancelled', null, 'cancelled', 'Solicitud cancelada por el cliente.', $request->client_user_id];
        } elseif ($request->status === 'expired' && $request->closed_at !== null) {
            $events[] = [$at($request->closed_at), 'request.expired', null, 'expired', 'La solicitud venció sin técnico asignado.', null];
        }

        usort($events, fn (array $a, array $b) => $a[0] <=> $b[0]);
        foreach ($events as $index => [$when, $type, $from, $to, $summary, $actor]) {
            DB::table('request_events')->insert([
                'request_id' => $request->id, 'actor_id' => $actor, 'event_type' => $type, 'from_status' => $from, 'to_status' => $to,
                'summary' => $summary, 'metadata' => json_encode(['demo' => true]), 'occurred_at' => $when,
                'correlation_id' => (string) Str::uuid(), 'request_version' => $index + 1,
            ]);
        }
    }
}
