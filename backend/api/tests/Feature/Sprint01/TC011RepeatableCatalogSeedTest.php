<?php

// TC-011 · HU-S01-06 · RF-C01, RF-28, RF-33 · AC-S01-06-01
// Referencia: docs/documentacion/editables/sprint-01-manual/catalogo-referencia.csv (11/9/10 = 30).
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('TC-011: repite la semilla del catálogo sin duplicados y con relaciones válidas', function () {
    // Dado una base MySQL de pruebas migrada y una primera ejecución de la semilla
    $this->seed(CatalogSeeder::class);
    $idsBefore = DB::table('subcategories')->orderBy('code')->pluck('id', 'code')->all();

    // Cuando la semilla se ejecuta por segunda vez
    $this->seed(CatalogSeeder::class);

    // Entonces hay 3 especialidades y 30 subcategorías, con los mismos IDs
    expect(DB::table('specialties')->count())->toBe(3)
        ->and(DB::table('subcategories')->count())->toBe(30)
        ->and(DB::table('subcategories')->orderBy('code')->pluck('id', 'code')->all())->toBe($idsBefore);

    // Y la distribución por especialidad coincide con la referencia (9, 10 y 11)
    $perSpecialty = DB::table('subcategories')
        ->selectRaw('specialty_id, COUNT(*) AS total')
        ->groupBy('specialty_id')
        ->pluck('total')
        ->map(fn ($total) => (int) $total)
        ->sort()->values()->all();
    expect($perSpecialty)->toBe([9, 10, 11]);

    // Y ninguna subcategoría queda huérfana
    $orphans = DB::table('subcategories as sub')
        ->leftJoin('specialties as spec', 'spec.id', '=', 'sub.specialty_id')
        ->whereNull('spec.id')
        ->count();
    expect($orphans)->toBe(0);
});
