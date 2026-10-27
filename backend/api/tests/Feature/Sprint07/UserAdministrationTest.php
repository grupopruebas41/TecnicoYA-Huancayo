<?php

// S07-TC-109 a 120 · Adelanto del Sprint 7 (bloque C, D-85) · Usuarios del panel: listado con búsqueda y filtros,
// alta sin contraseña con enlace de activación, detalle con historial y auditoría, edición con versión, bloqueo y
// desbloqueo (D-32), restablecer acceso, cerrar sesiones y eliminar = anonimizar. Toda acción exige motivo, nunca
// toca la propia cuenta ni deja el sistema sin administradores activos, y queda en audit_entries sin datos personales.
use App\Models\User;
use App\Modules\FAdministration\Application\AccountActivation;
use App\Modules\FAdministration\Application\ManageUsers;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
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
    $this->admin = Sprint02::admin();
});

afterEach(fn () => Carbon::setTestNow());

function s07uClient(array $overrides = []): array
{
    return $overrides + [
        'account_type' => 'client', 'given_names' => 'Rosa Elena', 'family_names' => 'Huamán Soto',
        'email' => 'rosa-'.Str::lower(Str::random(6)).'@example.test', 'phone' => '987654321',
        'client_type' => 'household', 'district_id' => Sprint07::districtId(), 'reason' => 'Alta pedida por soporte telefónico.',
    ];
}

function s07uCreate(object $test, array $payload): array
{
    return $test->actingAs($test->admin)->postJson('/api/v1/admin/users', $payload)->assertCreated()->json('data');
}

/** Contraseña conocida y sesión abierta para comprobar bloqueos y cierres. */
function s07uWithSession(object $test, User $user): string
{
    $password = Str::password(24);
    $user->forceFill(['password' => $password])->save();
    Sprint01::forgetSession();
    Sprint01::loginThroughApi($test, $user->email, $password);
    Sprint01::forgetSession();

    return $password;
}

function s07uLoginStatus(object $test, string $email, string $password): int
{
    Sprint01::forgetSession();
    $status = $test->postJson('/api/v1/auth/login', ['email' => $email, 'password' => $password])->status();
    Sprint01::forgetSession();

    return $status;
}

function s07uAudit(string $action): array
{
    return DB::table('audit_entries')->where('action', $action)->orderBy('id')->get()
        ->map(fn (object $row) => ['reason' => $row->reason, 'subject_id' => $row->subject_id, 'actor_id' => $row->actor_id,
            'before' => json_decode((string) $row->before_values, true), 'after' => json_decode((string) $row->after_values, true)])->all();
}

function s07uActivationToken(User $user): string
{
    $token = null;
    Notification::assertSentTo($user, AccountActivation::class, function (AccountActivation $notification) use (&$token) {
        $token = $notification->token;

        return true;
    });

    return $token;
}

it('S07-TC-109 lista usuarios con búsqueda por nombre o correo y filtros por rol, estado, distrito y fecha de alta', function () {
    $rosa = s07uCreate($this, s07uClient(['given_names' => 'Rosa', 'family_names' => 'Quispe', 'email' => 'rosa.quispe@example.test']));
    Carbon::setTestNow('2026-10-20 09:00:00');
    $tambo = s07uCreate($this, s07uClient(['given_names' => 'Luis', 'family_names' => 'Mendoza', 'district_id' => Sprint07::districtId('EL-TAMBO')]));
    Carbon::setTestNow('2026-10-27 12:00:00');
    $technician = TechnicianProfileFactory::new()->approved()->create(['base_district_id' => Sprint07::districtId('EL-TAMBO')])->user;
    $blocked = UserFactory::new()->client()->create(['name' => 'Cuenta bloqueada', 'is_active' => false]);
    UserFactory::new()->client()->create(['name' => 'Anónimo', 'anonymized_at' => now()]);

    $ids = fn (string $query = '') => collect($this->actingAs($this->admin)->getJson("/api/v1/admin/users$query")->assertOk()->json('data.items'))->pluck('id')->all();
    expect($ids('?q=quispe'))->toBe([$rosa['id']])
        ->and($ids('?q=ROSA.QUISPE@'))->toBe([$rosa['id']])
        ->and($ids('?role=technician'))->toBe([$technician->id])
        ->and($ids('?status=blocked'))->toBe([$blocked->id])
        ->and($ids('?status=pending_activation'))->toEqualCanonicalizing([$rosa['id'], $tambo['id']])
        ->and($ids('?district_id='.Sprint07::districtId('EL-TAMBO')))->toEqualCanonicalizing([$tambo['id'], $technician->id])
        ->and($ids('?created_from=2026-10-19&created_to=2026-10-21'))->toBe([$tambo['id']]);
    // Los anonimizados no aparecen salvo con su filtro; el listado no expone contraseñas ni tokens.
    expect($ids())->toHaveCount(5)->and($ids('?status=anonymized'))->toHaveCount(1);
    $page = $this->actingAs($this->admin)->getJson('/api/v1/admin/users?per_page=2&page=2')->assertOk()->json('data');
    expect($page)->toMatchArray(['page' => 2, 'per_page' => 2, 'total' => 5])->and($page['items'])->toHaveCount(2)
        ->and(array_keys($page['items'][0]))->not->toContain('password', 'remember_token');
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->getJson('/api/v1/admin/users?status=otro&role=root'), ['status', 'role']);
});

it('S07-TC-110 da de alta un cliente sin contraseña, pendiente de activación, con enlace por correo y auditoría', function () {
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/users',
        s07uClient(['password' => 'Secreta123', 'password_confirmation' => 'Secreta123'])), ['password']);
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/users', s07uClient(['reason' => ''])), ['reason']);

    $created = s07uCreate($this, s07uClient(['email' => 'NUEVA.Cliente@Example.test']));
    expect($created)->toMatchArray(['role' => 'client', 'status' => 'pending_activation', 'email' => 'nueva.cliente@example.test',
        'name' => 'Rosa Elena Huamán Soto']);
    $user = User::query()->findOrFail($created['id']);
    expect($user->invited_at)->not->toBeNull()->and($user->activated_at)->toBeNull()
        ->and(DB::table('client_profiles')->where('user_id', $user->id)->value('district_id'))->toBe(Sprint07::districtId());

    Notification::assertSentTo($user, AccountActivation::class, function (AccountActivation $notification) use ($user) {
        $mail = $notification->toMail($user);

        return str_contains($mail->actionUrl, '/#cuenta/activar?token=') && $mail->subject === 'Activa tu cuenta de TécnicoYa';
    });
    // La cuenta nueva no entra con ninguna contraseña hasta activarse.
    expect(s07uLoginStatus($this, $user->email, 'Secreta123'))->toBe(422);
    $audit = s07uAudit('user.created');
    expect($audit)->toHaveCount(1)->and($audit[0])->toMatchArray(['reason' => 'Alta pedida por soporte telefónico.', 'subject_id' => $user->id,
        'actor_id' => $this->admin->id, 'after' => ['id' => $user->id, 'role' => 'client']]);
});

it('S07-TC-111 da de alta un técnico y un administrador, y rechaza correo repetido o datos incompletos', function () {
    $technician = s07uCreate($this, ['account_type' => 'technician', 'given_names' => 'Jorge', 'family_names' => 'Rivera',
        'email' => 'jorge.tecnico@example.test', 'phone' => '912345678', 'base_district_id' => Sprint07::districtId('EL-TAMBO'),
        'district_ids' => [Sprint07::districtId()], 'specialty_ids' => [Sprint07::specialtyId()], 'subcategory_ids' => Sprint07::subcategoryIds(),
        'experience_years' => 3, 'reason' => 'Técnico captado en feria de proveedores.']);
    expect($technician)->toMatchArray(['role' => 'technician', 'status' => 'pending_activation'])
        ->and(DB::table('technician_profiles')->where('user_id', $technician['id'])->value('verification_status'))->toBe('pending');

    $admin = s07uCreate($this, ['account_type' => 'admin', 'given_names' => 'Carla', 'family_names' => 'Paredes',
        'email' => 'carla.admin@example.test', 'phone' => '923456789', 'reason' => 'Nueva integrante del equipo de soporte.']);
    expect($admin['role'])->toBe('admin')->and(DB::table('client_profiles')->where('user_id', $admin['id'])->exists())->toBeFalse();

    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/users',
        s07uClient(['email' => 'jorge.tecnico@example.test'])), ['email']);
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/users', ['account_type' => 'technician',
        'given_names' => 'Sin', 'family_names' => 'Datos', 'email' => 'sin.datos@example.test', 'phone' => '812345678', 'reason' => 'Prueba de validación.']),
        ['phone', 'base_district_id', 'specialty_ids', 'subcategory_ids', 'experience_years']);
    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson('/api/v1/admin/users', s07uClient(['account_type' => 'root'])), ['account_type']);
    expect(User::query()->count())->toBe(3);
});

it('S07-TC-112 el enlace de activación vale 72 horas, define la contraseña, verifica el correo y se puede reenviar', function () {
    $created = s07uCreate($this, s07uClient());
    $user = User::query()->findOrFail($created['id']);
    $first = s07uActivationToken($user);

    $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$user->id}/activation-link", ['reason' => 'No le llegó el primer correo.'])
        ->assertOk()->assertJsonPath('data.status', 'pending_activation');
    Notification::assertSentToTimes($user, AccountActivation::class, 2);
    $token = null;
    Notification::assertSentTo($user, AccountActivation::class, function (AccountActivation $notification) use (&$token) {
        $token = $notification->token;

        return true;
    });
    expect($token)->not->toBe($first);

    Carbon::setTestNow('2026-10-30 11:59:00');
    $password = Str::password(24);
    Sprint01::forgetSession();
    $this->postJson('/api/v1/auth/password/reset', ['email' => $user->email, 'token' => $first, 'password' => $password,
        'password_confirmation' => $password])->assertStatus(422);
    $this->postJson('/api/v1/auth/password/reset', ['email' => $user->email, 'token' => $token, 'password' => $password,
        'password_confirmation' => $password])->assertOk();
    $user->refresh();
    expect($user->activated_at?->toDateTimeString())->toBe('2026-10-30 11:59:00')->and($user->email_verified_at)->not->toBeNull()
        ->and(s07uLoginStatus($this, $user->email, $password))->toBe(200);
    $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$user->id}/activation-link", ['reason' => 'Reenvío innecesario.'])
        ->assertStatus(409)->assertJsonPath('error.code', 'USER_ALREADY_ACTIVE');

    $late = User::query()->findOrFail(s07uCreate($this, s07uClient())['id']);
    $lateToken = s07uActivationToken($late);
    Carbon::setTestNow('2026-11-02 12:01:00');
    Sprint01::forgetSession();
    $this->postJson('/api/v1/auth/password/reset', ['email' => $late->email, 'token' => $lateToken, 'password' => $password,
        'password_confirmation' => $password])->assertStatus(422);
    expect($late->refresh()->activated_at)->toBeNull();
});

it('S07-TC-113 el detalle muestra datos, historial de solicitudes y auditoría de la cuenta', function () {
    $created = s07uCreate($this, s07uClient());
    $profileId = DB::table('client_profiles')->where('user_id', $created['id'])->value('id');
    foreach (['sent', 'completed'] as $status) {
        DB::table('service_requests')->insert(['client_id' => $profileId, 'subcategory_id' => Sprint07::subcategoryIds()[0],
            'district_id' => Sprint07::districtId(), 'description' => 'Revisión de equipo sintética', 'address' => 'Dirección sintética',
            'status' => $status, 'submitted_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
    }
    $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$created['id']}/block", ['reason' => 'Pagos no reconocidos.', 'expected_version' => $created['version']])->assertOk();

    $detail = $this->actingAs($this->admin)->getJson("/api/v1/admin/users/{$created['id']}")->assertOk()->json('data');
    expect($detail['user'])->toMatchArray(['id' => $created['id'], 'status' => 'blocked', 'phone' => '987654321', 'district' => ['id' => Sprint07::districtId(), 'name' => 'Huancayo']])
        ->and($detail['client'])->toMatchArray(['client_type' => 'household'])
        ->and(collect($detail['requests'])->pluck('status')->sort()->values()->all())->toBe(['completed', 'sent'])
        ->and(collect($detail['audit'])->pluck('action')->all())->toBe(['user.blocked', 'user.created'])
        ->and($detail['audit'][0])->toMatchArray(['reason' => 'Pagos no reconocidos.', 'actor' => 'Administración de prueba']);
    $this->actingAs($this->admin)->getJson('/api/v1/admin/users/999999')->assertNotFound();
});

it('S07-TC-114 edita datos con versión y motivo, audita antes y después y no cambia rol ni contraseña', function () {
    $created = s07uCreate($this, s07uClient());
    $other = s07uCreate($this, s07uClient(['email' => 'ocupado@example.test']));
    $patch = fn (array $data) => $this->actingAs($this->admin)->patchJson("/api/v1/admin/users/{$created['id']}", $data);

    $edited = $patch(['family_names' => 'Huamán Torres', 'phone' => '911222333', 'district_id' => Sprint07::districtId('EL-TAMBO'),
        'reason' => 'El cliente corrigió sus datos.', 'expected_version' => $created['version']])->assertOk()->json('data');
    expect($edited)->toMatchArray(['name' => 'Rosa Elena Huamán Torres', 'phone' => '911222333', 'version' => $created['version'] + 1]);
    $patch(['phone' => '944555666', 'reason' => 'Cambio perdido.', 'expected_version' => $created['version']])
        ->assertStatus(409)->assertJsonPath('error.code', 'STALE_VERSION');
    Sprint01::assertSpanishValidation($patch(['email' => 'ocupado@example.test', 'reason' => 'Cambio de correo.', 'expected_version' => $edited['version']]), ['email']);
    Sprint01::assertSpanishValidation($patch(['role' => 'admin', 'password' => 'Secreta123', 'reason' => 'Intento.', 'expected_version' => $edited['version']]), ['role', 'password']);
    Sprint01::assertSpanishValidation($patch(['phone' => '944555666', 'expected_version' => $edited['version']]), ['reason']);

    expect(DB::table('client_profiles')->where('user_id', $created['id'])->value('district_id'))->toBe(Sprint07::districtId('EL-TAMBO'))
        ->and(s07uAudit('user.updated'))->toEqual([['reason' => 'El cliente corrigió sus datos.', 'subject_id' => $created['id'], 'actor_id' => $this->admin->id,
            'before' => ['family_names' => 'Huamán Soto', 'phone' => '987654321', 'district_id' => Sprint07::districtId()],
            'after' => ['family_names' => 'Huamán Torres', 'phone' => '911222333', 'district_id' => Sprint07::districtId('EL-TAMBO')]]])
        ->and($other['email'])->toBe('ocupado@example.test');
});

it('S07-TC-115 bloquea con motivo, cierra sesiones e impide entrar; desbloquea con motivo; rechaza repetir', function () {
    $client = UserFactory::new()->client()->create();
    $password = s07uWithSession($this, $client);
    expect(DB::table('sessions')->where('user_id', $client->id)->count())->toBe(1);
    $version = (int) $client->refresh()->version;

    Sprint01::assertSpanishValidation($this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$client->id}/block", ['reason' => 'abc', 'expected_version' => $version]), ['reason']);
    $blocked = $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$client->id}/block",
        ['reason' => 'Reportes repetidos de suplantación.', 'expected_version' => $version])->assertOk()->json('data');
    expect($blocked['status'])->toBe('blocked')->and(DB::table('sessions')->where('user_id', $client->id)->count())->toBe(0)
        ->and(s07uLoginStatus($this, $client->email, $password))->not->toBe(200);
    $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$client->id}/block", ['reason' => 'Otra vez el bloqueo.', 'expected_version' => $blocked['version']])
        ->assertStatus(409)->assertJsonPath('error.code', 'USER_ALREADY_BLOCKED');

    $unblocked = $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$client->id}/unblock",
        ['reason' => 'Identidad confirmada por video llamada.', 'expected_version' => $blocked['version']])->assertOk()->json('data');
    expect($unblocked['status'])->toBe('active')->and(s07uLoginStatus($this, $client->email, $password))->toBe(200);
    $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$client->id}/unblock", ['reason' => 'Desbloqueo repetido.', 'expected_version' => $unblocked['version']])
        ->assertStatus(409)->assertJsonPath('error.code', 'USER_NOT_BLOCKED');
    expect(collect(s07uAudit('user.blocked'))->pluck('reason')->all())->toBe(['Reportes repetidos de suplantación.'])
        ->and(collect(s07uAudit('user.unblocked'))->pluck('reason')->all())->toBe(['Identidad confirmada por video llamada.']);
});

it('S07-TC-116 nunca actúa sobre la propia cuenta ni bloquea o elimina al último administrador activo', function () {
    $me = $this->admin->refresh();
    foreach (['block' => 'POST', 'sessions' => 'DELETE', 'access-reset' => 'POST'] as $path => $method) {
        $this->actingAs($me)->json($method, "/api/v1/admin/users/{$me->id}/$path", ['reason' => 'Acción sobre mí mismo.', 'expected_version' => $me->version])
            ->assertStatus(409)->assertJsonPath('error.code', 'USER_SELF_ACTION');
    }
    $this->actingAs($me)->deleteJson("/api/v1/admin/users/{$me->id}", ['reason' => 'Acción sobre mí mismo.', 'confirmation' => 'ELIMINAR', 'expected_version' => $me->version])
        ->assertStatus(409)->assertJsonPath('error.code', 'USER_SELF_ACTION');

    // Con otro administrador activo, se puede bloquear y desbloquear a ese otro.
    $second = Sprint02::admin();
    $this->actingAs($me)->postJson("/api/v1/admin/users/{$second->id}/block", ['reason' => 'Cuenta compartida indebidamente.', 'expected_version' => 1])->assertOk();
    $this->actingAs($me)->postJson("/api/v1/admin/users/{$second->id}/unblock", ['reason' => 'Se aclaró el uso de la cuenta.', 'expected_version' => 2])->assertOk();

    // Carrera: si el actor quedó inactivo mientras tanto, bloquear o eliminar al otro dejaría el sistema sin administradores.
    DB::table('users')->where('id', $me->id)->update(['is_active' => false]);
    $manage = app(ManageUsers::class);
    foreach ([fn () => $manage->block($me, $second->id, ['reason' => 'Bloqueo en carrera.', 'expected_version' => 3]),
        fn () => $manage->anonymize($me, $second->id, ['reason' => 'Baja en carrera.', 'expected_version' => 3])] as $action) {
        try {
            $action();
            $this->fail('Debió rechazar la acción sobre el último administrador activo.');
        } catch (HttpResponseException $error) {
            expect($error->getResponse()->getStatusCode())->toBe(409)
                ->and(json_decode($error->getResponse()->getContent(), true)['error']['code'])->toBe('USER_LAST_ADMIN');
        }
    }
    expect((bool) DB::table('users')->where('id', $second->id)->value('is_active'))->toBeTrue()
        ->and(DB::table('users')->where('id', $second->id)->value('anonymized_at'))->toBeNull();
});

it('S07-TC-117 restablecer acceso invalida la contraseña, cierra sesiones y envía el enlace de restablecimiento', function () {
    $client = UserFactory::new()->client()->create();
    $password = s07uWithSession($this, $client);
    $version = (int) $client->refresh()->version;
    $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$client->id}/access-reset",
        ['reason' => 'El cliente reporta acceso de terceros.', 'expected_version' => $version])->assertOk()->assertJsonPath('data.status', 'active');

    expect(DB::table('sessions')->where('user_id', $client->id)->count())->toBe(0)
        ->and(s07uLoginStatus($this, $client->email, $password))->toBe(422)
        ->and($client->refresh()->auth_version)->toBe(2);
    Notification::assertSentTo($client, ResetPassword::class);
    expect(s07uAudit('user.access_reset')[0])->toMatchArray(['reason' => 'El cliente reporta acceso de terceros.', 'subject_id' => $client->id]);

    // Pendiente de activación: se reenvía el enlace de activación en lugar del de restablecimiento.
    $pending = User::query()->findOrFail(s07uCreate($this, s07uClient())['id']);
    $this->actingAs($this->admin)->postJson("/api/v1/admin/users/{$pending->id}/access-reset",
        ['reason' => 'Perdió el correo de activación.', 'expected_version' => $pending->version])->assertOk();
    Notification::assertSentToTimes($pending, AccountActivation::class, 2);
    Notification::assertNotSentTo($pending, ResetPassword::class);
});

it('S07-TC-118 cierra todas las sesiones de una cuenta sin bloquearla y lo audita', function () {
    $technician = TechnicianProfileFactory::new()->approved()->create()->user;
    $password = s07uWithSession($this, $technician);
    DB::table('sessions')->insert(['id' => Str::random(40), 'user_id' => $technician->id, 'payload' => base64_encode('x'), 'last_activity' => now()->timestamp]);
    $version = (int) $technician->refresh()->version;

    $closed = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/users/{$technician->id}/sessions",
        ['reason' => 'Equipo extraviado del técnico.', 'expected_version' => $version])->assertOk()->json('data');
    expect($closed)->toMatchArray(['closed_sessions' => 2, 'status' => 'active'])
        ->and(DB::table('sessions')->where('user_id', $technician->id)->count())->toBe(0)
        ->and(s07uLoginStatus($this, $technician->email, $password))->toBe(200);
    expect(s07uAudit('user.sessions_closed')[0])->toMatchArray(['reason' => 'Equipo extraviado del técnico.', 'after' => ['closed_sessions' => 2]]);
});

it('S07-TC-119 eliminar anonimiza la cuenta con ELIMINAR y motivo: borra datos personales y conserva las solicitudes', function () {
    $created = s07uCreate($this, s07uClient(['client_type' => 'mype', 'business_name' => 'Bodega Sintética SAC', 'reference_address' => 'Jr. Sintético 123']));
    $profileId = DB::table('client_profiles')->where('user_id', $created['id'])->value('id');
    DB::table('service_requests')->insert(['client_id' => $profileId, 'subcategory_id' => Sprint07::subcategoryIds()[0], 'district_id' => Sprint07::districtId(),
        'description' => 'Solicitud sintética', 'address' => 'Dirección sintética', 'status' => 'completed', 'created_at' => now(), 'updated_at' => now()]);
    $delete = fn (array $data) => $this->actingAs($this->admin)->deleteJson("/api/v1/admin/users/{$created['id']}", $data + ['expected_version' => $created['version']]);

    Sprint01::assertSpanishValidation($delete(['reason' => 'Pedido del titular.', 'confirmation' => 'eliminar']), ['confirmation']);
    Sprint01::assertSpanishValidation($delete(['confirmation' => 'ELIMINAR']), ['reason']);
    $done = $delete(['reason' => 'Derecho de cancelación pedido por el titular.', 'confirmation' => 'ELIMINAR'])->assertOk()->json('data');
    expect($done)->toMatchArray(['status' => 'anonymized', 'name' => 'Usuario eliminado', 'phone' => null]);

    $row = DB::table('users')->find($created['id']);
    expect($row->email)->toBe("anonimo-{$created['id']}@anonimo.invalid")->and($row->given_names)->toBeNull()->and($row->family_names)->toBeNull()
        ->and($row->phone)->toBeNull()->and((bool) $row->is_active)->toBeFalse()->and($row->anonymized_at)->not->toBeNull();
    $profile = DB::table('client_profiles')->find($profileId);
    expect($profile->business_name)->toBeNull()->and($profile->default_address)->toBeNull()
        ->and(DB::table('service_requests')->where('client_id', $profileId)->count())->toBe(1);
    $audit = DB::table('audit_entries')->where('action', 'user.anonymized')->first();
    expect($audit->reason)->toBe('Derecho de cancelación pedido por el titular.')
        ->and((string) $audit->before_values.(string) $audit->after_values)->not->toContain('Rosa', 'Bodega', 'Sintético 123', '987654321');
    $this->actingAs($this->admin)->deleteJson("/api/v1/admin/users/{$created['id']}", ['reason' => 'Otra vez.', 'confirmation' => 'ELIMINAR', 'expected_version' => $done['version']])
        ->assertStatus(409)->assertJsonPath('error.code', 'USER_ANONYMIZED');
});

it('S07-TC-120 niega toda la administración de usuarios a cliente, técnico y administrador sin users.manage', function () {
    $target = UserFactory::new()->client()->create();
    $before = DB::table('users')->orderBy('id')->get()->toArray();
    $calls = [
        ['GET', '/api/v1/admin/users', []], ['GET', "/api/v1/admin/users/{$target->id}", []],
        ['POST', '/api/v1/admin/users', s07uClient()], ['PATCH', "/api/v1/admin/users/{$target->id}", ['phone' => '911111111', 'reason' => 'Intruso.', 'expected_version' => 1]],
        ['POST', "/api/v1/admin/users/{$target->id}/block", ['reason' => 'Intruso.', 'expected_version' => 1]],
        ['POST', "/api/v1/admin/users/{$target->id}/unblock", ['reason' => 'Intruso.', 'expected_version' => 1]],
        ['POST', "/api/v1/admin/users/{$target->id}/access-reset", ['reason' => 'Intruso.', 'expected_version' => 1]],
        ['DELETE', "/api/v1/admin/users/{$target->id}/sessions", ['reason' => 'Intruso.', 'expected_version' => 1]],
        ['POST', "/api/v1/admin/users/{$target->id}/activation-link", ['reason' => 'Intruso.']],
        ['DELETE', "/api/v1/admin/users/{$target->id}", ['reason' => 'Intruso.', 'confirmation' => 'ELIMINAR', 'expected_version' => 1]],
    ];
    $limited = Sprint02::admin();
    $actors = [UserFactory::new()->client()->create(), TechnicianProfileFactory::new()->approved()->create()->user, $limited];
    Sprint02::revokeFromAdminRole('users.manage');
    foreach ($actors as $actor) {
        Sprint01::forgetSession();
        Sanctum::actingAs($actor);
        foreach ($calls as [$method, $uri, $body]) {
            $this->json($method, $uri, $body)->assertForbidden();
        }
    }
    expect(DB::table('users')->whereIn('id', collect($before)->pluck('id'))->orderBy('id')->get()->toArray())->toEqual($before);
    Notification::assertNothingSent();
});
