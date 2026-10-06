<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Diccionario: districts y media_files. Los distritos reales siguen pendientes de P03: no se siembran aquí.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 12)->unique();
            $table->string('name', 120)->unique();
            $table->unsignedTinyInteger('active')->default(1);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('media_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->string('disk', 40);
            $table->string('storage_key', 255);
            $table->string('original_name', 255);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('byte_size');
            $table->char('sha256', 64);
            $table->string('visibility', 32)->default('private');
            $table->string('scan_status', 32)->default('pending');
            $table->dateTime('retired_at', 6)->nullable();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->unique(['disk', 'storage_key']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE districts ADD CONSTRAINT chk_districts_active CHECK (active IN (0,1))');
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_visibility CHECK (visibility IN ('private','public'))");
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_scan CHECK (scan_status IN ('pending','clean','rejected'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('media_files');
        Schema::dropIfExists('districts');
    }
};
