<?php

namespace App\Modules\ARequests\Application;

use App\Shared\Http\ApiResponse;
use Illuminate\Support\Facades\DB;

/** Trazabilidad de cada solicitud (request_events), dentro de la transacción del cambio. */
final class RequestTimeline
{
    public function record(int $requestId, ?int $actorId, string $type, ?string $from, ?string $to, string $summary,
        int $requestVersion, array $metadata = []): void
    {
        DB::table('request_events')->insert([
            'request_id' => $requestId, 'actor_id' => $actorId, 'event_type' => $type,
            'from_status' => $from, 'to_status' => $to, 'summary' => $summary,
            'metadata' => $metadata === [] ? null : json_encode($metadata, JSON_THROW_ON_ERROR),
            'occurred_at' => now(), 'correlation_id' => ApiResponse::meta()['request_id'],
            'request_version' => $requestVersion,
        ]);
    }
}
