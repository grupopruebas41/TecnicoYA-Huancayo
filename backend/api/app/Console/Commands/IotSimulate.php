<?php

namespace App\Console\Commands;

use App\Modules\Premium\IotMonitor;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Fase 6 (D-99): genera lecturas SIMULADAS y plausibles. Solo actúa sobre equipos de demostración (is_demo) o, con
 * IOT_SIMULATION=true, sobre todos. Es determinista para un instante dado (--at), así las pruebas usan un reloj fijo.
 * Los equipos demo con «falla» en las notas simulan una deriva que sale del rango para mostrar las alertas.
 */
final class IotSimulate extends Command
{
    protected $signature = 'tecnicoya:iot-simulate {--at= : Instante de la lectura (ISO 8601); por omisión, ahora}';

    protected $description = 'Genera lecturas simuladas de los sensores de demostración y evalúa sus alertas.';

    public function handle(IotMonitor $monitor): int
    {
        $at = $this->option('at') ? CarbonImmutable::parse($this->option('at')) : CarbonImmutable::now();
        $all = filter_var(config('tecnicoya.iot_simulation'), FILTER_VALIDATE_BOOLEAN);
        $devices = DB::table('iot_devices as d')->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')
            ->when(! $all, fn ($q) => $q->where('e.is_demo', true))
            ->get(['d.id', 'd.target', 'd.tolerance', 'e.notes']);
        foreach ($devices as $device) {
            $monitor->record($device->id, self::value($device, $at), $at);
        }
        $reminders = $monitor->maintenance($at);
        $this->info("Lecturas simuladas: {$devices->count()}; recordatorios nuevos: $reminders.");

        return self::SUCCESS;
    }

    /** Valor plausible: oscilación suave alrededor del objetivo; con «falla» en las notas, deriva fuera del rango en la tarde. */
    public static function value(object $device, CarbonImmutable $at): float
    {
        $target = (float) $device->target;
        $tolerance = (float) $device->tolerance;
        $hour = $at->setTimezone('America/Lima')->hour + $at->minute / 60;
        $wave = sin(($hour / 24) * 2 * M_PI + ($device->id % 7)) * $tolerance * 0.6;
        $drift = str_contains(mb_strtolower((string) $device->notes), 'falla') && $hour >= 12 && $hour < 18 ? $tolerance * 3.4 : 0;

        return round($target + $wave + $drift, 2);
    }
}
