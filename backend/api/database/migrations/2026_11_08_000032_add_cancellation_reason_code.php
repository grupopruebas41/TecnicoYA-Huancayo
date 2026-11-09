<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// D-100 (aprobada): motivo de cancelación de una lista cerrada. cancellation_reason queda como comentario: obligatorio solo
// con «Otro motivo». El CHECK es solo de MySQL, como en las demás migraciones (DEF-53).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->string('cancellation_reason_code', 32)->nullable()->after('cancelled_at');
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE service_requests ADD CONSTRAINT service_requests_cancellation_code_check CHECK (cancellation_reason_code IS NULL OR cancellation_reason_code IN ('solved','other_technician','reschedule','price','mistake','other'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE service_requests DROP CHECK service_requests_cancellation_code_check');
        }
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn('cancellation_reason_code');
        });
    }
};
