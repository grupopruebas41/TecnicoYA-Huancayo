<?php

namespace App\Modules\ARequests\Application;

use App\Models\User;
use App\Shared\Http\ApiResponse;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

/**
 * Pedido por especialidades (D-92 y D-95, PEDIDO-02). Crea un borrador por especialidad, con todas sus subcategorías y la
 * ubicación y el horario comunes, y los envía juntos dentro de la transacción de Idempotency: o se envían todos o ninguno.
 * Antes de crear nada aplica el máximo de pedidos activos. Cada solicitud sigue el envío del S3 (SubmissionPolicy y
 * versión de reglas) y el matching elige un técnico que atienda todas sus subcategorías (D-96).
 */
final class ServiceOrders
{
    /** Franjas en hora de Lima (D-92): solo orientativas antes del matching. */
    public const SLOTS = ['manana' => ['08:00', '12:00'], 'tarde' => ['12:00', '18:00'], 'noche' => ['18:00', '21:00']];

    public function __construct(private readonly ManageServiceRequests $requests, private readonly RuleBook $rules, private readonly ActiveOrders $orders) {}

    public static function slotStart(string $date, string $slot): CarbonImmutable
    {
        return CarbonImmutable::parse("$date ".self::SLOTS[$slot][0], 'America/Lima')->utc();
    }

    public static function slotEnd(string $date, string $slot): CarbonImmutable
    {
        return CarbonImmutable::parse("$date ".self::SLOTS[$slot][1], 'America/Lima')->utc();
    }

    /** @return array{max:int, active:int, available:int} */
    public function quotaFor(int $clientId): array
    {
        $max = $this->orders->max($this->rules->currentVersionId());
        $active = $this->orders->count($clientId);

        return ['max' => $max, 'active' => $active, 'available' => max(0, $max - $active)];
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
        if ($quota['available'] < 1) {
            throw new HttpResponseException(ApiResponse::error('ACTIVE_REQUEST_LIMIT', __('api.active_request_limit', ['max' => $quota['max']]), 409));
        }

        $orderId = DB::table('service_orders')->insertGetId([
            'client_id' => $clientId, 'item_count' => count($items), 'submitted_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
        $scheduled = $data['mode'] === 'scheduled';
        $sent = [];
        foreach ($items as $item) {
            $subcategoryIds = array_values(array_map('intval', $item['subcategory_ids']));
            $id = $this->requests->register($user, [
                'subcategory_id' => $subcategoryIds[0], 'district_id' => $data['district_id'],
                'description' => $item['description'], 'address' => $data['address'], 'mode' => $data['mode'],
                'preferred_start_at' => $scheduled ? self::slotStart($data['scheduled_date'], $data['time_slot'])->toIso8601String() : null,
                'preferred_end_at' => $scheduled ? self::slotEnd($data['scheduled_date'], $data['time_slot'])->toIso8601String() : null,
                'source' => 'automatic',
            ]);
            DB::table('service_requests')->where('id', $id)->update([
                'order_id' => $orderId, 'urgency' => $item['urgency'], 'brand' => $item['brand'] ?? null, 'model' => $item['model'] ?? null,
                'address_reference' => $data['address_reference'] ?? null, 'time_slot' => $scheduled ? $data['time_slot'] : null,
                'reference_fee_snapshot' => $this->referenceFee($subcategoryIds),
            ]);
            DB::table('request_subcategories')->insert(array_map(fn (int $subcategoryId, int $position) => [
                'request_id' => $id, 'subcategory_id' => $subcategoryId, 'position' => $position + 1,
            ], $subcategoryIds, array_keys($subcategoryIds)));
            foreach (array_values($item['media_ids'] ?? []) as $position => $mediaId) {
                DB::table('request_attachments')->insert(['request_id' => $id, 'media_id' => $mediaId, 'uploaded_by' => $user->id,
                    'position' => $position + 1, 'caption' => null]);
            }
            DB::table('request_symptoms')->insert(array_map(fn ($symptomId) => ['request_id' => $id, 'symptom_id' => $symptomId],
                array_values(array_unique($item['symptom_ids'] ?? []))));
            $result = $this->requests->submit($user, $id, 1);
            $names = DB::table('subcategories')->whereIn('id', $subcategoryIds)->pluck('name', 'id');
            $subcategories = array_map(fn (int $subcategoryId) => ['id' => $subcategoryId, 'name' => $names[$subcategoryId]], $subcategoryIds);
            $sent[] = ['id' => $id, 'status' => $result['status'], 'version' => $result['version'],
                'specialty' => ['id' => (int) $item['specialty_id'], 'name' => DB::table('specialties')->where('id', $item['specialty_id'])->value('name')],
                'subcategory' => $subcategories[0], 'subcategories' => $subcategories];
        }

        return ['id' => $orderId, 'status' => 'sent', 'requests' => $sent];
    }

    /** D-96: suma de las tarifas «desde» del catálogo; null si ninguna tiene tarifa. Siempre referencial (RF-04). */
    private function referenceFee(array $subcategoryIds): ?string
    {
        $fees = DB::table('subcategories')->whereIn('id', $subcategoryIds)->whereNotNull('reference_fee')->pluck('reference_fee');

        return $fees->isEmpty() ? null : number_format((float) $fees->sum(), 2, '.', '');
    }
}
