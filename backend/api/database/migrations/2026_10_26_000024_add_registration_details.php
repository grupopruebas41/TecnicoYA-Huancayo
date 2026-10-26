<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * D-75 y D-80: nombres y apellidos (name queda como nombre para mostrar), aceptación de términos, distrito principal
 * del cliente y especialidades declaradas por el técnico al registrarse (sin servicios ni tarifas). También crea
 * password_reset_tokens para la recuperación de contraseña: el token se guarda con hash y vence a los 60 minutos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('given_names', 50)->nullable()->after('name');
            $table->string('family_names', 50)->nullable()->after('given_names');
            $table->dateTime('terms_accepted_at', 6)->nullable()->after('email_verified_at');
        });
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->foreignId('district_id')->nullable()->after('client_type')->constrained('districts')->restrictOnDelete();
        });
        if (! Schema::hasTable('password_reset_tokens')) {
            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });
        }
        Schema::create('technician_specialties', function (Blueprint $table) {
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('specialty_id')->constrained('specialties')->restrictOnDelete();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['technician_id', 'specialty_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_specialties');
        Schema::dropIfExists('password_reset_tokens');
        Schema::table('client_profiles', fn (Blueprint $table) => $table->dropConstrainedForeignId('district_id'));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['given_names', 'family_names', 'terms_accepted_at']));
    }
};
