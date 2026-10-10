<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Distritos semilla de D-15. Idempotente: no vuelve a crear ni pisa los cambios del administrador. */
class DistrictSeeder extends Seeder
{
    private const DISTRICTS = ['HUANCAYO' => 'Huancayo', 'EL-TAMBO' => 'El Tambo', 'CHILCA' => 'Chilca'];

    public function run(): void
    {
        foreach (self::DISTRICTS as $code => $name) {
            DB::table('districts')->insertOrIgnore(['code' => $code, 'name' => $name]);
        }
    }
}
