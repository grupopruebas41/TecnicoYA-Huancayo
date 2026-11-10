<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Panel del técnico, Fase T1 (D-105): los ajustes de accesibilidad, la bienvenida, el tutorial y los avisos de oferta
// pasan a `users`, comunes a los tres roles. Se copian los del cliente; las columnas de client_profiles quedan sin uso
// hasta el cierre. Solo preferencias de uso: nunca qué discapacidad tiene la persona (Ley 29733).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('accessibility_prefs')->nullable();
            $table->dateTime('onboarding_completed_at')->nullable();
            $table->dateTime('tour_completed_at')->nullable();
            $table->text('offer_alert_prefs')->nullable();
        });
        DB::table('client_profiles')->where(fn ($q) => $q->whereNotNull('accessibility_prefs')
            ->orWhereNotNull('onboarding_completed_at')->orWhereNotNull('tour_completed_at'))
            ->orderBy('id')->each(function (object $row) {
                DB::table('users')->where('id', $row->user_id)->update([
                    'accessibility_prefs' => $row->accessibility_prefs,
                    'onboarding_completed_at' => $row->onboarding_completed_at,
                    'tour_completed_at' => $row->tour_completed_at,
                ]);
            });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['accessibility_prefs', 'onboarding_completed_at', 'tour_completed_at', 'offer_alert_prefs']));
    }
};
