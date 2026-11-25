<?php

namespace App\Modules\CNotifications\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/**
 * Señal del tablero del administrador (Fase A3): canal privado admin.matching, evento matching.changed y solo
 * {event_id, request_id}. Va aparte de OutboxBroadcast para que cada fila del outbox se siga difundiendo una sola vez.
 */
final class AdminMatchingSignal implements ShouldBroadcastNow
{
    public const CHANNEL = 'admin.matching';

    public function __construct(public readonly array $payload) {}

    /** @return array<int, PrivateChannel> */
    public function broadcastOn(): array
    {
        return [new PrivateChannel(self::CHANNEL)];
    }

    public function broadcastAs(): string
    {
        return 'matching.changed';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
