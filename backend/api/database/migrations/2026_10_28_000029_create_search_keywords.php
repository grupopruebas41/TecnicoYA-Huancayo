<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// D-94 (RECO-01): buscador «¿Qué se malogró?». Diccionario de frases por subcategoría, búsquedas sin resultado (sin
// usuario, IP ni datos personales) y frases que sugirió la IA, pendientes de aprobar por un administrador.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subcategory_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
            $table->string('phrase', 120);
            $table->string('normalized_phrase', 120);
            $table->unsignedTinyInteger('weight');
            $table->string('kind', 10);
            $table->boolean('active')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->unique(['subcategory_id', 'normalized_phrase']);
            $table->index('active');
        });

        Schema::create('keyword_misses', function (Blueprint $table) {
            $table->id();
            $table->string('normalized_query', 120)->unique();
            $table->unsignedInteger('count')->default(1);
            $table->dateTime('last_seen_at');
        });

        Schema::create('keyword_suggestions', function (Blueprint $table) {
            $table->id();
            $table->string('normalized_query', 120);
            $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
            $table->string('status', 12)->default('pending');
            $table->unsignedInteger('count')->default(1);
            $table->dateTime('last_seen_at');
            $table->timestamps();
            $table->unique(['normalized_query', 'subcategory_id']);
            $table->index('status');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE subcategory_keywords ADD CONSTRAINT chk_keywords_weight CHECK (weight BETWEEN 1 AND 10)');
            DB::statement("ALTER TABLE subcategory_keywords ADD CONSTRAINT chk_keywords_kind CHECK (kind IN ('objeto','sintoma','general'))");
            DB::statement("ALTER TABLE keyword_suggestions ADD CONSTRAINT chk_suggestions_status CHECK (status IN ('pending','approved','discarded'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('keyword_suggestions');
        Schema::dropIfExists('keyword_misses');
        Schema::dropIfExists('subcategory_keywords');
    }
};
