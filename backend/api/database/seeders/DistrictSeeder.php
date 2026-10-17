<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Distritos semilla de D-15 y su matriz de distancias de D-64. Idempotente: no vuelve a crear ni pisa los cambios
 * del administrador.
 */
class DistrictSeeder extends Seeder
{
    private const DISTRICTS = ['HUANCAYO' => 'Huancayo', 'EL-TAMBO' => 'El Tambo', 'CHILCA' => 'Chilca'];

    /** D-64: km por ruta en auto entre plazas principales (Google Maps), aprobados por el equipo; mismo distrito, 1 km. */
    private const DISTANCES = [
        ['HUANCAYO', 'EL-TAMBO', '3.500'], ['HUANCAYO', 'CHILCA', '2.500'], ['EL-TAMBO', 'CHILCA', '5.500'],
        ['HUANCAYO', 'HUANCAYO', '1.000'], ['EL-TAMBO', 'EL-TAMBO', '1.000'], ['CHILCA', 'CHILCA', '1.000'],
    ];

    private const SOURCE = 'Google Maps, ruta en auto entre plazas principales (D-64)';

    public function run(): void
    {
        foreach (self::DISTRICTS as $code => $name) {
            DB::table('districts')->insertOrIgnore(['code' => $code, 'name' => $name]);
        }
        $ids = DB::table('districts')->whereIn('code', array_keys(self::DISTRICTS))->pluck('id', 'code');
        foreach (self::DISTANCES as [$from, $to, $km]) {
            DB::table('district_distances')->insertOrIgnore([
                'from_district_id' => min($ids[$from], $ids[$to]), 'to_district_id' => max($ids[$from], $ids[$to]),
                'km' => $km, 'source' => self::SOURCE,
            ]);
        }
    }
}
