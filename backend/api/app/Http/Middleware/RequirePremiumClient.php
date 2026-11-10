<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/** Fase 6 (D-98): las funciones Premium se protegen en el servidor; un cliente free u otro rol recibe 403. */
final class RequirePremiumClient
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401, __('api.unauthenticated'));
        $role = DB::table('roles')->where('id', $user->role_id)->value('code');
        $plan = $role === 'client' ? DB::table('client_profiles')->where('user_id', $user->id)->value('plan') : null;
        abort_unless($plan === 'premium', 403, __('api.premium_only'));

        return $next($request);
    }
}
