<?php

namespace App\Providers;

use App\Modules\CNotifications\Application\DeliveryChannel;
use App\Modules\CNotifications\Application\MailSandboxChannel;
use App\Shared\Database\DestructiveCommandGuard;
use App\Shared\Testing\E2EClock;
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
        // S4: el canal externo de las notificaciones es el correo de sandbox; las pruebas lo sustituyen.
        $this->app->bind(DeliveryChannel::class, MailSandboxChannel::class);
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
        // v1 usa exclusivamente cookies SPA, no expide ni acepta tokens personales.
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);
        RateLimiter::for('spa-auth', fn (Request $request) => Limit::perMinute(
            max(1, (int) config('security.auth_attempts_per_minute'))
        )->by($request->ip()));
        if (E2EClock::enabled()) {
            E2EClock::install(); // S4: reloj del servidor que adelanta la tarea serverClock de Cypress
        }
        if ($this->app->runningInConsole()) {
            $input = new ArgvInput;
            $this->app->make(DestructiveCommandGuard::class)
                ->check((string) $input->getFirstArgument(), $input->getParameterOption('--database') ?: null); // DEF-45
        }

    }
}
