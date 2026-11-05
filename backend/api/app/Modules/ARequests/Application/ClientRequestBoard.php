<?php

namespace App\Modules\ARequests\Application;

use App\Models\User;
use App\Modules\BMatching\Application\SearchState;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Tablero de Mis solicitudes (GET /client/requests): pestañas con contador, búsqueda, agrupación por pedido y paginación
 * por grupos para no partir un pedido entre páginas. Las solicitudes de un cliente son pocas: se filtran en memoria y las
 * consultas por tarjeta solo se hacen para la página pedida. Por lista blanca: nunca datos de contacto (RN-22).
 */
final class ClientRequestBoard
{
    public const TABS = ['active', 'scheduled', 'completed', 'cancelled'];

    public const PER_PAGE = 10;

    private const RECENT_EVENTS = 3;

    public function __construct(private readonly SearchState $state) {}

    /** D-100: un borrador va en Activas aunque sea programado, porque todavía no se envió. */
    public static function tabOf(object $row): string
    {
        return match ($row->status) {
            'completed', 'closed', 'unrated' => 'completed',
            'cancelled', 'expired' => 'cancelled',
            'registered' => 'active',
            default => $row->mode === 'scheduled' ? 'scheduled' : 'active',
        };
    }

    public function forClient(User $user, array $filters): array
    {
        $rows = DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->join('subcategories as s', 's.id', '=', 'r.subcategory_id')->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->join('districts as d', 'd.id', '=', 'r.district_id')->leftJoin('service_orders as o', 'o.id', '=', 'r.order_id')
            ->where('c.user_id', $user->id)->orderByDesc('r.id')
            ->get(['r.*', 'p.id as specialty_id', 'p.name as specialty_name', 'd.name as district_name', 'o.submitted_at as order_submitted_at', 'o.item_count as order_total']);
        $subcategories = RequestSubcategories::named($rows);
        $found = $this->search($rows, $subcategories, (string) ($filters['q'] ?? ''));
        $tab = $filters['tab'] ?? 'active';
        $entries = $found->filter(fn (object $row) => self::tabOf($row) === $tab)->groupBy(fn (object $row) => $row->order_id ? "order-$row->order_id" : "request-$row->id")->values();

        $perPage = (int) ($filters['per_page'] ?? self::PER_PAGE);
        $page = (int) ($filters['page'] ?? 1);
        $visible = $entries->forPage($page, $perPage)->values();
        $cards = $this->cards($visible->flatten(1), $subcategories);

        return [
            'items' => $visible->map(fn (Collection $group) => [
                'order' => $group[0]->order_id === null ? null : [
                    'id' => (int) $group[0]->order_id, 'submitted_at' => self::iso($group[0]->order_submitted_at), 'total' => (int) $group[0]->order_total,
                ],
                'requests' => $group->map(fn (object $row) => $cards[$row->id])->all(),
            ])->all(),
            'counts' => array_merge(array_fill_keys(self::TABS, 0), $found->countBy(fn (object $row) => self::tabOf($row))->all()),
            'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $entries->count(), 'last_page' => max(1, (int) ceil($entries->count() / $perPage))],
        ];
    }

    private function search(Collection $rows, array $subcategories, string $query): Collection
    {
        $needle = self::normalized($query);
        if ($needle === '') {
            return $rows;
        }

        return $rows->filter(fn (object $row) => str_contains(self::normalized(implode(' ', [
            "#$row->id", $row->specialty_name, $row->district_name, $row->description, $row->brand, $row->model,
            ...array_column($subcategories[$row->id], 'name'),
        ])), $needle))->values();
    }

    private static function normalized(string $text): string
    {
        return Str::lower(trim(Str::ascii($text)));
    }

    /** @return array<int, array> tarjetas por id de solicitud, sin consultas por fila salvo la fase de búsqueda */
    private function cards(Collection $rows, array $subcategories): array
    {
        $ids = $rows->pluck('id');
        $technicians = DB::table('participations as p')->join('technician_profiles as t', 't.id', '=', 'p.technician_id')
            ->whereIn('p.request_id', $ids)->whereIn('p.status', ['assigned', 'in_progress', 'completed'])
            ->get(['p.request_id', 't.id', 't.display_name'])->keyBy('request_id');
        $events = DB::table('request_events')->whereIn('request_id', $ids)->whereIn('event_type', array_keys(ClientTimeline::LABELS))
            ->orderBy('occurred_at')->orderBy('id')->get(['request_id', 'event_type', 'occurred_at'])->groupBy('request_id');

        return $rows->mapWithKeys(fn (object $row) => [$row->id => [
            'id' => (int) $row->id, 'status' => $row->status, 'phase' => $this->state->phase($row), 'mode' => $row->mode, 'source' => $row->source,
            'version' => (int) $row->version, 'order_id' => $row->order_id === null ? null : (int) $row->order_id, 'urgency' => $row->urgency,
            'specialty' => ['id' => (int) $row->specialty_id, 'name' => $row->specialty_name],
            'subcategories' => $subcategories[$row->id],
            'district' => ['id' => (int) $row->district_id, 'name' => $row->district_name],
            'created_at' => self::iso($row->created_at), 'submitted_at' => self::iso($row->submitted_at), 'updated_at' => self::iso($row->updated_at),
            'preferred_start_at' => self::iso($row->preferred_start_at), 'preferred_end_at' => self::iso($row->preferred_end_at), 'time_slot' => $row->time_slot,
            'technician' => $technicians->has($row->id) ? ['id' => (int) $technicians[$row->id]->id, 'display_name' => $technicians[$row->id]->display_name] : null,
            'recent_events' => $events->get($row->id, collect())->take(-self::RECENT_EVENTS)->map(fn (object $event) => [
                'type' => $event->event_type, 'label' => ClientTimeline::LABELS[$event->event_type], 'occurred_at' => self::iso($event->occurred_at),
            ])->values()->all(),
            'can_cancel' => in_array($row->status, RequestCancellation::CANCELLABLE, true),
        ]])->all();
    }

    private static function iso(?string $value): ?string
    {
        return $value === null ? null : Carbon::parse($value, 'UTC')->toISOString();
    }
}
