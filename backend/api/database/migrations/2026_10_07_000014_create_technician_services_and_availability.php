<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Diccionario: technician_services, service_rate_versions, technician_districts, availability_slots,
// technician_pauses. Duración y compatibilidad de franjas siguen pendientes de P05/P16.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technician_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
            $table->decimal('reference_fee', 12, 2);
            $table->char('currency', 3)->default('PEN');
            $table->unsignedInteger('experience_years')->default(0);
            $table->unsignedTinyInteger('active')->default(1);
            $table->unsignedInteger('current_rate_version')->default(1);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->unique(['technician_id', 'subcategory_id']);
        });

        Schema::create('service_rate_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_service_id')->constrained('technician_services')->restrictOnDelete();
            $table->unsignedInteger('version_no');
            $table->decimal('reference_fee', 12, 2);
            $table->char('currency', 3);
            $table->foreignId('changed_by')->constrained('users')->restrictOnDelete();
            $table->text('reason')->nullable();
            $table->dateTime('effective_from', 6);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->unique(['technician_service_id', 'version_no']);
        });

        Schema::create('technician_districts', function (Blueprint $table) {
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('district_id')->constrained('districts')->restrictOnDelete();
            $table->unsignedTinyInteger('active')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->primary(['technician_id', 'district_id']);
        });

        Schema::create('availability_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->string('kind', 32);
            $table->unsignedTinyInteger('weekday')->nullable();
            $table->time('local_start')->nullable();
            $table->time('local_end')->nullable();
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->dateTime('starts_at', 6)->nullable();
            $table->dateTime('ends_at', 6)->nullable();
            $table->string('timezone', 60);
            $table->unsignedTinyInteger('active')->default(1);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index(['technician_id', 'active']);
        });

        Schema::create('technician_pauses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->dateTime('starts_at', 6);
            $table->dateTime('ends_at', 6)->nullable();
            $table->dateTime('cancelled_at', 6)->nullable();
            $table->string('reason', 255)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index(['technician_id', 'starts_at']);
        });

        if (DB::getDriverName() === 'mysql') {
            $this->addChecks();
        }
    }

    private function addChecks(): void
    {
        DB::statement('ALTER TABLE technician_services ADD CONSTRAINT chk_tservices_fee CHECK (reference_fee >= 0)');
        DB::statement('ALTER TABLE technician_services ADD CONSTRAINT chk_tservices_active CHECK (active IN (0,1))');
        DB::statement('ALTER TABLE service_rate_versions ADD CONSTRAINT chk_rates_fee CHECK (reference_fee >= 0)');
        DB::statement('ALTER TABLE technician_districts ADD CONSTRAINT chk_tdistricts_active CHECK (active IN (0,1))');
        DB::statement("ALTER TABLE availability_slots ADD CONSTRAINT chk_slots_kind CHECK (kind IN ('weekly','one_off'))");
        DB::statement('ALTER TABLE availability_slots ADD CONSTRAINT chk_slots_weekday CHECK (weekday BETWEEN 1 AND 7)');
        DB::statement('ALTER TABLE availability_slots ADD CONSTRAINT chk_slots_active CHECK (active IN (0,1))');
        DB::statement("ALTER TABLE availability_slots ADD CONSTRAINT chk_slots_shape CHECK ((kind='weekly' AND weekday IS NOT NULL AND local_start IS NOT NULL AND local_end IS NOT NULL AND local_end>local_start AND valid_from IS NOT NULL AND starts_at IS NULL AND ends_at IS NULL) OR (kind='one_off' AND weekday IS NULL AND local_start IS NULL AND local_end IS NULL AND valid_from IS NULL AND valid_until IS NULL AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at>starts_at))");
        DB::statement('ALTER TABLE availability_slots ADD CONSTRAINT chk_slots_validity CHECK (valid_until IS NULL OR valid_until >= valid_from)');
        DB::statement('ALTER TABLE technician_pauses ADD CONSTRAINT chk_pauses_range CHECK (ends_at IS NULL OR ends_at > starts_at)');
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_pauses');
        Schema::dropIfExists('availability_slots');
        Schema::dropIfExists('technician_districts');
        Schema::dropIfExists('service_rate_versions');
        Schema::dropIfExists('technician_services');
    }
};
