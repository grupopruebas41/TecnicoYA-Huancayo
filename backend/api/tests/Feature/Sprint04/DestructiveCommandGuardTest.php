<?php

// S04-TC-120 a 126 · Transversal (entorno de pruebas) · DEF-45: con APP_ENV=testing, los comandos destructivos de
// base se niegan a ejecutar si la base no termina en _testing, antes de abrir la conexión, y nombran comando y base.
// La conexión de sondeo apunta a la base de desarrollo, a la que el usuario de pruebas no tiene acceso: sin la guarda
// el comando falla al conectar y no borra nada.
use App\Shared\Database\DestructiveCommandRefused;
use Database\Seeders\DistrictSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->default = config('database.default');
    config(['database.connections.guard_probe' => ['database' => 'tecnicoya'] + config('database.connections.mysql')]);
});

afterEach(function () {
    config(['database.default' => $this->default]);
    DB::purge('guard_probe');
});

/** Ejecuta el comando y devuelve la excepción de la guarda, o null si no la hubo. */
function runAgainstProbe(string $command, array $parameters = []): ?DestructiveCommandRefused
{
    try {
        Artisan::call($command, $parameters + ['--force' => true]);
    } catch (DestructiveCommandRefused $refused) {
        return $refused;
    }

    return null;
}

function expectRefusedBeforeConnecting(?DestructiveCommandRefused $refused, string $command): void
{
    expect($refused)->toBeInstanceOf(DestructiveCommandRefused::class)
        ->and($refused->getMessage())->toContain("«{$command}»")->toContain('«tecnicoya»')->toContain('_testing')
        ->and(array_key_exists('guard_probe', DB::getConnections()))->toBeFalse();
}

it('S04-TC-120 rechaza migrate:fresh contra una base sin _testing con APP_ENV=testing', function () {
    config(['database.default' => 'guard_probe']);

    expectRefusedBeforeConnecting(runAgainstProbe('migrate:fresh'), 'migrate:fresh');
});

it('S04-TC-121 rechaza migrate:refresh contra una base sin _testing', function () {
    config(['database.default' => 'guard_probe']);

    expectRefusedBeforeConnecting(runAgainstProbe('migrate:refresh'), 'migrate:refresh');
});

it('S04-TC-122 rechaza migrate:reset contra una base sin _testing', function () {
    config(['database.default' => 'guard_probe']);

    expectRefusedBeforeConnecting(runAgainstProbe('migrate:reset'), 'migrate:reset');
});

it('S04-TC-123 rechaza db:wipe contra una base sin _testing', function () {
    config(['database.default' => 'guard_probe']);

    expectRefusedBeforeConnecting(runAgainstProbe('db:wipe'), 'db:wipe');
});

it('S04-TC-124 rechaza db:seed contra una base sin _testing', function () {
    config(['database.default' => 'guard_probe']);

    expectRefusedBeforeConnecting(runAgainstProbe('db:seed', ['--class' => DistrictSeeder::class]), 'db:seed');
});

it('S04-TC-125 rechaza la opción --database que apunta a una base sin _testing', function () {
    expect(config('database.default'))->toBe('mysql');

    expectRefusedBeforeConnecting(runAgainstProbe('migrate:fresh', ['--database' => 'guard_probe']), 'migrate:fresh');
});

it('S04-TC-126 permite db:seed en la base _testing del slot', function () {
    expect(DB::connection()->getDatabaseName())->toEndWith('_testing');

    $refused = runAgainstProbe('db:seed', ['--class' => DistrictSeeder::class]);

    expect($refused)->toBeNull()
        ->and(DB::table('districts')->count())->toBeGreaterThan(0);
});
