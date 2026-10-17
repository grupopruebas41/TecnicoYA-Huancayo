<?php

// S04-TC-037, 038, 052 y 069 · HU-S04-05 · RF-15; SEC-S04-01, SEC-S04-05 · tabla rol × ruta del contrato §2: nadie ve
// ni responde ofertas ajenas y la dirección exacta solo se ve tras la asignación.
use Database\Factories\ClientProfileFactory;
use Database\Factories\UserFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->a = Sprint04::technician(['fee' => '60.00']);
    $this->b = Sprint04::technician(['fee' => '70.00']);
    $this->request = Sprint04::sentRequest();
    Sprint04::prepare($this->request->id);
    $this->offerA = Sprint04::offerTo($this->request->id, $this->a->id);
    $this->offerB = Sprint04::offerTo($this->request->id, $this->b->id);
});

it('S04-TC-037 no deja que un técnico responda la oferta de otro', function () {
    Sprint04::respond($this, $this->a, $this->offerB, 'accept')->assertNotFound()->assertJsonPath('error.code', 'NOT_FOUND');

    $offer = Sprint04::offerTo($this->request->id, $this->b->id);
    expect($offer->status)->toBe('pending')->and((int) $offer->version)->toBe(1);
});

it('S04-TC-038 responde ofertas según la tabla de decisión por rol', function () {
    $url = "/api/v1/offers/{$this->offerA->id}/response";
    $body = ['decision' => 'accept', 'expected_version' => 1];
    $headers = ['Idempotency-Key' => (string) Str::uuid()];
    $admin = UserFactory::new()->create(['role_id' => DB::table('roles')->where('code', 'admin')->value('id')]);
    DB::table('technician_profiles')->where('id', $this->a->id)->update(['status' => 'suspended']);

    $this->postJson($url, $body, $headers)->assertUnauthorized();
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->postJson($url, $body, $headers)->assertForbidden();
    Sanctum::actingAs($admin);
    $this->postJson($url, $body, $headers)->assertForbidden();
    Sanctum::actingAs($this->a->user);
    $this->postJson($url, $body, $headers)->assertForbidden();

    expect(Sprint04::offerTo($this->request->id, $this->a->id)->status)->toBe('pending')
        ->and(DB::table('request_events')->whereIn('event_type', ['offer.accepted', 'offer.rejected'])->count())->toBe(0);
});

it('S04-TC-052 muestra la dirección exacta solo al técnico asignado', function () {
    Sanctum::actingAs($this->a->user);
    $this->getJson("/api/v1/offers/{$this->offerA->id}")->assertOk()
        ->assertJsonPath('data.request.description', 'La computadora no enciende desde ayer.')
        ->assertJsonPath('data.request.district.id', Sprint04::district())
        ->assertJsonPath('data.request.address', null);
    $this->getJson("/api/v1/requests/{$this->request->id}")->assertOk()->assertJsonPath('data.address', null);

    Sprint04::respond($this, $this->a, $this->offerA, 'accept')->assertOk();
    Sprint04::respond($this, $this->b, $this->offerB, 'accept')->assertOk();
    Sprint04::select($this, $this->request, $this->offerA->id)->assertOk();

    Sanctum::actingAs($this->a->user);
    $this->getJson("/api/v1/offers/{$this->offerA->id}")->assertOk()->assertJsonPath('data.request.address', 'Jirón sintético 742, interior B');
    $this->getJson("/api/v1/requests/{$this->request->id}")->assertOk()->assertJsonPath('data.address', 'Jirón sintético 742, interior B');
    Sanctum::actingAs($this->b->user);
    $this->getJson("/api/v1/offers/{$this->offerB->id}")->assertOk()->assertJsonPath('data.request.address', null);
    $this->getJson("/api/v1/requests/{$this->request->id}")->assertOk()->assertJsonPath('data.address', null);
});

it('S04-TC-069 muestra en ofertas y bandeja solo lo propio', function () {
    Sanctum::actingAs($this->a->user);

    expect(array_column($this->getJson('/api/v1/offers')->assertOk()->json('data.items'), 'id'))->toBe([$this->offerA->id]);
    $this->getJson("/api/v1/offers/{$this->offerB->id}")->assertNotFound();
    $notifications = $this->getJson('/api/v1/notifications')->assertOk()->json('data.items');
    expect($notifications)->toHaveCount(1)
        ->and($notifications[0]['subject'])->toBe(['type' => 'offer', 'id' => $this->offerA->id])
        ->and(DB::table('notifications')->where('user_id', $this->b->user_id)->count())->toBe(1);
});
