<?php

use Illuminate\Support\Facades\DB;

// Dado MySQL accesible, cuando consulto salud, entonces obtengo 200 sin secretos.
it('responde con estado disponible', function () {
    DB::shouldReceive('select')->once()->with('SELECT 1')->andReturn([]);
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertExactJson(['status' => 'ok', 'database' => 'up']);
});

// Dado MySQL caído, cuando consulto salud, entonces obtengo 503 sin la excepción.
it('oculta los detalles del fallo de base de datos', function () {
    DB::shouldReceive('select')->once()->with('SELECT 1')
        ->andThrow(new RuntimeException('detalle interno que no debe publicarse'));
    $this->getJson('/api/v1/health')
        ->assertStatus(503)
        ->assertExactJson(['status' => 'degraded', 'database' => 'down']);
});
