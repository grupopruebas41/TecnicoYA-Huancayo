<?php

// S01-TC-046 a 054 · HU-S01-03 y HU-S01-05 · RF-28, RNF-09, RNF-11 · SEC-S01-02 y SEC-S01-04
// Sesión SPA: cuenta suspendida, enumeración, fijación, cookies, límite de intentos y CSRF (CONTRATO-API.md §1 y §3).
use App\Models\User;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
    $this->password = Str::password(32);
    $this->client = UserFactory::new()->client()->create(['password' => $this->password]);
});

it('S01-TC-046 no deja iniciar sesión a una cuenta suspendida y responde con el mensaje genérico [TC-005]', function () {
    $this->client->forceFill(['is_active' => false])->save();

    $suspended = $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => $this->password]);
    $wrong = $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => 'otra-clave-123']);

    $suspended->assertUnauthorized()->assertJsonPath('error.code', 'INVALID_CREDENTIALS');
    expect($suspended->json('message'))->toBe($wrong->json('message'))
        ->and($suspended->json('message'))->toBe('El correo o la contraseña no son válidos.');
    $this->assertGuest('web');
});

it('S01-TC-047 responde igual a un correo inexistente y a una contraseña incorrecta', function () {
    $unknown = $this->postJson('/api/v1/auth/login', ['email' => 'nadie@example.test', 'password' => $this->password]);
    $wrong = $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => 'otra-clave-123']);

    expect($unknown->status())->toBe(401)->toBe($wrong->status())
        ->and($unknown->json('error'))->toBe($wrong->json('error'))
        ->and(array_keys($unknown->json()))->toBe(array_keys($wrong->json()));
});

it('S01-TC-048 regenera el identificador de sesión al iniciar sesión', function () {
    // Dado una sesión anónima con cookie
    $anonymous = $this->get('/sanctum/csrf-cookie')->assertNoContent();
    $cookieName = config('session.cookie');
    $anonymousCookie = collect($anonymous->headers->getCookies())->first(fn ($c) => $c->getName() === $cookieName)->getValue();
    $anonymousId = app('session.store')->getId();

    // Cuando inicia sesión con esa cookie
    Sprint01::forgetSession();
    $this->withUnencryptedCookie($cookieName, $anonymousCookie)
        ->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => $this->password])->assertOk();

    // Entonces la sesión autenticada tiene otro identificador y la cookie anterior no queda autenticada
    expect(app('session.store')->getId())->not->toBe($anonymousId);
    Sprint01::forgetSession();
    $this->withUnencryptedCookie($cookieName, $anonymousCookie)->getJson('/api/v1/me')->assertUnauthorized();
});

it('S01-TC-049 emite la cookie de sesión HttpOnly con SameSite=Lax y deja legible XSRF-TOKEN', function () {
    $login = $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => $this->password])->assertOk();
    $cookies = collect($login->headers->getCookies())->keyBy(fn ($c) => $c->getName());

    $session = $cookies->get(config('session.cookie'));
    $xsrf = $cookies->get('XSRF-TOKEN');
    expect($session)->not->toBeNull()
        ->and($session->isHttpOnly())->toBeTrue()
        ->and(strtolower((string) $session->getSameSite()))->toBe('lax')
        ->and($xsrf)->not->toBeNull()
        ->and($xsrf->isHttpOnly())->toBeFalse();
});

it('S01-TC-050 responde 429 en español al intento siguiente al límite aunque las credenciales sean válidas', function () {
    config(['security.auth_attempts_per_minute' => 3]);
    foreach (range(1, 3) as $attempt) {
        $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => 'otra-clave-123'])->assertUnauthorized();
    }

    $blocked = $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => $this->password]);

    $blocked->assertStatus(429)->assertJsonPath('error.code', 'TOO_MANY_REQUESTS')->assertHeader('Retry-After');
    expect($blocked->json('message'))->toBe('Hay demasiados intentos. Espera antes de volver a intentarlo.');
    $this->assertGuest('web');
});

it('S01-TC-051 restablece el límite de intentos después del minuto', function () {
    config(['security.auth_attempts_per_minute' => 3]);
    foreach (range(1, 3) as $attempt) {
        $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => 'otra-clave-123']);
    }
    $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => $this->password])->assertStatus(429);

    $this->travel(61)->seconds();

    $this->postJson('/api/v1/auth/login', ['email' => $this->client->email, 'password' => $this->password])
        ->assertOk()->assertJsonPath('data.id', (string) $this->client->id);
});

it('S01-TC-052 rechaza PATCH /me sin token CSRF y no cambia el perfil', function () {
    // Laravel omite la verificación CSRF en pruebas; se activa la del middleware real solo en este caso.
    $this->app->bind(ValidateCsrfToken::class, fn ($app) => new class($app, $app['encrypter']) extends ValidateCsrfToken
    {
        protected function runningUnitTests()
        {
            return false;
        }
    });
    Sanctum::actingAs($this->client);

    $response = $this->patchJson('/api/v1/me', ['name' => 'Cambio sin token', 'expected_version' => $this->client->version]);

    $response->assertStatus(419)->assertJsonPath('error.code', 'SESSION_EXPIRED');
    Sprint01::assertSpanishText((string) $response->json('message'));
    expect($this->client->fresh()->name)->toBe('Usuario de prueba')
        ->and($this->client->fresh()->version)->toBe($this->client->version);
});

it('S01-TC-053 responde 401 en español al cerrar sesión sin sesión', function () {
    $response = $this->postJson('/api/v1/auth/logout');
    $response->assertUnauthorized()->assertJsonPath('error.code', 'UNAUTHENTICATED');
    Sprint01::assertSpanishText((string) $response->json('message'));
});

it('S01-TC-054 permite a una cuenta suspendida cerrar su sesión e invalida la cookie', function () {
    $cookie = Sprint01::loginThroughApi($this, $this->client->email, $this->password);
    User::query()->whereKey($this->client->id)->update(['is_active' => false]);
    $cookieName = config('session.cookie');

    Sprint01::forgetSession();
    $this->withUnencryptedCookie($cookieName, $cookie)->postJson('/api/v1/auth/logout')->assertNoContent();

    Sprint01::forgetSession();
    $this->withUnencryptedCookie($cookieName, $cookie)->getJson('/api/v1/me')->assertUnauthorized();
});
