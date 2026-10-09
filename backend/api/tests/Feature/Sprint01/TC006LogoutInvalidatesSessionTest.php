<?php

// TC-006 · HU-S01-03 · RF-28 · AC-S01-03-02
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

/** Olvida la sesión en memoria para que la siguiente petición dependa solo de la cookie enviada. */
function forgetSprint01Session(): void
{
    app('auth')->forgetGuards();
    app('session')->forgetDrivers();
    app()->forgetInstance('session.store');
}

it('S01-TC-004 invalida la sesión al cerrar sesión y responde 401 si se reutiliza la cookie [TC-006]', function () {
    // Dado una sesión válida abierta mediante login real (sin actingAs)
    [, $payload] = Sprint01::registerThroughApi($this);
    $login = $this->postJson('/api/v1/auth/login', [
        'email' => $payload['email'],
        'password' => $payload['password'],
    ])->assertOk();
    $cookieName = config('session.cookie');
    $sessionCookie = collect($login->headers->getCookies())
        ->first(fn ($cookie) => $cookie->getName() === $cookieName);
    expect($sessionCookie)->not->toBeNull();
    $oldCookie = $sessionCookie->getValue();

    // Cuando cierra sesión
    forgetSprint01Session();
    $this->withUnencryptedCookie($cookieName, $oldCookie)
        ->postJson('/api/v1/auth/logout')
        ->assertNoContent();

    // Entonces reutilizar la cookie anterior en /me devuelve 401 con mensaje en español
    forgetSprint01Session();
    $response = $this->withUnencryptedCookie($cookieName, $oldCookie)->getJson('/api/v1/me');
    $response->assertUnauthorized();
    Sprint01::assertSpanishText((string) $response->json('message'));
});
