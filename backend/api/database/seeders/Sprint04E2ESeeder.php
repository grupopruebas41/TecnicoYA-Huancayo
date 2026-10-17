<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\BMatching\Application\MatchingFlow;
use App\Modules\BMatching\Application\OfferResponses;
use App\Shared\Rules\RuleBook;
use App\Shared\Testing\E2EClock;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Datos E2E del Sprint 4 (contrato S4 §9). Sobre los datos de S1 a S3 deja, generados con el flujo real del matching:
 * - e2e-client-match: solicitud programada (mañana de 15:00 a 17:00 en Lima, Cámaras de frío) en awaiting_choice con
 *   dos aceptaciones (frío y busy) y otra inmediata con ofertas pendientes para frío y busy;
 * - e2e-client-direct: solicitud dirigida a e2e-technician-electro con su oferta pendiente (10 min; serverClock la vence);
 * - e2e-client-pending: solicitud en pending_availability (Puesta a tierra, que nadie ofrece);
 * - e2e-technician-busy: tras aceptar, una cita confirmada de 16:00 a 18:00 del mismo día provoca SCHEDULE_CONFLICT.
 * Las solicitudes del S4 se recrean en cada siembra (los plazos dependen de la hora de la siembra) y el reloj del
 * servidor vuelve a la hora real. Todas las cuentas usan TECNICOYA_E2E_PASSWORD. Datos sintéticos.
 */
final class Sprint04E2ESeeder extends Seeder
{
    private const CLIENTS = ['match', 'direct', 'pending', 'agenda'];

    public function run(MatchingFlow $flow, OfferResponses $responses, RuleBook $rules): void
    {
        E2EDatabaseGuard::ensureIsolated();
        $this->call(Sprint03E2ESeeder::class);
        E2EClock::shift('reset');
        DB::transaction(function () use ($flow, $responses, $rules) {
            $huancayo = (int) DB::table('districts')->where('code', 'HUANCAYO')->value('id');
            $clients = array_combine(self::CLIENTS, array_map(fn (string $suffix) => $this->client($suffix), self::CLIENTS));
            $this->reset(array_values($clients));

            $frio = $this->technician('frio', 'Técnico E2E de refrigeración', 'frio-camaras', '90.00', $huancayo);
            $busy = $this->technician('busy', 'Técnico E2E con agenda ocupada', 'frio-camaras', '95.00', $huancayo);
            $electro = $this->technician('electro', 'Técnico E2E de electricidad', 'electricidad-tableros', '100.00', $huancayo);

            $tomorrow = CarbonImmutable::now('America/Lima')->addDay()->toDateString();
            $match = $this->request($clients['match'], 'frio-camaras', $huancayo, $rules, [
                'mode' => 'scheduled', 'preferred_start_at' => CarbonImmutable::parse("$tomorrow 15:00", 'America/Lima')->utc(),
                'preferred_end_at' => CarbonImmutable::parse("$tomorrow 17:00", 'America/Lima')->utc(),
            ]);
            $flow->prepare($match, 1);
            foreach ([$frio, $busy] as $technician) {
                $offer = DB::table('offers')->where('request_id', $match)->where('technician_id', $technician->id)->first();
                $responses->respond(User::query()->findOrFail($technician->user_id), $offer->id, ['decision' => 'accept', 'expected_version' => 1]);
            }
            $this->appointment($clients['agenda'], $busy, CarbonImmutable::parse("$tomorrow 16:00", 'America/Lima')->utc(), $rules, $huancayo);

            $flow->prepare($this->request($clients['match'], 'frio-camaras', $huancayo, $rules), 1);
            $flow->prepare($this->request($clients['direct'], 'electricidad-tableros', $huancayo, $rules,
                ['source' => 'profile', 'target_technician_id' => $electro->id]), 1);
            $flow->prepare($this->request($clients['pending'], 'electricidad-tierra', $huancayo, $rules), 1);
        });
    }

    private function client(string $suffix): int
    {
        $user = User::firstOrNew(['email' => "e2e-client-$suffix@example.test"]);
        $user->forceFill([
            'name' => "Cliente E2E $suffix", 'is_active' => true, 'role_id' => DB::table('roles')->where('code', 'client')->value('id'),
            'password' => env('TECNICOYA_E2E_PASSWORD'),
        ])->save();
        DB::table('client_profiles')->updateOrInsert(['user_id' => $user->id], ['client_type' => 'mype', 'updated_at' => now()]);

        return (int) DB::table('client_profiles')->where('user_id', $user->id)->value('id');
    }

    /** Técnico activo y verificado con un servicio, Huancayo como cobertura y base, y franjas de todo el día. */
    private function technician(string $suffix, string $name, string $subcategoryCode, string $fee, int $district): object
    {
        $user = User::firstOrNew(['email' => "e2e-technician-$suffix@example.test"]);
        $user->forceFill([
            'name' => $name, 'phone' => '900000096', 'is_active' => true, 'role_id' => DB::table('roles')->where('code', 'technician')->value('id'),
            'password' => env('TECNICOYA_E2E_PASSWORD'),
        ])->save();
        DB::table('technician_profiles')->updateOrInsert(['user_id' => $user->id], [
            'display_name' => $name, 'bio' => 'Perfil sintético para las pruebas E2E.', 'status' => 'active', 'verification_status' => 'approved',
            'experience_years' => 5, 'verified_at' => now()->subMonth(), 'base_district_id' => $district, 'updated_at' => now(),
        ]);
        $technician = DB::table('technician_profiles')->where('user_id', $user->id)->first();
        $subcategory = (int) DB::table('subcategories')->where('code', $subcategoryCode)->value('id');
        if (! DB::table('technician_services')->where('technician_id', $technician->id)->where('subcategory_id', $subcategory)->exists()) {
            $service = DB::table('technician_services')->insertGetId([
                'technician_id' => $technician->id, 'subcategory_id' => $subcategory, 'reference_fee' => $fee, 'experience_years' => 5,
            ]);
            DB::table('service_rate_versions')->insert([
                'technician_service_id' => $service, 'version_no' => 1, 'reference_fee' => $fee, 'currency' => 'PEN',
                'changed_by' => $user->id, 'effective_from' => now(),
            ]);
        }
        DB::table('technician_services')->where('technician_id', $technician->id)->where('subcategory_id', $subcategory)->update(['active' => 1]);
        DB::table('technician_districts')->updateOrInsert(['technician_id' => $technician->id, 'district_id' => $district], ['active' => 1]);
        DB::table('technician_pauses')->where('technician_id', $technician->id)->whereNull('cancelled_at')->update(['cancelled_at' => now()]);
        if (! DB::table('availability_slots')->where('technician_id', $technician->id)->exists()) {
            foreach (range(1, 7) as $weekday) {
                DB::table('availability_slots')->insert(['technician_id' => $technician->id, 'kind' => 'weekly', 'weekday' => $weekday,
                    'local_start' => '00:00:00', 'local_end' => '23:59:59', 'valid_from' => '2026-01-01', 'timezone' => 'America/Lima']);
            }
        }

        return $technician;
    }

    private function request(int $clientId, string $subcategoryCode, int $district, RuleBook $rules, array $overrides = []): int
    {
        $subcategory = DB::table('subcategories')->where('code', $subcategoryCode)->first(['id', 'reference_fee']);

        return DB::table('service_requests')->insertGetId($overrides + [
            'client_id' => $clientId, 'subcategory_id' => $subcategory->id, 'district_id' => $district,
            'description' => 'Solicitud sintética E2E del Sprint 4 con detalle suficiente.', 'address' => 'Avenida sintética E2E 404',
            'mode' => 'asap', 'source' => 'automatic', 'status' => 'sent', 'reference_fee_snapshot' => $subcategory->reference_fee,
            'rule_version_id' => $rules->currentVersionId(), 'submitted_at' => now(), 'search_generation' => 1, 'version' => 2,
        ]);
    }

    /** Cita confirmada del técnico en otra solicitud asignada, de 2 h desde el inicio indicado. */
    private function appointment(int $clientId, object $technician, CarbonImmutable $startsAt, RuleBook $rules, int $district): void
    {
        $request = $this->request($clientId, 'frio-camaras', $district, $rules, ['status' => 'assigned', 'search_generation' => 2]);
        $participation = DB::table('participations')->insertGetId([
            'request_id' => $request, 'technician_id' => $technician->id, 'slot' => 'primary', 'status' => 'assigned',
            'reference_fee_snapshot' => '95.00', 'currency' => 'PEN', 'assigned_at' => now(),
        ]);
        DB::table('appointments')->insert(['request_id' => $request, 'participation_id' => $participation, 'technician_id' => $technician->id,
            'starts_at' => $startsAt, 'ends_at' => $startsAt->addHours(2), 'status' => 'confirmed']);
    }

    /** Borra las solicitudes del S4 de siembras anteriores con todo lo que cuelga de ellas, en orden de claves foráneas. */
    private function reset(array $clientIds): void
    {
        $requests = DB::table('service_requests')->whereIn('client_id', $clientIds)->pluck('id');
        $offers = DB::table('offers')->whereIn('request_id', $requests)->pluck('id');
        $notifications = DB::table('notifications')->where(fn ($q) => $q->where('subject_type', 'service_request')->whereIn('subject_id', $requests))
            ->orWhere(fn ($q) => $q->where('subject_type', 'offer')->whereIn('subject_id', $offers))->pluck('id');
        $events = DB::table('outbox_events')->where(fn ($q) => $q->where('aggregate_type', 'service_request')->whereIn('aggregate_id', $requests))
            ->orWhere(fn ($q) => $q->where('aggregate_type', 'offer')->whereIn('aggregate_id', $offers))
            ->orWhere(fn ($q) => $q->where('aggregate_type', 'notification')->whereIn('aggregate_id', $notifications))->pluck('id');
        DB::table('notification_attempts')->whereIn('notification_id', $notifications)->delete();
        DB::table('notifications')->whereIn('id', $notifications)->delete();
        DB::table('outbox_deliveries')->whereIn('outbox_event_id', $events)->delete();
        DB::table('outbox_events')->whereIn('id', $events)->delete();
        DB::table('jobs')->delete();
        DB::table('appointments')->whereIn('request_id', $requests)->delete();
        DB::table('participations')->whereIn('request_id', $requests)->delete();
        DB::table('offers')->whereIn('id', $offers)->delete();
        DB::table('offer_rounds')->whereIn('request_id', $requests)->delete();
        $runs = DB::table('matching_runs')->whereIn('request_id', $requests)->pluck('id');
        DB::table('matching_candidates')->whereIn('matching_run_id', $runs)->delete();
        DB::table('matching_runs')->whereIn('id', $runs)->delete();
        DB::table('request_events')->whereIn('request_id', $requests)->delete();
        DB::table('request_attachments')->whereIn('request_id', $requests)->delete();
        DB::table('service_requests')->whereIn('id', $requests)->delete();
    }
}
