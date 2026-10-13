<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $file = fopen(database_path('seeders/data/catalog.csv'), 'r');
        if ($file === false) {
            throw new SeedingRefused('No se pudo leer el catálogo semilla.');
        }

        try {
            fgetcsv($file, escape: '');
            DB::transaction(function () use ($file) {
                $specialties = ['Cómputo' => 'computo', 'Refrigeración comercial' => 'refrigeracion', 'Electricidad' => 'electricidad'];
                foreach ($specialties as $name => $code) {
                    if (! DB::table('specialties')->where('code', $code)->exists()) {
                        DB::table('specialties')->insert([
                            'code' => $code, 'name' => $name,
                            'display_order' => array_search($name, array_keys($specialties), true) + 1,
                        ]);
                    }
                }

                $order = 0;
                while (($row = fgetcsv($file, escape: '')) !== false) {
                    [$specialtyName, $code, $name] = $row;
                    if (! isset($specialties[$specialtyName])) {
                        throw new SeedingRefused('Especialidad semilla desconocida.');
                    }
                    $order++;
                    // No sobrescribir nombres, precios o estados administrados posteriormente.
                    if (! DB::table('subcategories')->where('code', $code)->exists()) {
                        DB::table('subcategories')->insert([
                            'specialty_id' => DB::table('specialties')->where('code', $specialties[$specialtyName])->value('id'),
                            'code' => $code, 'name' => $name, 'display_order' => $order,
                        ]);
                    }
                }
            });
        } finally {
            fclose($file);
        }
    }
}
