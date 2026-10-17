<?php

namespace App\Modules\CNotifications\Application;

use App\Modules\CNotifications\Jobs\DeliverNotification;
use App\Shared\Rules\RuleBook;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Entrega externa de una notificación (RNF-07): un intento inicial y hasta max_delivery_retries reintentos, a 1, 2 y
 * 4 minutos del intento anterior (D-68). Un intento antes de su hora no hace nada. El error se guarda como código
 * saneado, nunca con el mensaje, la traza ni secretos (SEC). Nunca mueve el plazo de una oferta.
 */
final class NotificationDelivery
{
    /** D-68: minutos entre un intento y el siguiente. */
    public const RETRY_MINUTES = [1, 2, 4];

    public function __construct(private readonly DeliveryChannel $channel, private readonly RuleBook $rules) {}

    public function deliver(int $notificationId): void
    {
        $retryAt = DB::transaction(function () use ($notificationId) {
            $notification = DB::table('notifications')->lockForUpdate()->find($notificationId);
            if (! $notification || $notification->status !== 'pending' || now()->lt($notification->next_attempt_at)) {
                return null;
            }
            $attempt = (int) $notification->attempts + 1;
            [$status, $error] = $this->attempt($notification);
            DB::table('notification_attempts')->insert([
                'notification_id' => $notificationId, 'attempt_no' => $attempt, 'channel' => 'email',
                'status' => $status, 'error_code' => $error, 'attempted_at' => now(),
            ]);
            $maxAttempts = 1 + $this->rules->integer($this->rules->currentVersionId(), 'max_delivery_retries');
            $next = $status === 'failed' && $attempt < $maxAttempts ? now()->addMinutes(self::RETRY_MINUTES[$attempt - 1]) : null;
            DB::table('notifications')->where('id', $notificationId)->update([
                'attempts' => $attempt, 'next_attempt_at' => $next, 'updated_at' => now(),
                'status' => $status === 'sent' ? 'sent' : ($next ? 'pending' : 'failed'),
                'delivered_at' => $status === 'sent' ? now() : null,
            ]);

            return $next;
        });
        if ($retryAt) {
            DeliverNotification::dispatch($notificationId)->delay($retryAt);
        }
    }

    /** @return array{0:string,1:?string} estado del intento y código de error saneado */
    private function attempt(object $notification): array
    {
        try {
            $this->channel->send($notification);

            return ['sent', null];
        } catch (Throwable) {
            return ['failed', 'SANDBOX_UNAVAILABLE'];
        }
    }
}
