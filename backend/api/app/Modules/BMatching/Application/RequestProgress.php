<?php

namespace App\Modules\BMatching\Application;

use App\Modules\ARequests\Application\RequestTimeline;
use App\Modules\CNotifications\Application\Outbox;
use Illuminate\Support\Facades\DB;

/**
 * Cada avance visible de la búsqueda sube la versión de la solicitud, deja su request_event y un aviso
 * request.updated para el titular, todo en la transacción del cambio (la SPA deduplica por versión, contrato §8).
 * Se llama con la solicitud ya bloqueada.
 */
final class RequestProgress
{
    public function __construct(
        private readonly RequestTimeline $timeline,
        private readonly Outbox $outbox,
        private readonly SearchState $state,
    ) {}

    public function advance(object $request, array $changes, string $event, string $summary, array $metadata = [], ?int $actorId = null): object
    {
        $version = (int) $request->version + 1;
        DB::table('service_requests')->where('id', $request->id)->update($changes + ['version' => $version, 'updated_at' => now()]);
        $updated = DB::table('service_requests')->find($request->id);
        $this->timeline->record($request->id, $actorId, $event, $request->status, $updated->status, $summary, $version, $metadata);
        $this->outbox->record('request.updated', "requests.{$request->id}", 'service_request', $request->id, [
            'request_id' => $request->id, 'status' => $updated->status, 'phase' => $this->state->phase($updated), 'version' => $version,
        ]);

        return $updated;
    }
}
