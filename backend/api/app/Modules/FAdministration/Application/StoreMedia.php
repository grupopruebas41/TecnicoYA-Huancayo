<?php

namespace App\Modules\FAdministration\Application;

use App\Models\MediaFile;
use App\Models\User;
use App\Modules\FAdministration\Domain\ImageSanitizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Guarda un archivo ya validado (D-46, D-47): las imágenes pasan por ImageSanitizer (sin EXIF) y quedan
 * revisadas; portafolio y catálogo son públicos, y los documentos y las evidencias de solicitud, privados.
 * Si falla el registro, se borra el archivo para no dejar huérfanos en el disco.
 */
final class StoreMedia
{
    private const PRIVATE_PURPOSES = ['document', 'evidence'];

    private const EXTENSIONS = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'application/pdf' => 'pdf'];

    public function __construct(private readonly ImageSanitizer $images) {}

    public function store(User $owner, UploadedFile $file, string $purpose): MediaFile
    {
        $mimeType = (string) $file->getMimeType();
        $content = $file->getContent();
        if ($mimeType !== 'application/pdf') {
            $content = $this->images->clean($mimeType, $content)
                ?? throw ValidationException::withMessages(['file' => __('api.image_invalid')]);
        }
        $public = ! in_array($purpose, self::PRIVATE_PURPOSES, true);
        $disk = $public ? 'public' : 'local';
        $key = 'media/'.Str::uuid().'.'.self::EXTENSIONS[$mimeType];
        Storage::disk($disk)->put($key, $content);

        try {
            return MediaFile::query()->create([
                'owner_id' => $owner->id, 'disk' => $disk, 'storage_key' => $key,
                'original_name' => Str::limit(basename($file->getClientOriginalName()), 250, ''),
                'mime_type' => $mimeType, 'byte_size' => strlen($content), 'sha256' => hash('sha256', $content),
                'visibility' => $public ? 'public' : 'private', 'scan_status' => 'clean', 'purpose' => $purpose,
            ]);
        } catch (Throwable $error) {
            Storage::disk($disk)->delete($key);
            throw $error;
        }
    }
}
