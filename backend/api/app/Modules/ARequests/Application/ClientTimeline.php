<?php

namespace App\Modules\ARequests\Application;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * D-89 (TIMELINE-01): línea de tiempo que ve el titular de la solicitud. Solo los tipos de la lista fija y con
 * textos fijos en español; nunca el summary, los metadatos, el actor ni la correlación de request_events, que
 * pueden llevar motivos internos (CANVAS S5, T-S05-05). Los demás tipos (correcciones, fotos o futuros) no se ven.
 */
final class ClientTimeline
{
    public const LABELS = [
        'request.registered' => 'Solicitud registrada',
        'request.submitted' => 'Solicitud enviada',
        'round.opened' => 'Enviamos tu solicitud a técnicos disponibles',
        'request.pending' => 'Sin técnicos disponibles por ahora; seguimos buscando',
        'round.awaiting_choice' => 'Hay técnicos que aceptaron: elige uno',
        'matching.direct_declined' => 'El técnico que elegiste no aceptó la solicitud',
        'matching.direct_unavailable' => 'El técnico que elegiste no está disponible',
        'request.alternative_search' => 'Autorizaste buscar otros técnicos',
        'selection.unavailable' => 'El técnico elegido ya no estaba disponible',
        'request.assigned' => 'Elegiste a tu técnico',
        'request.expired' => 'La solicitud venció sin técnico asignado',
    ];

    public function forOwner(int $requestId): array
    {
        return DB::table('request_events')->where('request_id', $requestId)->whereIn('event_type', array_keys(self::LABELS))
            ->orderBy('occurred_at')->orderBy('id')->get(['event_type', 'from_status', 'to_status', 'occurred_at'])
            ->map(fn (object $event) => [
                'type' => $event->event_type, 'label' => self::LABELS[$event->event_type],
                'from_status' => $event->from_status, 'to_status' => $event->to_status,
                'occurred_at' => Carbon::parse($event->occurred_at)->toISOString(),
            ])->all();
    }
}
