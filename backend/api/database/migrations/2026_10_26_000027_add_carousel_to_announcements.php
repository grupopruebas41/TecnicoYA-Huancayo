<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Comunicados en carrusel (bloque B, D-83): origen (texto heredado del S2, imagen o Genially), tipo, imagen
 * principal y móvil revisadas, enlace de Genially, texto alternativo y orden del carrusel por audiencia
 * (announcement_audiences.position). La finalidad de media `announcement` se agrega al CHECK de media_files.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('source', 10)->default('text')->after('body');
            $table->string('kind', 12)->nullable()->after('source');
            $table->foreignId('image_media_id')->nullable()->after('kind')->constrained('media_files')->nullOnDelete();
            $table->foreignId('mobile_media_id')->nullable()->after('image_media_id')->constrained('media_files')->nullOnDelete();
            $table->string('genially_url', 120)->nullable()->after('mobile_media_id');
            $table->string('alt_text', 250)->nullable()->after('genially_url');
        });
        Schema::table('announcement_audiences', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0)->after('role_id');
            $table->index(['role_id', 'position']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE announcements ADD CONSTRAINT chk_announcements_source CHECK (source IN ('text','image','genially'))");
            DB::statement("ALTER TABLE announcements ADD CONSTRAINT chk_announcements_kind CHECK (kind IS NULL OR kind IN ('promotion','raffle','news','notice'))");
            DB::statement('ALTER TABLE media_files DROP CHECK chk_media_purpose');
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_purpose CHECK (purpose IN ('portfolio','catalog','document','evidence','avatar','announcement'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE announcements DROP CHECK chk_announcements_source');
            DB::statement('ALTER TABLE announcements DROP CHECK chk_announcements_kind');
            DB::statement('ALTER TABLE media_files DROP CHECK chk_media_purpose');
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_purpose CHECK (purpose IN ('portfolio','catalog','document','evidence','avatar'))");
        }
        Schema::table('announcement_audiences', function (Blueprint $table) {
            $table->dropIndex(['role_id', 'position']);
            $table->dropColumn('position');
        });
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mobile_media_id');
            $table->dropConstrainedForeignId('image_media_id');
            $table->dropColumn(['source', 'kind', 'genially_url', 'alt_text']);
        });
    }
};
