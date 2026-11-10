<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Ajustes de accesibilidad con sus valores por omisión y las marcas de la bienvenida y del tutorial (D-97), comunes a
 * los tres roles desde la Fase T1 del panel del técnico (D-105). Lista blanca de claves; solo preferencias de uso.
 */
final class UserPreferences
{
    public const TEXT_SIZES = [100, 115, 130, 150];

    public const DEFAULTS = [
        'text_size' => 100, 'high_contrast' => false, 'readable_font' => false, 'reduce_motion' => false,
        'strong_focus' => false, 'read_aloud' => false, 'dictation' => false, 'simple_mode' => false,
    ];

    public static function forUser(int $userId): array
    {
        $row = DB::table('users')->where('id', $userId)->first(['accessibility_prefs', 'onboarding_completed_at', 'tour_completed_at']);
        $saved = is_string($row?->accessibility_prefs) ? (json_decode($row->accessibility_prefs, true) ?: []) : [];
        $iso = fn ($value) => $value === null ? null : Carbon::parse($value)->toISOString();

        return [
            'accessibility' => array_intersect_key($saved, self::DEFAULTS) + self::DEFAULTS,
            'onboarding_completed_at' => $iso($row?->onboarding_completed_at),
            'tour_completed_at' => $iso($row?->tour_completed_at),
        ];
    }
}
