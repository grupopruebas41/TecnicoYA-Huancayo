<?php

// S05-TC-126 a 132 · D-96 (MATCH-02) · HU-S04-01 · RF-05: una solicitud con varias subcategorías. El técnico debe atender
// todas; la tarifa T es la suma de las suyas, la experiencia E la menor y la estimación usa cualquiera de ellas. Con una
// sola subcategoría el resultado es el mismo que antes.
use Database\Factories\ClientProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Seeders\SymptomSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Queue::fake();
});

/** Solicitud enviada de un pedido con esas subcategorías, la primera como principal. */
function multiRequest(array $codes, array $overrides = []): object
{
    $clientId = $overrides['client_id'] ?? ClientProfileFactory::new()->create()->id;
    $orderId = DB::table('service_orders')->insertGetId(['client_id' => $clientId, 'item_count' => 1, 'submitted_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
    $request = Sprint04::sentRequest($overrides + ['client_id' => $clientId, 'order_id' => $orderId, 'subcategory_id' => Sprint04::subcategory($codes[0])]);
    foreach (array_values($codes) as $position => $code) {
        DB::table('request_subcategories')->insert(['request_id' => $request->id, 'subcategory_id' => Sprint04::subcategory($code), 'position' => $position + 1]);
    }

    return $request;
}

/** Técnico con varios servicios: [código => [tarifa, años]]. */
function multiTechnician(array $services): object
{
    $codes = array_keys($services);
    [$fee, $years] = $services[$codes[0]];
    $technician = Sprint04::technician(['subcategory' => $codes[0], 'fee' => $fee, 'years' => $years]);
    foreach (array_slice($codes, 1) as $code) {
        TechnicianServiceFactory::new()->create(['technician_id' => $technician->id, 'subcategory_id' => Sprint04::subcategory($code),
            'reference_fee' => $services[$code][0], 'experience_years' => $services[$code][1]]);
    }

    return $technician;
}

function multiSnapshot(int $requestId, int $technicianId): array
{
    return json_decode(Sprint04::candidate($requestId, $technicianId)->input_snapshot, true, flags: JSON_THROW_ON_ERROR);
}

it('S05-TC-126 solo es elegible el técnico que atiende todas las subcategorías de la solicitud [D-96]', function () {
    $both = multiTechnician(['computo-hardware' => ['80.00', 2], 'computo-redes' => ['40.00', 3]]);
    $onlyFirst = multiTechnician(['computo-hardware' => ['80.00', 2]]);
    $onlySecond = multiTechnician(['computo-redes' => ['40.00', 3]]);
    $request = multiRequest(['computo-hardware', 'computo-redes']);

    Sprint04::prepare($request->id);

    expect((int) Sprint04::candidate($request->id, $both->id)->eligible)->toBe(1)
        ->and(Sprint04::candidate($request->id, $onlyFirst->id)->exclusion_code)->toBe('service_not_offered')
        ->and(Sprint04::candidate($request->id, $onlySecond->id)->exclusion_code)->toBe('service_not_offered');
});

it('S05-TC-127 un servicio inactivo en una de las subcategorías deja al técnico fuera [D-96]', function () {
    $technician = multiTechnician(['computo-hardware' => ['80.00', 2], 'computo-redes' => ['40.00', 3]]);
    DB::table('technician_services')->where('technician_id', $technician->id)->where('subcategory_id', Sprint04::subcategory('computo-redes'))->update(['active' => 0]);
    $request = multiRequest(['computo-hardware', 'computo-redes']);

    Sprint04::prepare($request->id);

    expect(Sprint04::candidate($request->id, $technician->id)->exclusion_code)->toBe('service_not_offered');
});

it('S05-TC-128 si nadie atiende todas, la solicitud entra al pendiente de disponibilidad de 24 h [D-96]', function () {
    multiTechnician(['computo-hardware' => ['80.00', 2]]);
    multiTechnician(['computo-redes' => ['40.00', 3]]);
    $request = multiRequest(['computo-hardware', 'computo-redes']);

    Sprint04::prepare($request->id);

    $row = DB::table('service_requests')->find($request->id);
    expect($row->pending_since)->not->toBeNull()
        ->and(now()->parse($row->pending_expires_at, 'UTC')->equalTo(now()->addHours(24)))->toBeTrue()
        ->and(Sprint04::rounds($request->id))->toBe([]);
});

it('S05-TC-129 el puntaje usa la suma de las tarifas y la menor experiencia del técnico [D-96]', function () {
    $cheap = multiTechnician(['computo-hardware' => ['90.00', 8], 'computo-redes' => ['10.00', 1]]);
    $costly = multiTechnician(['computo-hardware' => ['60.00', 3], 'computo-redes' => ['60.00', 2]]);
    $request = multiRequest(['computo-hardware', 'computo-redes']);

    Sprint04::prepare($request->id);

    $snapshot = multiSnapshot($request->id, $cheap->id);
    $service = DB::table('technician_services')->where('technician_id', $cheap->id)->where('subcategory_id', Sprint04::subcategory('computo-hardware'))->value('id');
    // T: 100 frente a 120, gana el de menor suma aunque su primera tarifa sea la mayor. E: la menor de cada uno, 1 frente a 2.
    expect((float) $snapshot['fee'])->toBe(100.0)
        ->and((int) $snapshot['experience_years'])->toBe(1)
        ->and((int) $snapshot['technician_service_id'])->toBe((int) $service)
        ->and($snapshot['services'])->toHaveCount(2)
        ->and((float) Sprint04::candidate($request->id, $cheap->id)->price_factor)->toBe(1.0)
        ->and((float) Sprint04::candidate($request->id, $costly->id)->price_factor)->toBe(0.0)
        ->and((float) Sprint04::candidate($request->id, $cheap->id)->experience_factor)->toBe(0.5)
        ->and((float) Sprint04::candidate($request->id, $costly->id)->experience_factor)->toBe(1.0)
        ->and((float) Sprint04::offerTo($request->id, $cheap->id)->reference_fee_snapshot)->toBe(100.0);
});

it('S05-TC-130 con una sola subcategoría no cambia la fotografía ni el puntaje, y se registra matching_v2 [D-96]', function () {
    $technician = multiTechnician(['computo-hardware' => ['80.00', 2]]);
    $alone = Sprint04::sentRequest();
    $inOrder = multiRequest(['computo-hardware']);

    Sprint04::prepare($alone->id);
    Sprint04::prepare($inOrder->id);

    $first = multiSnapshot($alone->id, $technician->id);
    expect($first)->not->toHaveKey('services')
        ->and($first['fee'])->toBe('80.00')
        ->and((int) $first['experience_years'])->toBe(2)
        ->and(multiSnapshot($inOrder->id, $technician->id))->toBe($first)
        ->and(Sprint04::candidate($alone->id, $technician->id)->score)->toBe(Sprint04::candidate($inOrder->id, $technician->id)->score)
        ->and(Sprint04::run($alone->id)->algorithm_version)->toBe('matching_v2');
});

it('S05-TC-131 la estimación de tiempo cuenta los servicios de cualquiera de las subcategorías [D-96]', function () {
    $technician = multiTechnician(['computo-hardware' => ['80.00', 2], 'computo-redes' => ['40.00', 3]]);
    Sprint04::completedService($technician->id, 60);
    Sprint04::completedService($technician->id, 120, 'computo-redes');
    Sprint04::completedService($technician->id, 90, 'computo-redes');
    Sprint04::completedService($technician->id, 999, 'computo-software');
    $request = multiRequest(['computo-hardware', 'computo-redes']);

    Sprint04::prepare($request->id);

    expect(multiSnapshot($request->id, $technician->id)['estimate'])->toBe(['status' => 'estimated', 'minutes' => 90]);
});

it('S05-TC-132 el técnico ve todas las subcategorías en la oferta y en el aviso; los síntomas valen de cualquiera de ellas [D-96]', function () {
    $this->seed(SymptomSeeder::class);
    $technician = multiTechnician(['computo-hardware' => ['80.00', 2], 'computo-redes' => ['40.00', 3]]);
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $symptomOf = fn (string $code) => (int) DB::table('subcategory_symptoms')->where('subcategory_id', Sprint04::subcategory($code))->value('id');
    $payload = fn (array $symptoms) => ['district_id' => Sprint04::district(), 'address' => 'Jirón sintético 742', 'mode' => 'asap', 'summary_confirmed' => true,
        'items' => [['specialty_id' => (int) DB::table('subcategories')->where('code', 'computo-hardware')->value('specialty_id'),
            'subcategory_ids' => [Sprint04::subcategory('computo-hardware'), Sprint04::subcategory('computo-redes')],
            'description' => 'El equipo no enciende y el internet se corta.', 'urgency' => 'normal', 'symptom_ids' => $symptoms]]];

    $foreign = $this->postJson('/api/v1/orders', $payload([$symptomOf('frio-domestico')]), ['Idempotency-Key' => (string) Str::uuid()]);
    Sprint01::assertSpanishValidation($foreign, ['items.0.symptom_ids.0']);
    $id = $this->postJson('/api/v1/orders', $payload([$symptomOf('computo-redes')]), ['Idempotency-Key' => (string) Str::uuid()])->assertCreated()->json('data.requests.0.id');
    Sprint04::prepare($id);

    Sanctum::actingAs($technician->user);
    $offer = $this->getJson('/api/v1/offers')->assertOk()->json('data.items.0');
    expect(array_column($offer['request']['subcategories'], 'id'))->toBe([Sprint04::subcategory('computo-hardware'), Sprint04::subcategory('computo-redes')])
        ->and($offer['request']['symptoms'])->toHaveCount(1)
        ->and((float) $offer['reference_fee']['amount'])->toBe(120.0);
    $notice = DB::table('notifications')->where('user_id', $technician->user_id)->where('type', 'offer.created')->value('body');
    foreach (DB::table('subcategories')->whereIn('code', ['computo-hardware', 'computo-redes'])->pluck('name') as $name) {
        expect($notice)->toContain($name);
    }
});
