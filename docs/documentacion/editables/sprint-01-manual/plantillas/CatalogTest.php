<?php

use Database\Seeders\CatalogSeeder;
use Illuminate\Support\Facades\DB;

it('TC-011 repite la semilla sin duplicados y conserva sus relaciones', function () {
    $this->seed(CatalogSeeder::class);
    $before = DB::table('subcategories')->orderBy('code')->pluck('id', 'code')->all();
    $this->seed(CatalogSeeder::class);
    expect(DB::table('specialties')->count())->toBe(3);
    expect(DB::table('subcategories')->count())->toBe(30);
    expect(DB::table('subcategories')->orderBy('code')->pluck('id', 'code')->all())->toBe($before);
    $counts = DB::table('subcategories')->selectRaw('specialty_id, COUNT(*) AS total')
        ->groupBy('specialty_id')->pluck('total')->map(fn ($n) => (int) $n)->sort()->values()->all();
    expect($counts)->toBe([9, 10, 11]);
    $orphans = DB::table('subcategories as sub')->leftJoin('specialties as s', 's.id', '=', 'sub.specialty_id')
        ->whereNull('s.id')->count();
    expect($orphans)->toBe(0);
});

it('TC-012 API omite especialidades y subcategorías inactivas', function () {
    $this->seed(CatalogSeeder::class);
    $first = DB::table('specialties')->orderBy('id')->first();
    DB::table('specialties')->where('id', $first->id)->update(['active' => 0]);
    $this->getJson('/api/v1/catalog/specialties')->assertOk()
        ->assertJsonMissing(['id' => (string) $first->id]);
    $this->getJson('/api/v1/catalog/subcategories?specialty_id='.$first->id)
        ->assertOk()->assertJsonPath('data', []);
});
