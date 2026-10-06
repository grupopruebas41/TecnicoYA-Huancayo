<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Diccionario T16 (specialties) y T17 (subcategories).
// Pendiente de su módulo: hero_media_id y carousel_media_id (FK a media_files, tabla aún inexistente).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('specialties', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('active')->default(1);
            $table->unsignedInteger('display_order')->default(0);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('subcategories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('specialty_id')->constrained('specialties')->restrictOnDelete();
            $table->string('code', 80)->unique();
            $table->string('name', 180);
            $table->text('description')->nullable();
            $table->decimal('reference_fee', 12, 2)->nullable();
            $table->char('currency', 3)->default('PEN');
            $table->unsignedInteger('estimated_minutes')->nullable();
            $table->unsignedTinyInteger('active')->default(1);
            $table->unsignedInteger('display_order')->default(0);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->unique(['specialty_id', 'name']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE specialties ADD CONSTRAINT chk_specialties_active CHECK (active IN (0,1))');
            DB::statement('ALTER TABLE subcategories ADD CONSTRAINT chk_subcategories_active CHECK (active IN (0,1))');
            DB::statement('ALTER TABLE subcategories ADD CONSTRAINT chk_subcategories_fee CHECK (reference_fee >= 0)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('subcategories');
        Schema::dropIfExists('specialties');
    }
};
