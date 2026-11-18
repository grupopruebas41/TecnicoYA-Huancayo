<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Panel del técnico, Fase T4: orden del portafolio elegido por el técnico (PATCH /technicians/me/portfolio/order).
// El valor inicial sigue el orden que ya se mostraba: lo más reciente primero (created_at y luego id, de mayor a menor),
// numerado desde 1 por técnico. Corre igual en MySQL y en SQLite.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('portfolio_items', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0);
            $table->index(['technician_id', 'position']);
        });
        $position = [];
        DB::table('portfolio_items')->orderBy('technician_id')->orderByDesc('created_at')->orderByDesc('id')
            ->get(['id', 'technician_id'])->each(function (object $item) use (&$position) {
                $position[$item->technician_id] = ($position[$item->technician_id] ?? 0) + 1;
                DB::table('portfolio_items')->where('id', $item->id)->update(['position' => $position[$item->technician_id]]);
            });
    }

    public function down(): void
    {
        Schema::table('portfolio_items', function (Blueprint $table) {
            $table->dropIndex(['technician_id', 'position']);
            $table->dropColumn('position');
        });
    }
};
