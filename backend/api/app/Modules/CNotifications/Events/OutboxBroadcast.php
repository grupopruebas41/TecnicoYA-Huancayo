<?php

namespace App\Modules\CNotifications\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/** Evento de Reverb armado desde una fila del outbox: canal privado, nombre del tipo y carga mínima (contrato §8). */
final class OutboxBroadcast implements ShouldBroadcastNow
{
    public function __construct(public readonly string $channel, public readonly string $type, public readonly array $payload) {}

    /** @return array<int, PrivateChannel> */
    public function broadcastOn(): array
    {
        return [new PrivateChannel($this->channel)];
    }

    public function broadcastAs(): string
    {
        return $this->type;
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
