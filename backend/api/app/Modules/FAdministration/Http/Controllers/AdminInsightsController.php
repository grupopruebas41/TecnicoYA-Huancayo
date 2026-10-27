<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\AdminDashboard;
use App\Modules\FAdministration\Application\AdminRequests;
use App\Modules\FAdministration\Application\AdminStatistics;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Estadísticas y solicitudes en solo lectura (contrato S07 §9.2 y §9.3; permiso dashboard.view, D-85). */
final class AdminInsightsController
{
    public function statistics(Request $request, AdminStatistics $statistics): JsonResponse
    {
        $days = (int) ($request->validate(['days' => ['nullable', 'integer', Rule::in(AdminStatistics::RANGES)]])['days'] ?? 30);

        return ApiResponse::data($statistics->snapshot($days));
    }

    public function requests(Request $request, AdminRequests $requests): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(AdminDashboard::REQUEST_STATUSES)],
            'district_id' => ['nullable', 'integer', 'min:1'],
            'specialty_id' => ['nullable', 'integer', 'min:1'],
            'created_from' => ['nullable', 'date_format:Y-m-d'],
            'created_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:created_from'],
            'q' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return ApiResponse::data($requests->list($filters));
    }

    public function request(int $serviceRequest, AdminRequests $requests): JsonResponse
    {
        return ApiResponse::data($requests->detail($serviceRequest));
    }
}
