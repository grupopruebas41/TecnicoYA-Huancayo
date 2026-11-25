<?php

// Revisión del #70 (Fase A3 del panel del administrador): línea de tiempo de la demo (DEF-85), motivo de la intervención y
// acciones que no aplican por D-120, tablero sin los pendientes ya vencidos (DEF-86) y alertas con nivel, detalle y
// desempeño bajo (D-118). Las demás pruebas de la fase están en AdminOperationsA3Test.php.
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

const S07A3R_NOW = '2026-11-25 15:00:00';
const S07A3R_REASON = 'Se liberó un técnico en la zona y conviene volver a buscar (sintético).';

/** Ronda cerrada o abierta armada a mano con una oferta por técnico en el estado pedido. */
function s07a3rRound(object $request, int $roundNo, array $offers, string $status = 'closed', ?CarbonInterface $at = null): int
{
    $at = CarbonImmutable::instance($at ?? now()->subMinutes(20));
    $run = DB::table('matching_runs')->where('request_id', $request->id)->value('id') ?? DB::table('matching_runs')->insertGetId([
        'request_id' => $request->id, 'search_generation' => (int) $request->search_generation, 'attempt_no' => 1, 'run_trigger' => 'submission',
        'rule_version_id' => $request->rule_version_id, 'algorithm_version' => 'test', 'status' => 'completed', 'started_at' => $at]);
    $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request->id, 'matching_run_id' => $run,
        'search_generation' => (int) $request->search_generation, 'round_no' => $roundNo, 'kind' => 'automatic', 'status' => $status,
        'opened_at' => $at, 'expires_at' => $at->addMinutes(10), 'closed_at' => $status === 'closed' ? $at->addMinutes(10) : null]);
    foreach ($offers as [$technicianId, $offerStatus]) {
        DB::table('offers')->insert(['round_id' => $round, 'request_id' => $request->id, 'technician_id' => $technicianId, 'status' => $offerStatus,
            'available_at' => $at, 'expires_at' => $at->addMinutes(10), 'responded_at' => in_array($offerStatus, ['accepted', 'rejected'], true) ? $at->addMinutes(2) : null,
            'reference_fee_snapshot' => '80.00', 'created_at' => $at, 'updated_at' => $at]);
    }

    return $round;
}

beforeEach(function () {
    Sprint04::boot($this);
    $this->travelTo(CarbonImmutable::parse(S07A3R_NOW, 'UTC'));
    $this->admin = Sprint02::admin();
});

it('S07-TC-225 la demo deja la línea de tiempo de sus solicitudes y ninguna queda buscando sin ronda abierta ni con semanas de antigüedad [DEF-85]', function () {
    Storage::fake('public');
    $password = Str::password(20);
    $name = DemoSeeder::PASSWORD_VARIABLE;
    putenv("$name=$password");
    $_ENV[$name] = $_SERVER[$name] = $password;
    $this->app['env'] = 'local';
    $this->seed(DemoSeeder::class);
    Sanctum::actingAs(User::query()->where('email', 'demo-admin@example.test')->sole());

    $open = DB::table('service_requests')->whereIn('status', ['sent', 'pending_availability'])->get();
    expect($open)->not->toBeEmpty();
    foreach ($open as $request) {
        $types = collect($this->getJson("/api/v1/admin/requests/{$request->id}")->assertOk()->json('data.timeline'))->pluck('event_type');
        expect($types->all())->toContain('request.registered', 'request.submitted')
            ->and(CarbonImmutable::parse($request->submitted_at, 'UTC')->greaterThan(now()->subDay()))->toBeTrue();
        if ($request->status === 'sent') {
            // Coherente con el barrido: lo que busca técnico tiene una ronda abierta que vence (si no, quedaría «buscando» para siempre).
            expect($types->all())->toContain('round.opened')
                ->and(DB::table('offer_rounds')->where('request_id', $request->id)->where('status', 'open')->where('expires_at', '>', now())->exists())->toBeTrue();
        } else {
            expect($types->all())->toContain('request.pending')
                ->and(CarbonImmutable::parse($request->pending_expires_at, 'UTC')->greaterThan(now()))->toBeTrue();
        }
    }
});

it('S07-TC-226 la línea de tiempo trae el motivo de la intervención y las acciones que no aplican traen su motivo [D-120]', function () {
    $request = Sprint04::sentRequest();
    Sanctum::actingAs($this->admin);
    $this->withHeader('Idempotency-Key', (string) Str::uuid())->postJson("/api/v1/admin/requests/{$request->id}/rematch",
        ['reason' => S07A3R_REASON, 'expected_version' => (int) $request->version])->assertOk();

    $data = $this->getJson("/api/v1/admin/requests/{$request->id}")->assertOk()->json('data');
    $event = collect($data['timeline'])->firstWhere('event_type', 'request.admin_rematched');
    expect($event)->toMatchArray(['reason' => S07A3R_REASON, 'actor' => $this->admin->name])
        ->and($data['actions'])->toBe(['cancel' => true, 'rematch' => true])
        ->and($data['action_reasons'])->toBe(['cancel' => null, 'rematch' => null]);

    $assigned = Sprint04::sentRequest(['status' => 'assigned']);
    $completed = Sprint04::sentRequest(['status' => 'completed']);
    $assignedData = $this->getJson("/api/v1/admin/requests/{$assigned->id}")->assertOk()->json('data');
    $completedData = $this->getJson("/api/v1/admin/requests/{$completed->id}")->assertOk()->json('data');
    expect($assignedData['actions'])->toBe(['cancel' => true, 'rematch' => false])
        ->and($assignedData['action_reasons']['rematch'])->toBe('Ya tiene un técnico asignado: si hace falta, cancélala con motivo.')
        ->and($completedData['actions'])->toBe(['cancel' => false, 'rematch' => false])
        ->and($completedData['action_reasons'])->toBe(['cancel' => 'La solicitud ya terminó.', 'rematch' => 'La solicitud ya terminó.']);

    // Sin el permiso no hay acciones ni motivos: los botones no se muestran (S07-TC-214).
    Sanctum::actingAs(s07a3rWithout('requests.intervene'));
    expect($this->getJson("/api/v1/admin/requests/{$completed->id}")->assertOk()->json('data.action_reasons'))->toBeNull();
});

function s07a3rWithout(string $code): User
{
    $admin = Sprint02::admin();
    Sprint02::revokeFromAdminRole($code);

    return $admin;
}

it('S07-TC-227 el tablero saca del pendiente lo que ya venció y detalla la ronda con abiertas y vencidas [DEF-86]', function () {
    $overdue = Sprint04::sentRequest(['status' => 'pending_availability', 'pending_since' => now()->subHours(24)->subMinutes(10),
        'pending_expires_at' => now()->subMinutes(10)]);
    $pending = Sprint04::sentRequest(['status' => 'pending_availability', 'pending_since' => now()->subHours(4),
        'pending_expires_at' => now()->addHours(20)]);
    $searching = Sprint04::sentRequest(['submitted_at' => now()->subMinutes(12)]);
    s07a3rRound($searching, 1, [[Sprint04::technician()->id, 'pending'], [Sprint04::technician()->id, 'pending'], [Sprint04::technician()->id, 'expired']],
        'open', now()->subMinutes(2));
    Sanctum::actingAs($this->admin);

    $data = $this->getJson('/api/v1/admin/matching/live')->assertOk()->json('data');

    $item = collect($data['searching'])->firstWhere('id', $searching->id);
    expect(collect($data['pending'])->pluck('id')->all())->toBe([(int) $pending->id])
        ->and($data['pending_overdue'])->toHaveCount(1)
        ->and($data['pending_overdue'][0])->toMatchArray(['id' => (int) $overdue->id,
            'pending_expires_at' => CarbonImmutable::parse($overdue->pending_expires_at, 'UTC')->toISOString()])
        ->and($item['specialty_code'])->toBeString()->not->toBeEmpty()
        ->and($item['round'])->toMatchArray(['round_no' => 1, 'open_count' => 2, 'expired_count' => 1]);
});

it('S07-TC-228 cada alerta trae su nivel y el detalle del servicio, y el desempeño bajo aparece como seguimiento [D-118]', function () {
    $old = Sprint04::sentRequest(['submitted_at' => now()->subHours(26)]);
    s07a3rRound($old, 1, [[Sprint04::technician()->id, 'expired']], 'closed', now()->subHours(25));
    s07a3rRound($old, 2, [[Sprint04::technician()->id, 'rejected']], 'closed', now()->subHours(24));
    $recent = Sprint04::sentRequest(['submitted_at' => now()->subMinutes(50)]);
    $expiring = Sprint04::sentRequest(['submitted_at' => now()->subMinutes(5), 'status' => 'pending_availability',
        'pending_since' => now()->subHours(23), 'pending_expires_at' => now()->addMinutes(40)]);
    // Desempeño bajo: 5 ofertas decididas en 30 días, 2 aceptadas y 3 vencidas (umbral de 3 vencidas).
    $weak = Sprint04::technician();
    foreach (['accepted', 'accepted', 'expired', 'expired', 'expired'] as $index => $status) {
        s07a3rRound(Sprint04::sentRequest(['status' => 'expired']), 1, [[$weak->id, $status]], 'closed', now()->subDays($index + 1));
    }
    Sanctum::actingAs($this->admin);

    $items = collect($this->getJson('/api/v1/admin/alerts')->assertOk()->json('data.items'));

    $byRequest = fn (object $request, string $type) => $items->first(fn ($item) => $item['type'] === $type && $item['request_id'] === (int) $request->id);
    $service = DB::table('subcategories as c')->join('specialties as s', 's.id', '=', 'c.specialty_id')->join('service_requests as r', 'r.subcategory_id', '=', 'c.id')
        ->join('districts as d', 'd.id', '=', 'r.district_id')->where('r.id', $old->id)->first(['s.name as specialty', 'c.name as subcategory', 'd.name as district']);
    expect($byRequest($old, 'unassigned'))->toMatchArray(['level' => 'urgent', 'rounds_without_acceptance' => 2,
        'request' => ['specialty' => $service->specialty, 'subcategory' => $service->subcategory, 'district' => $service->district]])
        ->and($byRequest($old, 'expired_chain')['level'])->toBe('attention')
        ->and($byRequest($recent, 'unassigned'))->toMatchArray(['level' => 'attention', 'rounds_without_acceptance' => 0])
        ->and($byRequest($expiring, 'pending_expiring')['level'])->toBe('attention');
    $low = $items->firstWhere('type', 'low_performance');
    expect($low)->toMatchArray(['level' => 'follow_up', 'request_id' => null, 'actions' => ['review'],
        'technician' => ['id' => (int) $weak->id, 'name' => $weak->display_name], 'offers' => 5, 'accepted' => 2, 'expired' => 3])
        ->and($items->pluck('type')->unique()->values()->all())->toBe(['pending_expiring', 'unassigned', 'expired_chain', 'low_performance'])
        ->and($items->count())->toBe($this->getJson('/api/v1/admin/dashboard')->json('data.badges.operational_alerts'));
});

it('S07-TC-240 «Ofertas vencidas (24 h)» cuenta por el vencimiento de la oferta, no por la fecha de la última escritura [DEF-88]', function () {
    // Visto en las capturas: las siembras guardan updated_at con la hora de la siembra y salían ofertas vencidas hace meses.
    $old = Sprint04::sentRequest(['status' => 'expired']);
    s07a3rRound($old, 1, [[Sprint04::technician()->id, 'expired']], 'closed', now()->subDays(90));
    DB::table('offers')->where('request_id', $old->id)->update(['updated_at' => now()]);
    $recent = Sprint04::sentRequest(['submitted_at' => now()->subHours(3)]);
    s07a3rRound($recent, 1, [[Sprint04::technician()->id, 'expired']], 'closed', now()->subHours(2));
    Sanctum::actingAs($this->admin);

    $expired = $this->getJson('/api/v1/admin/matching/live')->assertOk()->json('data.expired_offers');

    expect(collect($expired)->pluck('request_id')->all())->toBe([(int) $recent->id]);
});
