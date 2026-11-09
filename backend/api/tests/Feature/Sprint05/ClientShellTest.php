<?php

// S05-TC-217 a 221 · Fase 4 del panel final (modo rápido): direcciones del cliente, preferencias de comunicación y menú
// contraído guardado en la cuenta.
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->user = ClientProfileFactory::new()->create(['district_id' => Sprint04::district()])->user;
    Sanctum::actingAs($this->user);
});

function s05Address(array $overrides = []): array
{
    return $overrides + ['kind' => 'home', 'district_id' => Sprint04::district(), 'address' => 'Jr. Sintético 742', 'reference' => 'Frente al parque'];
}

it('S05-TC-217 el cliente agrega, edita y elimina direcciones; la primera y la marcada son la predeterminada', function () {
    $home = $this->postJson('/api/v1/client/addresses', s05Address())->assertCreated()->json('data');
    expect([$home['label'], $home['is_default'], $home['district_name']])->toBe(['Casa', true, 'Huancayo']);
    $shop = $this->postJson('/api/v1/client/addresses', s05Address(['kind' => 'business', 'address' => 'Av. Sintética 100',
        'district_id' => Sprint04::district('EL-TAMBO'), 'is_default' => true]))->assertCreated()->json('data');

    $list = $this->getJson('/api/v1/client/addresses')->assertOk()->json('data.items');
    expect(array_column($list, 'label'))->toBe(['Negocio', 'Casa'])->and(array_column($list, 'is_default'))->toBe([true, false]);

    $this->patchJson("/api/v1/client/addresses/{$home['id']}", s05Address(['address' => 'Jr. Sintético 900', 'expected_version' => 1]))
        ->assertOk()->assertJsonPath('data.address', 'Jr. Sintético 900')->assertJsonPath('data.version', 2);
    $this->patchJson("/api/v1/client/addresses/{$home['id']}", s05Address(['expected_version' => 1]))->assertStatus(409);

    $this->deleteJson("/api/v1/client/addresses/{$shop['id']}")->assertNoContent();
    expect($this->getJson('/api/v1/client/addresses')->json('data.items.0'))->toMatchArray(['id' => $home['id'], 'is_default' => true]);
});

it('S05-TC-218 valida las direcciones en español y permite hasta 5', function () {
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/client/addresses', s05Address(['kind' => 'oficina', 'address' => 'Jr'])), ['kind', 'address']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/client/addresses', s05Address(['kind' => 'other'])), ['label']);
    $this->postJson('/api/v1/client/addresses', s05Address(['user_id' => 999]))->assertUnprocessable();
    foreach (range(1, 5) as $n) {
        $this->postJson('/api/v1/client/addresses', s05Address(['kind' => 'other', 'label' => "Lugar $n"]))->assertCreated();
    }
    $sixth = $this->postJson('/api/v1/client/addresses', s05Address())->assertUnprocessable();
    expect($sixth->json('message'))->toBe('Puedes guardar hasta 5 direcciones. Elimina una para agregar otra.')
        ->and(DB::table('client_addresses')->count())->toBe(5);
});

it('S05-TC-219 una dirección ajena responde 404 y los otros roles no tienen direcciones', function () {
    $other = ClientProfileFactory::new()->create()->user;
    $id = DB::table('client_addresses')->insertGetId(['user_id' => $other->id, 'kind' => 'home', 'label' => 'Casa',
        'district_id' => Sprint04::district(), 'address' => 'Jr. Ajeno 1']);

    expect($this->getJson('/api/v1/client/addresses')->json('data.items'))->toBe([]);
    $this->patchJson("/api/v1/client/addresses/$id", s05Address(['expected_version' => 1]))->assertNotFound();
    $this->deleteJson("/api/v1/client/addresses/$id")->assertNotFound();
    expect(DB::table('client_addresses')->where('id', $id)->value('address'))->toBe('Jr. Ajeno 1');

    Sanctum::actingAs(Sprint04::technician()->user);
    $this->getJson('/api/v1/client/addresses')->assertForbidden();
    Sprint01::forgetSession();
    $this->getJson('/api/v1/client/addresses')->assertUnauthorized();
});

it('S05-TC-220 las preferencias de comunicación tienen valores por omisión, se guardan y rechazan claves desconocidas', function () {
    expect($this->getJson('/api/v1/client/me/communication')->assertOk()->json('data'))
        ->toBe(['contact_channel' => 'app', 'notify_before_arrival' => true, 'prefer_messages' => false]);

    $this->putJson('/api/v1/client/me/communication', ['contact_channel' => 'call', 'notify_before_arrival' => false, 'prefer_messages' => true])
        ->assertOk();
    expect($this->getJson('/api/v1/client/me/communication')->json('data'))
        ->toBe(['contact_channel' => 'call', 'notify_before_arrival' => false, 'prefer_messages' => true]);

    Sprint01::assertSpanishValidation($this->putJson('/api/v1/client/me/communication',
        ['contact_channel' => 'paloma', 'notify_before_arrival' => true, 'prefer_messages' => true]), ['contact_channel']);
    // Nunca datos de salud: una clave fuera de la lista blanca se rechaza y no se guarda.
    $this->putJson('/api/v1/client/me/communication', ['contact_channel' => 'app', 'notify_before_arrival' => true,
        'prefer_messages' => true, 'discapacidad' => 'visual'])->assertUnprocessable();
    expect(DB::table('client_profiles')->where('user_id', $this->user->id)->value('communication_prefs'))->not->toContain('visual');
});

it('S05-TC-221 el menú contraído se guarda en la cuenta y vuelve en /me', function () {
    expect($this->getJson('/api/v1/me')->json('data.sidebar_collapsed'))->toBeNull();
    $this->patchJson('/api/v1/me', ['sidebar_collapsed' => true, 'expected_version' => $this->user->version])->assertOk()
        ->assertJsonPath('data.sidebar_collapsed', true);
    expect($this->getJson('/api/v1/me')->json('data.sidebar_collapsed'))->toBeTrue();
    Sprint01::assertSpanishValidation($this->patchJson('/api/v1/me', ['sidebar_collapsed' => 'quizás',
        'expected_version' => $this->user->fresh()->version]), ['sidebar_collapsed']);
});
