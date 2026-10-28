<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Modules\BMatching\Suggestions\QueryNormalizer;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * D-94 (RECO-01): el administrador mantiene el diccionario del buscador (catalog.manage). Las frases no se borran, se
 * desactivan; las sugeridas por la IA se aprueban (crean la frase) o se descartan. Todo queda auditado.
 */
final class ManageKeywords
{
    public const PERMISSION = 'catalog.manage';

    public function __construct(private readonly QueryNormalizer $normalizer, private readonly AuditTrail $audit) {}

    public function create(User $actor, array $data): object
    {
        return DB::transaction(function () use ($actor, $data) {
            $normalized = $this->normalized($data['phrase']);
            $this->ensureUnique((int) $data['subcategory_id'], $normalized);
            $id = DB::table('subcategory_keywords')->insertGetId([
                'subcategory_id' => $data['subcategory_id'], 'phrase' => trim($data['phrase']), 'normalized_phrase' => $normalized,
                'weight' => $data['weight'], 'kind' => $data['kind'], 'active' => true, 'version' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $row = DB::table('subcategory_keywords')->find($id);
            $this->audit->record($actor, 'catalog.keyword_created', self::PERMISSION, 'subcategory_keyword', $id,
                'Frase agregada al diccionario del buscador.', [], $this->snapshot($row));

            return $row;
        });
    }

    public function update(User $actor, int $id, array $data): object
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $row = DB::table('subcategory_keywords')->lockForUpdate()->find($id);
            abort_unless($row, 404);
            abort_unless((int) $row->version === (int) $data['expected_version'], 409, __('api.stale_version'));
            $changes = array_intersect_key($data, array_flip(['weight', 'kind', 'active']));
            if (isset($data['phrase'])) {
                $normalized = $this->normalized($data['phrase']);
                if ($normalized !== $row->normalized_phrase) {
                    $this->ensureUnique((int) $row->subcategory_id, $normalized);
                }
                $changes += ['phrase' => trim($data['phrase']), 'normalized_phrase' => $normalized];
            }
            DB::table('subcategory_keywords')->where('id', $id)->update($changes + ['version' => $row->version + 1, 'updated_at' => now()]);
            $after = DB::table('subcategory_keywords')->find($id);
            $this->audit->record($actor, 'catalog.keyword_updated', self::PERMISSION, 'subcategory_keyword', $id,
                ($data['active'] ?? true) ? 'Frase del buscador editada.' : 'Frase del buscador desactivada.',
                $this->snapshot($row), $this->snapshot($after));

            return $after;
        });
    }

    /** Aprueba una frase sugerida por la IA: crea la frase (si no existía) en su subcategoría. */
    public function approve(User $actor, int $id, array $data): object
    {
        return DB::transaction(function () use ($actor, $id, $data) {
            $suggestion = DB::table('keyword_suggestions')->lockForUpdate()->find($id);
            abort_unless($suggestion, 404);
            abort_unless($suggestion->status === 'pending', 409, __('api.suggestion_resolved'));
            DB::table('subcategory_keywords')->insertOrIgnore([
                'subcategory_id' => $suggestion->subcategory_id, 'phrase' => $suggestion->normalized_query,
                'normalized_phrase' => $suggestion->normalized_query, 'weight' => $data['weight'] ?? 5, 'kind' => $data['kind'] ?? 'general',
                'active' => true, 'version' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('keyword_suggestions')->where('id', $id)->update(['status' => 'approved', 'updated_at' => now()]);
            $this->audit->record($actor, 'catalog.keyword_suggestion_approved', self::PERMISSION, 'keyword_suggestion', $id,
                'Frase sugerida por la IA aprobada.', ['status' => 'pending'],
                ['status' => 'approved', 'subcategory_id' => (int) $suggestion->subcategory_id, 'phrase' => $suggestion->normalized_query]);

            return DB::table('keyword_suggestions')->find($id);
        });
    }

    public function discard(User $actor, int $id): object
    {
        return DB::transaction(function () use ($actor, $id) {
            $suggestion = DB::table('keyword_suggestions')->lockForUpdate()->find($id);
            abort_unless($suggestion, 404);
            abort_unless($suggestion->status === 'pending', 409, __('api.suggestion_resolved'));
            DB::table('keyword_suggestions')->where('id', $id)->update(['status' => 'discarded', 'updated_at' => now()]);
            $this->audit->record($actor, 'catalog.keyword_suggestion_discarded', self::PERMISSION, 'keyword_suggestion', $id,
                'Frase sugerida por la IA descartada.', ['status' => 'pending'], ['status' => 'discarded']);

            return DB::table('keyword_suggestions')->find($id);
        });
    }

    private function normalized(string $phrase): string
    {
        $normalized = $this->normalizer->normalize($phrase);
        if ($normalized === '') {
            throw ValidationException::withMessages(['phrase' => __('api.keyword_empty')]);
        }

        return $normalized;
    }

    private function ensureUnique(int $subcategoryId, string $normalized): void
    {
        if (DB::table('subcategory_keywords')->where('subcategory_id', $subcategoryId)->where('normalized_phrase', $normalized)->exists()) {
            throw ValidationException::withMessages(['phrase' => __('api.keyword_duplicate')]);
        }
    }

    private function snapshot(object $row): array
    {
        return ['subcategory_id' => (int) $row->subcategory_id, 'phrase' => $row->phrase, 'weight' => (int) $row->weight,
            'kind' => $row->kind, 'active' => (bool) $row->active];
    }
}
