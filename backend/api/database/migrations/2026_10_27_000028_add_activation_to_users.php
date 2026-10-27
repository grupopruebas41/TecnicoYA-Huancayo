<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bloque C (D-85): cuentas dadas de alta por un administrador sin contraseña. `invited_at` marca el alta desde el
 * panel y `activated_at`, el momento en que la persona definió su contraseña con el enlace. Una cuenta está
 * pendiente de activación si tiene invited_at y no activated_at; las cuentas existentes quedan activas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dateTime('invited_at', 6)->nullable()->after('terms_accepted_at');
            $table->dateTime('activated_at', 6)->nullable()->after('invited_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['invited_at', 'activated_at']));
    }
};
