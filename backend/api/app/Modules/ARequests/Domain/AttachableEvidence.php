<?php

namespace App\Modules\ARequests\Domain;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Evidencia adjuntable a una solicitud: archivo propio, privado, revisado, no retirado, que no esté en otra
 * solicitud ni sea un documento de verificación. Formatos y límites siguen pendientes de P17.
 */
final class AttachableEvidence implements ValidationRule
{
    public function __construct(private readonly int $ownerId) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $allowed = DB::table('media_files')->where('id', $value)->where('owner_id', $this->ownerId)
            ->where('visibility', 'private')->where('scan_status', 'clean')->whereNull('retired_at')->exists()
            && ! DB::table('request_attachments')->where('media_id', $value)->exists()
            && ! DB::table('technician_documents')->where('media_id', $value)->exists();
        if (! $allowed) {
            $fail(__('api.attachment_not_allowed'));
        }
    }
}
