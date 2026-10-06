<?php
namespace Tests;

use RuntimeException;

abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
    /**
     * Impide que la suite borre una base que no sea de pruebas.
     * Se ejecuta antes de RefreshDatabase, que recrea todas las tablas.
     */
    public function createApplication()
    {
        $app = parent::createApplication();
        $connection = $app['config']->get('database.default');
        $driver = $app['config']->get("database.connections.$connection.driver");
        $database = (string) $app['config']->get("database.connections.$connection.database");

        $esPrueba = $driver === 'sqlite'
            ? $database === ':memory:'
            : str_ends_with($database, '_testing');

        if (! $app->environment('testing') || ! $esPrueba) {
            throw new RuntimeException(
                "Pruebas detenidas: la conexión '$connection' apunta a '$database'. "
                ."Solo se permite una base terminada en _testing (o SQLite en memoria) con APP_ENV=testing."
            );
        }

        return $app;
    }
}
