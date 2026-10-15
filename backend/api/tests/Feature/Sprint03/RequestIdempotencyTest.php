<?php

// S03-TC-032 a 037 · HU-S03-01 y 06 · RF-02, RF-33 · SEC-S03-05: envío idempotente (TC-037).
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
    $this->client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($this->client);
    $this->districtId = DistrictFactory::new()->create()->id;
    $this->request = Sprint03::register($this, $this->districtId);
});

function submittedEvents(int $id): int
{
    return DB::table('request_events')->where('request_id', $id)->where('event_type', 'request.submitted')->count();
}

it('S03-TC-032 el doble clic con dos claves distintas envía una sola vez [TC-037]', function () {
    Sprint03::submit($this, $this->request['id'], $this->request['version'])->assertAccepted();
    Sprint03::submit($this, $this->request['id'], $this->request['version'])->assertConflict();

    expect(submittedEvents($this->request['id']))->toBe(1)
        ->and(DB::table('idempotency_records')->count())->toBe(1);
});

it('S03-TC-033 la misma clave con otro cuerpo no altera la respuesta guardada ni la solicitud [TC-037]', function () {
    $key = (string) Str::uuid();
    $first = Sprint03::submit($this, $this->request['id'], $this->request['version'], $key)->assertAccepted()->json('data');
    $stored = DB::table('idempotency_records')->first();

    Sprint03::submit($this, $this->request['id'], $this->request['version'] + 1, $key)->assertConflict();

    expect(DB::table('idempotency_records')->first())->toEqual($stored)
        ->and(Sprint03::submit($this, $this->request['id'], $this->request['version'], $key)->assertAccepted()->json('data'))->toBe($first)
        ->and(submittedEvents($this->request['id']))->toBe(1);
});

it('S03-TC-034 exige una clave de 1 a 255 caracteres', function () {
    $url = "/api/v1/requests/{$this->request['id']}/submission";
    $body = ['expected_version' => $this->request['version'], 'summary_confirmed' => true];

    Sprint01::assertSpanishValidation($this->postJson($url, $body), ['idempotency_key']);
    Sprint01::assertSpanishValidation($this->postJson($url, $body, ['Idempotency-Key' => str_repeat('k', 256)]), ['idempotency_key']);
    expect(DB::table('service_requests')->where('id', $this->request['id'])->value('status'))->toBe('registered');

    $this->postJson($url, $body, ['Idempotency-Key' => str_repeat('k', 255)])->assertAccepted();
});

it('S03-TC-035 no envía con el resumen marcado como no confirmado [TC-028]', function () {
    $response = $this->postJson("/api/v1/requests/{$this->request['id']}/submission",
        ['expected_version' => $this->request['version'], 'summary_confirmed' => false], ['Idempotency-Key' => (string) Str::uuid()]);

    Sprint01::assertSpanishValidation($response, ['summary_confirmed']);
    expect(DB::table('service_requests')->where('id', $this->request['id'])->value('status'))->toBe('registered')
        ->and(submittedEvents($this->request['id']))->toBe(0);
});

it('S03-TC-036 otro cliente no puede enviar la solicitud ajena ni consumir una clave [TC-038]', function () {
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);

    Sprint03::submit($this, $this->request['id'], $this->request['version'])->assertNotFound();

    expect(DB::table('service_requests')->where('id', $this->request['id'])->value('status'))->toBe('registered')
        ->and(submittedEvents($this->request['id']))->toBe(0)
        ->and(DB::table('idempotency_records')->count())->toBe(0);
});

it('S03-TC-037 la misma clave en dos clientes produce dos envíos independientes [TC-037]', function () {
    $key = (string) Str::uuid();
    $mine = Sprint03::submit($this, $this->request['id'], $this->request['version'], $key)->assertAccepted()->json('data');

    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $other = Sprint03::register($this, $this->districtId);
    $theirs = Sprint03::submit($this, $other['id'], $other['version'], $key)->assertAccepted()->json('data');

    expect($mine['id'])->toBe($this->request['id'])
        ->and($theirs['id'])->toBe($other['id'])
        ->and(DB::table('service_requests')->where('status', 'sent')->count())->toBe(2)
        ->and(DB::table('idempotency_records')->count())->toBe(2);
});
