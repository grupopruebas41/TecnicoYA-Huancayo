<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/** Contrato S4 §2, columna S: un técnico suspendido (D-32) recibe 403 aunque su cuenta siga activa. */
final class RejectSuspendedTechnician
{
    public function handle(Request $request, Closure $next): Response
    {
        $suspended = DB::table('technician_profiles')->where('user_id', $request->user()?->id)->where('status', 'suspended')->exists();
        abort_if($suspended, 403, __('api.forbidden'));

        return $next($request);
    }
}
