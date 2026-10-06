<?php

namespace Tests\Support;

use Illuminate\Support\Facades\DB;

/**
 * Datos sintéticos compartidos por las pruebas del Sprint 3 (solicitud en cinco pasos).
 * Contrato: diseño técnico, filas POST /requests a GET /requests/{id}.
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
}
