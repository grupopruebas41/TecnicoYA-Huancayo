<?php

namespace App\Console\Commands;

use App\Modules\BMatching\Jobs\ExpireOfferRound;
use App\Modules\BMatching\Jobs\ExpirePendingRequest;
use App\Modules\BMatching\Jobs\RetryPendingMatching;
use App\Modules\CNotifications\Jobs\DeliverNotification;
use App\Modules\CNotifications\Jobs\PublishOutboxEvent;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Barrido que el scheduler ejecuta cada minuto (contrato S4 §3). Recupera lo que un job con retardo no hizo (worker
 * caído, reinicio) y aplica los plazos con el reloj del servidor. Cada paso es idempotente y valida la generación.
 */
final class Sweep extends Command
{
    /** D-67: el pendiente se reintenta cada 5 minutos. */
    public const PENDING_RETRY_MINUTES = 5;

    protected $signature = 'tecnicoya:sweep';

    protected $description = 'Vence rondas y pendientes, reintenta el matching pendiente y entrega avisos atrasados.';

    public function handle(): int
    {
        $now = CarbonImmutable::now();
        foreach (DB::table('offer_rounds')->where('status', 'open')->where('expires_at', '<=', $now)->orderBy('id')->get() as $round) {
            dispatch_sync(new ExpireOfferRound($round->id, (int) $round->search_generation));
        }
        foreach (DB::table('service_requests')->where('status', 'pending_availability')->orderBy('id')->get() as $request) {
            if ($now->gte(CarbonImmutable::parse($request->pending_expires_at, 'UTC'))) {
                dispatch_sync(new ExpirePendingRequest($request->id, (int) $request->search_generation));
            } elseif ($now->gte($this->lastAttempt($request)->addMinutes(self::PENDING_RETRY_MINUTES))) {
                dispatch_sync(new RetryPendingMatching($request->id, (int) $request->search_generation));
            }
        }
        foreach (DB::table('notifications')->where('status', 'pending')->where('next_attempt_at', '<=', $now)->orderBy('id')->pluck('id') as $id) {
            dispatch_sync(new DeliverNotification($id));
        }
        foreach (DB::table('outbox_events')->whereNull('published_at')->orderBy('id')->pluck('id') as $id) {
            dispatch_sync(new PublishOutboxEvent($id));
        }
        $this->info('Barrido completado.');

        return self::SUCCESS;
    }

    /** Último intento de búsqueda del pendiente: su inicio o el último reintento, lo que sea posterior. */
    private function lastAttempt(object $request): CarbonImmutable
    {
        $since = CarbonImmutable::parse($request->pending_since, 'UTC');
        $retry = DB::table('matching_runs')->where('request_id', $request->id)->where('run_trigger', 'pending_retry')->max('started_at');

        return $retry === null ? $since : max($since, CarbonImmutable::parse($retry, 'UTC'));
    }
}
