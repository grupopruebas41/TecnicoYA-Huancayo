<?php

namespace App\Modules\BMatching\Http\Controllers;

use App\Modules\BMatching\Application\TechnicianSearch;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * GET /client/home (Inicio del cliente aprobado en la revisión del PR #39): distrito principal, técnicos elegibles de
 * esa zona, «desde S/ X» por especialidad y subcategorías activas para resolver los atajos por problema (D-93).
 * Número fijo de consultas y sin datos de técnicos ni del cliente más allá de su distrito.
 */
final class ClientHomeController
{
    public function show(Request $request, TechnicianSearch $search): JsonResponse
    {
        $district = DB::table('client_profiles as c')->join('districts as d', 'd.id', '=', 'c.district_id')
            ->where('c.user_id', $request->user()->id)->first(['d.id', 'd.name']);

        return ApiResponse::data([
            'district' => $district ? ['id' => (int) $district->id, 'name' => $district->name] : null,
            'technicians_in_zone' => $district ? $search->countInDistrict((int) $district->id) : null,
            'prices' => $search->pricesBySpecialty(),
            'subcategories' => DB::table('subcategories as s')->join('specialties as p', 'p.id', '=', 's.specialty_id')
                ->where('s.active', 1)->where('p.active', 1)->orderBy('p.display_order')->orderBy('s.display_order')->orderBy('s.id')
                ->get(['s.id', 's.specialty_id', 's.code', 's.name'])
                ->map(fn (object $row) => ['id' => (int) $row->id, 'specialty_id' => (int) $row->specialty_id, 'code' => $row->code, 'name' => $row->name])
                ->all(),
        ]);
    }
}
