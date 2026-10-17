<?php

namespace App\Modules\BMatching\Application;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Elegibilidad de RN-05 (contrato S4 §3.1): el técnico queda excluido con el código del primer filtro que falla.
 * Carga todo por lotes (siete consultas sin importar cuántos técnicos haya) para cumplir RNF-01.
 * - Pausa vigente: [starts_at, ends_at) en el instante del matching (D-21, D-57).
 * - Franja: la programada debe caber en una franja activa; en una inmediata, el instante actual (supuesto de D-71).
 * - Citas: en una programada, solape con la franja; en una inmediata, solape con [ahora, ahora + 2 h) (D-23).
 */
final class Eligibility
{
    public const TIMEZONE = 'America/Lima';

    /**
     * @param  int[]|null  $onlyTechnicianIds  null evalúa a todos los técnicos
     * @return array<int, array{code: ?string, technician: object, service: ?object}> por id de técnico
     */
    public function evaluate(object $request, ?array $onlyTechnicianIds = null): array
    {
        $now = CarbonImmutable::now();
        [$from, $to] = $this->window($request, $now);
        $technicians = DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')
            ->when($onlyTechnicianIds !== null, fn ($q) => $q->whereIn('t.id', $onlyTechnicianIds))
            ->get(['t.id', 't.user_id', 't.status', 't.verification_status', 't.verified_at', 't.base_district_id',
                't.display_name', 't.provider_type', 'u.is_active', 'u.anonymized_at'])->keyBy('id');
        $ids = $technicians->keys()->all();
        $services = DB::table('technician_services')->whereIn('technician_id', $ids)
            ->where('subcategory_id', $request->subcategory_id)->where('active', 1)->get()->keyBy('technician_id');
        $covered = DB::table('technician_districts')->whereIn('technician_id', $ids)
            ->where('district_id', $request->district_id)->where('active', 1)->pluck('technician_id')->flip();
        $paused = DB::table('technician_pauses')->whereIn('technician_id', $ids)->whereNull('cancelled_at')
            ->where('starts_at', '<=', $now)->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->pluck('technician_id')->flip();
        $slots = DB::table('availability_slots')->whereIn('technician_id', $ids)->where('active', 1)->get()->groupBy('technician_id');
        $busy = DB::table('appointments')->whereIn('technician_id', $ids)->where('status', 'confirmed')
            ->where('starts_at', '<', $to)->where('ends_at', '>', $from)->pluck('technician_id')->flip();

        $result = [];
        foreach ($technicians as $id => $technician) {
            $result[$id] = ['technician' => $technician, 'service' => $services->get($id), 'code' => match (true) {
                $technician->status === 'suspended' => 'technician_suspended',
                $technician->status !== 'active' => 'not_active',
                $technician->verification_status !== 'approved' => 'not_verified',
                ! $technician->is_active || $technician->anonymized_at !== null => 'account_disabled',
                ! $services->has($id) => 'service_not_offered',
                ! $covered->has($id) => 'district_not_covered',
                $paused->has($id) => 'paused',
                ! $this->fitsAvailability($slots->get($id, collect()), $request, $from, $to) => 'outside_availability',
                $busy->has($id) => $request->mode === 'scheduled' ? 'schedule_conflict' : 'appointment_within_2h',
                default => null,
            }];
        }

        return $result;
    }

    /** Código de exclusión de un técnico para la solicitud (null si sigue elegible). */
    public function codeFor(object $request, int $technicianId): ?string
    {
        $evaluation = $this->evaluate($request, [$technicianId]);

        return array_key_exists($technicianId, $evaluation) ? $evaluation[$technicianId]['code'] : 'not_active';
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable} intervalo [desde, hasta) que la cita no debe solapar */
    private function window(object $request, CarbonImmutable $now): array
    {
        return $request->mode === 'scheduled'
            ? [CarbonImmutable::parse($request->preferred_start_at, 'UTC'), CarbonImmutable::parse($request->preferred_end_at, 'UTC')]
            : [$now, $now->addHours(2)];
    }

    private function fitsAvailability(Collection $slots, object $request, CarbonImmutable $from, CarbonImmutable $to): bool
    {
        // En una inmediata basta el instante actual; en una programada, toda la franja pedida.
        $end = $request->mode === 'scheduled' ? $to : $from;

        return $slots->contains(fn (object $slot) => $slot->kind === 'one_off'
            ? CarbonImmutable::parse($slot->starts_at, 'UTC')->lte($from) && ($request->mode === 'scheduled'
                ? CarbonImmutable::parse($slot->ends_at, 'UTC')->gte($end) : CarbonImmutable::parse($slot->ends_at, 'UTC')->gt($end))
            : $this->fitsWeekly($slot, $request, $from, $end));
    }

    private function fitsWeekly(object $slot, object $request, CarbonImmutable $from, CarbonImmutable $end): bool
    {
        $timezone = $slot->timezone ?: self::TIMEZONE;
        $start = $from->setTimezone($timezone);
        $finish = $end->setTimezone($timezone);
        $date = $start->toDateString();
        if ((int) $slot->weekday !== $start->dayOfWeekIso || $slot->valid_from > $date
            || ($slot->valid_until !== null && $slot->valid_until < $date)) {
            return false;
        }
        $begins = $start->format('H:i:s');
        if ($request->mode !== 'scheduled') {
            return $slot->local_start <= $begins && $begins < $slot->local_end;
        }

        return $finish->toDateString() === $date && $slot->local_start <= $begins && $finish->format('H:i:s') <= $slot->local_end;
    }
}
