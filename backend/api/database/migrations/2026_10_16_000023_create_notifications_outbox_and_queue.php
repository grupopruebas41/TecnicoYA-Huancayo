<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Sprint 4 · diccionario T53, T54, T70 y T71: bandeja interna con sus intentos de entrega (RNF-07, D-68) y outbox de
// eventos de tiempo real publicados después del commit (TC-046). Además, las tablas estándar de la cola `database`
// de Laravel (jobs, job_batches, failed_jobs), que usan el arrancador E2E y el worker del slot (D-70).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('type', 60);
            $table->string('title', 160);
            $table->text('body');
            $table->string('subject_type', 40);
            $table->unsignedBigInteger('subject_id');
            $table->char('event_id', 36)->unique();
            $table->string('status', 16)->default('pending');
            $table->unsignedInteger('attempts')->default(0);
            $table->dateTime('next_attempt_at', 6)->nullable();
            $table->dateTime('delivered_at', 6)->nullable();
            $table->dateTime('read_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index(['user_id', 'id']);
            $table->index(['status', 'next_attempt_at']);
        });

        Schema::create('notification_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('notifications')->restrictOnDelete();
            $table->unsignedInteger('attempt_no');
            $table->string('channel', 20);
            $table->string('status', 16);
            $table->string('error_code', 60)->nullable();
            $table->dateTime('attempted_at', 6);
            $table->unique(['notification_id', 'attempt_no']);
        });

        Schema::create('outbox_events', function (Blueprint $table) {
            $table->id();
            $table->char('event_id', 36)->unique();
            $table->string('event_type', 60);
            $table->string('channel', 120);
            $table->string('aggregate_type', 40);
            $table->unsignedBigInteger('aggregate_id');
            $table->json('payload');
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('published_at', 6)->nullable();
            $table->index('published_at');
        });

        Schema::create('outbox_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outbox_event_id')->constrained('outbox_events')->restrictOnDelete();
            $table->unsignedInteger('attempt_no');
            $table->string('status', 16);
            $table->string('error_code', 60)->nullable();
            $table->dateTime('attempted_at', 6);
            $table->unique(['outbox_event_id', 'attempt_no']);
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE notifications ADD CONSTRAINT chk_notifications_status CHECK (status IN ('pending','sent','failed'))");
            DB::statement("ALTER TABLE notification_attempts ADD CONSTRAINT chk_attempts_status CHECK (status IN ('sent','failed'))");
            DB::statement("ALTER TABLE outbox_deliveries ADD CONSTRAINT chk_deliveries_status CHECK (status IN ('sent','failed'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('outbox_deliveries');
        Schema::dropIfExists('outbox_events');
        Schema::dropIfExists('notification_attempts');
        Schema::dropIfExists('notifications');
    }
};
