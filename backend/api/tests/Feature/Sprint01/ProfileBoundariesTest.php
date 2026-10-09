<?php

// S01-TC-064 a 070 · HU-S01-05 · RF-28, RF-33, RF-C06 · VAL-02 perfil y AUTH-01
// Valores límite y campos no editables de PATCH /me (CONTRATO-API.md §3.6).
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
    $this->user = UserFactory::new()->client()->create(['name' => 'Nombre inicial', 'phone' => '064 123456']);
    Sanctum::actingAs($this->user);
});

/** Comprueba que el perfil quedó exactamente como estaba. */
function s01ExpectProfileUnchanged(object $test): void
{
    $fresh = $test->user->fresh();
    expect($fresh->name)->toBe('Nombre inicial')
        ->and($fresh->phone)->toBe('064 123456')
        ->and($fresh->version)->toBe($test->user->version);
}

it('S01-TC-064 rechaza nombres de 1 y de 101 caracteres en el perfil sin cambiar la versión', function () {
    foreach ([1, 101] as $length) {
        $response = $this->patchJson('/api/v1/me', ['name' => str_repeat('n', $length), 'expected_version' => $this->user->version]);
        Sprint01::assertSpanishValidation($response, ['name']);
    }
    s01ExpectProfileUnchanged($this);
});

it('S01-TC-065 acepta un teléfono de 20 caracteres con prefijo, espacios, paréntesis y guion', function () {
    $phone = '+51 (064) 123-456789';
    expect(strlen($phone))->toBe(20);

    $this->patchJson('/api/v1/me', ['phone' => $phone, 'expected_version' => $this->user->version])
        ->assertOk()->assertJsonPath('data.phone', $phone);

    expect($this->user->fresh()->phone)->toBe($phone);
});

it('S01-TC-066 rechaza un teléfono de 21 caracteres', function () {
    $response = $this->patchJson('/api/v1/me', ['phone' => str_repeat('1', 21), 'expected_version' => $this->user->version]);
    Sprint01::assertSpanishValidation($response, ['phone']);
    s01ExpectProfileUnchanged($this);
});

it('S01-TC-067 rechaza un teléfono con letras', function () {
    $response = $this->patchJson('/api/v1/me', ['phone' => '064-ABC-123', 'expected_version' => $this->user->version]);
    Sprint01::assertSpanishValidation($response, ['phone']);
    expect($response->json('errors.phone.0'))->toContain('formato de teléfono no es válido');
    s01ExpectProfileUnchanged($this);
});

it('S01-TC-068 borra el teléfono cuando se envía nulo e incrementa la versión', function () {
    $this->patchJson('/api/v1/me', ['phone' => null, 'expected_version' => $this->user->version])
        ->assertOk()->assertJsonPath('data.phone', null)->assertJsonPath('data.version', $this->user->version + 1);

    expect($this->user->fresh()->phone)->toBeNull();
});

it('S01-TC-069 no permite cambiar correo, contraseña ni tipo de cuenta desde el perfil', function () {
    $hash = $this->user->fresh()->password;
    $password = Str::password(32);

    $response = $this->patchJson('/api/v1/me', [
        'email' => 'otro@example.test', 'password' => $password, 'password_confirmation' => $password,
        'account_type' => 'technician', 'expected_version' => $this->user->version,
    ]);

    Sprint01::assertSpanishValidation($response, ['email', 'password', 'account_type']);
    expect($response->json('errors.email.0'))->toContain('No está permitido modificar')
        ->and($this->user->fresh()->email)->toBe($this->user->email)
        ->and($this->user->fresh()->password)->toBe($hash);
    s01ExpectProfileUnchanged($this);
});

it('S01-TC-070 rechaza la edición del perfil sin expected_version [TC-010]', function () {
    $response = $this->patchJson('/api/v1/me', ['name' => 'Sin versión']);
    Sprint01::assertSpanishValidation($response, ['expected_version']);
    expect($response->json('errors.expected_version.0'))->toContain('versión del perfil');
    s01ExpectProfileUnchanged($this);
});
