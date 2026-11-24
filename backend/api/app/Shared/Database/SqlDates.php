<?php

namespace App\Shared\Database;

use Illuminate\Support\Facades\DB;

/**
 * DEF-83: expresiones de fecha que funcionan igual en MySQL (CI, E2E y producción) y en SQLite (base local de
 * desarrollo). Reciben solo nombres de columna fijos del código, nunca datos del usuario.
 */
final class SqlDates
{
    /** Segundos entre dos columnas de fecha y hora (de $from a $to). */
    public static function secondsBetween(string $from, string $to): string
    {
        return self::sqlite()
            ? "((julianday($to) - julianday($from)) * 86400)"
            : "TIMESTAMPDIFF(SECOND, $from, $to)";
    }

    /** Día de calendario (Y-m-d) de una columna en UTC desplazada $hours horas hacia atrás (Lima: 5). */
    public static function dayShifted(string $column, int $hours): string
    {
        return self::sqlite()
            ? "date($column, '-$hours hours')"
            : "DATE(DATE_SUB($column, INTERVAL $hours HOUR))";
    }

    private static function sqlite(): bool
    {
        return DB::connection()->getDriverName() === 'sqlite';
    }
}
