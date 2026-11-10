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
        foreach (self::EQUIPMENT as [$name, $code, $brand, $model, $year, $metric, $sensor, $target, $tolerance, $notes, $maintenanceDaysAgo]) {
            if (DB::table('client_equipment')->where('user_id', $userId)->where('name', $name)->exists()) {
                continue;
            }
            $equipment = DB::table('client_equipment')->insertGetId(['user_id' => $userId, 'name' => $name,
                'subcategory_id' => DB::table('subcategories')->where('code', $code)->value('id'), 'brand' => $brand, 'model' => $model,
                'year' => $year, 'address_id' => $address, 'notes' => $notes, 'is_demo' => true]);
            $device = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => $sensor, 'metric' => $metric,
                'unit' => IotMonitor::METRICS[$metric]['unit'], 'target' => $target, 'tolerance' => $tolerance, 'battery' => 86,
                'maintenance_every_days' => 180, 'last_maintenance_at' => $now->subDays($maintenanceDaysAgo)]);
            for ($hours = 24; $hours >= 0; $hours--) {
                $at = $now->subHours($hours);
                $this->monitor->record($device, IotSimulate::value((object) ['id' => $device, 'target' => $target, 'tolerance' => $tolerance, 'notes' => $notes], $at), $at);
            }
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
}
