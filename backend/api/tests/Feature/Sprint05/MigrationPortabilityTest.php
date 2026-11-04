<?php

// S05-TC-115 a 117 · DEF-53 y DEF-58: las migraciones corren en SQLite (base local) además de MySQL, la 000030 se recupera
// de un intento a medias y el down() de la 000027 se puede revertir en MySQL. Corren sobre una conexión SQLite en memoria
// aparte; la conexión por defecto sigue en la base _testing.
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

const S05_SQLITE = 'sqlite_migraciones';

beforeEach(function () {
    config(['database.connections.'.S05_SQLITE => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]]);
    DB::purge(S05_SQLITE);
    $this->defaultConnection = config('database.default');
});

afterEach(function () {
    DB::setDefaultConnection($this->defaultConnection);
    DB::purge(S05_SQLITE);
});

function s05Migrate(string $command = 'migrate', array $options = []): void
{
    Artisan::call($command, ['--database' => S05_SQLITE, '--force' => true] + $options);
}

function s05MigrationFiles(): array
{
    return array_map(fn (string $file) => basename($file, '.php'), glob(database_path('migrations/*.php')));
}

function s05AppliedMigrations(): array
{
    return DB::connection(S05_SQLITE)->table('migrations')->orderBy('id')->pluck('migration')->all();
}

/** Migraciones aplicadas desde la 000030 en adelante: las que hay que revertir para volver a su estado anterior. */
function s05StepsFrom000030(): int
{
    return count(array_filter(s05MigrationFiles(), fn (string $name) => $name >= '2026_10_28_000030_create_service_orders'));
}

it('S05-TC-115 todas las migraciones corren en SQLite y se revierten desde la 000030 [DEF-53]', function () {
    s05Migrate();

    expect(s05AppliedMigrations())->toBe(s05MigrationFiles())
        ->and(Schema::connection(S05_SQLITE)->hasTable('service_orders'))->toBeTrue()
        ->and(Schema::connection(S05_SQLITE)->hasColumn('service_requests', 'order_id'))->toBeTrue();

    s05Migrate('migrate:rollback', ['--step' => s05StepsFrom000030()]);

    expect(Schema::connection(S05_SQLITE)->hasTable('service_orders'))->toBeFalse()
        ->and(Schema::connection(S05_SQLITE)->hasColumn('service_requests', 'order_id'))->toBeFalse();
});

it('S05-TC-116 la migración 000030 se recupera si un intento anterior dejó service_orders a medias [DEF-53]', function () {
    s05Migrate();
    s05Migrate('migrate:rollback', ['--step' => s05StepsFrom000030()]);
    // Lo que dejaba el intento fallido en SQLite: la tabla creada, sin el resto y sin registrar la migración.
    Schema::connection(S05_SQLITE)->create('service_orders', function (Blueprint $table) {
        $table->id();
        $table->foreignId('client_id')->constrained('client_profiles')->restrictOnDelete();
        $table->unsignedTinyInteger('item_count');
        $table->dateTime('submitted_at');
        $table->timestamps();
        $table->index(['client_id', 'submitted_at']);
    });

    s05Migrate();

    $schema = Schema::connection(S05_SQLITE);
    expect(s05AppliedMigrations())->toBe(s05MigrationFiles())
        ->and($schema->hasColumns('service_requests', ['order_id', 'urgency', 'brand', 'model', 'address_reference', 'time_slot']))->toBeTrue()
        ->and($schema->hasTable('subcategory_symptoms'))->toBeTrue()
        ->and($schema->hasTable('request_symptoms'))->toBeTrue();
});

it('S05-TC-117 el down() de la migración 000027 se revierte y se vuelve a aplicar en la base de pruebas [DEF-58]', function () {
    $migration = require database_path('migrations/2026_10_26_000027_add_carousel_to_announcements.php');

    $migration->down();
    $reverted = ! Schema::hasColumn('announcement_audiences', 'position') && ! Schema::hasColumn('announcements', 'genially_url');
    $migration->up();

    expect($reverted)->toBeTrue()
        ->and(Schema::hasColumn('announcement_audiences', 'position'))->toBeTrue()
        ->and(Schema::hasColumn('announcements', 'genially_url'))->toBeTrue();
});
