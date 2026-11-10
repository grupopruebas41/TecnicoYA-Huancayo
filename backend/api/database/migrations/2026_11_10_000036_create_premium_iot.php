<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Fase 6 del panel final (D-98 y D-99): plan del cliente, «Mis equipos» y sensores IoT SIMULADOS con lecturas y alertas.
// El sensor todavía no existe: toda lectura es de demostración. Los CHECK son solo de MySQL (DEF-53).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->string('plan', 10)->default('free');
            $table->dateTime('plan_since')->nullable();
        });
        Schema::create('client_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
            $table->string('name', 60);
            $table->string('brand', 60)->nullable();
            $table->string('model', 60)->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->foreignId('address_id')->nullable()->constrained('client_addresses')->nullOnDelete();
            $table->string('notes', 500)->nullable();
            $table->boolean('is_demo')->default(false);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index('user_id');
        });
        Schema::table('service_requests', function (Blueprint $table) {
            $table->foreignId('equipment_id')->nullable()->constrained('client_equipment')->nullOnDelete();
        });
        Schema::create('iot_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->unique()->constrained('client_equipment')->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('metric', 16);
            $table->string('unit', 8);
            $table->decimal('target', 8, 2);
            $table->decimal('tolerance', 8, 2);
            $table->boolean('online')->default(true);
            $table->unsignedTinyInteger('battery')->default(100);
            $table->unsignedSmallInteger('maintenance_every_days')->default(180);
            $table->dateTime('last_maintenance_at')->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });
        Schema::create('iot_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('iot_devices')->cascadeOnDelete();
            $table->decimal('value', 8, 2);
            $table->dateTime('measured_at');
            $table->index(['device_id', 'measured_at']);
        });
        Schema::create('iot_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('iot_devices')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('kind', 16);
            $table->string('severity', 16);
            $table->string('message', 255);
            $table->decimal('value', 8, 2)->nullable();
            $table->dateTime('started_at');
            $table->dateTime('resolved_at')->nullable();
            $table->foreignId('request_id')->nullable()->constrained('service_requests')->nullOnDelete();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->index(['user_id', 'started_at']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE client_profiles ADD CONSTRAINT client_profiles_plan_check CHECK (plan IN ('free','premium'))");
            DB::statement("ALTER TABLE iot_devices ADD CONSTRAINT iot_devices_metric_check CHECK (metric IN ('temperature','power','vibration','hours'))");
            DB::statement("ALTER TABLE iot_alerts ADD CONSTRAINT iot_alerts_kind_check CHECK (kind IN ('threshold','maintenance'))");
            DB::statement("ALTER TABLE iot_alerts ADD CONSTRAINT iot_alerts_severity_check CHECK (severity IN ('info','attention','failure'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('iot_alerts');
        Schema::dropIfExists('iot_readings');
        Schema::dropIfExists('iot_devices');
        Schema::table('service_requests', fn (Blueprint $table) => $table->dropConstrainedForeignId('equipment_id'));
        Schema::dropIfExists('client_equipment');
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE client_profiles DROP CHECK client_profiles_plan_check');
        }
        Schema::table('client_profiles', fn (Blueprint $table) => $table->dropColumn(['plan', 'plan_since']));
    }
};
