<?php

// S01-TC-086 · HU-S01-01 · RF-28, RF-33 · AUTH-01 registro-crear · D-43 (S01-A)
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S01-TC-086 rechaza el registro con una sesión abierta sin crear la cuenta ni cambiar la sesión', function () {
    // Dado un cliente con sesión SPA real
    $password = Str::password(32);
    $client = UserFactory::new()->client()->create(['password' => $password]);
    $cookie = Sprint01::loginThroughApi($this, $client->email, $password);
    $cookieName = config('session.cookie');
    $users = DB::table('users')->count();

    // Cuando intenta registrar otra cuenta con esa sesión
    Sprint01::forgetSession();
    $response = $this->withUnencryptedCookie($cookieName, $cookie)
        ->postJson('/api/v1/auth/register', Sprint01::registrationPayload('technician'));

    // Entonces recibe 403 SESSION_ACTIVE en español y no se crea nada
    $response->assertForbidden()->assertJsonPath('error.code', 'SESSION_ACTIVE')
        ->assertJsonPath('message', 'Ya tienes una sesión activa. Cierra sesión para crear otra cuenta.');
    expect(DB::table('users')->count())->toBe($users)
        ->and(DB::table('technician_profiles')->count())->toBe(0);

    // Y la sesión sigue siendo la del mismo cliente
    Sprint01::forgetSession();
    $this->withUnencryptedCookie($cookieName, $cookie)->getJson('/api/v1/me')
        ->assertOk()->assertJsonPath('data.id', (string) $client->id);
});
