<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * D-92 (PEDIDO-01): catálogo inicial de problemas frecuentes por subcategoría (database/seeders/data/symptoms.php).
 * Idempotente: agrega solo los que faltan (único por subcategoría y nombre) sin tocar los existentes. Solo siembra
 * subcategorías que existen en el catálogo.
 */
class SymptomSeeder extends Seeder
{
    public function run(): void
    {
        $subcategories = DB::table('subcategories')->pluck('id', 'code');
        $now = now();
        $rows = [];
        foreach (require database_path('seeders/data/symptoms.php') as $code => $names) {
            if (! isset($subcategories[$code])) {
                continue;
            }
            foreach ($names as $index => $name) {
                $rows[] = ['subcategory_id' => $subcategories[$code], 'name' => $name, 'position' => $index + 1,
                    'active' => true, 'created_at' => $now, 'updated_at' => $now];
            }
        }
        DB::table('subcategory_symptoms')->insertOrIgnore($rows);
    }
}
