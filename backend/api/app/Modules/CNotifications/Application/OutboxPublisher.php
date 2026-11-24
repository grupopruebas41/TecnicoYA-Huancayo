<?php

namespace App\Modules\CNotifications\Application;

use App\Modules\CNotifications\Events\AdminMatchingSignal;
use App\Modules\CNotifications\Events\OutboxBroadcast;
use App\Shared\Rules\RuleBook;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Publica por Reverb una fila del outbox una sola vez por event_id (TC-046). Si Reverb no responde, el intento queda
 * como entrega fallida y el barrido lo repite hasta 1 + max_delivery_retries veces (RNF-07); el cambio de negocio
 * ya está confirmado y la SPA recupera el estado por la API.
 */
final class OutboxPublisher
{
    public function __construct(private readonly RuleBook $rules) {}

    public function publish(int $outboxId): void
    {
        DB::transaction(function () use ($outboxId) {
            $event = DB::table('outbox_events')->lockForUpdate()->find($outboxId);
            if (! $event || $event->published_at !== null || $this->attempts($outboxId) >= $this->maxAttempts()) {
                return;
            }
            try {
                event(new OutboxBroadcast($event->channel, $event->event_type, json_decode($event->payload, true, 512, JSON_THROW_ON_ERROR)));
                $status = 'sent';
            } catch (Throwable) {
                $status = 'failed';
            }
            DB::table('outbox_deliveries')->insert([
                'outbox_event_id' => $outboxId, 'attempt_no' => $this->attempts($outboxId) + 1, 'status' => $status,
                'error_code' => $status === 'failed' ? 'REVERB_UNAVAILABLE' : null, 'attempted_at' => now(),
            ]);
            if ($status === 'sent') {
                DB::table('outbox_events')->where('id', $outboxId)->update(['published_at' => now()]);
                $this->signalAdmin($event);
            }
        });
    }

    /**
     * Fase A3 del panel del administrador: cada cambio publicado de una solicitud o de una oferta avisa al canal
     * admin.matching con el número de la solicitud y nada más. Si Reverb no responde, el tablero se actualiza cada 30 s.
     */
    private function signalAdmin(object $event): void
    {
        $payload = json_decode($event->payload, true) ?: [];
        $requestId = $payload['request_id'] ?? ($event->aggregate_type === 'service_request' ? $event->aggregate_id : null);
        if (! in_array($event->aggregate_type, ['service_request', 'offer'], true) || $requestId === null) {
            return;
        }
        try {
            event(new AdminMatchingSignal(['event_id' => (string) Str::uuid(), 'request_id' => (int) $requestId]));
        } catch (Throwable) {
            // Sin Reverb no hay señal: el tablero se actualiza por consulta periódica.
        }
    }

    public function maxAttempts(): int
    {
        return 1 + $this->rules->integer($this->rules->currentVersionId(), 'max_delivery_retries');
    }

    private function attempts(int $outboxId): int
    {
        return DB::table('outbox_deliveries')->where('outbox_event_id', $outboxId)->count();
    }
}
