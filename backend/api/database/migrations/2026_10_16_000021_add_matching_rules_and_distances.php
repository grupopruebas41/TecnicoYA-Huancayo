<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Sprint 4: distrito base del técnico y matriz de distancias (D-64; diccionario T19), pesos del matching (T29) y
// versión 2 de reglas publicada por migración con la fotografía completa de la v1 (D-63, PARAM-02). La v1 no se
// reescribe (RN-28, §8.6): las solicitudes enviadas con ella no tienen parámetros de matching (RULES_INCOMPLETE).
return new class extends Migration
{
    /** D-63: parámetros nuevos de la versión 2 con su tipo, unidad y valor. */
    private const PARAMETERS = [
        'offer_sla_minutes' => ['integer', 'minutos', 10, 'Plazo para responder una oferta (D-21).'],
        'max_simultaneous_offers' => ['integer', 'ofertas', 3, 'Ofertas simultáneas por ronda (RN-10.2).'],
        'pending_hours' => ['integer', 'horas', 24, 'Duración máxima del pendiente de disponibilidad (RN-11.2).'],
        'new_technician_history_factor' => ['decimal', 'factor', 0.5, 'Factor H sin historial suficiente o sin reseñas (D-20).'],
        'history_real_after_completed_services' => ['integer', 'servicios', 3, 'Servicios finalizados para usar el historial real (D-20).'],
        'equal_price_factor' => ['decimal', 'factor', 0.5, 'Factor T cuando todas las tarifas coinciden (D-20).'],
        'max_delivery_retries' => ['integer', 'reintentos', 3, 'Reintentos de entrega de una notificación (RNF-07).'],
    ];

    public function up(): void
    {
        Schema::table('technician_profiles', function (Blueprint $table) {
            $table->foreignId('base_district_id')->nullable()->after('available_now')->constrained('districts')->restrictOnDelete();
        });

        Schema::create('district_distances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_district_id')->constrained('districts')->restrictOnDelete();
            $table->foreignId('to_district_id')->constrained('districts')->restrictOnDelete();
            $table->decimal('km', 7, 3);
            $table->string('source', 255);
            $table->unsignedInteger('version')->default(1);
            $table->dateTime('created_at', 6)->useCurrent();
            $table->dateTime('updated_at', 6)->useCurrent()->useCurrentOnUpdate();
            $table->unique(['from_district_id', 'to_district_id']);
        });

        Schema::create('matching_weights', function (Blueprint $table) {
            $table->foreignId('rule_version_id')->primary()->constrained('rule_versions')->restrictOnDelete();
            $table->decimal('proximity_weight', 5, 2);
            $table->decimal('price_weight', 5, 2);
            $table->decimal('history_weight', 5, 2);
            $table->decimal('experience_weight', 5, 2);
            $table->dateTime('created_at', 6)->useCurrent();
        });

        if (DB::getDriverName() === 'mysql') {
            // Pares canónicos (de menor a mayor id): una sola fila por par, incluido el mismo distrito.
            DB::statement('ALTER TABLE district_distances ADD CONSTRAINT chk_distance_pair CHECK (from_district_id <= to_district_id)');
            DB::statement('ALTER TABLE district_distances ADD CONSTRAINT chk_distance_km CHECK (km > 0)');
            DB::statement('ALTER TABLE matching_weights ADD CONSTRAINT chk_weights_range CHECK (proximity_weight >= 0 AND price_weight >= 0 AND history_weight >= 0 AND experience_weight >= 0)');
            DB::statement('ALTER TABLE matching_weights ADD CONSTRAINT chk_weights_sum CHECK (proximity_weight + price_weight + history_weight + experience_weight = 100)');
        }

        $this->publishVersionTwo();
    }

    public function down(): void
    {
        $version = DB::table('rule_versions')->where('version_no', 2)->value('id');
        Schema::dropIfExists('matching_weights');
        if ($version) {
            DB::table('rule_values')->where('rule_version_id', $version)->delete();
            DB::table('rule_versions')->where('id', $version)->delete();
        }
        DB::table('rule_parameters')->whereIn('code', array_keys(self::PARAMETERS))->delete();
        Schema::dropIfExists('district_distances');
        Schema::table('technician_profiles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('base_district_id');
        });
    }

    /** D-63: copia de la v1 más los parámetros nuevos y los pesos 35/20/30/15, vigente desde el 2026-10-16. */
    private function publishVersionTwo(): void
    {
        $effective = '2026-10-16 00:00:00';
        $previous = DB::table('rule_versions')->where('version_no', 1)->value('id');
        $values = DB::table('rule_values as v')->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')
            ->where('v.rule_version_id', $previous)->pluck('v.value_json', 'p.code')
            ->map(fn (string $json) => json_decode($json, flags: JSON_THROW_ON_ERROR))->all();
        foreach (self::PARAMETERS as $code => [$type, $unit, $value, $description]) {
            DB::table('rule_parameters')->insert([
                'code' => $code, 'value_type' => $type, 'unit' => $unit, 'description' => $description,
                'min_value' => 0, 'required' => 1, 'editable' => 0,
            ]);
            $values[$code] = $value;
        }
        $weights = ['proximity_weight' => 35, 'price_weight' => 20, 'history_weight' => 30, 'experience_weight' => 15];
        ksort($values);
        $versionId = DB::table('rule_versions')->insertGetId([
            'version_no' => 2, 'status' => 'published', 'change_reason' => 'Parámetros y pesos del matching del Sprint 4 (D-63).',
            'effective_at' => $effective, 'published_at' => $effective,
            'content_hash' => hash('sha256', json_encode(['values' => $values, 'weights' => $weights], JSON_THROW_ON_ERROR)),
        ]);
        $ids = DB::table('rule_parameters')->pluck('id', 'code');
        foreach ($values as $code => $value) {
            DB::table('rule_values')->insert(['rule_version_id' => $versionId, 'parameter_id' => $ids[$code], 'value_json' => json_encode($value)]);
        }
        DB::table('matching_weights')->insert(['rule_version_id' => $versionId] + $weights);
    }
};
