<?php

namespace App\Shared\Http;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

final class ApiResponse
{
    public static function meta(): array
    {
        $request = request();
        if (! $request->attributes->has('request_id')) {
            $request->attributes->set('request_id', (string) Str::uuid());
        }

        return ['request_id' => $request->attributes->get('request_id'), 'server_time' => now()->toISOString()];
    }

    public static function data(array $data, int $status = 200): JsonResponse
    {
        return response()->json(['data' => $data, 'meta' => self::meta()], $status);
    }

    public static function error(string $code, string $message, int $status, array $fields = []): JsonResponse
    {
        // message/errors conservan el contrato S1 §6; error/meta también cumplen el diseño global.
        return response()->json([
            'message' => $message, 'errors' => (object) $fields,
            'error' => ['code' => $code, 'message' => $message, 'fields' => (object) $fields],
            'meta' => self::meta(),
        ], $status);
    }
}
