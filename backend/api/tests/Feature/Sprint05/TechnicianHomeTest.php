<?php

// S05-TC-291 a 298 · Panel del técnico, Fase T2 (modo rápido, D-104, D-107 y D-108): GET /technicians/me/home con
// indicadores reales, «Mi día» por franja sin dirección, progreso del perfil, insignias con sus valores límite, estado
// de la verificación, comando local tecnicoya:demo-offer y la historia de demostración del técnico.
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Seeders\DemoTechnicianActivity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    // Jueves 12 de noviembre de 2026, 15:30 en Lima (20:30 UTC).
    $this->travelTo(CarbonImmutable::parse('2026-11-12 15:30:00', 'America/Lima')->utc());
    $this->technician = Sprint04::technician();
    $this->client = ClientProfileFactory::new()->create(['district_id' => Sprint04::district()]);
});

/** Solicitud dirigida con su oferta (y, si se pide, su trabajo y su cita) del técnico dado. */
function s05Job(int $technicianId, int $clientId, string $offerStatus, ?int $seconds, ?string $job = null, ?CarbonImmutable $start = null,
    ?CarbonImmutable $available = null): int
{
    $available ??= now()->subDays(2)->toImmutable();
    $start ??= now()->addDay()->toImmutable();
    $rule = app(RuleBook::class)->currentVersionId();
    $request = DB::table('service_requests')->insertGetId(['client_id' => $clientId, 'subcategory_id' => Sprint04::subcategory(),
        'district_id' => Sprint04::district(), 'description' => 'Solicitud sintética de la Fase T2.', 'address' => 'Jr. Sintético 291',
        'mode' => 'asap', 'source' => 'profile', 'target_technician_id' => $technicianId, 'status' => $job ?? 'expired',
        'rule_version_id' => $rule, 'submitted_at' => $available, 'search_generation' => 1, 'version' => 2]);
    $run = DB::table('matching_runs')->insertGetId(['request_id' => $request, 'search_generation' => 1, 'attempt_no' => 1,
        'run_trigger' => 'submission', 'rule_version_id' => $rule, 'algorithm_version' => 'matching_v2', 'status' => 'completed', 'started_at' => $available]);
    $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request, 'matching_run_id' => $run, 'search_generation' => 1,
        'round_no' => 1, 'kind' => 'direct', 'status' => 'closed', 'opened_at' => $available, 'expires_at' => $available->addMinutes(10)]);
    $offer = DB::table('offers')->insertGetId(['round_id' => $round, 'request_id' => $request, 'technician_id' => $technicianId,
        'status' => $offerStatus, 'available_at' => $available, 'expires_at' => $available->addMinutes(10),
        'responded_at' => $seconds === null ? null : $available->addSeconds($seconds), 'reference_fee_snapshot' => 80]);
    if ($job) {
        $participation = DB::table('participations')->insertGetId(['request_id' => $request, 'technician_id' => $technicianId,
            'offer_id' => $offer, 'status' => $job, 'reference_fee_snapshot' => 80, 'assigned_at' => $available]);
        DB::table('appointments')->insert(['request_id' => $request, 'participation_id' => $participation, 'technician_id' => $technicianId,
            'starts_at' => $start, 'ends_at' => $start->addHours(2), 'status' => $job === 'cancelled' ? 'cancelled' : 'confirmed']);
    }

    return $request;
}

/** Archivo sintético ya revisado (sin contenido real). */
function s05Media(int $ownerId, string $purpose): int
{
    return DB::table('media_files')->insertGetId(['owner_id' => $ownerId, 'purpose' => $purpose, 'disk' => 'local',
        'storage_key' => $purpose.'/'.uniqid('', true), 'original_name' => 'sintetico', 'mime_type' => 'image/webp',
        'byte_size' => 10, 'sha256' => str_repeat('a', 64), 'scan_status' => 'clean']);
}

$lima = fn (string $time) => CarbonImmutable::parse("2026-11-12 $time", 'America/Lima')->utc();

it('S05-TC-291 el Inicio del técnico exige sesión y solo responde al técnico', function () {
    $this->getJson('/api/v1/technicians/me/home')->assertUnauthorized();
    foreach ([$this->client->user, Sprint02::admin()] as $other) {
        Sprint01::forgetSession();
        Sanctum::actingAs($other);
        $this->getJson('/api/v1/technicians/me/home')->assertForbidden();
    }
    Sanctum::actingAs($this->technician->user);
    $this->getJson('/api/v1/technicians/me/home')->assertOk()->assertJsonStructure(['data' => ['verification', 'offers', 'indicators', 'today', 'progress', 'badges']]);
});

it('S05-TC-292 indicadores reales y «Mi día» por franja con sus bordes, sin dirección exacta', function () use ($lima) {
    $id = $this->technician->id;
    $client = $this->client->id;
    s05Job($id, $client, 'accepted', 60, 'in_progress', $lima('11:59'));
    s05Job($id, $client, 'accepted', 60, 'assigned', $lima('12:00'));
    s05Job($id, $client, 'accepted', 60, 'assigned', $lima('18:00'));
    s05Job($id, $client, 'accepted', 60, 'cancelled', $lima('16:00'));
    s05Job($id, $client, 'rejected', 200);
    s05Job($id, $client, 'expired', null);
    s05Job($id, $client, 'expired', null, null, null, now()->subDays(31)->toImmutable()); // fuera de los 30 días
    $tomorrow = s05Job($id, $client, 'accepted', 60, 'assigned', CarbonImmutable::parse('2026-11-13 10:00', 'America/Lima')->utc());
    Sanctum::actingAs($this->technician->user);

    $data = $this->getJson('/api/v1/technicians/me/home')->assertOk()->json('data');
    expect($data['indicators']['jobs_today'])->toBe(3)
        ->and($data['indicators']['offers_answered'])->toBe(6)
        // 5 aceptadas ÷ (6 respondidas + 1 vencida) = 71 %; la vencida de hace 31 días no cuenta.
        ->and($data['indicators']['acceptance_rate'])->toBe(71)
        ->and($data['indicators']['next_visit']['request_id'])->toBe(DB::table('appointments')->where('starts_at', $lima('18:00'))->value('request_id'))
        ->and(array_column($data['today'], 'slot'))->toBe(['morning', 'afternoon', 'night'])
        ->and(json_encode($data))->not->toContain('Jr. Sintético')
        ->and(collect($data['today'])->pluck('request_id'))->not->toContain($tomorrow);
});

it('S05-TC-293 el progreso del perfil lista tareas concretas y llega al 100 % con la insignia «Perfil completo»', function () {
    Sanctum::actingAs($this->technician->user);
    $progress = $this->getJson('/api/v1/technicians/me/home')->json('data.progress');
    $pending = collect($progress['tasks'])->where('done', false)->pluck('code')->all();
    expect($progress['total'])->toBe(8)->and($pending)->toContain('about', 'portfolio', 'photo')
        ->and(collect($progress['tasks'])->firstWhere('code', 'portfolio')['label'])->toBe('Agrega 2 trabajos publicados a tu portafolio')
        ->and($progress['percent'])->toBe((int) round($progress['done'] / 8 * 100));

    DB::table('technician_profiles')->where('id', $this->technician->id)->update(['bio' => str_repeat('Atiendo con garantía. ', 3),
        'base_district_id' => Sprint04::district()]);
    foreach (range(1, 2) as $n) {
        DB::table('portfolio_items')->insert(['technician_id' => $this->technician->id, 'title' => "Trabajo $n", 'status' => 'published']);
    }
    $media = s05Media($this->technician->user_id, 'avatar');
    DB::table('users')->where('id', $this->technician->user_id)->update(['avatar_media_id' => $media]);

    $data = $this->getJson('/api/v1/technicians/me/home')->json('data');
    expect(collect($data['progress']['tasks'])->where('done', false)->pluck('code')->all())->toBe([])
        ->and($data['progress']['percent'])->toBe(100)
        ->and(collect($data['badges'])->firstWhere('code', 'complete_profile')['earned'])->toBeTrue();
});

it('S05-TC-294 «Respuesta rápida» exige 5 respuestas con mediana ≤ 2 min y «Primeros 5 trabajos» exige 5 completados [D-107]', function () {
    $id = $this->technician->id;
    $badge = function (string $code) {
        Sanctum::actingAs($this->technician->user);

        return collect($this->getJson('/api/v1/technicians/me/home')->json('data.badges'))->firstWhere('code', $code);
    };
    foreach ([30, 40, 50, 60] as $seconds) {
        s05Job($id, $this->client->id, 'accepted', $seconds, 'completed', now()->subDays(1)->toImmutable());
    }
    expect($badge('fast_response'))->earned->toBeFalse()->hint->toBe('Responde 1 ofertas más para medirla.')
        ->and($badge('first_jobs'))->earned->toBeFalse()->hint->toBe('Llevas 4 de 5 trabajos completados.');

    // Quinta respuesta: mediana de [30, 40, 50, 60, 120] = 50 s.
    s05Job($id, $this->client->id, 'rejected', 120);
    expect($badge('fast_response')['earned'])->toBeTrue();

    // Borde: mediana exactamente 120 s gana; 121 s no.
    DB::table('offers')->where('technician_id', $id)->update(['responded_at' => DB::raw('DATE_ADD(available_at, INTERVAL 120 SECOND)')]);
    expect($badge('fast_response')['earned'])->toBeTrue();
    DB::table('offers')->where('technician_id', $id)->update(['responded_at' => DB::raw('DATE_ADD(available_at, INTERVAL 121 SECOND)')]);
    expect($badge('fast_response'))->earned->toBeFalse()->hint->toBe('Mediana de tus últimas respuestas: 2 min 01 s.');

    s05Job($id, $this->client->id, 'accepted', 60, 'completed', now()->subDays(1)->toImmutable());
    expect($badge('first_jobs')['earned'])->toBeTrue();
})->skip(fn () => DB::getDriverName() !== 'mysql', 'DATE_ADD es de MySQL; la CI y el slot A usan MySQL.');

it('S05-TC-295 la verificación del menú: aprobado, falta un documento, en revisión y observado [D-106 y D-107]', function () {
    $state = function () {
        Sanctum::actingAs($this->technician->user);

        return $this->getJson('/api/v1/technicians/me/home')->json('data.verification');
    };
    expect($state())->toMatchArray(['state' => 'approved', 'label' => 'Aprobado', 'missing' => []]);

    DB::table('technician_profiles')->where('id', $this->technician->id)->update(['verification_status' => 'pending', 'status' => 'pending_verification']);
    $document = fn (string $type) => DB::table('technician_documents')->insert(['technician_id' => $this->technician->id, 'document_type' => $type,
        'media_id' => s05Media($this->technician->user_id, 'document')]);
    $document('DNI');
    expect($state())->toMatchArray(['state' => 'missing', 'label' => 'Falta un documento', 'missing' => ['Certificado o constancia técnica']]);
    $document('Constancia de estudios técnicos');
    expect($state())->toMatchArray(['state' => 'in_review', 'label' => 'En revisión', 'missing' => []]);
    DB::table('technician_profiles')->where('id', $this->technician->id)->update(['verification_status' => 'rejected']);
    expect($state()['label'])->toBe('Observado');
});

it('S05-TC-296 tecnicoya:demo-offer solo corre en local y solo para técnicos demo [D-108]', function () {
    expect(Artisan::call('tecnicoya:demo-offer', ['email' => 'demo-tecnico-computo@example.test']))->toBe(1)
        ->and(Artisan::output())->toContain('solo corre en desarrollo');
    $environment = $this->app['env'];
    $this->app['env'] = 'local';
    try {
        expect(Artisan::call('tecnicoya:demo-offer', ['email' => $this->technician->user->email]))->toBe(1)
            ->and(Artisan::output())->toContain('Solo se crean ofertas para técnicos demo');
        expect(DB::table('offers')->count())->toBe(0);
    } finally {
        $this->app['env'] = $environment;
    }
});

it('S05-TC-297 tecnicoya:demo-offer crea una oferta pendiente de 10 minutos por el matching real, con su aviso [D-108]', function () {
    DB::table('users')->where('id', $this->technician->user_id)->update(['email' => 'demo-tecnico-prueba@example.test']);
    DB::table('users')->where('id', $this->client->user_id)->update(['email' => 'demo-cliente@example.test']);
    $environment = $this->app['env'];
    $this->app['env'] = 'local';
    try {
        expect(Artisan::call('tecnicoya:demo-offer', ['email' => 'demo-tecnico-prueba@example.test', '--urgent' => true]))->toBe(0);
    } finally {
        $this->app['env'] = $environment;
    }
    $offer = DB::table('offers')->where('technician_id', $this->technician->id)->sole();
    $request = DB::table('service_requests')->find($offer->request_id);
    expect($offer->status)->toBe('pending')
        ->and(CarbonImmutable::parse($offer->available_at)->diffInMinutes(CarbonImmutable::parse($offer->expires_at)))->toEqual(10)
        ->and($request->urgency)->toBe('urgente')->and($request->description)->toContain('(demostración)')
        ->and(DB::table('notifications')->where('user_id', $this->technician->user_id)->where('type', 'offer.created')->exists())->toBeTrue();

    Sanctum::actingAs($this->technician->user->fresh());
    expect($this->getJson('/api/v1/technicians/me/home')->json('data.offers.pending'))->toBe(1)
        ->and($this->getJson('/api/v1/offers?status=pending')->json('data.items.0.request.specialty.name'))->toBe('Cómputo');
});

it('S05-TC-298 la historia de demostración llena el Inicio: visitas de hoy, tasa y las dos insignias de actividad', function () {
    app(DemoTechnicianActivity::class)->run($this->technician->id, [$this->client->id]);
    app(DemoTechnicianActivity::class)->run($this->technician->id, [$this->client->id]); // no se duplica
    Sanctum::actingAs($this->technician->user);
    $data = $this->getJson('/api/v1/technicians/me/home')->json('data');
    $badges = collect($data['badges'])->pluck('earned', 'code');
    expect(DB::table('offers')->where('technician_id', $this->technician->id)->count())->toBe(12)
        ->and($data['indicators']['jobs_today'])->toBe(2)
        ->and($data['indicators']['acceptance_rate'])->toBe(75)
        ->and($badges['fast_response'])->toBeTrue()->and($badges['first_jobs'])->toBeTrue()
        ->and(DB::table('service_requests')->where('target_technician_id', $this->technician->id)->where('description', 'not like', '%(demostración)%')->count())->toBe(0);
});
