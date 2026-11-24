<?php

// S07-TC-209 · DEF-83 en la Fase A3: Solicitudes (detalle, cancelar y reenviar), el CSV, el tablero en vivo y las alertas
// operativas responden igual sobre SQLite (base local) que sobre MySQL. Conexión SQLite en memoria aparte (como S07-TC-190);
// la ronda y las ofertas se arman a mano para no depender del matcher. Grupo «sqlite»: corre en su paso propio de la CI.
use App\Modules\BMatching\Jobs\PrepareMatching;
use Carbon\CarbonImmutable;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class)->group('sqlite');

const S07A3_SQLITE = 'sqlite_operacion';

beforeEach(function () {
    $this->defaultConnection = config('database.default');
    config(['database.connections.'.S07A3_SQLITE => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]]);
    DB::purge(S07A3_SQLITE);
    Artisan::call('migrate', ['--database' => S07A3_SQLITE, '--force' => true]);
    DB::setDefaultConnection(S07A3_SQLITE);
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class, DistrictSeeder::class]);
    $this->travelTo(CarbonImmutable::parse('2026-11-25 15:00:00', 'UTC'));
    Sprint01::actAsSpa($this);
});

afterEach(function () {
    DB::setDefaultConnection($this->defaultConnection);
    DB::purge(S07A3_SQLITE);
});

/** Solicitud enviada hace $minutes minutos con una ronda abierta y una oferta pendiente que vence en 8 minutos. */
function s07a3SqliteSearching(int $minutes): object
{
    $request = Sprint04::sentRequest(['submitted_at' => now()->subMinutes($minutes)]);
    $run = DB::table('matching_runs')->insertGetId(['request_id' => $request->id, 'search_generation' => 1, 'attempt_no' => 1,
        'run_trigger' => 'submission', 'rule_version_id' => $request->rule_version_id, 'algorithm_version' => 'test', 'status' => 'completed',
        'started_at' => now()->subMinutes(2)]);
    $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request->id, 'matching_run_id' => $run, 'search_generation' => 1,
        'round_no' => 1, 'kind' => 'automatic', 'status' => 'open', 'opened_at' => now()->subMinutes(2), 'expires_at' => now()->addMinutes(8)]);
    DB::table('offers')->insert(['round_id' => $round, 'request_id' => $request->id, 'technician_id' => Sprint04::technician()->id,
        'status' => 'pending', 'available_at' => now()->subMinutes(2), 'expires_at' => now()->addMinutes(8), 'reference_fee_snapshot' => '80.00']);

    return DB::table('service_requests')->find($request->id);
}

it('S07-TC-209 Solicitudes, intervención, CSV, tablero en vivo y alertas responden sobre SQLite [DEF-83]', function () {
    expect(DB::connection()->getDriverName())->toBe('sqlite');
    Queue::fake();
    $admin = Sprint02::admin();
    $this->actingAs($admin);
    $old = s07a3SqliteSearching(45);
    $other = s07a3SqliteSearching(5);

    expect($this->getJson("/api/v1/admin/requests/{$old->id}")->assertOk()->json('data.offer_list'))->toHaveCount(1);
    $live = $this->getJson('/api/v1/admin/matching/live')->assertOk()->json('data');
    expect(collect($live['searching'])->pluck('id')->all())->toEqualCanonicalizing([(int) $old->id, (int) $other->id]);
    $alerts = $this->getJson('/api/v1/admin/alerts')->assertOk()->json('data.items');
    expect(collect($alerts)->pluck('request_id')->all())->toBe([(int) $old->id]);
    expect($this->get('/api/v1/admin/requests/export')->assertOk()->streamedContent())->toContain((string) $old->id);

    $this->withHeader('Idempotency-Key', (string) Str::uuid())->postJson("/api/v1/admin/requests/{$old->id}/rematch",
        ['reason' => 'Reenvío sintético para la prueba.', 'expected_version' => (int) $old->version])->assertOk();
    Queue::assertPushed(PrepareMatching::class);
    $this->withHeader('Idempotency-Key', (string) Str::uuid())->postJson("/api/v1/admin/requests/{$other->id}/cancellation",
        ['reason' => 'Cancelación sintética para la prueba.', 'expected_version' => (int) $other->version])->assertOk()
        ->assertJsonPath('data.status', 'cancelled');
});

it('S07-TC-229 el tablero sin pendientes vencidos, las alertas con nivel y desempeño bajo y el motivo en la línea de tiempo responden sobre SQLite [DEF-83]', function () {
    expect(DB::connection()->getDriverName())->toBe('sqlite');
    Queue::fake();
    $this->actingAs(Sprint02::admin());
    $searching = s07a3SqliteSearching(26 * 60);
    $overdue = Sprint04::sentRequest(['status' => 'pending_availability', 'pending_since' => now()->subDay()->subMinutes(5),
        'pending_expires_at' => now()->subMinutes(5)]);
    $weak = Sprint04::technician();
    foreach (['accepted', 'expired', 'expired', 'expired', 'rejected'] as $index => $status) {
        $request = Sprint04::sentRequest(['status' => 'expired']);
        $run = DB::table('matching_runs')->insertGetId(['request_id' => $request->id, 'search_generation' => 1, 'attempt_no' => 1,
            'run_trigger' => 'submission', 'rule_version_id' => $request->rule_version_id, 'algorithm_version' => 'test', 'status' => 'completed',
            'started_at' => now()->subDays($index + 1)]);
        $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request->id, 'matching_run_id' => $run, 'search_generation' => 1,
            'round_no' => 1, 'kind' => 'automatic', 'status' => 'closed', 'opened_at' => now()->subDays($index + 1), 'expires_at' => now()->subDays($index + 1)->addMinutes(10)]);
        DB::table('offers')->insert(['round_id' => $round, 'request_id' => $request->id, 'technician_id' => $weak->id, 'status' => $status,
            'available_at' => now()->subDays($index + 1), 'expires_at' => now()->subDays($index + 1)->addMinutes(10), 'reference_fee_snapshot' => '80.00']);
    }

    $live = $this->getJson('/api/v1/admin/matching/live')->assertOk()->json('data');
    expect($live['pending'])->toBe([])
        ->and(collect($live['pending_overdue'])->pluck('id')->all())->toBe([(int) $overdue->id])
        ->and(collect($live['searching'])->firstWhere('id', $searching->id)['round'])->toMatchArray(['open_count' => 1, 'expired_count' => 0]);
    $alerts = collect($this->getJson('/api/v1/admin/alerts')->assertOk()->json('data.items'));
    expect($alerts->first(fn ($item) => $item['type'] === 'unassigned' && $item['request_id'] === (int) $searching->id)['level'])->toBe('urgent')
        ->and($alerts->firstWhere('type', 'low_performance'))->toMatchArray(['level' => 'follow_up', 'offers' => 5, 'expired' => 3]);

    $this->withHeader('Idempotency-Key', (string) Str::uuid())->postJson("/api/v1/admin/requests/{$searching->id}/rematch",
        ['reason' => 'Reenvío sintético para la prueba.', 'expected_version' => (int) $searching->version])->assertOk();
    $timeline = collect($this->getJson("/api/v1/admin/requests/{$searching->id}")->assertOk()->json('data.timeline'));
    expect($timeline->firstWhere('event_type', 'request.admin_rematched')['reason'])->toBe('Reenvío sintético para la prueba.');
});
