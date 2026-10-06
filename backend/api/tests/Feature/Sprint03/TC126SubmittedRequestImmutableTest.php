<?php

// TC-126 · HU-S03-06 · RF-02, RF-33 · Módulo A · plan §9.2
// La cancelación (RN-15, TC-069) es otra operación y no se prueba aquí.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\MediaFileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
});

it('TC-126: rechaza modificar o eliminar una solicitud ya enviada y conserva solicitud, evidencias y eventos', function () {
    // Dado una solicitud propia con una foto, editable antes del envío
    $client = ClientProfileFactory::new()->create();
    Sanctum::actingAs($client->user);
    $request = $this->postJson('/api/v1/requests', Sprint03::requestPayload(DistrictFactory::new()->create()->id))->assertCreated()->json('data');
    $photo = MediaFileFactory::new()->create(['owner_id' => $client->user_id]);
    $version = $this->postJson("/api/v1/requests/{$request['id']}/attachments", ['media_id' => $photo->id, 'expected_version' => $request['version']])
        ->assertCreated()->json('data.version');

    // Antes del envío, una corrección inválida no se guarda y el mensaje está en español
    Sprint01::assertSpanishValidation($this->patchJson("/api/v1/requests/{$request['id']}", ['description' => '', 'expected_version' => $version]), ['description']);
    $version = $this->patchJson("/api/v1/requests/{$request['id']}", ['description' => 'Descripción corregida antes de enviar.', 'expected_version' => $version])
        ->assertOk()->json('data.version');
    $version = $this->postJson("/api/v1/requests/{$request['id']}/submission", ['expected_version' => $version, 'summary_confirmed' => true],
        ['Idempotency-Key' => (string) Str::uuid()])->assertAccepted()->json('data.version');
    $snapshot = [
        DB::table('service_requests')->find($request['id']),
        DB::table('request_attachments')->where('request_id', $request['id'])->get()->toArray(),
        DB::table('request_events')->where('request_id', $request['id'])->get()->toArray(),
    ];

    // Cuando intenta modificar la descripción, la subcategoría o el distrito tras el envío
    $edit = $this->patchJson("/api/v1/requests/{$request['id']}", ['description' => 'Intento posterior al envío.', 'expected_version' => $version]);
    $edit->assertConflict();
    Sprint01::assertSpanishText((string) $edit->json('message'));

    // Y cuando intenta eliminarla, no existe esa operación
    $this->deleteJson("/api/v1/requests/{$request['id']}")->assertMethodNotAllowed();

    // Entonces la solicitud, sus evidencias y sus eventos quedan intactos
    expect([
        DB::table('service_requests')->find($request['id']),
        DB::table('request_attachments')->where('request_id', $request['id'])->get()->toArray(),
        DB::table('request_events')->where('request_id', $request['id'])->get()->toArray(),
    ])->toEqual($snapshot);
});
