<?php

// S07-TC-031 a 035 · Adelanto del Sprint 7 (D-73) · Rubros declarados en el registro del técnico (D-80): al menos una
// subespecialidad por especialidad declarada, guardadas como declaradas, sin servicios ni tarifas ni elegibilidad.
use App\Models\User;
use App\Modules\BMatching\Application\Eligibility;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;
use Tests\Support\Sprint07;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint07::catalog();
    Sprint01::actAsSpa($this);
});

function s07Technician(object $test, array $overrides = [])
{
    return $test->postJson('/api/v1/auth/register', Sprint07::technicianPayload($overrides));
}

function s07Profile(array $payload): object
{
    return DB::table('technician_profiles')->where('user_id', User::query()->where('email', $payload['email'])->value('id'))->first();
}

it('S07-TC-031 guarda los rubros declarados sin crear servicios y los devuelve en /me y en el perfil propio', function () {
    $computo = Sprint07::subcategoryIds('computo', 2);
    $electricidad = Sprint07::subcategoryIds('electricidad', 1);
    $payload = Sprint07::technicianPayload([
        'specialty_ids' => [Sprint07::specialtyId('computo'), Sprint07::specialtyId('electricidad')],
        'subcategory_ids' => [...$computo, ...$electricidad],
    ]);

    $this->postJson('/api/v1/auth/register', $payload)->assertCreated();

    $profile = s07Profile($payload);
    expect(DB::table('technician_declared_subcategories')->where('technician_id', $profile->id)->pluck('subcategory_id')
        ->map(fn ($id) => (int) $id)->sort()->values()->all())->toBe(collect([...$computo, ...$electricidad])->sort()->values()->all())
        ->and(DB::table('technician_services')->where('technician_id', $profile->id)->count())->toBe(0)
        ->and(DB::table('service_rate_versions')->count())->toBe(0);

    $user = User::query()->where('email', $payload['email'])->firstOrFail();
    $me = $this->actingAs($user)->getJson('/api/v1/me')->assertOk();
    expect(collect($me->json('data.technician_profile.declared_subcategories'))->pluck('id')->sort()->values()->all())
        ->toBe(collect([...$computo, ...$electricidad])->sort()->values()->all());
    $own = $this->getJson('/api/v1/technicians/me/profile')->assertOk();
    $declared = collect($own->json('data.declared_subcategories'));
    expect($declared)->toHaveCount(3)
        ->and($declared->pluck('has_rate')->unique()->all())->toBe([false])
        ->and($declared->firstWhere('subcategory_id', $electricidad[0])['specialty_name'])->toBe('Electricidad');
});

it('S07-TC-032 rechaza un rubro de una especialidad que el técnico no declaró', function () {
    $foreign = Sprint07::subcategoryIds('refrigeracion')[0];
    $payload = Sprint07::technicianPayload(['subcategory_ids' => [...Sprint07::subcategoryIds('computo'), $foreign]]);

    $response = $this->postJson('/api/v1/auth/register', $payload);

    Sprint01::assertSpanishValidation($response, ['subcategory_ids.1']);
    expect($response->json('errors')['subcategory_ids.1'][0])->toContain('no pertenece a una especialidad que elegiste');
    expect(User::query()->where('email', $payload['email'])->exists())->toBeFalse();
});

it('S07-TC-033 exige al menos un rubro por cada especialidad declarada', function () {
    $missingAll = Sprint07::technicianPayload(['subcategory_ids' => []]);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/auth/register', $missingAll), ['subcategory_ids']);

    $payload = Sprint07::technicianPayload([
        'specialty_ids' => [Sprint07::specialtyId('computo'), Sprint07::specialtyId('electricidad')],
        'subcategory_ids' => Sprint07::subcategoryIds('computo'),
    ]);
    $response = $this->postJson('/api/v1/auth/register', $payload);

    Sprint01::assertSpanishValidation($response, ['subcategory_ids']);
    expect($response->json('errors.subcategory_ids.0'))->toBe('Elige al menos un rubro de Electricidad.');
    expect(User::query()->where('email', $payload['email'])->exists())->toBeFalse();
});

it('S07-TC-034 rechaza rubros inactivos, de una especialidad inactiva o repetidos', function () {
    $computo = Sprint07::subcategoryIds('computo', 2);
    DB::table('subcategories')->where('id', $computo[1])->update(['active' => 0]);
    $inactive = Sprint07::technicianPayload(['subcategory_ids' => $computo]);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/auth/register', $inactive), ['subcategory_ids.1']);

    $repeated = Sprint07::technicianPayload(['subcategory_ids' => [$computo[0], $computo[0]]]);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/auth/register', $repeated), ['subcategory_ids.0']);

    DB::table('specialties')->where('code', 'electricidad')->update(['active' => 0]);
    $closed = Sprint07::technicianPayload([
        'specialty_ids' => [Sprint07::specialtyId('computo'), Sprint07::specialtyId('electricidad')],
        'subcategory_ids' => [$computo[0], Sprint07::subcategoryIds('electricidad')[0]],
    ]);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/auth/register', $closed), ['specialty_ids.1', 'subcategory_ids.1']);

    expect(DB::table('technician_profiles')->count())->toBe(0);
});

it('S07-TC-035 el técnico recién registrado no es candidato del matching hasta tener servicio con tarifa', function () {
    $hardware = Sprint04::subcategory('computo-hardware');
    $payload = Sprint07::technicianPayload(['base_district_id' => Sprint07::districtId('HUANCAYO'), 'district_ids' => [Sprint07::districtId('HUANCAYO')],
        'subcategory_ids' => [$hardware]]);
    $this->postJson('/api/v1/auth/register', $payload)->assertCreated();
    $profile = s07Profile($payload);
    $request = Sprint04::sentRequest(['subcategory_id' => $hardware, 'district_id' => Sprint07::districtId('HUANCAYO')]);
    $eligibility = app(Eligibility::class);

    expect($eligibility->evaluate($request, [$profile->id])[$profile->id]['code'])->toBe('not_active'); // Estado pending_verification del registro.

    // Aun verificado y activo, el rubro declarado no basta: falta el servicio con tarifa.
    DB::table('technician_profiles')->where('id', $profile->id)->update([
        'status' => 'active', 'verification_status' => 'approved', 'verified_at' => now(),
    ]);
    expect($eligibility->evaluate($request, [$profile->id])[$profile->id]['code'])->toBe('service_not_offered');
});
