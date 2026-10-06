<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/** Restringe una ruta a un rol (por roles.code). La propiedad del recurso se valida en cada caso de uso. */
final class RequireRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401, __('api.unauthenticated'));
        abort_unless(DB::table('roles')->where('id', $user->role_id)->value('code') === $role, 403, __('api.forbidden'));

        return $next($request);
    }
}
