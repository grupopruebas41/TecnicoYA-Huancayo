<?php

namespace App\Modules\CNotifications\Jobs;

use App\Modules\CNotifications\Application\NotificationDelivery;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class DeliverNotification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $notificationId) {}

    public function handle(NotificationDelivery $delivery): void
    {
        $delivery->deliver($this->notificationId);
    }
}
