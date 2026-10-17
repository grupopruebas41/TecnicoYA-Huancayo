<?php

namespace App\Modules\BMatching\Application;

use Illuminate\Support\Facades\DB;

/**
 * Historial de los candidatos para H y el tiempo estimado (D-20, D-69):
 * - con menos de N servicios finalizados el técnico es nuevo; con N o más y sin reseñas, «no_reviews». En los dos
 *   casos H es neutro. Las calificaciones vigentes llegan en el Sprint 6 (D-18), así que aún no hay promedio;
 * - el tiempo estimado es la mediana, en minutos enteros, de completed_at − started_at de las participaciones
 *   finalizadas en la misma subcategoría, con un mínimo de N; si no, «Nuevo, sin estimación».
 */
final class TechnicianHistory
{
    /** @var array<int, int> */
    private array $completed;

    /** @var array<int, int[]> */
    private array $durations = [];

    public function __construct(array $technicianIds, int $subcategoryId, private readonly int $threshold)
    {
        $rows = DB::table('participations as p')->join('service_requests as r', 'r.id', '=', 'p.request_id')
            ->whereIn('p.technician_id', $technicianIds)->where('p.status', 'completed')
            ->get(['p.technician_id', 'r.subcategory_id', 'p.started_at', 'p.completed_at']);
        $this->completed = $rows->countBy('technician_id')->all();
        foreach ($rows as $row) {
            if ((int) $row->subcategory_id === $subcategoryId && $row->started_at !== null && $row->completed_at !== null) {
                $this->durations[$row->technician_id][] = (int) round((strtotime($row->completed_at) - strtotime($row->started_at)) / 60);
            }
        }
    }

    public function snapshot(int $technicianId): array
    {
        $completed = $this->completed[$technicianId] ?? 0;

        return [
            'history' => $completed >= $this->threshold ? 'no_reviews' : 'new',
            'completed_services' => $completed,
            'average' => null,
            'estimate' => ['status' => $this->median($technicianId) === null ? 'new' : 'estimated', 'minutes' => $this->median($technicianId)],
        ];
    }

    private function median(int $technicianId): ?int
    {
        $values = $this->durations[$technicianId] ?? [];
        if (count($values) < $this->threshold) {
            return null;
        }
        sort($values);
        $middle = intdiv(count($values), 2);

        return count($values) % 2 === 1 ? $values[$middle] : (int) round(($values[$middle - 1] + $values[$middle]) / 2);
    }
}
