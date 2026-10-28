<?php

// S05-TC-001 a 008 · Panel del cliente (adelanto S5, D-87) · BUSQ-01 (D-88): GET /technicians con sort=proximity,
// distancia aproximada por zona (D-64) y tarifa máxima, sin puntaje y con la proyección pública del S3.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
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
    $this->chilca = Sprint04::district('CHILCA');
    $this->client = ClientProfileFactory::new()->create(['district_id' => $this->huancayo])->user;
    Sanctum::actingAs($this->client);
});

/** Técnico buscable con distrito base (o sin él) y nombre fijo para controlar el desempate. */
function s05Technician(string $name, ?int $base, array $options = []): object
{
    return Sprint04::technician($options + ['profile' => ['display_name' => $name], 'base' => $base, 'slots' => false]);
}

it('S05-TC-001 ordena por cercanía: mismo distrito, luego km de la matriz y al final los que no tienen distancia', function () {
    $tambo = s05Technician('Técnico Tambo', $this->tambo);
    $chilca = s05Technician('Técnico Chilca', $this->chilca);
    $same = s05Technician('Técnico Huancayo', $this->huancayo);
    $withoutBase = s05Technician('Ana sin base', null);
    $withoutPair = s05Technician('Beto sin par', DistrictFactory::new()->create()->id);

    expect(Sprint03::ids($this->getJson('/api/v1/technicians?sort=proximity')))
        ->toBe([$same->id, $chilca->id, $tambo->id, $withoutBase->id, $withoutPair->id]);
});

it('S05-TC-002 cada tarjeta por cercanía trae la distancia aproximada y el orden por nombre no la incluye', function () {
    s05Technician('Técnico Huancayo', $this->huancayo);
    s05Technician('Técnico Tambo', $this->tambo);
    s05Technician('Técnico sin base', null);

    $items = collect($this->getJson('/api/v1/technicians?sort=proximity')->assertOk()->json('data.items'))->keyBy('display_name');

    // JSON no distingue 1.0 de 1: los km se comparan por valor.
    expect($items['Técnico Huancayo']['distance'])->toEqual(['km' => 1.0, 'same_district' => true, 'approximate' => true, 'label' => 'aproximada por zona'])
        ->and($items['Técnico Tambo']['distance'])->toEqual(['km' => 3.5, 'same_district' => false, 'approximate' => true, 'label' => 'aproximada por zona'])
        ->and($items['Técnico sin base']['distance'])->toBeNull();
    foreach ($this->getJson('/api/v1/technicians')->assertOk()->json('data.items') as $item) {
        expect($item)->not->toHaveKey('distance');
    }
});

it('S05-TC-003 el filtro de distrito es el origen de la cercanía en lugar del distrito del perfil', function () {
    $districts = [$this->huancayo, $this->tambo, $this->chilca];
    $huancayo = s05Technician('Técnico Huancayo', $this->huancayo, ['districts' => $districts]);
    $tambo = s05Technician('Técnico Tambo', $this->tambo, ['districts' => $districts]);
    $chilca = s05Technician('Técnico Chilca', $this->chilca, ['districts' => $districts]);

    $response = $this->getJson('/api/v1/technicians?'.http_build_query(['sort' => 'proximity', 'district_id' => $this->tambo]));

    expect(Sprint03::ids($response))->toBe([$tambo->id, $huancayo->id, $chilca->id])
        ->and(array_column(array_column($response->json('data.items'), 'distance'), 'km'))->toEqual([1.0, 3.5, 5.5]);
});

it('S05-TC-004 sin distrito en el perfil ni en el filtro, el orden por cercanía se rechaza en español', function () {
    s05Technician('Técnico Huancayo', $this->huancayo);
    Sanctum::actingAs(ClientProfileFactory::new()->create(['district_id' => null])->user);

    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?sort=proximity'), ['sort']);
    $this->getJson('/api/v1/technicians')->assertOk()->assertJsonCount(1, 'data.items');
});

it('S05-TC-005 rechaza en español un orden desconocido y una tarifa máxima inválida', function () {
    foreach ([['sort' => 'rating'], ['sort' => 'puntaje']] as $query) {
        Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?'.http_build_query($query)), ['sort']);
    }
    foreach (['-1', 'abc', '10000.01'] as $fee) {
        Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?max_fee='.$fee), ['max_fee']);
    }
});

it('S05-TC-006 la tarifa máxima filtra por el servicio que cumple los demás filtros, con el límite incluido', function () {
    $cheap = s05Technician('Técnico 60', $this->huancayo, ['fee' => '60.00']);
    s05Technician('Técnico 120', $this->huancayo, ['fee' => '120.00']);
    $cold = s05Technician('Técnico frío 50', $this->huancayo, ['fee' => '50.00', 'subcategory' => 'frio-domestico']);
    $hardware = Sprint04::subcategory('computo-hardware');

    expect(Sprint03::ids($this->getJson("/api/v1/technicians?subcategory_id=$hardware&max_fee=60")))->toBe([$cheap->id])
        ->and(Sprint03::ids($this->getJson("/api/v1/technicians?subcategory_id=$hardware&max_fee=59.99")))->toBe([])
        ->and(Sprint03::ids($this->getJson('/api/v1/technicians?max_fee=55&sort=proximity')))->toBe([$cold->id]);
});

it('S05-TC-007 el orden por cercanía conserva la lista blanca pública y no expone el distrito base ni el contacto', function () {
    $technician = s05Technician('Técnico Huancayo', $this->huancayo, ['profile' => ['display_name' => 'Técnico Huancayo', 'whatsapp' => '+51987654321']]);
    $email = DB::table('users')->where('id', $technician->user_id)->value('email');

    $response = $this->getJson('/api/v1/technicians?sort=proximity')->assertOk();

    expect(array_keys($response->json('data.items.0')))
        ->toEqualCanonicalizing(['id', 'display_name', 'provider_type', 'experience_years', 'services', 'districts', 'rating', 'distance']);
    expect($response->getContent())->not->toContain('987654321')->not->toContain($email)->not->toContain('base_district')
        ->not->toContain('user_id')->not->toContain('score')->not->toContain('address');
});

it('S05-TC-008 pagina por cercanía de forma estable, con desempate por nombre e id', function () {
    $ids = [];
    foreach (['Técnico C', 'Técnico A', 'Técnico B'] as $name) {
        $ids[$name] = s05Technician($name, $this->tambo)->id;
    }
    $near = s05Technician('Técnico Z', $this->huancayo)->id;

    $first = $this->getJson('/api/v1/technicians?sort=proximity&per_page=2&page=1')->assertOk();
    $second = $this->getJson('/api/v1/technicians?sort=proximity&per_page=2&page=2')->assertOk();

    expect(array_merge(Sprint03::ids($first), Sprint03::ids($second)))->toBe([$near, $ids['Técnico A'], $ids['Técnico B'], $ids['Técnico C']])
        ->and($first->json('data.pagination'))->toBe(['page' => 1, 'per_page' => 2, 'total' => 4, 'last_page' => 2]);
});
