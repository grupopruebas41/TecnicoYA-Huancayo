<?php

namespace Tests\Support;

use Illuminate\Http\UploadedFile;

/** Apoyo de las pruebas del Sprint 7 (adelanto del panel). */
final class Sprint07
{
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
