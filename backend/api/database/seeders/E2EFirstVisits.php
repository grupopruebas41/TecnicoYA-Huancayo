<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;

/**
 * Cierre S4-S5: las cuentas E2E sembradas ya vieron la bienvenida y el tutorial (D-105, en users). Sin esto, la
 * bienvenida del cliente (Fase 5) y la del técnico (T5) tapaban la pantalla en las Cypress de S01 a S05. Las pruebas
 * de la primera visita usan cuentas propias: los clientes que cada prueba registra y e2e-technician-nuevo (S05).
 */
final class E2EFirstVisits
{
    public static function markSeen(): void
    {
        DB::table('users')->where('email', 'like', 'e2e-%')->whereNull('onboarding_completed_at')->update(['onboarding_completed_at' => now()]);
        DB::table('users')->where('email', 'like', 'e2e-%')->whereNull('tour_completed_at')->update(['tour_completed_at' => now()]);
    }
}
