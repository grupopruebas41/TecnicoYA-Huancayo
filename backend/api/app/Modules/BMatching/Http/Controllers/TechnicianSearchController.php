<?php

namespace App\Modules\BMatching\Http\Controllers;

use App\Modules\BMatching\Application\TechnicianSearch;
use App\Modules\BMatching\Http\Requests\SearchTechniciansRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class TechnicianSearchController
{
    public function index(SearchTechniciansRequest $request, TechnicianSearch $search): JsonResponse
    {
        $filters = $request->validated();
        // D-101: con cercanía, precio o experiencia la tarjeta trae la distancia si hay origen; por nombre, no (S05-TC-002).
        $origin = in_array($filters['sort'] ?? 'name', ['proximity', 'price', 'experience'], true) ? $request->origin() : null;
        $role = DB::table('roles')->where('id', $request->user()->role_id)->value('code');
        $client = $role === 'client' ? (int) $request->user()->id : null;

        return ApiResponse::data($search->search($filters, $origin, $client));
    }
}
