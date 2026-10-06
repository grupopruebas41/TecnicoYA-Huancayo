<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Diccionario T06 (client_profiles) y T08 (technician_profiles).
// Pendiente de su módulo: default_district_id y primary_district_id (FK a districts, tabla aún inexistente).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('client_type', 32);
            $table->string('business_name', 180)->nullable();
            $table->text('default_address')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('technician_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('provider_type', 32)->default('independent');
            $table->string('display_name', 180);
            $table->text('bio')->nullable();
            $table->string('status', 32)->default('pending_verification');
            $table->string('verification_status', 32)->default('pending');
            $table->unsignedInteger('experience_years')->default(0);
            $table->unsignedTinyInteger('available_now')->default(0);
            $table->string('whatsapp', 20)->nullable();
            $table->dateTime('verified_at', 6)->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE client_profiles ADD CONSTRAINT chk_client_type CHECK (client_type IN ('household','mype'))");
            DB::statement("ALTER TABLE technician_profiles ADD CONSTRAINT chk_tech_provider CHECK (provider_type IN ('independent','company'))");
            DB::statement("ALTER TABLE technician_profiles ADD CONSTRAINT chk_tech_status CHECK (status IN ('pending_verification','active','inactive','suspended'))");
            DB::statement("ALTER TABLE technician_profiles ADD CONSTRAINT chk_tech_verification CHECK (verification_status IN ('pending','approved','rejected'))");
            DB::statement('ALTER TABLE technician_profiles ADD CONSTRAINT chk_tech_available CHECK (available_now IN (0,1))');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_profiles');
        Schema::dropIfExists('client_profiles');
    }
};
