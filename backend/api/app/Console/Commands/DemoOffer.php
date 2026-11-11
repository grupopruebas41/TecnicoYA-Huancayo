<?php

namespace App\Console\Commands;

use App\Modules\BMatching\Application\MatchingFlow;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * D-108 (Fase T2 del panel del técnico): crea una oferta pendiente nueva (10 minutos) para un técnico demo, para probar
 * el Inicio y las Ofertas en local sin esperar a un cliente. Solo con APP_ENV=local y solo para cuentas
 * demo-tecnico-…@example.test. La solicitud es de demo-cliente, va dirigida al técnico y pasa por el matching real
 * (aviso en la campana y evento en tiempo real), en una franja de su disponibilidad.
 */
final class DemoOffer extends Command
{
    protected $signature = 'tecnicoya:demo-offer
        {email : Correo del técnico demo (demo-tecnico-…@example.test)}
        {--urgent : Marca la solicitud como urgente}';

    protected $description = 'Crea una oferta de demostración para un técnico demo (solo APP_ENV=local).';

    public function handle(MatchingFlow $flow, RuleBook $rules): int
    {
        if (! app()->environment('local')) {
            return $this->refuse('Este comando solo corre en desarrollo (APP_ENV=local).');
        }
        $email = mb_strtolower((string) $this->argument('email'));
        if (! preg_match('/^demo-tecnico-[a-z0-9-]+@example\.test$/', $email)) {
            return $this->refuse('Solo se crean ofertas para técnicos demo (demo-tecnico-…@example.test).');
        }
        $technician = DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')->where('u.email', $email)
            ->first(['t.id', 't.base_district_id', 't.verification_status']);
        $client = DB::table('client_profiles as c')->join('users as u', 'u.id', '=', 'c.user_id')
            ->where('u.email', 'demo-cliente@example.test')->value('c.id');
        if (! $technician || ! $client) {
            return $this->refuse('No encontramos al técnico demo o a demo-cliente. Corre antes el DemoSeeder.');
        }
        if ($technician->verification_status !== 'approved') {
            return $this->refuse('El técnico demo debe estar verificado para recibir ofertas.');
        }
        $service = DB::table('technician_services')->where('technician_id', $technician->id)->where('active', 1)->orderBy('id')->first();
        $districts = DB::table('technician_districts')->where('technician_id', $technician->id)->where('active', 1)->pluck('district_id');
        $district = $districts->contains($technician->base_district_id) ? $technician->base_district_id : $districts->first();
        $window = $this->window((int) $technician->id);
        if (! $service || ! $district || ! $window) {
            return $this->refuse('El técnico demo necesita un servicio, una zona y un horario de atención en los próximos 7 días.');
        }

        $requestId = DB::table('service_requests')->insertGetId([
            'client_id' => $client, 'subcategory_id' => $service->subcategory_id, 'district_id' => $district,
            'description' => 'Solicitud de demostración: el equipo no enciende después de un corte de luz (demostración).',
            'address' => 'Dirección de demostración 123', 'mode' => 'scheduled',
            'preferred_start_at' => $window[0], 'preferred_end_at' => $window[1],
            'urgency' => $this->option('urgent') ? 'urgente' : 'normal',
            'source' => 'profile', 'target_technician_id' => $technician->id, 'status' => 'sent',
            'rule_version_id' => $rules->currentVersionId(), 'submitted_at' => now(), 'search_generation' => 1, 'version' => 2,
        ]);
        $flow->prepare($requestId, 1);
        $offer = DB::table('offers')->where('request_id', $requestId)->first(['id', 'status', 'expires_at']);
        if (! $offer) {
            return $this->refuse("El matching no pudo ofrecer la solicitud #{$requestId} a este técnico (revisa su disponibilidad y sus citas).");
        }
        $expires = CarbonImmutable::parse($offer->expires_at, 'UTC')->setTimezone('America/Lima')->format('H:i');
        $this->info("Oferta #{$offer->id} creada (solicitud #{$requestId}). Vence a las {$expires}, hora de Lima.");

        return self::SUCCESS;
    }

    /** Primera franja de 2 horas dentro de un horario semanal del técnico, desde dentro de 30 minutos y hasta 7 días. */
    private function window(int $technicianId): ?array
    {
        $slots = DB::table('availability_slots')->where('technician_id', $technicianId)->where('active', 1)->where('kind', 'weekly')->get();
        $earliest = CarbonImmutable::now('America/Lima')->addMinutes(30)->ceilHour();
        for ($day = 0; $day <= 7; $day++) {
            $date = $earliest->startOfDay()->addDays($day);
            foreach ($slots->where('weekday', $date->dayOfWeekIso)->sortBy('local_start') as $slot) {
                $start = CarbonImmutable::parse($date->toDateString().' '.$slot->local_start, 'America/Lima');
                $start = $start->lt($earliest) ? $earliest : $start;
                $end = $start->addHours(2);
                if ($end->lte(CarbonImmutable::parse($date->toDateString().' '.$slot->local_end, 'America/Lima'))
                    && ! $this->busy($technicianId, $start, $end)) {
                    return [$start->utc(), $end->utc()];
                }
            }
        }

        return null;
    }

    private function busy(int $technicianId, CarbonImmutable $start, CarbonImmutable $end): bool
    {
        return DB::table('appointments')->where('technician_id', $technicianId)->where('status', 'confirmed')
            ->where('starts_at', '<', $end->utc())->where('ends_at', '>', $start->utc())->exists();
    }

    private function refuse(string $message): int
    {
        $this->error($message);

        return self::FAILURE;
    }
}
