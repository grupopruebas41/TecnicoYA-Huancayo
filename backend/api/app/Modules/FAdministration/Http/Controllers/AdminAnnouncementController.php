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
        $audiences = $this->announcements->audiences($rows->pluck('id')->all());

        return ApiResponse::data($rows->map(fn (object $row) => $this->present($row, $audiences->get($row->id, [])))->all());
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

    public function retire(Request $request, string $announcement): Response
    {
        $this->announcements->retire($request->user(), $announcement);

        return response()->noContent();
    }

    private function respond(object $row, int $status = 200): JsonResponse
    {
        return ApiResponse::data($this->present($row, $this->announcements->audiences([$row->id])->get($row->id, [])), $status);
    }

    private function present(object $row, array $audiences): array
    {
        $iso = fn (?string $value) => $value === null ? null : Carbon::parse($value)->toISOString();

        return [
            'id' => $row->id, 'title' => $row->title, 'body' => $row->body,
            'status' => $row->retired_at === null ? $row->status : 'retired', 'audiences' => $audiences,
            'priority' => (int) $row->priority, 'link_url' => $row->link_url, 'link_label' => $row->link_label,
            'starts_at' => $iso($row->starts_at), 'ends_at' => $iso($row->ends_at), 'retired_at' => $iso($row->retired_at),
            'version' => (int) $row->version,
        ];
    }
}
