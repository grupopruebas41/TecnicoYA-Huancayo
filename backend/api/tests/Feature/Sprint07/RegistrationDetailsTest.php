<?php

// S07-TC-001 a 010 · Adelanto del Sprint 7 (D-73) · Registro detallado (D-80): datos que necesita el matching por
// cercanía (D-63 y D-64). POST /auth/register amplía el contrato v1 sin dejar de aceptar `name` (D-75).
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\Sprint01;
use Tests\Support\Sprint07;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

function s07Register(object $test, array $payload)
{
    return $test->postJson('/api/v1/auth/register', $payload);
}

function s07ExpectNoAccount(string $email): void
{
    expect(User::query()->where('email', $email)->exists())->toBeFalse();
}

it('S07-TC-001 registra un cliente MYPE con nombres, teléfono, distrito principal y dirección privada [TC-001]', function () {
    $payload = Sprint07::clientPayload(['client_type' => 'mype', 'business_name' => 'Bodega Sintética',
        'reference_address' => 'Jr. Ejemplo 123, frente al parque']);

    $response = s07Register($this, $payload)->assertCreated();

    $user = User::query()->where('email', $payload['email'])->firstOrFail();
    expect($user->name)->toBe('Ana Lucía Quispe Rojas')
        ->and($user->given_names)->toBe('Ana Lucía')
        ->and($user->family_names)->toBe('Quispe Rojas')
        ->and($user->phone)->toBe('987654321')
        ->and($user->terms_accepted_at)->not->toBeNull();
    $profile = DB::table('client_profiles')->where('user_id', $user->id)->first();
    expect((int) $profile->district_id)->toBe(Sprint07::districtId())
        ->and($profile->client_type)->toBe('mype')
        ->and($profile->business_name)->toBe('Bodega Sintética')
        ->and($profile->default_address)->toBe('Jr. Ejemplo 123, frente al parque');
    // La dirección de referencia es privada: no vuelve en la respuesta del registro.
    expect($response->getContent())->not->toContain('Jr. Ejemplo')->not->toContain('password');
});

it('S07-TC-002 registra un técnico con distrito base, distritos atendidos, especialidades y experiencia, sin servicios ni tarifas [TC-003]', function () {
    $payload = Sprint07::technicianPayload(['whatsapp' => '912345678',
        'specialty_ids' => [Sprint07::specialtyId('computo'), Sprint07::specialtyId('electricidad')]]);

    s07Register($this, $payload)->assertCreated();

    $user = User::query()->where('email', $payload['email'])->firstOrFail();
    $profile = DB::table('technician_profiles')->where('user_id', $user->id)->first();
    expect((int) $profile->base_district_id)->toBe(Sprint07::districtId('EL-TAMBO'))
        ->and((int) $profile->experience_years)->toBe(4)
        ->and($profile->whatsapp)->toBe('912345678')
        ->and($profile->display_name)->toBe('Ana Lucía Quispe Rojas')
        ->and($profile->verification_status)->toBe('pending');
    // El distrito base siempre queda entre los atendidos, aunque no venga en district_ids.
    expect(DB::table('technician_districts')->where('technician_id', $profile->id)->where('active', 1)->pluck('district_id')
        ->map(fn ($id) => (int) $id)->sort()->values()->all())
        ->toBe(collect([Sprint07::districtId('EL-TAMBO'), Sprint07::districtId('HUANCAYO')])->sort()->values()->all());
    expect(DB::table('technician_specialties')->where('technician_id', $profile->id)->pluck('specialty_id')
        ->map(fn ($id) => (int) $id)->sort()->values()->all())
        ->toBe(collect([Sprint07::specialtyId('computo'), Sprint07::specialtyId('electricidad')])->sort()->values()->all());
    expect(DB::table('technician_services')->where('technician_id', $profile->id)->count())->toBe(0);
});

it('S07-TC-003 rechaza teléfonos que no son celulares peruanos de 9 dígitos que empiezan en 9', function () {
    foreach (['98765432', '887654321', '9876543210', '98765432a', '+51 987654321', ''] as $phone) {
        $payload = Sprint07::clientPayload(['phone' => $phone]);
        Sprint01::assertSpanishValidation(s07Register($this, $payload), ['phone']);
        s07ExpectNoAccount($payload['email']);
    }
    $whatsapp = Sprint07::technicianPayload(['whatsapp' => '12345']);
    Sprint01::assertSpanishValidation(s07Register($this, $whatsapp), ['whatsapp']);
});

it('S07-TC-004 rechaza un distrito inexistente o inactivo para el cliente y para el técnico', function () {
    Sprint07::catalog();
    DB::table('districts')->where('code', 'CHILCA')->update(['active' => 0]);
    $inactive = Sprint07::districtId('CHILCA');

    foreach ([['district_id' => 999999], ['district_id' => $inactive], ['district_id' => null]] as $override) {
        $payload = Sprint07::clientPayload($override);
        Sprint01::assertSpanishValidation(s07Register($this, $payload), ['district_id']);
        s07ExpectNoAccount($payload['email']);
    }
    foreach ([['base_district_id' => $inactive], ['district_ids' => [$inactive]], ['district_ids' => [999999]]] as $override) {
        $payload = Sprint07::technicianPayload($override);
        $field = array_key_first($override) === 'district_ids' ? 'district_ids.0' : 'base_district_id';
        Sprint01::assertSpanishValidation(s07Register($this, $payload), [$field]);
        s07ExpectNoAccount($payload['email']);
    }
});

it('S07-TC-005 exige al técnico al menos una especialidad activa y experiencia entre 0 y 50 años', function () {
    Sprint07::catalog();
    DB::table('specialties')->where('code', 'refrigeracion')->update(['active' => 0]);

    $cases = [
        [['specialty_ids' => []], 'specialty_ids'],
        [['specialty_ids' => [Sprint07::specialtyId('refrigeracion')]], 'specialty_ids.0'],
        [['experience_years' => 51], 'experience_years'],
        [['experience_years' => -1], 'experience_years'],
        [['experience_years' => null], 'experience_years'],
    ];
    foreach ($cases as [$override, $field]) {
        $payload = Sprint07::technicianPayload($override);
        Sprint01::assertSpanishValidation(s07Register($this, $payload), [$field]);
        s07ExpectNoAccount($payload['email']);
    }
    foreach ([0, 50] as $years) {
        s07Register($this, Sprint07::technicianPayload(['experience_years' => $years]))->assertCreated();
    }
});

it('S07-TC-006 no crea la cuenta si no se aceptan los Términos y la Privacidad', function () {
    foreach ([false, null, 'no'] as $accepted) {
        $payload = Sprint07::clientPayload(['terms_accepted' => $accepted]);
        Sprint01::assertSpanishValidation(s07Register($this, $payload), ['terms_accepted']);
        s07ExpectNoAccount($payload['email']);
    }
});

it('S07-TC-007 prohíbe los campos que no corresponden al tipo de cuenta', function () {
    $client = Sprint07::clientPayload(['specialty_ids' => [Sprint07::specialtyId()], 'base_district_id' => Sprint07::districtId()]);
    Sprint01::assertSpanishValidation(s07Register($this, $client), ['specialty_ids', 'base_district_id']);
    s07ExpectNoAccount($client['email']);

    $household = Sprint07::clientPayload(['business_name' => 'No corresponde']);
    Sprint01::assertSpanishValidation(s07Register($this, $household), ['business_name']);

    $technician = Sprint07::technicianPayload(['district_id' => Sprint07::districtId(), 'reference_address' => 'Privada']);
    Sprint01::assertSpanishValidation(s07Register($this, $technician), ['district_id', 'reference_address']);
    s07ExpectNoAccount($technician['email']);
});

it('S07-TC-008 el mismo correo con otra capitalización no crea una segunda cuenta [TC-002]', function () {
    $first = Sprint07::clientPayload();
    s07Register($this, $first)->assertCreated();

    $again = Sprint07::clientPayload(['email' => strtoupper($first['email'])]);
    Sprint01::assertSpanishValidation(s07Register($this, $again), ['email']);

    expect(User::query()->whereRaw('LOWER(email) = ?', [strtolower($first['email'])])->count())->toBe(1)
        ->and(DB::table('client_profiles')->count())->toBe(1);
});

it('S07-TC-009 el registro detallado tampoco permite crear administradores [TC-008]', function () {
    $payload = Sprint07::clientPayload(['account_type' => 'admin']);
    unset($payload['client_type'], $payload['district_id']);

    Sprint01::assertSpanishValidation(s07Register($this, $payload), ['account_type']);
    s07ExpectNoAccount($payload['email']);
});

it('S07-TC-010 /me devuelve nombres, apellidos y el distrito principal del cliente para precargar la solicitud', function () {
    $payload = Sprint07::clientPayload(['reference_address' => 'Privada 1']);
    s07Register($this, $payload)->assertCreated();
    $user = User::query()->where('email', $payload['email'])->firstOrFail();

    $me = $this->actingAs($user)->getJson('/api/v1/me')->assertOk();

    $me->assertJsonPath('data.given_names', 'Ana Lucía')
        ->assertJsonPath('data.family_names', 'Quispe Rojas')
        ->assertJsonPath('data.name', 'Ana Lucía Quispe Rojas')
        ->assertJsonPath('data.client_profile.district_id', Sprint07::districtId())
        ->assertJsonPath('data.client_profile.client_type', 'household');
});
