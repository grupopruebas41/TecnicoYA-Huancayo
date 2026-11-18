<?php

namespace App\Modules\FAdministration\Application;

use App\Modules\ARequests\Application\RequestSubcategories;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Panel del técnico, Fase T3: Mis trabajos (participaciones propias por pestaña, con conteos, búsqueda y paginación) y
 * Mi agenda (citas confirmadas de una semana). La dirección exacta solo sale si el trabajo está asignado a ese técnico
 * (asignado, en curso o completado); un trabajo cancelado o ajeno nunca la muestra (SEC-S04-05). Lo ajeno responde 404.
 */
final class TechnicianJobs
{
    public const TABS = ['assigned', 'in_progress', 'completed', 'cancelled'];

    private const WITH_ADDRESS = ['assigned', 'in_progress', 'completed'];

    public function list(int $technicianId, array $filters): array
    {
        $tab = $filters['tab'] ?? 'assigned';
        $perPage = (int) ($filters['per_page'] ?? 8);
        $page = (int) ($filters['page'] ?? 1);
        $search = trim((string) ($filters['q'] ?? ''));
        $counts = $this->base($technicianId, $search)->selectRaw('p.status, count(*) as total')->groupBy('p.status')->pluck('total', 'status');
        $query = $this->base($technicianId, $search)->where('p.status', $tab);
        $total = (clone $query)->count();
        // Lo que viene primero: los pendientes por fecha de visita; los terminados, del más reciente al más antiguo.
        $rows = in_array($tab, ['assigned', 'in_progress'], true)
            ? $query->orderByRaw('a.starts_at is null')->orderBy('a.starts_at')->orderBy('p.id')
            : $query->orderByDesc(DB::raw('coalesce(p.completed_at, p.updated_at)'))->orderByDesc('p.id');

        return [
            'items' => $this->present($rows->forPage($page, $perPage)->get($this->columns())),
            'counts' => collect(self::TABS)->mapWithKeys(fn (string $key) => [$key => (int) ($counts[$key] ?? 0)])->all(),
            'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'last_page' => max(1, (int) ceil($total / $perPage))],
        ];
    }

    public function detail(int $technicianId, int $requestId): array
    {
        $row = $this->base($technicianId, '')->where('p.request_id', $requestId)->first([...$this->columns(), 'r.description']);
        abort_unless($row, 404);

        return $this->present(collect([$row]))[0] + ['description' => $row->description];
    }

    /** Citas confirmadas de la semana (lunes a domingo, hora de Lima) que empieza en $monday. */
    public function agenda(int $technicianId, CarbonImmutable $monday): array
    {
        $from = $monday->startOfDay()->utc();
        $to = $monday->startOfDay()->addWeek()->utc();
        $visits = DB::table('appointments as a')->join('participations as p', 'p.id', '=', 'a.participation_id')
            ->join('service_requests as r', 'r.id', '=', 'a.request_id')->join('subcategories as s', 's.id', '=', 'r.subcategory_id')
            ->join('specialties as e', 'e.id', '=', 's.specialty_id')->join('districts as d', 'd.id', '=', 'r.district_id')
            ->where('a.technician_id', $technicianId)->where('a.status', 'confirmed')->where('a.starts_at', '>=', $from)->where('a.starts_at', '<', $to)
            ->orderBy('a.starts_at')->get(['a.request_id', 'a.starts_at', 'a.ends_at', 'p.status', 's.name as subcategory', 'e.name as specialty', 'd.name as district'])
            ->map(function (object $row) {
                $start = CarbonImmutable::parse($row->starts_at, 'UTC');

                return ['request_id' => (int) $row->request_id, 'date' => $start->setTimezone(TechnicianHome::TIMEZONE)->toDateString(),
                    'slot' => TechnicianHome::slot($start), 'starts_at' => $start->toISOString(),
                    'ends_at' => CarbonImmutable::parse($row->ends_at, 'UTC')->toISOString(), 'status' => $row->status,
                    'specialty' => $row->specialty, 'subcategory' => $row->subcategory, 'district' => $row->district];
            })->values()->all();

        return ['week_start' => $monday->toDateString(), 'week_end' => $monday->addDays(6)->toDateString(), 'visits' => $visits];
    }

    private function base(int $technicianId, string $search): Builder
    {
        return DB::table('participations as p')->join('service_requests as r', 'r.id', '=', 'p.request_id')
            ->join('subcategories as s', 's.id', '=', 'r.subcategory_id')->join('specialties as e', 'e.id', '=', 's.specialty_id')
            ->join('districts as d', 'd.id', '=', 'r.district_id')
            ->leftJoin('appointments as a', fn ($join) => $join->on('a.participation_id', '=', 'p.id'))
            ->leftJoin('offers as o', 'o.id', '=', 'p.offer_id')
            ->where('p.technician_id', $technicianId)
            ->when($search !== '', function (Builder $query) use ($search) {
                $like = '%'.addcslashes($search, '%_\\').'%';
                $query->where(fn (Builder $q) => $q->where('s.name', 'like', $like)->orWhere('e.name', 'like', $like)->orWhere('d.name', 'like', $like)
                    ->when(ctype_digit(ltrim($search, '#')), fn (Builder $inner) => $inner->orWhere('r.id', (int) ltrim($search, '#'))));
            });
    }

    private function columns(): array
    {
        return ['p.id', 'p.request_id', 'p.status', 'p.assigned_at', 'p.started_at', 'p.completed_at', 'p.updated_at', 'p.reference_fee_snapshot',
            'p.currency', 'r.address', 'r.subcategory_id', 'r.order_id', 'e.id as specialty_id', 'e.name as specialty', 'd.id as district_id', 'd.name as district',
            'a.starts_at', 'a.ends_at', 'o.responded_at'];
    }

    private function present(Collection $rows): array
    {
        $names = RequestSubcategories::named($rows->map(fn (object $row) => (object) ['id' => $row->request_id,
            'subcategory_id' => $row->subcategory_id, 'order_id' => $row->order_id]));
        $iso = fn (?string $value) => $value === null ? null : CarbonImmutable::parse($value, 'UTC')->toISOString();

        return $rows->map(function (object $row) use ($names, $iso) {
            $timeline = array_values(array_filter([
                ['code' => 'accepted', 'label' => 'Aceptaste la oferta', 'at' => $iso($row->responded_at)],
                ['code' => 'assigned', 'label' => 'El cliente te eligió', 'at' => $iso($row->assigned_at)],
                $row->started_at ? ['code' => 'started', 'label' => 'Empezaste el trabajo', 'at' => $iso($row->started_at)] : null,
                $row->completed_at ? ['code' => 'completed', 'label' => 'Trabajo completado', 'at' => $iso($row->completed_at)] : null,
                $row->status === 'cancelled' ? ['code' => 'cancelled', 'label' => 'Trabajo cancelado', 'at' => $iso($row->updated_at)] : null,
            ]));

            return [
                'request_id' => (int) $row->request_id, 'status' => $row->status,
                'specialty' => ['id' => (int) $row->specialty_id, 'name' => $row->specialty],
                'subcategories' => $names[(int) $row->request_id] ?? [],
                'district' => ['id' => (int) $row->district_id, 'name' => $row->district],
                'starts_at' => $iso($row->starts_at), 'ends_at' => $iso($row->ends_at),
                'slot' => $row->starts_at ? TechnicianHome::slot(CarbonImmutable::parse($row->starts_at, 'UTC')) : null,
                'reference_fee' => ['amount' => $row->reference_fee_snapshot, 'currency' => $row->currency, 'is_reference' => true],
                // SEC-S04-05: la dirección exacta solo cuando el trabajo es de este técnico y sigue vigente o terminó.
                'address' => in_array($row->status, self::WITH_ADDRESS, true) ? $row->address : null,
                'timeline' => $timeline,
            ];
        })->values()->all();
    }
}
