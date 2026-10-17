<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Models\MediaFile;
use App\Models\User;
use App\Modules\FAdministration\Application\RetireEvidence;
use App\Modules\FAdministration\Application\StoreMedia;
use App\Modules\FAdministration\Http\Requests\StoreMediaRequest;
use App\Shared\Auth\EffectivePermissions;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Descarga de archivos. Las imágenes públicas revisadas son libres; los archivos privados solo para su
 * propietario o, si es un documento de verificación, para quien tiene technicians.verify. En cualquier otro
 * caso responde 404 para no revelar que el archivo existe.
 */
final class MediaController
{
    public function __construct(private readonly EffectivePermissions $permissions) {}

    public function store(StoreMediaRequest $request, StoreMedia $media): JsonResponse
    {
        $file = $media->store($request->user(), $request->file('file'), $request->validated('purpose'));

        return ApiResponse::data([
            'id' => $file->id, 'purpose' => $file->purpose, 'visibility' => $file->visibility,
            'mime_type' => $file->mime_type, 'byte_size' => $file->byte_size, 'url' => url("/api/v1/media/{$file->id}"),
        ], 201);
    }

    public function retire(Request $request, int $media, RetireEvidence $evidence): Response
    {
        $evidence->execute($request->user(), $media);

        return response()->noContent();
    }

    public function show(int $media): StreamedResponse
    {
        $file = MediaFile::query()->whereNull('retired_at')->find($media);
        abort_unless($file && $this->canRead($file, auth('sanctum')->user()), 404);

        return Storage::disk($file->disk)->response($file->storage_key, $file->original_name, [
            'Content-Type' => $file->mime_type, 'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function canRead(MediaFile $file, ?User $user): bool
    {
        if ($file->visibility === 'public' && $file->scan_status === 'clean') {
            return true;
        }
        if (! $user || ! $this->permissions->accountEnabled($user)) {
            return false;
        }
        if ($file->owner_id === $user->id) {
            return true;
        }

        return DB::table('technician_documents')->where('media_id', $file->id)->exists()
            && $this->permissions->allows($user, 'technicians.verify');
    }
}
