<?php

namespace App\Providers;

use App\Modules\BMatching\Suggestions\KeywordProvider;
use App\Modules\BMatching\Suggestions\LlmProvider;
use App\Modules\BMatching\Suggestions\SuggestionProvider;
use App\Modules\CNotifications\Application\DeliveryChannel;
use App\Modules\CNotifications\Application\MailSandboxChannel;
use App\Modules\FAdministration\Application\PasswordResetLink;
use App\Shared\Database\DestructiveCommandGuard;
use App\Shared\Testing\E2EClock;
use Illuminate\Auth\Notifications\ResetPassword;
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
        // D-94: la IA del buscador solo existe si AI_PROVIDER, AI_API_KEY y AI_MODEL están completos; si no, el diccionario.
        $this->app->bind(SuggestionProvider::class, function ($app) {
            $llm = LlmProvider::fromConfig();

            return $llm->enabled() ? $llm : $app->make(KeywordProvider::class);
        });
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
        // v1 usa exclusivamente cookies SPA, no expide ni acepta tokens personales.
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);
        RateLimiter::for('spa-auth', fn (Request $request) => Limit::perMinute(
            max(1, (int) config('security.auth_attempts_per_minute'))
        )->by($request->ip()));
        // D-80: límite del pedido de enlace por IP y por correo; el enlace apunta a la SPA y el correo va en español.
        RateLimiter::for('password-forgot', fn (Request $request) => [
            Limit::perMinute(max(1, (int) config('security.password_reset_per_ip_per_minute')))->by('ip:'.$request->ip()),
            Limit::perMinutes(15, max(1, (int) config('security.password_reset_per_email_per_15_minutes')))
                ->by('email:'.mb_strtolower(trim((string) $request->input('email')))),
        ]);
        RateLimiter::for('catalog-suggestions', fn (Request $request) => Limit::perMinute(
            max(1, (int) config('security.suggestions_per_minute'))
        )->by('suggest:'.$request->ip()));
        ResetPassword::createUrlUsing(fn ($user, string $token) => PasswordResetLink::url($user, $token));
        ResetPassword::toMailUsing(fn ($user, string $token) => PasswordResetLink::mail($user, $token));
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
