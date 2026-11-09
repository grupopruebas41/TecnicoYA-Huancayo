<?php

namespace App\Modules\BMatching\Http\Controllers;

use App\Modules\BMatching\Application\TechnicianSearch;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * D-101 (propuesta, Fase 3): técnicos favoritos del cliente de la sesión (role:client). Guardar y quitar son
 * idempotentes; un técnico no habilitado no se puede guardar (404). No se auditan: no cambian datos de terceros.
 */
final class FavoriteTechnicianController
{
    public function index(Request $request, TechnicianSearch $search): JsonResponse
    {
        return ApiResponse::data($search->favorites((int) $request->user()->id));
    }

    public function store(Request $request, int $technician, TechnicianSearch $search): JsonResponse
    {
        if (! $search->canBeFavorite($technician)) {
            return ApiResponse::error('NOT_FOUND', __('api.favorite_unavailable'), 404);
        }
        DB::table('client_favorite_technicians')->insertOrIgnore(['client_user_id' => $request->user()->id, 'technician_id' => $technician]);

        return ApiResponse::data(['technician_id' => $technician, 'favorite' => true]);
    }

    public function destroy(Request $request, int $technician): Response
    {
        DB::table('client_favorite_technicians')->where('client_user_id', $request->user()->id)->where('technician_id', $technician)->delete();

        return response()->noContent();
    }
}
