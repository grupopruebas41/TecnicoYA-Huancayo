<?php

namespace App\Modules\ARequests\Application;

use Illuminate\Support\Facades\DB;

/**
 * Subcategorías de una solicitud (D-95). Solo las solicitudes de un pedido tienen filas en request_subcategories; las
 * demás tienen una sola, la de service_requests.subcategory_id.
 */
final class RequestSubcategories
{
    /** @return int[] ids en el orden marcado; la primera es la principal */
    public static function ids(object $request): array
    {
        $principal = [(int) $request->subcategory_id];
        if (($request->order_id ?? null) === null) {
            return $principal;
        }
        $ids = DB::table('request_subcategories')->where('request_id', $request->id)->orderBy('position')->pluck('subcategory_id')
            ->map(fn ($id) => (int) $id)->all();

        return $ids === [] ? $principal : $ids;
    }

    /**
     * @param  iterable<object>  $requests  filas con id, subcategory_id y order_id
     * @return array<int, list<array{id:int, name:string}>> por id de solicitud, sin consultas por fila
     */
    public static function named(iterable $requests): array
    {
        $requests = collect($requests);
        $linked = DB::table('request_subcategories as l')->join('subcategories as s', 's.id', '=', 'l.subcategory_id')
            ->whereIn('l.request_id', $requests->whereNotNull('order_id')->pluck('id'))->orderBy('l.position')
            ->get(['l.request_id', 's.id', 's.name'])->groupBy('request_id');
        $principals = DB::table('subcategories')->whereIn('id', $requests->pluck('subcategory_id')->unique())->pluck('name', 'id');

        return $requests->mapWithKeys(fn (object $request) => [(int) $request->id => $linked->has($request->id)
            ? $linked[$request->id]->map(fn (object $row) => ['id' => (int) $row->id, 'name' => $row->name])->all()
            : [['id' => (int) $request->subcategory_id, 'name' => $principals[$request->subcategory_id]]]])->all();
    }
}
