<?php

namespace App\Modules\BMatching\Http\Controllers;

use App\Modules\BMatching\Suggestions\SuggestionService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /catalog/suggestions?q= (D-94): hasta 3 subcategorías activas para el texto de un problema, con su especialidad,
 * puntaje, nivel (alta, media o baja) y el origen (keywords o ai). Público como el resto del catálogo, con límite por IP.
 */
final class CatalogSuggestionController
{
    public function index(Request $request, SuggestionService $suggestions): JsonResponse
    {
        $data = $request->validate(['q' => ['required', 'string', 'min:3', 'max:120']], [
            'q.required' => __('api.suggestion_query'), 'q.min' => __('api.suggestion_query'), 'q.max' => __('api.suggestion_query'),
        ]);

        return ApiResponse::data($suggestions->suggest($data['q']));
    }
}
