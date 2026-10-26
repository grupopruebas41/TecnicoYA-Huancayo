<?php

// S04-TC-134 a 136 · HU-S02-01 · RF-C08 · Pendientes de la landing (HANDOFF-codex 2026-10-19): tarifa de referencia
// en el carrusel (D-52) y distritos sembrados por un DatabaseSeeder idempotente (D-15, D-64).
use Database\Factories\MediaFileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

function s04CarouselSubcategories(object $test, int $count): array
{
    $ids = DB::table('subcategories')->where('specialty_id', Sprint02::specialtyId('computo'))
        ->orderBy('display_order')->orderBy('id')->limit($count)->pluck('id')->all();
    foreach ($ids as $id) {
        $media = MediaFileFactory::new()->publicImage()->create(['owner_id' => $test->owner->id])->id;
        DB::table('subcategories')->where('id', $id)->update(['carousel_media_id' => $media]);
    }

    return $ids;
}

describe('carrusel', function () {
    beforeEach(function () {
        $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
        Storage::fake('public');
        Storage::fake('local');
        Sprint01::actAsSpa($this);
        $this->owner = Sprint02::admin();
    });

    it('S04-TC-134 el carrusel expone la tarifa de referencia con 2 decimales y null sin tarifa [TC-013]', function () {
        [$withFee, $round, $withoutFee] = s04CarouselSubcategories($this, 3);
        DB::table('subcategories')->where('id', $withFee)->update(['reference_fee' => 45.5]);
        DB::table('subcategories')->where('id', $round)->update(['reference_fee' => 120]);
        DB::table('subcategories')->where('id', $withoutFee)->update(['reference_fee' => null]);

        $items = collect($this->getJson('/api/v1/catalog/carousel')->assertOk()->json('data'))->keyBy('subcategory_id');

        expect($items[$withFee]['reference_fee'])->toBe('45.50')
            ->and($items[$round]['reference_fee'])->toBe('120.00')
            ->and($items[$withoutFee])->toHaveKey('reference_fee')
            ->and($items[$withoutFee]['reference_fee'])->toBeNull();
    });

    it('S04-TC-135 el carrusel se arma con una sola consulta aunque crezca el número de subcategorías', function () {
        $queriesFor = function (int $count) {
            s04CarouselSubcategories($this, $count);
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->getJson('/api/v1/catalog/carousel')->assertOk()->assertJsonCount($count, 'data');
            $log = collect(DB::getQueryLog())->pluck('query')->filter(fn (string $sql) => str_contains($sql, 'subcategories'));
            DB::disableQueryLog();

            return $log->count();
        };

        expect($queriesFor(2))->toBe(1)
            ->and($queriesFor(5))->toBe(1);
    });
});

it('S04-TC-136 DatabaseSeeder siembra permisos, catálogo y los distritos activos sin duplicar ni pisar cambios', function () {
    $this->seed(DatabaseSeeder::class);

    $districts = $this->getJson('/api/v1/catalog/districts')->assertOk()->json('data');
    expect(array_column($districts, 'code'))->toEqualCanonicalizing(['HUANCAYO', 'EL-TAMBO', 'CHILCA'])
        ->and(DB::table('district_distances')->count())->toBe(6)
        ->and(DB::table('specialties')->where('active', 1)->count())->toBe(3)
        ->and(DB::table('permissions')->pluck('code')->all())->toContain('catalog.manage', 'technicians.verify')
        ->and(DB::table('users')->count())->toBe(0);

    // Un administrador desactiva Chilca; volver a sembrar no duplica ni lo reactiva.
    DB::table('districts')->where('code', 'CHILCA')->update(['active' => 0]);
    $counts = fn () => [DB::table('districts')->count(), DB::table('specialties')->count(), DB::table('subcategories')->count(),
        DB::table('permissions')->count(), DB::table('role_permissions')->count(), DB::table('district_distances')->count()];
    $before = $counts();

    $this->seed(DatabaseSeeder::class);

    expect($counts())->toBe($before)
        ->and(array_column($this->getJson('/api/v1/catalog/districts')->json('data'), 'code'))->toEqualCanonicalizing(['HUANCAYO', 'EL-TAMBO']);
});
