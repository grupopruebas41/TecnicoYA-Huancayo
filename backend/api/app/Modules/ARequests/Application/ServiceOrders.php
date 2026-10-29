<?php

namespace App\Modules\ARequests\Application;

use App\Models\User;
use App\Shared\Http\ApiResponse;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

/**
 * Pedido con varios rubros (D-92, PEDIDO-01). Crea un borrador por subcategoría con la ubicación y el horario comunes y
 * los envía juntos dentro de la transacción de Idempotency: o se envían todos o ninguno. Antes de crear nada aplica el
 * máximo de solicitudes activas (D-11, D-58) al pedido entero. Cada solicitud sigue el envío del S3 (SubmissionPolicy,
 * versión de reglas y matching del S4 sin cambios).
 */
final class ServiceOrders
{
    public const MAX_ITEMS = 3;

    /** Franjas en hora de Lima (D-92): solo orientativas antes del matching. */
    public const SLOTS = ['manana' => ['08:00', '12:00'], 'tarde' => ['12:00', '18:00'], 'noche' => ['18:00', '21:00']];

    public function __construct(private readonly ManageServiceRequests $requests, private readonly RuleBook $rules) {}

    public static function slotStart(string $date, string $slot): CarbonImmutable
    {
        return CarbonImmutable::parse("$date ".self::SLOTS[$slot][0], 'America/Lima')->utc();
    }

    public static function slotEnd(string $date, string $slot): CarbonImmutable
    {
        return CarbonImmutable::parse("$date ".self::SLOTS[$slot][1], 'America/Lima')->utc();
    }

    /** @return array{max:int, active:int, available:int, max_items:int} */
    public function quotaFor(int $clientId): array
    {
        $max = $this->rules->integer($this->rules->currentVersionId(), 'max_active_requests_per_client');
        $active = $this->activeCount($clientId);

        return ['max' => $max, 'active' => $active, 'available' => max(0, $max - $active), 'max_items' => self::MAX_ITEMS];
    }

    /** Corre dentro de la transacción de Idempotency (el controlador exige la clave). */
    public function place(User $user, array $data): array
    {
        $clientId = DB::table('client_profiles')->where('user_id', $user->id)->value('id');
        abort_unless($clientId, 403);
        // Serializa los pedidos y envíos del mismo cliente para que no superen juntos el máximo.
        DB::table('client_profiles')->where('id', $clientId)->lockForUpdate()->first();
        $quota = $this->quotaFor((int) $clientId);
        $items = $data['items'];
        if (count($items) > $quota['available']) {
            throw new HttpResponseException(ApiResponse::error('ACTIVE_REQUEST_LIMIT', __('api.order_quota', [
                'items' => count($items), 'active' => $quota['active'], 'available' => $quota['available'], 'max' => $quota['max'],
            ]), 409));
        }

        $orderId = DB::table('service_orders')->insertGetId([
            'client_id' => $clientId, 'item_count' => count($items), 'submitted_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
        $scheduled = $data['mode'] === 'scheduled';
        $sent = [];
        foreach ($items as $item) {
            $id = $this->requests->register($user, [
                'subcategory_id' => $item['subcategory_id'], 'district_id' => $data['district_id'],
                'description' => $item['description'], 'address' => $data['address'], 'mode' => $data['mode'],
                'preferred_start_at' => $scheduled ? self::slotStart($data['scheduled_date'], $data['time_slot'])->toIso8601String() : null,
                'preferred_end_at' => $scheduled ? self::slotEnd($data['scheduled_date'], $data['time_slot'])->toIso8601String() : null,
                'source' => 'automatic',
            ]);
            DB::table('service_requests')->where('id', $id)->update([
                'order_id' => $orderId, 'urgency' => $item['urgency'], 'brand' => $item['brand'] ?? null, 'model' => $item['model'] ?? null,
                'address_reference' => $data['address_reference'] ?? null, 'time_slot' => $scheduled ? $data['time_slot'] : null,
            ]);
            foreach (array_values($item['media_ids'] ?? []) as $position => $mediaId) {
                DB::table('request_attachments')->insert(['request_id' => $id, 'media_id' => $mediaId, 'uploaded_by' => $user->id,
                    'position' => $position + 1, 'caption' => null]);
            }
            DB::table('request_symptoms')->insert(array_map(fn ($symptomId) => ['request_id' => $id, 'symptom_id' => $symptomId],
                array_values(array_unique($item['symptom_ids'] ?? []))));
            $result = $this->requests->submit($user, $id, 1);
            $sent[] = ['id' => $id, 'status' => $result['status'], 'version' => $result['version'],
                'subcategory' => ['id' => (int) $item['subcategory_id'],
                    'name' => DB::table('subcategories')->where('id', $item['subcategory_id'])->value('name')]];
        }

        return ['id' => $orderId, 'status' => 'sent', 'requests' => $sent];
    }

    private function activeCount(int $clientId): int
    {
        return DB::table('service_requests')->where('client_id', $clientId)->where('status', '<>', 'registered')
            ->whereNull('closed_at')->whereNull('cancelled_at')->count();
    }
}
