<?php

// S07-TC-199 a 208 y 210 · Panel del administrador, Fase A3 (Operación, PLAN-PANEL-ADMIN.md): detalle completo de la
// solicitud, intervención de D-116 con las reglas de D-120 (cancelar con motivo y reenviar al emparejamiento), CSV de la
// vista filtrada, tablero de emparejamiento en vivo con su canal privado y alertas operativas priorizadas (D-118).
// Datos sintéticos; el reloj se fija con travelTo después de la versión 4 de las reglas.
use App\Models\User;
use App\Modules\BMatching\Jobs\PrepareMatching;
use App\Modules\CNotifications\Events\OutboxBroadcast;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\UserFactory;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

const S07A3_NOW = '2026-11-25 15:00:00';
const S07A3_REASON = 'El cliente pidió por teléfono anular la visita (sintético).';

/** Solicitud con una ronda real abierta (dos técnicos con oferta pendiente) del matching del S4. */
function s07a3Searching(): object
{
    Sprint04::technician();
    Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);

    return DB::table('service_requests')->find($request->id);
}

/** Solicitud asignada: un técnico acepta y el cliente lo elige con el flujo real. */
function s07a3Assigned(object $test): array
{
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $offer = Sprint04::offerTo($request->id, $technician->id);
    Sprint04::respond($test, $technician, $offer, 'accept')->assertOk();
    Sprint01::forgetSession();
    Sanctum::actingAs(Sprint04::clientUser($request));
    Sprint04::select($test, DB::table('service_requests')->find($request->id), $offer->id)->assertOk();
    Sprint01::forgetSession();

    return [DB::table('service_requests')->find($request->id), $technician];
}

function s07a3Intervene(object $test, object $request, string $action, array $body = [], ?string $key = null)
{
    return $test->withHeader('Idempotency-Key', $key ?? (string) Str::uuid())->postJson("/api/v1/admin/requests/{$request->id}/$action",
        $body + ['reason' => S07A3_REASON, 'expected_version' => (int) DB::table('service_requests')->where('id', $request->id)->value('version')]);
}

function s07a3WithoutPermission(string $code): User
{
    $admin = Sprint02::admin();
    Sprint02::revokeFromAdminRole($code);

    return $admin;
}

beforeEach(function () {
    Sprint04::boot($this);
    $this->travelTo(CarbonImmutable::parse(S07A3_NOW, 'UTC'));
    $this->admin = Sprint02::admin();
});

describe('Detalle de la solicitud', function () {
    it('S07-TC-199 trae cliente sin datos sensibles, servicio con subcategorías, ofertas con tiempos, técnico y acciones permitidas [D-120]', function () {
        $request = s07a3Searching();
        $offer = DB::table('offers')->where('request_id', $request->id)->orderBy('id')->first();
        DB::table('offers')->where('id', $offer->id)->update(['status' => 'rejected', 'responded_at' => CarbonImmutable::parse($offer->available_at)->addSeconds(95)]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/requests/{$request->id}")->assertOk();
        $data = $response->json('data');

        expect(array_keys($data['client']))->toEqualCanonicalizing(['id', 'name', 'district', 'plan'])
            ->and($data['request']['version'])->toBe((int) $request->version)
            ->and($data['request']['subcategories'])->toBeArray()->not->toBeEmpty()
            ->and($data['offer_list'])->toHaveCount(2)
            ->and($data['offer_list'][0])->toMatchArray(['status' => 'rejected', 'round_no' => 1, 'response_seconds' => 95])
            ->and(array_keys($data['offer_list'][0]))->toContain('technician', 'available_at', 'expires_at', 'responded_at')
            ->and($data['actions'])->toBe(['cancel' => true, 'rematch' => true]);
        $client = Sprint04::clientUser($request);
        expect($response->getContent())->not->toContain($client->email)
            ->and($response->getContent())->not->toContain('Jirón sintético 742');

        // Sin requests.intervene se ve el detalle, pero sin acciones.
        Sprint01::forgetSession();
        $limited = s07a3WithoutPermission('requests.intervene');
        expect($this->actingAs($limited)->getJson("/api/v1/admin/requests/{$request->id}")->assertOk()->json('data.actions'))
            ->toBe(['cancel' => false, 'rematch' => false]);
    });
});

describe('Intervención (D-116 y D-120)', function () {
    it('S07-TC-200 cancelar en búsqueda retira las ofertas, deja el motivo, audita y avisa al cliente; con técnico asignado también a él, sin el motivo', function () {
        $request = s07a3Searching();
        Sanctum::actingAs($this->admin);
        s07a3Intervene($this, $request, 'cancellation')->assertOk()->assertJsonPath('data.status', 'cancelled');

        $row = DB::table('service_requests')->find($request->id);
        expect($row->cancellation_reason_code)->toBe('admin_intervention')
            ->and($row->cancellation_reason)->toBe(S07A3_REASON)
            ->and(DB::table('offers')->where('request_id', $request->id)->pluck('status')->unique()->all())->toBe(['withdrawn'])
            ->and(Sprint04::events($request->id, 'request.admin_cancelled'))->toBe(1)
            ->and(DB::table('audit_entries')->where('action', 'request.admin_cancelled')->where('subject_id', $request->id)->value('reason'))->toBe(S07A3_REASON)
            ->and(DB::table('notifications')->where('user_id', Sprint04::clientUser($request)->id)->where('type', 'request.admin_cancelled')->count())->toBe(1);

        [$assigned, $technician] = s07a3Assigned($this);
        Sanctum::actingAs($this->admin);
        s07a3Intervene($this, $assigned, 'cancellation')->assertOk();
        $notice = DB::table('notifications')->where('user_id', $technician->user_id)->where('type', 'request.cancelled')->orderByDesc('id')->first();
        expect(DB::table('participations')->where('request_id', $assigned->id)->value('status'))->toBe('cancelled')
            ->and(DB::table('appointments')->where('request_id', $assigned->id)->value('status'))->toBe('cancelled')
            ->and($notice)->not->toBeNull()
            ->and($notice->body.$notice->title)->not->toContain('teléfono');
    });

    it('S07-TC-201 cancelar exige motivo de 10 a 500, versión vigente e Idempotency-Key, y no se repite con la misma clave', function () {
        $request = s07a3Searching();
        Sanctum::actingAs($this->admin);
        Sprint01::assertSpanishValidation(s07a3Intervene($this, $request, 'cancellation', ['reason' => 'Muy corto']), ['reason']);
        Sprint01::assertSpanishValidation(s07a3Intervene($this, $request, 'cancellation', ['reason' => str_repeat('a', 501)]), ['reason']);
        s07a3Intervene($this, $request, 'cancellation', ['expected_version' => 1])->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');
        $this->postJson("/api/v1/admin/requests/{$request->id}/cancellation", ['reason' => S07A3_REASON, 'expected_version' => (int) $request->version])
            ->assertUnprocessable();

        $key = (string) Str::uuid();
        $first = s07a3Intervene($this, $request, 'cancellation', ['reason' => 'Diez letra'], $key)->assertOk()->json('data');
        $again = $this->withHeader('Idempotency-Key', $key)->postJson("/api/v1/admin/requests/{$request->id}/cancellation",
            ['reason' => 'Diez letra', 'expected_version' => (int) $request->version])->assertOk()->json('data');
        expect($again)->toBe($first)
            ->and(DB::table('audit_entries')->where('action', 'request.admin_cancelled')->count())->toBe(1);
    });

    it('S07-TC-202 reenviar sube la generación, usa las reglas vigentes, retira las ofertas abiertas y prepara una ronda nueva; el pendiente conserva su plazo', function () {
        $request = s07a3Searching();
        DB::table('service_requests')->where('id', $request->id)->update(['rule_version_id' => DB::table('rule_versions')->where('version_no', 2)->value('id')]);
        Queue::fake();
        Sanctum::actingAs($this->admin);

        s07a3Intervene($this, $request, 'rematch')->assertOk()->assertJsonPath('data.status', 'sent');

        $row = DB::table('service_requests')->find($request->id);
        expect((int) $row->search_generation)->toBe((int) $request->search_generation + 1)
            ->and((int) $row->rule_version_id)->toBe(app(RuleBook::class)->currentVersionId())
            ->and(DB::table('offers')->where('request_id', $request->id)->pluck('status')->unique()->all())->toBe(['withdrawn'])
            ->and(DB::table('offer_rounds')->where('request_id', $request->id)->where('status', '<>', 'closed')->count())->toBe(0)
            ->and(Sprint04::events($request->id, 'request.admin_rematched'))->toBe(1)
            ->and(DB::table('audit_entries')->where('action', 'request.admin_rematched')->count())->toBe(1)
            ->and(DB::table('notifications')->where('user_id', Sprint04::clientUser($request)->id)->where('type', 'request.admin_rematched')->count())->toBe(1);
        Queue::assertPushed(PrepareMatching::class, fn (PrepareMatching $job) => $job->requestId === (int) $request->id
            && $job->generation === (int) $row->search_generation);

        $pending = Sprint04::sentRequest(['status' => 'pending_availability', 'pending_since' => now()->subHours(20), 'pending_expires_at' => now()->addHours(4)]);
        s07a3Intervene($this, $pending, 'rematch')->assertOk();
        $after = DB::table('service_requests')->find($pending->id);
        expect($after->status)->toBe('sent')
            ->and(CarbonImmutable::parse($after->pending_expires_at)->equalTo(now()->addHours(4)))->toBeTrue();
    });

    it('S07-TC-203 no se interviene fuera de los estados de D-120 y no existe la asignación manual', function () {
        [$assigned] = s07a3Assigned($this);
        Sanctum::actingAs($this->admin);
        s07a3Intervene($this, $assigned, 'rematch')->assertConflict()->assertJsonPath('error.code', 'INTERVENTION_NOT_ALLOWED');
        foreach (['in_progress', 'completed', 'cancelled', 'expired'] as $status) {
            $request = Sprint04::sentRequest(['status' => $status]);
            s07a3Intervene($this, $request, 'cancellation')->assertConflict()->assertJsonPath('error.code', 'INTERVENTION_NOT_ALLOWED');
            s07a3Intervene($this, $request, 'rematch')->assertConflict();
        }
        $this->postJson("/api/v1/admin/requests/{$assigned->id}/assignment", ['technician_id' => 1])->assertNotFound();
        expect(DB::table('audit_entries')->where('action', 'like', 'request.admin_%')->count())->toBe(0);
    });

    it('S07-TC-204 cliente, técnico y administrador sin requests.intervene reciben 403 al intervenir; sin dashboard.view, 403 en el CSV, el tablero y las alertas', function () {
        $request = s07a3Searching();
        foreach ([ClientProfileFactory::new()->create()->user, Sprint04::technician()->user, s07a3WithoutPermission('requests.intervene')] as $actor) {
            Sprint01::forgetSession();
            Sanctum::actingAs($actor);
            s07a3Intervene($this, $request, 'cancellation')->assertForbidden();
            s07a3Intervene($this, $request, 'rematch')->assertForbidden();
        }
        Sprint01::forgetSession();
        Sanctum::actingAs(s07a3WithoutPermission('dashboard.view'));
        foreach (['/api/v1/admin/requests/export', '/api/v1/admin/matching/live', '/api/v1/admin/alerts'] as $path) {
            $this->getJson($path)->assertForbidden();
        }
        expect(DB::table('service_requests')->where('id', $request->id)->value('status'))->toBe('sent');
    });
});

it('S07-TC-205 el CSV exporta la vista filtrada sin datos personales, con BOM y «;», neutraliza fórmulas y queda auditado', function () {
    $technician = Sprint04::technician();
    DB::table('technician_profiles')->where('id', $technician->id)->update(['display_name' => '=HYPERLINK("http://x")']);
    $assigned = Sprint04::sentRequest(['status' => 'assigned']);
    DB::table('participations')->insert(['request_id' => $assigned->id, 'technician_id' => $technician->id, 'slot' => 'primary',
        'status' => 'assigned', 'reference_fee_snapshot' => '80.00', 'assigned_at' => now()]);
    Sprint04::sentRequest(['status' => 'cancelled']);
    Sanctum::actingAs($this->admin);

    $response = $this->get('/api/v1/admin/requests/export?status=assigned')->assertOk();

    expect($response->headers->get('Content-Type'))->toContain('text/csv')
        ->and($response->headers->get('Content-Disposition'))->toContain('attachment')->toContain('.csv');
    $body = $response->streamedContent();
    $lines = array_values(array_filter(explode("\r\n", $body)));
    expect(str_starts_with($body, "\u{FEFF}"))->toBeTrue()
        ->and($lines)->toHaveCount(2)
        ->and($lines[0])->toContain('Número;Estado;Especialidad;Subcategoría;Distrito;Técnico;Creada;Enviada')
        ->and($lines[1])->toStartWith((string) $assigned->id.';Asignada;')
        ->and($lines[1])->toContain("'=HYPERLINK")
        ->and($body)->not->toContain(Sprint04::clientUser($assigned)->email)
        ->and($body)->not->toContain('Jirón sintético');
    $audit = DB::table('audit_entries')->where('action', 'requests.exported')->first();
    expect($audit)->not->toBeNull()->and(json_decode($audit->after_values, true))->toMatchArray(['filters' => ['status' => 'assigned'], 'rows' => 1]);
});

it('S07-TC-206 el tablero en vivo trae las solicitudes en búsqueda con su ronda, ofertas abiertas con vencimiento, vencidas de 24 h y pendientes', function () {
    $searching = s07a3Searching();
    $expired = Sprint04::sentRequest(['status' => 'pending_availability', 'pending_since' => now()->subHours(5), 'pending_expires_at' => now()->addHours(19)]);
    Sprint04::sentRequest(['status' => 'assigned']);
    Sanctum::actingAs($this->admin);

    $data = $this->getJson('/api/v1/admin/matching/live')->assertOk()->json('data');

    $item = collect($data['searching'])->firstWhere('id', $searching->id);
    expect($data)->toHaveKeys(['searching', 'pending', 'expired_offers', 'server_time'])
        ->and($item['round'])->toMatchArray(['round_no' => 1, 'status' => 'open'])
        ->and($item['open_offers'])->toHaveCount(2)
        ->and(array_keys($item['open_offers'][0]))->toContain('technician', 'expires_at')
        ->and(collect($data['pending'])->pluck('id')->all())->toBe([(int) $expired->id])
        ->and(collect($data['searching'])->pluck('id')->all())->not->toContain((int) $expired->id);
    $content = json_encode($data);
    expect($content)->not->toContain('Jirón sintético')->and($content)->not->toContain('@example');

    // Una oferta vencida aparece en las vencidas de las últimas 24 h.
    DB::table('offers')->where('request_id', $searching->id)->limit(1)->update(['status' => 'expired', 'updated_at' => now()]);
    $again = $this->getJson('/api/v1/admin/matching/live')->assertOk()->json('data');
    expect($again['expired_offers'])->toHaveCount(1)->and($again['expired_offers'][0]['request_id'])->toBe((int) $searching->id);
});

it('S07-TC-207 las alertas operativas salen priorizadas con su acción y coinciden con el contador del menú [D-118]', function () {
    $old = Sprint04::sentRequest(['submitted_at' => now()->subMinutes(50)]);
    $older = Sprint04::sentRequest(['submitted_at' => now()->subMinutes(90)]);
    $expiring = Sprint04::sentRequest(['submitted_at' => now()->subMinutes(5), 'status' => 'pending_availability', 'pending_since' => now()->subHours(23),
        'pending_expires_at' => now()->addMinutes(40)]);
    Sanctum::actingAs($this->admin);

    $data = $this->getJson('/api/v1/admin/alerts')->assertOk()->json('data');

    expect($data['available'])->toBeTrue()
        ->and(collect($data['items'])->map(fn ($item) => [$item['type'], $item['request_id']])->all())->toBe([
            ['pending_expiring', (int) $expiring->id], ['unassigned', (int) $older->id], ['unassigned', (int) $old->id],
        ])
        ->and($data['items'][0]['actions'])->toBe(['open', 'rematch'])
        ->and($data['items'][1]['minutes'])->toBe(90)
        ->and(count($data['items']))->toBe($this->getJson('/api/v1/admin/dashboard')->json('data.badges.operational_alerts'));

    $this->travelTo(CarbonImmutable::parse('2026-11-20 15:00:00', 'UTC'));
    expect($this->getJson('/api/v1/admin/alerts')->assertOk()->json('data'))->toMatchArray(['available' => false, 'items' => []]);
});

it('S07-TC-208 el canal privado admin.matching solo autoriza a administradores con dashboard.view y recibe una señal sin datos personales', function () {
    $channel = 'private-admin.matching';
    $post = fn () => $this->postJson('/api/v1/broadcasting/auth', ['socket_id' => '1234.5678', 'channel_name' => $channel]);
    Sanctum::actingAs($this->admin);
    $post()->assertOk()->assertJsonStructure(['auth']);
    foreach ([ClientProfileFactory::new()->create()->user, Sprint04::technician()->user, s07a3WithoutPermission('dashboard.view')] as $actor) {
        Sprint01::forgetSession();
        Sanctum::actingAs($actor);
        $post()->assertForbidden();
    }

    Event::fake([OutboxBroadcast::class]);
    $request = s07a3Searching();
    $this->artisan('tecnicoya:sweep')->assertSuccessful();
    $signals = collect(Event::dispatched(OutboxBroadcast::class))->map(fn ($call) => $call[0])
        ->filter(fn (OutboxBroadcast $event) => $event->broadcastOn()[0]->name === $channel);
    expect($signals)->not->toBeEmpty()
        ->and($signals->first()->broadcastAs())->toBe('matching.changed')
        ->and(array_keys($signals->first()->broadcastWith()))->toEqualCanonicalizing(['event_id', 'request_id'])
        ->and($signals->pluck('payload.request_id')->unique()->all())->toBe([(int) $request->id]);
});

it('S07-TC-210 el DemoSeeder deja contenido en Solicitudes, el tablero en vivo y las alertas', function () {
    Storage::fake('public');
    $password = Str::password(20);
    $name = DemoSeeder::PASSWORD_VARIABLE;
    putenv("$name=$password");
    $_ENV[$name] = $_SERVER[$name] = $password;
    $this->app['env'] = 'local';
    $this->travelTo(CarbonImmutable::parse(S07A3_NOW, 'UTC')->addMinutes(7));
    $this->seed(DemoSeeder::class);
    Sanctum::actingAs(User::query()->where('email', 'demo-admin@example.test')->sole());

    $live = $this->getJson('/api/v1/admin/matching/live')->assertOk()->json('data');
    $alerts = $this->getJson('/api/v1/admin/alerts')->assertOk()->json('data.items');

    expect(collect($live['searching'])->filter(fn ($item) => count($item['open_offers']) > 0))->not->toBeEmpty()
        ->and($live['pending'])->not->toBeEmpty()
        ->and($live['expired_offers'])->not->toBeEmpty()
        ->and(collect($alerts)->pluck('type')->unique()->sort()->values()->all())
            ->toBe(['expired_chain', 'iot_unattended', 'pending_expiring', 'unassigned']);
});
