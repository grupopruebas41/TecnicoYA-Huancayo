<?php

namespace App\Modules\FAdministration\Application;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Panel del técnico, Fase T4 (D-104 b): estadísticas de desempeño con los datos reales del propio técnico.
 * - Período «week»: las 8 semanas que terminan en la actual (lunes a domingo, hora de Lima); «month»: los 6 meses que
 *   terminan en el actual.
 * - Cada oferta cuenta en el período en que se publicó (`available_at`); cada trabajo completado, en el que terminó.
 * - Tasa de aceptación = aceptadas ÷ (aceptadas + rechazadas + vencidas), como el Inicio (D-109); null sin ofertas.
 * - Tiempo medio de respuesta = promedio de `responded_at − available_at` de las aceptadas y rechazadas, en segundos.
 * Las pendientes todavía no cuentan. Se agrupa en PHP para que valga igual en MySQL y en SQLite.
 */
final class TechnicianStats
{
    public const PERIODS = ['week' => 8, 'month' => 6];

    private const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

    public function for(int $technicianId, string $period): array
    {
        $now = CarbonImmutable::now(TechnicianHome::TIMEZONE);
        $count = self::PERIODS[$period];
        $first = $period === 'week'
            ? $now->startOfWeek(CarbonImmutable::MONDAY)->subWeeks($count - 1)
            : $now->startOfMonth()->subMonths($count - 1);
        $buckets = [];
        for ($index = 0; $index < $count; $index++) {
            $start = $period === 'week' ? $first->addWeeks($index) : $first->addMonths($index);
            $key = $this->key($start, $period);
            $buckets[$key] = ['key' => $key, 'label' => $this->label($start, $period), 'start' => $start->toDateString(),
                'accepted' => 0, 'rejected' => 0, 'expired' => 0, 'completed' => 0, 'responses' => []];
        }
        $from = $first->utc();

        $offers = DB::table('offers')->where('technician_id', $technicianId)->where('available_at', '>=', $from)
            ->whereIn('status', ['accepted', 'rejected', 'expired'])->get(['status', 'available_at', 'responded_at']);
        foreach ($offers as $offer) {
            $available = CarbonImmutable::parse($offer->available_at, 'UTC');
            $key = $this->key($available->setTimezone(TechnicianHome::TIMEZONE), $period);
            if (! isset($buckets[$key])) {
                continue;
            }
            $buckets[$key][$offer->status]++;
            if ($offer->status !== 'expired' && $offer->responded_at !== null) {
                $buckets[$key]['responses'][] = $available->diffInSeconds(CarbonImmutable::parse($offer->responded_at, 'UTC'), true);
            }
        }
        $completed = DB::table('participations')->where('technician_id', $technicianId)->where('status', 'completed')
            ->whereNotNull('completed_at')->where('completed_at', '>=', $from)->pluck('completed_at');
        foreach ($completed as $at) {
            $key = $this->key(CarbonImmutable::parse($at, 'UTC')->setTimezone(TechnicianHome::TIMEZONE), $period);
            if (isset($buckets[$key])) {
                $buckets[$key]['completed']++;
            }
        }

        $totals = ['accepted' => 0, 'rejected' => 0, 'expired' => 0, 'completed' => 0, 'responses' => []];
        foreach ($buckets as $bucket) {
            foreach (['accepted', 'rejected', 'expired', 'completed'] as $field) {
                $totals[$field] += $bucket[$field];
            }
            $totals['responses'] = [...$totals['responses'], ...$bucket['responses']];
        }

        return [
            'period' => $period,
            'buckets' => array_values(array_map(fn (array $bucket) => $this->summary($bucket), $buckets)),
            'totals' => $this->summary($totals),
            'generated_at' => $now->utc()->toISOString(),
        ];
    }

    private function summary(array $bucket): array
    {
        $closed = $bucket['accepted'] + $bucket['rejected'] + $bucket['expired'];
        $responses = $bucket['responses'];
        unset($bucket['responses']);

        return $bucket + [
            'acceptance_rate' => $closed > 0 ? (int) round($bucket['accepted'] / $closed * 100) : null,
            'avg_response_seconds' => $responses === [] ? null : (int) round(array_sum($responses) / count($responses)),
        ];
    }

    private function key(CarbonImmutable $local, string $period): string
    {
        return $period === 'week' ? $local->startOfWeek(CarbonImmutable::MONDAY)->toDateString() : $local->format('Y-m');
    }

    /** Rótulo corto en español: «9 nov» para la semana que empieza ese lunes, «nov 2026» para el mes. */
    private function label(CarbonImmutable $start, string $period): string
    {
        $month = self::MONTHS[$start->month - 1];

        return $period === 'week' ? $start->day.' '.$month : $month.' '.$start->year;
    }
}
