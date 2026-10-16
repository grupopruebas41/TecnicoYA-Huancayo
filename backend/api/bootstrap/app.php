<?php

use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\RejectActiveSession;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\RequireRole;
use App\Shared\Http\ApiExceptionRenderer;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php', health: '/health')
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->alias([
            'account.active' => EnsureAccountIsActive::class,
            'permission' => RequirePermission::class,
            'role' => RequireRole::class,
            'session.none' => RejectActiveSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $r, Throwable $e) => true);
        $exceptions->render(fn (Throwable $error, Request $request) => (new ApiExceptionRenderer)($error, $request));
    })->create();
