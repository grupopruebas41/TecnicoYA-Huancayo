<?php

// S07-TC-011 a 016 · Adelanto del Sprint 7 (D-73) · Recuperación de contraseña (D-80): respuesta neutra, token de un
// solo uso vigente 60 min, límite por IP y por correo, cierre de las demás sesiones y auditoría de administradores (D-44).
use App\Models\User;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
    Notification::fake();
    $this->password = Str::password(32);
    $this->user = UserFactory::new()->state(fn () => [
        'role_id' => DB::table('roles')->where('code', 'client')->value('id'), 'password' => $this->password,
    ])->create();
});

function s07Forgot(object $test, string $email)
{
    return $test->postJson('/api/v1/auth/password/forgot', ['email' => $email]);
}

/** Pide el enlace y devuelve el token que viajó en la notificación. */
function s07ResetToken(object $test, User $user): string
{
    s07Forgot($test, $user->email)->assertAccepted();
    $token = null;
    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token) {
        $token = $notification->token;

        return true;
    });

    return $token;
}

function s07Reset(object $test, User $user, string $token, ?string $password = null)
{
    $password ??= Str::password(32);

    return $test->postJson('/api/v1/auth/password/reset', [
        'email' => $user->email, 'token' => $token, 'password' => $password, 'password_confirmation' => $password,
    ]);
}

it('S07-TC-011 responde igual exista o no el correo y solo envía el enlace a la cuenta real', function () {
    $known = s07Forgot($this, $this->user->email)->assertAccepted();
    $unknown = s07Forgot($this, 'nadie-'.Str::uuid().'@example.test')->assertAccepted();

    expect($known->json())->toBe($unknown->json())
        ->and($known->json('message'))->toBe('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.');
    Notification::assertSentTo($this->user, ResetPassword::class, function (ResetPassword $notification) {
        $mail = $notification->toMail($this->user);

        return str_contains($mail->actionUrl, '/#cuenta/restablecer?token=')
            && str_contains($mail->actionUrl, 'email='.urlencode($this->user->email));
    });
    Notification::assertCount(1);
    // El token se guarda con hash, nunca en claro.
    expect(DB::table('password_reset_tokens')->where('email', $this->user->email)->value('token'))->not->toBeNull();
});

it('S07-TC-012 el enlace cambia la contraseña una sola vez y cierra las demás sesiones', function () {
    $session = Sprint01::loginThroughApi($this, $this->user->email, $this->password);
    expect(DB::table('sessions')->where('user_id', $this->user->id)->count())->toBe(1)
        ->and($session)->not->toBeEmpty();
    Sprint01::forgetSession();
    $token = s07ResetToken($this, $this->user);
    $newPassword = Str::password(32);
    $authVersion = $this->user->auth_version;

    s07Reset($this, $this->user, $token, $newPassword)->assertOk()
        ->assertJsonPath('message', 'Tu contraseña se actualizó. Inicia sesión con la nueva contraseña.');

    $fresh = $this->user->fresh();
    expect(Hash::check($newPassword, $fresh->password))->toBeTrue()
        ->and($fresh->auth_version)->toBe($authVersion + 1)
        ->and(DB::table('sessions')->where('user_id', $this->user->id)->count())->toBe(0)
        ->and(DB::table('password_reset_tokens')->where('email', $this->user->email)->exists())->toBeFalse();

    // Reutilizar el mismo enlace falla sin volver a cambiar la contraseña.
    $reuse = s07Reset($this, $this->user, $token);
    Sprint01::assertSpanishValidation($reuse, ['token']);
    expect(Hash::check($newPassword, $this->user->fresh()->password))->toBeTrue();
});

it('S07-TC-013 un enlace vencido a los 60 minutos o ajeno no cambia la contraseña', function () {
    $token = s07ResetToken($this, $this->user);
    $this->travel(61)->minutes();

    Sprint01::assertSpanishValidation(s07Reset($this, $this->user, $token), ['token']);
    Sprint01::assertSpanishValidation(s07Reset($this, $this->user, 'token-inventado'), ['token']);
    $other = UserFactory::new()->create();
    Sprint01::assertSpanishValidation(s07Reset($this, $other, $token), ['token']);

    expect(Hash::check($this->password, $this->user->fresh()->password))->toBeTrue();
});

it('S07-TC-014 limita las solicitudes por correo y por IP con respuesta 429 en español', function () {
    foreach (range(1, 3) as $attempt) {
        s07Forgot($this, $this->user->email)->assertAccepted();
    }
    $limited = s07Forgot($this, $this->user->email)->assertStatus(429);
    Sprint01::assertSpanishText((string) $limited->json('message'));

    // Otra IP con correos distintos agota su propio límite.
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.77']);
    foreach (range(1, 10) as $attempt) {
        s07Forgot($this, "otro-$attempt-".Str::uuid().'@example.test')->assertAccepted();
    }
    s07Forgot($this, 'uno-mas-'.Str::uuid().'@example.test')->assertStatus(429);
});

it('S07-TC-015 audita la recuperación de un administrador sin guardar el token ni la contraseña [D-44]', function () {
    $admin = Sprint02::admin();
    $token = s07ResetToken($this, $admin);
    $password = Str::password(32);
    s07Reset($this, $admin, $token, $password)->assertOk();
    $clientToken = s07ResetToken($this, $this->user);
    s07Reset($this, $this->user, $clientToken)->assertOk();

    $entries = DB::table('audit_entries')->whereIn('action', ['auth.password_reset_requested', 'auth.password_reset'])->get();
    expect($entries->pluck('action')->sort()->values()->all())->toBe(['auth.password_reset', 'auth.password_reset_requested'])
        ->and($entries->pluck('subject_id')->unique()->all())->toBe([$admin->id]);
    $dump = json_encode($entries);
    expect($dump)->not->toContain($token)->not->toContain($password);
});

it('S07-TC-016 la nueva contraseña cumple las reglas del registro y debe confirmarse', function () {
    $token = s07ResetToken($this, $this->user);

    $short = $this->postJson('/api/v1/auth/password/reset', ['email' => $this->user->email, 'token' => $token,
        'password' => 'corta', 'password_confirmation' => 'corta']);
    Sprint01::assertSpanishValidation($short, ['password']);
    $mismatch = $this->postJson('/api/v1/auth/password/reset', ['email' => $this->user->email, 'token' => $token,
        'password' => Str::password(32), 'password_confirmation' => Str::password(32)]);
    Sprint01::assertSpanishValidation($mismatch, ['password']);

    expect(Hash::check($this->password, $this->user->fresh()->password))->toBeTrue();
    // El token sigue disponible tras los rechazos de validación.
    s07Reset($this, $this->user, $token)->assertOk();
});
