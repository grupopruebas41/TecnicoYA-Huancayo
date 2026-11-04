<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Datos E2E del adelanto del Sprint 5 (panel del cliente): por ahora, los mismos del Sprint 4. e2e-client no tiene solicitudes
 * y e2e-client-limit tiene 3 activas, que cuentan como 3 pedidos (D-95). Datos sintéticos.
 */
final class Sprint05E2ESeeder extends Seeder
{
    public function run(): void
    {
        E2EDatabaseGuard::ensureIsolated();
        $this->call(Sprint04E2ESeeder::class);
    }
}
