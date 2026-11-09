<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Fase 3 del panel final (D-101, propuesta): perfil público moderno y técnicos favoritos.
// - technician_profiles: forma de trabajo (500) y garantía declarada (300).
// - technician_services: «qué incluye» (300); no versiona la tarifa.
// - portfolio_images: etapa «antes» o «después».
// - client_favorite_technicians: favoritos del cliente titular.
// - technician_review_samples: reseñas de ejemplo solo del DemoSeeder; no son calificaciones (el módulo es del S6) y ni la
//   búsqueda ni el matching las leen. No reutiliza technician_reviews, que guarda las revisiones de verificación (S2).
// Los CHECK son solo de MySQL (DEF-53); S05-TC-115 corre todas las migraciones en SQLite.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('technician_profiles', function (Blueprint $table) {
            $table->string('work_style', 500)->nullable()->after('bio');
            $table->string('warranty_text', 300)->nullable()->after('work_style');
        });
        Schema::table('technician_services', function (Blueprint $table) {
            $table->string('includes', 300)->nullable()->after('currency');
        });
        Schema::table('portfolio_images', function (Blueprint $table) {
            $table->string('stage', 16)->nullable()->after('caption');
        });
        Schema::create('client_favorite_technicians', function (Blueprint $table) {
            $table->foreignId('client_user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['client_user_id', 'technician_id']);
            $table->index('technician_id');
        });
        Schema::create('technician_review_samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('comment', 500);
            $table->string('author_label', 60);
            $table->date('reviewed_on');
            $table->dateTime('created_at', 6)->useCurrent();
            $table->index(['technician_id', 'reviewed_on']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE portfolio_images ADD CONSTRAINT portfolio_images_stage_check CHECK (stage IS NULL OR stage IN ('before','after'))");
            DB::statement('ALTER TABLE technician_review_samples ADD CONSTRAINT technician_review_samples_rating_check CHECK (rating BETWEEN 1 AND 5)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_review_samples');
        Schema::dropIfExists('client_favorite_technicians');
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE portfolio_images DROP CHECK portfolio_images_stage_check');
        }
        Schema::table('portfolio_images', fn (Blueprint $table) => $table->dropColumn('stage'));
        Schema::table('technician_services', fn (Blueprint $table) => $table->dropColumn('includes'));
        Schema::table('technician_profiles', fn (Blueprint $table) => $table->dropColumn(['work_style', 'warranty_text']));
    }
};
