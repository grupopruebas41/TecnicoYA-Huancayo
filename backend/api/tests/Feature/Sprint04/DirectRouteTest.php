<?php

// S04-TC-013, 032, 056 y 057 · HU-S04-07 · RF-16, RF-17; RN-12 · D-22: la solicitud dirigida desde un perfil solo
// contacta al técnico objetivo; si no está disponible o no responde, el titular decide si se buscan alternativas.
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->target = Sprint04::technician(['fee' => '150.00', 'years' => 1]);
    $this->others = [Sprint04::technician(['fee' => '60.00', 'years' => 9]), Sprint04::technician(['fee' => '70.00', 'years' => 8])];
    $this->request = Sprint04::sentRequest(['source' => 'profile', 'target_technician_id' => $this->target->id]);
});

it('S04-TC-013 no activa a otros técnicos cuando el objetivo de la solicitud dirigida no es elegible [TC-052]', function () {
    Sprint04::pause($this->target->id, CarbonImmutable::now()->subMinutes(5));

    Sprint04::prepare($this->request->id);

    expect(Sprint04::rounds($this->request->id))->toBe([])
        ->and(DB::table('offers')->count())->toBe(0)
        ->and(Sprint04::events($this->request->id, 'matching.direct_unavailable'))->toBe(1);
    Sanctum::actingAs(Sprint04::clientUser($this->request));
    $this->getJson("/api/v1/requests/{$this->request->id}")->assertOk()
        ->assertJsonPath('data.phase', 'direct_declined')
        ->assertJsonPath('data.search.alternatives_available', true);
});

it('S04-TC-032 abre una ronda directa de un solo destinatario aunque otros puntúen mejor', function () {
    Sprint04::prepare($this->request->id);

    $rounds = Sprint04::rounds($this->request->id);
    expect($rounds)->toHaveCount(1)
        ->and($rounds[0]->kind)->toBe('direct')
        ->and(Sprint04::offeredIn($rounds[0]->id))->toBe([$this->target->id]);
});

it('S04-TC-056 ofrece alternativas sin contactar a nadie cuando el objetivo no responde [TC-052]', function () {
    $this->others[] = Sprint04::technician();
    $this->others[] = Sprint04::technician();
    Sprint04::prepare($this->request->id);
    $round = Sprint04::rounds($this->request->id)[0];

    $this->travel(10)->minutes();
    Sprint04::expireRound($round->id);

    expect(Sprint04::offerTo($this->request->id, $this->target->id)->status)->toBe('expired')
        ->and(DB::table('offer_rounds')->where('id', $round->id)->value('status'))->toBe('closed')
        ->and(DB::table('offers')->count())->toBe(1);
    Sanctum::actingAs(Sprint04::clientUser($this->request));
    $candidates = $this->getJson("/api/v1/requests/{$this->request->id}/candidates")->assertOk()
        ->assertJsonPath('data.phase', 'direct_declined')->assertJsonPath('data.accepted', [])->json('data.alternatives');
    expect($candidates)->toHaveCount(3)
        ->and(array_column(array_column($candidates, 'technician'), 'id'))->not->toContain($this->target->id)
        ->and(array_key_exists('offer_id', $candidates[0]))->toBeFalse();
});

it('S04-TC-057 solo el titular autoriza la búsqueda alternativa, que excluye al técnico objetivo', function () {
    Sprint04::prepare($this->request->id);
    $this->travel(10)->minutes();
    Sprint04::expireRound(Sprint04::rounds($this->request->id)[0]->id);
    $version = (int) DB::table('service_requests')->where('id', $this->request->id)->value('version');

    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->postJson("/api/v1/requests/{$this->request->id}/alternative-searches", ['expected_version' => $version])->assertNotFound();
    expect(Sprint04::generation($this->request->id))->toBe(1);

    Sanctum::actingAs(Sprint04::clientUser($this->request));
    $this->postJson("/api/v1/requests/{$this->request->id}/alternative-searches", ['expected_version' => $version],
        ['Idempotency-Key' => (string) Str::uuid()])
        ->assertAccepted()->assertJsonPath('data.search_generation', 2)->assertJsonPath('data.phase', 'matching');
    Sprint04::prepare($this->request->id);

    $rounds = Sprint04::rounds($this->request->id);
    expect($rounds)->toHaveCount(2)
        ->and($rounds[1]->kind)->toBe('automatic')
        ->and(Sprint04::offeredIn($rounds[1]->id))->not->toContain($this->target->id)
        ->and(Sprint04::offeredIn($rounds[1]->id))->toHaveCount(2);
});
