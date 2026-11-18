<?php

// S05-TC-354 a 356 · Panel del técnico, Fase T5 (modo rápido, D-105 y D-112): avisos de oferta guardados en la cuenta
// (solo el técnico los cambia), «Primeros pasos» del Inicio y las marcas de bienvenida y tutorial en la demo y en E2E.
use App\Modules\FAdministration\Application\UserPreferences;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\DemoSeeder;
use Database\Seeders\Sprint05E2ESeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->travelTo(CarbonImmutable::parse('2026-11-18 10:00:00', 'America/Lima')->utc());
});

it('S05-TC-354 los avisos de oferta se guardan en la cuenta del técnico con sus valores por omisión; nadie más los cambia [D-112]', function () {
    $technician = Sprint04::technician();
    Sanctum::actingAs($technician->user);
    // D-112: el sonido, la vibración y la voz empiezan apagados; el destello, encendido.
    expect($this->getJson('/api/v1/me/preferences')->assertOk()->json('data.offer_alerts'))
        ->toBe(['sound' => false, 'vibration' => false, 'flash' => true, 'speak' => false]);

    $saved = $this->putJson('/api/v1/me/preferences', ['offer_alerts' => ['sound' => true, 'speak' => true]])->assertOk()->json('data.offer_alerts');
    expect($saved)->toBe(['sound' => true, 'vibration' => false, 'flash' => true, 'speak' => true])
        ->and(json_decode((string) DB::table('users')->where('id', $technician->user_id)->value('offer_alert_prefs'), true))
        ->toBe(['sound' => true, 'vibration' => false, 'flash' => true, 'speak' => true])
        ->and($this->getJson('/api/v1/me')->json('data.preferences.offer_alerts.sound'))->toBeTrue();

    Sprint01::assertSpanishValidation($this->putJson('/api/v1/me/preferences', ['offer_alerts' => ['sound' => 'fuerte']]), ['offer_alerts.sound']);
    $this->putJson('/api/v1/me/preferences', ['offer_alerts' => ['volumen' => 10]])->assertUnprocessable()
        ->assertJsonValidationErrors(['offer_alerts.volumen']);

    // El cliente y el administrador no tienen avisos de oferta: la clave se rechaza y no se guarda nada.
    foreach ([ClientProfileFactory::new()->create()->user, Sprint02::admin()] as $user) {
        Sprint01::forgetSession();
        Sanctum::actingAs($user);
        $this->putJson('/api/v1/me/preferences', ['offer_alerts' => ['sound' => true]])->assertUnprocessable()
            ->assertJsonValidationErrors(['offer_alerts']);
        expect(DB::table('users')->where('id', $user->id)->value('offer_alert_prefs'))->toBeNull();
    }
});

it('S05-TC-355 «Primeros pasos» del Inicio lista perfil, documentos, zonas y horarios y servicios con tarifa, y termina al completarlos', function () {
    $fresh = TechnicianProfileFactory::new()->create(['bio' => null, 'base_district_id' => null]);
    Sanctum::actingAs($fresh->user);
    $steps = $this->getJson('/api/v1/technicians/me/home')->assertOk()->json('data.first_steps');
    expect(array_column($steps['steps'], 'code'))->toBe(['profile', 'documents', 'zones', 'services'])
        ->and(array_column($steps['steps'], 'section'))->toBe(['profile-pro', 'verification', 'zones', 'services'])
        ->and(array_column($steps['steps'], 'done'))->toBe([false, false, false, false])
        ->and($steps['done'])->toBeFalse()->and($steps['completed'])->toBe(0);

    // Con todo lo que piden: «Sobre mí» de 40 caracteres, distrito base, los 2 documentos, zonas, franjas y un servicio.
    $complete = Sprint04::technician(['base' => Sprint04::district(), 'profile' => ['bio' => str_repeat('Técnico sintético. ', 3)]]);
    foreach (['Documento de identidad', 'Certificado o constancia técnica'] as $type) {
        TechnicianDocumentFactory::new()->create(['technician_id' => $complete->id, 'document_type' => $type]);
    }
    Sprint01::forgetSession();
    Sanctum::actingAs($complete->user);
    $done = $this->getJson('/api/v1/technicians/me/home')->json('data.first_steps');
    expect(array_column($done['steps'], 'done'))->toBe([true, true, true, true])->and($done['done'])->toBeTrue()->and($done['completed'])->toBe(4);
});

it('S05-TC-356 demo-tecnico-pendiente empieza sin bienvenida ni tutorial; los técnicos E2E ya los vieron, salvo e2e-technician-nuevo', function () {
    $pending = TechnicianProfileFactory::new()->create();
    DB::table('users')->where('id', $pending->user_id)->update(['onboarding_completed_at' => now(), 'tour_completed_at' => now()]);
    app(DemoSeeder::class)->firstVisit($pending->user_id, true);
    expect(UserPreferences::forUser($pending->user_id))->toMatchArray(['onboarding_completed_at' => null, 'tour_completed_at' => null]);
    $seen = TechnicianProfileFactory::new()->create();
    app(DemoSeeder::class)->firstVisit($seen->user_id, false);
    expect(UserPreferences::forUser($seen->user_id)['tour_completed_at'])->not->toBeNull();

    // Como S03-TC-085: la guarda solo lee la configuración; la conexión abierta sigue en la base de pruebas real.
    expect(DB::connection()->getDatabaseName())->toEndWith('_testing');
    config(['database.connections.mysql.database' => 'tecnicoya_testing']);
    $this->seed(Sprint05E2ESeeder::class);
    $marks = DB::table('users as u')->join('roles as r', 'r.id', '=', 'u.role_id')->where('r.code', 'technician')->where('u.email', 'like', 'e2e-%')
        ->pluck('u.tour_completed_at', 'u.email');
    expect($marks->keys())->toContain('e2e-technician-frio@example.test', 'e2e-technician-nuevo@example.test')
        ->and($marks->except('e2e-technician-nuevo@example.test')->filter(fn ($at) => $at === null)->all())->toBe([])
        ->and($marks['e2e-technician-nuevo@example.test'])->toBeNull();
    $nuevo = (int) DB::table('technician_profiles as t')->join('users as u', 'u.id', '=', 't.user_id')
        ->where('u.email', 'e2e-technician-nuevo@example.test')->value('t.id');
    expect(DB::table('technician_profiles')->where('id', $nuevo)->value('verification_status'))->toBe('pending')
        ->and(DB::table('technician_services')->where('technician_id', $nuevo)->exists())->toBeFalse();
});
