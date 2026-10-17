<?php

// S04-TC-076 a 078 · Transversal D-60 · RF-01; RT-06: POST /requests acepta Idempotency-Key opcional con el mismo
// mecanismo del envío (IDEM-01).
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint03;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->payload = Sprint03::requestPayload(Sprint04::district());
});

it('S04-TC-076 no duplica el borrador al crear dos veces con la misma clave', function () {
    $key = ['Idempotency-Key' => (string) Str::uuid()];

    $first = $this->postJson('/api/v1/requests', $this->payload, $key)->assertCreated()->json('data');
    $second = $this->postJson('/api/v1/requests', $this->payload, $key)->assertCreated()->json('data');

    expect($second['id'])->toBe($first['id'])
        ->and($second)->toEqual($first)
        ->and(DB::table('service_requests')->count())->toBe(1)
        ->and(DB::table('request_events')->where('event_type', 'request.registered')->count())->toBe(1);
});

it('S04-TC-077 rechaza la misma clave con otro cuerpo', function () {
    $key = ['Idempotency-Key' => (string) Str::uuid()];
    $this->postJson('/api/v1/requests', $this->payload, $key)->assertCreated();

    $this->postJson('/api/v1/requests', ['description' => 'Otra descripción distinta de la original.'] + $this->payload, $key)
        ->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');

    expect(DB::table('service_requests')->pluck('description')->all())->toBe([$this->payload['description']]);
});

it('S04-TC-078 sigue creando sin clave porque la cabecera es opcional en la API', function () {
    $first = $this->postJson('/api/v1/requests', $this->payload)->assertCreated()->json('data.id');
    $second = $this->postJson('/api/v1/requests', $this->payload)->assertCreated()->json('data.id');

    expect($second)->not->toBe($first)
        ->and(DB::table('service_requests')->count())->toBe(2);
});
