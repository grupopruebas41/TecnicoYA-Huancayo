<?php

namespace Database\Seeders;

/**
 * Guarda común de los seeders E2E (DEF-44). Las cuentas sintéticas jamás se crean en la base de desarrollo o
 * producción: solo en las bases de los slots de prueba A y B (ver ENTORNO-PARALELO.md). Cada seeder la llama antes
 * de cualquier consulta, sin depender de que otro seeder la haya aplicado.
 */
final class E2EDatabaseGuard
{
    private const SLOT_DATABASES = ['tecnicoya_testing', 'tecnicoya_b_testing'];

    public static function ensureIsolated(): void
    {
        $connection = config('database.connections.mysql');
        $database = (string) $connection['database'];
        if (! str_ends_with($database, '_testing') || ! in_array($database, self::SLOT_DATABASES, true)) {
            throw new SeedingRefused("Siembra E2E rechazada: la base «{$database}» no es un slot de pruebas (*_testing).");
        }
        if (! app()->environment('testing') || config('database.default') !== 'mysql'
            || $connection['host'] !== '127.0.0.1' || $connection['username'] !== 'tecnicoya_test') {
            throw new SeedingRefused('Fixtures E2E permitidos solo en la base aislada.');
        }
    }
}
