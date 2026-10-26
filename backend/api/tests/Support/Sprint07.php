<?php

namespace Tests\Support;

use Database\Seeders\CatalogSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Datos sintéticos del adelanto del Sprint 7 (D-73): registro detallado (D-80), recuperación de contraseña e imágenes
 * sintéticas para los comunicados en carrusel (D-83).
 */
final class Sprint07
{
    /** Distritos de D-15 y catálogo inicial; ambos seeders son idempotentes. */
    public static function catalog(): void
    {
        app(DistrictSeeder::class)->run();
        app(CatalogSeeder::class)->run();
    }

    public static function districtId(string $code = 'HUANCAYO'): int
    {
        return (int) DB::table('districts')->where('code', $code)->value('id');
    }

    public static function specialtyId(string $code = 'computo'): int
    {
        return (int) DB::table('specialties')->where('code', $code)->value('id');
    }

    /** Subcategorías activas de una especialidad, en orden de catálogo. */
    public static function subcategoryIds(string $specialty = 'computo', int $limit = 1): array
    {
        return DB::table('subcategories')->where('specialty_id', self::specialtyId($specialty))->where('active', 1)
            ->orderBy('display_order')->orderBy('id')->limit($limit)->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    /** Campos comunes a cliente y técnico (D-80). */
    private static function common(string $accountType): array
    {
        $password = Str::password(32);

        return [
            'given_names' => 'Ana Lucía', 'family_names' => 'Quispe Rojas',
            'email' => Str::uuid().'@example.test', 'phone' => '987654321',
            'password' => $password, 'password_confirmation' => $password,
            'account_type' => $accountType, 'terms_accepted' => true,
        ];
    }

    public static function clientPayload(array $overrides = []): array
    {
        self::catalog();

        return array_merge(self::common('client'), [
            'client_type' => 'household', 'district_id' => self::districtId(),
        ], $overrides);
    }

    public static function technicianPayload(array $overrides = []): array
    {
        self::catalog();

        return array_merge(self::common('technician'), [
            'base_district_id' => self::districtId('EL-TAMBO'),
            'district_ids' => [self::districtId('HUANCAYO')],
            'specialty_ids' => [self::specialtyId('computo')],
            // Al menos un rubro por especialidad declarada (D-80).
            'subcategory_ids' => self::subcategoryIds('computo'),
            'experience_years' => 4,
        ], $overrides);
    }

    /**
     * JPEG sintético con las medidas pedidas, armado por segmentos (SOI, SOF0, SOS, EOI) sin depender de GD:
     * getimagesize lee sus medidas en el SOF0 y ImageSanitizer lo acepta. $bytes rellena con comentarios (COM)
     * hasta el tamaño exacto; $exif agrega un segmento APP1 «Exif» para comprobar que se quita.
     */
    public static function jpeg(int $width, int $height, ?int $bytes = null, bool $exif = false): UploadedFile
    {
        $sof = "\xFF\xC0".pack('n', 17)."\x08".pack('nn', $height, $width)."\x03\x01\x22\x00\x02\x11\x01\x03\x11\x01";
        $sos = "\xFF\xDA".pack('n', 12)."\x03\x01\x00\x02\x11\x03\x11\x00\x3F\x00";
        $app1 = $exif ? "\xFF\xE1".pack('n', 2 + 6 + 8)."Exif\0\0".'MM'."\x00\x2A\x00\x00\x00\x08" : '';
        $tail = str_repeat("\x55", 64)."\xFF\xD9";
        $content = "\xFF\xD8".$app1.$sof.$sos.$tail;
        if ($bytes !== null) {
            $missing = $bytes - strlen($content);
            $padding = '';
            while ($missing > 0) {
                $segment = min($missing, 65537);
                if ($missing - $segment > 0 && $missing - $segment < 4) {
                    $segment -= 4;
                }
                $padding .= "\xFF\xFE".pack('n', $segment - 2).str_repeat('0', $segment - 4);
                $missing -= $segment;
            }
            $content = "\xFF\xD8".$padding.substr($content, 2);
        }
        $path = tempnam(sys_get_temp_dir(), 's07jpg');
        file_put_contents($path, $content);

        return new UploadedFile($path, "banner-{$width}x{$height}.jpg", null, null, true);
    }
}
