<?php

// S05-TC-187 a 189 · Fase 3 del panel final · Técnicos favoritos (D-101, propuesta): tabla client_favorite_technicians,
// solo del cliente titular; guardar y quitar son idempotentes y la marca sale en la búsqueda y en el perfil.
use Database\Factories\ClientProfileFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\UserFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->client = ClientProfileFactory::new()->create(['district_id' => Sprint04::district()])->user;
    $this->rosa = Sprint04::technician(['profile' => ['display_name' => 'Rosa'], 'slots' => false]);
    $this->diego = Sprint04::technician(['profile' => ['display_name' => 'Diego'], 'slots' => false]);
    Sanctum::actingAs($this->client);
});

it('S05-TC-187 el cliente guarda y quita favoritos de forma idempotente y solo ve los suyos', function () {
    $this->putJson("/api/v1/client/favorites/{$this->rosa->id}")->assertOk()->assertJsonPath('data', ['technician_id' => $this->rosa->id, 'favorite' => true]);
    $this->putJson("/api/v1/client/favorites/{$this->rosa->id}")->assertOk();
    $this->putJson("/api/v1/client/favorites/{$this->diego->id}")->assertOk();
    expect(DB::table('client_favorite_technicians')->where('client_user_id', $this->client->id)->count())->toBe(2);

    $other = ClientProfileFactory::new()->create()->user;
    DB::table('client_favorite_technicians')->insert(['client_user_id' => $other->id, 'technician_id' => $this->rosa->id]);

    $list = $this->getJson('/api/v1/client/favorites')->assertOk()->json('data.items');
    expect(array_column($list, 'display_name'))->toEqualCanonicalizing(['Rosa', 'Diego'])
        ->and(array_unique(array_column($list, 'favorite')))->toBe([true]);

    $this->deleteJson("/api/v1/client/favorites/{$this->rosa->id}")->assertNoContent();
    $this->deleteJson("/api/v1/client/favorites/{$this->rosa->id}")->assertNoContent();
    expect(array_column($this->getJson('/api/v1/client/favorites')->json('data.items'), 'display_name'))->toBe(['Diego'])
        ->and(DB::table('client_favorite_technicians')->where('client_user_id', $other->id)->count())->toBe(1);
});

it('S05-TC-188 favoritos: sin sesión 401, otros roles 403 y un técnico no habilitado 404 en español', function () {
    $pending = TechnicianProfileFactory::new()->create();
    $this->putJson("/api/v1/client/favorites/{$pending->id}")->assertNotFound()->assertJsonPath('message', 'Técnico no disponible.');
    $this->putJson('/api/v1/client/favorites/999999')->assertNotFound();
    expect(DB::table('client_favorite_technicians')->count())->toBe(0);

    Sanctum::actingAs(UserFactory::new()->technician()->create());
    $this->getJson('/api/v1/client/favorites')->assertForbidden();
    $this->putJson("/api/v1/client/favorites/{$this->rosa->id}")->assertForbidden();
    Sanctum::actingAs(Sprint02::admin());
    $this->deleteJson("/api/v1/client/favorites/{$this->rosa->id}")->assertForbidden();

    Sprint01::forgetSession();
    $this->getJson('/api/v1/client/favorites')->assertUnauthorized();
    $this->putJson("/api/v1/client/favorites/{$this->rosa->id}")->assertUnauthorized();
    expect(DB::table('client_favorite_technicians')->count())->toBe(0);
});

it('S05-TC-189 la marca de favorito en la búsqueda y en el perfil es solo la del cliente de la sesión', function () {
    $other = ClientProfileFactory::new()->create()->user;
    DB::table('client_favorite_technicians')->insert(['client_user_id' => $other->id, 'technician_id' => $this->diego->id]);
    $this->putJson("/api/v1/client/favorites/{$this->rosa->id}")->assertOk();

    $items = collect($this->getJson('/api/v1/technicians')->assertOk()->json('data.items'))->keyBy('display_name');
    expect($items['Rosa']['favorite'])->toBeTrue()->and($items['Diego']['favorite'])->toBeFalse()
        ->and($this->getJson("/api/v1/technicians/{$this->rosa->id}")->json('data.favorite'))->toBeTrue()
        ->and($this->getJson("/api/v1/technicians/{$this->diego->id}")->json('data.favorite'))->toBeFalse();
});
