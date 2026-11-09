<?php

namespace App\Modules\BMatching\Application;

use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * D-101 (propuesta): «Disponible hoy» con la disponibilidad real. Cuenta una franja activa que todavía no termina:
 * - semanal: del día de la semana de hoy en Lima, vigente hoy (valid_from y valid_until) y con fin posterior a la hora local;
 * - puntual: que empieza antes de que termine el día local y termina después de ahora.
 * Las franjas se guardan en hora de Lima (S2); la pausa vigente ya la excluye la búsqueda (D-57).
 */
final class AvailableToday
{
    public const TIMEZONE = 'America/Lima';

    /** Consulta de franjas (alias «a») que cumplen la regla; se correlaciona con el técnico desde fuera. */
    public static function slots(DateTimeInterface $now): Builder
    {
        $local = CarbonImmutable::instance($now)->setTimezone(self::TIMEZONE);
        $date = $local->toDateString();
        $utc = fn (CarbonImmutable $moment) => $moment->utc()->format('Y-m-d H:i:s');

        return DB::table('availability_slots as a')->where('a.active', 1)
            ->where(fn (Builder $kind) => $kind
                ->where(fn (Builder $weekly) => $weekly->where('a.kind', 'weekly')->where('a.weekday', $local->dayOfWeekIso)
                    ->where('a.valid_from', '<=', $date)
                    ->where(fn (Builder $until) => $until->whereNull('a.valid_until')->orWhere('a.valid_until', '>=', $date))
                    ->where('a.local_end', '>', $local->format('H:i:s')))
                ->orWhere(fn (Builder $oneOff) => $oneOff->where('a.kind', 'one_off')
                    ->where('a.starts_at', '<', $utc($local->endOfDay()))->where('a.ends_at', '>', $utc($local))));
    }

    public static function for(int $technicianId, DateTimeInterface $now): bool
    {
        return self::slots($now)->where('a.technician_id', $technicianId)->exists();
    }
}
