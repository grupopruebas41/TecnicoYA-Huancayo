<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Diccionario T03 (users). Tabla ya poblada: role_id empieza nullable y se completa desde users.role
// (AuthorizationSeeder). Se hará obligatoria cuando el mapeo esté verificado; users.role queda
// nullable durante la transición porque los usuarios nuevos se identifican por role_id.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('id')->constrained('roles')->restrictOnDelete();
            $table->string('phone', 20)->nullable()->after('password');
            $table->dateTime('email_verified_at', 6)->nullable()->after('phone');
            $table->unsignedInteger('auth_version')->default(1)->after('is_active');
            $table->dateTime('anonymized_at', 6)->nullable()->after('auth_version');
            $table->rememberToken()->after('anonymized_at');
            $table->unsignedInteger('version')->default(1)->after('remember_token');
            $table->string('role')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn(['phone', 'email_verified_at', 'auth_version', 'anonymized_at', 'remember_token', 'version']);
        });
    }
};
