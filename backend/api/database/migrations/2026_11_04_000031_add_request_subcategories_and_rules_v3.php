<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// D-95 (PEDIDO-02) y D-96 (MATCH-02): una solicitud por especialidad con varias subcategorías. service_requests.subcategory_id
// sigue siendo la principal (la primera marcada); la lista completa va en request_subcategories y solo existe en las
// solicitudes de un pedido. El pedido ya no tiene tope de rubros. Versión 3 de reglas, publicada por migración como la 2
// (D-63): copia de la v2 con max_active_orders_per_client = 3 en lugar del límite por solicitudes.
return new class extends Migration
{
    private const EFFECTIVE = '2026-11-04 00:00:00';

    public function up(): void
    {
        Schema::create('request_subcategories', function (Blueprint $table) {
            $table->foreignId('request_id')->constrained('service_requests')->cascadeOnDelete();
            $table->foreignId('subcategory_id')->constrained('subcategories')->restrictOnDelete();
            $table->unsignedSmallInteger('position');
            $table->primary(['request_id', 'subcategory_id']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE service_orders DROP CHECK service_orders_item_count_check');
            DB::statement('ALTER TABLE service_orders ADD CONSTRAINT service_orders_item_count_check CHECK (item_count >= 1)');
        }
        $this->publishVersionThree();
    }

    public function down(): void
    {
        $version = DB::table('rule_versions')->where('version_no', 3)->value('id');
        if ($version !== null) {
            DB::table('matching_weights')->where('rule_version_id', $version)->delete();
            DB::table('rule_values')->where('rule_version_id', $version)->delete();
            DB::table('rule_versions')->where('id', $version)->delete();
        }
        DB::table('rule_parameters')->where('code', 'max_active_orders_per_client')->delete();
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE service_orders DROP CHECK service_orders_item_count_check');
            DB::statement('ALTER TABLE service_orders ADD CONSTRAINT service_orders_item_count_check CHECK (item_count BETWEEN 1 AND 3)');
        }
        Schema::dropIfExists('request_subcategories');
    }

    private function publishVersionThree(): void
    {
        $previous = DB::table('rule_versions')->where('version_no', 2)->value('id');
        $values = DB::table('rule_values as v')->join('rule_parameters as p', 'p.id', '=', 'v.parameter_id')
            ->where('v.rule_version_id', $previous)->where('p.code', '<>', 'max_active_requests_per_client')->pluck('v.value_json', 'p.code')
            ->map(fn (string $json) => json_decode($json, flags: JSON_THROW_ON_ERROR))->all();
        DB::table('rule_parameters')->insert([
            'code' => 'max_active_orders_per_client', 'value_type' => 'integer', 'unit' => 'pedidos',
            'description' => 'Pedidos activos que un cliente puede tener a la vez; una solicitud sin pedido cuenta como uno (D-95).',
            'min_value' => 1, 'max_value' => null, 'required' => 1, 'editable' => 0,
        ]);
        $values['max_active_orders_per_client'] = 3;
        ksort($values);
        $weights = (array) DB::table('matching_weights')->where('rule_version_id', $previous)
            ->first(['proximity_weight', 'price_weight', 'history_weight', 'experience_weight']);
        $versionId = DB::table('rule_versions')->insertGetId([
            'version_no' => 3, 'status' => 'published', 'change_reason' => 'Límite de pedidos activos en lugar de solicitudes activas (D-95).',
            'effective_at' => self::EFFECTIVE, 'published_at' => self::EFFECTIVE,
            'content_hash' => hash('sha256', json_encode(['values' => $values, 'weights' => $weights], JSON_THROW_ON_ERROR)),
        ]);
        $ids = DB::table('rule_parameters')->pluck('id', 'code');
        foreach ($values as $code => $value) {
            DB::table('rule_values')->insert(['rule_version_id' => $versionId, 'parameter_id' => $ids[$code], 'value_json' => json_encode($value)]);
        }
        DB::table('matching_weights')->insert(['rule_version_id' => $versionId] + $weights);
    }
};
