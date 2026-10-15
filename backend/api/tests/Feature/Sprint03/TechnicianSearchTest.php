<?php

// S03-TC-042 a 048 y 051 · HU-S03-04 · RF-C06 · D-18 y D-57: búsqueda de técnicos (TC-033, TC-034).
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($this->client);
    $this->huancayo = DistrictFactory::new()->create()->id;
    $this->tambo = DistrictFactory::new()->create()->id;
});

afterEach(fn () => Carbon::setTestNow());

it('S03-TC-042 combina especialidad, subcategoría y distrito y devuelve vacío si nada coincide [TC-033]', function () {
    $match = Sprint03::searchableTechnician('computo-hardware', [$this->huancayo]);
    Sprint03::searchableTechnician('frio-domestico', [$this->huancayo]);
    Sprint03::searchableTechnician('computo-hardware', [$this->tambo]);
    Sprint03::searchableTechnician('computo-redes', [$this->huancayo]);

    $query = http_build_query(['specialty_id' => Sprint02::specialtyId('computo'), 'subcategory_id' => Sprint02::subcategoryId('computo-hardware'), 'district_id' => $this->huancayo]);
    expect(Sprint03::ids($this->getJson("/api/v1/technicians?$query")))->toBe([$match->id]);

    $none = $this->getJson('/api/v1/technicians?'.http_build_query(['subcategory_id' => Sprint02::subcategoryId('frio-domestico'), 'district_id' => $this->tambo]))
        ->assertOk();
    expect($none->json('data.items'))->toBe([])
        ->and($none->json('data.pagination.total'))->toBe(0);
});

it('S03-TC-043 solo muestra técnicos activos y verificados con un servicio y rubro activos [TC-033]', function () {
    $visible = Sprint03::searchableTechnician();
    $pending = TechnicianProfileFactory::new()->create();
    TechnicianServiceFactory::new()->create(['technician_id' => $pending->id]);
    Sprint03::searchableTechnician(profile: ['status' => 'pending_verification', 'verification_status' => 'rejected']);
    Sprint03::searchableTechnician(profile: ['status' => 'suspended']);
    $inactiveAccount = Sprint03::searchableTechnician();
    DB::table('users')->where('id', $inactiveAccount->user_id)->update(['is_active' => false]);
    $inactiveService = Sprint03::searchableTechnician();
    DB::table('technician_services')->where('technician_id', $inactiveService->id)->update(['active' => 0]);
    Sprint03::searchableTechnician('frio-domestico');
    DB::table('specialties')->where('code', 'refrigeracion')->update(['active' => 0]);

    expect(Sprint03::ids($this->getJson('/api/v1/technicians')))->toBe([$visible->id]);
});

it('S03-TC-044 sin calificaciones el técnico aparece sin promedio y no pasa un filtro de calificación mínima [TC-033]', function () {
    Sprint03::searchableTechnician();
    Sprint03::searchableTechnician();

    $items = $this->getJson('/api/v1/technicians')->assertOk()->json('data.items');
    expect($items)->toHaveCount(2);
    foreach ($items as $item) {
        expect($item['rating'])->toBe(['average' => null, 'count' => 0]);
    }

    $filtered = $this->getJson('/api/v1/technicians?min_rating=1')->assertOk();
    expect($filtered->json('data.items'))->toBe([])
        ->and($filtered->json('data.pagination.total'))->toBe(0);
});

it('S03-TC-045 cada tarjeta trae solo la proyección pública, sin contacto ni documentos [TC-034]', function () {
    $technician = Sprint03::searchableTechnician('computo-hardware', [$this->huancayo], ['whatsapp' => '+51987654321']);
    TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id]);
    $email = DB::table('users')->where('id', $technician->user_id)->value('email');

    $response = $this->getJson('/api/v1/technicians')->assertOk();
    $item = $response->json('data.items.0');

    expect(array_keys($item))->toEqualCanonicalizing(['id', 'display_name', 'provider_type', 'experience_years', 'services', 'districts', 'rating'])
        ->and(array_keys($item['services'][0]))->toEqualCanonicalizing(['subcategory_id', 'subcategory_name', 'reference_fee', 'currency'])
        ->and($item['districts'])->toBe([['id' => $this->huancayo, 'name' => DB::table('districts')->where('id', $this->huancayo)->value('name')]]);
    expect($response->getContent())->not->toContain('987654321')->not->toContain($email)->not->toContain('user_id')
        ->not->toContain('documents')->not->toContain('verification_status');
});

it('S03-TC-046 rechaza en español los parámetros de búsqueda inválidos sin errores del servidor', function () {
    $inactiveDistrict = DistrictFactory::new()->inactive()->create()->id;
    $cases = [
        'subcategory_id' => ['specialty_id' => Sprint02::specialtyId('computo'), 'subcategory_id' => Sprint02::subcategoryId('frio-domestico')],
        'district_id' => ['district_id' => $inactiveDistrict],
        'min_rating' => ['min_rating' => 0],
        'per_page' => ['per_page' => 51],
        'orden' => ['orden' => 'puntaje'],
    ];
    foreach ($cases as $field => $query) {
        Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?'.http_build_query($query)), [$field]);
    }
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?min_rating=6'), ['min_rating']);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?per_page=0'), ['per_page']);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/technicians?'.http_build_query(['district_id' => '1 OR 1=1'])), ['district_id']);
});

it('S03-TC-047 pagina de forma estable por nombre visible e id', function () {
    $names = ['Técnico 07', 'Técnico 03', 'Técnico 11', 'Técnico 01', 'Técnico 13', 'Técnico 05', 'Técnico 09',
        'Técnico 02', 'Técnico 12', 'Técnico 04', 'Técnico 10', 'Técnico 06', 'Técnico 08'];
    foreach ($names as $name) {
        Sprint03::searchableTechnician(profile: ['display_name' => $name]);
    }

    $first = $this->getJson('/api/v1/technicians?per_page=12&page=1')->assertOk();
    $second = $this->getJson('/api/v1/technicians?per_page=12&page=2')->assertOk();
    $all = $this->getJson('/api/v1/technicians?per_page=50')->assertOk();

    $paged = array_merge(array_column($first->json('data.items'), 'display_name'), array_column($second->json('data.items'), 'display_name'));
    $sorted = $names;
    sort($sorted);
    expect($first->json('data.items'))->toHaveCount(12)
        ->and($second->json('data.items'))->toHaveCount(1)
        ->and($paged)->toBe($sorted)
        ->and($first->json('data.pagination'))->toBe(['page' => 1, 'per_page' => 12, 'total' => 13, 'last_page' => 2])
        ->and($all->json('data.items'))->toHaveCount(13);
});

it('S03-TC-048 la búsqueda exige sesión activa', function () {
    Sprint03::searchableTechnician();
    DB::table('users')->where('id', $this->client->id)->update(['is_active' => false]);
    $this->getJson('/api/v1/technicians')->assertForbidden();

    Sprint01::forgetSession();
    $this->getJson('/api/v1/technicians')->assertUnauthorized();
});

it('S03-TC-051 excluye de la búsqueda al técnico con pausa vigente pero mantiene su perfil por enlace [TC-033]', function () {
    Carbon::setTestNow('2026-10-15 15:00:00');
    $paused = Sprint03::searchableTechnician();
    $finished = Sprint03::searchableTechnician();
    $future = Sprint03::searchableTechnician();
    DB::table('technician_pauses')->insert([
        ['technician_id' => $paused->id, 'starts_at' => '2026-10-15 14:00:00', 'ends_at' => null, 'cancelled_at' => null],
        ['technician_id' => $finished->id, 'starts_at' => '2026-10-15 10:00:00', 'ends_at' => '2026-10-15 15:00:00', 'cancelled_at' => null],
        ['technician_id' => $future->id, 'starts_at' => '2026-10-15 16:00:00', 'ends_at' => null, 'cancelled_at' => null],
    ]);

    expect(Sprint03::ids($this->getJson('/api/v1/technicians')))->toEqualCanonicalizing([$finished->id, $future->id]);
    $this->getJson("/api/v1/technicians/{$paused->id}")->assertOk()->assertJsonPath('data.id', $paused->id);
});
