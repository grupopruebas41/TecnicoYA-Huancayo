<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Sprint 4 · diccionario T33 a T39: ejecuciones del matching con su fotografía, candidatos con factores y motivo de
// exclusión, rondas, ofertas, participaciones y la reserva mínima de citas (CANVAS-Sprint-04 §2). El nombre `offers`
// quedó libre con el retiro del prototipo (D-62).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matching_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('service_requests')->restrictOnDelete();
            $table->unsignedInteger('search_generation');
            $table->unsignedInteger('attempt_no');
            $table->string('run_trigger', 32);
            $table->foreignId('rule_version_id')->constrained('rule_versions')->restrictOnDelete();
            $table->string('algorithm_version', 32);
            $table->string('status', 16);
            $table->string('failure_code', 40)->nullable();
            $table->json('rules_snapshot')->nullable();
            $table->unsignedInteger('eligible_count')->default(0);
            $table->decimal('duration_ms', 10, 3)->nullable();
            $table->dateTime('started_at', 6);
            $table->dateTime('finished_at', 6)->nullable();
            $table->unique(['request_id', 'search_generation', 'attempt_no']);
        });

        Schema::create('matching_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('matching_run_id')->constrained('matching_runs')->restrictOnDelete();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->unsignedTinyInteger('eligible');
            $table->string('exclusion_code', 40)->nullable();
            $table->decimal('proximity_factor', 7, 6)->nullable();
            $table->decimal('price_factor', 7, 6)->nullable();
            $table->decimal('rating_factor', 7, 6)->nullable();
            $table->decimal('experience_factor', 7, 6)->nullable();
            $table->decimal('score', 10, 6)->nullable();
            $table->unsignedInteger('rank_position')->nullable();
            $table->unsignedInteger('tie_group')->nullable();
            $table->string('tie_break', 32)->nullable();
            $table->json('input_snapshot');
            $table->unique(['matching_run_id', 'technician_id']);
        });

        Schema::create('offer_rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('service_requests')->restrictOnDelete();
            $table->foreignId('matching_run_id')->constrained('matching_runs')->restrictOnDelete();
            $table->unsignedInteger('search_generation');
            $table->unsignedInteger('round_no');
            $table->string('kind', 16);
            $table->string('status', 16);
            $table->dateTime('opened_at', 6);
            $table->dateTime('expires_at', 6);
            $table->dateTime('closed_at', 6)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->unique(['request_id', 'round_no']);
            $table->index(['status', 'expires_at']);
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('round_id')->constrained('offer_rounds')->restrictOnDelete();
            $table->foreignId('request_id')->constrained('service_requests')->restrictOnDelete();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('matching_candidate_id')->nullable()->constrained('matching_candidates')->restrictOnDelete();
            $table->string('status', 16)->default('pending');
            $table->dateTime('available_at', 6);
            $table->dateTime('expires_at', 6);
            $table->dateTime('responded_at', 6)->nullable();
            $table->text('response_reason')->nullable();
            $table->decimal('reference_fee_snapshot', 12, 2);
            $table->char('currency', 3)->default('PEN');
            $table->foreignId('service_rate_version_id')->nullable()->constrained('service_rate_versions')->restrictOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            // RN-11.1: quien ya tuvo oferta en la solicitud no recibe otra.
            $table->unique(['request_id', 'technician_id']);
            $table->index(['technician_id', 'status']);
        });

        Schema::create('participations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('service_requests')->restrictOnDelete();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('offer_id')->nullable()->constrained('offers')->restrictOnDelete();
            $table->string('slot', 16)->default('primary');
            $table->string('status', 16);
            $table->decimal('reference_fee_snapshot', 12, 2);
            $table->char('currency', 3)->default('PEN');
            $table->dateTime('assigned_at', 6);
            $table->dateTime('started_at', 6)->nullable();
            $table->dateTime('completed_at', 6)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->unique(['request_id', 'slot']);
            $table->index(['technician_id', 'status']);
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('service_requests')->restrictOnDelete();
            $table->foreignId('participation_id')->constrained('participations')->restrictOnDelete();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->dateTime('starts_at', 6);
            $table->dateTime('ends_at', 6);
            $table->string('status', 16)->default('confirmed');
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index(['technician_id', 'status', 'starts_at']);
        });

        if (DB::getDriverName() === 'mysql') {
            $this->addChecks();
        }
    }

    private function addChecks(): void
    {
        DB::statement("ALTER TABLE matching_runs ADD CONSTRAINT chk_runs_status CHECK (status IN ('running','completed','failed'))");
        DB::statement("ALTER TABLE matching_runs ADD CONSTRAINT chk_runs_trigger CHECK (run_trigger IN ('submission','reassignment','pending_retry','alternative'))");
        DB::statement('ALTER TABLE matching_candidates ADD CONSTRAINT chk_candidates_eligible CHECK ((eligible = 1 AND exclusion_code IS NULL) OR (eligible = 0 AND exclusion_code IS NOT NULL AND rank_position IS NULL))');
        DB::statement("ALTER TABLE offer_rounds ADD CONSTRAINT chk_rounds_kind CHECK (kind IN ('automatic','direct'))");
        DB::statement("ALTER TABLE offer_rounds ADD CONSTRAINT chk_rounds_status CHECK (status IN ('open','awaiting_choice','closed'))");
        DB::statement('ALTER TABLE offer_rounds ADD CONSTRAINT chk_rounds_window CHECK (expires_at > opened_at)');
        DB::statement("ALTER TABLE offers ADD CONSTRAINT chk_offers_status CHECK (status IN ('pending','accepted','rejected','expired','withdrawn'))");
        DB::statement('ALTER TABLE offers ADD CONSTRAINT chk_offers_window CHECK (expires_at > available_at)');
        DB::statement('ALTER TABLE offers ADD CONSTRAINT chk_offers_fee CHECK (reference_fee_snapshot >= 0)');
        DB::statement("ALTER TABLE participations ADD CONSTRAINT chk_participations_slot CHECK (slot IN ('primary'))");
        DB::statement("ALTER TABLE participations ADD CONSTRAINT chk_participations_status CHECK (status IN ('assigned','in_progress','completed','cancelled'))");
        DB::statement("ALTER TABLE appointments ADD CONSTRAINT chk_appointments_status CHECK (status IN ('confirmed','cancelled'))");
        DB::statement('ALTER TABLE appointments ADD CONSTRAINT chk_appointments_window CHECK (ends_at > starts_at)');
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('participations');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('offer_rounds');
        Schema::dropIfExists('matching_candidates');
        Schema::dropIfExists('matching_runs');
    }
};
