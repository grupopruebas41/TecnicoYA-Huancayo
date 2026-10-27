<?php

// S07-TC-141 y 142 · D-85 (cambio pedido al confirmar): dar de alta un administrador desde el panel exige reingresar la
// contraseña del administrador que lo crea. La contraseña no se guarda en la auditoría, los fallos tienen un límite por
// cuenta y el alta de clientes y técnicos no la pide.
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint07;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint07::catalog();
    Carbon::setTestNow('2026-10-27 12:00:00');
    Sprint01::actAsSpa($this);
    Notification::fake();
    $this->password = Str::password(24);
    $this->admin = Sprint02::admin();
    $this->admin->forceFill(['password' => $this->password])->save();
});

afterEach(fn () => Carbon::setTestNow());

function s07rAdmin(array $overrides = []): array
{
    return $overrides + ['account_type' => 'admin', 'given_names' => 'Carla', 'family_names' => 'Paredes',
        'email' => 'carla.'.Str::lower(Str::random(5)).'@example.test', 'phone' => '923456789', 'reason' => 'Nueva integrante del equipo de soporte.'];
}

it('S07-TC-141 crear un administrador exige la contraseña correcta de quien lo crea y no la guarda en la auditoría', function () {
    $post = fn (array $payload) => $this->actingAs($this->admin)->postJson('/api/v1/admin/users', $payload);

    Sprint01::assertSpanishValidation($post(s07rAdmin()), ['current_password']);
    $wrong = $post(s07rAdmin(['current_password' => 'no-es-la-clave-123']));
    Sprint01::assertSpanishValidation($wrong, ['current_password']);
    expect($wrong->json('errors.current_password.0'))->toBe('La contraseña actual no es correcta.')
        ->and(User::query()->count())->toBe(1);

    $created = $post(s07rAdmin(['current_password' => $this->password]))->assertCreated()->json('data');
    expect($created)->toMatchArray(['role' => 'admin', 'status' => 'pending_activation']);

    $audit = DB::table('audit_entries')->where('action', 'user.created')->sole();
    expect(json_encode($audit))->not->toContain($this->password)->not->toContain('current_password');
});

it('S07-TC-142 tras 5 intentos fallidos bloquea la reconfirmación 15 minutos; clientes y técnicos no la piden', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->actingAs($this->admin)->postJson('/api/v1/admin/users', s07rAdmin(['current_password' => 'incorrecta-'.$i]))->assertUnprocessable();
    }
    $locked = $this->actingAs($this->admin)->postJson('/api/v1/admin/users', s07rAdmin(['current_password' => $this->password]));
    Sprint01::assertSpanishValidation($locked, ['current_password']);
    expect($locked->json('errors.current_password.0'))->toContain('Demasiados intentos')->and(User::query()->count())->toBe(1);

    $this->travel(16)->minutes();
    $this->actingAs($this->admin)->postJson('/api/v1/admin/users', s07rAdmin(['current_password' => $this->password]))->assertCreated();

    $client = ['account_type' => 'client', 'given_names' => 'Rosa Elena', 'family_names' => 'Huamán Soto', 'email' => 'rosa.r@example.test',
        'phone' => '987654321', 'client_type' => 'household', 'district_id' => Sprint07::districtId(), 'reason' => 'Alta pedida por soporte telefónico.'];
    $this->actingAs($this->admin)->postJson('/api/v1/admin/users', $client)->assertCreated();
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/users',
        array_merge($client, ['email' => 'otra.r@example.test', 'current_password' => $this->password])), ['current_password']);
});
