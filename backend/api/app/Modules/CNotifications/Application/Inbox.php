<?php

namespace App\Modules\CNotifications\Application;

use App\Modules\CNotifications\Jobs\DeliverNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Bandeja interna (notifications): la notificación se crea en la misma transacción que el hecho que avisa, así el
 * plazo corre desde la bandeja aunque falle el envío externo (D-21). La entrega y el aviso en tiempo real salen
 * después del commit.
 */
final class Inbox
{
    public function __construct(private readonly Outbox $outbox) {}

    public function notify(int $userId, string $type, string $title, string $body, string $subjectType, int $subjectId): int
    {
        $id = DB::table('notifications')->insertGetId([
            'user_id' => $userId, 'type' => $type, 'title' => $title, 'body' => $body,
            'subject_type' => $subjectType, 'subject_id' => $subjectId, 'event_id' => (string) Str::uuid(),
            'status' => 'pending', 'next_attempt_at' => now(),
        ]);
        $this->outbox->record('notification.created', "users.$userId", 'notification', $id, ['notification_id' => $id]);
        DeliverNotification::dispatch($id)->afterCommit();

        return $id;
    }
}
