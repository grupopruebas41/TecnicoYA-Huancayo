<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Fase 4 del panel final: menú contraído guardado en la cuenta, direcciones del cliente (Casa, Negocio u otra) y
// preferencias de comunicación (sin datos de salud). Los CHECK son solo de MySQL (DEF-53).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('sidebar_collapsed')->nullable()->after('theme_preference');
        });
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->text('communication_prefs')->nullable();
        });
        Schema::create('client_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('kind', 16);
            $table->string('label', 40);
            $table->foreignId('district_id')->constrained('districts')->restrictOnDelete();
            $table->string('address', 255);
            $table->string('reference', 255)->nullable();
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->index('user_id');
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE client_addresses ADD CONSTRAINT client_addresses_kind_check CHECK (kind IN ('home','business','other'))");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('client_addresses');
        Schema::table('client_profiles', fn (Blueprint $table) => $table->dropColumn('communication_prefs'));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('sidebar_collapsed'));
    }
};
