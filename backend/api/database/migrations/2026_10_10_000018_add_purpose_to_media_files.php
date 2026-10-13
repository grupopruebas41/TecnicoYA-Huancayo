<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// D-46 y D-47: finalidad del archivo subido por POST /media. Los archivos anteriores quedan sin finalidad (NULL).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->string('purpose', 32)->nullable()->after('scan_status');
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE media_files ADD CONSTRAINT chk_media_purpose CHECK (purpose IN ('portfolio','catalog','document'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE media_files DROP CHECK chk_media_purpose');
        }
        Schema::table('media_files', fn (Blueprint $table) => $table->dropColumn('purpose'));
    }
};
