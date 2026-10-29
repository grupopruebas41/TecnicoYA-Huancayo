<?php

namespace App\Modules\BMatching\Suggestions;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * D-94 (RECO-01): motor por diccionario. Por cada subcategoría activa suma los pesos de sus frases activas que aparecen
 * en la consulta, primero las de más palabras y sin contar dos veces la misma palabra. Una frase «general» (ambigua,
 * como «no prende») vale la mitad si ninguna frase «objeto» de la misma especialidad coincidió. Devuelve hasta 3.
 */
final class KeywordEngine
{
    public const HIGH = 8.0;

    public const MEDIUM = 4.0;

    public function __construct(private readonly QueryNormalizer $normalizer) {}

    /**
     * @return array{level: string|null, items: list<array{subcategory_id: int, subcategory_name: string, specialty_id: int,
     *     specialty_name: string, score: float, matched: list<string>}>}
     */
    public function search(string $query): array
    {
        $tokens = $this->normalizer->tokens($query);
        if ($tokens === []) {
            return ['level' => null, 'items' => []];
        }
        $matches = [];
        foreach ($this->keywords()->groupBy('subcategory_id') as $subcategoryId => $phrases) {
            $used = [];
            foreach ($phrases as $phrase) {
                $words = explode(' ', $phrase->normalized_phrase);
                $at = $this->find($tokens, $words, $used);
                if ($at === null) {
                    continue;
                }
                array_push($used, ...range($at, $at + count($words) - 1));
                $matches[$subcategoryId][] = $phrase;
            }
        }
        $objectSpecialties = collect($matches)->flatten(1)->where('kind', 'objeto')->pluck('specialty_id')->unique()->all();

        $items = collect($matches)->map(function (array $phrases) use ($objectSpecialties) {
            $first = $phrases[0];
            $score = array_sum(array_map(fn (object $p) => $p->kind === 'general' && ! in_array($p->specialty_id, $objectSpecialties, true)
                ? $p->weight / 2 : (float) $p->weight, $phrases));

            return ['subcategory_id' => (int) $first->subcategory_id, 'subcategory_name' => $first->subcategory_name,
                'specialty_id' => (int) $first->specialty_id, 'specialty_name' => $first->specialty_name, 'score' => round($score, 1),
                'objects' => count(array_filter($phrases, fn (object $p) => $p->kind === 'objeto')),
                'order' => [(int) $first->specialty_order, (int) $first->subcategory_order, (int) $first->subcategory_id],
                'matched' => array_map(fn (object $p) => $p->phrase, $phrases)];
        })
            // Empates: más frases «objeto» y luego el orden del catálogo, para que el resultado sea estable.
            ->sort(fn (array $a, array $b) => [$b['score'], $b['objects']] <=> [$a['score'], $a['objects']] ?: $a['order'] <=> $b['order'])
            ->take(3)->map(fn (array $item) => array_diff_key($item, ['objects' => 1, 'order' => 1]))->values()->all();

        return ['level' => $items === [] ? null : self::level($items[0]['score']), 'items' => $items];
    }

    public static function level(float $score): string
    {
        return $score >= self::HIGH ? 'alta' : ($score >= self::MEDIUM ? 'media' : 'baja');
    }

    /** Frases activas de subcategorías y especialidades activas, primero las de más palabras y mayor peso. */
    private function keywords(): Collection
    {
        return DB::table('subcategory_keywords as k')->join('subcategories as s', 's.id', '=', 'k.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->where('k.active', 1)->where('s.active', 1)->where('p.active', 1)
            ->get(['k.subcategory_id', 'k.phrase', 'k.normalized_phrase', 'k.weight', 'k.kind', 's.name as subcategory_name',
                's.specialty_id', 'p.name as specialty_name', 'p.display_order as specialty_order', 's.display_order as subcategory_order'])
            ->each(function (object $row) {
                $row->specialty_id = (int) $row->specialty_id;
                $row->weight = (int) $row->weight;
            })
            ->sortBy([fn (object $a, object $b) => substr_count($b->normalized_phrase, ' ') <=> substr_count($a->normalized_phrase, ' '),
                fn (object $a, object $b) => $b->weight <=> $a->weight])
            ->values();
    }

    /** Primera posición donde aparecen las palabras seguidas sin usar ninguna ya contada. */
    private function find(array $tokens, array $words, array $used): ?int
    {
        $size = count($words);
        for ($i = 0; $i + $size <= count($tokens); $i++) {
            if (array_slice($tokens, $i, $size) === $words && array_intersect(range($i, $i + $size - 1), $used) === []) {
                return $i;
            }
        }

        return null;
    }
}
