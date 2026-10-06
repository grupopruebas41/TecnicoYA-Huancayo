<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Diccionario: announcements y announcement_audiences. La tabla existe desde la versión anterior (id UUID,
// audience textual, estado archived): se amplía sin cambiar sus columnas para no romper ese código.
// announcement_audiences.announcement_id es UUID por esa razón (el diccionario lo prevé BIGINT).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dateTime('starts_at', 6)->nullable()->after('link_label');
            $table->unsignedSmallInteger('duration_days')->default(1)->after('starts_at');
            $table->dateTime('ends_at', 6)->nullable()->after('duration_days');
            $table->foreignId('created_by')->nullable()->after('ends_at')->constrained('users')->restrictOnDelete();
            $table->dateTime('retired_at', 6)->nullable()->after('updated_by');
            $table->unsignedInteger('version')->default(1)->after('retired_at');
        });

        Schema::create('announcement_audiences', function (Blueprint $table) {
            $table->uuid('announcement_id');
            $table->foreign('announcement_id')->references('id')->on('announcements')->restrictOnDelete();
            $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
            $table->dateTime('created_at', 6)->useCurrent();
            $table->primary(['announcement_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcement_audiences');
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['starts_at', 'duration_days', 'ends_at', 'retired_at', 'version']);
        });
    }
};
