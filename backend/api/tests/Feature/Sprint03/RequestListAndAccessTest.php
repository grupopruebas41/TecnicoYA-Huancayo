<?php

// S03-TC-038 a 041 · HU-S03-01, 05 y 06 · RF-01, RF-33: origen, listado, cuentas suspendidas y eventos.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->districtId = DistrictFactory::new()->create()->id;
});

it('S03-TC-038 la búsqueda automática no guarda un técnico objetivo enviado por el cliente [TC-035]', function () {
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $technician = Sprint03::searchableTechnician('computo-hardware', [$this->districtId]);

    $request = Sprint03::register($this, $this->districtId, ['source' => 'automatic', 'target_technician_id' => $technician->id]);

    expect($request['source'])->toBe('automatic')
        ->and($request['target_technician_id'])->toBeNull()
        ->and(DB::table('service_requests')->where('id', $request['id'])->value('target_technician_id'))->toBeNull();
});

it('S03-TC-039 Mis solicitudes lista solo las propias, de la más nueva a la más antigua y sin datos privados', function () {
    $mine = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $foreign = Sprint03::register($this, $this->districtId);
    Sanctum::actingAs($mine);
    $older = Sprint03::register($this, $this->districtId);
    $newer = Sprint03::register($this, $this->districtId);

    $items = $this->getJson('/api/v1/requests')->assertOk()->json('data');

    expect(array_column($items, 'id'))->toBe([$newer['id'], $older['id']])
        ->and(array_column($items, 'id'))->not->toContain($foreign['id']);
    foreach ($items as $item) {
        expect($item)->not->toHaveKeys(['description', 'address', 'client_id']);
    }

    Sanctum::actingAs(TechnicianProfileFactory::new()->approved()->create()->user);
    $this->getJson('/api/v1/requests')->assertForbidden();
    Sprint01::forgetSession();
    $this->getJson('/api/v1/requests')->assertUnauthorized();
});

it('S03-TC-040 una cuenta de cliente suspendida no registra ni envía solicitudes', function () {
    $client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($client);
    $request = Sprint03::register($this, $this->districtId);
    DB::table('users')->where('id', $client->id)->update(['is_active' => false]);
    $before = Sprint03::requestTablesSnapshot();

    $this->postJson('/api/v1/requests', Sprint03::requestPayload($this->districtId))->assertForbidden();
    Sprint03::submit($this, $request['id'], $request['version'])->assertForbidden();

    expect(Sprint03::requestTablesSnapshot())->toBe($before)
        ->and(DB::table('service_requests')->where('id', $request['id'])->value('status'))->toBe('registered');
});

it('S03-TC-041 registra un evento por cambio con actor, estados y versión correlativa sin datos privados', function () {
    $client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($client);
    $request = Sprint03::register($this, $this->districtId);
    $url = "/api/v1/requests/{$request['id']}";
    $version = $this->patchJson($url, ['description' => 'Descripción corregida con más detalle.', 'expected_version' => 1])->assertOk()->json('data.version');
    $photo = MediaFileFactory::new()->create(['owner_id' => $client->id, 'mime_type' => 'image/png']);
    $version = $this->postJson("$url/attachments", ['media_id' => $photo->id, 'expected_version' => $version])->assertCreated()->json('data.version');
    $this->deleteJson("$url/attachments/{$photo->id}", ['expected_version' => $version])->assertNoContent();
    Sprint03::submit($this, $request['id'], $version + 1)->assertAccepted();

    $events = DB::table('request_events')->where('request_id', $request['id'])->orderBy('id')->get();

    expect($events->pluck('event_type')->all())->toBe(['request.registered', 'request.corrected', 'request.attachment_added', 'request.attachment_removed', 'request.submitted'])
        ->and($events->pluck('request_version')->map(fn ($v) => (int) $v)->all())->toBe([1, 2, 3, 4, 5])
        ->and($events->pluck('actor_id')->unique()->values()->all())->toBe([$client->id])
        ->and($events->last()->from_status)->toBe('registered')
        ->and($events->last()->to_status)->toBe('sent');
    foreach ($events as $event) {
        expect((string) $event->metadata)->not->toContain('Descripción corregida')->not->toContain('Calle sintética');
    }
});
