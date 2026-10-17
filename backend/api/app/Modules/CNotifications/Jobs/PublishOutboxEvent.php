<?php

namespace App\Modules\CNotifications\Jobs;

use App\Modules\CNotifications\Application\OutboxPublisher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class PublishOutboxEvent implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $outboxId) {}

    public function handle(OutboxPublisher $publisher): void
    {
        $publisher->publish($this->outboxId);
    }
}
