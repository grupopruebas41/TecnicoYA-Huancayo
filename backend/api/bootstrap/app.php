<?php

use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\RejectActiveSession;
use App\Http\Middleware\RejectSuspendedTechnician;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\RequireRole;
use App\Shared\Http\ApiExceptionRenderer;
use App\Shared\Http\ApiResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php', health: '/health')
    // S4 (D-70): POST /api/v1/broadcasting/auth con la sesión de Sanctum para los canales privados de Reverb.
    ->withBroadcasting(__DIR__.'/../routes/channels.php', ['prefix' => 'api/v1', 'middleware' => ['api', 'auth:sanctum', 'account.active']])
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias([
            'account.active' => EnsureAccountIsActive::class,
            'permission' => RequirePermission::class,
            'role' => RequireRole::class,
            'session.none' => RejectActiveSession::class,
            'technician.not_suspended' => RejectSuspendedTechnician::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $r, Throwable $e) => true);
        // La «Referencia» que ve el usuario (meta.request_id) queda también en el log para rastrear el error.
        $exceptions->context(fn () => ['request_id' => ApiResponse::meta()['request_id']]);
        $exceptions->render(fn (Throwable $error, Request $request) => (new ApiExceptionRenderer)($error, $request));
    })->create();
