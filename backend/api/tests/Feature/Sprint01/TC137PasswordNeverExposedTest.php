<?php

// TC-137 · HU-S01-01 · RNF-08, RF-33 · SEC-S01-02, SEC-S01-04
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S01-TC-011 guarda la contraseña con bcrypt y no la expone en respuestas, auditoría ni logs [TC-137]', function () {
    // Se capturan los logs del flujo para revisarlos al final
    $logged = [];
    Event::listen(MessageLogged::class, function (MessageLogged $event) use (&$logged) {
        $logged[] = $event->message.' '.json_encode($event->context);
    });

    // Dado una cuenta registrada con una contraseña sintética conocida
    $payload = Sprint01::registrationPayload();
    $register = $this->postJson('/api/v1/auth/register', $payload)->assertCreated();
    $user = App\Models\User::query()->where('email', $payload['email'])->firstOrFail();
    $hash = $user->getRawOriginal('password');

    // Entonces el valor almacenado es un hash bcrypt distinto de la contraseña
    expect($hash)->not->toBe($payload['password'])
        ->and(Hash::info($hash)['algoName'])->toBe('bcrypt')
        ->and(Hash::check($payload['password'], $hash))->toBeTrue();

    // Cuando se consultan las respuestas del flujo (registro, login y /me)
    $login = $this->postJson('/api/v1/auth/login', [
        'email' => $payload['email'],
        'password' => $payload['password'],
    ])->assertOk();
    Sanctum::actingAs($user);
    $me = $this->getJson('/api/v1/me')->assertOk();

    // Entonces ni la contraseña ni el hash aparecen en ellas
    foreach ([$register, $login, $me] as $response) {
        expect($response->getContent())->not->toContain($payload['password'])->not->toContain($hash);
    }
    $me->assertJsonMissingPath('data.password');

    // Ni en la auditoría (si la tabla existe en este incremento)
    if (Schema::hasTable('audit_entries')) {
        $audit = DB::table('audit_entries')->get()->toJson();
        expect($audit)->not->toContain($payload['password'])->not->toContain($hash);
    }

    // Ni en los logs del flujo
    expect(implode("\n", $logged))->not->toContain($payload['password'])->not->toContain($hash);
});
