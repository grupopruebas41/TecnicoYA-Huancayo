<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Datos base de cualquier entorno (`php artisan db:seed`): roles y permisos, catálogo inicial y distritos de D-15
 * con sus distancias de D-64. Todos los seeders llamados son idempotentes y no pisan cambios del administrador.
 * No crea cuentas: los administradores se dan de alta con `tecnicoya:provision-admin` y los datos E2E con los
 * seeders SprintNNE2ESeeder del arrancador.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([AuthorizationSeeder::class, CatalogSeeder::class, DistrictSeeder::class]);
    }
}
