<?php

// S04-TC-129 a 132 · Transversal (datos y herramientas de prueba) · D-59, D-70: Sprint04E2ESeeder y las tareas de
// Cypress (php artisan tecnicoya:e2e) solo corren en la base de un slot, dejan los datos del contrato S4 §9 y mueven
// el reloj del servidor del slot. La guarda solo lee la configuración (como S03-TC-085): se le presenta el nombre del
// slot A y la conexión abierta sigue en la base real de pruebas, cuyas escrituras revierte RefreshDatabase.
use App\Modules\CNotifications\Events\OutboxBroadcast;
use App\Shared\Testing\E2EClock;
use Illuminate\Support\Facades\Event;
use Carbon\CarbonImmutable;
use Database\Seeders\SeedingRefused;
use Database\Seeders\Sprint04E2ESeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

function s04Env(string $name, ?string $value): void
{
    putenv($value === null ? $name : "$name=$value");
    if ($value === null) {
        unset($_ENV[$name], $_SERVER[$name]);
    } else {
        $_ENV[$name] = $_SERVER[$name] = $value;
    }
}

beforeEach(function () {
    s04Env('TECNICOYA_E2E_PASSWORD', str_repeat('s', 32));
    Storage::fake('local');
    Event::fake([OutboxBroadcast::class]); // la publicación por Reverb se prueba en RealtimeTest
    $this->travelTo(CarbonImmutable::parse(Sprint04::NOW, 'UTC'));
    expect(DB::connection()->getDatabaseName())->toEndWith('_testing');
    config(['database.connections.mysql.database' => 'tecnicoya_testing']);
});

afterEach(function () {
    s04Env('TECNICOYA_E2E_PASSWORD', null);
    s04Env('TECNICOYA_E2E_CLOCK', null);
    @unlink(E2EClock::file());
});

/** Solicitudes del cliente E2E indicado con el estado de su búsqueda. */
function s04E2ERequests(string $client): array
{
    return DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
        ->join('users as u', 'u.id', '=', 'c.user_id')->where('u.email', "e2e-client-$client@example.test")
        ->orderBy('r.id')->get(['r.id', 'r.status', 'r.mode', 'r.source'])->all();
}

function s04OfferStatus(int $requestId, string $technician): ?string
{
    return DB::table('offers as o')->join('technician_profiles as t', 't.id', '=', 'o.technician_id')->join('users as u', 'u.id', '=', 't.user_id')
        ->where('o.request_id', $requestId)->where('u.email', "e2e-technician-$technician@example.test")->value('o.status');
}

it('S04-TC-129 rechaza el seeder y las tareas E2E fuera de la base de un slot', function () {
    config(['database.connections.mysql.database' => 'tecnicoya']);
    $queries = 0;
    DB::listen(function () use (&$queries) {
        $queries++;
    });

    expect(fn () => (new Sprint04E2ESeeder)->run(app(App\Modules\BMatching\Application\MatchingFlow::class),
        app(App\Modules\BMatching\Application\OfferResponses::class), app(App\Shared\Rules\RuleBook::class)))
        ->toThrow(SeedingRefused::class, '«tecnicoya»')
        ->and(fn () => $this->artisan('tecnicoya:e2e', ['task' => 'clock', 'argument' => '+10m'])->run())
        ->toThrow(SeedingRefused::class, '«tecnicoya»');
    expect($queries)->toBe(0)->and(is_file(E2EClock::file()))->toBeFalse();
});

it('S04-TC-130 siembra los datos del contrato S4 §9 y es idempotente', function () {
    $this->seed(Sprint04E2ESeeder::class);
    $this->seed(Sprint04E2ESeeder::class);

    [$scheduled, $asap] = s04E2ERequests('match');
    $direct = s04E2ERequests('direct')[0];
    $round = DB::table('offer_rounds')->where('request_id', $scheduled->id)->first();
    expect($scheduled->mode)->toBe('scheduled')->and($round->status)->toBe('awaiting_choice')
        ->and(s04OfferStatus($scheduled->id, 'frio'))->toBe('accepted')
        ->and(s04OfferStatus($scheduled->id, 'busy'))->toBe('accepted')
        ->and(s04OfferStatus($asap->id, 'frio'))->toBe('pending')
        ->and([$direct->source, s04OfferStatus($direct->id, 'electro')])->toBe(['profile', 'pending'])
        ->and(array_column(s04E2ERequests('pending'), 'status'))->toBe(['pending_availability'])
        ->and(DB::table('appointments as a')->join('technician_profiles as t', 't.id', '=', 'a.technician_id')
            ->join('users as u', 'u.id', '=', 't.user_id')->where('u.email', 'e2e-technician-busy@example.test')->count())->toBe(1)
        ->and(count(s04E2ERequests('match')))->toBe(2);
});

it('S04-TC-131 adelanta y repone el reloj del servidor del slot', function () {
    s04Env('TECNICOYA_E2E_CLOCK', '1');

    $this->artisan('tecnicoya:e2e', ['task' => 'clock', 'argument' => '+10m'])->expectsOutputToContain('"offset_seconds":600')->assertSuccessful();
    $this->artisan('tecnicoya:e2e', ['task' => 'clock', 'argument' => '+90s'])->expectsOutputToContain('"offset_seconds":690')->assertSuccessful();
    E2EClock::install();
    $shifted = CarbonImmutable::now()->getTimestamp() - (new DateTimeImmutable('now'))->getTimestamp();
    $this->artisan('tecnicoya:e2e', ['task' => 'clock', 'argument' => 'reset'])->expectsOutputToContain('"offset_seconds":0')->assertSuccessful();

    expect(E2EClock::enabled())->toBeTrue()
        ->and($shifted)->toBeGreaterThanOrEqual(689)->toBeLessThanOrEqual(691)
        ->and(E2EClock::offset())->toBe(0)
        ->and(fn () => E2EClock::shift('+10x'))->toThrow(InvalidArgumentException::class);
});

it('S04-TC-132 abre una ronda dirigida al técnico indicado y vacía la cola', function () {
    $this->seed(Sprint04E2ESeeder::class);

    $this->artisan('tecnicoya:e2e', ['task' => 'open-round', 'argument' => 'e2e-technician-electro@example.test'])
        ->expectsOutputToContain('"status":"pending"')->assertSuccessful();
    $this->artisan('tecnicoya:e2e', ['task' => 'jobs'])->expectsOutputToContain('"pending_jobs":0')->assertSuccessful();
    $this->artisan('tecnicoya:e2e', ['task' => 'open-round', 'argument' => 'nadie@example.test'])->assertFailed();

    $directs = array_filter(s04E2ERequests('direct'), fn ($r) => $r->source === 'profile');
    $latest = end($directs);
    expect(count($directs))->toBe(2)
        ->and(DB::table('offer_rounds')->where('request_id', $latest->id)->value('kind'))->toBe('direct')
        ->and(s04OfferStatus($latest->id, 'electro'))->toBe('pending');
});

it('S04-TC-137 republica dos veces el mismo evento real de una solicitud del cliente sin escribir en la base [TC-055]', function () {
    $this->seed(Sprint04E2ESeeder::class);
    $this->artisan('tecnicoya:e2e', ['task' => 'open-round', 'argument' => 'e2e-technician-electro@example.test'])->assertSuccessful();
    $this->artisan('tecnicoya:e2e', ['task' => 'jobs'])->assertSuccessful();
    $requestIds = DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
        ->join('users as u', 'u.id', '=', 'c.user_id')->where('u.email', 'e2e-client-direct@example.test')->pluck('r.id')->all();
    $expected = DB::table('outbox_events')->whereNotNull('published_at')
        ->whereIn('channel', array_map(fn ($id) => "requests.$id", $requestIds))->orderByDesc('id')->first();
    expect($expected)->not->toBeNull();
    $tables = ['outbox_events', 'outbox_deliveries', 'service_requests', 'offers', 'offer_rounds', 'notifications'];
    $before = collect($tables)->mapWithKeys(fn ($t) => [$t => DB::table($t)->get()->toJson()])->all();
    Event::fake([OutboxBroadcast::class]);

    $this->artisan('tecnicoya:e2e', ['task' => 'replay', 'argument' => 'e2e-client-direct@example.test'])
        ->expectsOutputToContain('"event_id":"'.$expected->event_id.'"')->assertSuccessful();

    $payload = json_decode($expected->payload, true);
    $sent = [];
    Event::assertDispatched(OutboxBroadcast::class, function (OutboxBroadcast $event) use (&$sent) {
        $sent[] = [$event->channel, $event->type, $event->payload];

        return true;
    });
    expect($sent)->toEqual(array_fill(0, 2, [$expected->channel, $expected->event_type, $payload]))
        ->and($payload['event_id'])->toBe($expected->event_id)
        ->and(collect($tables)->mapWithKeys(fn ($t) => [$t => DB::table($t)->get()->toJson()])->all())->toBe($before);

    // Con el id de la solicitud se elige el evento de esa solicitud aunque el cliente tenga otras más recientes.
    $older = DB::table('outbox_events')->whereNotNull('published_at')->where('channel', '!=', $expected->channel)
        ->whereIn('channel', array_map(fn ($id) => "requests.$id", $requestIds))->orderByDesc('id')->first();
    expect($older)->not->toBeNull();
    $olderRequest = (string) json_decode($older->payload, true)['request_id'];
    $this->artisan('tecnicoya:e2e', ['task' => 'replay', 'argument' => $olderRequest])
        ->expectsOutputToContain('"event_id":"'.$older->event_id.'"')->assertSuccessful();

    $this->artisan('tecnicoya:e2e', ['task' => 'replay', 'argument' => 'e2e-technician-electro@example.test'])->assertFailed();
    $this->artisan('tecnicoya:e2e', ['task' => 'replay', 'argument' => 'nadie@example.test'])->assertFailed();
    $this->artisan('tecnicoya:e2e', ['task' => 'replay', 'argument' => '999999'])->assertFailed();
    config(['database.connections.mysql.database' => 'tecnicoya']);
    expect(fn () => $this->artisan('tecnicoya:e2e', ['task' => 'replay', 'argument' => 'e2e-client-direct@example.test'])->run())
        ->toThrow(SeedingRefused::class, '«tecnicoya»');
});
