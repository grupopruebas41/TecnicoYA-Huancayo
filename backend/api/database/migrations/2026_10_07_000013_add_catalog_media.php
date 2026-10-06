<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Diccionario: specialties.hero_media_id y subcategories.carousel_media_id, pendientes desde el Sprint 1
// hasta que existiera media_files.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('specialties', function (Blueprint $table) {
            $table->foreignId('hero_media_id')->nullable()->after('description')->constrained('media_files')->restrictOnDelete();
        });
        Schema::table('subcategories', function (Blueprint $table) {
            $table->foreignId('carousel_media_id')->nullable()->after('description')->constrained('media_files')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('subcategories', fn (Blueprint $table) => $table->dropConstrainedForeignId('carousel_media_id'));
        Schema::table('specialties', fn (Blueprint $table) => $table->dropConstrainedForeignId('hero_media_id'));
    }
};
