<?php

namespace App\Modules\ARequests\Domain;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/** El técnico elegido desde su perfil debe estar habilitado y ofrecer activamente la subcategoría pedida. */
final class TargetTechnicianOffers implements ValidationRule
{
    public function __construct(private readonly mixed $subcategoryId) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $offers = DB::table('technician_profiles as t')
            ->join('technician_services as s', 's.technician_id', '=', 't.id')
            ->where('t.id', $value)->where('t.status', 'active')
            ->where('s.subcategory_id', $this->subcategoryId)->where('s.active', 1)->exists();
        if (! $offers) {
            $fail(__('api.target_incompatible'));
        }
    }
}
