<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// D-92 (PEDIDO-01): pedido con varios rubros. El pedido agrupa solicitudes que se envían juntas; cada solicitud conserva
// su versión de reglas. Por solicitud: urgencia informativa, marca y modelo opcionales, franja de Lima y síntomas del
// catálogo sembrado por subcategoría.
// DEF-53: los CHECK son solo de MySQL (la base local es SQLite) y cada paso comprueba si ya existe, porque SQLite no hace
// transaccional este esquema: un intento fallido anterior pudo dejar service_orders creada sin registrar la migración.
return new class extends Migration
{
    public function up(): void
    {
        $mysql = DB::getDriverName() === 'mysql';

        if (! Schema::hasTable('service_orders')) {
            Schema::create('service_orders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('client_id')->constrained('client_profiles')->restrictOnDelete();
                $table->unsignedTinyInteger('item_count');
                $table->dateTime('submitted_at');
                $table->timestamps();
                $table->index(['client_id', 'submitted_at']);
            });
            if ($mysql) {
                DB::statement('ALTER TABLE service_orders ADD CONSTRAINT service_orders_item_count_check CHECK (item_count BETWEEN 1 AND 3)');
            }
        }

        if (! Schema::hasColumn('service_requests', 'order_id')) {
            Schema::table('service_requests', function (Blueprint $table) {
                $table->foreignId('order_id')->nullable()->after('client_id')->constrained('service_orders')->restrictOnDelete();
                $table->string('urgency', 8)->default('normal')->after('description');
                $table->string('brand', 60)->nullable()->after('urgency');
                $table->string('model', 60)->nullable()->after('brand');
                $table->string('address_reference', 120)->nullable()->after('address');
                $table->string('time_slot', 8)->nullable()->after('preferred_end_at');
            });
            if ($mysql) {
                DB::statement("ALTER TABLE service_requests ADD CONSTRAINT service_requests_urgency_check CHECK (urgency IN ('normal', 'urgente'))");
                DB::statement("ALTER TABLE service_requests ADD CONSTRAINT service_requests_time_slot_check CHECK (time_slot IS NULL OR time_slot IN ('manana', 'tarde', 'noche'))");
            }
        }

        if (! Schema::hasTable('subcategory_symptoms')) {
            Schema::create('subcategory_symptoms', function (Blueprint $table) {
                $table->id();
                $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
                $table->string('name', 80);
                $table->unsignedTinyInteger('position');
                $table->boolean('active')->default(true);
                $table->timestamps();
                $table->unique(['subcategory_id', 'name']);
            });
        }

        if (! Schema::hasTable('request_symptoms')) {
            Schema::create('request_symptoms', function (Blueprint $table) {
                $table->foreignId('request_id')->constrained('service_requests')->cascadeOnDelete();
                $table->foreignId('symptom_id')->constrained('subcategory_symptoms')->restrictOnDelete();
                $table->primary(['request_id', 'symptom_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('request_symptoms');
        Schema::dropIfExists('subcategory_symptoms');
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE service_requests DROP CHECK service_requests_time_slot_check');
            DB::statement('ALTER TABLE service_requests DROP CHECK service_requests_urgency_check');
        }
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('order_id');
            $table->dropColumn(['urgency', 'brand', 'model', 'address_reference', 'time_slot']);
        });
        Schema::dropIfExists('service_orders');
    }
};
