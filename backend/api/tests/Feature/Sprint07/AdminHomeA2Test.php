<?php

// S07-TC-167 a 178 · Panel del administrador, Fase A2 (PLAN-PANEL-ADMIN.md): Inicio como panel de control
// (GET /admin/dashboard › kpis, series, tasks y 10 eventos), garantía, mantenimiento y factor IoT leídos de las reglas
// (D-121), datos del DemoSeeder para el Inicio y el lugar de carga de las distancias de Pilcomayo y Huancán (D-124).
// Datos sintéticos; el reloj se fija con travelTo. «Hoy» y los días de la serie son los de Lima (UTC-5, sin horario de verano).
use App\Models\User;
use App\Modules\Premium\IotMonitor;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Seeders\DemoPremium;
use Database\Seeders\DemoSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

// 10:00 en Lima del 2026-11-25 (después de la versión 4 de las reglas).
const S07A2_NOW = '2026-11-25 15:00:00';

function s07a2Dashboard(object $test, User $admin): array
{
    return $test->actingAs($admin)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');
}

/** Técnico asignado a una solicitud en el momento indicado (participación primaria). */
function s07a2Assign(object $request, CarbonImmutable $at, string $status = 'assigned'): void
{
    DB::table('participations')->insert(['request_id' => $request->id, 'technician_id' => Sprint04::technician()->id, 'slot' => 'primary',
        'status' => $status, 'reference_fee_snapshot' => '80.00', 'assigned_at' => $at]);
}

/** Oferta de un técnico en una ronda propia de una solicitud nueva, con el estado pedido, hace $days días. */
function s07a2Offer(int $technicianId, string $status, int $days = 2): void
{
    $request = Sprint04::sentRequest(['status' => 'expired', 'submitted_at' => now()->subDays($days), 'closed_at' => now()->subDays($days)]);
    $run = DB::table('matching_runs')->insertGetId(['request_id' => $request->id, 'search_generation' => 1, 'attempt_no' => 1,
        'run_trigger' => 'submission', 'rule_version_id' => $request->rule_version_id, 'algorithm_version' => 'test', 'status' => 'completed',
        'started_at' => now()->subDays($days)]);
    $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request->id, 'matching_run_id' => $run, 'search_generation' => 1,
        'round_no' => 1, 'kind' => 'automatic', 'status' => 'closed', 'opened_at' => now()->subDays($days), 'expires_at' => now()->subDays($days)->addMinutes(10)]);
    DB::table('offers')->insert(['round_id' => $round, 'request_id' => $request->id, 'technician_id' => $technicianId, 'status' => $status,
        'available_at' => now()->subDays($days), 'expires_at' => now()->subDays($days)->addMinutes(10),
        'responded_at' => in_array($status, ['accepted', 'rejected'], true) ? now()->subDays($days)->addMinutes(2) : null,
        'reference_fee_snapshot' => '80.00', 'created_at' => now()->subDays($days)]);
}

/** Alerta de un sensor de un cliente sintético, iniciada hace $minutes minutos. */
function s07a2Iot(string $severity, int $minutes = 10, string $kind = 'threshold', bool $resolved = false): void
{
    $user = Sprint04::clientUser(Sprint04::sentRequest(['status' => 'completed', 'submitted_at' => now()->subDays(3)]));
    $equipment = DB::table('client_equipment')->insertGetId(['user_id' => $user->id, 'subcategory_id' => Sprint04::subcategory(),
        'name' => 'Congeladora sintética', 'is_demo' => true]);
    $device = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => 'Sensor sintético', 'metric' => 'temperature',
        'unit' => '°C', 'target' => -18, 'tolerance' => 2]);
    DB::table('iot_alerts')->insert(['device_id' => $device, 'user_id' => $user->id, 'kind' => $kind, 'severity' => $severity,
        'message' => 'Alerta sintética', 'value' => -5, 'started_at' => now()->subMinutes($minutes), 'resolved_at' => $resolved ? now() : null]);
}

/** Versión nueva de las reglas, vigente ahora, que copia la vigente y cambia los valores indicados. */
function s07a2PublishRules(array $changes): void
{
    $rules = app(RuleBook::class);
    $current = $rules->currentVersionId();
    $id = DB::table('rule_versions')->insertGetId(['version_no' => (int) DB::table('rule_versions')->max('version_no') + 1, 'status' => 'published',
        'change_reason' => 'Versión sintética de prueba.', 'effective_at' => now()->subSecond(), 'published_at' => now()->subSecond()]);
    foreach (DB::table('rule_values as v')->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')->where('v.rule_version_id', $current)
        ->get(['v.parameter_id', 'p.code', 'v.value_json']) as $value) {
        DB::table('rule_values')->insert(['rule_version_id' => $id, 'parameter_id' => $value->parameter_id,
            'value_json' => array_key_exists($value->code, $changes) ? json_encode($changes[$value->code]) : $value->value_json]);
    }
    $weights = (array) DB::table('matching_weights')->where('rule_version_id', $current)
        ->first(['proximity_weight', 'price_weight', 'history_weight', 'experience_weight']);
    DB::table('matching_weights')->insert(['rule_version_id' => $id] + $weights);
}

describe('Inicio del administrador', function () {
    beforeEach(function () {
        Sprint04::boot($this);
        $this->travelTo(CarbonImmutable::parse(S07A2_NOW, 'UTC'));
        $this->admin = Sprint02::admin();
    });

    it('S07-TC-167 los indicadores cuentan hoy en Lima, lo que busca técnico, técnicos verificados, Premium y alertas IoT abiertas [TC-087]', function () {
        // Hoy en Lima empieza a las 05:00 UTC: 04:59 es ayer.
        Sprint04::sentRequest(['submitted_at' => CarbonImmutable::parse('2026-11-25 04:59:00', 'UTC'), 'status' => 'completed']);
        Sprint04::sentRequest(['submitted_at' => CarbonImmutable::parse('2026-11-25 05:00:00', 'UTC'), 'status' => 'completed']);
        Sprint04::sentRequest(['submitted_at' => now()->subMinutes(5)]);
        Sprint04::sentRequest(['status' => 'pending_availability', 'submitted_at' => now()->subDays(2), 'pending_since' => now()->subHour(),
            'pending_expires_at' => now()->addHours(23)]);
        Sprint04::sentRequest(['status' => 'registered', 'submitted_at' => null]);
        $verified = DB::table('technician_profiles')->where('status', 'active')->where('verification_status', 'approved')->count();
        Sprint04::technician(); // activo y verificado
        DB::table('technician_profiles')->where('id', Sprint04::technician()->id)->update(['status' => 'suspended']);
        ClientProfileFactory::new()->create(['plan' => 'premium']);
        ClientProfileFactory::new()->create(['plan' => 'free']);
        // Abiertas de umbral: una falla y una atención. No cuentan el recordatorio de mantenimiento ni la falla resuelta.
        s07a2Iot('failure');
        s07a2Iot('attention');
        s07a2Iot('info', kind: 'maintenance');
        s07a2Iot('failure', resolved: true);

        $kpis = s07a2Dashboard($this, $this->admin)['kpis'];

        expect($kpis['requests_today'])->toBe(2)
            ->and($kpis['searching_now'])->toBe(2)
            ->and($kpis['technicians_verified'])->toBe($verified + 1)
            ->and($kpis['premium_clients'])->toBe(1)
            ->and($kpis['iot_open_alerts'])->toBe(2);
    });

    it('S07-TC-168 el tiempo medio de asignación usa las asignaciones de los últimos 30 días y sin datos es null [TC-087]', function () {
        expect(s07a2Dashboard($this, $this->admin)['kpis']['avg_assignment_minutes'])->toBeNull();

        foreach ([[20, 1], [40, 3], [60 * 24, 31]] as [$minutes, $daysAgo]) {
            $submitted = now()->subDays($daysAgo)->subMinutes($minutes);
            s07a2Assign(Sprint04::sentRequest(['status' => 'assigned', 'submitted_at' => $submitted]), $submitted->addMinutes($minutes));
        }

        // La de hace 31 días queda fuera: (20 + 40) / 2.
        expect(s07a2Dashboard($this, $this->admin)['kpis']['avg_assignment_minutes'])->toBe(30);
    });

    it('S07-TC-169 la serie trae 30 días de Lima con ceros explícitos: creadas, asignadas, canceladas y vencidas por día', function () {
        $yesterday = CarbonImmutable::parse('2026-11-24 15:00:00', 'UTC');
        Sprint04::sentRequest(['submitted_at' => $yesterday, 'status' => 'cancelled', 'cancelled_at' => $yesterday->addHour()]);
        $assigned = Sprint04::sentRequest(['submitted_at' => $yesterday, 'status' => 'assigned']);
        s07a2Assign($assigned, now()->subHour());
        Sprint04::sentRequest(['submitted_at' => now()->subDays(40), 'status' => 'expired', 'closed_at' => now()->subDays(3)]);

        $series = s07a2Dashboard($this, $this->admin)['series'];

        expect($series['days'])->toBe(30)->and($series['items'])->toHaveCount(30)
            ->and($series['items'][29]['date'])->toBe('2026-11-25')
            ->and($series['items'][0]['date'])->toBe('2026-10-27');
        $byDate = collect($series['items'])->keyBy('date');
        expect($byDate['2026-11-24'])->toBe(['date' => '2026-11-24', 'created' => 2, 'assigned' => 0, 'cancelled' => 1, 'expired' => 0])
            ->and($byDate['2026-11-25'])->toBe(['date' => '2026-11-25', 'created' => 0, 'assigned' => 1, 'cancelled' => 0, 'expired' => 0])
            ->and($byDate['2026-11-22']['expired'])->toBe(1)
            ->and($byDate['2026-11-01'])->toBe(['date' => '2026-11-01', 'created' => 0, 'assigned' => 0, 'cancelled' => 0, 'expired' => 0]);
    });

    it('S07-TC-170 las tareas cuentan documentos por revisar, sin técnico más de 30 min, pendientes por vencer y fallas IoT, cada una con su sección [D-118]', function () {
        TechnicianDocumentFactory::new()->count(2)->create();
        TechnicianDocumentFactory::new()->create(['review_status' => 'approved']);
        Sprint04::sentRequest(['submitted_at' => now()->subMinutes(31)]);
        Sprint04::sentRequest(['submitted_at' => now()->subMinutes(5), 'status' => 'pending_availability', 'pending_since' => now()->subHours(22),
            'pending_expires_at' => now()->addMinutes(100)]);
        s07a2Iot('failure', 61);

        $tasks = collect(s07a2Dashboard($this, $this->admin)['tasks'])->keyBy('key');

        expect($tasks->keys()->all())->toBe(['documents_to_review', 'unassigned_requests', 'pending_expiring', 'keyword_misses', 'iot_unattended',
            'low_performance'])
            ->and($tasks['documents_to_review'])->toMatchArray(['count' => 2, 'section' => 'verification'])
            ->and($tasks['unassigned_requests'])->toMatchArray(['count' => 1, 'section' => 'alerts'])
            ->and($tasks['pending_expiring'])->toMatchArray(['count' => 1, 'section' => 'alerts'])
            ->and($tasks['iot_unattended'])->toMatchArray(['count' => 1, 'section' => 'iot']);

        // Antes de la v4 no hay umbrales: las tareas que los usan quedan en null (no se inventan), los documentos sí se cuentan.
        Sprint01::forgetSession();
        $this->travelTo(CarbonImmutable::parse('2026-11-20 15:00:00', 'UTC'));
        $before = collect(s07a2Dashboard($this, $this->admin)['tasks'])->keyBy('key');
        expect($before['documents_to_review']['count'])->toBe(2)
            ->and($before['unassigned_requests']['count'])->toBeNull()
            ->and($before['low_performance']['count'])->toBeNull();
    });

    it('S07-TC-171 búsquedas sin resultado de 7 días y técnicos con desempeño bajo según los umbrales de D-118 en sus bordes', function () {
        DB::table('keyword_misses')->insert([
            ['normalized_query' => 'terma no calienta', 'count' => 3, 'last_seen_at' => now()->subDays(7)->addMinute()],
            ['normalized_query' => 'puerta de cochera', 'count' => 1, 'last_seen_at' => now()->subDays(7)->subMinute()],
        ]);
        // Con 5 ofertas en 30 días: 1 aceptada de 5 (20 %) es bajo; 2 de 5 (40 %) no; 4 ofertas no se evalúan; 3 vencidas sí.
        $low = Sprint04::technician();
        $fair = Sprint04::technician();
        $few = Sprint04::technician();
        $expired = Sprint04::technician();
        foreach (['accepted', 'rejected', 'rejected', 'rejected', 'rejected'] as $status) { s07a2Offer($low->id, $status); }
        foreach (['accepted', 'accepted', 'rejected', 'rejected', 'rejected'] as $status) { s07a2Offer($fair->id, $status); }
        foreach (['rejected', 'rejected', 'rejected', 'rejected'] as $status) { s07a2Offer($few->id, $status); }
        foreach (['accepted', 'accepted', 'accepted', 'expired', 'expired', 'expired'] as $status) { s07a2Offer($expired->id, $status); }
        s07a2Offer($fair->id, 'rejected', 31); // fuera de los 30 días

        $tasks = collect(s07a2Dashboard($this, $this->admin)['tasks'])->keyBy('key');

        expect($tasks['keyword_misses'])->toMatchArray(['count' => 1, 'section' => 'keywords'])
            ->and($tasks['low_performance'])->toMatchArray(['count' => 2, 'section' => 'performance']);
    });

    it('S07-TC-172 la actividad reciente trae las 10 últimas acciones de una persona, sin accesos ni acciones del sistema', function () {
        $base = ['actor_kind' => 'user', 'subject_type' => 'user', 'reason' => 'Motivo sintético.', 'correlation_id' => (string) Str::uuid()];
        foreach (range(1, 12) as $index) {
            DB::table('audit_entries')->insert($base + ['actor_id' => $this->admin->id, 'action' => 'user.updated', 'subject_id' => $index,
                'occurred_at' => now()->subMinutes(30 - $index)]);
        }
        DB::table('audit_entries')->insert($base + ['actor_id' => $this->admin->id, 'action' => 'auth.login', 'occurred_at' => now()]);
        DB::table('audit_entries')->insert(['actor_id' => null, 'actor_kind' => 'system'] + $base + ['action' => 'user.updated', 'occurred_at' => now()]);

        $events = s07a2Dashboard($this, $this->admin)['recent_events'];

        expect($events)->toHaveCount(10)
            ->and(collect($events)->pluck('action')->unique()->all())->toBe(['user.updated'])
            ->and($events[0]['occurred_at'])->toBe(now()->subMinutes(18)->toISOString())
            ->and(array_keys($events[0]))->not->toContain('before_values', 'after_values', 'correlation_id');
    });

    it('S07-TC-173 el Inicio hace el mismo número de consultas con pocos o muchos datos', function () {
        $count = function () {
            Sprint01::forgetSession();
            Sanctum::actingAs($this->admin);
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->getJson('/api/v1/admin/dashboard')->assertOk();
            $total = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $total;
        };
        Sprint04::sentRequest();
        $few = $count();
        foreach (range(1, 8) as $index) {
            $request = Sprint04::sentRequest(['status' => 'assigned', 'submitted_at' => now()->subDays($index)]);
            s07a2Assign($request, now()->subDays($index)->addMinutes(15));
            s07a2Offer(Sprint04::technician()->id, 'expired', $index);
        }

        expect($count())->toBe($few);
    });
});

describe('Reglas formalizadas en el código (D-121)', function () {
    beforeEach(function () {
        Sprint04::boot($this);
        $this->travelTo(CarbonImmutable::parse(S07A2_NOW, 'UTC'));
    });

    it('S07-TC-174 la garantía de ejemplo usa warranty_days de las reglas vigentes; antes de la v4, el valor con que se formalizó', function () {
        $request = Sprint04::sentRequest(['status' => 'completed', 'closed_at' => now()->subDays(2)]);
        $client = Sprint04::clientUser($request);
        DB::table('client_profiles')->where('user_id', $client->id)->update(['plan' => 'premium', 'plan_since' => now()->subMonth()]);
        Sanctum::actingAs($client);
        expect($this->getJson('/api/v1/client/warranties')->assertOk()->json('data.items.0.days'))->toBe(30);

        s07a2PublishRules(['warranty_days' => 45]);
        $item = $this->getJson('/api/v1/client/warranties')->assertOk()->json('data.items.0');
        expect($item['days'])->toBe(45)
            ->and($item['valid_until'])->toBe(CarbonImmutable::parse($item['closed_at'])->addDays(45)->toISOString());

        // Antes del 2026-11-24 ninguna versión vigente lo trae: rige el valor con que se formalizó (30, D-103).
        $this->travelTo(CarbonImmutable::parse('2026-11-20 15:00:00', 'UTC'));
        expect(app(RuleBook::class)->formalized('warranty_days'))->toBe(30);
    });

    it('S07-TC-175 el estado del sensor usa el factor de atención de las reglas y la alerta que abre lo respeta', function () {
        $device = (object) ['online' => true, 'target' => -18, 'tolerance' => 2];
        // Desvío de 5 = 2,5 veces la tolerancia: con el factor 2 de la v4 es falla.
        expect(IotMonitor::status($device, -13.0))->toBe('failure');

        s07a2PublishRules(['iot_attention_tolerance_factor' => 3]);
        expect(IotMonitor::status($device, -13.0))->toBe('attention')
            ->and(IotMonitor::status($device, -11.0))->toBe('failure');

        $user = Sprint04::clientUser(Sprint04::sentRequest(['status' => 'completed']));
        $equipment = DB::table('client_equipment')->insertGetId(['user_id' => $user->id, 'subcategory_id' => Sprint04::subcategory(),
            'name' => 'Congeladora sintética', 'is_demo' => true]);
        $id = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => 'Sensor sintético', 'metric' => 'temperature',
            'unit' => '°C', 'target' => -18, 'tolerance' => 2]);
        app(IotMonitor::class)->record($id, -13.0, CarbonImmutable::now());
        expect(DB::table('iot_alerts')->where('device_id', $id)->value('severity'))->toBe('attention');
    });

    it('S07-TC-176 los equipos con sensor de la demostración toman el mantenimiento de maintenance_reminder_days', function () {
        s07a2PublishRules(['maintenance_reminder_days' => 90]);
        $client = ClientProfileFactory::new()->create(['plan' => 'premium']);

        app(DemoPremium::class)->run((int) $client->user_id, (int) $client->id, Sprint04::district());

        $days = DB::table('iot_devices as d')->join('client_equipment as e', 'e.id', '=', 'd.equipment_id')
            ->where('e.user_id', $client->user_id)->pluck('d.maintenance_every_days')->unique()->values()->all();
        expect($days)->toBe([90]);
    });
});

it('S07-TC-177 el DemoSeeder deja contenido en cada parte del Inicio del administrador', function () {
    Storage::fake('public');
    $password = Str::password(20);
    $name = DemoSeeder::PASSWORD_VARIABLE;
    putenv("$name=$password");
    $_ENV[$name] = $_SERVER[$name] = $password;
    $this->app['env'] = 'local';
    $this->travelTo(CarbonImmutable::parse(S07A2_NOW, 'UTC'));
    $this->seed(DemoSeeder::class);
    $this->seed(DemoSeeder::class); // idempotente

    Sprint01::actAsSpa($this);
    $data = s07a2Dashboard($this, User::query()->where('email', 'demo-admin@example.test')->sole());

    foreach (['requests_today', 'searching_now', 'technicians_verified', 'premium_clients', 'iot_open_alerts'] as $kpi) {
        expect($data['kpis'][$kpi])->toBeGreaterThan(0, $kpi);
    }
    expect($data['kpis']['avg_assignment_minutes'])->not->toBeNull();
    foreach ($data['tasks'] as $task) {
        expect($task['count'])->toBeGreaterThan(0, $task['key']);
    }
    $week = collect($data['series']['items'])->slice(-7);
    foreach (['created', 'assigned', 'cancelled', 'expired'] as $kind) {
        expect($week->sum($kind))->toBeGreaterThan(0, $kind);
    }
    expect($data['recent_events'])->toHaveCount(10)
        ->and(DB::table('users')->where('email', 'like', 'demo-%')->where('email', 'not like', '%@example.test')->count())->toBe(0)
        ->and(DB::table('audit_entries')->where('source_code', 'demo-seeder')->where('reason', 'not like', '%(demostración)%')->count())->toBe(0);
});

it('S07-TC-178 las distancias de Pilcomayo y Huancán tienen su lugar de carga: pendientes no se siembran, cargadas sí y sin pisar [D-124]', function () {
    $pending = collect(DistrictSeeder::distances())->filter(fn (array $row) => $row['km'] === null);
    expect($pending->map(fn (array $row) => $row['from'].'-'.$row['to'])->sort()->values()->all())->toBe([
        'CHILCA-HUANCAN', 'CHILCA-PILCOMAYO', 'EL-TAMBO-HUANCAN', 'EL-TAMBO-PILCOMAYO', 'HUANCAN-PILCOMAYO', 'HUANCAYO-HUANCAN',
        'HUANCAYO-PILCOMAYO']);
    $this->seed(DistrictSeeder::class);
    expect(DB::table('district_distances')->count())->toBe(8);

    // Cuando el equipo cargue un par (km, fuente y fecha de consulta), la misma siembra lo inserta una sola vez.
    $seeder = app(DistrictSeeder::class);
    $row = ['from' => 'HUANCAYO', 'to' => 'PILCOMAYO', 'km' => '6.500', 'source' => 'Consulta sintética de prueba', 'consulted_on' => '2026-11-25'];
    $seeder->seedDistances([$row]);
    $seeder->seedDistances([['km' => '9.900'] + $row]);
    $ids = DB::table('districts')->pluck('id', 'code');
    $pair = DB::table('district_distances')->where('from_district_id', min($ids['HUANCAYO'], $ids['PILCOMAYO']))
        ->where('to_district_id', max($ids['HUANCAYO'], $ids['PILCOMAYO']))->get();
    expect($pair)->toHaveCount(1)
        ->and($pair[0]->km)->toBe('6.500')
        ->and($pair[0]->source)->toBe('Consulta sintética de prueba (2026-11-25)');
});
