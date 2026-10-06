<?php

namespace App\Modules\FAdministration\Domain;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/** Imagen apta para el catálogo: existe, es pública, fue revisada (clean) y no está retirada. */
final class ReviewedImage implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $reviewed = DB::table('media_files')->where('id', $value)->where('visibility', 'public')
            ->where('scan_status', 'clean')->whereNull('retired_at')->exists();
        if (! $reviewed) {
            $fail(__('api.image_not_reviewed'));
        }
    }
}
