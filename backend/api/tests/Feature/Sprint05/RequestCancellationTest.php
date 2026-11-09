<?php

// S05-TC-156 a 161 · HU-S05-06 · RF-19 · D-28 · D-100: el titular cancela antes de iniciar la atención eligiendo un motivo de
// una lista cerrada; con «Otro motivo» el texto es obligatorio y con los demás, opcional. S05-TC-156 y 160 se adaptaron a la lista.
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->client = ClientProfileFactory::new()->create();
    Sanctum::actingAs($this->client->user);
});

function cancelRequest($test, object $request, array $overrides = [], ?string $key = null)
{
    $version = (int) DB::table('service_requests')->where('id', $request->id)->value('version');

    return $test->postJson("/api/v1/requests/{$request->id}/cancellation", $overrides + ['reason_code' => 'other', 'reason' => 'Ya resolví el problema por otro medio.', 'expected_version' => $version],
        ['Idempotency-Key' => $key ?? (string) Str::uuid()]);
}

function assignedRequest($test, object $client): array
{
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest(['client_id' => $client->id]);
    Sprint04::prepare($request->id);
    Sprint04::respond($test, $technician, Sprint04::offerTo($request->id, $technician->id), 'accept');
    Sprint04::select($test, $request, Sprint04::offerTo($request->id, $technician->id)->id)->assertOk();

    return [$request, $technician];
}

it('S05-TC-156 cancelar una asignada libera la cita, avisa al técnico y conserva el historial [TC-069]', function () {
    [$request, $technician] = assignedRequest($this, $this->client);
    $eventsBefore = DB::table('request_events')->where('request_id', $request->id)->count();

    $response = cancelRequest($this, $request)->assertOk();

    $row = DB::table('service_requests')->find($request->id);
    expect($response->json('data'))->toMatchArray(['id' => $request->id, 'status' => 'cancelled', 'version' => (int) $row->version])
        ->and($row->status)->toBe('cancelled')
        ->and($row->cancelled_at)->not->toBeNull()
        ->and($row->cancellation_reason_code)->toBe('other')
        ->and($row->cancellation_reason)->toBe('Ya resolví el problema por otro medio.')
        ->and(DB::table('participations')->where('request_id', $request->id)->value('status'))->toBe('cancelled')
        ->and(DB::table('appointments')->where('request_id', $request->id)->value('status'))->toBe('cancelled')
        ->and(DB::table('request_events')->where('request_id', $request->id)->count())->toBeGreaterThan($eventsBefore)
        ->and(DB::table('request_events')->where('request_id', $request->id)->where('event_type', 'request.cancelled')->sole()->actor_id)->toBe($this->client->user_id);
    $notice = DB::table('notifications')->where('user_id', $technician->user_id)->where('type', 'request.cancelled')->sole();
    expect($notice->body)->not->toContain('otro medio');
});

it('S05-TC-157 cancelar durante la búsqueda retira las ofertas, cierra la ronda y los trabajos pendientes no tienen efecto', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest(['client_id' => $this->client->id]);
    Sprint04::prepare($request->id);
    $round = Sprint04::rounds($request->id)[0];

    cancelRequest($this, $request)->assertOk();

    expect(Sprint04::offerTo($request->id, $technician->id)->status)->toBe('withdrawn')
        ->and(DB::table('offer_rounds')->find($round->id)->status)->toBe('closed')
        ->and(DB::table('notifications')->where('user_id', $technician->user_id)->where('type', 'request.cancelled')->count())->toBe(1);

    Sprint04::expireRound($round->id);
    Sprint04::retryPending($request->id, (int) $request->search_generation);

    expect(DB::table('service_requests')->find($request->id)->status)->toBe('cancelled')
        ->and(Sprint04::rounds($request->id))->toHaveCount(1);
});

it('S05-TC-158 con la atención iniciada o ya terminada responde 409 y no cambia nada [TC-070]', function () {
    foreach (['in_progress', 'completed', 'closed', 'unrated', 'cancelled', 'expired'] as $status) {
        $request = Sprint04::sentRequest(['client_id' => $this->client->id, 'status' => $status]);

        $response = cancelRequest($this, $request);

        $response->assertConflict()->assertJsonPath('error.code', 'CANCELLATION_NOT_ALLOWED');
        Sprint01::assertSpanishText($response->json('error.message'));
        $row = DB::table('service_requests')->find($request->id);
        expect($row->status)->toBe($status)->and($row->cancellation_reason)->toBeNull();
    }
});

it('S05-TC-159 un borrador también se puede cancelar y sale de las activas', function () {
    $draft = Sprint04::sentRequest(['client_id' => $this->client->id, 'status' => 'registered', 'submitted_at' => null, 'rule_version_id' => null, 'version' => 1]);

    cancelRequest($this, $draft)->assertOk();

    $data = $this->getJson('/api/v1/client/requests?tab=cancelled')->assertOk()->json('data');
    expect($data['counts']['active'])->toBe(0)
        ->and($data['items'][0]['requests'][0]['id'])->toBe($draft->id);
});

it('S05-TC-160 valida motivo, versión y permisos: ajena 404, otro rol 403, y la misma clave no cancela dos veces', function () {
    $request = Sprint04::sentRequest(['client_id' => $this->client->id]);
    // Con «Otro motivo» el texto es obligatorio, de 5 a 255 caracteres.
    Sprint01::assertSpanishValidation(cancelRequest($this, $request, ['reason' => 'Nada']), ['reason']);
    Sprint01::assertSpanishValidation(cancelRequest($this, $request, ['reason' => '   Nada   ']), ['reason']);
    Sprint01::assertSpanishValidation(cancelRequest($this, $request, ['reason' => str_repeat('a', 256)]), ['reason']);
    Sprint01::assertSpanishValidation(cancelRequest($this, $request, ['reason' => null]), ['reason']);
    // El motivo es obligatorio y de la lista cerrada; con los demás, el comentario admite hasta 255.
    Sprint01::assertSpanishValidation(cancelRequest($this, $request, ['reason_code' => null, 'reason' => null]), ['reason_code']);
    Sprint01::assertSpanishValidation(cancelRequest($this, $request, ['reason_code' => 'aburrido']), ['reason_code']);
    Sprint01::assertSpanishValidation(cancelRequest($this, $request, ['reason_code' => 'price', 'reason' => str_repeat('a', 256)]), ['reason']);
    $this->postJson("/api/v1/requests/{$request->id}/cancellation", ['reason_code' => 'other', 'reason' => 'Ya no lo necesito.', 'expected_version' => (int) $request->version])->assertUnprocessable();
    cancelRequest($this, $request, ['expected_version' => (int) $request->version + 5])->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');

    $foreign = Sprint04::sentRequest();
    cancelRequest($this, $foreign)->assertNotFound();
    expect(DB::table('service_requests')->find($foreign->id)->status)->toBe('sent');
    Sanctum::actingAs(Sprint04::technician()->user);
    cancelRequest($this, $request)->assertForbidden();
    Sanctum::actingAs($this->client->user);

    $key = (string) Str::uuid();
    $body = ['reason' => str_repeat('a', 255), 'expected_version' => (int) $request->version];
    $first = cancelRequest($this, $request, $body, $key)->assertOk();
    $retry = cancelRequest($this, $request, $body, $key)->assertOk();
    expect($retry->json('data'))->toEqual($first->json('data'))
        ->and(DB::table('request_events')->where('request_id', $request->id)->where('event_type', 'request.cancelled')->count())->toBe(1);
    cancelRequest($this, $request, ['reason' => 'Otro motivo distinto.', 'expected_version' => (int) $request->version], $key)->assertConflict();

    // Un motivo de la lista sin comentario es válido y se guarda sin texto.
    $solved = Sprint04::sentRequest(['client_id' => $this->client->id]);
    cancelRequest($this, $solved, ['reason_code' => 'solved', 'reason' => null])->assertOk();
    $row = DB::table('service_requests')->find($solved->id);
    expect($row->cancellation_reason_code)->toBe('solved')->and($row->cancellation_reason)->toBeNull();
    foreach (['other_technician', 'reschedule', 'price', 'mistake'] as $code) {
        $another = Sprint04::sentRequest(['client_id' => $this->client->id]);
        cancelRequest($this, $another, ['reason_code' => $code, 'reason' => ''])->assertOk();
        expect(DB::table('service_requests')->find($another->id)->cancellation_reason_code)->toBe($code);
    }
});

it('S05-TC-161 cancelar libera el cupo de pedidos y la franja del técnico; el titular lo ve en su línea de tiempo y el técnico no ve el motivo', function () {
    [$request, $technician] = assignedRequest($this, $this->client);
    expect($this->getJson('/api/v1/orders/quota')->json('data.active'))->toBe(1)
        ->and(DB::table('appointments')->where('technician_id', $technician->id)->where('status', 'confirmed')->count())->toBe(1);

    cancelRequest($this, $request)->assertOk();

    expect($this->getJson('/api/v1/orders/quota')->json('data.active'))->toBe(0)
        ->and(DB::table('appointments')->where('technician_id', $technician->id)->where('status', 'confirmed')->count())->toBe(0);
    $timeline = $this->getJson("/api/v1/requests/{$request->id}")->assertOk()->json('data.timeline');
    expect(end($timeline))->toMatchArray(['type' => 'request.cancelled', 'label' => 'Cancelaste la solicitud']);
    $another = Sprint04::sentRequest(['client_id' => $this->client->id]);
    Sprint04::prepare($another->id);
    expect(Sprint04::offerTo($another->id, $technician->id))->not->toBeNull();
    Sanctum::actingAs($technician->user);
    expect(json_encode($this->getJson("/api/v1/requests/{$request->id}")->assertOk()->json('data')))->not->toContain('otro medio');
});
