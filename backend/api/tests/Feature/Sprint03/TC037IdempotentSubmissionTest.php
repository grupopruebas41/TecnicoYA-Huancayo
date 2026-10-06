<?php

// TC-037 · HU-S03-06 · RF-01, RF-02, RF-33 · AC-S03-06-01
// El nombre del estado tras el envío no se fija aquí: la transición exacta sigue pendiente de P22.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Queue::fake();
    Sprint01::actAsSpa($this);
});

it('TC-037: repite el mismo envío con su clave y obtiene el mismo resultado sin duplicar solicitud ni evento', function () {
    // Dado una solicitud propia registrada y una clave de idempotencia
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $request = $this->postJson('/api/v1/requests', Sprint03::requestPayload(DistrictFactory::new()->create()->id))
        ->assertCreated()->json('data');
    $url = "/api/v1/requests/{$request['id']}/submission";
    $headers = ['Idempotency-Key' => (string) Str::uuid()];

    // Cuando falta la confirmación del resumen, no se envía y el mensaje está en español
    $invalid = $this->postJson($url, ['expected_version' => $request['version']], $headers);
    Sprint01::assertSpanishValidation($invalid, ['summary_confirmed']);
    $this->assertDatabaseMissing('request_events', ['request_id' => $request['id'], 'event_type' => 'request.submitted']);

    // Cuando confirma el envío y lo repite con la misma clave tras perder la respuesta
    $body = ['expected_version' => $request['version'], 'summary_confirmed' => true];
    $first = $this->postJson($url, $body, $headers)->assertAccepted();
    $retry = $this->postJson($url, $body, $headers)->assertAccepted();

    // Entonces obtiene el mismo resultado, una sola solicitud y un solo evento de envío
    expect($retry->json('data'))->toBe($first->json('data'));
    $this->assertDatabaseCount('service_requests', 1);
    expect(DB::table('request_events')->where('request_id', $request['id'])->where('event_type', 'request.submitted')->count())->toBe(1);
    $this->assertDatabaseHas('service_requests', ['id' => $request['id'], 'version' => $first->json('data.version')]);

    // Y la misma clave con otro cuerpo se rechaza como conflicto
    $this->postJson($url, ['expected_version' => $request['version'] + 5, 'summary_confirmed' => true], $headers)->assertConflict();
});
