<?php

// HU-S02-06 · RF-05, RF-07 · Franjas, pausa y zona (D-15, D-21, D-49; contrato S2 §6.1). Reloj fijo.
use App\Modules\FAdministration\Domain\TechnicianAvailability;
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Carbon::setTestNow('2026-10-12 09:00:00');
    Sprint01::actAsSpa($this);
    $this->technician = TechnicianProfileFactory::new()->approved()->create();
    $this->district = DistrictFactory::new()->create();
    Sanctum::actingAs($this->technician->user);
});

afterEach(fn () => Carbon::setTestNow());

/** Envía horario, zonas y pausa con la versión vigente del perfil. */
function s02PutAvailability(object $test, array $slots, ?array $pause = null, ?array $districts = null)
{
    return $test->putJson('/api/v1/technicians/me/availability', [
        'slots' => $slots, 'district_ids' => $districts ?? [$test->district->id], 'pause' => $pause,
        'expected_version' => Sprint02::version('technician_profiles', $test->technician->id),
    ]);
}

function s02ActiveSlots(object $test): array
{
    return DB::table('availability_slots')->where('technician_id', $test->technician->id)->where('active', 1)
        ->orderBy('weekday')->orderBy('local_start')->get()
        ->map(fn ($slot) => [$slot->weekday, substr($slot->local_start, 0, 5), substr($slot->local_end, 0, 5)])->all();
}

it('S02-TC-046 VAL-02 rechaza dos franjas solapadas del mismo día y conserva el horario anterior', function () {
    s02PutAvailability($this, [['weekday' => 1, 'start' => '08:00', 'end' => '12:00']])->assertOk();

    $overlap = s02PutAvailability($this, [
        ['weekday' => 1, 'start' => '08:00', 'end' => '12:00'], ['weekday' => 1, 'start' => '11:00', 'end' => '14:00'],
    ]);

    Sprint01::assertSpanishValidation($overlap, ['slots.1.start']);
    expect(s02ActiveSlots($this))->toBe([[1, '08:00', '12:00']]);
});

it('S02-TC-047 acepta franjas contiguas y una franja de exactamente 30 minutos', function () {
    s02PutAvailability($this, [
        ['weekday' => 1, 'start' => '08:00', 'end' => '12:00'], ['weekday' => 1, 'start' => '12:00', 'end' => '12:30'],
        ['weekday' => 2, 'start' => '08:00', 'end' => '12:00'],
    ])->assertOk();

    expect(s02ActiveSlots($this))->toBe([[1, '08:00', '12:00'], [1, '12:00', '12:30'], [2, '08:00', '12:00']]);
});

it('S02-TC-048 VAL-02 rechaza una franja de 29 minutos, días 0 y 8 y la hora 24:00 sin guardar nada', function () {
    Sprint01::assertSpanishValidation(s02PutAvailability($this, [['weekday' => 1, 'start' => '08:00', 'end' => '08:29']]), ['slots.0.end']);
    Sprint01::assertSpanishValidation(s02PutAvailability($this, [
        ['weekday' => 0, 'start' => '08:00', 'end' => '12:00'], ['weekday' => 8, 'start' => '08:00', 'end' => '12:00'],
    ]), ['slots.0.weekday', 'slots.1.weekday']);
    Sprint01::assertSpanishValidation(s02PutAvailability($this, [['weekday' => 1, 'start' => '20:00', 'end' => '24:00']]), ['slots.0.end']);

    expect(s02ActiveSlots($this))->toBe([]);
});

it('S02-TC-049 VAL-02 rechaza una pausa invertida y una que empieza antes del minuto actual', function () {
    $slots = [['weekday' => 1, 'start' => '08:00', 'end' => '12:00']];

    Sprint01::assertSpanishValidation(s02PutAvailability($this, $slots, [
        'starts_at' => '2026-10-12T10:00:00Z', 'ends_at' => '2026-10-12T09:30:00Z',
    ]), ['pause.ends_at']);
    Sprint01::assertSpanishValidation(s02PutAvailability($this, $slots, [
        'starts_at' => '2026-10-12T08:59:00Z', 'ends_at' => '2026-10-12T12:00:00Z',
    ]), ['pause.starts_at']);
    s02PutAvailability($this, $slots, ['starts_at' => '2026-10-12T09:00:00Z'])->assertOk();

    expect(DB::table('technician_pauses')->where('technician_id', $this->technician->id)->pluck('starts_at')->all())
        ->toHaveCount(1);
});

it('S02-TC-050 mantiene pausado al técnico con una pausa sin fin y lo libera al quitarla', function () {
    $availability = app(TechnicianAvailability::class);
    $slots = [['weekday' => 1, 'start' => '08:00', 'end' => '12:00']];

    s02PutAvailability($this, $slots, ['starts_at' => '2026-10-12T09:00:00Z', 'reason' => 'Licencia'])->assertOk();
    expect($availability->isPausedAt($this->technician->id, Carbon::parse('2027-10-12 09:00:00')))->toBeTrue();

    s02PutAvailability($this, $slots, null)->assertOk();
    expect($availability->isPausedAt($this->technician->id, Carbon::parse('2026-10-12 10:00:00')))->toBeFalse();
    $this->assertDatabaseMissing('technician_pauses', ['technician_id' => $this->technician->id, 'cancelled_at' => null]);
});

it('S02-TC-051 VAL-02 conserva un distrito desactivado que el técnico ya tenía y rechaza uno inactivo nuevo', function () {
    $closedLater = DistrictFactory::new()->create();
    $neverHad = DistrictFactory::new()->inactive()->create();
    $slots = [['weekday' => 1, 'start' => '08:00', 'end' => '12:00']];
    s02PutAvailability($this, $slots, null, [$this->district->id, $closedLater->id])->assertOk();
    DB::table('districts')->where('id', $closedLater->id)->update(['active' => 0]);

    s02PutAvailability($this, [['weekday' => 2, 'start' => '08:00', 'end' => '12:00']], null, [$this->district->id, $closedLater->id])->assertOk();
    Sprint01::assertSpanishValidation(
        s02PutAvailability($this, $slots, null, [$this->district->id, $closedLater->id, $neverHad->id]), ['district_ids.2']
    );

    expect(DB::table('technician_districts')->where('technician_id', $this->technician->id)->where('active', 1)->pluck('district_id')->sort()->values()->all())
        ->toBe(collect([$this->district->id, $closedLater->id])->sort()->values()->all());
    expect(s02ActiveSlots($this))->toBe([[2, '08:00', '12:00']]);
});

it('S02-TC-052 CRUD-02 rechaza con 409 un horario enviado con una versión vieja', function () {
    $stale = Sprint02::version('technician_profiles', $this->technician->id);
    s02PutAvailability($this, [['weekday' => 1, 'start' => '08:00', 'end' => '12:00']])->assertOk();

    $this->putJson('/api/v1/technicians/me/availability', [
        'slots' => [['weekday' => 3, 'start' => '14:00', 'end' => '18:00']], 'district_ids' => [$this->district->id],
        'pause' => null, 'expected_version' => $stale,
    ])->assertConflict()->assertJsonPath('error.code', 'STALE_VERSION');

    expect(s02ActiveSlots($this))->toBe([[1, '08:00', '12:00']]);
});
