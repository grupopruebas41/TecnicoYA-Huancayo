<?php

// S05-TC-258 a 265 · Fase 6 del panel final (modo rápido, D-98 y D-99): plan Premium con motivo y auditoría, protección
// 403 de lo premium, «Mis equipos», alertas por umbral con valores límite, recordatorio de mantenimiento, simulación solo
// en demo, solicitud desde una alerta (dirigida al favorito o matching normal) y panel de sensores.
use App\Modules\Premium\IotMonitor;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->profile = ClientProfileFactory::new()->create(['district_id' => Sprint04::district(), 'default_address' => 'Jr. Sintético 742', 'plan' => 'premium']);
    $this->user = $this->profile->user;
    Sanctum::actingAs($this->user);
});

/** Equipo con sensor de temperatura −18 ± 3 (congeladora) del cliente dado. */
function s05Freezer(int $userId, array $extra = []): array
{
    $equipment = DB::table('client_equipment')->insertGetId($extra + ['user_id' => $userId, 'name' => 'Congeladora',
        'subcategory_id' => Sprint04::subcategory('frio-congeladores')]);
    $device = DB::table('iot_devices')->insertGetId(['equipment_id' => $equipment, 'name' => 'Sensor de temperatura', 'metric' => 'temperature',
        'unit' => '°C', 'target' => -18, 'tolerance' => 3, 'maintenance_every_days' => 180]);

    return [$equipment, $device];
}

it('S05-TC-258 el administrador activa y quita Premium con motivo y auditoría; el plan llega en /me', function () {
    $free = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs(Sprint02::admin());
    Sprint01::assertSpanishValidation($this->patchJson("/api/v1/admin/users/{$free->id}/plan", ['plan' => 'premium', 'expected_version' => $free->version]), ['reason']);
    $this->patchJson("/api/v1/admin/users/{$free->id}/plan", ['plan' => 'premium', 'reason' => 'Demostración del plan', 'expected_version' => $free->version])
        ->assertOk()->assertJsonPath('data.client.plan', 'premium');
    expect(DB::table('audit_entries')->where('action', 'client.plan.changed')->where('subject_id', $free->id)->value('reason'))->toBe('Demostración del plan')
        ->and(DB::table('client_profiles')->where('user_id', $free->id)->value('plan_since'))->not->toBeNull();
    $this->patchJson("/api/v1/admin/users/{$free->id}/plan", ['plan' => 'premium', 'reason' => 'Otra vez el mismo plan', 'expected_version' => $free->fresh()->version])
        ->assertStatus(409);
    $technician = Sprint04::technician()->user;
    $this->patchJson("/api/v1/admin/users/{$technician->id}/plan", ['plan' => 'premium', 'reason' => 'No es cliente', 'expected_version' => $technician->version])
        ->assertStatus(409);

    Sanctum::actingAs($free->fresh());
    expect($this->getJson('/api/v1/me')->json('data.client_profile.plan'))->toBe('premium');
    Sanctum::actingAs($this->user);
    $this->patchJson("/api/v1/admin/users/{$free->id}/plan", ['plan' => 'free', 'reason' => 'Sin permiso', 'expected_version' => 1])->assertForbidden();
});

it('S05-TC-259 todo endpoint premium responde 403 a clientes free y a otros roles, y 401 sin sesión', function () {
    $paths = ['GET /client/equipment', 'POST /client/equipment', 'GET /client/iot/devices', 'GET /client/iot/alerts',
        'POST /client/iot/alerts/1/request', 'GET /client/promotions', 'GET /client/warranties'];
    $call = fn (string $route) => $this->json(...[explode(' ', $route)[0], '/api/v1'.explode(' ', $route)[1], []]);
    foreach ([ClientProfileFactory::new()->create(['plan' => 'free'])->user, Sprint04::technician()->user, Sprint02::admin()] as $who) {
        Sanctum::actingAs($who);
        foreach ($paths as $route) {
            $call($route)->assertForbidden();
        }
    }
    Sanctum::actingAs($this->user);
    $this->getJson('/api/v1/client/equipment')->assertOk();
    Sprint01::forgetSession();
    $this->getJson('/api/v1/client/equipment')->assertUnauthorized();
});

it('S05-TC-260 «Mis equipos» crea, edita con versión y elimina; valida en español y lo ajeno responde 404', function () {
    $address = DB::table('client_addresses')->insertGetId(['user_id' => $this->user->id, 'kind' => 'business', 'label' => 'Bodega',
        'district_id' => Sprint04::district(), 'address' => 'Av. Sintética 100']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/client/equipment', ['name' => 'X', 'subcategory_id' => 999999, 'year' => 1950]),
        ['name', 'subcategory_id', 'year']);
    $created = $this->postJson('/api/v1/client/equipment', ['name' => 'Vitrina de bebidas', 'subcategory_id' => Sprint04::subcategory('frio-vitrinas'),
        'brand' => 'Vitrofrío', 'year' => 2020, 'address_id' => $address])->assertCreated()->json('data');
    expect([$created['specialty'], $created['address'], $created['has_sensor']])->toBe(['Refrigeración comercial', 'Bodega · Av. Sintética 100', false]);
    $this->patchJson("/api/v1/client/equipment/{$created['id']}", ['name' => 'Vitrina grande', 'subcategory_id' => Sprint04::subcategory('frio-vitrinas'),
        'expected_version' => 1])->assertOk()->assertJsonPath('data.version', 2);
    $this->patchJson("/api/v1/client/equipment/{$created['id']}", ['name' => 'Otra', 'subcategory_id' => Sprint04::subcategory('frio-vitrinas'),
        'expected_version' => 1])->assertStatus(409);

    $other = ClientProfileFactory::new()->create(['plan' => 'premium'])->user;
    $foreignAddress = DB::table('client_addresses')->insertGetId(['user_id' => $other->id, 'kind' => 'home', 'label' => 'Casa',
        'district_id' => Sprint04::district(), 'address' => 'Jr. Ajeno 1']);
    [$foreign] = s05Freezer($other->id);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/client/equipment', ['name' => 'Otra', 'subcategory_id' => Sprint04::subcategory(),
        'address_id' => $foreignAddress]), ['address_id']);
    $this->getJson("/api/v1/client/equipment/$foreign")->assertNotFound();
    $this->deleteJson("/api/v1/client/equipment/$foreign")->assertNotFound();
    expect(array_column($this->getJson('/api/v1/client/equipment')->json('data.items'), 'name'))->toBe(['Vitrina grande']);
    $this->deleteJson("/api/v1/client/equipment/{$created['id']}")->assertNoContent();
    expect($this->getJson('/api/v1/client/equipment')->json('data.items'))->toBe([]);
});

it('S05-TC-261 alerta por umbral con valores límite: justo en el borde no alerta, fuera sí, avisa en la campana y se cierra al volver', function () {
    [, $device] = s05Freezer($this->user->id);
    $monitor = app(IotMonitor::class);
    $at = CarbonImmutable::parse('2026-11-10 15:00:00');
    $monitor->record($device, -15.0, $at);   // borde superior: normal
    $monitor->record($device, -21.0, $at->addMinutes(5)); // borde inferior: normal
    expect(DB::table('iot_alerts')->count())->toBe(0);
    $monitor->record($device, -14.9, $at->addMinutes(10)); // fuera por 0,1: atención
    $monitor->record($device, -13.0, $at->addMinutes(15)); // sigue fuera: no duplica
    $alert = DB::table('iot_alerts')->first();
    expect(DB::table('iot_alerts')->count())->toBe(1)->and($alert->severity)->toBe('attention')
        ->and($alert->message)->toBe('Temperatura de Congeladora en -14,9 °C (rango -18 °C ± 3)');
    $monitor->record($device, -8.0, $at->addMinutes(25)); // más del doble de la tolerancia: falla
    expect(DB::table('iot_alerts')->first(['severity', 'message']))->toEqual((object) ['severity' => 'failure',
        'message' => 'Temperatura de Congeladora en -8 °C (rango -18 °C ± 3)']);
    $bell = $this->getJson('/api/v1/notifications')->json('data.items.0');
    expect([$bell['type'], $bell['category'], $bell['title']])->toBe(['iot.alert', 'iot', 'Atención en un equipo']);
    $monitor->record($device, -18.0, $at->addMinutes(30));
    expect(DB::table('iot_alerts')->value('resolved_at'))->not->toBeNull();
});

it('S05-TC-262 el recordatorio de mantenimiento se abre al vencer el plazo, una sola vez', function () {
    [, $device] = s05Freezer($this->user->id);
    DB::table('iot_devices')->where('id', $device)->update(['last_maintenance_at' => '2026-05-14 15:00:00']);
    $monitor = app(IotMonitor::class);
    expect($monitor->maintenance(CarbonImmutable::parse('2026-11-09 14:59:59')))->toBe(0);
    expect($monitor->maintenance(CarbonImmutable::parse('2026-11-10 15:00:00')))->toBe(1)
        ->and($monitor->maintenance(CarbonImmutable::parse('2026-11-11 15:00:00')))->toBe(0);
    expect(DB::table('iot_alerts')->first(['kind', 'severity']))->toEqual((object) ['kind' => 'maintenance', 'severity' => 'info']);
});

it('S05-TC-263 la simulación solo actúa sobre equipos demo, o sobre todos con IOT_SIMULATION, y es determinista con --at', function () {
    [, $demo] = s05Freezer($this->user->id, ['is_demo' => true, 'notes' => 'Simulación: falla en la tarde']);
    [, $real] = s05Freezer($this->user->id, ['name' => 'Congeladora real']);
    Artisan::call('tecnicoya:iot-simulate', ['--at' => '2026-11-10T20:00:00Z']); // 15:00 en Lima: deriva de la demo
    expect(DB::table('iot_readings')->where('device_id', $demo)->count())->toBe(1)
        ->and(DB::table('iot_readings')->where('device_id', $real)->count())->toBe(0)
        ->and(DB::table('iot_alerts')->where('device_id', $demo)->value('severity'))->toBe('failure');
    $first = DB::table('iot_readings')->where('device_id', $demo)->value('value');
    Artisan::call('tecnicoya:iot-simulate', ['--at' => '2026-11-10T20:00:00Z']);
    expect(DB::table('iot_readings')->where('device_id', $demo)->pluck('value')->unique()->all())->toBe([$first]);
    config(['tecnicoya.iot_simulation' => true]);
    Artisan::call('tecnicoya:iot-simulate', ['--at' => '2026-11-10T09:00:00Z']);
    expect(DB::table('iot_readings')->where('device_id', $real)->count())->toBe(1);
});

it('S05-TC-264 «Enviar a mi técnico de confianza» va dirigida al favorito o al matching normal, con idempotencia', function () {
    [, $device] = s05Freezer($this->user->id);
    app(IotMonitor::class)->record($device, -8.0, CarbonImmutable::now());
    $alert = DB::table('iot_alerts')->value('id');
    $this->postJson("/api/v1/client/iot/alerts/$alert/request")->assertUnprocessable();

    $key = (string) Str::uuid();
    $first = $this->postJson("/api/v1/client/iot/alerts/$alert/request", [], ['Idempotency-Key' => $key])->assertCreated()->json('data');
    $again = $this->postJson("/api/v1/client/iot/alerts/$alert/request", [], ['Idempotency-Key' => $key])->assertCreated()->json('data');
    $request = DB::table('service_requests')->find($first['request_id']);
    // La respuesta repetida sale del registro de idempotencia (JSON en MySQL): mismo contenido, otro orden de claves.
    expect($again)->toEqual($first)->and($first['directed'])->toBeFalse()
        ->and([$request->source, $request->status, $request->address])->toBe(['automatic', 'sent', 'Jr. Sintético 742'])
        ->and($request->description)->toContain('Alerta del sensor (demostración)')
        ->and((int) DB::table('iot_alerts')->value('request_id'))->toBe($first['request_id']);
    $this->postJson("/api/v1/client/iot/alerts/$alert/request", [], ['Idempotency-Key' => (string) Str::uuid()])->assertStatus(409);

    $favorite = Sprint04::technician(['subcategory' => 'frio-congeladores', 'profile' => ['display_name' => 'Rosa Quispe']]);
    DB::table('client_favorite_technicians')->insert(['client_user_id' => $this->user->id, 'technician_id' => $favorite->id]);
    app(IotMonitor::class)->record($device, -18.0, CarbonImmutable::now()->addMinute());
    app(IotMonitor::class)->record($device, -7.0, CarbonImmutable::now()->addMinutes(2));
    $second = DB::table('iot_alerts')->whereNull('request_id')->value('id');
    $directed = $this->postJson("/api/v1/client/iot/alerts/$second/request", [], ['Idempotency-Key' => (string) Str::uuid()])->assertCreated()->json('data');
    expect([$directed['directed'], $directed['technician']])->toBe([true, 'Rosa Quispe'])
        ->and(DB::table('service_requests')->where('id', $directed['request_id'])->value('target_technician_id'))->toBe($favorite->id);

    $other = ClientProfileFactory::new()->create(['plan' => 'premium'])->user;
    Sanctum::actingAs($other);
    $this->postJson("/api/v1/client/iot/alerts/$second/request", [], ['Idempotency-Key' => (string) Str::uuid()])->assertNotFound();
});

it('S05-TC-265 el panel de sensores trae estado, valor, umbral y 24 h simuladas; garantías y promociones de ejemplo', function () {
    [, $device] = s05Freezer($this->user->id);
    $now = CarbonImmutable::now();
    app(IotMonitor::class)->record($device, -30.0, $now->subDays(2)); // fuera de las 24 h
    app(IotMonitor::class)->record($device, -17.0, $now->subHours(3));
    app(IotMonitor::class)->record($device, -11.5, $now->subMinutes(5));
    $card = $this->getJson('/api/v1/client/iot/devices')->assertOk()->assertJsonPath('data.simulated', true)->json('data.items.0');
    expect([$card['status'], $card['value'], $card['threshold_label'], count($card['readings'])])->toBe(['failure', -11.5, '-18 °C ± 3', 2]);

    DB::table('service_requests')->insert(['client_id' => $this->profile->id, 'subcategory_id' => Sprint04::subcategory(), 'district_id' => Sprint04::district(),
        'description' => 'Servicio cerrado de ejemplo para la garantía.', 'address' => 'Jr. Sintético 742', 'mode' => 'asap', 'source' => 'automatic',
        'status' => 'closed', 'rule_version_id' => app(\App\Shared\Rules\RuleBook::class)->currentVersionId(), 'closed_at' => $now->subDays(5),
        'search_generation' => 1, 'version' => 3]);
    $warranty = $this->getJson('/api/v1/client/warranties')->assertOk()->assertJsonPath('data.sample', true)->json('data.items.0');
    expect([$warranty['days'], $warranty['active'], $warranty['can_claim']])->toBe([30, true, false]);
    $this->getJson('/api/v1/client/promotions')->assertOk()->assertJsonPath('data.sample', true);
});
