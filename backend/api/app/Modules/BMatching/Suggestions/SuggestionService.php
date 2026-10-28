<?php

namespace App\Modules\BMatching\Suggestions;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * D-94 (RECO-01): buscador híbrido. Siempre responde el diccionario; la IA (si está activa) solo se consulta cuando el
 * diccionario no encuentra nada o su confianza es baja, con caché de 24 h por consulta normalizada. Ante cualquier
 * error de la IA se responde con el diccionario. Lo que resolvió la IA queda como frase sugerida pendiente de aprobar.
 * Sin coincidencias, la consulta normalizada se cuenta en keyword_misses (sin usuario, IP ni otros datos).
 */
final class SuggestionService
{
    public function __construct(private readonly KeywordEngine $engine, private readonly QueryNormalizer $normalizer,
        private readonly SuggestionProvider $ai) {}

    /** @return array{source: string, level: string|null, items: list<array<string, mixed>>} */
    public function suggest(string $query): array
    {
        $problem = mb_substr(trim($query), 0, QueryNormalizer::MAX_LENGTH);
        $normalized = $this->normalizer->normalize($problem);
        $keywords = $this->engine->search($problem);
        $result = ['source' => 'keywords', 'level' => $keywords['level'],
            'items' => array_map(fn (array $item) => array_diff_key($item, ['matched' => 1]), $keywords['items'])];

        if ($normalized !== '' && in_array($keywords['level'], [null, 'baja'], true) && $this->ai->source() === 'ai' && $this->ai->enabled()) {
            $result = $this->withAi($problem, $normalized) ?? $result;
        }
        if ($result['items'] === [] && $normalized !== '') {
            $this->recordMiss($normalized);
        }

        return $result;
    }

    private function withAi(string $problem, string $normalized): ?array
    {
        $catalog = $this->catalog();
        try {
            $ids = Cache::remember('suggestions:ai:'.sha1($normalized), now()->addHours((int) config('ai.cache_hours')),
                fn () => $this->ai->suggest($problem, array_values(array_map(fn (object $row) => ['id' => $row->id,
                    'name' => $row->specialty_name.' › '.$row->name], $catalog))));
        } catch (Throwable $error) {
            // Solo el tipo de error: el mensaje podría incluir partes de la petición.
            Log::warning('El proveedor de IA del buscador falló; se responde con el diccionario.', ['error' => $error::class]);

            return null;
        }
        $items = array_values(array_filter(array_map(fn (int $id) => isset($catalog[$id]) ? ['subcategory_id' => $id,
            'subcategory_name' => $catalog[$id]->name, 'specialty_id' => (int) $catalog[$id]->specialty_id,
            'specialty_name' => $catalog[$id]->specialty_name, 'score' => null] : null, (array) $ids)));
        if ($items === []) {
            return null;
        }
        $this->recordSuggestions($normalized, array_column($items, 'subcategory_id'));

        return ['source' => 'ai', 'level' => 'media', 'items' => $items];
    }

    /** Subcategorías activas de especialidades activas, por id. */
    private function catalog(): array
    {
        return DB::table('subcategories as s')->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->where('s.active', 1)->where('p.active', 1)->orderBy('p.display_order')->orderBy('s.display_order')
            ->get(['s.id', 's.name', 's.specialty_id', 'p.name as specialty_name'])
            ->each(fn (object $row) => $row->id = (int) $row->id)->keyBy('id')->all();
    }

    private function recordMiss(string $normalized): void
    {
        $now = now();
        DB::table('keyword_misses')->upsert([['normalized_query' => $normalized, 'count' => 1, 'last_seen_at' => $now]],
            ['normalized_query'], ['count' => DB::raw('`count` + 1'), 'last_seen_at' => $now]);
    }

    /** Frases sugeridas por la IA: pendientes hasta que un administrador las apruebe; nunca entran solas al diccionario. */
    private function recordSuggestions(string $normalized, array $ids): void
    {
        $now = now();
        DB::table('keyword_suggestions')->upsert(array_map(fn (int $id) => ['normalized_query' => $normalized, 'subcategory_id' => $id,
            'status' => 'pending', 'count' => 1, 'last_seen_at' => $now, 'created_at' => $now, 'updated_at' => $now], $ids),
            ['normalized_query', 'subcategory_id'], ['count' => DB::raw('`count` + 1'), 'last_seen_at' => $now, 'updated_at' => $now]);
    }
}
