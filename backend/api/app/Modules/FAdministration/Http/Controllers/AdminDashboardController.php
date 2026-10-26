<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\AdminDashboard;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

/** GET /admin/dashboard (permiso dashboard.view, D-74). */
final class AdminDashboardController
{
    public function show(AdminDashboard $dashboard): JsonResponse
    {
        return ApiResponse::data($dashboard->snapshot());
    }
}
