<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * D-80: rubros (subcategorías) que el técnico declara al registrarse, al menos uno por especialidad declarada.
 * No son servicios: el técnico no es elegible en el matching hasta cargar su tarifa en «Servicios y tarifas».
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technician_declared_subcategories', function (Blueprint $table) {
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['technician_id', 'subcategory_id'], 'technician_declared_subcategories_primary');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_declared_subcategories');
    }
};
