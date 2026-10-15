<?php

namespace Tests\Support;

use App\Models\TechnicianProfile;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Datos sintéticos compartidos por las pruebas del Sprint 3 (solicitud en cinco pasos y búsqueda).
 * Contrato: plan-pruebas-v3/sprint-03/CONTRATO-API.md.
 */
final class Sprint03
{
    /** Cuerpo válido de una solicitud inmediata automática. */
    public static function requestPayload(int $districtId, array $overrides = []): array
    {
        return $overrides + [
            'subcategory_id' => (int) DB::table('subcategories')->where('code', 'computo-hardware')->value('id'),
            'description' => 'La computadora no enciende desde ayer.',
            'district_id' => $districtId,
            'address' => 'Calle sintética 456, referencia de prueba',
            'mode' => 'asap',
            'source' => 'automatic',
        ];
    }

    /** Huella de las tablas que una solicitud rechazada no debe tocar. */
    public static function requestTablesSnapshot(): array
    {
        return [
            'service_requests' => DB::table('service_requests')->count(),
            'request_events' => DB::table('request_events')->count(),
            'request_attachments' => DB::table('request_attachments')->count(),
        ];
    }

    /** Registra una solicitud por la API como el usuario de la sesión y devuelve su detalle. */
    public static function register(TestCase $test, int $districtId, array $overrides = []): array
    {
        return $test->postJson('/api/v1/requests', self::requestPayload($districtId, $overrides))->assertCreated()->json('data');
    }

    /** Envía (quinto paso) con la versión indicada y una clave nueva salvo que se indique otra. */
    public static function submit(TestCase $test, int $id, int $version, ?string $key = null): TestResponse
    {
        return $test->postJson("/api/v1/requests/$id/submission", ['expected_version' => $version, 'summary_confirmed' => true],
            ['Idempotency-Key' => $key ?? (string) Str::uuid()]);
    }

    /** Registra y envía; devuelve el id. */
    public static function sent(TestCase $test, int $districtId): int
    {
        $request = self::register($test, $districtId);
        self::submit($test, $request['id'], $request['version'])->assertAccepted();

        return $request['id'];
    }

    /** Técnico habilitado que ofrece la subcategoría y cubre los distritos indicados. */
    public static function searchableTechnician(string $subcategoryCode = 'computo-hardware', array $districtIds = [],
        array $profile = []): TechnicianProfile
    {
        $technician = TechnicianProfileFactory::new()->approved()->create($profile);
        TechnicianServiceFactory::new()->create([
            'technician_id' => $technician->id,
            'subcategory_id' => DB::table('subcategories')->where('code', $subcategoryCode)->value('id'),
        ]);
        foreach ($districtIds as $districtId) {
            DB::table('technician_districts')->insert(['technician_id' => $technician->id, 'district_id' => $districtId]);
        }

        return $technician;
    }

    /** Ids de los técnicos de una respuesta de GET /technicians. */
    public static function ids(TestResponse $response): array
    {
        return array_column($response->assertOk()->json('data.items'), 'id');
    }
}
