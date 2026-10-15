<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Sprint 3: evidencias de solicitud (D-12) y reglas versionadas mínimas (D-58; reglas formalizadas §8.1 a §8.3).
// La versión 1 es una semilla del sistema: created_by queda nulo porque no la crea ninguna persona.
// Solo lectura hasta el Sprint 7, que añade la publicación de versiones.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rule_parameters', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80)->unique();
            $table->string('value_type', 32);
            $table->string('unit', 30);
            $table->text('description');
            $table->decimal('min_value', 14, 4)->nullable();
            $table->decimal('max_value', 14, 4)->nullable();
            $table->unsignedTinyInteger('required')->default(1);
            $table->unsignedTinyInteger('editable')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('rule_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('version_no')->unique();
            $table->string('status', 32);
            $table->foreignId('created_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('published_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->text('change_reason');
            $table->dateTime('effective_at', 6)->nullable();
            $table->dateTime('published_at', 6)->nullable();
            $table->char('content_hash', 64)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index(['status', 'effective_at']);
        });

        Schema::create('rule_values', function (Blueprint $table) {
            $table->foreignId('rule_version_id')->constrained('rule_versions')->restrictOnDelete();
            $table->foreignId('parameter_id')->constrained('rule_parameters')->restrictOnDelete();
            $table->json('value_json');
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['rule_version_id', 'parameter_id']);
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->foreignId('rule_version_id')->nullable()->after('status')->constrained('rule_versions')->restrictOnDelete();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE rule_parameters ADD CONSTRAINT chk_rule_value_type CHECK (value_type IN ('integer','decimal','boolean','string'))");
            DB::statement("ALTER TABLE rule_versions ADD CONSTRAINT chk_rule_version_status CHECK (status IN ('draft','published','retired'))");
            DB::statement('ALTER TABLE media_files DROP CHECK chk_media_purpose');
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_purpose CHECK (purpose IN ('portfolio','catalog','document','evidence'))");
        }

        $this->seedVersionOne();
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE media_files DROP CHECK chk_media_purpose');
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_purpose CHECK (purpose IN ('portfolio','catalog','document'))");
        }
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rule_version_id');
        });
        Schema::dropIfExists('rule_values');
        Schema::dropIfExists('rule_versions');
        Schema::dropIfExists('rule_parameters');
    }

    /** D-11 y D-58: max_active_requests_per_client = 3, no editable hasta el Sprint 7. */
    private function seedVersionOne(): void
    {
        $effective = '2026-10-09 00:00:00'; // Fecha de D-11: vigente para cualquier reloj de prueba posterior.
        $parameterId = DB::table('rule_parameters')->insertGetId([
            'code' => 'max_active_requests_per_client', 'value_type' => 'integer', 'unit' => 'solicitudes',
            'description' => 'Solicitudes enviadas y aún abiertas que un cliente puede tener a la vez (D-11).',
            'min_value' => 1, 'max_value' => null, 'required' => 1, 'editable' => 0,
        ]);
        $values = ['max_active_requests_per_client' => 3];
        $versionId = DB::table('rule_versions')->insertGetId([
            'version_no' => 1, 'status' => 'published', 'change_reason' => 'Versión inicial sembrada (D-58).',
            'effective_at' => $effective, 'published_at' => $effective,
            'content_hash' => hash('sha256', json_encode($values, JSON_THROW_ON_ERROR)),
        ]);
        DB::table('rule_values')->insert(['rule_version_id' => $versionId, 'parameter_id' => $parameterId, 'value_json' => json_encode(3)]);
    }
};
