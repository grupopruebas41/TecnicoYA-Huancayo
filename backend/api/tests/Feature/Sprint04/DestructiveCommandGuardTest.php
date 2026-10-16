<?php

// S04-TC-120 a 127 · Transversal (entorno de pruebas) · DEF-45: con APP_ENV=testing, los comandos destructivos de
// base se niegan a ejecutar si la base no termina en _testing, antes de abrir la conexión, y nombran comando y base.
// Cada caso repite el incidente: un `php artisan` lanzado a mano en otro proceso, sin tests/bootstrap.php. La base
// tecnicoya no es accesible para el usuario de pruebas, así que sin la guarda el comando falla al conectar y no borra nada.
use App\Shared\Database\DestructiveCommandGuard;
use App\Shared\Database\DestructiveCommandRefused;
use Symfony\Component\Process\Process;

/** Lanza artisan en un proceso aparte con las variables indicadas (null quita la heredada). */
function artisanProcess(array $arguments, array $env): Process
{
    $process = new Process([PHP_BINARY, 'artisan', ...$arguments, '--force', '--no-interaction', '--no-ansi'],
        // COLUMNS fijo: la consola parte el mensaje según el ancho de la terminal (80 en la CI) y cortaría «tecnicoya».
        base_path(), $env + ['DB_USERNAME' => 'tecnicoya_test', 'DB_HOST' => '127.0.0.1', 'TECNICOYA_SLOT' => null, 'COLUMNS' => '1000']);
    $process->run();

    return $process;
}

function expectRefusedBeforeConnecting(Process $process, string $command, string $database = 'tecnicoya'): void
{
    $output = $process->getOutput().$process->getErrorOutput();
    expect($process->getExitCode())->not->toBe(0)
        ->and($output)->toContain("Comando «{$command}» rechazado")->toContain("«{$database}»")->toContain('_testing')
        ->and($output)->not->toContain('SQLSTATE');
}

it('S04-TC-120 rechaza migrate:fresh con --env=testing y la base por defecto tecnicoya', function () {
    $process = artisanProcess(['migrate:fresh', '--env=testing'], ['APP_ENV' => null, 'DB_DATABASE' => 'tecnicoya']);

    expectRefusedBeforeConnecting($process, 'migrate:fresh');
});

it('S04-TC-121 rechaza migrate:refresh contra una base sin _testing', function () {
    $process = artisanProcess(['migrate:refresh'], ['APP_ENV' => 'testing', 'DB_DATABASE' => 'tecnicoya']);

    expectRefusedBeforeConnecting($process, 'migrate:refresh');
});

it('S04-TC-122 rechaza migrate:reset contra una base sin _testing', function () {
    $process = artisanProcess(['migrate:reset'], ['APP_ENV' => 'testing', 'DB_DATABASE' => 'tecnicoya']);

    expectRefusedBeforeConnecting($process, 'migrate:reset');
});

it('S04-TC-123 rechaza db:wipe contra una base sin _testing', function () {
    $process = artisanProcess(['db:wipe'], ['APP_ENV' => 'testing', 'DB_DATABASE' => 'tecnicoya']);

    expectRefusedBeforeConnecting($process, 'db:wipe');
});

it('S04-TC-124 rechaza db:seed contra una base sin _testing', function () {
    $process = artisanProcess(['db:seed', '--class=Database\\Seeders\\DistrictSeeder'], ['APP_ENV' => 'testing', 'DB_DATABASE' => 'tecnicoya']);

    expectRefusedBeforeConnecting($process, 'db:seed');
});

it('S04-TC-125 rechaza la opción --database que apunta a una base sin _testing', function () {
    // La conexión por defecto es la del slot; la pedida con --database (pgsql, DB_NAME) apunta a tecnicoya.
    $process = artisanProcess(['migrate:fresh', '--database=pgsql'],
        ['APP_ENV' => 'testing', 'DB_DATABASE' => 'tecnicoya_testing', 'DB_NAME' => 'tecnicoya']);

    expectRefusedBeforeConnecting($process, 'migrate:fresh');
});

it('S04-TC-127 tabla de decisión de la guarda dentro del proceso (entorno, comando, conexión y driver)', function () {
    $guard = new DestructiveCommandGuard;
    config(['database.connections.probe' => ['driver' => 'mysql', 'database' => 'tecnicoya'],
        'database.connections.memory' => ['driver' => 'sqlite', 'database' => ':memory:'],
        'database.connections.sqlite_file' => ['driver' => 'sqlite', 'database' => 'tecnicoya_testing.sqlite']]);
    $refused = function (string $command, ?string $connection) use ($guard): ?string {
        try {
            $guard->check($command, $connection);
        } catch (DestructiveCommandRefused $exception) {
            return $exception->getMessage();
        }

        return null;
    };

    foreach (['migrate:fresh', 'migrate:refresh', 'migrate:reset', 'db:wipe', 'db:seed'] as $command) {
        expect($refused($command, 'probe'))->toContain("«{$command}»")->toContain('«tecnicoya»');
    }
    expect($refused('db:wipe', 'probe'))->toContain('«db:wipe»')->toContain('«tecnicoya»')
        ->and($refused('migrate', 'probe'))->toBeNull()          // no destructivo
        ->and($refused('migrate:status', 'probe'))->toBeNull()
        ->and($refused('db:seed', null))->toBeNull()              // conexión por defecto del slot (_testing)
        ->and($refused('migrate:fresh', 'memory'))->toBeNull()    // SQLite en memoria
        ->and($refused('migrate:fresh', 'sqlite_file'))->toContain('«tecnicoya_testing.sqlite»');

    app()->detectEnvironment(fn () => 'local');
    expect($refused('db:wipe', 'probe'))->toBeNull();            // la guarda es solo para APP_ENV=testing
    app()->detectEnvironment(fn () => 'testing');
});

it('S04-TC-126 permite db:seed en la base _testing del slot', function () {
    $process = artisanProcess(['db:seed', '--class=Database\\Seeders\\DistrictSeeder'],
        ['APP_ENV' => 'testing', 'DB_DATABASE' => getenv('DB_DATABASE')]);

    expect(getenv('DB_DATABASE'))->toEndWith('_testing')
        ->and($process->getExitCode())->toBe(0)
        ->and($process->getOutput())->not->toContain('rechazado');
});
