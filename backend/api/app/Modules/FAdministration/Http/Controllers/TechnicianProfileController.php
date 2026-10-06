<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\Portfolio;
use App\Modules\FAdministration\Application\ReviewTechnician;
use App\Modules\FAdministration\Application\UpdateAvailability;
use App\Modules\FAdministration\Application\UpdateServices;
use App\Modules\FAdministration\Http\Requests\ReviewTechnicianRequest;
use App\Modules\FAdministration\Http\Requests\StorePortfolioItemRequest;
use App\Modules\FAdministration\Http\Requests\UpdateAvailabilityRequest;
use App\Modules\FAdministration\Http\Requests\UpdateServicesRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

final class TechnicianProfileController
{
    public function availability(UpdateAvailabilityRequest $request, UpdateAvailability $update): JsonResponse
    {
        return ApiResponse::data($update->execute($request->user(), $request->validated()));
    }

    public function services(UpdateServicesRequest $request, UpdateServices $update): JsonResponse
    {
        return ApiResponse::data($update->execute($request->user(), $request->validated()));
    }

    public function storePortfolio(StorePortfolioItemRequest $request, Portfolio $portfolio): JsonResponse
    {
        return ApiResponse::data(['id' => $portfolio->store($request->user(), $request->validated())], 201);
    }

    public function portfolio(int $technician, Portfolio $portfolio): JsonResponse
    {
        return ApiResponse::data($portfolio->publicGallery($technician));
    }

    public function review(ReviewTechnicianRequest $request, int $technician, ReviewTechnician $review): JsonResponse
    {
        $result = $review->approve($request->user(), $technician, $request->validated());

        return ApiResponse::data([
            'id' => $result->id, 'technician_id' => $result->technician_id,
            'decision' => $result->decision, 'reviewed_at' => $result->reviewed_at,
        ], 201);
    }
}
