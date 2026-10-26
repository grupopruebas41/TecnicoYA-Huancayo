<?php

namespace App\Modules\FAdministration\Domain;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Medidas de las imágenes del carrusel (D-83), comprobadas en el servidor sobre el archivo guardado. getimagesize
 * lee la cabecera del JPG o WebP sin GD. Principal: 3:1 de al menos 1440 × 480 (recomendado 1920 × 640). Móvil:
 * 3:2 de al menos 810 × 540 (recomendado 1080 × 720; el mínimo es el 75 % de la medida recomendada, como en la
 * principal). Se admite un 1 % de desviación en la proporción por el redondeo del recorte.
 */
final class AnnouncementImages
{
    public const SLOTS = [
        'main' => ['ratio' => 3.0, 'width' => 1440, 'height' => 480],
        'mobile' => ['ratio' => 1.5, 'width' => 810, 'height' => 540],
    ];

    private const RATIO_TOLERANCE = 0.01;

    public function valid(mixed $mediaId, string $slot): bool
    {
        $media = is_numeric($mediaId) ? DB::table('media_files')->where('id', (int) $mediaId)->where('purpose', 'announcement')
            ->where('scan_status', 'clean')->whereNull('retired_at')->first() : null;
        if (! $media) {
            return false;
        }
        $path = Storage::disk($media->disk)->path($media->storage_key);
        $size = is_file($path) ? @getimagesize($path) : false;
        if ($size === false || $size[1] === 0) {
            return false;
        }
        [$width, $height] = $size;
        $rule = self::SLOTS[$slot];

        return $width >= $rule['width'] && $height >= $rule['height']
            && abs($width / $height - $rule['ratio']) / $rule['ratio'] <= self::RATIO_TOLERANCE;
    }
}
