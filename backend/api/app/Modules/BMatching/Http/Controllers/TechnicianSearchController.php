<?php

namespace App\Modules\BMatching\Http\Controllers;

use App\Modules\BMatching\Application\TechnicianSearch;
use App\Modules\BMatching\Http\Requests\SearchTechniciansRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

final class TechnicianSearchController
{
    public function index(SearchTechniciansRequest $request, TechnicianSearch $search): JsonResponse
    {
        $filters = $request->validated();

        return ApiResponse::data($search->search($filters, ($filters['sort'] ?? 'name') === 'proximity' ? $request->origin() : null));
    }
}
