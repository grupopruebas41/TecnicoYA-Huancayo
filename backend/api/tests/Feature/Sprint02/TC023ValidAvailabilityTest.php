<?php

// TC-023 · HU-S02-06 · RF-05, RF-07 · AC-S02-06-01
// Distritos sintéticos (P03 pendiente). No se prueba duración ni compatibilidad de franjas (P05/P16).
use App\Modules\FAdministration\Domain\TechnicianAvailability;
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Carbon::setTestNow('2026-10-12 09:00:00');
    Sprint01::actAsSpa($this);
});

afterEach(fn () => Carbon::setTestNow());

it('TC-023: guarda horarios, zonas y una pausa válida que el filtro de elegibilidad reconoce', function () {
    // Dado un técnico habilitado y distritos de prueba activos
    $technician = TechnicianProfileFactory::new()->approved()->create();
    [$north, $south] = DistrictFactory::new()->count(2)->create();
    $closed = DistrictFactory::new()->inactive()->create();
    Sanctum::actingAs($technician->user);
    $schedule = [
        'slots' => [
            ['weekday' => 1, 'start' => '08:00', 'end' => '12:00'],
            ['weekday' => 3, 'start' => '14:00', 'end' => '18:00'],
        ],
        'pause' => ['starts_at' => '2026-10-12T10:00:00Z', 'ends_at' => '2026-10-13T10:00:00Z', 'reason' => 'Capacitación'],
    ];

    // Cuando incluye un distrito inactivo, no se guarda nada y el mensaje está en español
    $invalid = $this->putJson('/api/v1/technicians/me/availability', $schedule + [
        'district_ids' => [$north->id, $closed->id], 'expected_version' => $technician->version,
    ]);
    Sprint01::assertSpanishValidation($invalid, ['district_ids.1']);
    expect(DB::table('availability_slots')->where('technician_id', $technician->id)->count())->toBe(0);

    // Cuando guarda horarios, zonas y una pausa temporal válidos
    $this->putJson('/api/v1/technicians/me/availability', $schedule + [
        'district_ids' => [$north->id, $south->id], 'expected_version' => $technician->version,
    ])->assertOk();

    // Entonces se conservan horarios y zonas
    $slots = DB::table('availability_slots')->where('technician_id', $technician->id)->where('active', 1)
        ->orderBy('weekday')->get(['kind', 'weekday', 'local_start', 'local_end']);
    expect($slots->map(fn ($slot) => [$slot->kind, $slot->weekday, substr($slot->local_start, 0, 5), substr($slot->local_end, 0, 5)])->all())
        ->toBe([['weekly', 1, '08:00', '12:00'], ['weekly', 3, '14:00', '18:00']]);
    expect(DB::table('technician_districts')->where('technician_id', $technician->id)->where('active', 1)->pluck('district_id')->sort()->values()->all())
        ->toBe(collect([$north->id, $south->id])->sort()->values()->all());

    // Y la pausa queda disponible para el filtro de elegibilidad (activa solo en su intervalo)
    $availability = app(TechnicianAvailability::class);
    expect($availability->isPausedAt($technician->id, Carbon::parse('2026-10-12T09:30:00Z')))->toBeFalse()
        ->and($availability->isPausedAt($technician->id, Carbon::parse('2026-10-12T12:00:00Z')))->toBeTrue()
        ->and($availability->isPausedAt($technician->id, Carbon::parse('2026-10-13T10:00:00Z')))->toBeFalse();
});
