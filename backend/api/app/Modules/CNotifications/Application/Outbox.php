<?php

namespace App\Modules\CNotifications\Application;

use App\Modules\CNotifications\Jobs\PublishOutboxEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Eventos de tiempo real guardados en la misma transacción que el cambio (outbox_events) y publicados solo después
 * del commit (TC-046). La carga es mínima: identificadores, estado y versión, sin datos personales (SEC-S04-05).
 */
final class Outbox
{
    public function record(string $type, string $channel, string $aggregateType, int $aggregateId, array $payload): int
    {
        $eventId = (string) Str::uuid();
        $id = DB::table('outbox_events')->insertGetId([
            'event_id' => $eventId, 'event_type' => $type, 'channel' => $channel,
            'aggregate_type' => $aggregateType, 'aggregate_id' => $aggregateId,
            'payload' => json_encode(['event_id' => $eventId, 'type' => $type] + $payload + ['occurred_at' => now()->toISOString()], JSON_THROW_ON_ERROR),
        ]);
        PublishOutboxEvent::dispatch($id)->afterCommit();

        return $id;
    }
}
