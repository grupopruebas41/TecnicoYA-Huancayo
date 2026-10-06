<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// T67: historial de acciones sensibles; no contiene contraseñas ni sesiones.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('actor_kind', 32);
            $table->string('action', 100);
            $table->string('permission_used', 100)->nullable();
            $table->string('subject_type', 60);
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->text('reason');
            $table->json('before_values')->nullable();
            $table->json('after_values')->nullable();
            $table->string('correlation_id', 64)->index();
            $table->dateTime('occurred_at', 6);
            $table->string('source_code', 100)->nullable();
            $table->index(['subject_type', 'subject_id', 'occurred_at'], 'audit_subject_time');
            $table->index(['actor_id', 'occurred_at'], 'audit_actor_time');
            $table->index(['action', 'occurred_at'], 'audit_action_time');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE audit_entries ADD CONSTRAINT chk_audit_actor_kind CHECK (actor_kind IN ('user','system'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_entries');
    }
};
