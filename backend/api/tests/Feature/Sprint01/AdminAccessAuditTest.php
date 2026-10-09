<?php

// S01-TC-087 · HU-S01-04 · RF-33 · SEC-S01-05 · D-44 (S01-B)
use Database\Factories\UserFactory;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S01-TC-087 audita el inicio fallido, el inicio y el cierre de sesión de un administrador y no los de un cliente', function () {
    $password = Str::password(32);
    $admin = Sprint02::admin();
    $admin->forceFill(['password' => $password])->save();
    $client = UserFactory::new()->client()->create(['password' => $password]);
    $before = DB::table('audit_entries')->max('id') ?? 0;

    // Cuando el administrador falla, entra y sale, y el cliente entra
    $this->postJson('/api/v1/auth/login', ['email' => $admin->email, 'password' => 'clave-equivocada-1'])->assertUnauthorized();
    $this->postJson('/api/v1/auth/login', ['email' => $admin->email, 'password' => $password])->assertOk();
    $this->postJson('/api/v1/auth/logout')->assertNoContent();
    Sprint01::forgetSession();
    $this->postJson('/api/v1/auth/login', ['email' => $client->email, 'password' => $password])->assertOk();

    // Entonces quedan las tres acciones del administrador, en orden y sobre su cuenta
    $entries = DB::table('audit_entries')->where('id', '>', $before)->orderBy('id')->get();
    expect($entries->pluck('action')->all())->toBe(['auth.login_failed', 'auth.login', 'auth.logout'])
        ->and($entries->pluck('subject_type')->unique()->all())->toBe(['user'])
        ->and($entries->pluck('subject_id')->unique()->all())->toBe([$admin->id])
        ->and($entries[0]->actor_id)->toBeNull()
        ->and($entries[1]->actor_id)->toBe($admin->id)
        ->and($entries[2]->actor_id)->toBe($admin->id);

    // Y ninguna entrada contiene la contraseña ni datos de sesión
    $serialized = $entries->toJson();
    expect($serialized)->not->toContain($password)->not->toContain('clave-equivocada-1')
        ->not->toContain(config('session.cookie'));
    expect(DB::table('audit_entries')->where('subject_id', $client->id)->where('action', 'like', 'auth.%')->count())->toBe(0);
});
