<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\BMatching\Suggestions\KeywordEngine;
use App\Modules\FAdministration\Application\ManageKeywords;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Catálogo › Palabras clave (D-94, catalog.manage): diccionario del buscador, prueba de frases, búsquedas sin
 * resultado y frases sugeridas por la IA. Contrato S5 §8.
 */
final class AdminKeywordController
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate(['subcategory_id' => ['nullable', 'integer', 'exists:subcategories,id'],
            'q' => ['nullable', 'string', 'max:120'], 'page' => ['nullable', 'integer', 'min:1']]);
        $query = DB::table('subcategory_keywords as k')->join('subcategories as s', 's.id', '=', 'k.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->when($filters['subcategory_id'] ?? null, fn ($q, $id) => $q->where('k.subcategory_id', $id))
            ->when($filters['q'] ?? null, fn ($q, $text) => $q->where('k.phrase', 'like', '%'.addcslashes($text, '%_\\').'%'));
        $total = (clone $query)->count();
        $page = (int) ($filters['page'] ?? 1);
        $items = $query->orderBy('p.display_order')->orderBy('s.display_order')->orderByDesc('k.weight')->orderBy('k.id')
            ->forPage($page, 50)->get(['k.*', 's.name as subcategory_name', 'p.name as specialty_name'])
            ->map(fn (object $row) => $this->keyword($row))->all();

        return ApiResponse::data(['items' => $items,
            'pagination' => ['page' => $page, 'per_page' => 50, 'total' => $total, 'last_page' => max(1, (int) ceil($total / 50))]]);
    }

    public function store(Request $request, ManageKeywords $keywords): JsonResponse
    {
        $data = $request->validate($this->rules(true), $this->messages());

        return ApiResponse::data($this->keyword($keywords->create($request->user(), $data)), 201);
    }

    public function update(Request $request, int $keyword, ManageKeywords $keywords): JsonResponse
    {
        $data = $request->validate($this->rules(false) + ['active' => ['sometimes', 'boolean'],
            'expected_version' => ['required', 'integer', 'min:1']], $this->messages());

        return ApiResponse::data($this->keyword($keywords->update($request->user(), $keyword, $data)));
    }

    /** «Probar una frase»: solo el diccionario, con las frases que coincidieron. */
    public function test(Request $request, KeywordEngine $engine): JsonResponse
    {
        $data = $request->validate(['q' => ['required', 'string', 'min:3', 'max:120']], ['q.required' => __('api.suggestion_query'), 'q.min' => __('api.suggestion_query'), 'q.max' => __('api.suggestion_query')]);

        return ApiResponse::data($engine->search($data['q']));
    }

    public function misses(): JsonResponse
    {
        return ApiResponse::data(DB::table('keyword_misses')->orderByDesc('count')->orderByDesc('last_seen_at')->limit(50)
            ->get()->map(fn (object $row) => ['id' => (int) $row->id, 'query' => $row->normalized_query, 'count' => (int) $row->count,
                'last_seen_at' => (string) $row->last_seen_at])->all());
    }

    public function suggestions(): JsonResponse
    {
        return ApiResponse::data(DB::table('keyword_suggestions as g')->join('subcategories as s', 's.id', '=', 'g.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 's.specialty_id')->where('g.status', 'pending')
            ->orderByDesc('g.count')->orderByDesc('g.last_seen_at')->limit(50)
            ->get(['g.id', 'g.normalized_query', 'g.subcategory_id', 'g.count', 'g.last_seen_at', 's.name as subcategory_name',
                'p.name as specialty_name'])
            ->map(fn (object $row) => ['id' => (int) $row->id, 'query' => $row->normalized_query, 'subcategory_id' => (int) $row->subcategory_id,
                'subcategory_name' => $row->subcategory_name, 'specialty_name' => $row->specialty_name, 'count' => (int) $row->count])->all());
    }

    public function approve(Request $request, int $suggestion, ManageKeywords $keywords): JsonResponse
    {
        $data = $request->validate(['weight' => ['sometimes', 'integer', 'between:1,10'],
            'kind' => ['sometimes', Rule::in(['objeto', 'sintoma', 'general'])]], $this->messages());

        return ApiResponse::data(['id' => (int) $keywords->approve($request->user(), $suggestion, $data)->id, 'status' => 'approved']);
    }

    public function discard(Request $request, int $suggestion, ManageKeywords $keywords): JsonResponse
    {
        return ApiResponse::data(['id' => (int) $keywords->discard($request->user(), $suggestion)->id, 'status' => 'discarded']);
    }

    private function rules(bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return [
            'subcategory_id' => $creating ? ['required', 'integer', Rule::exists('subcategories', 'id')] : ['prohibited'],
            'phrase' => [$required, 'string', 'min:2', 'max:120'],
            'weight' => [$required, 'integer', 'between:1,10'],
            'kind' => [$required, Rule::in(['objeto', 'sintoma', 'general'])],
        ];
    }

    private function messages(): array
    {
        return ['weight.between' => __('api.keyword_weight'), 'kind.in' => __('api.keyword_kind'), 'phrase.required' => __('api.keyword_phrase'), 'phrase.min' => __('api.keyword_phrase'),
            'phrase.max' => __('api.keyword_phrase')];
    }

    private function keyword(object $row): array
    {
        return ['id' => (int) $row->id, 'subcategory_id' => (int) $row->subcategory_id, 'subcategory_name' => $row->subcategory_name ?? null,
            'specialty_name' => $row->specialty_name ?? null, 'phrase' => $row->phrase, 'normalized_phrase' => $row->normalized_phrase,
            'weight' => (int) $row->weight, 'kind' => $row->kind, 'active' => (bool) $row->active, 'version' => (int) $row->version];
    }
}
