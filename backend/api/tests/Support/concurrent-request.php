<?php

/*
| Proceso hijo de las pruebas de concurrencia del Sprint 4 (S04-TC-040, 045 y 046). Arranca Laravel contra la base
| del slot, actúa como el usuario indicado con el reloj del padre, avisa «ready» y espera la barrera GET_LOCK que
| sostiene el proceso padre. Al soltarla, los dos hijos envían su petición a la vez; los bloqueos de fila de MySQL
| deciden quién gana. Imprime el estado HTTP y el cuerpo en JSON. Solo para APP_ENV=testing.
*/

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

require __DIR__.'/../../vendor/autoload.php';

$spec = json_decode(base64_decode($argv[1] ?? ''), true, flags: JSON_THROW_ON_ERROR);
$app = require __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

if (! $app->environment('testing') || ! str_ends_with((string) config('database.connections.mysql.database'), '_testing')) {
    fwrite(STDERR, "Solo con APP_ENV=testing y una base _testing.\n");
    exit(2);
}

CarbonImmutable::setTestNow(CarbonImmutable::parse($spec['now']));
Illuminate\Support\Carbon::setTestNow(Illuminate\Support\Carbon::parse($spec['now']));

$request = Request::create($spec['uri'], $spec['method'], [], [], [], [
    'HTTP_ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json',
] + array_combine(array_map(fn ($h) => 'HTTP_'.strtoupper(str_replace('-', '_', $h)), array_keys($spec['headers'])), $spec['headers']),
    json_encode($spec['body'], JSON_THROW_ON_ERROR));
$app->instance('request', $request); // el guard de Sanctum se arma con la petición en curso
Sanctum::actingAs(User::query()->findOrFail($spec['user_id']));

fwrite(STDOUT, "ready\n");
fflush(STDOUT);
DB::select('SELECT GET_LOCK(?, 30)', [$spec['barrier']]);
DB::select('SELECT RELEASE_LOCK(?)', [$spec['barrier']]);

$response = $kernel->handle($request);

fwrite(STDOUT, json_encode(['status' => $response->getStatusCode(), 'body' => json_decode($response->getContent(), true)], JSON_THROW_ON_ERROR)."\n");
