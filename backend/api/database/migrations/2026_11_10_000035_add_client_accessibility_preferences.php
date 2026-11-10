<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Fase 5 del panel final (D-97): ajustes de accesibilidad guardados en la cuenta y marcas de la bienvenida y del tutorial.
// Solo preferencias de uso: nunca qué discapacidad tiene la persona ni la tarjeta que eligió (Ley 29733).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->text('accessibility_prefs')->nullable();
            $table->dateTime('onboarding_completed_at')->nullable();
            $table->dateTime('tour_completed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('client_profiles', fn (Blueprint $table) => $table->dropColumn(['accessibility_prefs', 'onboarding_completed_at', 'tour_completed_at']));
    }
};
