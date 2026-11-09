<?php

namespace App\Modules\BMatching\Application;

use Illuminate\Support\Facades\DB;

/**
 * D-101 (propuesta): reseñas de ejemplo (technician_review_samples) que solo siembra el DemoSeeder en local. Se muestran
 * con la marca «Ejemplo · datos de demostración» y nunca cuentan como calificación: ni el filtro de calificación mínima,
 * ni el orden, ni el matching (H) las leen. Las calificaciones reales llegan en el Sprint 6.
 */
final class SampleReviews
{
    /** Promedio (un decimal) y cantidad por técnico; los técnicos sin reseñas de ejemplo no aparecen. */
    public static function summaries(array $technicianIds): array
    {
        if ($technicianIds === []) {
            return [];
        }

        return DB::table('technician_review_samples')->whereIn('technician_id', $technicianIds)->groupBy('technician_id')
            ->get(['technician_id', DB::raw('AVG(rating) as average'), DB::raw('COUNT(*) as total')])
            ->mapWithKeys(fn (object $row) => [(int) $row->technician_id => [
                'average' => round((float) $row->average, 1), 'count' => (int) $row->total,
            ]])->all();
    }

    /** Resumen del perfil: promedio, cantidad y barras de 5 a 1; null si no hay reseñas de ejemplo. */
    public static function profileSummary(int $technicianId): ?array
    {
        $summary = self::summaries([$technicianId])[$technicianId] ?? null;
        if ($summary === null) {
            return null;
        }
        $counts = DB::table('technician_review_samples')->where('technician_id', $technicianId)->groupBy('rating')
            ->pluck(DB::raw('COUNT(*)'), 'rating');
        $distribution = [];
        foreach ([5, 4, 3, 2, 1] as $stars) {
            $distribution[(string) $stars] = (int) ($counts[$stars] ?? 0);
        }

        return $summary + ['distribution' => $distribution];
    }

    /** Reseñas de ejemplo, de la más reciente a la más antigua. */
    public static function list(int $technicianId, int $limit = 20): array
    {
        return DB::table('technician_review_samples')->where('technician_id', $technicianId)
            ->orderByDesc('reviewed_on')->orderByDesc('id')->limit($limit)
            ->get(['id', 'rating', 'comment', 'author_label', 'reviewed_on'])
            ->map(fn (object $row) => [
                'id' => (int) $row->id, 'rating' => (int) $row->rating, 'comment' => $row->comment,
                'author_label' => $row->author_label, 'reviewed_on' => substr((string) $row->reviewed_on, 0, 10), 'sample' => true,
            ])->all();
    }
}
