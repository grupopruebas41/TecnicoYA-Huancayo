<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * D-61 (MEDIA-02): el dueño retira una foto de evidencia que no está adjunta a ninguna solicitud. Solo aplica a
 * purpose=evidence; los demás archivos se retiran por su recurso. Ajena, ya retirada o de otra finalidad: 404.
 * El archivo se borra del disco después del commit, para no perderlo si la transacción se revierte.
 */
final class RetireEvidence
{
    public function __construct(private readonly AuditTrail $audit) {}

    public function execute(User $owner, int $mediaId): void
    {
        DB::transaction(function () use ($owner, $mediaId) {
            $file = DB::table('media_files')->where('id', $mediaId)->where('owner_id', $owner->id)
                ->where('purpose', 'evidence')->whereNull('retired_at')->lockForUpdate()->first();
            abort_unless($file, 404);
            if (DB::table('request_attachments')->where('media_id', $mediaId)->exists()) {
                throw new HttpResponseException(ApiResponse::error('MEDIA_LINKED', __('api.media_linked'), 409));
            }
            DB::table('media_files')->where('id', $mediaId)->update(['retired_at' => now(), 'updated_at' => now()]);
            $this->audit->record($owner, 'media.retired', null, 'media_file', $mediaId,
                'El dueño retiró una foto de evidencia no adjunta (D-61).', ['retired_at' => null], ['retired_at' => now()->toISOString()]);
            DB::afterCommit(fn () => Storage::disk($file->disk)->delete($file->storage_key));
        });
    }
}
