<?php

// S07-TC-046 a 056 · Adelanto del Sprint 7 (D-73) · Fase 1 del panel: Inicio del administrador (GET /admin/dashboard,
// PERM-01 / D-74), cambio de contraseña pidiendo la actual, tema (D-76), nombres (D-75) y foto de perfil (D-77).
use App\Models\User;
use Database\Factories\ClientProfileFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

const S07_STATUSES = ['registered', 'sent', 'pending_availability', 'assigned', 'in_progress', 'completed', 'closed',
    'unrated', 'cancelled', 'expired'];

function s07UserWithRole(string $role, array $state = []): User
{
    return UserFactory::new()->state(fn () => ['role_id' => DB::table('roles')->where('code', $role)->value('id')] + $state)->create();
}

describe('Inicio del administrador', function () {
    beforeEach(function () {
        Sprint04::boot($this);
        $this->admin = Sprint02::admin();
    });

    it('S07-TC-046 exige sesión y el permiso dashboard.view [D-74]', function () {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
        // Entre actores, el guard de Sanctum conserva al anterior: se olvida la sesión (como en el S1).
        Sprint01::forgetSession();
        $this->actingAs(s07UserWithRole('client'))->getJson('/api/v1/admin/dashboard')->assertForbidden();
        Sprint01::forgetSession();

        $permission = DB::table('permissions')->where('code', 'dashboard.view')->value('id');
        DB::table('role_permissions')->where('permission_id', $permission)->delete();
        $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard')->assertForbidden();
    });

    it('S07-TC-047 cuenta las solicitudes por estado con ceros explícitos para los estados sin datos [TC-087]', function () {
        foreach (['sent', 'sent', 'assigned', 'cancelled'] as $status) {
            Sprint04::sentRequest(['status' => $status]);
        }

        $data = $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');

        expect(array_keys($data['requests_by_status']))->toBe(S07_STATUSES)
            ->and($data['requests_by_status']['sent'])->toBe(2)
            ->and($data['requests_by_status']['assigned'])->toBe(1)
            ->and($data['requests_by_status']['cancelled'])->toBe(1)
            ->and($data['requests_by_status']['completed'])->toBe(0)
            ->and($data['requests_total'])->toBe(4);
    });

    it('S07-TC-048 cuenta solo los técnicos pendientes de verificación', function () {
        TechnicianProfileFactory::new()->count(2)->create();
        TechnicianProfileFactory::new()->approved()->create();
        TechnicianProfileFactory::new()->create(['verification_status' => 'rejected']);

        $data = $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');

        expect($data['technicians_pending_verification'])->toBe(2);
    });

    it('S07-TC-049 cuenta los usuarios nuevos de 7 y 30 días por rol, sin cuentas anonimizadas', function () {
        $this->travel(-20)->days();
        s07UserWithRole('client');
        $this->travelBack();
        Sprint04::boot($this);
        $this->travel(-3)->days();
        s07UserWithRole('client');
        s07UserWithRole('technician');
        s07UserWithRole('client', ['anonymized_at' => now()]);
        $this->travelBack();
        Sprint04::boot($this);
        $this->travel(-40)->days();
        s07UserWithRole('client');
        $this->travelBack();
        Sprint04::boot($this);

        $new = $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard')->assertOk()->json('data.new_users');

        // El administrador de beforeEach se creó «hoy» y cuenta en ambas ventanas.
        expect($new['last_7_days'])->toBe(['client' => 1, 'technician' => 1, 'admin' => 1, 'total' => 3])
            ->and($new['last_30_days'])->toBe(['client' => 2, 'technician' => 1, 'admin' => 1, 'total' => 4]);
    });

    it('S07-TC-050 declara las calificaciones no disponibles hasta el Sprint 6 y no expone datos personales', function () {
        ClientProfileFactory::new()->create();

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard')->assertOk();

        expect($response->json('data.ratings'))->toBe(['available' => false, 'average' => null, 'count' => 0, 'available_from' => 'Sprint 6'])
            ->and($response->json('data.generated_at'))->toBe(now()->toISOString());
        expect($response->getContent())->not->toContain('@example')->not->toContain('password');
    });
});

describe('Mi perfil', function () {
    beforeEach(function () {
        $this->seed(AuthorizationSeeder::class);
        Storage::fake('public');
        Storage::fake('local');
        Sprint01::actAsSpa($this);
        $password = $this->password = Str::password(32);
        $this->user = s07UserWithRole('client', ['password' => $password]);
    });

    it('S07-TC-051 rechaza el cambio de contraseña sin la actual correcta o con una nueva inválida', function () {
        $new = Str::password(32);
        $cases = [
            [['current_password' => 'incorrecta-123', 'password' => $new, 'password_confirmation' => $new], 'current_password'],
            [['current_password' => $this->password, 'password' => $new, 'password_confirmation' => Str::password(32)], 'password'],
            [['current_password' => $this->password, 'password' => 'corta', 'password_confirmation' => 'corta'], 'password'],
            [['current_password' => $this->password, 'password' => $this->password, 'password_confirmation' => $this->password], 'password'],
        ];
        foreach ($cases as [$body, $field]) {
            Sprint01::assertSpanishValidation($this->actingAs($this->user)->postJson('/api/v1/me/password', $body), [$field]);
        }

        expect(Hash::check($this->password, $this->user->fresh()->password))->toBeTrue();
    });

    it('S07-TC-052 cambia la contraseña, conserva la sesión actual y cierra las demás [D-44]', function () {
        $admin = s07UserWithRole('admin', ['password' => $this->password]);
        $other = Sprint01::loginThroughApi($this, $admin->email, $this->password);
        Sprint01::forgetSession();
        $current = Sprint01::loginThroughApi($this, $admin->email, $this->password);
        Sprint01::forgetSession();
        expect(DB::table('sessions')->where('user_id', $admin->id)->count())->toBe(2);
        $new = Str::password(32);
        $cookie = config('session.cookie');

        $this->withUnencryptedCookie($cookie, $current)->postJson('/api/v1/me/password', [
            'current_password' => $this->password, 'password' => $new, 'password_confirmation' => $new,
        ])->assertOk()->assertJsonPath('data.message', 'Tu contraseña se actualizó. Cerramos tus otras sesiones.');

        $fresh = $admin->fresh();
        expect(Hash::check($new, $fresh->password))->toBeTrue()
            ->and($fresh->auth_version)->toBe($admin->auth_version + 1)
            ->and(DB::table('sessions')->where('user_id', $admin->id)->count())->toBe(1);
        // La sesión actual sigue válida y la otra quedó cerrada.
        Sprint01::forgetSession();
        $this->withUnencryptedCookie($cookie, $current)->getJson('/api/v1/me')->assertOk();
        Sprint01::forgetSession();
        $this->withUnencryptedCookie($cookie, $other)->getJson('/api/v1/me')->assertUnauthorized();
        $audit = DB::table('audit_entries')->where('action', 'auth.password_changed')->get();
        expect($audit)->toHaveCount(1)->and($audit[0]->subject_id)->toBe($admin->id)
            ->and(json_encode($audit))->not->toContain($new)->not->toContain($this->password);
    });

    it('S07-TC-053 guarda la preferencia de tema en /me y rechaza valores fuera del dominio [D-76]', function () {
        foreach (['light', 'dark', 'system'] as $index => $theme) {
            $this->actingAs($this->user)->patchJson('/api/v1/me', ['theme_preference' => $theme, 'expected_version' => $index + 1])
                ->assertOk()->assertJsonPath('data.theme_preference', $theme);
        }
        Sprint01::assertSpanishValidation($this->actingAs($this->user)->patchJson('/api/v1/me',
            ['theme_preference' => 'azul', 'expected_version' => 4]), ['theme_preference']);

        $this->actingAs($this->user)->getJson('/api/v1/me')->assertJsonPath('data.theme_preference', 'system');
    });

    it('S07-TC-054 nombres y apellidos actualizan el nombre para mostrar y no se mezclan con name [D-75]', function () {
        $this->actingAs($this->user)->patchJson('/api/v1/me', [
            'given_names' => 'Rosa María', 'family_names' => 'Huamán Soto', 'phone' => '+51 987 654 321', 'expected_version' => 1,
        ])->assertOk()->assertJsonPath('data.name', 'Rosa María Huamán Soto')->assertJsonPath('data.given_names', 'Rosa María');

        Sprint01::assertSpanishValidation($this->actingAs($this->user)->patchJson('/api/v1/me',
            ['given_names' => 'Rosa', 'expected_version' => 2]), ['family_names']);
        Sprint01::assertSpanishValidation($this->actingAs($this->user)->patchJson('/api/v1/me',
            ['name' => 'Otra', 'given_names' => 'Rosa', 'family_names' => 'Soto', 'expected_version' => 2]), ['name']);
    });

    it('S07-TC-055 la foto de perfil es una imagen revisada propia con finalidad avatar [D-77]', function () {
        $upload = $this->actingAs($this->user)->post('/api/v1/media', [
            'purpose' => 'avatar', 'file' => Sprint02::upload('foto.webp'),
        ], ['Accept' => 'application/json'])->assertCreated();
        $avatar = $upload->json('data.id');
        expect($upload->json('data.purpose'))->toBe('avatar');

        $this->actingAs($this->user)->patchJson('/api/v1/me', ['avatar_media_id' => $avatar, 'expected_version' => 1])
            ->assertOk()->assertJsonPath('data.avatar_url', url("/api/v1/media/$avatar"));

        $stranger = s07UserWithRole('client');
        Sprint01::forgetSession();
        $foreign = $this->actingAs($stranger)->post('/api/v1/media', ['purpose' => 'avatar',
            'file' => Sprint02::upload('foto.png')], ['Accept' => 'application/json'])->json('data.id');
        Sprint01::forgetSession();
        Sprint01::assertSpanishValidation($this->actingAs($this->user)->patchJson('/api/v1/me',
            ['avatar_media_id' => $foreign, 'expected_version' => 2]), ['avatar_media_id']);
        $evidence = $this->actingAs($this->user)->post('/api/v1/media', ['purpose' => 'evidence',
            'file' => Sprint02::upload('foto.webp')], ['Accept' => 'application/json'])->json('data.id');
        Sprint01::assertSpanishValidation($this->actingAs($this->user)->patchJson('/api/v1/me',
            ['avatar_media_id' => $evidence, 'expected_version' => 2]), ['avatar_media_id']);

        $this->actingAs($this->user)->patchJson('/api/v1/me', ['avatar_media_id' => null, 'expected_version' => 2])
            ->assertOk()->assertJsonPath('data.avatar_url', null);
    });
});

it('S07-TC-056 AuthorizationSeeder concede dashboard.view y users.manage al administrador sin duplicar [D-74]', function () {
    $this->seed(AuthorizationSeeder::class);
    $this->seed(AuthorizationSeeder::class);

    $admin = DB::table('roles')->where('code', 'admin')->value('id');
    foreach (['dashboard.view', 'users.manage'] as $code) {
        $permission = DB::table('permissions')->where('code', $code)->value('id');
        expect($permission)->not->toBeNull()
            ->and(DB::table('role_permissions')->where('role_id', $admin)->where('permission_id', $permission)->count())->toBe(1);
    }
    Sprint01::actAsSpa($this);
    $this->actingAs(Sprint02::admin())->getJson('/api/v1/me')->assertOk()
        ->assertJsonPath('data.permissions', fn (array $codes) => in_array('dashboard.view', $codes, true) && in_array('users.manage', $codes, true));
});
