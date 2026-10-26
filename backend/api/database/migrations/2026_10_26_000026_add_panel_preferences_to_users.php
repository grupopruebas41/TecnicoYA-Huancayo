<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 1 del panel (D-76 y D-77): preferencia de tema por usuario y foto de perfil (media con finalidad avatar,
 * que se agrega al CHECK de media_files).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme_preference', 10)->nullable()->after('terms_accepted_at');
            $table->foreignId('avatar_media_id')->nullable()->after('theme_preference')->constrained('media_files')->nullOnDelete();
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_theme CHECK (theme_preference IS NULL OR theme_preference IN ('light','dark','system'))");
            DB::statement('ALTER TABLE media_files DROP CHECK chk_media_purpose');
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_purpose CHECK (purpose IN ('portfolio','catalog','document','evidence','avatar'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE users DROP CHECK chk_users_theme');
            DB::statement('ALTER TABLE media_files DROP CHECK chk_media_purpose');
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_purpose CHECK (purpose IN ('portfolio','catalog','document','evidence'))");
        }
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('avatar_media_id');
            $table->dropColumn('theme_preference');
        });
    }
};
