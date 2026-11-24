<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Distritos de D-15 y D-124 (las 5 zonas del proyecto) y su matriz de distancias de D-64, que vive en
 * data/district-distances.php: ahí se cargan los km de Pilcomayo y Huancán cuando el equipo los consulte (D-124).
 * Idempotente: no vuelve a crear ni pisa los cambios del administrador.
 */
class DistrictSeeder extends Seeder
{
    /** D-15 y D-124: las 5 zonas del proyecto (Pilcomayo y Huancán desde el 2026-11-24). */
    private const DISTRICTS = ['HUANCAYO' => 'Huancayo', 'EL-TAMBO' => 'El Tambo', 'CHILCA' => 'Chilca', 'PILCOMAYO' => 'Pilcomayo',
        'HUANCAN' => 'Huancán'];

    /** @return list<array{from: string, to: string, km: ?string, source: ?string, consulted_on: ?string}> */
    public static function distances(): array
    {
        return require __DIR__.'/data/district-distances.php';
    }

    public function run(): void
    {
        foreach (self::DISTRICTS as $code => $name) {
            DB::table('districts')->insertOrIgnore(['code' => $code, 'name' => $name]);
        }
        $this->seedDistances(self::distances());
    }

    /**
     * Inserta los pares con km (los pendientes, en null, se saltan) en orden canónico, sin pisar un par existente.
     * La fecha de consulta, si la hay, queda junto a la fuente.
     */
    public function seedDistances(array $rows): void
    {
        $ids = DB::table('districts')->whereIn('code', array_keys(self::DISTRICTS))->pluck('id', 'code');
        foreach ($rows as $row) {
            if ($row['km'] === null || ! isset($ids[$row['from']], $ids[$row['to']])) {
                continue;
            }
            $source = $row['source'].(($row['consulted_on'] ?? null) ? " ({$row['consulted_on']})" : '');
            DB::table('district_distances')->insertOrIgnore([
                'from_district_id' => min($ids[$row['from']], $ids[$row['to']]), 'to_district_id' => max($ids[$row['from']], $ids[$row['to']]),
                'km' => $row['km'], 'source' => $source,
            ]);
        }
    }
}
