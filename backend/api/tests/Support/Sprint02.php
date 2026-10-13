<?php

namespace Tests\Support;

use App\Models\TechnicianProfile;
use App\Models\User;
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Factories\UserFactory;
use Illuminate\Http\UploadedFile;
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

    /** Quita un permiso al rol admin: los administradores de la prueba quedan sin esa capacidad. */
    public static function revokeFromAdminRole(string $permission): void
    {
        DB::table('role_permissions')
            ->where('role_id', DB::table('roles')->where('code', 'admin')->value('id'))
            ->where('permission_id', DB::table('permissions')->where('code', $permission)->value('id'))
            ->delete();
    }

    /** Archivo sintético de tests/fixtures/sprint02 como subida, con el nombre que enviaría el navegador. */
    public static function upload(string $fixture, ?string $clientName = null): UploadedFile
    {
        return new UploadedFile(base_path("tests/fixtures/sprint02/$fixture"), $clientName ?? $fixture, null, null, true);
    }

    /**
     * JPEG válido de exactamente $bytes bytes: segmentos de comentario (COM) de relleno tras el SOI.
     * Sirve para los valores límite de D-46 sin depender de GD.
     */
    public static function jpegOfSize(int $bytes): UploadedFile
    {
        $base = file_get_contents(base_path('tests/fixtures/sprint02/foto-con-exif.jpg'));
        $missing = $bytes - strlen($base);
        $padding = '';
        while ($missing > 0) {
            $segment = min($missing, 65537);
            if ($missing - $segment > 0 && $missing - $segment < 4) {
                $segment -= 4;
            }
            $padding .= "\xFF\xFE".pack('n', $segment - 2).str_repeat('0', $segment - 4);
            $missing -= $segment;
        }
        $path = tempnam(sys_get_temp_dir(), 's02jpg');
        file_put_contents($path, substr($base, 0, 2).$padding.substr($base, 2));

        return new UploadedFile($path, 'foto-limite.jpg', null, null, true);
    }

    /** Técnico pendiente con todos los requisitos de RN-24 (teléfono, servicio, zona, experiencia y documento). */
    public static function readyTechnician(): TechnicianProfile
    {
        $technician = TechnicianProfileFactory::new()->create();
        TechnicianServiceFactory::new()->create(['technician_id' => $technician->id]);
        DB::table('technician_districts')->insert(['technician_id' => $technician->id, 'district_id' => DistrictFactory::new()->create()->id]);
        TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id]);

        return $technician->refresh();
    }

    /** Versión vigente de una fila (para expected_version). */
    public static function version(string $table, int|string $id): int
    {
        return (int) DB::table($table)->where('id', $id)->value('version');
    }
}
