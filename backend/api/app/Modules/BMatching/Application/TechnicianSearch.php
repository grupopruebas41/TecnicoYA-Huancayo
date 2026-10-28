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
 */
final class TechnicianSearch
{
    public const DEFAULT_PER_PAGE = 12;

    public function search(array $filters, ?int $origin = null): array
    {
        $query = $this->eligible($filters);
        $total = (clone $query)->count();
        $perPage = (int) ($filters['per_page'] ?? self::DEFAULT_PER_PAGE);
        $page = (int) ($filters['page'] ?? 1);
        $columns = ['t.id', 't.display_name', 't.provider_type', 't.experience_years'];
        if ($origin !== null) {
            $query->leftJoin('district_distances as dd', fn (JoinClause $join) => $join
                ->where(fn (JoinClause $pair) => $pair->whereColumn('dd.from_district_id', 't.base_district_id')->where('dd.to_district_id', $origin))
                ->orWhere(fn (JoinClause $pair) => $pair->where('dd.from_district_id', $origin)->whereColumn('dd.to_district_id', 't.base_district_id')))
                ->orderByRaw('CASE WHEN t.base_district_id = ? THEN 0 WHEN dd.km IS NOT NULL THEN 1 ELSE 2 END', [$origin])
                ->orderBy('dd.km');
            $columns = [...$columns, 't.base_district_id', 'dd.km'];
        }
        $rows = $query->orderBy('t.display_name')->orderBy('t.id')->forPage($page, $perPage)->get($columns);

        return [
            'items' => $this->cards($rows->all(), $origin),
            'pagination' => ['page' => $page, 'per_page' => $perPage, 'total' => $total, 'last_page' => max(1, (int) ceil($total / $perPage))],
        ];
    }

    /** Técnico activo y verificado, con cuenta habilitada, sin pausa vigente (D-57) y un servicio que cumpla los filtros. */
    private function eligible(array $filters): Builder
    {
        $now = now();

        return DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')
            ->where('t.status', 'active')->where('t.verification_status', 'approved')
            ->where('u.is_active', true)->whereNull('u.anonymized_at')
            ->whereExists(fn (Builder $q) => $q->from('technician_services as s')
                ->join('subcategories as c', 'c.id', '=', 's.subcategory_id')->join('specialties as p', 'p.id', '=', 'c.specialty_id')
                ->whereColumn('s.technician_id', 't.id')->where('s.active', 1)->where('c.active', 1)->where('p.active', 1)
                ->when(isset($filters['subcategory_id']), fn (Builder $q) => $q->where('c.id', $filters['subcategory_id']))
                ->when(isset($filters['specialty_id']), fn (Builder $q) => $q->where('p.id', $filters['specialty_id']))
                // D-88: la tarifa máxima se aplica al mismo servicio que cumple los demás filtros.
                ->when(isset($filters['max_fee']), fn (Builder $q) => $q->where('s.reference_fee', '<=', $filters['max_fee'])))
            ->when(isset($filters['district_id']), fn (Builder $q) => $q->whereExists(fn (Builder $d) => $d->from('technician_districts as d')
                ->whereColumn('d.technician_id', 't.id')->where('d.active', 1)->where('d.district_id', $filters['district_id'])))
            ->whereNotExists(fn (Builder $q) => $q->from('technician_pauses as z')->whereColumn('z.technician_id', 't.id')
                ->whereNull('z.cancelled_at')->where('z.starts_at', '<=', $now)
                ->where(fn (Builder $end) => $end->whereNull('z.ends_at')->orWhere('z.ends_at', '>', $now)))
            // D-18: sin calificaciones no se pasa un mínimo. Hasta el Sprint 6 no existen calificaciones vigentes.
            ->when(isset($filters['min_rating']), fn (Builder $q) => $q->whereRaw('1 = 0'));
    }

    private function cards(array $rows, ?int $origin): array
    {
        $ids = array_column($rows, 'id');
        $services = DB::table('technician_services as s')->join('subcategories as c', 'c.id', '=', 's.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 'c.specialty_id')
            ->whereIn('s.technician_id', $ids)->where('s.active', 1)->where('c.active', 1)->where('p.active', 1)
            ->orderBy('c.display_order')->get(['s.technician_id', 's.subcategory_id', 'c.name as subcategory_name', 's.reference_fee', 's.currency'])
            ->groupBy('technician_id');
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
            'rating' => ['average' => null, 'count' => 0],
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
