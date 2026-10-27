<?php

// S05-TC-020 a 024 · Panel del cliente (adelanto S5, D-87) · PERFIL-02 (D-91): el cliente edita su distrito principal y
// su dirección de referencia (privada) en PATCH /me; el tipo de cliente y la razón social no cambian aquí.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->profile = ClientProfileFactory::new()->create(['district_id' => Sprint04::district('HUANCAYO'), 'default_address' => 'Jr. Sintético 100']);
    $this->user = $this->profile->user;
    Sanctum::actingAs($this->user);
});

function s05ClientRow(int $userId): object
{
    return DB::table('client_profiles')->where('user_id', $userId)->first();
}

it('S05-TC-020 el cliente cambia su distrito principal y su dirección de referencia y los ve en /me', function () {
    $tambo = Sprint04::district('EL-TAMBO');

    $this->patchJson('/api/v1/me', ['district_id' => $tambo, 'reference_address' => 'Av. Sintética 742, frente al parque',
        'expected_version' => $this->user->version])->assertOk()
        ->assertJsonPath('data.client_profile.district_id', $tambo)
        ->assertJsonPath('data.client_profile.reference_address', 'Av. Sintética 742, frente al parque')
        ->assertJsonPath('data.client_profile.client_type', 'household');

    $row = s05ClientRow($this->user->id);
    expect([(int) $row->district_id, $row->default_address, (int) $row->version])->toBe([$tambo, 'Av. Sintética 742, frente al parque', 2])
        ->and($this->getJson('/api/v1/me')->json('data.client_profile.reference_address'))->toBe('Av. Sintética 742, frente al parque');

    $this->patchJson('/api/v1/me', ['reference_address' => null, 'expected_version' => $this->user->fresh()->version])->assertOk()
        ->assertJsonPath('data.client_profile.reference_address', null)->assertJsonPath('data.client_profile.district_id', $tambo);
});

it('S05-TC-021 rechaza en español un distrito inactivo o inexistente y una dirección demasiado larga, sin cambios', function () {
    $inactive = DistrictFactory::new()->inactive()->create()->id;
    $cases = [['district_id' => $inactive], ['district_id' => 999999], ['district_id' => null], ['reference_address' => str_repeat('d', 256)]];
    foreach ($cases as $body) {
        Sprint01::assertSpanishValidation($this->patchJson('/api/v1/me', $body + ['expected_version' => $this->user->version]), array_keys($body));
    }

    $row = s05ClientRow($this->user->id);
    expect([(int) $row->district_id, $row->default_address])->toBe([Sprint04::district('HUANCAYO'), 'Jr. Sintético 100']);
});

it('S05-TC-022 con una versión obsoleta devuelve 409 y no cambia el distrito', function () {
    $this->patchJson('/api/v1/me', ['district_id' => Sprint04::district('CHILCA'), 'expected_version' => $this->user->version + 5])
        ->assertConflict();

    expect((int) s05ClientRow($this->user->id)->district_id)->toBe(Sprint04::district('HUANCAYO'));
});

it('S05-TC-023 un técnico no puede enviar datos de cliente en su perfil', function () {
    $technician = Sprint04::technician()->user;
    Sanctum::actingAs($technician);

    Sprint01::assertSpanishValidation($this->patchJson('/api/v1/me', ['district_id' => Sprint04::district(), 'reference_address' => 'Jr. Ajeno 1',
        'expected_version' => $technician->version]), ['district_id', 'reference_address']);

    expect(DB::table('client_profiles')->where('user_id', $technician->id)->exists())->toBeFalse();
});

it('S05-TC-024 la dirección de referencia solo la ve su dueño en /me, no el técnico asignado', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest(['client_id' => $this->profile->id]);
    Sprint04::prepare($request->id);
    Sprint04::respond($this, $technician, Sprint04::offerTo($request->id, $technician->id), 'accept')->assertOk();
    Sprint04::select($this, $request, Sprint04::offerTo($request->id, $technician->id)->id)->assertOk();

    Sanctum::actingAs($technician->user);
    $detail = $this->getJson("/api/v1/requests/{$request->id}")->assertOk();

    expect($detail->getContent())->not->toContain('Jr. Sintético 100')
        ->and($this->getJson('/api/v1/me')->json('data'))->not->toHaveKey('client_profile');
});
