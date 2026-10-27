<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\ManageAnnouncements;
use App\Modules\FAdministration\Http\Requests\AnnouncementRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/** Comunicados del panel administrativo (contrato S2 §8; permiso announcements.manage). */
final class AdminAnnouncementController
{
    public function __construct(private readonly ManageAnnouncements $announcements) {}

    public function index(Request $request): JsonResponse
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['draft', 'published', 'retired'])]])['status'] ?? null;
        $rows = $this->announcements->list($status);
        $ids = $rows->pluck('id')->all();
        [$audiences, $positions] = [$this->announcements->audiences($ids), $this->announcements->positions($ids)];

        return ApiResponse::data($rows->map(fn (object $row) => $this->present($row, $audiences->get($row->id, []), $positions->get($row->id, [])))->all());
    }

    public function store(AnnouncementRequest $request): JsonResponse
    {
        return $this->respond($this->announcements->create($request->user(), $request->validated()), 201);
    }

    public function update(AnnouncementRequest $request, string $announcement): JsonResponse
    {
        return $this->respond($this->announcements->update($request->user(), $announcement, $request->validated()));
    }

    public function publish(Request $request, string $announcement): JsonResponse
    {
        $data = $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);

        return $this->respond($this->announcements->publish($request->user(), $announcement, (int) $data['expected_version']));
    }

    /** D-83: despublicar (vuelve a borrador). */
    public function unpublish(Request $request, string $announcement): JsonResponse
    {
        $data = $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);

        return $this->respond($this->announcements->unpublish($request->user(), $announcement, (int) $data['expected_version']));
    }

    /** D-83: orden del carrusel de una audiencia. */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'audience' => ['required', 'string', Rule::in(['client', 'technician'])],
            'ids' => ['present', 'array', 'max:200'], 'ids.*' => ['required', 'uuid'],
        ]);

        return ApiResponse::data($this->announcements->reorder($request->user(), $data['audience'], $data['ids']));
    }

    /** D-84: restaurar un retirado como borrador. */
    public function restore(Request $request, string $announcement): JsonResponse
    {
        $data = $request->validate(['expected_version' => ['required', 'integer', 'min:1']]);

        return $this->respond($this->announcements->restore($request->user(), $announcement, (int) $data['expected_version']));
    }

    /** D-84: eliminar de forma definitiva; se confirma escribiendo ELIMINAR (también lo exige la SPA). */
    public function destroy(Request $request, string $announcement): JsonResponse
    {
        $data = $request->validate([
            'expected_version' => ['required', 'integer', 'min:1'],
            'confirmation' => ['required', 'string', 'in:ELIMINAR'],
        ], ['confirmation.in' => __('api.announcement_delete_confirmation'), 'confirmation.required' => __('api.announcement_delete_confirmation')]);
        $this->announcements->destroy($request->user(), $announcement, (int) $data['expected_version']);

        return ApiResponse::data(['id' => $announcement, 'deleted' => true]);
    }

    public function retire(Request $request, string $announcement): Response
    {
        $this->announcements->retire($request->user(), $announcement);

        return response()->noContent();
    }

    private function respond(object $row, int $status = 200): JsonResponse
    {
        return ApiResponse::data($this->present($row, $this->announcements->audiences([$row->id])->get($row->id, []),
            $this->announcements->positions([$row->id])->get($row->id, [])), $status);
    }

    private function present(object $row, array $audiences, array $positions): array
    {
        $iso = fn (?string $value) => $value === null ? null : Carbon::parse($value)->toISOString();
        $media = fn (?int $id) => $id === null ? null : url("/api/v1/media/$id");
        $int = fn ($value) => $value === null ? null : (int) $value;

        return [
            'id' => $row->id, 'title' => $row->title, 'body' => $row->body,
            'status' => $row->retired_at === null ? $row->status : 'retired', 'phase' => $this->phase($row), 'audiences' => $audiences,
            'positions' => (object) $positions, 'source' => $row->source, 'kind' => $row->kind,
            'image_media_id' => $int($row->image_media_id), 'image_url' => $media($int($row->image_media_id)),
            'mobile_media_id' => $int($row->mobile_media_id), 'mobile_image_url' => $media($int($row->mobile_media_id)),
            'genially_url' => $row->genially_url, 'alt_text' => $row->alt_text,
            'priority' => (int) $row->priority, 'link_url' => $row->link_url, 'link_label' => $row->link_label,
            'starts_at' => $iso($row->starts_at), 'ends_at' => $iso($row->ends_at), 'retired_at' => $iso($row->retired_at),
            'version' => (int) $row->version,
        ];
    }

    /** Fase para el listado (D-83): borrador, programado, vigente, vencido o retirado. */
    private function phase(object $row): string
    {
        return match (true) {
            $row->retired_at !== null => 'retired',
            $row->status !== 'published' => 'draft',
            $row->starts_at !== null && Carbon::parse($row->starts_at)->greaterThan(now()) => 'scheduled',
            $row->ends_at !== null && Carbon::parse($row->ends_at)->lessThanOrEqualTo(now()) => 'expired',
            default => 'active',
        };
    }
}
