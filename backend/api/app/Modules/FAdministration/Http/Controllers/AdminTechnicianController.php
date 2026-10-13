<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\ReviewTechnician;
use App\Modules\FAdministration\Application\TechnicianDirectory;
use App\Modules\FAdministration\Application\TechnicianStatus;
use App\Modules\FAdministration\Http\Requests\ReviewTechnicianRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Verificación de técnicos (contrato S2 §9; permiso technicians.verify). La suspensión no tiene pantalla en S2. */
final class AdminTechnicianController
{
    public function __construct(private readonly TechnicianDirectory $directory, private readonly TechnicianStatus $status) {}

    public function index(Request $request): JsonResponse
    {
        $filter = $request->validate(['status' => ['nullable', Rule::in(array_keys(TechnicianDirectory::FILTERS))]])['status'] ?? null;

        return ApiResponse::data($this->directory->inbox($filter));
    }

    public function show(int $technician): JsonResponse
    {
        return ApiResponse::data($this->directory->card($technician));
    }

    public function review(ReviewTechnicianRequest $request, int $technician, ReviewTechnician $review): JsonResponse
    {
        $result = $review->decide($request->user(), $technician, $request->validated());

        return ApiResponse::data([
            'id' => $result->id, 'technician_id' => $result->technician_id,
            'decision' => $result->decision, 'reviewed_at' => $result->reviewed_at,
        ], 201);
    }

    public function suspend(Request $request, int $technician): JsonResponse
    {
        return $this->changed($this->status->suspend($request->user(), $technician, $this->motive($request)));
    }

    public function reactivate(Request $request, int $technician): JsonResponse
    {
        return $this->changed($this->status->reactivate($request->user(), $technician, $this->motive($request)));
    }

    private function motive(Request $request): array
    {
        return $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:2000'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ]);
    }

    private function changed(object $profile): JsonResponse
    {
        return ApiResponse::data(['id' => $profile->id, 'status' => $profile->status, 'version' => (int) $profile->version]);
    }
}
