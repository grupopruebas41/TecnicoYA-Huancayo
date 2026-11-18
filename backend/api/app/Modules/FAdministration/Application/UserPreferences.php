<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Ajustes de accesibilidad con sus valores por omisión y las marcas de la bienvenida y del tutorial (D-97), comunes a
 * los tres roles desde la Fase T1 del panel del técnico (D-105). Lista blanca de claves; solo preferencias de uso.
 * Fase T5 (D-112): avisos de oferta del técnico (sonido, vibración, destello y voz) en users.offer_alert_prefs.
 */
final class UserPreferences
{
    public const TEXT_SIZES = [100, 115, 130, 150];

    public const DEFAULTS = [
        'text_size' => 100, 'high_contrast' => false, 'readable_font' => false, 'reduce_motion' => false,
        'strong_focus' => false, 'read_aloud' => false, 'dictation' => false, 'simple_mode' => false,
    ];

    /** D-112: el sonido, la vibración y la voz empiezan apagados; el destello, encendido (respeta «Reducir animaciones»). */
    public const OFFER_ALERTS = ['sound' => false, 'vibration' => false, 'flash' => true, 'speak' => false];

    public static function forUser(int $userId): array
    {
        $row = DB::table('users')->where('id', $userId)->first(['accessibility_prefs', 'onboarding_completed_at', 'tour_completed_at', 'offer_alert_prefs', 'role_id']);
        $saved = is_string($row?->accessibility_prefs) ? (json_decode($row->accessibility_prefs, true) ?: []) : [];
        $alerts = is_string($row?->offer_alert_prefs) ? (json_decode($row->offer_alert_prefs, true) ?: []) : [];
        $iso = fn ($value) => $value === null ? null : Carbon::parse($value)->toISOString();

        $prefs = [
            'accessibility' => array_intersect_key($saved, self::DEFAULTS) + self::DEFAULTS,
            'onboarding_completed_at' => $iso($row?->onboarding_completed_at),
            'tour_completed_at' => $iso($row?->tour_completed_at),
        ];
        // Los avisos de oferta solo existen en la cuenta de un técnico (el PUT los rechaza para los demás roles).
        if ($row !== null && DB::table('roles')->where('id', $row->role_id)->value('code') === 'technician') {
            $prefs['offer_alerts'] = array_intersect_key($alerts, self::OFFER_ALERTS) + self::OFFER_ALERTS;
        }

        return $prefs;
    }
}
