<?php

namespace Database\Seeders;

use App\Modules\BMatching\Suggestions\QueryNormalizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * D-94 (RECO-01): diccionario inicial del buscador «¿Qué se malogró?» (database/seeders/data/keywords.php).
 * Idempotente: agrega solo las frases que faltan (único por subcategoría y frase normalizada) y nunca pisa lo que el
 * administrador cambió, desactivó o aprobó. Solo siembra subcategorías que existen en el catálogo.
 */
class KeywordSeeder extends Seeder
{
    public function run(QueryNormalizer $normalizer): void
    {
        $subcategories = DB::table('subcategories')->pluck('id', 'code');
        $now = now();
        $rows = [];
        foreach (require database_path('seeders/data/keywords.php') as $code => $phrases) {
            if (! isset($subcategories[$code])) {
                continue;
            }
            foreach ($phrases as [$phrase, $kind, $weight]) {
                $rows[] = ['subcategory_id' => $subcategories[$code], 'phrase' => $phrase, 'normalized_phrase' => $normalizer->normalize($phrase),
                    'weight' => $weight, 'kind' => $kind, 'active' => true, 'version' => 1, 'created_at' => $now, 'updated_at' => $now];
            }
        }
        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table('subcategory_keywords')->insertOrIgnore($chunk);
        }
    }
}
