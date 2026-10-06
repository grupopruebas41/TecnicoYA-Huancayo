<?php

namespace Tests;

use Illuminate\Foundation\Application;

abstract class Sprint01TestCase extends TestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        // Se ejecuta ANTES de que RefreshDatabase pueda recrear tablas.
        $connection = $app['config']->get('database.default');
        $settings = $app['config']->get("database.connections.{$connection}", []);
        if (!$app->environment('testing') || $connection !== 'mysql'
            || ($settings['host'] ?? null) !== 'mysql-test'
            || ($settings['database'] ?? null) !== 'tecnicoya_test'
            || ($settings['username'] ?? null) !== 'tecnicoya_test') {
            throw new \RuntimeException('Las pruebas requieren el MySQL aislado del Sprint 1.');
        }
        return $app;
    }
}
