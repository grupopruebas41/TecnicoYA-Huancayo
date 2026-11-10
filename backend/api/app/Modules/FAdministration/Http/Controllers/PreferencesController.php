<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\FAdministration\Application\UserPreferences;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * GET y PUT /me/preferences para los tres roles (D-105); /client/me/preferences (D-97) usa el mismo controlador. El PUT
 * acepta ajustes parciales de la lista blanca y las marcas onboarding_completed y tour_completed, que se fijan una sola
 * vez. Cualquier otra clave, como datos de salud o la tarjeta elegida, se rechaza y no se guarda.
 */
final class PreferencesController
{
    public function show(Request $request): JsonResponse
    {
        return ApiResponse::data(UserPreferences::forUser((int) $request->user()->id));
    }

    public function update(Request $request): JsonResponse
    {
        $flags = array_keys(UserPreferences::DEFAULTS);
        $rules = ['accessibility' => ['sometimes', 'array'], 'accessibility.text_size' => ['sometimes', 'integer', Rule::in(UserPreferences::TEXT_SIZES)],
            'onboarding_completed' => ['sometimes', 'accepted'], 'tour_completed' => ['sometimes', 'accepted']];
        foreach (array_diff($flags, ['text_size']) as $flag) {
            $rules["accessibility.$flag"] = ['sometimes', 'boolean'];
        }
        $data = $request->validate($rules, [
            'accessibility.text_size.in' => __('api.text_size'), 'accessibility.*.boolean' => __('api.preference_boolean'),
            'onboarding_completed.accepted' => __('api.preference_flag'), 'tour_completed.accepted' => __('api.preference_flag'),
        ]);
        $unknown = array_merge(
            array_diff(array_keys($request->all()), ['accessibility', 'onboarding_completed', 'tour_completed']),
            array_map(fn ($key) => "accessibility.$key", array_diff(array_keys((array) $request->input('accessibility', [])), $flags)),
        );
        if ($unknown !== []) {
            return ApiResponse::error('VALIDATION_FAILED', __('api.preference_unknown'), 422,
                array_fill_keys(array_values($unknown), [__('api.preference_unknown')]));
        }
        $userId = (int) $request->user()->id;
        DB::transaction(function () use ($userId, $data) {
            $row = DB::table('users')->where('id', $userId)->lockForUpdate()->first(['id', 'onboarding_completed_at', 'tour_completed_at']);
            $changes = [];
            if (isset($data['accessibility'])) {
                $next = array_merge(UserPreferences::forUser($userId)['accessibility'], $data['accessibility']);
                $next['text_size'] = (int) $next['text_size'];
                foreach (array_diff(array_keys($next), ['text_size']) as $flag) {
                    $next[$flag] = filter_var($next[$flag], FILTER_VALIDATE_BOOLEAN);
                }
                $changes['accessibility_prefs'] = json_encode($next);
            }
            if (! empty($data['onboarding_completed']) && $row->onboarding_completed_at === null) {
                $changes['onboarding_completed_at'] = now();
            }
            if (! empty($data['tour_completed']) && $row->tour_completed_at === null) {
                $changes['tour_completed_at'] = now();
            }
            if ($changes !== []) {
                DB::table('users')->where('id', $userId)->update($changes);
            }
        });

        return ApiResponse::data(UserPreferences::forUser($userId));
    }
}
