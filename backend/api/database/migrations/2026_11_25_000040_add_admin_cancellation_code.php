<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// D-116 y D-120 (Fase A3 del panel del administrador): una solicitud cancelada por el administrador guarda el código
// admin_intervention junto a los motivos del cliente de D-100. Solo MySQL tiene la restricción CHECK; SQLite no la usa.
return new class extends Migration
{
    private const CLIENT_CODES = "'solved','other_technician','reschedule','price','mistake','other'";

    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        DB::statement('ALTER TABLE service_requests DROP CHECK service_requests_cancellation_code_check');
        DB::statement('ALTER TABLE service_requests ADD CONSTRAINT service_requests_cancellation_code_check CHECK (cancellation_reason_code IS NULL OR cancellation_reason_code IN ('.self::CLIENT_CODES.",'admin_intervention'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        if (DB::table('service_requests')->where('cancellation_reason_code', 'admin_intervention')->exists()) {
            throw new RuntimeException('Hay solicitudes canceladas por el administrador; no se puede revertir.');
        }
        DB::statement('ALTER TABLE service_requests DROP CHECK service_requests_cancellation_code_check');
        DB::statement('ALTER TABLE service_requests ADD CONSTRAINT service_requests_cancellation_code_check CHECK (cancellation_reason_code IS NULL OR cancellation_reason_code IN ('.self::CLIENT_CODES.'))');
    }
};
