<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Diccionario: service_requests, request_attachments, request_events e idempotency_records.
// La tabla histórica `requests` no se toca. rule_version_id se añadirá con rule_versions (Sprint 7).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->restrictOnDelete();
            $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
            $table->foreignId('district_id')->constrained('districts')->restrictOnDelete();
            $table->text('description');
            $table->text('address');
            $table->string('mode', 32)->default('asap');
            $table->dateTime('preferred_start_at', 6)->nullable();
            $table->dateTime('preferred_end_at', 6)->nullable();
            $table->string('source', 32)->default('automatic');
            $table->foreignId('target_technician_id')->nullable()->constrained('technician_profiles')->restrictOnDelete();
            $table->string('status', 32)->default('registered');
            $table->decimal('reference_fee_snapshot', 12, 2)->nullable();
            $table->char('currency', 3)->default('PEN');
            $table->dateTime('submitted_at', 6)->nullable();
            $table->dateTime('pending_since', 6)->nullable();
            $table->dateTime('pending_expires_at', 6)->nullable();
            $table->unsignedInteger('search_generation')->default(0);
            $table->dateTime('cancelled_at', 6)->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->dateTime('closed_at', 6)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index(['client_id', 'status']);
        });

        Schema::create('request_attachments', function (Blueprint $table) {
            $table->foreignId('request_id')->constrained('service_requests')->restrictOnDelete();
            $table->foreignId('media_id')->unique()->constrained('media_files')->restrictOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->string('caption', 180)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['request_id', 'media_id']);
            $table->unique(['request_id', 'position']);
        });

        Schema::create('request_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('service_requests')->restrictOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('event_type', 80);
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32)->nullable();
            $table->text('summary');
            $table->json('metadata')->nullable();
            $table->dateTime('occurred_at', 6);
            $table->string('correlation_id', 64);
            $table->unsignedInteger('request_version');
            $table->index(['request_id', 'occurred_at']);
        });

        Schema::create('idempotency_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('operation', 160);
            $table->char('key_hash', 64);
            $table->char('request_hash', 64);
            $table->string('status', 32)->default('processing');
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_body')->nullable();
            $table->dateTime('expires_at', 6);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->unique(['user_id', 'operation', 'key_hash']);
        });

        if (DB::getDriverName() === 'mysql') {
            $this->addChecks();
        }
    }

    private function addChecks(): void
    {
        DB::statement("ALTER TABLE service_requests ADD CONSTRAINT chk_requests_mode CHECK (mode IN ('asap','scheduled'))");
        DB::statement("ALTER TABLE service_requests ADD CONSTRAINT chk_requests_source CHECK (source IN ('automatic','profile'))");
        DB::statement("ALTER TABLE service_requests ADD CONSTRAINT chk_requests_status CHECK (status IN ('registered','sent','pending_availability','assigned','in_progress','completed','closed','unrated','cancelled','expired'))");
        DB::statement('ALTER TABLE service_requests ADD CONSTRAINT chk_requests_fee CHECK (reference_fee_snapshot >= 0)');
        DB::statement("ALTER TABLE service_requests ADD CONSTRAINT chk_requests_schedule CHECK ((mode='asap' AND preferred_start_at IS NULL AND preferred_end_at IS NULL) OR (mode='scheduled' AND preferred_start_at IS NOT NULL AND preferred_end_at IS NOT NULL AND preferred_end_at > preferred_start_at))");
        DB::statement("ALTER TABLE service_requests ADD CONSTRAINT chk_requests_target CHECK ((source='automatic' AND target_technician_id IS NULL) OR (source='profile' AND target_technician_id IS NOT NULL))");
        DB::statement('ALTER TABLE service_requests ADD CONSTRAINT chk_requests_pending CHECK ((pending_since IS NULL AND pending_expires_at IS NULL) OR (pending_since IS NOT NULL AND pending_expires_at IS NOT NULL AND pending_expires_at > pending_since))');
        DB::statement("ALTER TABLE idempotency_records ADD CONSTRAINT chk_idempotency_status CHECK (status IN ('processing','completed'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_records');
        Schema::dropIfExists('request_events');
        Schema::dropIfExists('request_attachments');
        Schema::dropIfExists('service_requests');
    }
};
