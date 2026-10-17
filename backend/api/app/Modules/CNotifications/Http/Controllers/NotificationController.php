<?php

namespace App\Modules\CNotifications\Http\Controllers;

use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * GET /notifications (contrato S4 §7.1): la bandeja del usuario de la sesión, la más reciente primero. after_id
 * recupera lo que falte al reconectar. Los intentos de entrega no se exponen.
 */
final class NotificationController
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'after_id' => ['sometimes', 'integer', 'min:0'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);
        $query = DB::table('notifications')->where('user_id', $request->user()->id)
            ->when(isset($filters['after_id']), fn ($q) => $q->where('id', '>', $filters['after_id']));
        $perPage = (int) ($filters['per_page'] ?? 20);
        $page = (int) ($filters['page'] ?? 1);
        $total = (clone $query)->count();
        $items = $query->orderByDesc('created_at')->orderByDesc('id')->forPage($page, $perPage)->get()->map(fn (object $n) => [
            'id' => $n->id, 'type' => $n->type, 'title' => $n->title, 'body' => $n->body,
            'subject' => ['type' => $n->subject_type, 'id' => (int) $n->subject_id], 'event_id' => $n->event_id,
            'created_at' => Carbon::parse($n->created_at)->toISOString(),
            'read_at' => $n->read_at === null ? null : Carbon::parse($n->read_at)->toISOString(),
        ])->all();

        return ApiResponse::data(['items' => $items,
            'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'last_page' => max(1, (int) ceil($total / $perPage))]]);
    }
}
