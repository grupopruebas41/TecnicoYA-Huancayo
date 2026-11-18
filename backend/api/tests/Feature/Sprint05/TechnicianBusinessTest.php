<?php

// S05-TC-331 a 339 · Panel del técnico, Fase T4 (modo rápido, D-104, D-106 y D-107): estadísticas por semana y por mes
// (solo del propio técnico), verificación con el estado de cada documento obligatorio y sin fuga a otros usuarios,
// orden del portafolio, texto alternativo obligatorio en las imágenes nuevas, documentos de la demo e historial demo.
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\DemoSeeder;
use Database\Seeders\DemoTechnicianActivity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Storage::fake('local');
    Storage::fake('public');
    // Jueves 12 de noviembre de 2026, 15:30 en Lima (20:30 UTC).
    $this->travelTo(CarbonImmutable::parse('2026-11-12 15:30:00', 'America/Lima')->utc());
    $this->technician = Sprint04::technician();
    $this->client = ClientProfileFactory::new()->create(['district_id' => Sprint04::district()]);
});

/**
 * Oferta del técnico publicada en $available (hora de Lima), con su respuesta a los $seconds y, si se pide, un trabajo
 * completado en $completed (hora de Lima).
 */
function s05T4Offer(int $technicianId, int $clientId, string $status, string $available, ?int $seconds = null, ?string $completed = null): int
{
    $rule = app(RuleBook::class)->currentVersionId();
    $at = CarbonImmutable::parse($available, 'America/Lima')->utc();
    $request = DB::table('service_requests')->insertGetId(['client_id' => $clientId, 'subcategory_id' => Sprint04::subcategory(),
        'district_id' => Sprint04::district(), 'description' => 'Solicitud sintética de la Fase T4.', 'address' => 'Jr. Sintético 331',
        'mode' => 'asap', 'source' => 'profile', 'target_technician_id' => $technicianId, 'status' => $completed ? 'completed' : 'expired',
        'rule_version_id' => $rule, 'submitted_at' => $at, 'search_generation' => 1, 'version' => 2]);
    $run = DB::table('matching_runs')->insertGetId(['request_id' => $request, 'search_generation' => 1, 'attempt_no' => 1,
        'run_trigger' => 'submission', 'rule_version_id' => $rule, 'algorithm_version' => 'matching_v2', 'status' => 'completed', 'started_at' => $at]);
    $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request, 'matching_run_id' => $run, 'search_generation' => 1,
        'round_no' => 1, 'kind' => 'direct', 'status' => 'closed', 'opened_at' => $at, 'expires_at' => $at->addMinutes(10)]);
    $offer = DB::table('offers')->insertGetId(['round_id' => $round, 'request_id' => $request, 'technician_id' => $technicianId,
        'status' => $status, 'available_at' => $at, 'expires_at' => $at->addMinutes(10),
        'responded_at' => $seconds === null ? null : $at->addSeconds($seconds), 'reference_fee_snapshot' => 80]);
    if ($completed) {
        $done = CarbonImmutable::parse($completed, 'America/Lima')->utc();
        DB::table('participations')->insert(['request_id' => $request, 'technician_id' => $technicianId, 'offer_id' => $offer,
            'status' => 'completed', 'reference_fee_snapshot' => 80, 'assigned_at' => $at->addMinutes(20),
            'started_at' => $done->subHours(2), 'completed_at' => $done]);
    }

    return $offer;
}

/** Documento de verificación del técnico, con su tipo declarado, estado y nota del revisor. */
function s05T4Document(object $technician, string $type, string $status = 'pending', ?string $note = null): int
{
    return TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id, 'document_type' => $type,
        'review_status' => $status, 'review_note' => $note])->id;
}

/** Imagen pública propia, apta para el portafolio. */
function s05T4Image(object $technician): int
{
    return MediaFileFactory::new()->publicImage()->create(['owner_id' => $technician->user_id])->id;
}

it('S05-TC-331 las estadísticas por semana dan 8 semanas de lunes a domingo (Lima) con tasa, tiempo medio, completados y vencidas', function () {
    $id = $this->technician->id;
    s05T4Offer($id, $this->client->id, 'accepted', '2026-11-10 10:00', 60, '2026-11-11 12:00');
    s05T4Offer($id, $this->client->id, 'rejected', '2026-11-11 09:00', 120);
    s05T4Offer($id, $this->client->id, 'expired', '2026-11-11 18:00');
    // Domingo 8 a las 23:30 en Lima (ya es lunes en UTC): cuenta en la semana anterior.
    s05T4Offer($id, $this->client->id, 'accepted', '2026-11-08 23:30', 30);
    // Hace 9 semanas: fuera del período.
    s05T4Offer($id, $this->client->id, 'accepted', '2026-09-14 10:00', 30);
    // Pendiente: todavía no cuenta en la tasa.
    s05T4Offer($id, $this->client->id, 'pending', '2026-11-12 15:25');
    Sanctum::actingAs($this->technician->user);

    $stats = $this->getJson('/api/v1/technicians/me/stats?period=week')->assertOk()->json('data');
    $buckets = collect($stats['buckets'])->keyBy('key');
    expect($stats['period'])->toBe('week')
        ->and(array_column($stats['buckets'], 'key'))->toBe(['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19',
            '2026-10-26', '2026-11-02', '2026-11-09'])
        ->and($buckets['2026-11-09'])->toMatchArray(['accepted' => 1, 'rejected' => 1, 'expired' => 1, 'completed' => 1,
            'acceptance_rate' => 33, 'avg_response_seconds' => 90])
        ->and($buckets['2026-11-02'])->toMatchArray(['accepted' => 1, 'expired' => 0, 'acceptance_rate' => 100, 'avg_response_seconds' => 30])
        ->and($buckets['2026-10-26'])->toMatchArray(['accepted' => 0, 'acceptance_rate' => null, 'avg_response_seconds' => null])
        ->and($stats['totals'])->toMatchArray(['accepted' => 2, 'rejected' => 1, 'expired' => 1, 'completed' => 1,
            'acceptance_rate' => 50, 'avg_response_seconds' => 70]);
});

it('S05-TC-332 las estadísticas por mes dan 6 meses con el límite del mes en hora de Lima y validan el período en español', function () {
    $id = $this->technician->id;
    s05T4Offer($id, $this->client->id, 'accepted', '2026-06-01 00:10', 40);  // primer minuto de junio en Lima: cuenta
    s05T4Offer($id, $this->client->id, 'accepted', '2026-05-31 23:50', 40);  // mayo en Lima (junio en UTC): fuera
    s05T4Offer($id, $this->client->id, 'expired', '2026-11-03 10:00');
    s05T4Offer($id, $this->client->id, 'accepted', '2026-10-20 10:00', 100, '2026-10-31 23:30');
    Sanctum::actingAs($this->technician->user);

    $stats = $this->getJson('/api/v1/technicians/me/stats?period=month')->assertOk()->json('data');
    $buckets = collect($stats['buckets'])->keyBy('key');
    expect(array_column($stats['buckets'], 'key'))->toBe(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])
        ->and($buckets['2026-06'])->toMatchArray(['accepted' => 1, 'acceptance_rate' => 100])
        ->and($buckets['2026-10'])->toMatchArray(['accepted' => 1, 'completed' => 1, 'avg_response_seconds' => 100])
        ->and($buckets['2026-11'])->toMatchArray(['expired' => 1, 'acceptance_rate' => 0])
        ->and($stats['totals']['accepted'])->toBe(2);
    expect($this->getJson('/api/v1/technicians/me/stats')->json('data.period'))->toBe('week');
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians/me/stats?period=year'), ['period']);
});

it('S05-TC-333 las estadísticas solo cuentan las ofertas del propio técnico y responden 403 al cliente y al administrador', function () {
    s05T4Offer($this->technician->id, $this->client->id, 'accepted', '2026-11-10 10:00', 60);
    $other = Sprint04::technician();
    foreach (range(1, 3) as $index) {
        s05T4Offer($other->id, $this->client->id, 'expired', "2026-11-1$index 08:00");
    }
    Sanctum::actingAs($this->technician->user);
    expect($this->getJson('/api/v1/technicians/me/stats')->json('data.totals'))->toMatchArray(['accepted' => 1, 'expired' => 0, 'acceptance_rate' => 100]);

    foreach ([$this->client->user, Sprint02::admin()] as $user) {
        Sprint01::forgetSession();
        Sanctum::actingAs($user);
        $this->getJson('/api/v1/technicians/me/stats')->assertForbidden();
        $this->getJson('/api/v1/technicians/me/verification')->assertForbidden();
        $this->patchJson('/api/v1/technicians/me/portfolio/order', ['ids' => [1]])->assertForbidden();
    }
});

it('S05-TC-334 la verificación muestra cada documento obligatorio como Recibido, En revisión, Aprobado u Observado con la nota (D-106)', function () {
    $identity = s05T4Document($this->technician, 'Documento de identidad', 'approved');
    $certificate = s05T4Document($this->technician, 'Certificado o constancia técnica');
    Sanctum::actingAs($this->technician->user);
    $required = fn () => collect($this->getJson('/api/v1/technicians/me/verification')->assertOk()->json('data.required'))->keyBy('key');

    // Perfil aprobado que agrega un documento: queda «Recibido» porque no está en la cola de revisión.
    expect($required()['identity']['state'])->toBe('approved')->and($required()['identity']['state_label'])->toBe('Aprobado')
        ->and($required()['identity']['document']['id'])->toBe($identity)
        ->and($required()['certificate']['state'])->toBe('received')->and($required()['certificate']['state_label'])->toBe('Recibido');

    DB::table('technician_profiles')->where('id', $this->technician->id)->update(['status' => 'pending_verification', 'verification_status' => 'pending']);
    expect($required()['certificate']['state'])->toBe('in_review')->and($required()['certificate']['state_label'])->toBe('En revisión');

    DB::table('technician_documents')->where('id', $certificate)->update(['review_status' => 'rejected', 'review_note' => 'La foto está borrosa.']);
    DB::table('technician_profiles')->where('id', $this->technician->id)->update(['verification_status' => 'rejected']);
    $data = $this->getJson('/api/v1/technicians/me/verification')->json('data');
    expect(collect($data['required'])->keyBy('key')['certificate'])->toMatchArray(['state' => 'observed', 'state_label' => 'Observado',
        'note' => 'La foto está borrosa.'])
        ->and($data['state'])->toBe('observed')->and($data['can_request_review'])->toBeTrue()
        ->and(array_column($data['types'], 'value'))->toContain('Documento de identidad', 'Certificado o constancia técnica');

    // Sin documentos: los dos obligatorios faltan y el estado general lo dice.
    $empty = Sprint04::technician(['profile' => ['status' => 'pending_verification', 'verification_status' => 'pending']]);
    Sprint01::forgetSession();
    Sanctum::actingAs($empty->user);
    $none = $this->getJson('/api/v1/technicians/me/verification')->json('data');
    expect(array_column($none['required'], 'state'))->toBe(['missing', 'missing'])->and($none['state'])->toBe('missing')
        ->and($none['missing'])->toBe(['Documento de identidad', 'Certificado o constancia técnica']);
});

it('S05-TC-335 los documentos de verificación nunca se muestran a otro técnico, a un cliente ni en el perfil público', function () {
    $document = s05T4Document($this->technician, 'Documento de identidad', 'approved');
    $media = (int) DB::table('technician_documents')->where('id', $document)->value('media_id');
    $other = Sprint04::technician();
    Sanctum::actingAs($this->technician->user);
    expect($this->getJson('/api/v1/technicians/me/verification')->json('data.required.0.document.file_name'))->toBe('documento-sintetico.pdf');
    $this->get("/api/v1/media/$media")->assertOk();

    Sprint01::forgetSession();
    Sanctum::actingAs($other->user);
    $view = $this->getJson('/api/v1/technicians/me/verification')->assertOk()->json('data');
    expect(json_encode($view))->not->toContain('documento-sintetico.pdf')->not->toContain("/media/$media\"")
        ->and(collect($view['required'])->pluck('document')->filter()->all())->toBe([]);
    $this->get("/api/v1/media/$media")->assertNotFound();

    Sprint01::forgetSession();
    Sanctum::actingAs($this->client->user);
    $this->get("/api/v1/media/$media")->assertNotFound();
    $public = json_encode($this->getJson("/api/v1/technicians/{$this->technician->id}")->assertOk()->json());
    expect($public)->not->toContain('documento-sintetico.pdf')->not->toContain('Documento de identidad')->not->toContain('documents');
});

it('S05-TC-336 el técnico ordena su portafolio y el orden se respeta en su perfil y en la galería pública; un orden inválido no se guarda', function () {
    Sanctum::actingAs($this->technician->user);
    $ids = [];
    foreach (['Primero', 'Segundo', 'Tercero'] as $title) {
        $ids[$title] = $this->postJson('/api/v1/technicians/me/portfolio', ['title' => "Trabajo $title", 'status' => 'published',
            'media_ids' => [s05T4Image($this->technician)], 'image_captions' => ["Foto del trabajo $title"]])->assertCreated()->json('data.id');
    }
    $own = fn () => array_column($this->getJson('/api/v1/technicians/me/profile')->json('data.portfolio'), 'id');
    // Lo nuevo va primero.
    expect($own())->toBe([$ids['Tercero'], $ids['Segundo'], $ids['Primero']]);

    $order = [$ids['Primero'], $ids['Tercero'], $ids['Segundo']];
    $this->patchJson('/api/v1/technicians/me/portfolio/order', ['ids' => $order])->assertOk()->assertJsonPath('data.ids', $order);
    expect($own())->toBe($order)
        ->and(array_column($this->getJson("/api/v1/technicians/{$this->technician->id}/portfolio")->json('data'), 'id'))->toBe($order);

    $foreign = DB::table('portfolio_items')->insertGetId(['technician_id' => Sprint04::technician()->id, 'title' => 'Ajeno', 'status' => 'published']);
    Sprint01::assertSpanishValidation($this->patchJson('/api/v1/technicians/me/portfolio/order', ['ids' => [$ids['Primero'], $ids['Tercero']]]), ['ids']);
    Sprint01::assertSpanishValidation($this->patchJson('/api/v1/technicians/me/portfolio/order', ['ids' => [...$order, $foreign]]), ['ids']);
    Sprint01::assertSpanishValidation($this->patchJson('/api/v1/technicians/me/portfolio/order', ['ids' => [$order[0], $order[0], $order[1]]]), ['ids.1']);
    expect($own())->toBe($order);
});

it('S05-TC-337 el texto alternativo es obligatorio en cada imagen nueva del portafolio; las imágenes que ya estaban lo conservan', function () {
    Sanctum::actingAs($this->technician->user);
    [$first, $second] = [s05T4Image($this->technician), s05T4Image($this->technician)];
    $payload = ['title' => 'Cambio de compresor', 'status' => 'published', 'media_ids' => [$first]];

    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/portfolio', $payload), ['image_captions']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/portfolio', $payload + ['image_captions' => ['  ']]), ['image_captions.0']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/portfolio', $payload + ['image_captions' => [str_repeat('a', 181)]]), ['image_captions.0']);
    $item = $this->postJson('/api/v1/technicians/me/portfolio', $payload + ['image_captions' => ['Compresor antes del cambio']])->assertCreated()->json('data.id');

    $url = "/api/v1/technicians/me/portfolio/$item";
    // Sin tocar las imágenes, la edición no pide texto alternativo.
    $this->patchJson($url, ['title' => 'Cambio de compresor (editado)', 'expected_version' => 1])->assertOk();
    // Una imagen nueva sin texto alternativo no se guarda; la que ya estaba conserva el suyo.
    Sprint01::assertSpanishValidation($this->patchJson($url, ['media_ids' => [$first, $second], 'expected_version' => 2]), ['image_captions.1']);
    $images = $this->patchJson($url, ['media_ids' => [$first, $second], 'image_captions' => [null, 'Compresor nuevo instalado'],
        'expected_version' => 2])->assertOk()->json('data.images');
    expect(array_column($images, 'caption'))->toBe(['Compresor antes del cambio', 'Compresor nuevo instalado']);
});

it('S05-TC-338 la demo trae los 2 documentos obligatorios: el menú «Aprobado» coincide con la página de verificación', function () {
    $builder = app(DemoSeeder::class);
    $builder->verificationDocuments($this->technician->id, $this->technician->user_id, 'approved');
    $builder->verificationDocuments($this->technician->id, $this->technician->user_id, 'approved'); // no se duplica
    $pending = TechnicianProfileFactory::new()->create();
    $builder->verificationDocuments($pending->id, $pending->user_id, 'pending', ['identity']);

    Sanctum::actingAs($this->technician->user);
    $verification = $this->getJson('/api/v1/technicians/me/verification')->json('data');
    expect(DB::table('technician_documents')->where('technician_id', $this->technician->id)->count())->toBe(2)
        ->and($this->getJson('/api/v1/technicians/me/home')->json('data.verification.state'))->toBe('approved')
        ->and($verification['state'])->toBe('approved')
        ->and(array_column($verification['required'], 'state'))->toBe(['approved', 'approved'])
        ->and(DB::table('media_files')->whereIn('id', DB::table('technician_documents')->pluck('media_id'))->pluck('visibility')->unique()->all())->toBe(['private']);

    Sprint01::forgetSession();
    Sanctum::actingAs($pending->user);
    $pendingView = $this->getJson('/api/v1/technicians/me/verification')->json('data');
    expect(array_column($pendingView['required'], 'state'))->toBe(['in_review', 'missing'])->and($pendingView['state'])->toBe('missing');
});

it('S05-TC-339 el historial de demostración llena las estadísticas de 8 semanas y 6 meses sin duplicarse ni cambiar el Inicio', function () {
    $activity = app(DemoTechnicianActivity::class);
    $activity->run($this->technician->id, [$this->client->id]);
    $activity->history($this->technician->id, [$this->client->id]);
    $activity->history($this->technician->id, [$this->client->id]); // no se duplica
    Sanctum::actingAs($this->technician->user);

    $weeks = $this->getJson('/api/v1/technicians/me/stats?period=week')->json('data.buckets');
    $months = $this->getJson('/api/v1/technicians/me/stats?period=month')->json('data.buckets');
    $withData = fn (array $buckets) => count(array_filter($buckets, fn (array $bucket) => $bucket['accepted'] + $bucket['rejected'] + $bucket['expired'] > 0));
    expect($withData($weeks))->toBeGreaterThanOrEqual(6)->and($withData($months))->toBe(6)
        ->and(array_sum(array_column($months, 'completed')))->toBeGreaterThan(5)
        // La historia de los últimos 30 días (Inicio, S05-TC-298) no cambia.
        ->and($this->getJson('/api/v1/technicians/me/home')->json('data.indicators.acceptance_rate'))->toBe(75)
        ->and(DB::table('service_requests')->where('target_technician_id', $this->technician->id)->where('description', 'not like', '%(demostración)%')->count())->toBe(0);
});
