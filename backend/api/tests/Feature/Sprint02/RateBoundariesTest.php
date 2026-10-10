<?php

// HU-S02-07 · RF-05, RF-07, RF-C06 · Tarifas referenciales: límites de D-48, versiones y auditoría (SEC-S02-04).
// Contrato S2 §6.2.
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
    $this->technician = TechnicianProfileFactory::new()->approved()->create();
    $this->subcategory = Sprint02::subcategoryId();
    Sanctum::actingAs($this->technician->user);
});

function s02PutRate(object $test, string $fee, ?int $subcategory = null)
{
    return $test->putJson('/api/v1/technicians/me/services', [
        'services' => [['subcategory_id' => $subcategory ?? $test->subcategory, 'reference_fee' => $fee]],
        'expected_version' => Sprint02::version('technician_profiles', $test->technician->id),
    ]);
}

function s02Service(object $test): ?object
{
    return DB::table('technician_services')->where('technician_id', $test->technician->id)->where('subcategory_id', $test->subcategory)->first();
}

it('S02-TC-053 VAL-02 acepta la tarifa mínima de S/ 1,00 y rechaza S/ 0,99 sin crear versión', function () {
    s02PutRate($this, '1.00')->assertOk();

    Sprint01::assertSpanishValidation(s02PutRate($this, '0.99'), ['services.0.reference_fee']);

    expect(s02Service($this)->reference_fee)->toBe('1.00')
        ->and(DB::table('service_rate_versions')->where('technician_service_id', s02Service($this)->id)->count())->toBe(1);
});

it('S02-TC-054 VAL-02 acepta la tarifa máxima de S/ 5 000,00 y rechaza S/ 5 000,01', function () {
    s02PutRate($this, '5000.00')->assertOk();

    Sprint01::assertSpanishValidation(s02PutRate($this, '5000.01'), ['services.0.reference_fee']);

    expect(s02Service($this)->reference_fee)->toBe('5000.00')
        ->and(DB::table('service_rate_versions')->where('technician_service_id', s02Service($this)->id)->count())->toBe(1);
});

it('S02-TC-055 VAL-02 rechaza una tarifa con tres decimales sin crear el servicio', function () {
    Sprint01::assertSpanishValidation(s02PutRate($this, '50.555'), ['services.0.reference_fee']);

    expect(s02Service($this))->toBeNull();
    $this->assertDatabaseCount('service_rate_versions', 0);
});

it('S02-TC-056 no crea una versión nueva cuando se reenvía la misma tarifa', function () {
    s02PutRate($this, '50.00')->assertOk();

    s02PutRate($this, '50')->assertOk();

    expect(s02Service($this)->current_rate_version)->toBe(1)
        ->and(DB::table('service_rate_versions')->where('technician_service_id', s02Service($this)->id)->count())->toBe(1);
});

it('S02-TC-057 VAL-02 rechaza una subcategoría inactiva o de una especialidad inactiva sin crear servicio', function () {
    DB::table('subcategories')->where('id', $this->subcategory)->update(['active' => 0]);
    $electric = DB::table('subcategories')->where('specialty_id', Sprint02::specialtyId('electricidad'))->value('id');
    DB::table('specialties')->where('code', 'electricidad')->update(['active' => 0]);

    Sprint01::assertSpanishValidation(s02PutRate($this, '60.00'), ['services.0.subcategory_id']);
    Sprint01::assertSpanishValidation(s02PutRate($this, '60.00', $electric), ['services.0.subcategory_id']);

    $this->assertDatabaseCount('technician_services', 0);
});

it('S02-TC-058 audita el cambio de tarifa con el valor anterior y el nuevo', function () {
    $service = TechnicianServiceFactory::new()->create(['technician_id' => $this->technician->id, 'subcategory_id' => $this->subcategory]);

    s02PutRate($this, '60.00')->assertOk();

    $entry = DB::table('audit_entries')->where('action', 'technician.rate.changed')->sole();
    expect($entry->actor_id)->toBe($this->technician->user_id)
        ->and($entry->subject_type)->toBe('technician_service')
        ->and($entry->subject_id)->toBe($service->id)
        ->and(json_decode($entry->before_values, true))->toBe(['reference_fee' => '50.00', 'rate_version' => 1])
        ->and(json_decode($entry->after_values, true))->toBe(['reference_fee' => '60.00', 'rate_version' => 2]);
});
