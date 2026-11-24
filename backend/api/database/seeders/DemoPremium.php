<?php

namespace Database\Seeders;

use App\Console\Commands\IotSimulate;
use App\Modules\Premium\IotMonitor;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Fase 6 (D-98, D-99): datos de demostración del plan Premium para demo-mype (bodega ficticia). Equipos con sensores
 * SIMULADOS, 24 h de lecturas (la congeladora sale de rango en la tarde), un recordatorio de mantenimiento y un servicio
 * cerrado para mostrar la garantía. Idempotente: no duplica equipos ni lecturas.
 */
final class DemoPremium
{
    private const EQUIPMENT = [
        ['Congeladora de helados', 'frio-congeladores', 'Frigo', 'CH-300', 2021, 'temperature', 'Sensor de temperatura', -18, 3, 'Simulación: falla en la tarde', 60],
        ['Vitrina de bebidas', 'frio-vitrinas', 'Vitrofrío', 'VB-2P', 2019, 'temperature', 'Sensor de temperatura', 4, 2, null, 200],
        ['Computadora de caja', 'computo-hardware', 'Lenovo', 'ThinkCentre', 2022, 'power', 'Medidor de consumo', 90, 25, null, 40],
    ];

    public function __construct(private readonly IotMonitor $monitor, private readonly RuleBook $rules) {}

    public function run(int $userId, int $clientId, int $districtId): void
    {
        DB::table('client_profiles')->where('id', $clientId)->update(['plan' => 'premium', 'plan_since' => DB::raw('COALESCE(plan_since, CURRENT_TIMESTAMP)')]);
        if (! DB::table('client_addresses')->where('user_id', $userId)->exists()) {
            DB::table('client_addresses')->insert(['user_id' => $userId, 'kind' => 'business', 'label' => 'Bodega', 'district_id' => $districtId,
                'address' => 'Av. Sintética 742, El Tambo', 'reference' => 'Frente al parque (dato de ejemplo)', 'is_default' => true]);
        }
        $address = (int) DB::table('client_addresses')->where('user_id', $userId)->orderByDesc('is_default')->value('id');
        $now = CarbonImmutable::now()->startOfHour();
        // D-121: cada cuántos días toca el mantenimiento preventivo, de las reglas (maintenance_reminder_days).
        $maintenance = (int) app(RuleBook::class)->formalized('maintenance_reminder_days');
        foreach (self::EQUIPMENT as [$name, $code, $brand, $model, $year, $metric, $sensor, $target, $tolerance, $notes, $maintenanceDaysAgo]) {
            $device = DB::table('iot_devices as d')->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')
                ->where('e.user_id', $userId)->where('e.name', $name)->value('d.id');
            if ($device === null) {
                $equipment = DB::table('client_equipment')->insertGetId(['user_id' => $userId, 'name' => $name,
                    'subcategory_id' => DB::table('subcategories')->where('code', $code)->value('id'), 'brand' => $brand, 'model' => $model,
                    'year' => $year, 'address_id' => $address, 'notes' => $notes, 'is_demo' => true]);
                $device = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => $sensor, 'metric' => $metric,
                    'unit' => IotMonitor::METRICS[$metric]['unit'], 'target' => $target, 'tolerance' => $tolerance, 'battery' => 86,
                    'maintenance_every_days' => $maintenance, 'last_maintenance_at' => $now->subDays($maintenanceDaysAgo)]);
            }
            $this->readings((int) $device, $target, $tolerance, $notes !== null, $now);
        }
        $this->monitor->maintenance($now);
        $marker = 'Servicio de ejemplo para mostrar la garantía (dato de demostración).';
        if (! DB::table('service_requests')->where('client_id', $clientId)->where('description', $marker)->exists()) {
            DB::table('service_requests')->insert(['client_id' => $clientId, 'subcategory_id' => DB::table('subcategories')->where('code', 'frio-vitrinas')->value('id'),
                'district_id' => $districtId, 'description' => $marker, 'address' => 'Av. Sintética 742, El Tambo', 'mode' => 'asap',
                'source' => 'automatic', 'status' => 'closed', 'rule_version_id' => $this->rules->currentVersionId(),
                'submitted_at' => $now->subDays(12), 'closed_at' => $now->subDays(10), 'search_generation' => 1, 'version' => 3]);
        }
    }

    /**
     * DEF-76: 25 lecturas horarias de las últimas 24 h, relativas a la hora de la siembra. Antes solo se sembraban al crear el
     * equipo y, días después, el panel quedaba sin lecturas. Se omiten las horas que ya tienen lectura (idempotente).
     */
    private function readings(int $device, float $target, float $tolerance, bool $drifts, CarbonImmutable $now): void
    {
        $taken = DB::table('iot_readings')->where('device_id', $device)->where('measured_at', '>=', $now->subHours(24))
            ->pluck('measured_at')->map(fn ($at) => CarbonImmutable::parse($at)->toDateTimeString())->flip();
        for ($hours = 24; $hours >= 0; $hours--) {
            $at = $now->subHours($hours);
            if ($taken->has($at->toDateTimeString())) {
                continue;
            }
            $value = IotSimulate::value((object) ['id' => $device, 'target' => $target, 'tolerance' => $tolerance, 'notes' => null], $at);
            // La congeladora demo sale de rango en la última hora, para que la demostración muestre una falla y su alerta.
            if ($drifts && $hours <= 1) {
                $value = round($target + $tolerance * ($hours === 1 ? 1.6 : 3.4), 2);
            }
            $this->monitor->record($device, $value, $at);
        }
    }
}
