<?php

namespace Database\Factories;

use App\Models\MediaFile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Archivo sintético ya almacenado. Usar con Storage::fake(): no prueba la política de subida (P17),
 * solo el acceso y el uso de un archivo que ya existe.
 *
 * @extends Factory<MediaFile>
 */
class MediaFileFactory extends Factory
{
    protected $model = MediaFile::class;

    public function definition(): array
    {
        return [
            'owner_id' => fn () => UserFactory::new()->client()->create()->id,
            'disk' => 'local',
            'storage_key' => 'media/'.Str::uuid().'.bin',
            'original_name' => 'archivo-sintetico.bin',
            'mime_type' => 'application/octet-stream',
            'content' => 'CONTENIDO-SINTETICO-'.Str::random(12),
            'visibility' => 'private',
            'scan_status' => 'clean',
        ];
    }

    /** Imagen pública revisada (apta para catálogo o portafolio). */
    public function publicImage(): static
    {
        return $this->state(fn () => [
            'disk' => 'public', 'storage_key' => 'media/'.Str::uuid().'.png',
            'original_name' => 'imagen-sintetica.png', 'mime_type' => 'image/png', 'visibility' => 'public',
        ]);
    }

    /** Documento privado de verificación. */
    public function privateDocument(): static
    {
        return $this->state(fn () => [
            'disk' => 'local', 'storage_key' => 'documents/'.Str::uuid().'.pdf',
            'original_name' => 'documento-sintetico.pdf', 'mime_type' => 'application/pdf', 'visibility' => 'private',
            'purpose' => 'document',
        ]);
    }

    public function pendingScan(): static
    {
        return $this->state(fn () => ['scan_status' => 'pending']);
    }

    /** Escribe el contenido en el disco (falso en pruebas) y completa tamaño y huella. */
    public function configure(): static
    {
        return $this->afterMaking(function (MediaFile $media) {
            $content = $media->getAttribute('content');
            $media->offsetUnset('content');
            Storage::disk($media->disk)->put($media->storage_key, $content);
            $media->byte_size = strlen($content);
            $media->sha256 = hash('sha256', $content);
        });
    }
}
