<?php

namespace Tests\Support;

use App\Models\TechnicianProfile;
use App\Models\User;
use App\Modules\BMatching\Jobs\ExpireOfferRound;
use App\Modules\BMatching\Jobs\ExpirePendingRequest;
use App\Modules\BMatching\Jobs\OpenOfferRound;
use App\Modules\BMatching\Jobs\PrepareMatching;
use App\Modules\BMatching\Jobs\RetryPendingMatching;
use App\Shared\Rules\RuleBook;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\Process\Process;
use Tests\TestCase;

/**
 * Datos sintéticos y pasos compartidos por las pruebas del Sprint 4 (matching, ofertas y notificaciones).
 * Contrato: plan-pruebas-v3/sprint-04/CONTRATO-API.md. Los jobs se ejecutan de forma explícita (la cola de
 * pruebas es `null`) y siempre con el reloj controlado.
 */
final class Sprint04
{
    /** Martes 20 de octubre de 2026, 09:00 en Lima: posterior a la versión 2 de reglas (D-63). */
    public const NOW = '2026-10-20 14:00:00';

    public static function boot(TestCase $test): void
    {
        $test->seed([AuthorizationSeeder::class, CatalogSeeder::class, DistrictSeeder::class]);
        $test->travelTo(CarbonImmutable::parse(self::NOW, 'UTC'));
        Sprint01::actAsSpa($test);
    }

    public static function district(string $code = 'HUANCAYO'): int
    {
        return (int) DB::table('districts')->where('code', $code)->value('id');
    }

    public static function subcategory(string $code = 'computo-hardware'): int
    {
        return (int) DB::table('subcategories')->where('code', $code)->value('id');
    }

    /**
     * Técnico activo y verificado que ofrece la subcategoría, cubre los distritos y atiende todos los días
     * de 06:00 a 22:00 (Lima). Opciones: fee, years, districts, base, subcategory, slots, profile.
     */
    public static function technician(array $options = []): TechnicianProfile
    {
        $technician = TechnicianProfileFactory::new()->approved()->create(($options['profile'] ?? []) + [
            'display_name' => 'Técnico '.Str::upper(Str::random(5)),
            'verified_at' => now()->subDays(30),
        ]);
        TechnicianServiceFactory::new()->create([
            'technician_id' => $technician->id,
            'subcategory_id' => self::subcategory($options['subcategory'] ?? 'computo-hardware'),
            'reference_fee' => $options['fee'] ?? '80.00',
            'experience_years' => $options['years'] ?? 2,
        ]);
        foreach ($options['districts'] ?? [self::district()] as $districtId) {
            DB::table('technician_districts')->insert(['technician_id' => $technician->id, 'district_id' => $districtId]);
        }
        if (isset($options['base'])) {
            DB::table('technician_profiles')->where('id', $technician->id)->update(['base_district_id' => $options['base']]);
        }
        if ($options['slots'] ?? true) {
            foreach (range(1, 7) as $weekday) {
                self::weeklySlot($technician->id, $weekday, '06:00:00', '22:00:00');
            }
        }

        return $technician->refresh();
    }

    public static function weeklySlot(int $technicianId, int $weekday, string $start, string $end): void
    {
        DB::table('availability_slots')->insert([
            'technician_id' => $technicianId, 'kind' => 'weekly', 'weekday' => $weekday,
            'local_start' => $start, 'local_end' => $end, 'valid_from' => '2026-01-01', 'timezone' => 'America/Lima',
        ]);
    }

    /** Solicitud enviada con la versión de reglas vigente y la generación 1 (como la deja el quinto paso). */
    public static function sentRequest(array $overrides = []): object
    {
        $clientId = $overrides['client_id'] ?? ClientProfileFactory::new()->create()->id;
        $id = DB::table('service_requests')->insertGetId($overrides + [
            'client_id' => $clientId,
            'subcategory_id' => self::subcategory(),
            'district_id' => self::district(),
            'description' => 'La computadora no enciende desde ayer.',
            'address' => 'Jirón sintético 742, interior B',
            'mode' => 'asap',
            'source' => 'automatic',
            'status' => 'sent',
            'rule_version_id' => app(RuleBook::class)->currentVersionId(),
            'submitted_at' => now(),
            'search_generation' => 1,
            'version' => 2,
        ]);

        return DB::table('service_requests')->find($id);
    }

    /** Solicitud programada en una franja de Lima (fecha local Y-m-d, horas H:i). */
    public static function scheduled(string $localDate, string $from, string $to, array $overrides = []): object
    {
        return self::sentRequest($overrides + [
            'mode' => 'scheduled',
            'preferred_start_at' => CarbonImmutable::parse("$localDate $from", 'America/Lima')->utc(),
            'preferred_end_at' => CarbonImmutable::parse("$localDate $to", 'America/Lima')->utc(),
        ]);
    }

    public static function clientUser(object $request): User
    {
        return User::query()->findOrFail(DB::table('client_profiles')->where('id', $request->client_id)->value('user_id'));
    }

    public static function generation(int $requestId): int
    {
        return (int) DB::table('service_requests')->where('id', $requestId)->value('search_generation');
    }

    public static function prepare(int $requestId, ?int $generation = null): void
    {
        dispatch_sync(new PrepareMatching($requestId, $generation ?? self::generation($requestId)));
    }

    public static function openRound(int $requestId, ?int $generation = null): void
    {
        dispatch_sync(new OpenOfferRound($requestId, $generation ?? self::generation($requestId)));
    }

    public static function expireRound(int $roundId): void
    {
        $round = DB::table('offer_rounds')->find($roundId);
        dispatch_sync(new ExpireOfferRound($roundId, (int) $round->search_generation));
    }

    public static function retryPending(int $requestId, ?int $generation = null): void
    {
        dispatch_sync(new RetryPendingMatching($requestId, $generation ?? self::generation($requestId)));
    }

    public static function expirePending(int $requestId, ?int $generation = null): void
    {
        dispatch_sync(new ExpirePendingRequest($requestId, $generation ?? self::generation($requestId)));
    }

    public static function run(int $requestId): ?object
    {
        return DB::table('matching_runs')->where('request_id', $requestId)->orderByDesc('id')->first();
    }

    public static function candidate(int $requestId, int $technicianId): ?object
    {
        return DB::table('matching_candidates')->where('matching_run_id', self::run($requestId)?->id)
            ->where('technician_id', $technicianId)->first();
    }

    public static function rounds(int $requestId): array
    {
        return DB::table('offer_rounds')->where('request_id', $requestId)->orderBy('round_no')->get()->all();
    }

    public static function offerTo(int $requestId, int $technicianId): ?object
    {
        return DB::table('offers')->where('request_id', $requestId)->where('technician_id', $technicianId)->first();
    }

    /** Ids de técnico con oferta en la ronda indicada. */
    public static function offeredIn(int $roundId): array
    {
        return DB::table('offers')->where('round_id', $roundId)->orderBy('technician_id')->pluck('technician_id')->map(fn ($id) => (int) $id)->all();
    }

    public static function respond(TestCase $test, TechnicianProfile $technician, object $offer, string $decision,
        ?string $key = null, array $body = []): TestResponse
    {
        Sanctum::actingAs($technician->user);

        return $test->postJson("/api/v1/offers/{$offer->id}/response", $body + ['decision' => $decision, 'expected_version' => (int) $offer->version],
            ['Idempotency-Key' => $key ?? (string) Str::uuid()]);
    }

    public static function select(TestCase $test, object $request, int $offerId, ?int $expectedVersion = null, ?string $key = null): TestResponse
    {
        Sanctum::actingAs(self::clientUser($request));
        $version = $expectedVersion ?? (int) DB::table('service_requests')->where('id', $request->id)->value('version');

        return $test->postJson("/api/v1/requests/{$request->id}/selection", ['offer_id' => $offerId, 'expected_version' => $version],
            ['Idempotency-Key' => $key ?? (string) Str::uuid()]);
    }

    /** Cita confirmada del técnico entre dos instantes UTC (requiere una solicitud y participación propias). */
    public static function appointment(int $technicianId, CarbonImmutable $startsAt, CarbonImmutable $endsAt): void
    {
        $request = self::sentRequest(['status' => 'assigned']);
        $participation = DB::table('participations')->insertGetId([
            'request_id' => $request->id, 'technician_id' => $technicianId, 'slot' => 'primary', 'status' => 'assigned',
            'reference_fee_snapshot' => '80.00', 'currency' => 'PEN', 'assigned_at' => now(),
        ]);
        DB::table('appointments')->insert([
            'request_id' => $request->id, 'participation_id' => $participation, 'technician_id' => $technicianId,
            'starts_at' => $startsAt, 'ends_at' => $endsAt, 'status' => 'confirmed',
        ]);
    }

    /** Participación finalizada del técnico en la subcategoría, con su duración en minutos. */
    public static function completedService(int $technicianId, int $minutes, string $subcategory = 'computo-hardware'): void
    {
        $request = self::sentRequest(['status' => 'completed', 'subcategory_id' => self::subcategory($subcategory)]);
        $start = CarbonImmutable::parse('2026-10-01 15:00:00', 'UTC');
        DB::table('participations')->insert([
            'request_id' => $request->id, 'technician_id' => $technicianId, 'slot' => 'primary', 'status' => 'completed',
            'reference_fee_snapshot' => '80.00', 'currency' => 'PEN', 'assigned_at' => $start->subHour(),
            'started_at' => $start, 'completed_at' => $start->addMinutes($minutes),
        ]);
    }

    public static function pause(int $technicianId, CarbonImmutable $startsAt, ?CarbonImmutable $endsAt = null): void
    {
        DB::table('technician_pauses')->insert(['technician_id' => $technicianId, 'starts_at' => $startsAt, 'ends_at' => $endsAt]);
    }

    public static function events(int $requestId, string $type): int
    {
        return DB::table('request_events')->where('request_id', $requestId)->where('event_type', $type)->count();
    }

    /**
     * Ejecuta las peticiones en procesos PHP reales que arrancan juntos tras una barrera GET_LOCK de MySQL (sin sleep).
     * Requiere una prueba sin transacción envolvente (DatabaseMigrations). Devuelve [estado, cuerpo] por petición.
     *
     * @param  array<int, array{user: User, method: string, uri: string, body: array, headers?: array}>  $calls
     */
    public static function race(array $calls): array
    {
        $barrier = 'tecnicoya-s04-'.Str::lower(Str::random(10));
        DB::select('SELECT GET_LOCK(?, 0)', [$barrier]);
        $processes = [];
        foreach ($calls as $call) {
            $spec = base64_encode(json_encode([
                'user_id' => $call['user']->id, 'method' => $call['method'], 'uri' => $call['uri'], 'body' => $call['body'],
                'headers' => ($call['headers'] ?? []) + ['Idempotency-Key' => (string) Str::uuid()],
                'now' => now()->toISOString(), 'barrier' => $barrier,
            ], JSON_THROW_ON_ERROR));
            $process = new Process([PHP_BINARY, base_path('tests/Support/concurrent-request.php'), $spec], base_path(), [
                'APP_ENV' => 'testing', 'DB_DATABASE' => config('database.connections.mysql.database'), 'DB_USERNAME' => 'tecnicoya_test',
                'DB_HOST' => '127.0.0.1', 'TECNICOYA_SLOT' => null, 'QUEUE_CONNECTION' => 'null', 'CACHE_STORE' => 'array',
            ]);
            $process->setTimeout(60);
            $process->start();
            $process->waitUntil(fn (string $type, string $output) => str_contains($output, 'ready'));
            $processes[] = $process;
        }
        DB::select('SELECT RELEASE_LOCK(?)', [$barrier]);

        return array_map(function (Process $process) {
            $process->wait();
            $lines = array_values(array_filter(explode("\n", trim($process->getOutput()))));
            $result = json_decode((string) end($lines), true);
            if (! is_array($result)) {
                throw new \RuntimeException('El proceso hijo no respondió: '.$process->getErrorOutput().$process->getOutput());
            }

            return [$result['status'], $result['body']];
        }, $processes);
    }
}
