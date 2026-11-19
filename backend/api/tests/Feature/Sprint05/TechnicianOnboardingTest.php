<?php

// S05-TC-354 a 356 · Panel del técnico, Fase T5 (modo rápido, D-105 y D-112): avisos de oferta guardados en la cuenta
// (solo el técnico los cambia), «Primeros pasos» del Inicio y las marcas de bienvenida y tutorial en la demo y en E2E.
use App\Modules\FAdministration\Application\UserPreferences;
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Seeders\DemoSeeder;
use Database\Seeders\Sprint04E2ESeeder;
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
    // Contraseña sintética y aleatoria solo para esta siembra (las Sprint01 a 05 la exigen de 24 caracteres o más).
    $password = 'e2e-'.bin2hex(random_bytes(16));
    putenv("TECNICOYA_E2E_PASSWORD=$password");
    $_ENV['TECNICOYA_E2E_PASSWORD'] = $_SERVER['TECNICOYA_E2E_PASSWORD'] = $password;
    try {
        $this->seed(Sprint05E2ESeeder::class);
    } finally {
        putenv('TECNICOYA_E2E_PASSWORD');
        unset($_ENV['TECNICOYA_E2E_PASSWORD'], $_SERVER['TECNICOYA_E2E_PASSWORD']);
    }
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

it('S05-TC-376 las cuentas E2E sembradas de S01 a S04 ya vieron la bienvenida y el tutorial (Cypress de S01 a S04)', function () {
    // Cierre S4-S5: el workflow e2e-cierre mostró la bienvenida del técnico (T5) y la del cliente (Fase 5) tapando la pantalla
    // en las Cypress de S01 a S04, cuyas siembras no la marcaban. Solo las cuentas que la prueban empiezan de cero
    // (e2e-technician-nuevo en el S5, y los clientes que cada prueba registra).
    expect(DB::connection()->getDatabaseName())->toEndWith('_testing');
    config(['database.connections.mysql.database' => 'tecnicoya_testing']);
    $password = 'e2e-'.bin2hex(random_bytes(16));
    putenv("TECNICOYA_E2E_PASSWORD=$password");
    $_ENV['TECNICOYA_E2E_PASSWORD'] = $_SERVER['TECNICOYA_E2E_PASSWORD'] = $password;
    try {
        $this->seed(Sprint04E2ESeeder::class);
    } finally {
        putenv('TECNICOYA_E2E_PASSWORD');
        unset($_ENV['TECNICOYA_E2E_PASSWORD'], $_SERVER['TECNICOYA_E2E_PASSWORD']);
    }
    $accounts = DB::table('users')->where('email', 'like', 'e2e-%')->get(['email', 'onboarding_completed_at', 'tour_completed_at']);
    expect($accounts->pluck('email'))->toContain('e2e-client@example.test', 'e2e-technician@example.test', 'e2e-admin@example.test', 'e2e-technician-active@example.test')
        ->and($accounts->filter(fn ($row) => $row->onboarding_completed_at === null || $row->tour_completed_at === null)->pluck('email')->all())->toBe([]);
});
