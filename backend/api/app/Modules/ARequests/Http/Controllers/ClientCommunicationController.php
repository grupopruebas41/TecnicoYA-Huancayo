<?php

namespace App\Modules\ARequests\Http\Controllers;

use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Fase 4 del panel final: preferencias de comunicación del cliente («Prefiero mensajes», «Avisar antes de llegar»).
 * Lista blanca de claves; nunca datos de salud ni de discapacidad (Ley 29733).
 */
final class ClientCommunicationController
{
    public const DEFAULTS = ['contact_channel' => 'app', 'notify_before_arrival' => true, 'prefer_messages' => false];

    public function show(Request $request): JsonResponse
    {
        return ApiResponse::data($this->read((int) $request->user()->id));
    }

    public function update(Request $request): JsonResponse
    {
        $allowed = array_keys(self::DEFAULTS);
        $data = $request->validate([
            'contact_channel' => ['required', Rule::in(['app', 'call', 'whatsapp'])],
            'notify_before_arrival' => ['required', 'boolean'],
            'prefer_messages' => ['required', 'boolean'],
        ], ['contact_channel.in' => __('api.contact_channel'), 'contact_channel.required' => __('api.contact_channel')]);
        $unknown = array_diff(array_keys($request->all()), $allowed);
        if ($unknown !== []) {
            return ApiResponse::error('VALIDATION_FAILED', __('api.filter_not_allowed'), 422,
                array_fill_keys(array_values($unknown), [__('api.filter_not_allowed')]));
        }
        $prefs = ['contact_channel' => $data['contact_channel'], 'notify_before_arrival' => (bool) $data['notify_before_arrival'],
            'prefer_messages' => (bool) $data['prefer_messages']];
        DB::table('client_profiles')->where('user_id', $request->user()->id)->update(['communication_prefs' => json_encode($prefs), 'updated_at' => now()]);

        return ApiResponse::data($prefs);
    }

    private function read(int $userId): array
    {
        $raw = DB::table('client_profiles')->where('user_id', $userId)->value('communication_prefs');
        $saved = is_string($raw) ? (json_decode($raw, true) ?: []) : [];

        return array_intersect_key($saved, self::DEFAULTS) + self::DEFAULTS;
    }
}
