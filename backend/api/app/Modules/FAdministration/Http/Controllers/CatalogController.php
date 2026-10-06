<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class CatalogController
{
    public function specialties(): JsonResponse
    {
        return ApiResponse::data(DB::table('specialties')->where('active', 1)
            ->orderBy('display_order')->orderBy('id')->get(['id', 'code', 'name', 'description'])->toArray());
    }

    public function subcategories(Request $request): JsonResponse
    {
        $filter = $request->validate(['specialty_id' => ['required', 'integer', 'exists:specialties,id']]);
        $items = DB::table('subcategories as s')->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->where('p.active', 1)->where('s.active', 1)->where('s.specialty_id', $filter['specialty_id'])
            ->orderBy('s.display_order')->orderBy('s.id')
            ->get(['s.id', 's.specialty_id', 's.code', 's.name', 's.description']);

        return ApiResponse::data($items->toArray());
    }
}
