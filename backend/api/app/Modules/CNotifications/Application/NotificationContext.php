<?php

namespace App\Modules\CNotifications\Application;

use Illuminate\Support\Facades\DB;

/**
 * Rediseño de la campana (Fase 4): categoría visual de cada tipo y contexto de la solicitud (pedido, especialidad y
 * subcategorías), calculados en lote para una página de la bandeja. Solo datos del propio usuario: la bandeja ya filtra
 * por dueño y la solicitud es la del aviso.
 */
final class NotificationContext
{
    public const CATEGORIES = [
        'search' => ['request.pending', 'request.submitted', 'request.searching'],
        'offer' => ['request.awaiting_choice', 'request.assigned', 'offer.created'],
        'cancel' => ['request.cancelled', 'request.expired', 'request.direct_declined'],
    ];

    public static function category(string $type): string
    {
        foreach (self::CATEGORIES as $category => $types) {
            if (in_array($type, $types, true)) {
                return $category;
            }
        }

        if (str_starts_with($type, 'iot.')) {
            return 'iot';
        }

        return str_starts_with($type, 'announcement') ? 'announcement' : 'system';
    }

    /** Contexto por id de solicitud: [request_id => [...]] para las solicitudes de la página. */
    public static function forRequests(array $requestIds): array
    {
        $requestIds = array_values(array_unique(array_filter($requestIds)));
        if ($requestIds === []) {
            return [];
        }
        $rows = DB::table('service_requests as r')->join('subcategories as c', 'c.id', '=', 'r.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 'c.specialty_id')->whereIn('r.id', $requestIds)
            ->get(['r.id', 'r.order_id', 'r.status', 'p.name as specialty', 'c.name as subcategory']);
        $subcategories = DB::table('request_subcategories as rs')->join('subcategories as c', 'c.id', '=', 'rs.subcategory_id')
            ->whereIn('rs.request_id', $requestIds)->orderBy('rs.position')
            ->get(['rs.request_id', 'c.name'])->groupBy('request_id');

        return $rows->mapWithKeys(function (object $row) use ($subcategories) {
            $names = $subcategories->get($row->id, collect())->pluck('name')->all() ?: [$row->subcategory];
            $where = ($row->order_id ? "Pedido #{$row->order_id} · " : '')."Solicitud #{$row->id}";

            return [(int) $row->id => [
                'request_id' => (int) $row->id, 'order_id' => $row->order_id === null ? null : (int) $row->order_id,
                'status' => $row->status, 'specialty' => $row->specialty, 'subcategories' => $names,
                'label' => $where.' · '.$row->specialty.' · '.implode(', ', $names),
            ]];
        })->all();
    }
}
