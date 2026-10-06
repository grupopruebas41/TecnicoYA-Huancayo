<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Shared\Auth\EffectivePermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAccountIsActive
{
    public function __construct(private readonly EffectivePermissions $permissions) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401, __('api.unauthenticated'));
        abort_unless($this->permissions->accountEnabled($user), 403, __('api.forbidden'));

        return $next($request);
    }
}
