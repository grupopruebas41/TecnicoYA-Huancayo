<?php

namespace App\Modules\FAdministration\Domain;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/** Archivo apto como documento de verificación: propio, privado, subido como documento, revisado y sin usar. */
final class DocumentFile implements ValidationRule
{
    public function __construct(private readonly int $ownerId) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $allowed = DB::table('media_files')->where('id', $value)->where('owner_id', $this->ownerId)
            ->where('visibility', 'private')->where('purpose', 'document')->where('scan_status', 'clean')->whereNull('retired_at')->exists()
            && ! DB::table('technician_documents')->where('media_id', $value)->exists();
        if (! $allowed) {
            $fail(__('api.document_not_allowed'));
        }
    }
}
