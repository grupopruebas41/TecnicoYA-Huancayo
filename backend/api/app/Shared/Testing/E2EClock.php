<?php

namespace App\Shared\Testing;

use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;

/**
 * Reloj del servidor para Cypress (contrato S4 §9, tarea serverClock). Solo se activa con TECNICOYA_E2E_CLOCK=1, que
 * pone el arrancador E2E, con APP_ENV=testing y la base de un slot (*_testing). Guarda un desfase en segundos por
 * base y todos los procesos del slot (API, cola, scheduler) lo leen en cada now(), así un desfase nuevo vale también
 * para la cola que ya está corriendo. Pest nunca lo activa: usa travel y travelTo.
 */
final class E2EClock
{
    public static function enabled(): bool
    {
        return getenv('TECNICOYA_E2E_CLOCK') === '1' && app()->environment('testing')
            && str_ends_with((string) config('database.connections.mysql.database'), '_testing');
    }

    public static function file(): string
    {
        return storage_path('framework/e2e-clock-'.config('database.connections.mysql.database').'.json');
    }

    public static function offset(): int
    {
        $file = self::file();
        clearstatcache(true, $file);

        return is_file($file) ? (int) (json_decode((string) file_get_contents($file), true)['offset_seconds'] ?? 0) : 0;
    }

    /** '+10m', '+90s', '-1h' se suman al desfase actual; 'reset' lo vuelve a 0. Devuelve el desfase nuevo. */
    public static function shift(string $change): int
    {
        if ($change === 'reset') {
            $offset = 0;
        } elseif (preg_match('/^([+-])(\d+)([smh])$/', $change, $match) === 1) {
            $offset = self::offset() + ($match[1] === '-' ? -1 : 1) * (int) $match[2] * ['s' => 1, 'm' => 60, 'h' => 3600][$match[3]];
        } else {
            throw new \InvalidArgumentException('Desfase inválido: use +10m, +90s, -1h o reset.');
        }
        file_put_contents(self::file(), json_encode(['offset_seconds' => $offset], JSON_THROW_ON_ERROR));

        return $offset;
    }

    /** Hace que now() devuelva la hora real más el desfase vigente, leído en cada llamada. */
    public static function install(): void
    {
        // Carbon llama al closure con la hora real en cada now(); en Carbon 3 el reloj de prueba es común a
        // Carbon y CarbonImmutable.
        Carbon::setTestNow(fn (CarbonImmutable $real) => $real->addSeconds(self::offset()));
    }
}
