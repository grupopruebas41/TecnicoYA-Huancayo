# Fase 0 · Reproducción de los dos errores del pedido y de Mis solicitudes

- **Fecha:** 2026-11-04. **Commit:** `37d93bc` (rama `feature/mayhuasca/cliente/pedido-multiple`, PR #42).
- **Base:** `tecnicoya_testing` (slot A) y una conexión SQLite `:memory:`. No se ejecutó artisan contra la base de desarrollo; `database/local.sqlite` se abrió solo en lectura, y solo su tabla `migrations`, su esquema y un conteo.
- **Prueba:** temporal, no versionada; su código va al final. La prueba en rojo definitiva es de la Fase 1.

## 1. Registro (`storage/logs/laravel.log`)

| Referencia | Endpoint | Clase | Mensaje | Archivo:línea de la aplicación |
|---|---|---|---|---|
| `35cabaef-…` | `POST /api/v1/orders` | `Illuminate\Database\QueryException` | `no such table: service_orders` (conexión sqlite, `database/local.sqlite`) | `ServiceOrders.php:61` |
| `f1709070-…` | `GET /api/v1/requests` | `ErrorException` | `Undefined property: stdClass::$order_id` | `ServiceRequestView.php:35` |

El mismo registro acumula 38 errores `no such table: subcategory_symptoms` (síntomas del asistente) y 40 de `$order_id`.

## 2. Estado de las migraciones en `database/local.sqlite` (solo lectura)

```text
aplicadas=29 archivos=30
pendientes: 2026_10_28_000030_create_service_orders
tablas service_orders y subcategory_symptoms: NO existen
service_requests: sin order_id, urgency, brand, model, address_reference ni time_slot
```

## 3. Reproducción sobre `tecnicoya_testing` (MySQL), sin la migración 000030

```text
excepción: Illuminate\Database\QueryException · SQLSTATE[42S02]: Base table or view not found: 1146 Table 'tecnicoya_testing.service_orders' doesn't exist · Connection.php:838
POST /orders → 500 INTERNAL_ERROR request_id=sí
excepción: ErrorException · Undefined property: stdClass::$order_id · ServiceRequestView.php:35
GET /requests → 500 INTERNAL_ERROR
```

## 4. La migración 000030 no se puede aplicar en SQLite

```text
SQLite → última aplicada: 2026_10_28_000029_create_search_keywords; service_orders existe: true
Illuminate\Database\QueryException: SQLSTATE[HY000]: General error: 1 near "CONSTRAINT": syntax error (SQL: ALTER TABLE service_orders ADD CONSTRAINT service_or...)
```

- Las líneas 23, 33 y 34 de la migración no llevan la guarda `DB::getDriverName() === 'mysql'` que usan las migraciones anteriores.
- `SQLiteGrammar` no ejecuta el esquema en transacción: un intento fallido deja `service_orders` creada y sin registrar, y el siguiente `migrate` fallaría con «table already exists».

## 5. Resultado de la corrida

Pest marcó las 3 pruebas temporales como fallidas (`Tests: 3 failed`), pero **no por sus aserciones**: los datos de arriba se imprimieron antes y los 500 se comprobaron. Falló el desmontaje de `DatabaseMigrations`, que ejecuta `migrate:rollback` completo:

```text
SQLSTATE[HY000]: General error: 1553 Cannot drop index 'announcement_audiences_role_id_position_index': needed in a foreign key constraint
```

Es un hallazgo aparte: el `down()` de la migración `000027` no se puede revertir en MySQL.

En una corrida anterior con `RefreshDatabase`, las pruebas de GET y de SQLite pasaron; la de POST falló por el SAVEPOINT que invalida el DDL de `sinMigracion000030()`, no por el producto.

## 6. Control con la migración aplicada

```text
✓ it S05-TC-088 un pedido de un rubro crea y envía una solicitud vinculada al pedido con la versión de reglas
✓ it S05-TC-101 Mis solicitudes y el detalle muestran el pedido, la urgencia, marca, modelo, síntomas y franja
Tests: 2 passed (22 assertions)
```

## 7. Conclusión

Los dos 500 tienen una sola causa: **la migración 000030 no está aplicada en la base local**. Además, **tampoco se puede aplicar**, porque su SQL es solo de MySQL. Las pruebas no lo detectaron porque corren sobre MySQL.

## Anexo · Código de la prueba temporal

```php
<?php

// Reproducción temporal de la Fase 0: NO se versiona (la prueba en rojo definitiva es de la Fase 1).
use App\Modules\BMatching\Jobs\PrepareMatching;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(Illuminate\Foundation\Testing\DatabaseMigrations::class);

function sinMigracion000030(): void
{
    Artisan::call('migrate:rollback', ['--step' => 1, '--force' => true]);
    expect(Schema::hasTable('service_orders'))->toBeFalse()->and(Schema::hasColumn('service_requests', 'order_id'))->toBeFalse();
}

it('reproduce el 500 de POST /orders sin la migración 000030', function () {
    Sprint04::boot($this);
    Queue::fake();
    $client = ClientProfileFactory::new()->create();
    Sanctum::actingAs($client->user);
    sinMigracion000030();

    $response = $this->postJson('/api/v1/orders', [
        'district_id' => Sprint04::district(), 'address' => 'Jirón sintético 742', 'mode' => 'asap', 'summary_confirmed' => true,
        'items' => [['subcategory_id' => Sprint04::subcategory('computo-hardware'), 'urgency' => 'normal',
            'description' => 'El equipo no enciende desde ayer por la tarde.']],
    ], ['Idempotency-Key' => (string) Str::uuid()]);

    $e = $response->exception;
    fwrite(STDERR, "\nexcepción: ".($e ? $e::class.' · '.Str::before($e->getMessage(), ' (Connection').' · '.basename($e->getFile()).':'.$e->getLine() : '-'));
    fwrite(STDERR, "\nPOST /orders → ".$response->status().' '.($response->json('error.code') ?? '').' request_id='.($response->json('meta.request_id') ? 'sí' : 'no')."\n");
    expect($response->status())->toBe(500);
});

it('reproduce el 500 de GET /requests sin la migración 000030', function () {
    Sprint04::boot($this);
    Queue::fake();
    $client = ClientProfileFactory::new()->create();
    Sanctum::actingAs($client->user);
    sinMigracion000030();
    // Una fila basta: el error está en la proyección de cada fila.
    DB::table('service_requests')->insert([
        'client_id' => $client->id, 'subcategory_id' => Sprint04::subcategory('computo-hardware'), 'district_id' => Sprint04::district(),
        'description' => 'El equipo no enciende desde ayer por la tarde.', 'address' => 'Jirón sintético 742', 'mode' => 'asap',
        'source' => 'automatic', 'status' => 'registered', 'currency' => 'PEN', 'version' => 1,
    ]);

    $response = $this->getJson('/api/v1/requests');

    $e = $response->exception;
    fwrite(STDERR, "\nexcepción: ".($e ? $e::class.' · '.$e->getMessage().' · '.basename($e->getFile()).':'.$e->getLine() : '-'));
    fwrite(STDERR, "\nGET /requests → ".$response->status().' '.($response->json('error.code') ?? '')."\n");
    expect($response->status())->toBe(500);
});

it('reproduce que artisan migrate falla en SQLite justo en la migración 000030', function () {
    config(['database.connections.sqlite_repro' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]]);
    $default = config('database.default');
    $message = null;
    try {
        Artisan::call('migrate', ['--database' => 'sqlite_repro', '--force' => true]);
    } catch (Throwable $e) {
        $message = $e::class.': '.Str::limit($e->getMessage(), 170);
    }
    DB::setDefaultConnection($default);
    $applied = DB::connection('sqlite_repro')->table('migrations')->orderByDesc('id')->value('migration');
    $exists = Schema::connection('sqlite_repro')->hasTable('service_orders');
    fwrite(STDERR, "\nSQLite → última aplicada: $applied; service_orders existe: ".var_export($exists, true)."\n$message\n");
    expect($message)->toContain('CONSTRAINT')->and($applied)->toBe('2026_10_28_000029_create_search_keywords');
});
```
