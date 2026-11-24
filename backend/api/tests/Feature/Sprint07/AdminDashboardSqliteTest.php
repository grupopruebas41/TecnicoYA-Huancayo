<?php

// S07-TC-190 a 192 · DEF-83: el Inicio (GET /admin/dashboard) y las Estadísticas (GET /admin/statistics) del administrador
// funcionan igual sobre SQLite (base local) que sobre MySQL (CI y E2E): nada de TIMESTAMPDIFF ni DATE_SUB. Corren sobre una
// conexión SQLite en memoria aparte, como S05-TC-115; la conexión por defecto se devuelve al terminar. Además, si una parte
// del Inicio falla, el resto responde (S07-TC-192). Datos sintéticos; el reloj se fija con travelTo.
use Carbon\CarbonImmutable;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

// Grupo «sqlite»: la CI lo corre en un paso propio (ci.yml) para que una consulta propia de MySQL no vuelva a pasar.
uses(RefreshDatabase::class)->group('sqlite');

const S07_SQLITE = 'sqlite_panel';

/** Base SQLite en memoria con todas las migraciones y la siembra de catálogo, como conexión por defecto. */
function s07UseSqlite(object $test): void
{
    $test->defaultConnection = config('database.default');
    config(['database.connections.'.S07_SQLITE => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]]);
    DB::purge(S07_SQLITE);
    Artisan::call('migrate', ['--database' => S07_SQLITE, '--force' => true]);
    DB::setDefaultConnection(S07_SQLITE);
    $test->seed([AuthorizationSeeder::class, CatalogSeeder::class, DistrictSeeder::class]);
}

/** Asignación primaria de una solicitud en el momento indicado. */
function s07SqliteAssign(object $request, DateTimeInterface $at): void
{
    DB::table('participations')->insert(['request_id' => $request->id, 'technician_id' => Sprint04::technician()->id, 'slot' => 'primary',
        'status' => 'assigned', 'reference_fee_snapshot' => '80.00', 'assigned_at' => $at]);
}

describe('Panel del administrador sobre SQLite', function () {
    beforeEach(function () {
        s07UseSqlite($this);
        $this->travelTo(CarbonImmutable::parse('2026-11-25 15:00:00', 'UTC'));
        Sprint01::actAsSpa($this);
        $this->admin = Sprint02::admin();
    });

    afterEach(function () {
        DB::setDefaultConnection($this->defaultConnection);
        DB::purge(S07_SQLITE);
    });

    it('S07-TC-190 el Inicio responde sobre SQLite con el tiempo medio de asignación y los días de Lima [DEF-83]', function () {
        expect(DB::connection()->getDriverName())->toBe('sqlite');
        $yesterday = CarbonImmutable::parse('2026-11-25 04:30:00', 'UTC'); // 23:30 del 24 en Lima
        foreach ([20, 40] as $minutes) {
            s07SqliteAssign(Sprint04::sentRequest(['status' => 'assigned', 'submitted_at' => $yesterday]), $yesterday->addMinutes($minutes));
        }
        Sprint04::sentRequest(['status' => 'cancelled', 'submitted_at' => $yesterday, 'cancelled_at' => $yesterday->addMinutes(5)]);

        $data = $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');

        $byDate = collect($data['series']['items'])->keyBy('date');
        expect($data['kpis']['avg_assignment_minutes'])->toBe(30)
            ->and($data['kpis']['requests_today'])->toBe(0)
            ->and($byDate['2026-11-24'])->toBe(['date' => '2026-11-24', 'created' => 3, 'assigned' => 1, 'cancelled' => 1, 'expired' => 0])
            ->and($byDate['2026-11-25']['assigned'])->toBe(1)
            ->and($data['failed_parts'])->toBe([])
            ->and(collect($data['tasks'])->pluck('key')->all())->toContain('low_performance');
    });

    it('S07-TC-191 las Estadísticas responden sobre SQLite con el tiempo medio de respuesta de las ofertas [DEF-83]', function () {
        $request = Sprint04::sentRequest(['submitted_at' => now()->subDay()]);
        $run = DB::table('matching_runs')->insertGetId(['request_id' => $request->id, 'search_generation' => 1, 'attempt_no' => 1,
            'run_trigger' => 'submission', 'rule_version_id' => $request->rule_version_id, 'algorithm_version' => 'test', 'status' => 'completed',
            'started_at' => now()->subDay()]);
        $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request->id, 'matching_run_id' => $run, 'search_generation' => 1,
            'round_no' => 1, 'kind' => 'automatic', 'status' => 'closed', 'opened_at' => now()->subDay(), 'expires_at' => now()->subDay()->addMinutes(10)]);
        DB::table('offers')->insert(['round_id' => $round, 'request_id' => $request->id, 'technician_id' => Sprint04::technician()->id,
            'status' => 'accepted', 'available_at' => now()->subDay(), 'expires_at' => now()->subDay()->addMinutes(10),
            'responded_at' => now()->subDay()->addMinutes(3), 'reference_fee_snapshot' => '80.00', 'created_at' => now()->subDay()]);

        $offers = $this->actingAs($this->admin)->getJson('/api/v1/admin/statistics?days=7')->assertOk()->json('data.offers');

        expect($offers['avg_response_seconds'])->toBe(180)->and($offers['accepted'])->toBe(1);
    });
});

it('S07-TC-192 si una parte del Inicio falla, las demás responden y la parte fallida se informa con su referencia en el registro', function () {
    Sprint04::boot($this);
    $this->travelTo(CarbonImmutable::parse('2026-11-25 15:00:00', 'UTC'));
    Sanctum::actingAs(Sprint02::admin());
    // Falla sintética solo en las tareas: la consulta de búsquedas sin resultado (keyword_misses) la usa únicamente esa parte.
    DB::listen(function ($query) {
        if (str_contains($query->sql, 'keyword_misses')) {
            throw new RuntimeException('Falla sintética de las tareas.');
        }
    });

    $data = $this->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');

    expect($data['tasks'])->toBeNull()
        ->and($data['failed_parts'])->toBe(['tasks'])
        ->and($data['kpis'])->toBeArray()->toHaveKey('requests_today')
        ->and($data['series']['items'])->toHaveCount(30)
        ->and($data['badges'])->toBeArray();
});
