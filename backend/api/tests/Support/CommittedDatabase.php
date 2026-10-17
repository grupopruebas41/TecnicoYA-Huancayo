<?php

namespace Tests\Support;

use Illuminate\Foundation\Testing\RefreshDatabaseState;

/**
 * Base sin transacción envolvente para las pruebas con procesos PHP reales (S04-TC-040, 045 y 046): los procesos
 * hijos solo ven datos confirmados. Al terminar se vuelve a migrar desde cero, así la siguiente prueba con
 * RefreshDatabase encuentra la base limpia y con las reglas sembradas por migración. No se usa DatabaseMigrations
 * porque su migrate:rollback falla cuando quedan solicitudes que apuntan a la versión 2 de reglas (clave foránea)
 * y deja la base a medias.
 */
trait CommittedDatabase
{
    public function setUpCommittedDatabase(): void
    {
        if (! RefreshDatabaseState::$migrated) {
            $this->artisan('migrate:fresh');
            RefreshDatabaseState::$migrated = true;
        }
        $this->beforeApplicationDestroyed(fn () => $this->artisan('migrate:fresh'));
    }
}
