<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Diccionario: technician_documents, technician_reviews, review_documents, portfolio_items, portfolio_images.
// El rechazo de verificación sigue pendiente de P22; los límites de archivos, de P17.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technician_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('media_id')->unique()->constrained('media_files')->restrictOnDelete();
            $table->string('document_type', 60);
            $table->string('review_status', 32)->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->dateTime('reviewed_at', 6)->nullable();
            $table->text('review_note')->nullable();
            $table->dateTime('valid_until', 6)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('technician_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $table->string('decision', 32);
            $table->text('reason');
            $table->json('checklist');
            $table->dateTime('reviewed_at', 6);
            $table->dateTime('created_at', 6)->useCurrent();
        });

        Schema::create('review_documents', function (Blueprint $table) {
            $table->foreignId('review_id')->constrained('technician_reviews')->restrictOnDelete();
            $table->foreignId('document_id')->constrained('technician_documents')->restrictOnDelete();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['review_id', 'document_id']);
        });

        Schema::create('portfolio_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('technician_id')->constrained('technician_profiles')->restrictOnDelete();
            $table->foreignId('subcategory_id')->nullable()->constrained('subcategories')->restrictOnDelete();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->date('performed_on')->nullable();
            $table->string('status', 32)->default('draft');
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('portfolio_images', function (Blueprint $table) {
            $table->foreignId('portfolio_id')->constrained('portfolio_items')->restrictOnDelete();
            $table->foreignId('media_id')->constrained('media_files')->restrictOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->string('caption', 180)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['portfolio_id', 'media_id']);
            $table->unique(['portfolio_id', 'position']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE technician_documents ADD CONSTRAINT chk_tdocs_status CHECK (review_status IN ('pending','approved','rejected'))");
            DB::statement("ALTER TABLE technician_reviews ADD CONSTRAINT chk_treviews_decision CHECK (decision IN ('approve','reject','request_changes'))");
            DB::statement("ALTER TABLE portfolio_items ADD CONSTRAINT chk_portfolio_status CHECK (status IN ('draft','published','retired'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_images');
        Schema::dropIfExists('portfolio_items');
        Schema::dropIfExists('review_documents');
        Schema::dropIfExists('technician_reviews');
        Schema::dropIfExists('technician_documents');
    }
};
