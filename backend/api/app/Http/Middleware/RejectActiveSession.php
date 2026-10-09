<?php

namespace App\Http\Middleware;

use App\Shared\Http\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** D-43: el registro público solo se atiende sin sesión; se evalúa antes de validar el cuerpo. */
final class RejectActiveSession
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('web')->check()) {
            return ApiResponse::error('SESSION_ACTIVE', __('api.session_active'), 403);
        }

        return $next($request);
    }
}
