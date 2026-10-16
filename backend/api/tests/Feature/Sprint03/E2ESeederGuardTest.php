<?php

// S03-TC-082 a 085 · Transversal (datos de prueba) · DEF-44: cada seeder E2E se niega a ejecutar fuera de una base
// _testing de los slots A o B, antes de cualquier consulta, y nombra la base rechazada en el mensaje.
use Database\Seeders\SeedingRefused;
use Database\Seeders\Sprint01E2ESeeder;
use Database\Seeders\Sprint02E2ESeeder;
use Database\Seeders\Sprint03E2ESeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->password = str_repeat('s', 32);
    putenv("TECNICOYA_E2E_PASSWORD={$this->password}");
    $_ENV['TECNICOYA_E2E_PASSWORD'] = $_SERVER['TECNICOYA_E2E_PASSWORD'] = $this->password;
    Storage::fake('local');
});

afterEach(function () {
    putenv('TECNICOYA_E2E_PASSWORD');
    unset($_ENV['TECNICOYA_E2E_PASSWORD'], $_SERVER['TECNICOYA_E2E_PASSWORD']);
});

/** Ejecuta el seeder con otra base configurada y devuelve la excepción y las consultas emitidas. */
function seedAgainst(string $seeder, string $database): array
{
    config(['database.connections.mysql.database' => $database]);
    $queries = 0;
    DB::listen(function () use (&$queries) {
        $queries++;
    });
    $refused = null;
    try {
        (new $seeder)->setContainer(app())->__invoke();
    } catch (SeedingRefused $exception) {
        $refused = $exception;
    }

    return [$refused, $queries];
}

it('S03-TC-082 Sprint01E2ESeeder rechaza la base de desarrollo «tecnicoya» sin consultar', function () {
    [$refused, $queries] = seedAgainst(Sprint01E2ESeeder::class, 'tecnicoya');

    expect($refused)->not->toBeNull()
        ->and($refused->getMessage())->toBe('Siembra E2E rechazada: la base «tecnicoya» no es un slot de pruebas (*_testing).')
        ->and($queries)->toBe(0);
    config(['database.connections.mysql.database' => 'tecnicoya_testing']);
    expect(DB::table('users')->where('email', 'like', 'e2e-%')->count())->toBe(0);
});

it('S03-TC-083 Sprint02E2ESeeder rechaza una base cuyo nombre solo contiene _testing', function () {
    [$refused, $queries] = seedAgainst(Sprint02E2ESeeder::class, 'tecnicoya_testing_copia');

    expect($refused?->getMessage())->toBe('Siembra E2E rechazada: la base «tecnicoya_testing_copia» no es un slot de pruebas (*_testing).')
        ->and($queries)->toBe(0)
        ->and(Storage::disk('local')->allFiles())->toBe([]);
});

it('S03-TC-084 Sprint03E2ESeeder rechaza una base _testing que no es de los slots A o B', function () {
    [$refused, $queries] = seedAgainst(Sprint03E2ESeeder::class, 'otra_testing');

    expect($refused?->getMessage())->toBe('Siembra E2E rechazada: la base «otra_testing» no es un slot de pruebas (*_testing).')
        ->and($queries)->toBe(0)
        ->and(Storage::disk('local')->allFiles())->toBe([]);
});

it('S03-TC-085 Sprint03E2ESeeder siembra en el slot de pruebas y es idempotente', function () {
    // La CI usa tecnicoya_ci_testing, que la guarda rechaza con razón (no es un slot). La guarda solo lee la
    // configuración: se le presenta el nombre del slot A y la conexión ya abierta sigue en la base real de
    // pruebas, cuyas escrituras revierte RefreshDatabase.
    expect(DB::connection()->getDatabaseName())->toEndWith('_testing');
    config(['database.connections.mysql.database' => 'tecnicoya_testing']);

    $this->seed(Sprint03E2ESeeder::class);
    $this->seed(Sprint03E2ESeeder::class);

    $limit = DB::table('users')->where('email', 'e2e-client-limit@example.test')->sole();
    $clientId = DB::table('client_profiles')->where('user_id', $limit->id)->value('id');
    expect(DB::table('service_requests')->where('client_id', $clientId)->pluck('status')->all())->toBe(['sent', 'sent', 'sent'])
        ->and(DB::table('users')->where('email', 'like', 'e2e-%@example.test')->count())->toBe(10)
        ->and(DB::table('technician_pauses')->count())->toBe(1);
});
