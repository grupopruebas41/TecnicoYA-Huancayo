<?php

namespace Database\Seeders;

use App\Modules\BMatching\Application\Matcher;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Panel del administrador, Fase A2 (solo DemoSeeder, APP_ENV=local): datos para que el Inicio tenga contenido en cada
 * parte, todos sintéticos y rotulados «(demostración)». Sobre la cuenta demo-operacion deja:
 * - una solicitud enviada hace 45 minutos sin técnico, con 2 rondas vencidas (alerta y tarea);
 * - una enviada hace 8 minutos (buscando técnico, de hoy), con una ronda abierta y dos ofertas pendientes (Fase A3);
 * - una en el pendiente de 24 h a la que le quedan 90 minutos;
 * - el historial de demo-tecnico-ocupado en los últimos 5 días: 1 aceptada, 1 rechazada y 3 vencidas (desempeño bajo);
 * y además dos búsquedas sin resultado recientes y 10 entradas de auditoría de demo-admin (source_code demo-seeder).
 * Cada siembra borra lo suyo y lo vuelve a crear con el reloj de ese momento.
 */
final class DemoAdminOperations
{
    public const SOURCE = 'demo-seeder';

    private const SUBCATEGORY = 'electricidad-residencial';

    /** [días atrás, estado de la oferta, estado de la solicitud] */
    private const HISTORY = [
        [1, 'accepted', 'completed'], [2, 'rejected', 'cancelled'], [3, 'expired', 'expired'], [4, 'expired', 'expired'], [5, 'expired', 'expired'],
    ];

    /** [acción, tipo de sujeto, motivo] de la actividad reciente de demostración. */
    private const AUDIT = [
        ['technician.reviewed', 'technician', 'Documentos revisados (demostración).'],
        ['announcement.published', 'announcement', 'Campaña de mantenimiento preventivo (demostración).'],
        ['user.updated', 'user', 'Teléfono corregido a pedido del cliente (demostración).'],
        ['announcement.created', 'announcement', 'Borrador del aviso de feriado (demostración).'],
        ['user.activation_sent', 'user', 'El técnico no recibió el enlace (demostración).'],
        ['technician.suspended', 'technician', 'Ofertas vencidas repetidas; se le avisó (demostración).'],
        ['technician.reactivated', 'technician', 'Confirmó su disponibilidad (demostración).'],
        ['announcement.reordered', 'announcement', 'Orden del carrusel de diciembre (demostración).'],
        ['user.blocked', 'user', 'Cuenta de prueba duplicada (demostración).'],
        ['user.unblocked', 'user', 'Duplicado resuelto (demostración).'],
    ];

    public function run(int $adminId, int $clientId, int $busyTechnicianId, int $otherTechnicianId): void
    {
        $this->reset($clientId);
        $now = CarbonImmutable::now();
        $rule = app(RuleBook::class)->currentVersionId();
        $district = (int) DB::table('districts')->where('code', 'CHILCA')->value('id');
        // La tarifa de referencia es la del servicio del técnico ocupado (la subcategoría puede no tener una propia).
        $service = DB::table('subcategories as c')->join('technician_services as t', 't.subcategory_id', '=', 'c.id')
            ->where('c.code', self::SUBCATEGORY)->where('t.technician_id', $busyTechnicianId)->first(['c.id', 't.reference_fee']);
        $request = fn (int $number, string $status, CarbonImmutable $submitted, array $extra = []) => DB::table('service_requests')->insertGetId($extra + [
            'client_id' => $clientId, 'subcategory_id' => $service->id, 'district_id' => $district,
            'description' => "Operación de demostración #$number: el tomacorriente de la cocina chispea al enchufar.",
            'address' => 'Dirección de demostración '.(700 + $number), 'mode' => 'asap', 'source' => 'automatic', 'status' => $status,
            'reference_fee_snapshot' => $service->reference_fee, 'rule_version_id' => $rule, 'submitted_at' => $submitted,
            'search_generation' => 1, 'version' => 2, 'created_at' => $submitted, 'updated_at' => $submitted,
        ]);

        // Sin técnico hace 45 minutos, con 2 rondas vencidas en la búsqueda vigente.
        $chain = $request(1, 'sent', $now->subMinutes(45));
        $this->round($chain, 1, $busyTechnicianId, 'expired', $now->subMinutes(45), $rule, $service->reference_fee);
        $this->round($chain, 2, $otherTechnicianId, 'expired', $now->subMinutes(30), $rule, $service->reference_fee);
        // Fase A3: buscando ahora, con una ronda abierta y dos ofertas pendientes (cuenta regresiva del emparejamiento en vivo).
        $live = $request(2, 'sent', $now->subMinutes(8));
        $this->openRound($live, [$busyTechnicianId, $otherTechnicianId], $now->subMinutes(1), $rule, $service->reference_fee);
        $expires = $now->addMinutes(90);
        $request(3, 'pending_availability', $now->subHours(23), ['pending_since' => $expires->subDay(), 'pending_expires_at' => $expires]);

        foreach (self::HISTORY as $index => [$days, $offer, $status]) {
            $submitted = $now->subDays($days)->setTime(15, 0);
            $id = $request(10 + $index, $status, $submitted, [
                'closed_at' => match ($status) { 'completed' => $submitted->addHours(5), 'expired' => $submitted->addMinutes(15), default => null },
                'cancelled_at' => $status === 'cancelled' ? $submitted->addHours(3) : null,
                'cancellation_reason_code' => $status === 'cancelled' ? 'solved' : null,
            ]);
            $offerId = $this->round($id, 1, $busyTechnicianId, $offer, $submitted, $rule, $service->reference_fee);
            if ($offer === 'accepted') {
                DB::table('participations')->insert(['request_id' => $id, 'technician_id' => $busyTechnicianId, 'offer_id' => $offerId,
                    'slot' => 'primary', 'status' => 'completed', 'reference_fee_snapshot' => $service->reference_fee, 'currency' => 'PEN',
                    'assigned_at' => $submitted->addMinutes(25), 'started_at' => $submitted->addHours(3), 'completed_at' => $submitted->addHours(5)]);
            }
        }

        foreach ([['terma no calienta el agua', 4, 1], ['puerta de cochera no abre', 2, 2]] as [$query, $count, $days]) {
            DB::table('keyword_misses')->updateOrInsert(['normalized_query' => $query], ['count' => $count, 'last_seen_at' => $now->subDays($days)]);
        }
        $this->audit($adminId, $now);
    }

    /** Ronda cerrada con una sola oferta del técnico, en el estado pedido. Devuelve el id de la oferta. */
    private function round(int $requestId, int $roundNo, int $technicianId, string $status, CarbonImmutable $at, int $rule, string $fee): int
    {
        $run = DB::table('matching_runs')->where('request_id', $requestId)->value('id') ?? DB::table('matching_runs')->insertGetId([
            'request_id' => $requestId, 'search_generation' => 1, 'attempt_no' => 1, 'run_trigger' => 'submission', 'rule_version_id' => $rule,
            'algorithm_version' => Matcher::ALGORITHM, 'status' => 'completed', 'eligible_count' => 2, 'started_at' => $at, 'finished_at' => $at,
        ]);
        $round = DB::table('offer_rounds')->insertGetId([
            'request_id' => $requestId, 'matching_run_id' => $run, 'search_generation' => 1, 'round_no' => $roundNo, 'kind' => 'automatic',
            'status' => 'closed', 'opened_at' => $at, 'expires_at' => $at->addMinutes(10), 'closed_at' => $at->addMinutes(10),
        ]);

        return DB::table('offers')->insertGetId([
            'round_id' => $round, 'request_id' => $requestId, 'technician_id' => $technicianId, 'status' => $status,
            'available_at' => $at, 'expires_at' => $at->addMinutes(10),
            'responded_at' => in_array($status, ['accepted', 'rejected'], true) ? $at->addMinutes(4) : null,
            'reference_fee_snapshot' => $fee, 'currency' => 'PEN', 'version' => 2, 'created_at' => $at, 'updated_at' => $at,
        ]);
    }

    /** Ronda abierta con una oferta pendiente por técnico, que vence 10 minutos después de abrirse. */
    private function openRound(int $requestId, array $technicians, CarbonImmutable $at, int $rule, string $fee): void
    {
        $run = DB::table('matching_runs')->insertGetId([
            'request_id' => $requestId, 'search_generation' => 1, 'attempt_no' => 1, 'run_trigger' => 'submission', 'rule_version_id' => $rule,
            'algorithm_version' => Matcher::ALGORITHM, 'status' => 'completed', 'eligible_count' => count($technicians), 'started_at' => $at, 'finished_at' => $at,
        ]);
        $round = DB::table('offer_rounds')->insertGetId([
            'request_id' => $requestId, 'matching_run_id' => $run, 'search_generation' => 1, 'round_no' => 1, 'kind' => 'automatic',
            'status' => 'open', 'opened_at' => $at, 'expires_at' => $at->addMinutes(10),
        ]);
        foreach ($technicians as $technicianId) {
            DB::table('offers')->insert([
                'round_id' => $round, 'request_id' => $requestId, 'technician_id' => $technicianId, 'status' => 'pending',
                'available_at' => $at, 'expires_at' => $at->addMinutes(10), 'reference_fee_snapshot' => $fee, 'currency' => 'PEN',
                'version' => 1, 'created_at' => $at, 'updated_at' => $at,
            ]);
        }
    }

    /** Actividad reciente de demostración: 10 acciones de demo-admin, la última hace 20 minutos. */
    private function audit(int $adminId, CarbonImmutable $now): void
    {
        DB::table('audit_entries')->where('source_code', self::SOURCE)->delete();
        foreach (self::AUDIT as $index => [$action, $subject, $reason]) {
            DB::table('audit_entries')->insert([
                'actor_id' => $adminId, 'actor_kind' => 'user', 'action' => $action, 'subject_type' => $subject, 'subject_id' => null,
                'reason' => $reason, 'correlation_id' => (string) Str::uuid(), 'occurred_at' => $now->subMinutes(20 + (count(self::AUDIT) - 1 - $index) * 47),
                'source_code' => self::SOURCE,
            ]);
        }
    }

    /** Borra las solicitudes de demo-operacion de una siembra anterior con todo lo que cuelga de ellas. */
    private function reset(int $clientId): void
    {
        $requests = DB::table('service_requests')->where('client_id', $clientId)->pluck('id');
        DB::table('participations')->whereIn('request_id', $requests)->delete();
        DB::table('offers')->whereIn('request_id', $requests)->delete();
        DB::table('offer_rounds')->whereIn('request_id', $requests)->delete();
        DB::table('matching_runs')->whereIn('request_id', $requests)->delete();
        DB::table('request_events')->whereIn('request_id', $requests)->delete();
        DB::table('service_requests')->whereIn('id', $requests)->delete();
    }
}
