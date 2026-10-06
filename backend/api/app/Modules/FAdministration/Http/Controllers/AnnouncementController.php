<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\Announcements;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AnnouncementController
{
    public function __construct(private readonly Announcements $announcements) {}

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::data($this->announcements->visibleTo($request->user())->map(fn (object $row) => (array) $row)->all());
    }

    public function duplicate(Request $request, string $announcement): JsonResponse
    {
        $copy = $this->announcements->duplicate($request->user(), $announcement);

        return ApiResponse::data([
            'id' => $copy->id, 'title' => $copy->title, 'status' => $copy->status, 'version' => (int) $copy->version,
        ], 201);
    }
}
