<?php

// S04-TC-140 a 143 · Cierre S4.6 · Refuerzo de los mutantes sobrevivientes del S4 (DEF-46): la mutación válida dejó
// vivos sobre todo RemoveArrayItem en las vistas (OfferView, CandidatesView, ServiceRequestView, ClientSelection y
// NotificationController) porque las pruebas leían campos sueltos. Aquí se compara la forma completa de cada respuesta
// con el contrato S4 (§4.1 a §4.3, §5.1, §5.2, §5.4 y §7.1): claves, anidamiento y tipos, y los valores clave.
use App\Models\TechnicianProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

/** Forma de una respuesta: cada valor se reemplaza por su tipo y cada lista por la forma de todos sus elementos. */
function s04Shape(mixed $value): mixed
{
    if (! is_array($value)) {
        return get_debug_type($value);
    }

    return array_map('s04Shape', $value);
}

const S04_FEE = ['amount' => 'string', 'currency' => 'string', 'is_reference' => 'bool'];
const S04_REF = ['id' => 'int', 'name' => 'string'];

beforeEach(function () {
    Sprint04::boot($this);
    $this->near = Sprint04::technician(['fee' => '60.00', 'base' => Sprint04::district()]);
    $this->other = Sprint04::technician(['fee' => '70.00']);
    $this->request = Sprint04::sentRequest();
    $this->client = Sprint04::clientUser($this->request);
    $this->media = DB::table('media_files')->insertGetId(['owner_id' => $this->client->id, 'disk' => 'local', 'storage_key' => 'media/evidencia.png',
        'original_name' => 'evidencia.png', 'mime_type' => 'image/png', 'byte_size' => 1, 'sha256' => str_repeat('b', 64),
        'visibility' => 'private', 'scan_status' => 'clean', 'purpose' => 'evidence']);
    DB::table('request_attachments')->insert(['request_id' => $this->request->id, 'media_id' => $this->media, 'uploaded_by' => $this->client->id, 'position' => 0]);
    Sprint04::prepare($this->request->id);
    $this->offer = Sprint04::offerTo($this->request->id, $this->near->id);
});

function s04OfferShape(string $responded): array
{
    return ['id' => 'int', 'status' => 'string', 'version' => 'int', 'round' => ['id' => 'int', 'round_no' => 'int', 'kind' => 'string'],
        'available_at' => 'string', 'expires_at' => 'string', 'responded_at' => $responded, 'reference_fee' => S04_FEE,
        'request' => ['id' => 'int', 'subcategory' => S04_REF, 'district' => S04_REF, 'mode' => 'string', 'preferred_start_at' => 'null',
            'preferred_end_at' => 'null', 'description' => 'string',
            // D-92: urgencia informativa, equipo y síntomas del pedido con varios rubros.
            'urgency' => 'string', 'brand' => 'null', 'model' => 'null', 'symptoms' => [],
            'evidence' => [['media_id' => 'int', 'url' => 'string']], 'address' => 'null']];
}

it('S04-TC-140 la bandeja, el detalle y la respuesta de una oferta tienen la forma completa del contrato §4', function () {
    Sanctum::actingAs($this->near->user);
    $list = $this->getJson('/api/v1/offers?per_page=5')->assertOk()->json('data');
    $detail = $this->getJson("/api/v1/offers/{$this->offer->id}")->assertOk()->json('data');

    expect(s04Shape($list))->toBe(['items' => [s04OfferShape('null')], 'pagination' => ['page' => 'int', 'per_page' => 'int', 'total' => 'int', 'last_page' => 'int']])
        ->and($list['pagination'])->toBe(['page' => 1, 'per_page' => 5, 'total' => 1, 'last_page' => 1])
        ->and($list['items'][0])->toBe($detail)
        ->and(s04Shape($detail))->toBe(s04OfferShape('null'))
        ->and([$detail['id'], $detail['status'], $detail['version'], $detail['round']['round_no'], $detail['round']['kind']])
            ->toBe([(int) $this->offer->id, 'pending', 1, 1, 'automatic'])
        ->and($detail['reference_fee'])->toBe(['amount' => '60.00', 'currency' => 'PEN', 'is_reference' => true])
        ->and($detail['request']['subcategory'])->toBe(['id' => Sprint04::subcategory(), 'name' => 'Reparación de hardware'])
        ->and($detail['request']['district']['id'])->toBe(Sprint04::district())
        ->and($detail['request']['evidence'])->toBe([['media_id' => $this->media, 'url' => url("/api/v1/media/{$this->media}")]]);

    $response = Sprint04::respond($this, $this->near, $this->offer, 'accept')->assertOk()->json('data');
    expect(s04Shape($response))->toBe(['id' => 'int', 'status' => 'string', 'version' => 'int', 'responded_at' => 'string',
        'round' => ['id' => 'int', 'status' => 'string']])
        ->and([$response['id'], $response['status'], $response['version'], $response['round']['id']])
            ->toBe([(int) $this->offer->id, 'accepted', 2, (int) $this->offer->round_id]);
});

it('S04-TC-141 los candidatos y la elección tienen la forma completa del contrato §5.1 y §5.2, con distancia solo si hay base', function () {
    Sprint04::respond($this, $this->near, $this->offer, 'accept')->assertOk();
    Sprint04::respond($this, $this->other, Sprint04::offerTo($this->request->id, $this->other->id), 'accept')->assertOk();
    Sanctum::actingAs($this->client);
    $candidates = $this->getJson("/api/v1/requests/{$this->request->id}/candidates")->assertOk()->json('data');

    $card = fn (string $distance) => ['offer_id' => 'int', 'rank_position' => 'int', 'tie_group' => 'null',
        'technician' => ['id' => 'int', 'display_name' => 'string', 'provider_type' => 'string', 'rating' => ['average' => 'null', 'count' => 'int']],
        'reference_fee' => S04_FEE, 'distance' => $distance === 'array' ? ['km' => 'string', 'approximate' => 'bool', 'label' => 'string'] : 'null',
        'estimate' => ['status' => 'string', 'minutes' => 'null', 'label' => 'string']];
    $byTechnician = collect($candidates['accepted'])->keyBy('technician.id');
    expect(s04Shape(array_diff_key($candidates, ['accepted' => 1])))->toBe(['phase' => 'string', 'request_version' => 'int',
        'round' => ['id' => 'int', 'round_no' => 'int', 'kind' => 'string', 'status' => 'string'], 'alternatives' => []])
        ->and([$candidates['phase'], $candidates['round']['status'], $candidates['round']['round_no']])->toBe(['awaiting_choice', 'awaiting_choice', 1])
        ->and(s04Shape($byTechnician[$this->near->id]))->toBe($card('array'))
        ->and(s04Shape($byTechnician[$this->other->id]))->toBe($card('null'))
        ->and(array_column($candidates['accepted'], 'rank_position'))->toBe([1, 2])
        ->and($byTechnician[$this->near->id]['distance'])->toBe(['km' => '1.000', 'approximate' => true, 'label' => 'aproximada por zona'])
        ->and($byTechnician[$this->near->id]['estimate'])->toBe(['status' => 'new', 'minutes' => null, 'label' => 'Nuevo, sin estimación'])
        ->and($byTechnician[$this->near->id]['offer_id'])->toBe((int) $this->offer->id);

    $selection = Sprint04::select($this, $this->request, (int) $this->offer->id)->assertOk()->json('data');
    $assignment = ['participation' => ['id' => 'int', 'slot' => 'string', 'status' => 'string', 'technician_id' => 'int', 'reference_fee' => S04_FEE,
        'assigned_at' => 'string'], 'appointment' => ['id' => 'int', 'status' => 'string', 'starts_at' => 'string', 'ends_at' => 'string']];
    expect(s04Shape($selection))->toBe(['request' => ['id' => 'int', 'status' => 'string', 'phase' => 'string', 'version' => 'int']] + $assignment)
        ->and([$selection['request']['status'], $selection['request']['phase'], $selection['participation']['technician_id'],
            $selection['participation']['status'], $selection['participation']['reference_fee']['amount']])
            ->toBe(['assigned', 'assigned', $this->near->id, 'assigned', '60.00']);

    $detail = $this->getJson("/api/v1/requests/{$this->request->id}")->assertOk()->json('data');
    expect(s04Shape($detail['assignment']))->toBe($assignment)
        ->and($detail['assignment'])->toBe(array_diff_key($selection, ['request' => 1]));
});

it('S04-TC-142 el detalle de la solicitud del titular tiene la forma completa del contrato §5.4 durante la búsqueda', function () {
    Sanctum::actingAs($this->client);
    $detail = $this->getJson("/api/v1/requests/{$this->request->id}")->assertOk()->json('data');
    // D-89 (TIMELINE-01): el titular recibe además timeline, cuya forma prueban S05-TC-010 y 011; el resto no cambia.
    expect($detail['timeline'])->toBeArray();
    $detail = array_diff_key($detail, ['timeline' => 1]);

    expect(s04Shape($detail))->toBe(['id' => 'int', 'status' => 'string', 'version' => 'int', 'subcategory' => S04_REF, 'district' => S04_REF,
        'description' => 'string', 'address' => 'string', 'mode' => 'string', 'preferred_start_at' => 'null', 'preferred_end_at' => 'null',
        'source' => 'string', 'target_technician_id' => 'null',
        'reference_fee' => ['amount' => 'null', 'currency' => 'string', 'source' => 'null', 'is_reference' => 'bool', 'is_payment' => 'bool'],
        'attachments' => [['media_id' => 'int', 'position' => 'int', 'caption' => 'null', 'url' => 'string']],
        'submitted_at' => 'string',
        // D-92: pedido, urgencia, equipo, franja, referencia y síntomas.
        'order_id' => 'null', 'urgency' => 'string', 'brand' => 'null', 'model' => 'null', 'time_slot' => 'null',
        'address_reference' => 'null', 'symptoms' => [],
        'phase' => 'string', 'search_generation' => 'int',
        'search' => ['current_round' => ['id' => 'int', 'round_no' => 'int', 'kind' => 'string', 'status' => 'string', 'opened_at' => 'string',
            'expires_at' => 'string', 'offers_total' => 'int', 'accepted_count' => 'int'],
            'pending_since' => 'null', 'pending_expires_at' => 'null', 'alternatives_available' => 'bool'],
        'assignment' => 'null'])
        ->and([$detail['phase'], $detail['search_generation'], $detail['search']['current_round']['offers_total'],
            $detail['search']['current_round']['accepted_count'], $detail['search']['current_round']['status'], $detail['search']['alternatives_available']])
            ->toBe(['awaiting_responses', 1, 2, 0, 'open', false])
        ->and($detail['reference_fee'])->toBe(['amount' => null, 'currency' => 'PEN', 'source' => null, 'is_reference' => true, 'is_payment' => false])
        ->and($detail['attachments'][0]['media_id'])->toBe($this->media)
        ->and($detail['address'])->toBe('Jirón sintético 742, interior B');
});

it('S04-TC-143 la bandeja de notificaciones tiene la forma completa del contrato §7.1 y pagina', function () {
    Sanctum::actingAs($this->near->user);
    $page = $this->getJson('/api/v1/notifications?per_page=1')->assertOk()->json('data');
    $item = ['id' => 'int', 'type' => 'string', 'title' => 'string', 'body' => 'string', 'subject' => ['type' => 'string', 'id' => 'int'],
        'event_id' => 'string', 'created_at' => 'string', 'read_at' => 'null'];

    // D-90 (NOTIF-02): unread_count se agregó para la campana del panel del cliente; el resto de la forma no cambia.
    expect(s04Shape($page))->toBe(['items' => [$item], 'pagination' => ['page' => 'int', 'per_page' => 'int', 'total' => 'int', 'last_page' => 'int'],
        'unread_count' => 'int'])
        ->and([$page['items'][0]['type'], $page['items'][0]['subject']])->toBe(['offer.created', ['type' => 'offer', 'id' => (int) $this->offer->id]])
        ->and($page['pagination'])->toBe(['page' => 1, 'per_page' => 1, 'total' => 1, 'last_page' => 1])
        ->and($page['items'][0]['event_id'])->toBe(DB::table('notifications')->where('id', $page['items'][0]['id'])->value('event_id'));
});
