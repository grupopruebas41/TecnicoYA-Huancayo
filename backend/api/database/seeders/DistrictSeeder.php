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
    // Cierre S4-S5 (Sonar S1192): literales que se repetían.
    private const SAME_DISTRICT_KM = '1.000';

    /** D-15 y D-124: las 5 zonas del proyecto (Pilcomayo y Huancán desde el 2026-11-24). */
    private const DISTRICTS = ['HUANCAYO' => 'Huancayo', 'EL-TAMBO' => 'El Tambo', 'CHILCA' => 'Chilca', 'PILCOMAYO' => 'Pilcomayo',
        'HUANCAN' => 'Huancán'];

    /**
     * D-64: km por ruta en auto entre plazas principales (Google Maps), aprobados por el equipo; mismo distrito, 1 km.
     * D-124: los pares de Pilcomayo y Huancán con otros distritos no se inventan; faltan hasta que el equipo los consulte
     * y, mientras tanto, la cercanía no aporta al puntaje (C = 0, como en D-86).
     */
    private const DISTANCES = [
        ['HUANCAYO', 'EL-TAMBO', '3.500'], ['HUANCAYO', 'CHILCA', '2.500'], ['EL-TAMBO', 'CHILCA', '5.500'],
        ['HUANCAYO', 'HUANCAYO', self::SAME_DISTRICT_KM], ['EL-TAMBO', 'EL-TAMBO', self::SAME_DISTRICT_KM], ['CHILCA', 'CHILCA', self::SAME_DISTRICT_KM],
        ['PILCOMAYO', 'PILCOMAYO', self::SAME_DISTRICT_KM], ['HUANCAN', 'HUANCAN', self::SAME_DISTRICT_KM],
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
