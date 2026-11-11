<?php

// S05-TC-313 a 317 · Panel del técnico, Fase T3 (modo rápido): Mis trabajos (pestañas con conteos, orden, búsqueda,
// paginación y dirección solo si el trabajo es suyo y está vigente o terminó) y Mi agenda (semana de lunes a domingo).
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    // Jueves 12 de noviembre de 2026, 15:30 en Lima.
    $this->travelTo(CarbonImmutable::parse('2026-11-12 15:30:00', 'America/Lima')->utc());
    $this->technician = Sprint04::technician();
    $this->client = ClientProfileFactory::new()->create(['district_id' => Sprint04::district()]);
});

/** Trabajo del técnico: solicitud, oferta aceptada, participación en $status y cita en $start (hora de Lima). */
function s05T3Job(int $technicianId, int $clientId, string $status, string $start, string $subcategory = 'computo-hardware', string $address = 'Jr. Sintético 313'): int
{
    $rule = app(RuleBook::class)->currentVersionId();
    $at = CarbonImmutable::parse($start, 'America/Lima')->utc();
    $available = $at->subDay();
    $request = DB::table('service_requests')->insertGetId(['client_id' => $clientId, 'subcategory_id' => Sprint04::subcategory($subcategory),
        'district_id' => Sprint04::district(), 'description' => 'Trabajo sintético de la Fase T3.', 'address' => $address, 'mode' => 'asap',
        'source' => 'profile', 'target_technician_id' => $technicianId, 'status' => $status, 'rule_version_id' => $rule,
        'submitted_at' => $available, 'search_generation' => 1, 'version' => 2]);
    $run = DB::table('matching_runs')->insertGetId(['request_id' => $request, 'search_generation' => 1, 'attempt_no' => 1, 'run_trigger' => 'submission',
        'rule_version_id' => $rule, 'algorithm_version' => 'matching_v2', 'status' => 'completed', 'started_at' => $available]);
    $round = DB::table('offer_rounds')->insertGetId(['request_id' => $request, 'matching_run_id' => $run, 'search_generation' => 1, 'round_no' => 1,
        'kind' => 'direct', 'status' => 'closed', 'opened_at' => $available, 'expires_at' => $available->addMinutes(10)]);
    $offer = DB::table('offers')->insertGetId(['round_id' => $round, 'request_id' => $request, 'technician_id' => $technicianId, 'status' => 'accepted',
        'available_at' => $available, 'expires_at' => $available->addMinutes(10), 'responded_at' => $available->addMinute(), 'reference_fee_snapshot' => 80]);
    $participation = DB::table('participations')->insertGetId(['request_id' => $request, 'technician_id' => $technicianId, 'offer_id' => $offer,
        'status' => $status, 'reference_fee_snapshot' => 80, 'assigned_at' => $available->addMinutes(20),
        'started_at' => in_array($status, ['in_progress', 'completed'], true) ? $at : null, 'completed_at' => $status === 'completed' ? $at->addHours(2) : null]);
    DB::table('appointments')->insert(['request_id' => $request, 'participation_id' => $participation, 'technician_id' => $technicianId,
        'starts_at' => $at, 'ends_at' => $at->addHours(2), 'status' => $status === 'cancelled' ? 'cancelled' : 'confirmed']);

    return $request;
}

it('S05-TC-313 Mis trabajos separa las pestañas con sus conteos y ordena por la visita o por lo más reciente', function () {
    $id = $this->technician->id;
    $late = s05T3Job($id, $this->client->id, 'assigned', '2026-11-14 15:00');
    $soon = s05T3Job($id, $this->client->id, 'assigned', '2026-11-13 09:00');
    s05T3Job($id, $this->client->id, 'in_progress', '2026-11-12 14:00');
    $old = s05T3Job($id, $this->client->id, 'completed', '2026-11-02 09:00');
    $recent = s05T3Job($id, $this->client->id, 'completed', '2026-11-10 09:00');
    s05T3Job($id, $this->client->id, 'cancelled', '2026-11-11 10:00');
    // De otro técnico: no aparece ni cuenta.
    s05T3Job(Sprint04::technician()->id, $this->client->id, 'assigned', '2026-11-13 10:00');
    Sanctum::actingAs($this->technician->user);

    $assigned = $this->getJson('/api/v1/technicians/me/jobs')->assertOk()->json('data');
    expect($assigned['counts'])->toBe(['assigned' => 2, 'in_progress' => 1, 'completed' => 2, 'cancelled' => 1])
        ->and(array_column($assigned['items'], 'request_id'))->toBe([$soon, $late])
        ->and($assigned['items'][0]['slot'])->toBe('morning')
        ->and(array_column($assigned['items'][0]['timeline'], 'code'))->toBe(['accepted', 'assigned']);
    expect(array_column($this->getJson('/api/v1/technicians/me/jobs?tab=completed')->json('data.items'), 'request_id'))->toBe([$recent, $old]);
    expect($this->getJson('/api/v1/technicians/me/jobs?tab=in_progress')->json('data.items.0.timeline.2.code'))->toBe('started');
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians/me/jobs?tab=archivados'), ['tab']);
});

it('S05-TC-314 la dirección exacta solo sale en trabajos asignados, en curso o completados; nunca en cancelados', function () {
    $id = $this->technician->id;
    foreach (['assigned' => '2026-11-13 09:00', 'in_progress' => '2026-11-12 14:00', 'completed' => '2026-11-10 09:00', 'cancelled' => '2026-11-11 10:00'] as $status => $start) {
        s05T3Job($id, $this->client->id, $status, $start, 'computo-hardware', "Dirección sintética de $status");
    }
    Sanctum::actingAs($this->technician->user);
    foreach (['assigned' => true, 'in_progress' => true, 'completed' => true, 'cancelled' => false] as $tab => $visible) {
        $item = $this->getJson("/api/v1/technicians/me/jobs?tab=$tab")->json('data.items.0');
        expect($item['address'])->toBe($visible ? "Dirección sintética de $tab" : null);
    }
    expect(json_encode($this->getJson('/api/v1/technicians/me/jobs?tab=cancelled')->json()))->not->toContain('Dirección sintética de cancelled')
        ->and(collect($this->getJson('/api/v1/technicians/me/jobs?tab=cancelled')->json('data.items.0.timeline'))->last()['code'])->toBe('cancelled');
});

it('S05-TC-315 busca por trabajo, distrito o número y pagina los resultados', function () {
    $id = $this->technician->id;
    $network = s05T3Job($id, $this->client->id, 'assigned', '2026-11-13 09:00', 'computo-redes');
    foreach (range(1, 9) as $day) {
        s05T3Job($id, $this->client->id, 'assigned', sprintf('2026-11-%02d 15:00', 13 + ($day % 5)));
    }
    Sanctum::actingAs($this->technician->user);
    $page = $this->getJson('/api/v1/technicians/me/jobs?per_page=4&page=2')->json('data');
    expect($page['pagination'])->toBe(['page' => 2, 'per_page' => 4, 'total' => 10, 'last_page' => 3])->and($page['items'])->toHaveCount(4);
    $name = DB::table('subcategories')->where('id', Sprint04::subcategory('computo-redes'))->value('name');
    expect(array_column($this->getJson('/api/v1/technicians/me/jobs?q='.urlencode($name))->json('data.items'), 'request_id'))->toBe([$network])
        ->and(array_column($this->getJson("/api/v1/technicians/me/jobs?q=%23$network")->json('data.items'), 'request_id'))->toContain($network)
        ->and($this->getJson('/api/v1/technicians/me/jobs?q=nada-que-coincida')->json('data.counts.assigned'))->toBe(0);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians/me/jobs?q='.str_repeat('x', 61)), ['q']);
});

it('S05-TC-316 el detalle de un trabajo ajeno responde 404 y Mis trabajos solo responde al técnico', function () {
    $mine = s05T3Job($this->technician->id, $this->client->id, 'assigned', '2026-11-13 09:00');
    $other = s05T3Job(Sprint04::technician()->id, $this->client->id, 'assigned', '2026-11-13 11:00');
    Sanctum::actingAs($this->technician->user);
    $this->getJson("/api/v1/technicians/me/jobs/$mine")->assertOk()->assertJsonPath('data.description', 'Trabajo sintético de la Fase T3.')
        ->assertJsonPath('data.address', 'Jr. Sintético 313');
    $this->getJson("/api/v1/technicians/me/jobs/$other")->assertNotFound();
    foreach ([$this->client->user, Sprint02::admin()] as $user) {
        Sprint01::forgetSession();
        Sanctum::actingAs($user);
        $this->getJson('/api/v1/technicians/me/jobs')->assertForbidden();
        $this->getJson('/api/v1/technicians/me/agenda')->assertForbidden();
    }
});

it('S05-TC-317 Mi agenda trae las visitas confirmadas de lunes a domingo (hora de Lima), sin cancelados ni otra semana', function () {
    $id = $this->technician->id;
    $monday = s05T3Job($id, $this->client->id, 'assigned', '2026-11-09 08:00');      // lunes, primer minuto de la semana válido
    $sunday = s05T3Job($id, $this->client->id, 'assigned', '2026-11-15 20:00');      // domingo por la noche
    s05T3Job($id, $this->client->id, 'assigned', '2026-11-16 08:00');                 // lunes siguiente
    s05T3Job($id, $this->client->id, 'cancelled', '2026-11-12 10:00');
    Sanctum::actingAs($this->technician->user);

    $week = $this->getJson('/api/v1/technicians/me/agenda')->assertOk()->json('data');
    expect([$week['week_start'], $week['week_end']])->toBe(['2026-11-09', '2026-11-15'])
        ->and(array_column($week['visits'], 'request_id'))->toBe([$monday, $sunday])
        ->and(array_column($week['visits'], 'slot'))->toBe(['morning', 'night'])
        ->and($week['visits'][1]['date'])->toBe('2026-11-15');
    // Cualquier día de la semana siguiente devuelve esa semana.
    expect($this->getJson('/api/v1/technicians/me/agenda?week=2026-11-18')->json('data.week_start'))->toBe('2026-11-16');
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians/me/agenda?week=18-11-2026'), ['week']);
});
