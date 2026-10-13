<?php

namespace App\Modules\FAdministration\Domain;

/**
 * Revisión automática de imágenes subidas (D-47): recorre la estructura del formato y quita los metadatos EXIF
 * sin volver a codificar la imagen (no depende de GD). Devuelve null si la estructura no es válida.
 * JPEG: segmentos APP1 «Exif». PNG: fragmento eXIf. WebP: fragmento EXIF y su bandera en VP8X.
 */
final class ImageSanitizer
{
    private const EXIF_HEADER = "Exif\0\0";

    private const PNG_SIGNATURE = "\x89PNG\r\n\x1a\n";

    public function clean(string $mimeType, string $bytes): ?string
    {
        return match ($mimeType) {
            'image/jpeg' => $this->jpeg($bytes),
            'image/png' => $this->png($bytes),
            'image/webp' => $this->webp($bytes),
            default => null,
        };
    }

    private function jpeg(string $bytes): ?string
    {
        $length = strlen($bytes);
        if (! str_starts_with($bytes, "\xFF\xD8")) {
            return null;
        }
        $out = "\xFF\xD8";
        $position = 2;
        while ($position + 4 <= $length) {
            if ($bytes[$position] !== "\xFF") {
                return null;
            }
            $marker = ord($bytes[$position + 1]);
            if ($marker === 0xDA) {
                // Inicio del barrido: el resto son datos comprimidos hasta EOI.
                return str_ends_with($bytes, "\xFF\xD9") ? $out.substr($bytes, $position) : null;
            }
            $size = unpack('n', $bytes, $position + 2)[1];
            if ($size < 2 || $position + 2 + $size > $length) {
                return null;
            }
            $segment = substr($bytes, $position, 2 + $size);
            $isExif = $marker === 0xE1 && substr($segment, 4, 6) === self::EXIF_HEADER;
            if (! $isExif) {
                $out .= $segment;
            }
            $position += 2 + $size;
        }

        return null;
    }

    private function png(string $bytes): ?string
    {
        $length = strlen($bytes);
        if (! str_starts_with($bytes, self::PNG_SIGNATURE)) {
            return null;
        }
        $out = self::PNG_SIGNATURE;
        $position = 8;
        while ($position + 12 <= $length) {
            $size = unpack('N', $bytes, $position)[1];
            $type = substr($bytes, $position + 4, 4);
            if ($position + 12 + $size > $length || ($position === 8 && $type !== 'IHDR')) {
                return null;
            }
            if ($type !== 'eXIf') {
                $out .= substr($bytes, $position, 12 + $size);
            }
            $position += 12 + $size;
            if ($type === 'IEND') {
                return $out;
            }
        }

        return null;
    }

    private function webp(string $bytes): ?string
    {
        $length = strlen($bytes);
        if ($length < 20 || ! str_starts_with($bytes, 'RIFF') || substr($bytes, 8, 4) !== 'WEBP'
            || unpack('V', $bytes, 4)[1] + 8 !== $length) {
            return null;
        }
        $chunks = '';
        $position = 12;
        while ($position + 8 <= $length) {
            $type = substr($bytes, $position, 4);
            $size = unpack('V', $bytes, $position + 4)[1];
            $padded = $size + ($size % 2);
            if ($position + 8 + $padded > $length) {
                return null;
            }
            $chunk = substr($bytes, $position, 8 + $padded);
            if ($type === 'VP8X') {
                // Bit 3 del primer byte de banderas: la imagen declara EXIF.
                $chunk[8] = chr(ord($chunk[8]) & ~0x08);
            }
            if ($type !== 'EXIF') {
                $chunks .= $chunk;
            }
            $position += 8 + $padded;
        }
        if ($position !== $length || $chunks === '') {
            return null;
        }

        return 'RIFF'.pack('V', strlen($chunks) + 4).'WEBP'.$chunks;
    }
}
