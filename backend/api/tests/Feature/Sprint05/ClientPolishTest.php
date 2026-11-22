<?php

// S05-TC-380 a 386 · Pulido final del panel del cliente: un sensor sin lecturas queda «Sin datos» y no en «Falla» (DEF-76),
// la siembra demo renueva las lecturas de las últimas 24 h y la simulación a mano genera lecturas; además, los datos que
// necesitan las tarjetas nuevas (equipos, alertas, garantías, promociones y el resumen de la solicitud).
use App\Modules\Premium\IotMonitor;
use Carbon\CarbonImmutable;
use Database\Factories\AnnouncementFactory;
use Database\Factories\ClientProfileFactory;
use Database\Seeders\DemoPremium;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->profile = ClientProfileFactory::new()->create(['district_id' => Sprint04::district(), 'default_address' => 'Jr. Sintético 742', 'plan' => 'premium']);
    $this->user = $this->profile->user;
    Sanctum::actingAs($this->user);
});

/** Congeladora con sensor −18 ± 3 °C del cliente dado. */
function s05PolishFreezer(int $userId, array $extra = []): array
{
    $equipment = DB::table('client_equipment')->insertGetId($extra + ['user_id' => $userId, 'name' => 'Congeladora',
        'subcategory_id' => Sprint04::subcategory('frio-congeladores')]);
    $device = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => 'Sensor de temperatura', 'metric' => 'temperature',
        'unit' => '°C', 'target' => -18, 'tolerance' => 3, 'maintenance_every_days' => 180]);

    return [$equipment, $device];
}

it('S05-TC-380 un sensor sin lecturas en las últimas 24 h queda «Sin datos» (no_data) y no en falla', function () {
    [, $device] = s05PolishFreezer($this->user->id);
    // Una lectura vieja (hace 3 días) no cuenta: en las últimas 24 h no hay datos.
    DB::table('iot_readings')->insert(['device_id' => $device, 'value' => -18, 'measured_at' => CarbonImmutable::now()->subDays(3)]);
    $card = $this->getJson('/api/v1/client/iot/devices')->assertOk()->json('data.items.0');
    expect([$card['status'], $card['value'], $card['measured_at'], $card['readings']])->toBe(['no_data', null, null, []])
        ->and(IotMonitor::status((object) ['online' => true, 'target' => -18, 'tolerance' => 3], null))->toBe('no_data');
});

it('S05-TC-381 la siembra demo repetida días después deja 24 h de lecturas relativas a la hora de la siembra, sin duplicar equipos', function () {
    $this->travelTo(CarbonImmutable::parse('2026-11-10 15:20:00', 'UTC'));
    app(DemoPremium::class)->run($this->user->id, $this->profile->id, Sprint04::district());
    $this->travelTo(CarbonImmutable::parse('2026-11-14 09:40:00', 'UTC'));
    app(DemoPremium::class)->run($this->user->id, $this->profile->id, Sprint04::district());

    expect(DB::table('client_equipment')->where('user_id', $this->user->id)->count())->toBe(3);
    $items = collect($this->getJson('/api/v1/client/iot/devices')->assertOk()->json('data.items'))->keyBy(fn ($item) => $item['equipment']['name']);
    foreach ($items as $item) {
        expect(count($item['readings']))->toBeGreaterThanOrEqual(24)
            ->and($item['status'])->not->toBe('no_data')
            ->and(CarbonImmutable::parse($item['measured_at'])->greaterThan(now()->subHour()))->toBeTrue();
    }
    // La congeladora demo sigue mostrando su falla en la última hora para la demostración de alertas.
    expect($items['Congeladora de helados']['status'])->toBe('failure')
        ->and($items['Vitrina de bebidas']['status'])->toBe('normal');
});

it('S05-TC-382 tecnicoya:iot-simulate a mano (sin --at) registra una lectura actual en cada equipo demo', function () {
    $this->travelTo(CarbonImmutable::parse('2026-11-14 10:05:00', 'UTC'));
    [, $device] = s05PolishFreezer($this->user->id, ['is_demo' => true]);
    expect(Artisan::call('tecnicoya:iot-simulate'))->toBe(0);
    $reading = DB::table('iot_readings')->where('device_id', $device)->first();
    expect($reading)->not->toBeNull()
        ->and(CarbonImmutable::parse($reading->measured_at)->equalTo(now()))->toBeTrue();
    expect($this->getJson('/api/v1/client/iot/devices')->json('data.items.0.status'))->not->toBe('no_data');
});

it('S05-TC-383 Mis equipos trae el código del tipo de equipo, el estado de su sensor y la fecha del último servicio', function () {
    [$equipment, $device] = s05PolishFreezer($this->user->id);
    $plain = DB::table('client_equipment')->insertGetId(['user_id' => $this->user->id, 'name' => 'Laptop de caja',
        'subcategory_id' => Sprint04::subcategory('computo-hardware')]);
    $items = collect($this->getJson('/api/v1/client/equipment')->assertOk()->json('data.items'))->keyBy('id');
    expect([$items[$equipment]['subcategory_code'], $items[$equipment]['sensor_status'], $items[$equipment]['last_service_at']])
        ->toBe(['frio-congeladores', 'no_data', null])
        ->and([$items[$plain]['subcategory_code'], $items[$plain]['sensor_status']])->toBe(['computo-hardware', null]);

    app(IotMonitor::class)->record($device, -19.0, CarbonImmutable::now()->subMinutes(10));
    $closed = CarbonImmutable::now()->subDays(4)->startOfSecond();
    Sprint04::sentRequest(['client_id' => $this->profile->id, 'equipment_id' => $equipment, 'status' => 'closed', 'closed_at' => $closed]);
    $item = collect($this->getJson('/api/v1/client/equipment')->json('data.items'))->firstWhere('id', $equipment);
    expect([$item['sensor_status'], CarbonImmutable::parse($item['last_service_at'])->equalTo($closed)])->toBe(['normal', true]);
});

it('S05-TC-384 cada alerta trae la unidad y el rango normal para resaltar el valor fuera de rango', function () {
    [, $device] = s05PolishFreezer($this->user->id);
    app(IotMonitor::class)->record($device, -7.0, CarbonImmutable::now());
    $alert = $this->getJson('/api/v1/client/iot/alerts')->assertOk()->json('data.items.0');
    expect([$alert['value'], $alert['unit'], $alert['range']['min'], $alert['range']['max'], $alert['metric']])
        ->toBe([-7.0, '°C', -21.0, -15.0, 'temperature']);
});

it('S05-TC-385 las garantías traen técnico, servicio y días restantes; las promociones, su vigencia', function () {
    $this->travelTo(CarbonImmutable::parse('2026-11-14 15:00:00', 'UTC'));
    $technician = Sprint04::technician(['profile' => ['display_name' => 'Rosa Quispe']]);
    $request = Sprint04::sentRequest(['client_id' => $this->profile->id, 'status' => 'closed', 'closed_at' => now()->subDays(18)]);
    DB::table('participations')->insert(['request_id' => $request->id, 'technician_id' => $technician->id, 'slot' => 'primary', 'status' => 'completed',
        'reference_fee_snapshot' => '80.00', 'currency' => 'PEN', 'assigned_at' => now()->subDays(19), 'completed_at' => now()->subDays(18)]);
    $old = Sprint04::sentRequest(['client_id' => $this->profile->id, 'status' => 'completed', 'closed_at' => now()->subDays(40)]);
    $items = collect($this->getJson('/api/v1/client/warranties')->assertOk()->json('data.items'))->keyBy('request_id');
    expect([$items[$request->id]['technician'], $items[$request->id]['days_left'], $items[$request->id]['active']])->toBe(['Rosa Quispe', 12, true])
        ->and([$items[$old->id]['technician'], $items[$old->id]['days_left'], $items[$old->id]['active']])->toBe([null, 0, false]);

    AnnouncementFactory::new()->forRoles(['client'])->create(['title' => 'Promoción de ejemplo', 'kind' => 'promotion',
        'starts_at' => now()->subDay(), 'ends_at' => CarbonImmutable::parse('2026-11-30 23:00:00', 'UTC')]);
    $promotion = $this->getJson('/api/v1/client/promotions')->assertOk()->json('data.items.0');
    expect(CarbonImmutable::parse($promotion['ends_at'])->toDateString())->toBe('2026-11-30');
});

it('S05-TC-386 el detalle de una solicitud propia trae la especialidad y si nació de una alerta del sensor', function () {
    [, $device] = s05PolishFreezer($this->user->id);
    $request = Sprint04::sentRequest(['client_id' => $this->profile->id, 'subcategory_id' => Sprint04::subcategory('frio-congeladores')]);
    $plain = Sprint04::sentRequest(['client_id' => $this->profile->id]);
    app(IotMonitor::class)->record($device, -7.0, CarbonImmutable::now());
    DB::table('iot_alerts')->update(['request_id' => $request->id]);

    $detail = $this->getJson("/api/v1/requests/{$request->id}")->assertOk()->json('data');
    expect([$detail['from_iot_alert'], $detail['specialty']['name']])->toBe([true, 'Refrigeración comercial'])
        ->and($this->getJson("/api/v1/requests/{$plain->id}")->json('data.from_iot_alert'))->toBeFalse();
});
