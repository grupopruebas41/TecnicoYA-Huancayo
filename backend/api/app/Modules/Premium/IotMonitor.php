<?php

namespace App\Modules\Premium;

use App\Modules\CNotifications\Application\Inbox;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Fase 6 (D-99): lecturas SIMULADAS de los sensores y sus alertas. Una lectura está:
 * - normal si |valor − objetivo| ≤ tolerancia (justo en el borde sigue normal);
 * - en atención si se aleja hasta el doble de la tolerancia;
 * - en falla si se aleja más.
 * Al salir del rango se abre una alerta (una por dispositivo hasta volver al rango) con su aviso en la campana; al volver
 * se cierra. El recordatorio de mantenimiento se abre cuando vence el plazo desde el último mantenimiento.
 */
final class IotMonitor
{
    public const METRICS = [
        'temperature' => ['label' => 'Temperatura', 'unit' => '°C'],
        'power' => ['label' => 'Consumo eléctrico', 'unit' => 'W'],
        'vibration' => ['label' => 'Vibración', 'unit' => 'mm/s'],
        'hours' => ['label' => 'Horas de uso', 'unit' => 'h'],
    ];

    public function __construct(private readonly Inbox $inbox) {}

    public static function status(object $device, ?float $value): string
    {
        if ($value === null || ! $device->online) {
            return 'failure';
        }
        $gap = abs($value - (float) $device->target);
        $tolerance = (float) $device->tolerance;

        return $gap <= $tolerance ? 'normal' : ($gap <= 2 * $tolerance ? 'attention' : 'failure');
    }

    public static function number(float $value): string
    {
        return str_replace('.', ',', rtrim(rtrim(number_format($value, 1, '.', ''), '0'), '.'));
    }

    public static function threshold(object $device): string
    {
        return self::number((float) $device->target).' '.$device->unit.' ± '.self::number((float) $device->tolerance);
    }

    public function record(int $deviceId, float $value, CarbonImmutable $at): void
    {
        DB::transaction(function () use ($deviceId, $value, $at) {
            $device = DB::table('iot_devices as d')->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')
                ->where('d.id', $deviceId)->lockForUpdate()->first(['d.*', 'e.user_id', 'e.name as equipment']);
            DB::table('iot_readings')->insert(['device_id' => $deviceId, 'value' => $value, 'measured_at' => $at]);
            $status = self::status($device, $value);
            $open = DB::table('iot_alerts')->where('device_id', $deviceId)->where('kind', 'threshold')->whereNull('resolved_at')->first();
            if ($status === 'normal') {
                if ($open) {
                    DB::table('iot_alerts')->where('id', $open->id)->update(['resolved_at' => $at]);
                }

                return;
            }
            if ($open) {
                if ($open->severity === 'attention' && $status === 'failure') {
                    DB::table('iot_alerts')->where('id', $open->id)->update(['severity' => 'failure', 'value' => $value]);
                }

                return;
            }
            $label = self::METRICS[$device->metric]['label'];
            $message = "$label de {$device->equipment} en ".self::number($value)." {$device->unit} (rango ".self::threshold($device).')';
            $this->open($device, 'threshold', $status, $message, $value, $at);
        });
    }

    /** Recordatorio de mantenimiento: uno abierto por dispositivo cuando vence el plazo. */
    public function maintenance(CarbonImmutable $now): int
    {
        $created = 0;
        $devices = DB::table('iot_devices as d')->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')
            ->whereNotNull('d.last_maintenance_at')->get(['d.*', 'e.user_id', 'e.name as equipment']);
        foreach ($devices as $device) {
            $due = CarbonImmutable::parse($device->last_maintenance_at)->addDays((int) $device->maintenance_every_days);
            $open = DB::table('iot_alerts')->where('device_id', $device->id)->where('kind', 'maintenance')->whereNull('resolved_at')->exists();
            if ($now->gte($due) && ! $open) {
                $this->open($device, 'maintenance', 'info', "Toca el mantenimiento preventivo de {$device->equipment} (cada {$device->maintenance_every_days} días)", null, $now);
                $created++;
            }
        }

        return $created;
    }

    private function open(object $device, string $kind, string $severity, string $message, ?float $value, CarbonImmutable $at): void
    {
        $id = DB::table('iot_alerts')->insertGetId(['device_id' => $device->id, 'user_id' => $device->user_id, 'kind' => $kind,
            'severity' => $severity, 'message' => $message, 'value' => $value, 'started_at' => $at]);
        $title = $kind === 'maintenance' ? 'Recordatorio de mantenimiento' : ($severity === 'failure' ? 'Falla en un equipo' : 'Atención en un equipo');
        $this->inbox->notify((int) $device->user_id, 'iot.alert', $title, $message, 'iot_alert', $id);
    }
}
