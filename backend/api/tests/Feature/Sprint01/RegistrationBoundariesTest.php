<?php

// S01-TC-034 a 045 · HU-S01-01 y HU-S01-02 · RF-28, RNF-08 · VAL-02 registro
// Valores límite y particiones del registro público (CATALOGO-S01.csv; CONTRATO-API.md §3.2).
use App\Models\User;
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

/** Correo sintético válido con la longitud total indicada. */
function s01EmailOfLength(int $length): string
{
    $domain = '@example.test';

    return str_repeat('a', $length - strlen($domain)).$domain;
}

/** Comprueba que no quedó ningún usuario ni perfil después de un rechazo. */
function s01ExpectNoAccountCreated(): void
{
    expect(DB::table('users')->count())->toBe(0)
        ->and(DB::table('client_profiles')->count())->toBe(0)
        ->and(DB::table('technician_profiles')->count())->toBe(0);
}

it('S01-TC-034 acepta nombres de 2 y de 100 caracteres en el registro [TC-001]', function () {
    foreach ([2, 100] as $length) {
        $payload = ['name' => str_repeat('n', $length)] + Sprint01::registrationPayload();
        $this->postJson('/api/v1/auth/register', $payload)->assertCreated();
        expect(User::query()->where('email', $payload['email'])->value('name'))->toBe(str_repeat('n', $length));
    }
});

it('S01-TC-035 rechaza nombres de 1 y de 101 caracteres sin crear usuario ni perfil', function () {
    foreach ([1, 101] as $length) {
        $payload = ['name' => str_repeat('n', $length)] + Sprint01::registrationPayload();
        Sprint01::assertSpanishValidation($this->postJson('/api/v1/auth/register', $payload), ['name']);
    }
    s01ExpectNoAccountCreated();
});

it('S01-TC-036 acepta una contraseña de 8 caracteres y otra de 72 bytes y ambas sirven para iniciar sesión', function () {
    foreach ([Str::random(8), str_repeat('ñ', 36)] as $password) { // 36 × «ñ» = 72 bytes
        $payload = ['password' => $password, 'password_confirmation' => $password] + Sprint01::registrationPayload();
        $this->postJson('/api/v1/auth/register', $payload)->assertCreated();
        $this->postJson('/api/v1/auth/login', ['email' => $payload['email'], 'password' => $password])->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        Sprint01::forgetSession();
    }
});

it('S01-TC-037 rechaza una contraseña de 7 caracteres', function () {
    $password = Str::random(7);
    $payload = ['password' => $password, 'password_confirmation' => $password] + Sprint01::registrationPayload();
    $response = $this->postJson('/api/v1/auth/register', $payload);
    Sprint01::assertSpanishValidation($response, ['password']);
    expect($response->json('errors.password.0'))->toContain('al menos 8 caracteres');
    s01ExpectNoAccountCreated();
});

it('S01-TC-038 rechaza una contraseña de más de 72 bytes aunque tenga menos de 72 caracteres', function () {
    foreach ([str_repeat('ñ', 37), str_repeat('a', 73)] as $password) { // 37 caracteres = 74 bytes; 73 bytes ASCII
        $payload = ['password' => $password, 'password_confirmation' => $password] + Sprint01::registrationPayload();
        $response = $this->postJson('/api/v1/auth/register', $payload);
        Sprint01::assertSpanishValidation($response, ['password']);
        expect($response->json('errors.password'))->toContain('La contraseña no debe superar 72 bytes.');
    }
    s01ExpectNoAccountCreated();
});

it('S01-TC-039 rechaza una confirmación de contraseña distinta', function () {
    $payload = ['password_confirmation' => Str::password(32)] + Sprint01::registrationPayload();
    $response = $this->postJson('/api/v1/auth/register', $payload);
    Sprint01::assertSpanishValidation($response, ['password']);
    expect($response->json('errors.password.0'))->toContain('no coincide');
    s01ExpectNoAccountCreated();
});

it('S01-TC-040 acepta un correo de 254 caracteres y lo guarda completo', function () {
    $email = s01EmailOfLength(254);
    $this->postJson('/api/v1/auth/register', ['email' => $email] + Sprint01::registrationPayload())->assertCreated();
    expect(User::query()->value('email'))->toBe($email);
});

it('S01-TC-041 rechaza un correo de 255 caracteres', function () {
    $response = $this->postJson('/api/v1/auth/register', ['email' => s01EmailOfLength(255)] + Sprint01::registrationPayload());
    Sprint01::assertSpanishValidation($response, ['email']);
    s01ExpectNoAccountCreated();
});

it('S01-TC-042 normaliza el correo al guardarlo y permite iniciar sesión con otra capitalización [TC-002]', function () {
    $payload = ['email' => '  Ana.Prueba@Example.TEST '] + Sprint01::registrationPayload();
    $this->postJson('/api/v1/auth/register', $payload)->assertCreated();
    expect(User::query()->value('email'))->toBe('ana.prueba@example.test');

    $this->postJson('/api/v1/auth/login', ['email' => 'ANA.prueba@example.test', 'password' => $payload['password']])
        ->assertOk()->assertJsonPath('data.role.code', 'client');
});

it('S01-TC-043 rechaza al cliente sin tipo de cliente o con un tipo fuera del dominio', function () {
    $missing = Sprint01::registrationPayload();
    unset($missing['client_type']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/auth/register', $missing), ['client_type']);

    $outside = ['client_type' => 'empresa'] + Sprint01::registrationPayload();
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/auth/register', $outside), ['client_type']);
    s01ExpectNoAccountCreated();
});

it('S01-TC-044 rechaza al técnico que envía tipo de cliente', function () {
    $payload = ['client_type' => 'household'] + Sprint01::registrationPayload('technician');
    $response = $this->postJson('/api/v1/auth/register', $payload);
    Sprint01::assertSpanishValidation($response, ['client_type']);
    expect($response->json('errors.client_type.0'))->toContain('no está permitido para este tipo de cuenta');
    s01ExpectNoAccountCreated();
});

it('S01-TC-045 responde al registro vacío con el mensaje general y errores por campo en español', function () {
    $response = $this->postJson('/api/v1/auth/register', []);
    Sprint01::assertSpanishValidation($response, ['name', 'email', 'password', 'account_type']);
    $response->assertJsonPath('error.code', 'VALIDATION_FAILED')
        ->assertJsonPath('message', 'Revisa los campos indicados.');
    expect($response->json('errors.name.0'))->toContain('nombre')
        ->and($response->json('errors.email.0'))->toContain('correo')
        ->and($response->json('errors.account_type.0'))->toContain('tipo de cuenta');
    s01ExpectNoAccountCreated();
});
