<?php

namespace Tests\Support;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Assert;
use Tests\TestCase;

/**
 * Datos sintéticos y comprobaciones compartidas por las pruebas del Sprint 1.
 * Contrato: GUIA-MANUAL-SPRINT-01-TecnicoYa.md §6 (/api/v1).
 */
final class Sprint01
{
    /** Origen de la SPA de pruebas; debe estar en SANCTUM_STATEFUL_DOMAINS del entorno testing. */
    public const SPA_ORIGIN = 'http://127.0.0.1:5173';

    /** Prepara una petición como la que haría la SPA (cookies, origen y JSON). */
    public static function actAsSpa(TestCase $test): void
    {
        $test->withCredentials();
        $test->withHeaders(['Origin' => self::SPA_ORIGIN, 'Accept' => 'application/json']);
    }

    /** Cuerpo de registro válido con correo y contraseña sintéticos. */
    public static function registrationPayload(string $accountType = 'client'): array
    {
        $password = Str::password(32);
        $payload = [
            'name' => 'Persona de prueba',
            'email' => Str::uuid().'@example.test',
            'password' => $password,
            'password_confirmation' => $password,
            'account_type' => $accountType,
        ];
        if ($accountType === 'client') {
            $payload['client_type'] = 'household';
        }

        // D-80: campos obligatorios del registro detallado. Se conserva 'name' (D-75) para las pruebas del S1.
        $detailed = $accountType === 'client' ? Sprint07::clientPayload() : Sprint07::technicianPayload();
        foreach (['given_names', 'family_names', 'email', 'password', 'password_confirmation', 'account_type', 'client_type'] as $own) {
            unset($detailed[$own]);
        }

        return $payload + $detailed;
    }

    /** Registra por la API pública y devuelve el usuario persistido junto con el cuerpo enviado. */
    public static function registerThroughApi(TestCase $test, string $accountType = 'client'): array
    {
        $payload = self::registrationPayload($accountType);
        $test->postJson('/api/v1/auth/register', $payload)->assertCreated();

        return [User::query()->where('email', $payload['email'])->firstOrFail(), $payload];
    }

    /** Inicia sesión por la API y devuelve el valor crudo de la cookie de sesión para reutilizarla. */
    public static function loginThroughApi(TestCase $test, string $email, string $password): string
    {
        $login = $test->postJson('/api/v1/auth/login', ['email' => $email, 'password' => $password])->assertOk();
        $cookie = collect($login->headers->getCookies())->first(fn ($c) => $c->getName() === config('session.cookie'));
        Assert::assertNotNull($cookie, 'El login no devolvió la cookie de sesión.');

        return $cookie->getValue();
    }

    /** Olvida la sesión y la identidad en memoria para que la siguiente petición dependa solo de la cookie. */
    public static function forgetSession(): void
    {
        app('auth')->forgetGuards();
        app('session')->forgetDrivers();
        app()->forgetInstance('session.store');
    }

    /**
     * Comprueba que cada campo indicado tiene un mensaje de validación en español.
     * Heurística: rechaza los textos por defecto en inglés de Laravel y exige marcas del español.
     */
    public static function assertSpanishValidation(TestResponse $response, array $fields): void
    {
        $response->assertUnprocessable()->assertJsonValidationErrors($fields);
        foreach ($fields as $field) {
            foreach ((array) $response->json("errors.$field") as $message) {
                self::assertSpanishText((string) $message, "errors.$field");
            }
        }
    }

    /** Comprueba que un texto visible para el usuario está en español. */
    public static function assertSpanishText(string $message, string $where = 'message'): void
    {
        Assert::assertNotSame('', trim($message), "$where está vacío.");
        Assert::assertDoesNotMatchRegularExpression(
            '/\b(the|field|must|has already been taken|is invalid|is required|selected|unauthenticated|forbidden|conflict)\b/i',
            $message,
            "$where está en inglés: \"$message\"."
        );
        Assert::assertMatchesRegularExpression(
            '/[áéíóúñ¿¡]|\b(el|la|los|las|campo|debe|ya|no|es|está|correo|tipo|cuenta|versión|valor|obligatorio|válido|permitido)\b/iu',
            $message,
            "$where no parece estar en español: \"$message\"."
        );
    }
}
