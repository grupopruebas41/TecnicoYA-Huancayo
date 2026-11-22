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
    /**
     * DEF-80: estados guardados de una solicitud viva (las programadas también). La regla es por estado: una terminada
     * (completada, cerrada, sin calificar, cancelada o vencida) no cuenta aunque le falte closed_at o cancelled_at, y el
     * borrador (registered) tampoco; y una con fecha de cierre o de cancelación tampoco, aunque conserve un estado vivo. Las pestañas de Mis solicitudes y el contador del menú usan la misma lista.
     */
    public const LIVE_STATUSES = ['sent', 'pending_availability', 'assigned', 'in_progress'];

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
        $orderIds = DB::table('service_requests')->where('client_id', $clientId)->whereIn('status', self::LIVE_STATUSES)
            ->whereNull('closed_at')->whereNull('cancelled_at')
            // D-113: la solicitud creada desde una alerta de falla de un sensor no cuenta (urgencia del equipo).
            ->whereNotIn('id', DB::table('iot_alerts')->whereNotNull('request_id')->where('kind', 'threshold')->where('severity', 'failure')->select('request_id'))
            ->when($exceptOrderId !== null, fn ($query) => $query->where(fn ($inner) => $inner->whereNull('order_id')->orWhere('order_id', '<>', $exceptOrderId)))
            ->pluck('order_id');

        return $orderIds->whereNull()->count() + $orderIds->whereNotNull()->unique()->count();
    }

    /** D-113: una solicitud enlazada a una alerta de falla de un sensor (no a un recordatorio) queda fuera del límite. */
    public static function exempt(int $requestId): bool
    {
        return DB::table('iot_alerts')->where('request_id', $requestId)->where('kind', 'threshold')->where('severity', 'failure')->exists();
    }
}
