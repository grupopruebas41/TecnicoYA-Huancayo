<?php

// S05-TC-148 a 155 · HU-S03-03 · RF-01 y RF-19: tablero de Mis solicitudes (GET /client/requests): pestañas con contador,
// agrupación por pedido, búsqueda, paginación y datos de la tarjeta. D-100 fija qué estado va en cada pestaña.
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Queue::fake();
    $this->client = ClientProfileFactory::new()->create();
    Sanctum::actingAs($this->client->user);
});

function boardRow(int $clientId, array $overrides = []): object
{
    return Sprint04::sentRequest(['client_id' => $clientId] + $overrides);
}

function boardOrder(int $clientId, int $total = 2): int
{
    return DB::table('service_orders')->insertGetId(['client_id' => $clientId, 'item_count' => $total, 'submitted_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
}

function boardGet($test, string $query = '')
{
    return $test->getJson('/api/v1/client/requests'.($query === '' ? '' : "?$query"));
}

function boardIds(array $data): array
{
    return collect($data['items'])->flatMap(fn (array $entry) => array_column($entry['requests'], 'id'))->all();
}

it('S05-TC-148 GET /client/requests responde con la forma del contrato', function () {
    boardRow($this->client->id);

    $response = boardGet($this)->assertOk();

    $response->assertJsonStructure(['data' => [
        'items' => [['order', 'requests' => [[
            'id', 'status', 'phase', 'mode', 'source', 'version', 'order_id', 'urgency',
            'specialty' => ['id', 'name'], 'subcategories' => [['id', 'name']], 'district' => ['id', 'name'],
            'created_at', 'submitted_at', 'updated_at', 'preferred_start_at', 'preferred_end_at', 'time_slot',
            'technician', 'recent_events', 'can_cancel',
        ]]]],
        'counts' => ['active', 'scheduled', 'completed', 'cancelled'],
        'pagination' => ['page', 'per_page', 'total', 'last_page'],
    ]]);
    expect($response->json('data.items.0.requests.0.specialty.name'))->toBeString();
});

it('S05-TC-149 cada estado cae en su pestaña y el contador es por solicitud [D-100]', function () {
    $id = $this->client->id;
    $sent = boardRow($id);
    $draft = boardRow($id, ['status' => 'registered', 'submitted_at' => null, 'rule_version_id' => null]);
    $pending = boardRow($id, ['status' => 'pending_availability']);
    $assigned = boardRow($id, ['status' => 'assigned']);
    $working = boardRow($id, ['status' => 'in_progress']);
    $scheduled = boardRow($id, ['mode' => 'scheduled', 'preferred_start_at' => now()->addDay(), 'preferred_end_at' => now()->addDay()->addHours(2)]);
    $scheduledDraft = boardRow($id, ['status' => 'registered', 'submitted_at' => null, 'rule_version_id' => null, 'mode' => 'scheduled', 'preferred_start_at' => now()->addDay(), 'preferred_end_at' => now()->addDay()->addHours(2)]);
    $completed = boardRow($id, ['status' => 'completed']);
    $closed = boardRow($id, ['status' => 'closed', 'closed_at' => now()]);
    $unrated = boardRow($id, ['status' => 'unrated']);
    $cancelled = boardRow($id, ['status' => 'cancelled', 'cancelled_at' => now()]);
    $expired = boardRow($id, ['status' => 'expired']);

    $tab = fn (string $name) => boardGet($this, "tab=$name")->assertOk()->json('data');

    expect(boardIds($tab('active')))->toEqualCanonicalizing([$sent->id, $draft->id, $pending->id, $assigned->id, $working->id, $scheduledDraft->id])
        ->and(boardIds($tab('scheduled')))->toBe([$scheduled->id])
        ->and(boardIds($tab('completed')))->toEqualCanonicalizing([$completed->id, $closed->id, $unrated->id])
        ->and(boardIds($tab('cancelled')))->toEqualCanonicalizing([$cancelled->id, $expired->id])
        ->and($tab('active')['counts'])->toBe(['active' => 6, 'scheduled' => 1, 'completed' => 3, 'cancelled' => 2])
        ->and(boardIds(boardGet($this)->json('data')))->toEqualCanonicalizing(boardIds($tab('active')));
});

it('S05-TC-150 agrupa por pedido con su fecha y total, solo con las solicitudes de la pestaña; la suelta va sin pedido', function () {
    $orderId = boardOrder($this->client->id, 3);
    $first = boardRow($this->client->id, ['order_id' => $orderId]);
    $second = boardRow($this->client->id, ['order_id' => $orderId]);
    $done = boardRow($this->client->id, ['order_id' => $orderId, 'status' => 'completed']);
    $lone = boardRow($this->client->id);

    $data = boardGet($this)->assertOk()->json('data');

    expect($data['items'])->toHaveCount(2)
        ->and($data['items'][0]['order'])->toBeNull()
        ->and(array_column($data['items'][0]['requests'], 'id'))->toBe([$lone->id])
        ->and($data['items'][1]['order']['id'])->toBe($orderId)
        ->and($data['items'][1]['order']['total'])->toBe(3)
        ->and($data['items'][1]['order']['submitted_at'])->toBe(now()->toISOString())
        ->and(array_column($data['items'][1]['requests'], 'id'))->toBe([$second->id, $first->id])
        ->and(boardIds(boardGet($this, 'tab=completed')->json('data')))->toBe([$done->id]);
});

it('S05-TC-151 busca por trabajo, especialidad, distrito, descripción y número, sin distinguir tildes; los contadores siguen la búsqueda', function () {
    $hardware = boardRow($this->client->id, ['description' => 'La laptop de la tienda no enciende.']);
    $cold = boardRow($this->client->id, ['subcategory_id' => Sprint04::subcategory('frio-domestico'), 'description' => 'Falla sin relación con equipos.']);
    boardRow($this->client->id, ['subcategory_id' => Sprint04::subcategory('frio-domestico'), 'status' => 'completed', 'description' => 'Otra falla sin relación.']);
    $coldName = DB::table('subcategories')->where('code', 'frio-domestico')->value('name');
    $search = fn (string $text) => boardGet($this, 'q='.urlencode($text))->assertOk()->json('data');

    expect(boardIds($search('LAPTOP')))->toBe([$hardware->id])
        ->and(boardIds($search($coldName)))->toBe([$cold->id])
        ->and(boardIds($search('computo')))->toBe([$hardware->id])
        ->and(boardIds($search('#'.$cold->id)))->toBe([$cold->id])
        ->and(boardIds($search('huancayo')))->toEqualCanonicalizing([$hardware->id, $cold->id])
        ->and($search('no existe nada así')['items'])->toBe([])
        ->and($search($coldName)['counts'])->toBe(['active' => 1, 'scheduled' => 0, 'completed' => 1, 'cancelled' => 0]);
});

it('S05-TC-152 pagina por grupos sin partir un pedido y valida los parámetros', function () {
    $orderId = boardOrder($this->client->id, 3);
    foreach (range(1, 3) as $ignored) {
        boardRow($this->client->id, ['order_id' => $orderId]);
    }
    $lone = [boardRow($this->client->id), boardRow($this->client->id)];

    $first = boardGet($this, 'per_page=2&page=1')->assertOk()->json('data');
    $second = boardGet($this, 'per_page=2&page=2')->assertOk()->json('data');

    expect($first['pagination'])->toBe(['page' => 1, 'per_page' => 2, 'total' => 3, 'last_page' => 2])
        ->and(boardIds($first))->toBe([$lone[1]->id, $lone[0]->id])
        ->and($second['items'])->toHaveCount(1)
        ->and($second['items'][0]['requests'])->toHaveCount(3)
        ->and(boardGet($this, 'page=9')->assertOk()->json('data.items'))->toBe([]);
    foreach (['tab=otra', 'per_page=31', 'per_page=0', 'page=0', 'q='.str_repeat('a', 101)] as $invalid) {
        boardGet($this, $invalid)->assertUnprocessable();
    }
    boardGet($this, 'per_page=30')->assertOk();
    boardGet($this, 'q='.str_repeat('a', 100))->assertOk();
});

it('S05-TC-153 la tarjeta trae el técnico asignado sin contacto y los últimos 3 eventos autorizados', function () {
    $technician = Sprint04::technician();
    $request = boardRow($this->client->id);
    Sprint04::prepare($request->id);
    Sprint04::respond($this, $technician, Sprint04::offerTo($request->id, $technician->id), 'accept');
    Sanctum::actingAs($this->client->user);

    $searching = boardGet($this)->json('data.items.0.requests.0');
    expect($searching['technician'])->toBeNull()
        ->and($searching['phase'])->toBe('awaiting_choice');

    Sprint04::select($this, $request, Sprint04::offerTo($request->id, $technician->id)->id)->assertOk();
    $card = boardGet($this)->json('data.items.0.requests.0');

    expect($card['technician'])->toBe(['id' => $technician->id, 'display_name' => $technician->display_name])
        ->and($card['recent_events'])->toHaveCount(3)
        ->and(array_keys($card['recent_events'][0]))->toBe(['type', 'label', 'occurred_at'])
        ->and(end($card['recent_events'])['type'])->toBe('request.assigned')
        ->and(json_encode($card))->not->toContain('summary')->not->toContain('metadata')->not->toContain('whatsapp');
});

it('S05-TC-154 cada cliente ve solo lo suyo; otros roles reciben 403 y sin sesión 401', function () {
    $own = boardRow($this->client->id);
    boardRow(ClientProfileFactory::new()->create()->id);

    expect(boardIds(boardGet($this)->json('data')))->toBe([$own->id])
        ->and(boardGet($this)->json('data.counts.active'))->toBe(1);
    Sanctum::actingAs(Sprint04::technician()->user);
    boardGet($this)->assertForbidden();
});

it('S05-TC-155 can_cancel solo antes de iniciar la atención [D-28]', function () {
    $statuses = ['registered' => true, 'sent' => true, 'pending_availability' => true, 'assigned' => true,
        'in_progress' => false, 'completed' => false, 'closed' => false, 'unrated' => false, 'cancelled' => false, 'expired' => false];
    $ids = [];
    foreach (array_keys($statuses) as $status) {
        $ids[boardRow($this->client->id, ['status' => $status])->id] = $status;
    }

    $cards = collect(['active', 'completed', 'cancelled'])->flatMap(fn (string $tab) => collect(boardGet($this, "tab=$tab")->json('data.items'))->flatMap(fn (array $entry) => $entry['requests']));

    expect($cards)->toHaveCount(count($statuses));
    foreach ($cards as $card) {
        expect($card['can_cancel'])->toBe($statuses[$ids[$card['id']]], "Estado {$ids[$card['id']]}");
    }
});
