<?php

// S05-TC-407 a 414 · Revisión del #66 (Pimentel, 2026-11-22): límite de 3 pedidos activos (D-95) con una sola regla por
// estado (DEF-80), solicitudes desde una alerta de falla fuera del límite (D-113), demo con cupo libre y «Responde en ~N min»
// en el perfil público (D-114, CLI-09 opción A). Datos sintéticos.
use App\Modules\ARequests\Application\ActiveOrders;
use App\Modules\ARequests\Application\ClientRequestBoard;
use App\Modules\Premium\IotMonitor;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

// Estados guardados (chk_requests_status); «matching», «awaiting_*» y «direct_declined» son fases de la búsqueda de una solicitud «sent».
const S05_LIVE = ['sent', 'pending_availability', 'assigned', 'in_progress'];
const S05_ENDED = ['registered', 'completed', 'closed', 'unrated', 'cancelled', 'expired'];

beforeEach(function () {
    Sprint04::boot($this);
    $this->profile = ClientProfileFactory::new()->create(['district_id' => Sprint04::district(), 'default_address' => 'Jr. Sintético 742', 'plan' => 'premium']);
    $this->user = $this->profile->user;
    Sanctum::actingAs($this->user);
});

/** Solicitud del cliente con el estado dado; las terminadas, a propósito sin closed_at ni cancelled_at (como la demo). */
function s05Request(object $test, string $status, array $extra = []): object
{
    return Sprint04::sentRequest($extra + ['client_id' => $test->profile->id, 'status' => $status]);
}

/** Alerta abierta de un sensor del cliente: «failure» por umbral o recordatorio de mantenimiento. */
function s05Alert(object $test, string $kind): int
{
    $equipment = DB::table('client_equipment')->insertGetId(['user_id' => $test->user->id, 'name' => 'Congeladora',
        'subcategory_id' => Sprint04::subcategory('frio-congeladores')]);
    $device = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => 'Sensor', 'metric' => 'temperature', 'unit' => '°C',
        'target' => -18, 'tolerance' => 3, 'maintenance_every_days' => 1, 'last_maintenance_at' => now()->subDays(3)]);
    $kind === 'failure' ? app(IotMonitor::class)->record($device, -5.0, CarbonImmutable::now()) : app(IotMonitor::class)->maintenance(CarbonImmutable::now());

    return (int) DB::table('iot_alerts')->where('device_id', $device)->value('id');
}

function s05FromAlert(object $test, int $alert)
{
    return $test->postJson("/api/v1/client/iot/alerts/$alert/request", [], ['Idempotency-Key' => (string) Str::uuid()]);
}

it('S05-TC-407 solo cuentan las solicitudes vivas: las terminadas no cuentan aunque les falte la fecha de cierre [DEF-80]', function () {
    foreach (S05_ENDED as $status) {
        s05Request($this, $status);
    }
    expect(app(ActiveOrders::class)->count($this->profile->id))->toBe(0);
    $this->getJson('/api/v1/orders/quota')->assertOk()->assertJsonPath('data.active', 0)->assertJsonPath('data.available', 3);

    // Las programadas sí cuentan (asignada con franja).
    s05Request($this, 'assigned', ['mode' => 'scheduled', 'preferred_start_at' => now()->addDay(), 'preferred_end_at' => now()->addDay()->addHours(2)]);
    s05Request($this, 'pending_availability');
    expect(app(ActiveOrders::class)->count($this->profile->id))->toBe(2);
});

it('S05-TC-408 al cancelar la única solicitud viva de un pedido, el pedido deja de contar; si le queda otra, sigue contando [DEF-80]', function () {
    $order = DB::table('service_orders')->insertGetId(['client_id' => $this->profile->id, 'item_count' => 2, 'submitted_at' => now()]);
    $first = s05Request($this, 'sent', ['order_id' => $order]);
    $second = s05Request($this, 'sent', ['order_id' => $order]);
    $alone = s05Request($this, 'sent');
    expect(app(ActiveOrders::class)->count($this->profile->id))->toBe(2);

    $cancel = fn (object $request) => $this->postJson("/api/v1/requests/{$request->id}/cancellation", ['reason_code' => 'other',
        'reason' => 'Ya resolví el problema por otro medio.', 'expected_version' => (int) DB::table('service_requests')->where('id', $request->id)->value('version')],
        ['Idempotency-Key' => (string) Str::uuid()])->assertOk();
    $cancel($alone);
    $cancel($first);
    expect(app(ActiveOrders::class)->count($this->profile->id))->toBe(1);
    $cancel($second);
    expect(app(ActiveOrders::class)->count($this->profile->id))->toBe(0);
    // Una vencida sin closed_at (dato viejo) tampoco cuenta.
    s05Request($this, 'expired');
    $this->getJson('/api/v1/orders/quota')->assertJsonPath('data.available', 3);
});

it('S05-TC-409 el límite, las pestañas de Mis solicitudes y el menú usan la misma lista de estados vivos [DEF-80]', function () {
    expect(ActiveOrders::LIVE_STATUSES)->toEqualCanonicalizing(S05_LIVE);
    foreach ([...S05_LIVE, ...S05_ENDED] as $status) {
        $tab = ClientRequestBoard::tabOf((object) ['status' => $status, 'mode' => 'asap']);
        $live = in_array($status, ActiveOrders::LIVE_STATUSES, true);
        // Vivas: Activas o Programadas; terminadas: Completadas o Canceladas (el borrador va en Activas sin contar).
        expect(in_array($tab, ['active', 'scheduled'], true))->toBe($live || $status === 'registered');
    }
    foreach ([...S05_LIVE, ...S05_ENDED] as $status) {
        s05Request($this, $status);
    }
    $counts = $this->getJson('/api/v1/client/requests?tab=active')->assertOk()->json('data.counts');
    expect($counts['active'] + $counts['scheduled'] - 1)->toBe(app(ActiveOrders::class)->count($this->profile->id))
        ->and(app(ActiveOrders::class)->count($this->profile->id))->toBe(count(S05_LIVE));
});

it('S05-TC-410 con 3 pedidos activos, «Enviar a mi técnico» desde una alerta de falla crea la solicitud y no cuenta para el límite [D-113]', function () {
    foreach (range(1, 3) as $n) {
        s05Request($this, 'sent');
    }
    $created = s05FromAlert($this, s05Alert($this, 'failure'))->assertCreated()->json('data');
    expect(DB::table('service_requests')->where('id', $created['request_id'])->value('status'))->not->toBe('registered')
        ->and(app(ActiveOrders::class)->count($this->profile->id))->toBe(3);
});

it('S05-TC-411 con 3 pedidos activos, un recordatorio de mantenimiento sí choca con el límite [D-113]', function () {
    foreach (range(1, 3) as $n) {
        s05Request($this, 'sent');
    }
    $before = DB::table('service_requests')->count();
    s05FromAlert($this, s05Alert($this, 'maintenance'))->assertStatus(409)->assertJsonPath('error.code', 'ACTIVE_REQUEST_LIMIT');
    expect(DB::table('service_requests')->count())->toBe($before)
        ->and(DB::table('iot_alerts')->whereNotNull('request_id')->count())->toBe(0);
});

it('S05-TC-412 la misma alerta de falla no crea dos solicitudes, aunque se envíe con otra clave [D-113]', function () {
    foreach (range(1, 3) as $n) {
        s05Request($this, 'sent');
    }
    $alert = s05Alert($this, 'failure');
    s05FromAlert($this, $alert)->assertCreated();
    s05FromAlert($this, $alert)->assertStatus(409);
    expect(DB::table('iot_alerts')->where('id', $alert)->value('request_id'))->not->toBeNull()
        ->and(DB::table('service_requests')->where('client_id', $this->profile->id)->count())->toBe(4);
});

it('S05-TC-413 DemoSeeder deja a demo-mype con 2 pedidos activos como máximo y a demo-cliente con 1, y lo terminado con su fecha', function () {
    Storage::fake('public');
    $name = DemoSeeder::PASSWORD_VARIABLE;
    $password = Str::password(20);
    putenv("$name=$password");
    $_ENV[$name] = $_SERVER[$name] = $password;
    $this->app['env'] = 'local';
    $this->seed(DemoSeeder::class);

    $client = fn (string $alias) => (int) DB::table('client_profiles as c')->join('users as u', 'u.id', '=', 'c.user_id')
        ->where('u.email', "$alias@example.test")->value('c.id');
    expect(app(ActiveOrders::class)->count($client('demo-mype')))->toBeLessThanOrEqual(2)
        ->and(app(ActiveOrders::class)->count($client('demo-cliente')))->toBeLessThanOrEqual(1)
        ->and(DB::table('service_requests')->whereIn('status', ['completed', 'closed', 'unrated', 'expired'])->whereNull('closed_at')->count())->toBe(0)
        ->and(DB::table('service_requests')->where('status', 'cancelled')->whereNull('cancelled_at')->count())->toBe(0);
});

/** Oferta respondida (o vencida) por el técnico, con su tiempo de respuesta en segundos. */
function s05Offer(int $technicianId, int $seconds, string $status = 'accepted', int $daysAgo = 2): void
{
    $request = Sprint04::sentRequest(['status' => 'expired']);
    $available = CarbonImmutable::now()->subDays($daysAgo);
    $run = DB::table('matching_runs')->insertGetId(['request_id' => $request->id, 'search_generation' => 1, 'attempt_no' => 1, 'run_trigger' => 'submission',
        'rule_version_id' => app(RuleBook::class)->currentVersionId(), 'algorithm_version' => \App\Modules\BMatching\Application\Matcher::ALGORITHM,
        'status' => 'completed', 'eligible_count' => 1, 'started_at' => $available, 'finished_at' => $available]);
    $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request->id, 'matching_run_id' => $run, 'search_generation' => 1, 'round_no' => 1,
        'kind' => 'direct', 'status' => 'closed', 'opened_at' => $available, 'expires_at' => $available->addMinutes(10), 'closed_at' => $available->addMinutes(10)]);
    DB::table('offers')->insert(['round_id' => $round, 'request_id' => $request->id, 'technician_id' => $technicianId, 'status' => $status,
        'available_at' => $available, 'expires_at' => $available->addMinutes(10), 'responded_at' => $status === 'expired' ? null : $available->addSeconds($seconds),
        'reference_fee_snapshot' => '80.00', 'currency' => 'PEN', 'version' => 2]);
}

it('S05-TC-414 el perfil público dice «Responde en ~N min» con la mediana de 30 días y solo con 5 o más respuestas [D-114]', function () {
    $technician = Sprint04::technician();
    foreach ([60, 120, 180, 240] as $seconds) {
        s05Offer($technician->id, $seconds);
    }
    s05Offer($technician->id, 0, 'expired');
    s05Offer($technician->id, 30, 'accepted', 40);
    expect($this->getJson("/api/v1/technicians/{$technician->id}")->assertOk()->json('data.response_minutes'))->toBeNull();

    s05Offer($technician->id, 600, 'rejected');
    expect($this->getJson("/api/v1/technicians/{$technician->id}")->json('data.response_minutes'))->toBe(3);
});
