<?php

use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
});

it('S01-TC-012 crea un administrador con secretos ocultos y auditoría atómica', function () {
    // Dado un servidor autorizado con roles sembrados y contraseña sintética.
    $password = Str::password(32);
    // Cuando el operador usa únicamente opciones no secretas y responde los prompts.
    $this->artisan('tecnicoya:provision-admin', ['--email' => ' ADMIN@example.test ', '--name' => 'Administrador E2E'])
        ->expectsQuestion('Contraseña del administrador', $password)
        ->expectsQuestion('Confirma la contraseña', $password)->assertSuccessful();
    // Entonces se crea el rol mínimo y la auditoría no contiene la contraseña ni su hash.
    $user = User::query()->where('email', 'admin@example.test')->sole();
    expect(Hash::check($password, $user->password))->toBeTrue();
    $this->assertDatabaseHas('roles', ['id' => $user->role_id, 'code' => 'admin']);
    $this->assertDatabaseHas('audit_entries', ['subject_id' => $user->id, 'action' => 'administrator.provisioned']);
    expect(DB::table('audit_entries')->get()->toJson())->not->toContain($password)->not->toContain($user->password);
    $this->assertDatabaseCount('user_permissions', 0);
});

it('S01-TC-013 rechaza correo existente y confirmación incorrecta sin sobrescribir', function () {
    $password = Str::password(32);
    $user = User::create(['name' => 'Cliente', 'email' => 'existing@example.test', 'password' => $password, 'role' => 'client']);
    $this->artisan('tecnicoya:provision-admin', ['--email' => $user->email, '--name' => 'Otro'])->assertFailed();
    $this->artisan('tecnicoya:provision-admin', ['--email' => 'new@example.test', '--name' => 'Nuevo'])
        ->expectsQuestion('Contraseña del administrador', $password)
        ->expectsQuestion('Confirma la contraseña', 'distinta')->assertFailed();
    $this->assertDatabaseCount('users', 1);
    expect($user->fresh()->role)->toBe('client');
});

it('S01-TC-014 revierte el alta si no puede persistir la auditoría', function () {
    // Simular indisponibilidad de auditoría antes de su INSERT, sin DDL (MySQL haría commit implícito).
    $password = Str::password(32);
    DB::connection()->beforeExecuting(function (string $query) {
        if (str_starts_with($query, 'insert into `audit_entries`')) {
            throw new RuntimeException('Auditoría no disponible en esta simulación.');
        }
    });
    $this->artisan('tecnicoya:provision-admin', ['--email' => 'rollback@example.test', '--name' => 'Administrador'])
        ->expectsQuestion('Contraseña del administrador', $password)
        ->expectsQuestion('Confirma la contraseña', $password)->assertFailed();
    $this->assertDatabaseMissing('users', ['email' => 'rollback@example.test']);
});
