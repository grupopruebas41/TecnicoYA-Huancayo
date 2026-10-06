<?php

namespace Tests\Support;

use App\Models\User;
use Database\Factories\UserFactory;
use Illuminate\Support\Facades\DB;

/**
 * Datos sintéticos compartidos por las pruebas del Sprint 2.
 * Contrato: diseño técnico (tabla de API) y CANVAS-Sprint-02 RT-03.
 */
final class Sprint02
{
    /** Administrador con los permisos que la semilla concede al rol admin. */
    public static function admin(): User
    {
        return UserFactory::new()->state(fn () => [
            'name' => 'Administración de prueba',
            'role_id' => DB::table('roles')->where('code', 'admin')->value('id'),
        ])->create();
    }

    public static function specialtyId(string $code = 'computo'): int
    {
        return (int) DB::table('specialties')->where('code', $code)->value('id');
    }

    public static function subcategoryId(string $code = 'computo-hardware'): int
    {
        return (int) DB::table('subcategories')->where('code', $code)->value('id');
    }

    /** Ítems de una lista JSON con un valor dado en un campo. */
    public static function itemsWith(array $items, string $field, mixed $value): array
    {
        return array_values(array_filter($items, fn (array $item) => ($item[$field] ?? null) == $value));
    }
}
