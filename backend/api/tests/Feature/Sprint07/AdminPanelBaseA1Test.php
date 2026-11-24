<?php

// S07-TC-144 a 152 · Panel del administrador, Fase A1 (PLAN-PANEL-ADMIN.md): permisos nuevos (D-119), 5 zonas (D-124),
// versión 4 de las reglas con los umbrales de D-118 (D-121), contadores del menú (GET /admin/dashboard › badges) y
// primera visita de demo-admin en cada siembra (D-117). Datos sintéticos; el reloj se fija con travelTo.
use App\Models\User;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\DemoSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

const S07A1_NEW_PERMISSIONS = ['requests.intervene', 'audit.view', 'content.manage'];
// Después de la versión 4 de las reglas (vigente desde el 2026-11-24 00:00 UTC).
const S07A1_NOW = '2026-11-25 15:00:00';

/** Contadores del menú según GET /admin/dashboard. */
function s07a1Badges(object $test, User $admin): array
{
    return $test->actingAs($admin)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data.badges');
}

/** Ronda cerrada de la búsqueda vigente, con una oferta en el estado pedido. */
function s07a1Round(object $request, int $roundNo, string $offerStatus): void
{
    $runId = DB::table('matching_runs')->where('request_id', $request->id)->value('id') ?? DB::table('matching_runs')->insertGetId([
        'request_id' => $request->id, 'search_generation' => $request->search_generation, 'attempt_no' => 1,
        'run_trigger' => 'submission', 'rule_version_id' => $request->rule_version_id, 'algorithm_version' => 'test',
        'status' => 'completed', 'started_at' => now()->subHours(2),
    ]);
    $roundId = DB::table('offer_rounds')->insertGetId([
        'request_id' => $request->id, 'matching_run_id' => $runId, 'search_generation' => $request->search_generation,
        'round_no' => $roundNo, 'kind' => 'automatic', 'status' => 'closed', 'opened_at' => now()->subMinutes(90 - $roundNo * 20),
        'expires_at' => now()->subMinutes(80 - $roundNo * 20), 'closed_at' => now()->subMinutes(80 - $roundNo * 20),
    ]);
    $technician = Sprint04::technician();
    DB::table('offers')->insert([
        'round_id' => $roundId, 'request_id' => $request->id, 'technician_id' => $technician->id, 'status' => $offerStatus,
        'available_at' => now()->subMinutes(90 - $roundNo * 20), 'expires_at' => now()->subMinutes(80 - $roundNo * 20),
        'reference_fee_snapshot' => '80.00',
    ]);
}

/** Falla abierta de un sensor de un cliente sintético, iniciada hace $minutes minutos. */
function s07a1IotFailure(int $minutes, ?int $requestId = null, string $severity = 'failure'): void
{
    $user = Sprint04::clientUser(Sprint04::sentRequest(['status' => 'completed']));
    $equipment = DB::table('client_equipment')->insertGetId(['user_id' => $user->id, 'subcategory_id' => Sprint04::subcategory(),
        'name' => 'Congeladora sintética', 'is_demo' => true]);
    $device = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => 'Sensor sintético', 'metric' => 'temperature',
        'unit' => '°C', 'target' => -18, 'tolerance' => 2]);
    DB::table('iot_alerts')->insert(['device_id' => $device, 'user_id' => $user->id, 'kind' => 'threshold', 'severity' => $severity,
        'message' => 'Temperatura fuera de rango (sintética)', 'value' => -5, 'started_at' => now()->subMinutes($minutes),
        'request_id' => $requestId]);
}

describe('Permisos, zonas y reglas', function () {
    it('S07-TC-144 AuthorizationSeeder concede requests.intervene, audit.view y content.manage al administrador sin duplicar [D-119]', function () {
        $this->seed(AuthorizationSeeder::class);
        $this->seed(AuthorizationSeeder::class);

        $adminRole = DB::table('roles')->where('code', 'admin')->value('id');
        foreach (S07A1_NEW_PERMISSIONS as $code) {
            $permission = DB::table('permissions')->where('code', $code)->first();
            expect($permission)->not->toBeNull()
                ->and($permission->description)->not->toBe('')
                ->and(DB::table('role_permissions')->where('role_id', $adminRole)->where('permission_id', $permission->id)->count())->toBe(1);
        }
        // Ni el cliente ni el técnico los reciben.
        $others = DB::table('role_permissions as rp')->join('roles as r', 'r.id', '=', 'rp.role_id')
            ->join('permissions as p', 'p.id', '=', 'rp.permission_id')->where('r.code', '<>', 'admin')
            ->whereIn('p.code', S07A1_NEW_PERMISSIONS)->count();
        expect($others)->toBe(0);

        Sprint01::actAsSpa($this);
        $permissions = $this->actingAs(Sprint02::admin())->getJson('/api/v1/me')->assertOk()->json('data.permissions');
        expect($permissions)->toContain(...S07A1_NEW_PERMISSIONS);
    });

    it('S07-TC-145 DistrictSeeder siembra las 5 zonas una sola vez, con 1 km dentro de cada distrito y sin distancias inventadas [D-124]', function () {
        $this->seed(DistrictSeeder::class);
        DB::table('districts')->where('code', 'HUANCAN')->update(['active' => 0]);
        $this->seed(DistrictSeeder::class);

        expect(DB::table('districts')->orderBy('id')->pluck('name')->all())
            ->toBe(['Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo', 'Huancán'])
            ->and(DB::table('districts')->where('code', 'HUANCAN')->value('active'))->toBe(0);
        $ids = DB::table('districts')->pluck('id', 'code');
        foreach (['PILCOMAYO', 'HUANCAN'] as $code) {
            $pairs = DB::table('district_distances')->where('from_district_id', $ids[$code])->orWhere('to_district_id', $ids[$code])->get();
            // Solo el par consigo mismo (D-64): los km entre distritos se consultan como en D-64, no se inventan.
            expect($pairs)->toHaveCount(1)
                ->and($pairs[0]->from_district_id)->toBe($pairs[0]->to_district_id)
                ->and($pairs[0]->km)->toBe('1.000');
        }
        expect(DB::table('district_distances')->count())->toBe(8);
    });

    it('S07-TC-146 una solicitud en Pilcomayo encuentra al técnico que la cubre aunque falte el par en la matriz (C = 0) [D-124, D-86]', function () {
        Sprint04::boot($this);
        $pilcomayo = Sprint04::district('PILCOMAYO');
        $technician = Sprint04::technician(['districts' => [$pilcomayo], 'base' => Sprint04::district('HUANCAYO')]);
        $request = Sprint04::sentRequest(['district_id' => $pilcomayo]);

        Sprint04::prepare($request->id);

        $snapshot = json_decode(Sprint04::candidate($request->id, $technician->id)->input_snapshot, true);
        expect($snapshot['distance_km'])->toBeNull()
            ->and(Sprint04::offerTo($request->id, $technician->id))->not->toBeNull();
    });

    it('S07-TC-147 la versión 4 de las reglas copia la v3, suma garantía, mantenimiento, factor IoT y umbrales, y no se edita [D-121, D-118]', function () {
        $this->travelTo(CarbonImmutable::parse(S07A1_NOW, 'UTC'));
        $rules = app(RuleBook::class);
        $v3 = DB::table('rule_versions')->where('version_no', 3)->value('id');
        $v4 = DB::table('rule_versions')->where('version_no', 4)->first();

        expect($rules->currentVersionId())->toBe((int) $v4->id)
            ->and($v4->status)->toBe('published')
            ->and(CarbonImmutable::parse($v4->effective_at)->toDateString())->toBe('2026-11-24')
            ->and($v4->change_reason)->toContain('D-121');
        $values = $rules->values((int) $v4->id);
        foreach ($rules->values((int) $v3) as $code => $value) {
            expect($values[$code])->toBe($value);
        }
        $new = ['warranty_days', 'maintenance_reminder_days', 'iot_attention_tolerance_factor',
            'unassigned_alert_minutes', 'pending_expiring_alert_minutes', 'expired_rounds_alert_count', 'iot_failure_alert_minutes',
            'low_performance_min_offers', 'low_performance_acceptance_percent', 'low_performance_expired_offers', 'keyword_misses_recent_days'];
        expect(array_intersect_key($values, array_flip($new)))
            ->toEqual([
                'warranty_days' => 30, 'maintenance_reminder_days' => 180, 'iot_attention_tolerance_factor' => 2.0,
                'unassigned_alert_minutes' => 30, 'pending_expiring_alert_minutes' => 120, 'expired_rounds_alert_count' => 2,
                'iot_failure_alert_minutes' => 60, 'low_performance_min_offers' => 5, 'low_performance_acceptance_percent' => 40,
                'low_performance_expired_offers' => 3, 'keyword_misses_recent_days' => 7,
            ]);
        $weights = fn (int $version) => (array) DB::table('matching_weights')->where('rule_version_id', $version)
            ->first(['proximity_weight', 'price_weight', 'history_weight', 'experience_weight']);
        // D-115: se muestran, no se editan desde el panel.
        expect($weights((int) $v4->id))->toBe($weights((int) $v3))
            ->and(DB::table('rule_parameters')->whereIn('code', $new)->where('editable', 0)->count())->toBe(count($new));
    });
});

describe('Contadores del menú', function () {
    beforeEach(function () {
        Sprint04::boot($this);
        $this->travelTo(CarbonImmutable::parse(S07A1_NOW, 'UTC'));
        $this->admin = Sprint02::admin();
    });

    it('S07-TC-148 cuenta técnicos por verificar y solicitudes sin técnico (enviadas o en pendiente), no las asignadas ni cerradas [D-118]', function () {
        Sprint02::readyTechnician(); // verificación pendiente
        foreach (['sent', 'sent', 'pending_availability', 'assigned', 'in_progress', 'cancelled', 'expired', 'registered'] as $status) {
            $pending = $status === 'pending_availability' ? ['pending_since' => now()->subHour(), 'pending_expires_at' => now()->addHours(23)] : [];
            Sprint04::sentRequest(['status' => $status] + $pending);
        }

        $badges = s07a1Badges($this, $this->admin);

        expect($badges['verification_pending'])->toBe(DB::table('technician_profiles')->where('verification_status', 'pending')->count())
            ->and($badges['verification_pending'])->toBeGreaterThanOrEqual(1)
            ->and($badges['requests_unassigned'])->toBe(3);
    });

    it('S07-TC-149 una solicitud sin técnico es alerta desde el minuto 31 (30 no) y sin la versión 4 no hay contador de alertas [D-118]', function () {
        Sprint04::sentRequest(['submitted_at' => now()->subMinutes(30)]);
        expect(s07a1Badges($this, $this->admin)['operational_alerts'])->toBe(0);

        Sprint04::sentRequest(['submitted_at' => now()->subMinutes(31)]);
        expect(s07a1Badges($this, $this->admin)['operational_alerts'])->toBe(1);

        // Antes del 2026-11-24 la versión vigente no tiene umbrales: el menú queda sin contador, sin inventarlo.
        Sprint01::forgetSession();
        $this->travelTo(CarbonImmutable::parse('2026-11-20 15:00:00', 'UTC'));
        expect(s07a1Badges($this, $this->admin)['operational_alerts'])->toBeNull();
    });

    it('S07-TC-150 alerta por pendiente de 24 h con 2 h o menos y por 2 rondas seguidas vencidas sin aceptación [D-118]', function () {
        $fresh = ['submitted_at' => now()->subMinutes(5)];
        // Pendiente: vence en 2 h exactas (sí), en 2 h y 1 min (no) y ya vencido (no; lo cierra el job).
        foreach ([120, 121, -1] as $minutes) {
            Sprint04::sentRequest($fresh + ['status' => 'pending_availability', 'pending_since' => now()->subHours(22),
                'pending_expires_at' => now()->addMinutes($minutes)]);
        }
        expect(s07a1Badges($this, $this->admin)['operational_alerts'])->toBe(1);

        $chain = Sprint04::sentRequest($fresh);
        s07a1Round($chain, 1, 'expired');
        s07a1Round($chain, 2, 'expired');
        $oneRound = Sprint04::sentRequest($fresh);
        s07a1Round($oneRound, 1, 'expired');
        $accepted = Sprint04::sentRequest($fresh);
        s07a1Round($accepted, 1, 'expired');
        s07a1Round($accepted, 2, 'accepted');

        expect(s07a1Badges($this, $this->admin)['operational_alerts'])->toBe(2);
    });

    it('S07-TC-151 alerta por falla IoT abierta más de 60 minutos sin solicitud; no por atención ni con solicitud [D-118]', function () {
        s07a1IotFailure(61);
        s07a1IotFailure(60);
        s07a1IotFailure(90, severity: 'attention');
        s07a1IotFailure(90, Sprint04::sentRequest(['submitted_at' => now()->subMinutes(5)])->id);

        expect(s07a1Badges($this, $this->admin)['operational_alerts'])->toBe(1);
    });
});

it('S07-TC-152 demo-admin vuelve a su primera visita en cada siembra, sin duplicarse [D-117]', function () {
    Storage::fake('public');
    $password = Str::password(20);
    $name = DemoSeeder::PASSWORD_VARIABLE;
    putenv("$name=$password");
    $_ENV[$name] = $_SERVER[$name] = $password;
    $this->app['env'] = 'local';
    $this->seed(DemoSeeder::class);
    $admin = User::query()->where('email', 'demo-admin@example.test')->firstOrFail();
    DB::table('users')->where('id', $admin->id)->update(['onboarding_completed_at' => now(), 'tour_completed_at' => now(),
        'accessibility_prefs' => json_encode(['text_size' => 130]), 'theme_preference' => 'dark']);

    $this->seed(DemoSeeder::class);

    $row = DB::table('users')->where('email', 'demo-admin@example.test')->get();
    expect($row)->toHaveCount(1)
        ->and([$row[0]->onboarding_completed_at, $row[0]->tour_completed_at, $row[0]->accessibility_prefs, $row[0]->theme_preference])
        ->toBe([null, null, null, null]);
});
