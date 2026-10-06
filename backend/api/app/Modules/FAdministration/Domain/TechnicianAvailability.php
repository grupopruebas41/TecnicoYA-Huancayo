<?php

namespace App\Modules\FAdministration\Domain;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Consulta de disponibilidad declarada para el filtro de elegibilidad (RN-05; integración con matching en S4).
 * Intervalo de pausa [starts_at, ends_at): pausado desde el inicio y disponible exactamente al terminar.
 */
final class TechnicianAvailability
{
    public function isPausedAt(int $technicianId, CarbonInterface $at): bool
    {
        $moment = $at->copy()->utc();

        return DB::table('technician_pauses')
            ->where('technician_id', $technicianId)
            ->whereNull('cancelled_at')
            ->where('starts_at', '<=', $moment)
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $moment))
            ->exists();
    }
}
