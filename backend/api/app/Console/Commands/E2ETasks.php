<?php

namespace App\Console\Commands;

use App\Modules\BMatching\Application\MatchingFlow;
use App\Shared\Rules\RuleBook;
use App\Shared\Testing\E2EClock;
use Carbon\CarbonImmutable;
use Database\Seeders\E2EDatabaseGuard;
use DateTimeImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Tareas de Cypress del Sprint 4 (contrato §9), que scripts/e2e-tareas-s04.mjs expone con cy.task:
 * - clock <+10m|+90s|-1h|reset>: adelanta el reloj del servidor del slot (serverClock);
 * - jobs: ejecuta el barrido y vacía la cola una vez (runJobs);
 * - open-round <correo del técnico>: abre una ronda dirigida a ese técnico para probar el tiempo real (openRoundFor).
 * Solo en la base aislada de un slot con APP_ENV=testing (E2EDatabaseGuard, D-59).
 */
final class E2ETasks extends Command
{
    protected $signature = 'tecnicoya:e2e {task : clock, jobs u open-round} {argument? : desfase o correo}';

    protected $description = 'Tareas E2E del Sprint 4: reloj del servidor, jobs y ronda de prueba (solo slots de prueba).';

    public function handle(MatchingFlow $flow, RuleBook $rules): int
    {
        E2EDatabaseGuard::ensureIsolated();

        return match ($this->argument('task')) {
            'clock' => $this->clock(),
            'jobs' => $this->jobs(),
            'open-round' => $this->openRound($flow, $rules),
            default => $this->fail('Tarea desconocida: use clock, jobs u open-round.'),
        };
    }

    private function clock(): int
    {
        $offset = E2EClock::shift((string) ($this->argument('argument') ?? 'reset'));
        $serverTime = CarbonImmutable::createFromInterface(new DateTimeImmutable('now'))->addSeconds($offset); // hora real + desfase
        $this->line(json_encode(['offset_seconds' => $offset, 'server_time' => $serverTime->toISOString()]));

        return self::SUCCESS;
    }

    private function jobs(): int
    {
        Artisan::call('tecnicoya:sweep');
        Artisan::call('queue:work', ['--stop-when-empty' => true, '--tries' => 1, '--sleep' => 0]);
        $this->line(json_encode(['pending_jobs' => DB::table('jobs')->count()]));

        return self::SUCCESS;
    }

    private function openRound(MatchingFlow $flow, RuleBook $rules): int
    {
        $technician = DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')
            ->where('u.email', (string) $this->argument('argument'))->first(['t.id']);
        $service = $technician ? DB::table('technician_services')->where('technician_id', $technician->id)->where('active', 1)->first() : null;
        $district = $technician ? DB::table('technician_districts')->where('technician_id', $technician->id)->where('active', 1)->value('district_id') : null;
        $client = DB::table('client_profiles as c')->join('users as u', 'u.id', '=', 'c.user_id')
            ->where('u.email', 'e2e-client-direct@example.test')->value('c.id');
        if (! $service || ! $district || ! $client) {
            return $this->fail('El técnico debe ser un técnico E2E con un servicio y un distrito activos (Sprint04E2ESeeder).');
        }
        $requestId = DB::table('service_requests')->insertGetId([
            'client_id' => $client, 'subcategory_id' => $service->subcategory_id, 'district_id' => $district,
            'description' => 'Solicitud sintética E2E para probar el tiempo real.', 'address' => 'Calle sintética E2E de tiempo real',
            'mode' => 'asap', 'source' => 'profile', 'target_technician_id' => $technician->id, 'status' => 'sent',
            'rule_version_id' => $rules->currentVersionId(), 'submitted_at' => now(), 'search_generation' => 1, 'version' => 2,
        ]);
        $flow->prepare($requestId, 1);
        $offer = DB::table('offers')->where('request_id', $requestId)->first(['id', 'status', 'expires_at']);
        $this->line(json_encode(['request_id' => $requestId, 'offer_id' => $offer?->id, 'status' => $offer?->status]));

        return $offer ? self::SUCCESS : self::FAILURE;
    }
}
