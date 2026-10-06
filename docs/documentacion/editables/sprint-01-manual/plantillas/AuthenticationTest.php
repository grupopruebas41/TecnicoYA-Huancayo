<?php

use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    $this->withCredentials();
    $this->withHeaders(['Origin' => 'http://localhost:5174', 'Accept' => 'application/json']);
});

function s01Payload(string $type = 'client'): array
{
    $password = Str::password(32);
    $data = [
        'name' => 'Persona de prueba', 'email' => Str::uuid().'@example.test',
        'password' => $password, 'password_confirmation' => $password,
        'account_type' => $type,
    ];
    if ($type === 'client') {
        $data['client_type'] = 'household';
    }
    return $data;
}

function s01User($test, string $type = 'client'): User
{
    $data = s01Payload($type);
    $test->postJson('/api/v1/auth/register', $data)->assertCreated();
    return User::query()->where('email', $data['email'])->firstOrFail();
}

it('TC-001 crea exactamente un cliente sin permisos administrativos', function () {
    $data = s01Payload();
    $this->postJson('/api/v1/auth/register', $data)->assertCreated();
    $user = User::query()->where('email', $data['email'])->sole();
    expect(Hash::check($data['password'], $user->password))->toBeTrue();
    expect(DB::table('roles')->where('id', $user->role_id)->value('code'))->toBe('client');
    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseCount('client_profiles', 1);
    $this->assertDatabaseHas('client_profiles', ['user_id' => $user->id]);
    $this->assertDatabaseCount('technician_profiles', 0);
    $this->assertDatabaseMissing('user_permissions', ['user_id' => $user->id]);
});

it('TC-002 rechaza correo duplicado normalizado sin crear otro perfil', function () {
    $data = s01Payload();
    $this->postJson('/api/v1/auth/register', $data)->assertCreated();
    $data['email'] = '  '.strtoupper($data['email']).'  ';
    $this->postJson('/api/v1/auth/register', $data)
        ->assertUnprocessable()->assertJsonValidationErrors('email');
    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseCount('client_profiles', 1);
});

it('TC-003 registra al técnico pendiente y permite editar datos básicos', function () {
    $user = s01User($this, 'technician');
    $this->assertDatabaseHas('technician_profiles', [
        'user_id' => $user->id, 'status' => 'pending_verification',
        'verification_status' => 'pending', 'available_now' => 0,
    ]);
    $this->actingAs($user, 'web')->patchJson('/api/v1/me', [
        'name' => 'Técnico prueba', 'phone' => '900000001', 'expected_version' => $user->version,
    ])->assertOk();
    $this->assertDatabaseHas('technician_profiles', [
        'user_id' => $user->id, 'verification_status' => 'pending',
    ]);
});

it('TC-004 rechaza autoactivación y conserva todos los campos', function () {
    $user = s01User($this, 'technician');
    $this->actingAs($user, 'web')->patchJson('/api/v1/me', [
        'verification_status' => 'approved', 'status' => 'active',
        'permissions' => ['catalog.manage'], 'role_id' => 1,
        'expected_version' => $user->version,
    ])->assertUnprocessable();
    $this->assertDatabaseHas('technician_profiles', [
        'user_id' => $user->id, 'status' => 'pending_verification', 'verification_status' => 'pending',
    ]);
    expect($user->fresh()->role_id)->toBe($user->role_id);
    expect($user->fresh()->version)->toBe($user->version);
    $this->assertDatabaseMissing('user_permissions', ['user_id' => $user->id]);
});

it('TC-006 invalida la cookie anterior después de logout', function () {
    $data = s01Payload();
    $this->postJson('/api/v1/auth/register', $data)->assertCreated();
    $login = $this->postJson('/api/v1/auth/login', [
        'email' => $data['email'], 'password' => $data['password'],
    ])->assertOk();
    $cookieName = config('session.cookie');
    $cookie = $login->headers->getCookies();
    $sessionCookie = collect($cookie)->first(fn ($item) => $item->getName() === $cookieName);
    expect($sessionCookie)->not->toBeNull();
    $oldValue = $sessionCookie->getValue();
    $this->app['auth']->forgetGuards();
    $this->app['session']->forgetDrivers();
    $this->app->forgetInstance('session.store');
    $this->withUnencryptedCookie($cookieName, $oldValue)
        ->postJson('/api/v1/auth/logout')->assertNoContent();
    $this->app['auth']->forgetGuards();
    $this->app['session']->forgetDrivers();
    $this->app->forgetInstance('session.store');
    $this->withUnencryptedCookie($cookieName, $oldValue)
        ->getJson('/api/v1/me')->assertUnauthorized();
});

it('TC-007 aplica los middleware administrativos a un cliente', function () {
    // Ruta exclusiva del runner: prueba el control real sin adelantar un panel de Sprint 7.
    Route::middleware(['api', 'auth:sanctum', 'account.active', 'permission:catalog.manage'])
        ->get('/__tests/admin-access', fn () => ['private_marker' => 'restricted']);
    $user = s01User($this);
    $this->actingAs($user, 'web')->getJson('/__tests/admin-access')
        ->assertForbidden()->assertJsonMissing(['private_marker' => 'restricted']);
});

it('TC-008 no permite crear un administrador desde el registro público', function () {
    $data = s01Payload('admin');
    $this->postJson('/api/v1/auth/register', $data)
        ->assertUnprocessable()->assertJsonValidationErrors('account_type');
    $this->assertDatabaseMissing('users', ['email' => $data['email']]);
});

it('TC-009 edita el perfil propio e incrementa su versión', function () {
    $user = s01User($this);
    $version = $user->version;
    $this->actingAs($user, 'web')->patchJson('/api/v1/me', [
        'name' => 'Nombre actualizado', 'phone' => '900000002', 'expected_version' => $version,
    ])->assertOk()->assertJsonPath('data.version', $version + 1);
    $this->assertDatabaseHas('users', [
        'id' => $user->id, 'name' => 'Nombre actualizado', 'phone' => '900000002',
        'role_id' => $user->role_id, 'version' => $version + 1,
    ]);
});

it('TC-010 devuelve conflicto y preserva la edición más reciente', function () {
    $user = s01User($this);
    $version = $user->version;
    $this->actingAs($user, 'web')->patchJson('/api/v1/me', [
        'name' => 'Edición vigente', 'expected_version' => $version,
    ])->assertOk();
    $this->patchJson('/api/v1/me', [
        'name' => 'Edición obsoleta', 'expected_version' => $version,
    ])->assertConflict();
    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Edición vigente']);
});
