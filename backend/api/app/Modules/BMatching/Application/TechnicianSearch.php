<?php

namespace App\Modules\BMatching\Application;

use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\DB;

/**
 * Búsqueda de técnicos por filtros (RF-C06, HU-S03-04). No es el matching: no puntúa ni ordena por
 * idoneidad (RT-02); ordena por nombre visible e id. Proyección pública por lista blanca (SEC-S03-02).
 * D-88 (BUSQ-01): con un origen, ordena por cercanía sin puntaje: primero el mismo distrito base, luego los km de la
 * matriz (D-64) y al final los que no tienen distrito base o par en la matriz; cada tarjeta suma la distancia.
 * D-101 (propuesta, Fase 3): también por precio (la tarifa más baja de los servicios que cumplen el filtro) y por
 * experiencia; «Disponible hoy» con las franjas reales; la tarjeta trae verificado, especialidades, favorito del cliente
 * de la sesión y el resumen de las reseñas de ejemplo, que nunca son calificaciones (D-18).
 */
final class TechnicianSearch
{
    public const DEFAULT_PER_PAGE = 12;

    public const COLUMNS = ['t.id', 't.display_name', 't.provider_type', 't.experience_years'];

    public function search(array $filters, ?int $origin = null, ?int $clientUserId = null): array
    {
        $query = $this->eligible($filters);
        $total = (clone $query)->count();
        $perPage = (int) ($filters['per_page'] ?? self::DEFAULT_PER_PAGE);
        $page = (int) ($filters['page'] ?? 1);
        $sort = $filters['sort'] ?? 'name';
        $columns = self::COLUMNS;
        if ($origin !== null) {
            $query->leftJoin('district_distances as dd', fn (JoinClause $join) => $join
                ->where(fn (JoinClause $pair) => $pair->whereColumn('dd.from_district_id', 't.base_district_id')->where('dd.to_district_id', $origin))
                ->orWhere(fn (JoinClause $pair) => $pair->where('dd.from_district_id', $origin)->whereColumn('dd.to_district_id', 't.base_district_id')))
                ->when($sort === 'proximity', fn (Builder $q) => $q
                    ->orderByRaw('CASE WHEN t.base_district_id = ? THEN 0 WHEN dd.km IS NOT NULL THEN 1 ELSE 2 END', [$origin])
                    ->orderBy('dd.km'));
            $columns = [...$columns, 't.base_district_id', 'dd.km'];
        }
        $query->select($columns);
        if ($sort === 'price') {
            $query->selectSub($this->services($filters)->whereColumn('s.technician_id', 't.id')->selectRaw('MIN(s.reference_fee)'), 'min_fee')
                ->orderBy('min_fee');
        }
        if ($sort === 'experience') {
            $query->orderByDesc('t.experience_years');
        }
        $rows = $query->orderBy('t.display_name')->orderBy('t.id')->forPage($page, $perPage)->get();

        return [
            'items' => $this->cards($rows->all(), $origin, $clientUserId),
            'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'last_page' => max(1, (int) ceil($total / $perPage))],
        ];
    }

    /** D-101: favoritos del cliente, del último guardado al primero; incluye a los que están en pausa para poder quitarlos. */
    public function favorites(int $clientUserId): array
    {
        $rows = $this->eligible([], false)->join('client_favorite_technicians as f', 'f.technician_id', '=', 't.id')
            ->where('f.client_user_id', $clientUserId)->orderByDesc('f.created_at')->orderBy('t.id')->get(self::COLUMNS);

        return ['items' => $this->cards($rows->all(), null, $clientUserId)];
    }

    /** D-101: técnico que un cliente puede guardar como favorito (activo, verificado y con la cuenta habilitada). */
    public function canBeFavorite(int $technicianId): bool
    {
        return $this->eligible([], false)->where('t.id', $technicianId)->exists();
    }

    /** Inicio del cliente: técnicos elegibles que atienden el distrito (los mismos que la búsqueda filtrada por zona). */
    public function countInDistrict(int $districtId): int
    {
        return $this->eligible(['district_id' => $districtId])->count();
    }

    /**
     * Inicio del cliente: tarifa vigente más baja por especialidad entre técnicos elegibles, en una sola consulta.
     * Las especialidades sin técnicos con tarifa no aparecen.
     */
    public function pricesBySpecialty(): array
    {
        return DB::table('technician_services as s')->join('subcategories as c', 'c.id', '=', 's.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 'c.specialty_id')
            ->where('s.active', 1)->where('c.active', 1)->where('p.active', 1)
            ->whereIn('s.technician_id', $this->eligible([])->select('t.id'))
            ->groupBy('p.id', 'p.name', 'p.display_order')->orderBy('p.display_order')->orderBy('p.id')
            ->get(['p.id', 'p.name', DB::raw('MIN(s.reference_fee) as from_fee'), DB::raw('MIN(s.currency) as currency')])
            ->map(fn (object $row) => ['specialty_id' => (int) $row->id, 'name' => $row->name,
                'from_fee' => number_format((float) $row->from_fee, 2, '.', ''), 'currency' => $row->currency])->all();
    }

    /** Servicios activos que cumplen los filtros. D-88: la tarifa máxima se aplica al mismo servicio que cumple los demás. */
    private function services(array $filters): Builder
    {
        return DB::table('technician_services as s')
            ->join('subcategories as c', 'c.id', '=', 's.subcategory_id')->join('specialties as p', 'p.id', '=', 'c.specialty_id')
            ->where('s.active', 1)->where('c.active', 1)->where('p.active', 1)
            ->when(isset($filters['subcategory_id']), fn (Builder $q) => $q->where('c.id', $filters['subcategory_id']))
            ->when(isset($filters['specialty_id']), fn (Builder $q) => $q->where('p.id', $filters['specialty_id']))
            ->when(isset($filters['max_fee']), fn (Builder $q) => $q->where('s.reference_fee', '<=', $filters['max_fee']));
    }

    /**
     * Técnico activo y verificado, con cuenta habilitada, sin pausa vigente (D-57) y un servicio que cumpla los filtros.
     * Los favoritos se listan aunque el técnico esté en pausa ($withoutPause = false).
     */
    private function eligible(array $filters, bool $withoutPause = true): Builder
    {
        $now = now();

        return DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')
            ->where('t.status', 'active')->where('t.verification_status', 'approved')
            ->where('u.is_active', true)->whereNull('u.anonymized_at')
            ->whereExists($this->services($filters)->whereColumn('s.technician_id', 't.id'))
            ->when(! empty($filters['available_today']), fn (Builder $q) => $q->whereExists(AvailableToday::slots($now)->whereColumn('a.technician_id', 't.id')))
            ->when(isset($filters['district_id']), fn (Builder $q) => $q->whereExists(fn (Builder $d) => $d->from('technician_districts as d')
                ->whereColumn('d.technician_id', 't.id')->where('d.active', 1)->where('d.district_id', $filters['district_id'])))
            ->when($withoutPause, fn (Builder $q) => $q->whereNotExists(fn (Builder $p) => $p->from('technician_pauses as z')
                ->whereColumn('z.technician_id', 't.id')->whereNull('z.cancelled_at')->where('z.starts_at', '<=', $now)
                ->where(fn (Builder $end) => $end->whereNull('z.ends_at')->orWhere('z.ends_at', '>', $now))))
            // D-18: sin calificaciones no se pasa un mínimo. Hasta el Sprint 6 no existen calificaciones vigentes.
            ->when(isset($filters['min_rating']), fn (Builder $q) => $q->whereRaw('1 = 0'));
    }

    private function cards(array $rows, ?int $origin, ?int $clientUserId = null): array
    {
        $ids = array_column($rows, 'id');
        $services = DB::table('technician_services as s')->join('subcategories as c', 'c.id', '=', 's.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 'c.specialty_id')
            ->whereIn('s.technician_id', $ids)->where('s.active', 1)->where('c.active', 1)->where('p.active', 1)
            ->orderBy('p.display_order')->orderBy('c.display_order')
            ->get(['s.technician_id', 's.subcategory_id', 'c.name as subcategory_name', 's.reference_fee', 's.currency',
                'p.id as specialty_id', 'p.name as specialty_name'])
            ->groupBy('technician_id');
        $favorites = $clientUserId === null ? [] : DB::table('client_favorite_technicians')->where('client_user_id', $clientUserId)
            ->whereIn('technician_id', $ids)->pluck('technician_id')->map(fn ($id) => (int) $id)->all();
        $samples = SampleReviews::summaries($ids);
        $districts = DB::table('technician_districts as d')->join('districts as x', 'x.id', '=', 'd.district_id')
            ->whereIn('d.technician_id', $ids)->where('d.active', 1)->where('x.active', 1)
            ->orderBy('x.name')->get(['d.technician_id', 'x.id', 'x.name'])->groupBy('technician_id');

        return array_map(fn (object $row) => [
            'id' => $row->id, 'display_name' => $row->display_name, 'provider_type' => $row->provider_type,
            'experience_years' => (int) $row->experience_years,
            'services' => $services->get($row->id, collect())->map(fn (object $s) => [
                'subcategory_id' => $s->subcategory_id, 'subcategory_name' => $s->subcategory_name,
                'reference_fee' => $s->reference_fee, 'currency' => $s->currency,
            ])->values()->all(),
            'districts' => $districts->get($row->id, collect())->map(fn (object $d) => ['id' => $d->id, 'name' => $d->name])->values()->all(),
            'specialties' => $services->get($row->id, collect())->unique('specialty_id')
                ->map(fn (object $s) => ['id' => (int) $s->specialty_id, 'name' => $s->specialty_name])->values()->all(),
            'verified' => true,
            'favorite' => in_array((int) $row->id, $favorites, true),
            'rating' => ['average' => null, 'count' => 0],
            'sample_rating' => $samples[(int) $row->id] ?? null,
        ] + ($origin === null ? [] : ['distance' => $this->distance($row, $origin)]), $rows);
    }

    /** Distancia por zona (D-64): nunca revela el distrito base, solo los km y si coincide con el origen. */
    private function distance(object $row, int $origin): ?array
    {
        if ($row->km === null) {
            return null;
        }

        return ['km' => (float) $row->km, 'same_district' => (int) $row->base_district_id === $origin,
            'approximate' => true, 'label' => 'aproximada por zona'];
    }
}
