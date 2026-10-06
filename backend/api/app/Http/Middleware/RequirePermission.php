<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Shared\Auth\EffectivePermissions;
use App\Shared\Http\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class RequirePermission
{
    public function __construct(private readonly EffectivePermissions $permissions) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401, __('api.unauthenticated'));
        if (! $this->permissions->allows($user, $permission)) {
            // Denegación sensible, sin cuerpos de peticiones ni credenciales.
            DB::table('audit_entries')->insert([
                'actor_id' => $user->id, 'actor_kind' => 'user', 'action' => 'permission.denied',
                'permission_used' => $permission, 'subject_type' => 'permission',
                'subject_id' => DB::table('permissions')->where('code', $permission)->value('id'),
                'reason' => 'El usuario no dispone del permiso solicitado.',
                'correlation_id' => ApiResponse::meta()['request_id'], 'occurred_at' => now(),
                'source_code' => 'RequirePermission',
            ]);
            abort(403, __('api.forbidden'));
        }

        return $next($request);
    }
}
