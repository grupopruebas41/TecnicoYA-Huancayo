<?php

namespace App\Modules\FAdministration\Domain;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/** Imagen de portafolio: propia, pública, revisada, no retirada y que no sea un documento de verificación. */
final class PortfolioImage implements ValidationRule
{
    public function __construct(private readonly int $ownerId) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $allowed = DB::table('media_files')->where('id', $value)->where('owner_id', $this->ownerId)
            ->where('visibility', 'public')->where('scan_status', 'clean')->whereNull('retired_at')->exists()
            && ! DB::table('technician_documents')->where('media_id', $value)->exists();
        if (! $allowed) {
            $fail(__('api.media_not_allowed'));
        }
    }
}
