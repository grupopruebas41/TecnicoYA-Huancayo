<?php

// S05-TC-088 a 102 · D-92 (PEDIDO-01) · HU-S03-01 · RF-01: pedido con varios rubros (hasta 3). Crea una solicitud por
// subcategoría, vinculadas por el pedido, y las envía juntas en una transacción con Idempotency-Key. Respeta D-11.
use App\Modules\BMatching\Jobs\PrepareMatching;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\MediaFileFactory;
use Database\Seeders\SymptomSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this); // martes 2026-10-20, 09:00 en Lima
    $this->seed(SymptomSeeder::class);
    Storage::fake('local');
    Queue::fake();
    $this->client = ClientProfileFactory::new()->create();
    Sanctum::actingAs($this->client->user);
});

function orderItem(string $code = 'computo-hardware', array $overrides = []): array
{
    return $overrides + [
        'subcategory_id' => Sprint04::subcategory($code),
        'description' => 'El equipo no enciende desde ayer por la tarde.',
        'urgency' => 'normal',
    ];
}

function orderPayload(array $items, array $overrides = []): array
{
    return $overrides + [
        'district_id' => Sprint04::district(),
        'address' => 'Jirón sintético 742, interior B',
        'address_reference' => 'Frente al parque sintético',
        'mode' => 'asap',
        'summary_confirmed' => true,
        'items' => $items,
    ];
}

function postOrder($test, array $payload, ?string $key = null)
{
    return $test->postJson('/api/v1/orders', $payload, ['Idempotency-Key' => $key ?? (string) Str::uuid()]);
}

function symptomIds(string $code, int $count = 2): array
{
    return DB::table('subcategory_symptoms')->where('subcategory_id', Sprint04::subcategory($code))->where('active', 1)
        ->orderBy('position')->limit($count)->pluck('id')->map(fn ($id) => (int) $id)->all();
}

function activeRequest(int $clientId): void
{
    Sprint04::sentRequest(['client_id' => $clientId]);
}

function orderTables(): array
{
    return ['service_orders' => DB::table('service_orders')->count(), 'service_requests' => DB::table('service_requests')->count(),
        'request_events' => DB::table('request_events')->count(), 'request_attachments' => DB::table('request_attachments')->count(),
        'request_symptoms' => DB::table('request_symptoms')->count(), 'idempotency_records' => DB::table('idempotency_records')->count()];
}

it('S05-TC-088 un pedido de un rubro crea y envía una solicitud vinculada al pedido con la versión de reglas', function () {
    $response = postOrder($this, orderPayload([orderItem()]))->assertCreated();

    $order = DB::table('service_orders')->sole();
    $request = DB::table('service_requests')->sole();
    expect($response->json('data.id'))->toBe($order->id)
        ->and($response->json('data.requests'))->toHaveCount(1)
        ->and($response->json('data.requests.0.status'))->toBe('sent')
        ->and((int) $request->order_id)->toBe((int) $order->id)
        ->and($request->status)->toBe('sent')
        ->and($request->rule_version_id)->not->toBeNull()
        ->and($request->source)->toBe('automatic')
        ->and($request->address_reference)->toBe('Frente al parque sintético')
        ->and(DB::table('request_events')->where('request_id', $request->id)->pluck('event_type')->all())
        ->toBe(['request.registered', 'request.submitted']);
    Queue::assertPushed(PrepareMatching::class, 1);
});

it('S05-TC-089 un pedido de 3 rubros de dos especialidades crea 3 solicitudes con sus datos y la ubicación común', function () {
    $photos = MediaFileFactory::new()->count(2)->create(['owner_id' => $this->client->user_id, 'mime_type' => 'image/png']);
    $items = [
        orderItem('computo-hardware', ['brand' => 'Marca sintética', 'model' => 'X-100', 'urgency' => 'urgente',
            'symptom_ids' => symptomIds('computo-hardware'), 'media_ids' => [$photos[0]->id, $photos[1]->id]]),
        orderItem('computo-redes', ['description' => 'El internet se corta cada pocos minutos en la tienda.']),
        orderItem('electricidad-tableros', ['description' => 'El tablero salta cuando prendemos la congeladora.']),
    ];

    $response = postOrder($this, orderPayload($items))->assertCreated();

    $requests = DB::table('service_requests')->orderBy('id')->get();
    expect($requests)->toHaveCount(3)
        ->and($requests->pluck('order_id')->unique()->all())->toBe([$response->json('data.id')])
        ->and($requests->pluck('subcategory_id')->map(fn ($id) => (int) $id)->all())->toBe(array_column($items, 'subcategory_id'))
        ->and($requests->pluck('address')->unique()->all())->toBe(['Jirón sintético 742, interior B'])
        ->and($requests->pluck('status')->unique()->all())->toBe(['sent'])
        ->and($requests[0]->urgency)->toBe('urgente')->and($requests[1]->urgency)->toBe('normal')
        ->and($requests[0]->brand)->toBe('Marca sintética')->and($requests[0]->model)->toBe('X-100')
        ->and($requests[1]->brand)->toBeNull()
        ->and(DB::table('request_symptoms')->where('request_id', $requests[0]->id)->count())->toBe(2)
        ->and(DB::table('request_attachments')->where('request_id', $requests[0]->id)->orderBy('position')->pluck('media_id')->all())
        ->toBe([$photos[0]->id, $photos[1]->id])
        ->and($response->json('data.requests.*.subcategory.id'))->toBe(array_column($items, 'subcategory_id'));
    Queue::assertPushed(PrepareMatching::class, 3);
});

it('S05-TC-090 rechaza un pedido vacío, de 4 rubros o con un rubro repetido, en español y sin crear nada', function () {
    $before = orderTables();
    foreach ([[], [orderItem('computo-hardware'), orderItem('computo-redes'), orderItem('computo-software'), orderItem('computo-datos')],
        [orderItem('computo-hardware'), orderItem('computo-hardware')]] as $items) {
        $response = postOrder($this, orderPayload($items));
        $response->assertUnprocessable();
        Sprint01::assertSpanishText($response->json('message'));
    }
    expect(postOrder($this, orderPayload([orderItem(), orderItem()]))->json('errors'))->toHaveKey('items.1.subcategory_id')
        ->and(orderTables())->toBe($before);
});

it('S05-TC-091 rechaza el pedido entero si no cabe en el máximo de solicitudes activas (D-11) y acepta el que cabe', function () {
    activeRequest($this->client->id);
    activeRequest($this->client->id);
    $before = orderTables();

    $rejected = postOrder($this, orderPayload([orderItem('computo-hardware'), orderItem('computo-redes')]));

    $rejected->assertConflict()->assertJsonPath('error.code', 'ACTIVE_REQUEST_LIMIT');
    Sprint01::assertSpanishText($rejected->json('message'));
    expect($rejected->json('message'))->toContain('2 solicitudes activas')->toContain('1')
        ->and(orderTables())->toBe($before);
    postOrder($this, orderPayload([orderItem('computo-redes')]))->assertCreated();
    expect(DB::table('service_requests')->where('status', 'sent')->count())->toBe(3);
});

it('S05-TC-092 el envío es atómico: si falla una solicitud no queda ninguna, ni el pedido ni la clave', function () {
    $before = orderTables();
    $submitted = 0;
    // Falla el envío de la segunda solicitud dentro de la transacción del pedido.
    DB::listen(function ($query) use (&$submitted) {
        if (str_contains($query->sql, 'insert into `request_events`') && in_array('request.submitted', $query->bindings, true)
            && ++$submitted === 2) {
            throw new RuntimeException('Fallo simulado del segundo envío');
        }
    });

    $this->withoutExceptionHandling();
    expect(fn () => postOrder($this, orderPayload([orderItem('computo-hardware'), orderItem('computo-redes')])))
        ->toThrow(RuntimeException::class, 'Fallo simulado del segundo envío');

    expect(orderTables())->toBe($before);
    Queue::assertNothingPushed();
});

it('S05-TC-093 idempotencia: la misma clave devuelve el mismo pedido; otro cuerpo, 409; sin clave, 422', function () {
    $key = (string) Str::uuid();
    $payload = orderPayload([orderItem('computo-hardware'), orderItem('computo-redes')]);

    $first = postOrder($this, $payload, $key)->assertCreated();
    $retry = postOrder($this, $payload, $key)->assertCreated();
    $other = postOrder($this, orderPayload([orderItem('computo-hardware')]), $key);
    $without = $this->postJson('/api/v1/orders', $payload);

    expect($retry->json('data'))->toBe($first->json('data'))
        ->and(DB::table('service_orders')->count())->toBe(1)
        ->and(DB::table('service_requests')->count())->toBe(2);
    $other->assertConflict();
    Sprint01::assertSpanishValidation($without, ['idempotency_key']);
});

it('S05-TC-094 los síntomas deben ser activos y de la subcategoría del rubro', function () {
    $foreign = symptomIds('frio-domestico', 1);
    $inactive = symptomIds('computo-hardware', 3)[2];
    DB::table('subcategory_symptoms')->where('id', $inactive)->update(['active' => false]);

    $wrong = postOrder($this, orderPayload([orderItem('computo-hardware', ['symptom_ids' => $foreign])]));
    $off = postOrder($this, orderPayload([orderItem('computo-hardware', ['symptom_ids' => [$inactive]])]));
    $valid = postOrder($this, orderPayload([orderItem('computo-hardware', ['symptom_ids' => symptomIds('computo-hardware')])]))->assertCreated();

    Sprint01::assertSpanishValidation($wrong, ['items.0.symptom_ids.0']);
    Sprint01::assertSpanishValidation($off, ['items.0.symptom_ids.0']);
    $detail = $this->getJson('/api/v1/requests/'.$valid->json('data.requests.0.id'))->assertOk();
    expect(array_column($detail->json('data.symptoms'), 'id'))->toBe(symptomIds('computo-hardware'));
});

it('S05-TC-095 las franjas de Lima se guardan como inicio y fin en UTC y la franja pasada se rechaza', function () {
    $tomorrow = postOrder($this, orderPayload([orderItem()], ['mode' => 'scheduled', 'scheduled_date' => '2026-10-21', 'time_slot' => 'tarde']))
        ->assertCreated();
    $night = postOrder($this, orderPayload([orderItem('computo-redes')], ['mode' => 'scheduled', 'scheduled_date' => '2026-10-20', 'time_slot' => 'noche']))
        ->assertCreated();
    $past = postOrder($this, orderPayload([orderItem('computo-software')], ['mode' => 'scheduled', 'scheduled_date' => '2026-10-20', 'time_slot' => 'manana']));
    $unknown = postOrder($this, orderPayload([orderItem('computo-software')], ['mode' => 'scheduled', 'scheduled_date' => '2026-10-21', 'time_slot' => 'madrugada']));
    $missing = postOrder($this, orderPayload([orderItem('computo-software')], ['mode' => 'scheduled']));

    $first = DB::table('service_requests')->find($tomorrow->json('data.requests.0.id'));
    $second = DB::table('service_requests')->find($night->json('data.requests.0.id'));
    expect(CarbonImmutable::parse($first->preferred_start_at, 'UTC')->toIso8601ZuluString())->toBe('2026-10-21T17:00:00Z')
        ->and(CarbonImmutable::parse($first->preferred_end_at, 'UTC')->toIso8601ZuluString())->toBe('2026-10-21T23:00:00Z')
        ->and($first->time_slot)->toBe('tarde')
        ->and(CarbonImmutable::parse($second->preferred_start_at, 'UTC')->toIso8601ZuluString())->toBe('2026-10-20T23:00:00Z')
        ->and(CarbonImmutable::parse($second->preferred_end_at, 'UTC')->toIso8601ZuluString())->toBe('2026-10-21T02:00:00Z');
    Sprint01::assertSpanishValidation($past, ['time_slot']);
    Sprint01::assertSpanishValidation($unknown, ['time_slot']);
    Sprint01::assertSpanishValidation($missing, ['scheduled_date', 'time_slot']);
});

it('S05-TC-096 la urgencia es informativa: el técnico la ve en la oferta y el matching ofrece lo mismo', function () {
    $technician = Sprint04::technician();
    $normal = Sprint04::sentRequest(['urgency' => 'normal']);
    $urgent = Sprint04::sentRequest(['urgency' => 'urgente']);
    foreach ([$normal, $urgent] as $request) {
        Sprint04::prepare($request->id);
        Sprint04::openRound($request->id);
    }
    $offers = DB::table('offers')->orderBy('request_id')->get();

    expect($offers)->toHaveCount(2)
        ->and($offers->pluck('technician_id')->unique()->all())->toBe([$technician->id])
        ->and($offers[0]->expires_at)->toBe($offers[1]->expires_at);
    Sanctum::actingAs($technician->user);
    $inbox = $this->getJson('/api/v1/technician/offers')->assertOk()->json('data.items');
    expect(collect($inbox)->pluck('request.urgency', 'request.id')->all())->toBe([$urgent->id => 'urgente', $normal->id => 'normal']);
    Sanctum::actingAs($this->client->user);
    Sprint01::assertSpanishValidation(postOrder($this, orderPayload([orderItem('computo-hardware', ['urgency' => 'ya'])])), ['items.0.urgency']);
});

it('S05-TC-097 la solicitud dirigida no entra en el pedido: el pedido rechaza técnico objetivo y origen', function () {
    $technician = Sprint04::technician();
    $before = orderTables();

    $targeted = postOrder($this, orderPayload([orderItem()], ['target_technician_id' => $technician->id]));
    $profile = postOrder($this, orderPayload([orderItem()], ['source' => 'profile']));

    Sprint01::assertSpanishValidation($targeted, ['target_technician_id']);
    Sprint01::assertSpanishValidation($profile, ['source']);
    expect(orderTables())->toBe($before);
});

it('S05-TC-098 por solicitud: descripción de 20 a 1000 caracteres y hasta 5 fotos propias y libres', function () {
    $photos = MediaFileFactory::new()->count(6)->create(['owner_id' => $this->client->user_id, 'mime_type' => 'image/png']);
    $foreign = MediaFileFactory::new()->create(['mime_type' => 'image/png']);
    $before = orderTables();

    $short = postOrder($this, orderPayload([orderItem('computo-hardware', ['description' => str_repeat('a', 19)])]));
    $long = postOrder($this, orderPayload([orderItem('computo-hardware', ['description' => str_repeat('a', 1001)])]));
    $six = postOrder($this, orderPayload([orderItem('computo-hardware', ['media_ids' => $photos->pluck('id')->all()])]));
    $alien = postOrder($this, orderPayload([orderItem('computo-hardware', ['media_ids' => [$foreign->id]])]));
    $shared = postOrder($this, orderPayload([orderItem('computo-hardware', ['media_ids' => [$photos[0]->id]]),
        orderItem('computo-redes', ['media_ids' => [$photos[0]->id]])]));

    Sprint01::assertSpanishValidation($short, ['items.0.description']);
    Sprint01::assertSpanishValidation($long, ['items.0.description']);
    Sprint01::assertSpanishValidation($six, ['items.0.media_ids']);
    Sprint01::assertSpanishValidation($alien, ['items.0.media_ids.0']);
    Sprint01::assertSpanishValidation($shared, ['items.1.media_ids.0']);
    expect(orderTables())->toBe($before);
    postOrder($this, orderPayload([orderItem('computo-hardware', ['description' => str_repeat('a', 20),
        'media_ids' => $photos->take(5)->pluck('id')->all()])]))->assertCreated();
});

it('S05-TC-099 el catálogo de síntomas está sembrado para cada subcategoría, es idempotente y se consulta por subcategoría', function () {
    $this->seed(SymptomSeeder::class);
    $counts = DB::table('subcategories')->leftJoin('subcategory_symptoms as y', 'y.subcategory_id', '=', 'subcategories.id')
        ->groupBy('subcategories.id')->selectRaw('count(y.id) as total')->pluck('total')->map(fn ($n) => (int) $n);
    $id = symptomIds('computo-hardware', 1)[0];
    DB::table('subcategory_symptoms')->where('id', $id)->update(['active' => false]);

    $list = $this->getJson('/api/v1/catalog/subcategories/'.Sprint04::subcategory('computo-hardware').'/symptoms')->assertOk()->json('data');

    expect($counts)->toHaveCount(DB::table('subcategories')->count())
        ->and($counts->min())->toBeGreaterThanOrEqual(4)->and($counts->max())->toBeLessThanOrEqual(8)
        ->and(DB::table('subcategory_symptoms')->select('subcategory_id', 'name')->groupBy('subcategory_id', 'name')->get())
        ->toHaveCount(DB::table('subcategory_symptoms')->count())
        ->and(array_column($list, 'id'))->not->toContain($id)
        ->and(array_keys($list[0]))->toBe(['id', 'name']);
    $this->getJson('/api/v1/catalog/subcategories/999999/symptoms')->assertNotFound();
});

it('S05-TC-100 el cupo del cliente informa máximo, activas y disponibles; solo para clientes', function () {
    activeRequest($this->client->id);
    activeRequest($this->client->id);
    // Un borrador (registered) no cuenta (D-11).
    DB::table('service_requests')->where('id', Sprint04::sentRequest(['client_id' => $this->client->id])->id)
        ->update(['status' => 'registered', 'submitted_at' => null]);

    $quota = $this->getJson('/api/v1/orders/quota')->assertOk()->json('data');
    expect($quota)->toBe(['max' => 3, 'active' => 2, 'available' => 1, 'max_items' => 3]);
    Sanctum::actingAs(Sprint04::technician()->user);
    $this->getJson('/api/v1/orders/quota')->assertForbidden();
    $this->postJson('/api/v1/orders', orderPayload([orderItem()]), ['Idempotency-Key' => (string) Str::uuid()])->assertForbidden();
});

it('S05-TC-101 Mis solicitudes y el detalle muestran el pedido, la urgencia, marca, modelo, síntomas y franja', function () {
    $order = postOrder($this, orderPayload([
        orderItem('computo-hardware', ['brand' => 'Marca sintética', 'model' => 'X-100', 'urgency' => 'urgente', 'symptom_ids' => symptomIds('computo-hardware', 1)]),
        orderItem('computo-redes'),
    ], ['mode' => 'scheduled', 'scheduled_date' => '2026-10-21', 'time_slot' => 'manana']))->assertCreated()->json('data');

    $list = $this->getJson('/api/v1/requests')->assertOk()->json('data');
    $detail = $this->getJson('/api/v1/requests/'.$order['requests'][0]['id'])->assertOk()->json('data');

    expect(array_unique(array_column($list, 'order_id')))->toBe([$order['id']])
        ->and($detail['order_id'])->toBe($order['id'])
        ->and($detail['urgency'])->toBe('urgente')
        ->and($detail['brand'])->toBe('Marca sintética')->and($detail['model'])->toBe('X-100')
        ->and($detail['time_slot'])->toBe('manana')
        ->and($detail['address_reference'])->toBe('Frente al parque sintético')
        ->and($detail['symptoms'])->toHaveCount(1);
});

it('S05-TC-102 el catálogo del asistente da el número de subcategorías por especialidad y la tarifa desde', function () {
    DB::table('subcategories')->where('id', Sprint04::subcategory('computo-hardware'))->update(['reference_fee' => '50.00']);
    DB::table('subcategories')->where('id', Sprint04::subcategory('computo-redes'))->update(['reference_fee' => null]);
    $active = DB::table('subcategories')->where('specialty_id', Sprint02::specialtyId())->where('active', 1)->count();

    $specialties = collect($this->getJson('/api/v1/catalog/specialties')->assertOk()->json('data'))->keyBy('code');
    $subcategories = collect($this->getJson('/api/v1/catalog/subcategories?specialty_id='.Sprint02::specialtyId())->assertOk()->json('data'))->keyBy('code');

    expect($specialties['computo']['subcategory_count'])->toBe($active)
        ->and($subcategories['computo-hardware']['reference_fee'])->toBe('50.00')
        ->and($subcategories['computo-redes']['reference_fee'])->toBeNull();
});
