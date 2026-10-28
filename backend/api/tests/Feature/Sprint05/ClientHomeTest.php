<?php

// S05-TC-050 a 054 · Inicio del cliente aprobado (revisión del PR #39, D-87): GET /client/home con el conteo de técnicos
// de la zona, el «desde S/ X» por especialidad con tarifas vigentes y las subcategorías activas para los atajos (D-93).
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->huancayo = Sprint04::district('HUANCAYO');
    $this->tambo = Sprint04::district('EL-TAMBO');
    $this->client = ClientProfileFactory::new()->create(['district_id' => $this->huancayo])->user;
    Sanctum::actingAs($this->client);
});

function s05Home(object $test): array
{
    return $test->getJson('/api/v1/client/home')->assertOk()->json('data');
}

it('S05-TC-050 cuenta solo los técnicos verificados, activos, sin pausa y con servicio que atienden el distrito del cliente', function () {
    Sprint04::technician(['districts' => [$this->huancayo]]);
    Sprint04::technician(['districts' => [$this->huancayo, $this->tambo]]);
    Sprint04::technician(['districts' => [$this->tambo]]);
    Sprint04::technician(['districts' => [$this->huancayo], 'profile' => ['verification_status' => 'pending', 'status' => 'pending_verification']]);
    $paused = Sprint04::technician(['districts' => [$this->huancayo]]);
    Sprint04::pause($paused->id, CarbonImmutable::now()->subHour());
    $withoutService = Sprint04::technician(['districts' => [$this->huancayo]]);
    DB::table('technician_services')->where('technician_id', $withoutService->id)->update(['active' => 0]);

    $home = s05Home($this);

    expect($home['district'])->toBe(['id' => $this->huancayo, 'name' => 'Huancayo'])
        ->and($home['technicians_in_zone'])->toBe(2);
});

it('S05-TC-051 da el «desde S/ X» por especialidad con las tarifas de técnicos elegibles y omite las especialidades sin tarifa', function () {
    Sprint04::technician(['fee' => '80.00']);
    Sprint04::technician(['fee' => '60.00', 'subcategory' => 'computo-redes']);
    Sprint04::technician(['fee' => '45.00', 'profile' => ['verification_status' => 'pending', 'status' => 'pending_verification']]);
    Sprint04::technician(['fee' => '120.00', 'subcategory' => 'frio-vitrinas']);
    Sprint04::technician(['fee' => '30.00', 'subcategory' => 'electricidad-tableros']);
    DB::table('specialties')->where('code', 'electricidad')->update(['active' => 0]);

    $prices = collect(s05Home($this)['prices'])->keyBy('name');

    expect($prices->keys()->all())->toEqualCanonicalizing(['Cómputo', 'Refrigeración comercial'])
        ->and($prices['Cómputo'])->toMatchArray(['from_fee' => '60.00', 'currency' => 'PEN'])
        ->and($prices['Refrigeración comercial']['from_fee'])->toBe('120.00');
});

it('S05-TC-052 sin distrito principal no cuenta la zona pero sí devuelve precios y subcategorías activas para los atajos', function () {
    Sanctum::actingAs(ClientProfileFactory::new()->create(['district_id' => null])->user);
    Sprint04::technician(['fee' => '70.00']);
    DB::table('subcategories')->where('code', 'computo-redes')->update(['active' => 0]);

    $home = s05Home($this);
    $codes = array_column($home['subcategories'], 'code');

    expect($home['district'])->toBeNull()
        ->and($home['technicians_in_zone'])->toBeNull()
        ->and($home['prices'])->toHaveCount(1)
        ->and($codes)->toContain('computo-hardware', 'frio-vitrinas')
        ->and($codes)->not->toContain('computo-redes')
        ->and(array_keys($home['subcategories'][0]))->toEqualCanonicalizing(['id', 'specialty_id', 'code', 'name']);
});

it('S05-TC-053 solo el cliente con sesión lo consulta y la respuesta no trae datos privados', function () {
    $technician = Sprint04::technician(['profile' => ['whatsapp' => '+51987654321']]);
    $content = $this->getJson('/api/v1/client/home')->assertOk()->getContent();
    expect($content)->not->toContain('987654321')->not->toContain('user_id')->not->toContain('email')
        ->not->toContain('address')->not->toContain('display_name');
    expect(array_keys(s05Home($this)))->toEqualCanonicalizing(['district', 'technicians_in_zone', 'prices', 'subcategories']);

    Sanctum::actingAs($technician->user);
    $this->getJson('/api/v1/client/home')->assertForbidden();
    Sprint01::forgetSession();
    $this->getJson('/api/v1/client/home')->assertUnauthorized();
});

it('S05-TC-054 usa un número fijo de consultas sin importar cuántos técnicos haya', function () {
    $queries = function () {
        DB::flushQueryLog();
        DB::enableQueryLog();
        s05Home($this);
        $count = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $count;
    };
    Sprint04::technician();
    $few = $queries();
    foreach (range(1, 8) as $n) {
        Sprint04::technician(['fee' => (50 + $n).'.00', 'subcategory' => $n % 2 ? 'frio-vitrinas' : 'computo-redes']);
    }

    expect($queries())->toBe($few);
});
