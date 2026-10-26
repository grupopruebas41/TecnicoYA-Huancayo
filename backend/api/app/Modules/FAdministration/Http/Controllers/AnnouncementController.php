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
        $media = fn (?int $id) => $id === null ? null : url("/api/v1/media/$id");

        // D-83: el carrusel recibe las URLs de sus imágenes; los ids de media quedan en el servidor.
        return ApiResponse::data($this->announcements->visibleTo($request->user())->map(fn (object $row) => [
            'id' => $row->id, 'title' => $row->title, 'body' => $row->body, 'source' => $row->source, 'kind' => $row->kind,
            'image_url' => $media($row->image_media_id), 'mobile_image_url' => $media($row->mobile_media_id),
            'genially_url' => $row->genially_url, 'alt_text' => $row->alt_text, 'link_url' => $row->link_url,
            'link_label' => $row->link_label, 'priority' => (int) $row->priority, 'starts_at' => $row->starts_at,
            'ends_at' => $row->ends_at, 'position' => (int) $row->position,
        ])->all());
    }

    public function duplicate(Request $request, string $announcement): JsonResponse
    {
        $copy = $this->announcements->duplicate($request->user(), $announcement);

        return ApiResponse::data([
            'id' => $copy->id, 'title' => $copy->title, 'status' => $copy->status, 'version' => (int) $copy->version,
        ], 201);
    }
}
