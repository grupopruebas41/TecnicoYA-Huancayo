<?php

namespace App\Modules\FAdministration\Domain;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/** Una subcategoría solo se ofrece si ella y su especialidad están activas (RN-27). */
final class ActiveSubcategory implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $active = DB::table('subcategories as s')->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->where('s.id', $value)->where('s.active', 1)->where('p.active', 1)->exists();
        if (! $active) {
            $fail(__('api.subcategory_inactive'));
        }
    }
}
