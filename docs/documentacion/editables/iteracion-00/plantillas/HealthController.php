<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

final class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            // Comprueba también las credenciales de la aplicación, no solo el proceso MySQL.
            DB::select('SELECT 1');

            return response()->json(['status' => 'ok', 'database' => 'up']);
        } catch (Throwable) {
            // No exponer DSN, credenciales, SQL ni trazas a un visitante.
            return response()->json(['status' => 'degraded', 'database' => 'down'], 503);
        }
    }
}
