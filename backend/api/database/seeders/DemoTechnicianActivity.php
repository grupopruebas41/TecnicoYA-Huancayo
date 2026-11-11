<?php

namespace Database\Seeders;

use App\Modules\BMatching\Application\Matcher;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Panel del técnico, Fase T2 (solo DemoSeeder, APP_ENV=local): historia de demostración de un técnico para ver el
 * Inicio con datos. Crea ofertas aceptadas, una rechazada y dos vencidas; trabajos completados (5, insignia «Primeros 5
 * trabajos»), uno en curso y uno asignado hoy («Mi día»), uno asignado mañana y uno cancelado. Las respuestas rápidas
 * (mediana < 2 min) dan la insignia «Respuesta rápida». Todo es sintético y rotulado «(demostración)»; no se repite si
 * el técnico ya tiene su historia de demostración. La oferta en vivo se crea aparte con `tecnicoya:demo-offer` (D-108).
 */
final class DemoTechnicianActivity
{
    private const TZ = 'America/Lima';

    /** [días desde hoy, hora local, estado de la oferta, segundos para responder, estado del trabajo] */
    private const HISTORY = [
        [-12, '09:00', 'accepted', 45, 'completed'], [-10, '09:00', 'accepted', 60, 'completed'],
        [-8, '10:00', 'accepted', 75, 'completed'], [-5, '09:00', 'accepted', 90, 'completed'],
        [-3, '14:00', 'accepted', 110, 'completed'], [-6, '15:00', 'rejected', 300, null],
        [-4, '10:00', 'expired', null, null], [-1, '16:00', 'expired', null, null],
        [-2, '14:00', 'accepted', 70, 'cancelled'], [0, '09:00', 'accepted', 50, 'in_progress'],
        [0, '15:00', 'accepted', 80, 'assigned'], [1, '10:00', 'accepted', 100, 'assigned'],
    ];

    private const REQUEST_STATUS = ['completed' => 'completed', 'in_progress' => 'in_progress', 'assigned' => 'assigned',
        'cancelled' => 'cancelled', 'rejected' => 'cancelled', 'expired' => 'expired'];

    public function run(int $technicianId, array $clientIds): void
    {
        if (DB::table('service_requests')->where('target_technician_id', $technicianId)->where('description', 'like', 'Trabajo de demostración #%')->exists()) {
            return;
        }
        $service = DB::table('technician_services')->where('technician_id', $technicianId)->where('active', 1)->orderBy('id')->first();
        $districts = DB::table('technician_districts')->where('technician_id', $technicianId)->where('active', 1)->pluck('district_id')->values();
        if (! $service || $districts->isEmpty() || $clientIds === []) {
            return;
        }
        $rule = app(RuleBook::class)->currentVersionId();
        $today = CarbonImmutable::now(self::TZ)->startOfDay();
        foreach (self::HISTORY as $index => [$days, $time, $offerStatus, $seconds, $job]) {
            $start = CarbonImmutable::parse($today->addDays($days)->toDateString().' '.$time, self::TZ)->utc();
            $end = $start->addHours(2);
            $available = $start->subDay();
            $status = self::REQUEST_STATUS[$job ?? $offerStatus];
            $requestId = DB::table('service_requests')->insertGetId([
                'client_id' => $clientIds[$index % count($clientIds)], 'subcategory_id' => $service->subcategory_id,
                'district_id' => $districts[$index % $districts->count()],
                'description' => 'Trabajo de demostración #'.($index + 1).': revisión y mantenimiento del equipo (demostración).',
                'address' => 'Dirección de demostración '.(100 + $index), 'mode' => 'scheduled',
                'preferred_start_at' => $start, 'preferred_end_at' => $end, 'urgency' => 'normal',
                'source' => 'profile', 'target_technician_id' => $technicianId, 'status' => $status,
                'rule_version_id' => $rule, 'submitted_at' => $available, 'search_generation' => 1, 'version' => 3,
                'created_at' => $available, 'updated_at' => $available,
            ]);
            $run = DB::table('matching_runs')->insertGetId([
                'request_id' => $requestId, 'search_generation' => 1, 'attempt_no' => 1, 'run_trigger' => 'submission',
                'rule_version_id' => $rule, 'algorithm_version' => Matcher::ALGORITHM, 'status' => 'completed', 'eligible_count' => 1,
                'started_at' => $available, 'finished_at' => $available,
            ]);
            $round = DB::table('offer_rounds')->insertGetId([
                'request_id' => $requestId, 'matching_run_id' => $run, 'search_generation' => 1, 'round_no' => 1, 'kind' => 'direct',
                'status' => 'closed', 'opened_at' => $available, 'expires_at' => $available->addMinutes(10), 'closed_at' => $available->addMinutes(10),
            ]);
            $offer = DB::table('offers')->insertGetId([
                'round_id' => $round, 'request_id' => $requestId, 'technician_id' => $technicianId, 'status' => $offerStatus,
                'available_at' => $available, 'expires_at' => $available->addMinutes(10),
                'responded_at' => $seconds === null ? null : $available->addSeconds($seconds),
                'reference_fee_snapshot' => $service->reference_fee, 'currency' => 'PEN', 'version' => 2,
            ]);
            if ($job === null) {
                continue;
            }
            $participation = DB::table('participations')->insertGetId([
                'request_id' => $requestId, 'technician_id' => $technicianId, 'offer_id' => $offer, 'slot' => 'primary', 'status' => $job,
                'reference_fee_snapshot' => $service->reference_fee, 'currency' => 'PEN', 'assigned_at' => $available->addMinutes(20),
                'started_at' => in_array($job, ['in_progress', 'completed'], true) ? $start : null,
                'completed_at' => $job === 'completed' ? $end : null,
            ]);
            DB::table('appointments')->insert([
                'request_id' => $requestId, 'participation_id' => $participation, 'technician_id' => $technicianId,
                'starts_at' => $start, 'ends_at' => $end, 'status' => $job === 'cancelled' ? 'cancelled' : 'confirmed',
            ]);
        }
    }
}
