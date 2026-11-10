<?php

// S05-TC-240 a 243 · Fase 5 del panel final (modo rápido, D-97): ajustes de accesibilidad en la cuenta, bienvenida y
// tutorial que se marcan una sola vez, y lista blanca sin datos de salud.
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->user = ClientProfileFactory::new()->create(['district_id' => Sprint04::district()])->user;
    Sanctum::actingAs($this->user);
});

it('S05-TC-240 los ajustes tienen valores por omisión, se guardan en parte y vuelven en /me para aplicarse antes del primer render', function () {
    expect($this->getJson('/api/v1/client/me/preferences')->assertOk()->json('data'))->toBe([
        'accessibility' => ['text_size' => 100, 'high_contrast' => false, 'readable_font' => false, 'reduce_motion' => false,
            'strong_focus' => false, 'read_aloud' => false, 'dictation' => false, 'simple_mode' => false],
        'onboarding_completed_at' => null, 'tour_completed_at' => null,
    ]);

    $this->putJson('/api/v1/client/me/preferences', ['accessibility' => ['text_size' => 130, 'high_contrast' => true]])->assertOk();
    $this->putJson('/api/v1/client/me/preferences', ['accessibility' => ['readable_font' => true]])->assertOk()
        ->assertJsonPath('data.accessibility.text_size', 130)->assertJsonPath('data.accessibility.high_contrast', true)
        ->assertJsonPath('data.accessibility.readable_font', true);

    // Otro equipo: la misma cuenta trae los ajustes en /me.
    expect($this->getJson('/api/v1/me')->json('data.client_profile.preferences.accessibility'))
        ->toMatchArray(['text_size' => 130, 'high_contrast' => true, 'readable_font' => true, 'simple_mode' => false]);
});

it('S05-TC-241 la bienvenida y el tutorial se marcan una sola vez y no se reinician', function () {
    $this->travelTo(now());
    $first = $this->putJson('/api/v1/client/me/preferences', ['onboarding_completed' => true])->assertOk()->json('data.onboarding_completed_at');
    expect($first)->not->toBeNull()->and($this->getJson('/api/v1/client/me/preferences')->json('data.tour_completed_at'))->toBeNull();

    $this->travel(2)->days();
    $this->putJson('/api/v1/client/me/preferences', ['onboarding_completed' => true, 'tour_completed' => true])->assertOk()
        ->assertJsonPath('data.onboarding_completed_at', $first);
    expect($this->getJson('/api/v1/me')->json('data.client_profile.preferences.tour_completed_at'))->not->toBeNull();
    Sprint01::assertSpanishValidation($this->putJson('/api/v1/client/me/preferences', ['tour_completed' => false]), ['tour_completed']);
});

it('S05-TC-242 rechaza en español valores fuera de rango y cualquier clave que no sea una preferencia de uso', function () {
    Sprint01::assertSpanishValidation($this->putJson('/api/v1/client/me/preferences', ['accessibility' => ['text_size' => 200]]), ['accessibility.text_size']);
    Sprint01::assertSpanishValidation($this->putJson('/api/v1/client/me/preferences', ['accessibility' => ['simple_mode' => 'tal vez']]), ['accessibility.simple_mode']);
    $health = $this->putJson('/api/v1/client/me/preferences', ['accessibility' => ['simple_mode' => true, 'discapacidad' => 'visual'], 'tarjeta' => 'veo-poco']);
    $health->assertUnprocessable();
    expect(array_keys($health->json('errors')))->toEqualCanonicalizing(['tarjeta', 'accessibility.discapacidad'])
        ->and($health->json('message'))->toBe('Ese ajuste no existe. Solo guardamos preferencias de uso.')
        ->and(DB::table('client_profiles')->where('user_id', $this->user->id)->value('accessibility_prefs'))->toBeNull();
});

it('S05-TC-243 solo el cliente tiene preferencias: otros roles 403 y sin sesión 401', function () {
    Sanctum::actingAs(Sprint04::technician()->user);
    $this->getJson('/api/v1/client/me/preferences')->assertForbidden();
    $this->putJson('/api/v1/client/me/preferences', ['onboarding_completed' => true])->assertForbidden();
    Sprint01::forgetSession();
    $this->getJson('/api/v1/client/me/preferences')->assertUnauthorized();
});

it('S05-TC-254 /me trae el correo solo a su dueño para el encabezado de «Tu cuenta»', function () {
    expect($this->getJson('/api/v1/me')->assertOk()->json('data.email'))->toBe($this->user->email);
    $other = ClientProfileFactory::new()->create()->user;
    expect($this->getJson('/api/v1/me')->getContent())->not->toContain($other->email);
});
