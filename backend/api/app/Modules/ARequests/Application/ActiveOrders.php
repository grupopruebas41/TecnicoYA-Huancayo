<?php

namespace App\Modules\ARequests\Application;

use App\Shared\Rules\RuleBook;
use App\Shared\Rules\RulesUnavailable;
use Illuminate\Support\Facades\DB;

/**
 * Máximo de pedidos activos por cliente (D-95, reemplaza el conteo de D-11). Un pedido está activo si tiene al menos una
 * solicitud desde `sent` hasta el cierre o la cancelación; una solicitud sin pedido cuenta como uno. Las versiones de
 * reglas anteriores a la 3 traen el máximo con su nombre original: entonces cada solicitud era suelta y el conteo coincide.
 */
final class ActiveOrders
{
    public function __construct(private readonly RuleBook $rules) {}

    public function max(int $ruleVersionId): int
    {
        $values = $this->rules->values($ruleVersionId);

        return (int) ($values['max_active_orders_per_client'] ?? $values['max_active_requests_per_client']
            ?? throw new RulesUnavailable('Falta el parámetro max_active_orders_per_client.'));
    }

    /** @param  int|null  $exceptOrderId  el pedido que se está enviando: sus propias solicitudes no cuentan contra él */
    public function count(int $clientId, ?int $exceptOrderId = null): int
    {
        $orderIds = DB::table('service_requests')->where('client_id', $clientId)->where('status', '<>', 'registered')
            ->whereNull('closed_at')->whereNull('cancelled_at')
            ->when($exceptOrderId !== null, fn ($query) => $query->where(fn ($inner) => $inner->whereNull('order_id')->orWhere('order_id', '<>', $exceptOrderId)))
            ->pluck('order_id');

        return $orderIds->whereNull()->count() + $orderIds->whereNotNull()->unique()->count();
    }
}
