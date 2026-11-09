<?php

// S05-TC-181 a 186 · Fase 3 del panel final · Buscar técnicos (D-101, propuesta): orden por precio y por experiencia,
// filtro «Disponible hoy» con la disponibilidad real y tarjeta con verificado, especialidades, favorito y reseñas de
// ejemplo separadas de las calificaciones reales. Reloj fijo: martes 20 de octubre de 2026, 09:00 en Lima.
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->huancayo = Sprint04::district('HUANCAYO');
    $this->tambo = Sprint04::district('EL-TAMBO');
    $this->client = ClientProfileFactory::new()->create(['district_id' => $this->huancayo])->user;
    Sanctum::actingAs($this->client);
});

/** Técnico buscable sin franjas (cada prueba declara las suyas), con nombre fijo para el desempate. */
function s05v2Technician(string $name, array $options = []): object
{
    return Sprint04::technician($options + ['profile' => ['display_name' => $name], 'slots' => false]);
}

function s05v2Service(int $technicianId, string $code, string $fee): void
{
    DB::table('technician_services')->insert(['technician_id' => $technicianId, 'subcategory_id' => Sprint04::subcategory($code), 'reference_fee' => $fee]);
}

it('S05-TC-181 ordena por precio con la tarifa más baja de los servicios que cumplen el filtro y desempata por nombre', function () {
    $cheap = s05v2Technician('Carla', ['fee' => '90.00']);
    s05v2Service($cheap->id, 'computo-redes', '40.00');
    $middle = s05v2Technician('Beto', ['fee' => '60.00']);
    $tieA = s05v2Technician('Ana', ['fee' => '75.00']);
    $tieB = s05v2Technician('Abel', ['fee' => '75.00']);

    expect(Sprint03::ids($this->getJson('/api/v1/technicians?sort=price')))->toBe([$cheap->id, $middle->id, $tieB->id, $tieA->id]);
    // Con el filtro de subcategoría solo cuenta la tarifa de ese servicio: Carla cobra 90 en hardware.
    $hardware = Sprint04::subcategory('computo-hardware');
    expect(Sprint03::ids($this->getJson("/api/v1/technicians?sort=price&subcategory_id=$hardware")))->toBe([$middle->id, $tieB->id, $tieA->id, $cheap->id]);
});

it('S05-TC-182 ordena por experiencia de mayor a menor y desempata por nombre', function () {
    $junior = s05v2Technician('Ana', ['profile' => ['display_name' => 'Ana', 'experience_years' => 1]]);
    $senior = s05v2Technician('Zoe', ['profile' => ['display_name' => 'Zoe', 'experience_years' => 12]]);
    $tieA = s05v2Technician('Mario', ['profile' => ['display_name' => 'Mario', 'experience_years' => 5]]);
    $tieB = s05v2Technician('Luis', ['profile' => ['display_name' => 'Luis', 'experience_years' => 5]]);

    expect(Sprint03::ids($this->getJson('/api/v1/technicians?sort=experience')))->toBe([$senior->id, $tieB->id, $tieA->id, $junior->id]);
});

it('S05-TC-183 con precio o experiencia la tarjeta trae la distancia si hay origen, y el orden se valida en español', function () {
    s05v2Technician('Técnico Huancayo', ['base' => $this->huancayo]);
    s05v2Technician('Técnico Tambo', ['base' => $this->tambo]);

    foreach (['price', 'experience'] as $sort) {
        $items = collect($this->getJson("/api/v1/technicians?sort=$sort")->assertOk()->json('data.items'))->keyBy('display_name');
        expect($items['Técnico Huancayo']['distance']['same_district'])->toBeTrue()
            ->and($items['Técnico Tambo']['distance']['km'])->toEqual(3.5);
    }
    // Sin distrito en el perfil, precio y experiencia funcionan sin distancia (la cercanía sí exige origen, S05-TC-004).
    Sanctum::actingAs(ClientProfileFactory::new()->create(['district_id' => null])->user);
    foreach ($this->getJson('/api/v1/technicians?sort=price')->assertOk()->json('data.items') as $item) {
        expect($item)->not->toHaveKey('distance');
    }
    $invalid = $this->getJson('/api/v1/technicians?sort=rating');
    Sprint01::assertSpanishValidation($invalid, ['sort']);
    expect($invalid->json('errors.sort.0'))->toBe('El orden debe ser por cercanía, precio, experiencia o nombre.');
});

it('S05-TC-184 «Disponible hoy» incluye a quien tiene una franja de hoy en Lima que todavía no termina', function () {
    $morning = s05v2Technician('Mañana');
    Sprint04::weeklySlot($morning->id, 2, '08:00:00', '12:00:00'); // martes, en curso a las 09:00.
    $later = s05v2Technician('Tarde');
    Sprint04::weeklySlot($later->id, 2, '15:00:00', '18:00:00');
    $oneOff = s05v2Technician('Puntual');
    DB::table('availability_slots')->insert(['technician_id' => $oneOff->id, 'kind' => 'one_off', 'timezone' => 'America/Lima',
        'starts_at' => '2026-10-20 20:00:00', 'ends_at' => '2026-10-20 22:00:00']); // 15:00 a 17:00 en Lima.
    s05v2Technician('Sin franjas');

    $response = $this->getJson('/api/v1/technicians?available_today=1')->assertOk();

    expect(collect($response->json('data.items'))->pluck('display_name')->all())->toBe(['Mañana', 'Puntual', 'Tarde'])
        ->and($this->getJson('/api/v1/technicians?available_today=0')->assertOk()->json('data.pagination.total'))->toBe(4);
});

it('S05-TC-185 «Disponible hoy» excluye la franja que terminó justo ahora, otro día, la vencida y la inactiva', function () {
    $ended = s05v2Technician('Terminó a las 09:00');
    Sprint04::weeklySlot($ended->id, 2, '06:00:00', '09:00:00');
    $otherDay = s05v2Technician('Solo miércoles');
    Sprint04::weeklySlot($otherDay->id, 3, '08:00:00', '18:00:00');
    $expired = s05v2Technician('Vencida');
    Sprint04::weeklySlot($expired->id, 2, '08:00:00', '18:00:00');
    DB::table('availability_slots')->where('technician_id', $expired->id)->update(['valid_until' => '2026-10-19']);
    $future = s05v2Technician('Desde mañana');
    Sprint04::weeklySlot($future->id, 2, '08:00:00', '18:00:00');
    DB::table('availability_slots')->where('technician_id', $future->id)->update(['valid_from' => '2026-10-21']);
    $inactive = s05v2Technician('Inactiva');
    Sprint04::weeklySlot($inactive->id, 2, '08:00:00', '18:00:00');
    DB::table('availability_slots')->where('technician_id', $inactive->id)->update(['active' => 0]);
    $pastOneOff = s05v2Technician('Puntual pasada');
    DB::table('availability_slots')->insert(['technician_id' => $pastOneOff->id, 'kind' => 'one_off', 'timezone' => 'America/Lima',
        'starts_at' => '2026-10-20 11:00:00', 'ends_at' => '2026-10-20 14:00:00']);

    expect($this->getJson('/api/v1/technicians?available_today=1')->assertOk()->json('data.items'))->toBe([]);
    $this->travelTo(now()->subSecond());
    expect(collect($this->getJson('/api/v1/technicians?available_today=1')->json('data.items'))->pluck('display_name')->all())
        ->toBe(['Puntual pasada', 'Terminó a las 09:00']);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?available_today=hoy'), ['available_today']);
});

it('S05-TC-186 la tarjeta trae verificado, especialidades, favorito y reseñas de ejemplo aparte de las calificaciones reales', function () {
    $technician = s05v2Technician('Rosa', ['subcategory' => 'frio-vitrinas']);
    s05v2Service($technician->id, 'computo-redes', '50.00');
    foreach ([5, 4, 5] as $rating) {
        DB::table('technician_review_samples')->insert(['technician_id' => $technician->id, 'rating' => $rating,
            'comment' => 'Comentario de ejemplo.', 'author_label' => 'Cliente de Huancayo', 'reviewed_on' => '2026-10-01']);
    }
    s05v2Technician('Diego');

    $items = collect($this->getJson('/api/v1/technicians')->assertOk()->json('data.items'))->keyBy('display_name');

    expect($items['Rosa']['verified'])->toBeTrue()
        ->and($items['Rosa']['favorite'])->toBeFalse()
        ->and(array_column($items['Rosa']['specialties'], 'name'))->toBe(['Cómputo', 'Refrigeración comercial'])
        ->and($items['Rosa']['rating'])->toBe(['average' => null, 'count' => 0])
        ->and($items['Rosa']['sample_rating'])->toBe(['average' => 4.7, 'count' => 3])
        ->and($items['Diego']['sample_rating'])->toBeNull();
    // Las reseñas de ejemplo no son calificaciones: no pasan el filtro de calificación mínima (D-18).
    expect($this->getJson('/api/v1/technicians?min_rating=1')->assertOk()->json('data.items'))->toBe([]);
});
