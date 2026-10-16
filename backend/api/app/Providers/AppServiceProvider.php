<?php

namespace App\Providers;

use App\Shared\Database\DestructiveCommandGuard;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\Console\Input\ArgvInput;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Sin registros propios: los servicios de la aplicación se resuelven por inyección automática.
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
        // v1 usa exclusivamente cookies SPA, no expide ni acepta tokens personales.
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);
        RateLimiter::for('spa-auth', fn (Request $request) => Limit::perMinute(
            max(1, (int) config('security.auth_attempts_per_minute'))
        )->by($request->ip()));
        if ($this->app->runningInConsole()) {
            $input = new ArgvInput;
            $this->app->make(DestructiveCommandGuard::class)
                ->check((string) $input->getFirstArgument(), $input->getParameterOption('--database') ?: null); // DEF-45
        }

    }
}
