<?php

namespace App\Modules\Premium;

use App\Modules\ARequests\Application\ManageServiceRequests;
use App\Modules\ARequests\Http\Requests\StoreServiceRequestRequest;
use App\Shared\Http\ApiResponse;
use App\Shared\Http\Idempotency;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Fase 6 del panel final (D-98 y D-99): «Mi hogar / Mi negocio» del cliente Premium. Rutas con role:client y premium
 * (403 a free y a otros roles); cada cliente ve solo lo suyo (lo ajeno responde 404). Las lecturas son simuladas.
 */
final class PremiumController
{
    public const WARRANTY_DAYS = 30;

    public function equipment(Request $request): JsonResponse
    {
        return ApiResponse::data(['items' => $this->equipmentRows((int) $request->user()->id)]);
    }

    public function showEquipment(Request $request, int $equipment): JsonResponse
    {
        $row = $this->own($request, $equipment);
        $history = DB::table('service_requests as s')->join('subcategories as c', 'c.id', '=', 's.subcategory_id')
            ->where('s.equipment_id', $row->id)->orderByDesc('s.id')->limit(20)
            ->get(['s.id', 's.status', 's.created_at', 'c.name as subcategory'])
            ->map(fn (object $r) => ['id' => (int) $r->id, 'status' => $r->status, 'subcategory' => $r->subcategory,
                'created_at' => CarbonImmutable::parse($r->created_at)->toISOString()])->all();

        return ApiResponse::data($this->presentEquipment($row) + ['history' => $history]);
    }

    public function storeEquipment(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $data = $this->validated($request, $userId);
        if (DB::table('client_equipment')->where('user_id', $userId)->count() >= 20) {
            return ApiResponse::error('EQUIPMENT_LIMIT', __('api.equipment_limit'), 422, ['name' => [__('api.equipment_limit')]]);
        }
        $id = DB::table('client_equipment')->insertGetId($data + ['user_id' => $userId]);

        return ApiResponse::data($this->presentEquipment(DB::table('client_equipment')->find($id)), 201);
    }

    public function updateEquipment(Request $request, int $equipment): JsonResponse
    {
        $row = $this->own($request, $equipment);
        $data = $this->validated($request, (int) $request->user()->id) + $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);
        abort_unless((int) $row->version === (int) $data['expected_version'], 409, __('api.stale_version'));
        unset($data['expected_version']);
        DB::table('client_equipment')->where('id', $row->id)->update($data + ['version' => $row->version + 1, 'updated_at' => now()]);

        return ApiResponse::data($this->presentEquipment(DB::table('client_equipment')->find($row->id)));
    }

    public function destroyEquipment(Request $request, int $equipment): Response
    {
        $row = $this->own($request, $equipment);
        DB::table('client_equipment')->where('id', $row->id)->delete();

        return response()->noContent();
    }

    /** Tarjetas del panel de sensores: estado, valor actual, umbral y las lecturas de las últimas 24 h. */
    public function devices(Request $request): JsonResponse
    {
        $since = CarbonImmutable::now()->subDay();
        $devices = DB::table('iot_devices as d')->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')
            ->where('e.user_id', $request->user()->id)->orderBy('e.name')->get(['d.*', 'e.name as equipment', 'e.id as equipment_id']);

        return ApiResponse::data(['simulated' => true, 'items' => $devices->map(function (object $device) use ($since) {
            $readings = DB::table('iot_readings')->where('device_id', $device->id)->where('measured_at', '>=', $since)
                ->orderBy('measured_at')->get(['value', 'measured_at']);
            $current = $readings->last();
            $value = $current ? (float) $current->value : null;

            return [
                'id' => (int) $device->id, 'name' => $device->name, 'equipment' => ['id' => (int) $device->equipment_id, 'name' => $device->equipment],
                'metric' => $device->metric, 'metric_label' => IotMonitor::METRICS[$device->metric]['label'], 'unit' => $device->unit,
                'target' => (float) $device->target, 'tolerance' => (float) $device->tolerance, 'threshold_label' => IotMonitor::threshold($device),
                'online' => (bool) $device->online, 'battery' => (int) $device->battery,
                'status' => IotMonitor::status($device, $value), 'value' => $value,
                'measured_at' => $current ? CarbonImmutable::parse($current->measured_at)->toISOString() : null,
                'readings' => $readings->map(fn (object $r) => ['value' => (float) $r->value, 'at' => CarbonImmutable::parse($r->measured_at)->toISOString()])->all(),
            ];
        })->all()]);
    }

    public function alerts(Request $request): JsonResponse
    {
        $rows = DB::table('iot_alerts as a')->join('iot_devices as d', 'd.id', '=', 'a.device_id')
            ->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')->where('a.user_id', $request->user()->id)
            ->orderByRaw('a.resolved_at IS NULL DESC')->orderByDesc('a.started_at')->limit(50)
            ->get(['a.*', 'e.name as equipment', 'e.id as equipment_id']);

        return ApiResponse::data(['simulated' => true, 'items' => $rows->map(fn (object $a) => [
            'id' => (int) $a->id, 'kind' => $a->kind, 'severity' => $a->severity, 'message' => $a->message,
            'equipment' => ['id' => (int) $a->equipment_id, 'name' => $a->equipment], 'value' => $a->value === null ? null : (float) $a->value,
            'started_at' => CarbonImmutable::parse($a->started_at)->toISOString(),
            'resolved_at' => $a->resolved_at ? CarbonImmutable::parse($a->resolved_at)->toISOString() : null,
            'request_id' => $a->request_id === null ? null : (int) $a->request_id,
        ])->all()]);
    }

    /**
     * «Enviar a mi técnico de confianza»: crea y envía una solicitud prellenada con la subcategoría del equipo, la
     * descripción de la alerta y la dirección del equipo, con la misma validación, idempotencia y matching. Va dirigida al
     * primer favorito que atienda la subcategoría; si no hay, al matching normal.
     */
    public function requestFromAlert(Request $request, int $alert, ManageServiceRequests $requests, Idempotency $idempotency): JsonResponse
    {
        $user = $request->user();
        $row = DB::table('iot_alerts as a')->join('iot_devices as d', 'd.id', '=', 'a.device_id')
            ->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')->where('a.id', $alert)->where('a.user_id', $user->id)
            ->first(['a.*', 'e.id as equipment_id', 'e.name as equipment', 'e.subcategory_id', 'e.address_id', 'e.brand', 'e.model']);
        abort_unless($row, 404);
        $key = (string) $request->header('Idempotency-Key');
        abort_if($key === '', 422, __('api.idempotency_required'));
        [$status, $data] = $idempotency->run($user, "iot.alert.request:$alert", $key, ['alert' => $alert], function () use ($user, $row, $requests) {
            abort_if($row->request_id !== null, 409, __('api.alert_already_sent'));
            $payload = $this->requestPayload($user->id, $row);
            $form = StoreServiceRequestRequest::create('/', 'POST', $payload);
            $validated = Validator::make($payload, $form->rules(), $form->messages())->validate();
            $id = $requests->register($user, $validated);
            DB::table('service_requests')->where('id', $id)->update(['equipment_id' => $row->equipment_id]);
            $requests->submit($user, $id, 1);
            DB::table('iot_alerts')->where('id', $row->id)->update(['request_id' => $id]);
            $technician = $payload['source'] === 'profile'
                ? DB::table('technician_profiles')->where('id', $payload['target_technician_id'])->value('display_name') : null;

            return [201, ['request_id' => $id, 'directed' => $technician !== null, 'technician' => $technician]];
        });

        return ApiResponse::data($data, $status);
    }

    /** Promociones de ejemplo: comunicados de tipo promoción para clientes, rotulados como demostración. */
    public function promotions(): JsonResponse
    {
        $rows = DB::table('announcements')->where('status', 'published')->where('kind', 'promotion')
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))->orderByDesc('starts_at')->limit(10)
            ->get(['id', 'title', 'body']);

        return ApiResponse::data(['sample' => true, 'items' => $rows->map(fn (object $r) => ['id' => $r->id, 'title' => $r->title, 'body' => $r->body])->all()]);
    }

    /** Garantías de demostración: solicitudes cerradas del cliente con 30 días; «Usar garantía» llega en el Sprint 6. */
    public function warranties(Request $request): JsonResponse
    {
        $clientId = DB::table('client_profiles')->where('user_id', $request->user()->id)->value('id');
        $rows = DB::table('service_requests as s')->join('subcategories as c', 'c.id', '=', 's.subcategory_id')
            ->where('s.client_id', $clientId)->whereIn('s.status', ['completed', 'closed', 'unrated'])->orderByDesc('s.id')->limit(20)
            ->get(['s.id', 's.closed_at', 's.updated_at', 'c.name as subcategory']);

        return ApiResponse::data(['sample' => true, 'items' => $rows->map(function (object $r) {
            $closed = CarbonImmutable::parse($r->closed_at ?? $r->updated_at);
            $until = $closed->addDays(self::WARRANTY_DAYS);

            return ['request_id' => (int) $r->id, 'subcategory' => $r->subcategory, 'days' => self::WARRANTY_DAYS,
                'closed_at' => $closed->toISOString(), 'valid_until' => $until->toISOString(), 'active' => $until->isFuture(), 'can_claim' => false];
        })->all()]);
    }

    private function requestPayload(int $userId, object $alert): array
    {
        $address = $alert->address_id ? DB::table('client_addresses')->where('id', $alert->address_id)->where('user_id', $userId)->first() : null;
        $profile = DB::table('client_profiles')->where('user_id', $userId)->first();
        $favorite = DB::table('client_favorite_technicians as f')->join('technician_services as s', 's.technician_id', '=', 'f.technician_id')
            ->join('technician_profiles as t', 't.id', '=', 'f.technician_id')->where('f.client_user_id', $userId)
            ->where('s.subcategory_id', $alert->subcategory_id)->where('s.active', 1)->where('t.status', 'active')
            ->where('t.verification_status', 'approved')->orderByDesc('f.created_at')->value('f.technician_id');
        $equipment = trim($alert->equipment.' '.($alert->brand ?? '').' '.($alert->model ?? ''));

        return [
            'subcategory_id' => (int) $alert->subcategory_id,
            'description' => "Alerta del sensor (demostración) de $equipment: {$alert->message}.",
            'district_id' => (int) ($address->district_id ?? $profile->district_id),
            'address' => (string) ($address->address ?? $profile->default_address),
            'mode' => 'asap',
            'source' => $favorite ? 'profile' : 'automatic',
        ] + ($favorite ? ['target_technician_id' => (int) $favorite] : []);
    }

    private function own(Request $request, int $equipment): object
    {
        $row = DB::table('client_equipment')->where('id', $equipment)->where('user_id', $request->user()->id)->first();
        abort_unless($row, 404);

        return $row;
    }

    private function validated(Request $request, int $userId): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'subcategory_id' => ['required', 'integer', Rule::exists('subcategories', 'id')->where('active', 1)],
            'brand' => ['nullable', 'string', 'max:60'],
            'model' => ['nullable', 'string', 'max:60'],
            'year' => ['nullable', 'integer', 'between:1980,'.(now()->year + 1)],
            'address_id' => ['nullable', 'integer', Rule::exists('client_addresses', 'id')->where('user_id', $userId)],
            'notes' => ['nullable', 'string', 'max:500'],
            'user_id' => ['prohibited'], 'is_demo' => ['prohibited'],
        ], [
            'name.required' => __('api.equipment_name'), 'name.min' => __('api.equipment_name'), 'name.max' => __('api.equipment_name'),
            'subcategory_id.required' => __('api.equipment_type'), 'subcategory_id.exists' => __('api.equipment_type'),
            'year.between' => __('api.equipment_year'), 'address_id.exists' => __('api.equipment_address'), 'notes.max' => __('api.equipment_notes'),
        ]);

        return array_intersect_key($data, array_flip(['name', 'subcategory_id', 'brand', 'model', 'year', 'address_id', 'notes']));
    }

    private function equipmentRows(int $userId): array
    {
        return DB::table('client_equipment')->where('user_id', $userId)->orderBy('name')->get()->map(fn (object $r) => $this->presentEquipment($r))->all();
    }

    private function presentEquipment(object $row): array
    {
        $sub = DB::table('subcategories as c')->join('specialties as p', 'p.id', '=', 'c.specialty_id')->where('c.id', $row->subcategory_id)
            ->first(['c.name', 'p.id as specialty_id', 'p.name as specialty']);
        $address = $row->address_id ? DB::table('client_addresses')->where('id', $row->address_id)->first(['label', 'address']) : null;

        return [
            'id' => (int) $row->id, 'name' => $row->name, 'subcategory_id' => (int) $row->subcategory_id, 'subcategory' => $sub?->name,
            'specialty_id' => $sub ? (int) $sub->specialty_id : null, 'specialty' => $sub?->specialty, 'brand' => $row->brand, 'model' => $row->model,
            'year' => $row->year === null ? null : (int) $row->year, 'address_id' => $row->address_id === null ? null : (int) $row->address_id,
            'address' => $address ? "{$address->label} · {$address->address}" : null, 'notes' => $row->notes, 'is_demo' => (bool) $row->is_demo,
            'has_sensor' => DB::table('iot_devices')->where('equipment_id', $row->id)->exists(), 'version' => (int) $row->version,
        ];
    }
}
