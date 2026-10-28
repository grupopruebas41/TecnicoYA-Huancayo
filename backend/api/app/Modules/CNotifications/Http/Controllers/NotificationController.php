<?php

namespace App\Modules\CNotifications\Http\Controllers;

use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * GET /notifications (contrato S4 §7.1): la bandeja del usuario de la sesión, la más reciente primero. after_id
 * recupera lo que falte al reconectar. Los intentos de entrega no se exponen.
 * D-90 (NOTIF-02): filtros state y type, unread_count para la campana y marca de leída solo del dueño.
 */
final class NotificationController
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'after_id' => ['sometimes', 'integer', 'min:0'],
            'state' => ['sometimes', Rule::in(['read', 'unread'])],
            'type' => ['sometimes', 'string', 'max:60', 'regex:/^[a-z_]+(\.[a-z_]+)*$/'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ], ['state.in' => __('api.notification_state'), 'type.max' => __('api.notification_type'), 'type.regex' => __('api.notification_type')]);
        $own = DB::table('notifications')->where('user_id', $request->user()->id);
        $query = (clone $own)
            ->when(isset($filters['after_id']), fn ($q) => $q->where('id', '>', $filters['after_id']))
            ->when(isset($filters['state']), fn ($q) => $filters['state'] === 'read' ? $q->whereNotNull('read_at') : $q->whereNull('read_at'))
            ->when(isset($filters['type']), fn ($q) => $q->where('type', $filters['type']));
        $perPage = (int) ($filters['per_page'] ?? 20);
        $page = (int) ($filters['page'] ?? 1);
        $total = (clone $query)->count();
        $items = $query->orderByDesc('created_at')->orderByDesc('id')->forPage($page, $perPage)->get()->map(fn (object $n) => $this->item($n))->all();

        return ApiResponse::data(['items' => $items,
            'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'last_page' => max(1, (int) ceil($total / $perPage))],
            'unread_count' => (clone $own)->whereNull('read_at')->count()]);
    }

    /** Marca una notificación propia; repetir conserva la primera fecha. Una ajena responde 404 como si no existiera. */
    public function read(Request $request, int $notification): JsonResponse
    {
        $own = DB::table('notifications')->where('id', $notification)->where('user_id', $request->user()->id);
        abort_unless((clone $own)->exists(), 404);
        (clone $own)->whereNull('read_at')->update(['read_at' => now(), 'updated_at' => now()]);

        return ApiResponse::data($this->item($own->first()));
    }

    public function readAll(Request $request): JsonResponse
    {
        $updated = DB::table('notifications')->where('user_id', $request->user()->id)->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return ApiResponse::data(['updated' => $updated]);
    }

    private function item(object $n): array
    {
        return [
            'id' => $n->id, 'type' => $n->type, 'title' => $n->title, 'body' => $n->body,
            'subject' => ['type' => $n->subject_type, 'id' => (int) $n->subject_id], 'event_id' => $n->event_id,
            'created_at' => Carbon::parse($n->created_at)->toISOString(),
            'read_at' => $n->read_at === null ? null : Carbon::parse($n->read_at)->toISOString(),
        ];
    }
}
