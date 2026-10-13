<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Support\Facades\DB;

/** Utilidades del catálogo administrable: códigos estables y cambios permitidos. */
final class CatalogCode
{
    /** Código estable: se numera (-2, -3…) si ya existe en la tabla. */
    public static function unique(string $table, string $base): string
    {
        $code = $base;
        for ($n = 2; DB::table($table)->where('code', $code)->exists(); $n++) {
            $code = $base.'-'.$n;
        }

        return $code;
    }

    /**
     * Cambios enviados, traducidos a columnas; los booleanos se guardan como 0/1.
     *
     * @param  array<string, string>  $editable  campo de la API => columna
     */
    public static function changes(array $data, array $editable): array
    {
        $changes = [];
        foreach ($editable as $field => $column) {
            if (array_key_exists($field, $data)) {
                $changes[$column] = is_bool($data[$field]) ? (int) $data[$field] : $data[$field];
            }
        }

        return $changes;
    }
}
