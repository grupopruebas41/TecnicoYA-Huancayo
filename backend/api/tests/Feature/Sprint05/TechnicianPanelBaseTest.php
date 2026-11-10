<?php

// S05-TC-275 a 281 · Panel del técnico, Fase T1 (modo rápido, D-104 y D-105): preferencias comunes en `users` para los
// tres roles, «Cerrar las otras sesiones», aviso de la verificación y aviso de oferta vencida al técnico.
use App\Models\User;
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Factories\TechnicianDocumentFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
});

it('S05-TC-275 el técnico y el administrador guardan sus ajustes en /me/preferences y llegan con /me [D-105]', function () {
    foreach ([Sprint04::technician()->user, Sprint02::admin()] as $user) {
        Sprint01::forgetSession();
        Sanctum::actingAs($user);
        $this->getJson('/api/v1/me/preferences')->assertOk()->assertJsonPath('data.accessibility.text_size', 100)
            ->assertJsonPath('data.onboarding_completed_at', null);
        $this->putJson('/api/v1/me/preferences', ['accessibility' => ['text_size' => 130, 'reduce_motion' => true]])
            ->assertOk()->assertJsonPath('data.accessibility.text_size', 130)->assertJsonPath('data.accessibility.reduce_motion', true)
            ->assertJsonPath('data.accessibility.high_contrast', false);
        expect(json_decode(DB::table('users')->where('id', $user->id)->value('accessibility_prefs'), true)['text_size'])->toBe(130)
            ->and($this->getJson('/api/v1/me')->json('data.preferences.accessibility.reduce_motion'))->toBeTrue();
    }
});

it('S05-TC-276 la lista blanca rechaza claves ajenas, como datos de salud, y un tamaño fuera del dominio [D-105]', function () {
    $user = Sprint04::technician()->user;
    Sanctum::actingAs($user);
    foreach ([['disability' => 'visual'], ['accessibility' => ['diagnosis' => 'x']], ['welcome_card' => 'voice']] as $body) {
        $response = $this->putJson('/api/v1/me/preferences', $body)->assertUnprocessable();
        Sprint01::assertSpanishText($response->json('error.message'));
    }
    Sprint01::assertSpanishValidation($this->putJson('/api/v1/me/preferences', ['accessibility' => ['text_size' => 120]]), ['accessibility.text_size']);
    expect(DB::table('users')->where('id', $user->id)->value('accessibility_prefs'))->toBeNull();
});

it('S05-TC-277 la bienvenida y el tutorial se marcan una sola vez, con el reloj controlado [D-105]', function () {
    $user = Sprint04::technician()->user;
    Sanctum::actingAs($user);
    $this->travelTo(now()->startOfMinute());
    $first = $this->putJson('/api/v1/me/preferences', ['onboarding_completed' => true, 'tour_completed' => true])->assertOk()->json('data');
    $this->travel(2)->days();
    $again = $this->putJson('/api/v1/me/preferences', ['onboarding_completed' => true, 'tour_completed' => true])->assertOk()->json('data');
    expect($again['onboarding_completed_at'])->toBe($first['onboarding_completed_at'])->not->toBeNull()
        ->and($again['tour_completed_at'])->toBe($first['tour_completed_at']);
});

it('S05-TC-278 el cliente sigue usando /client/me/preferences sobre las mismas columnas de users [D-105]', function () {
    $client = ClientProfileFactory::new()->create()->user;
    Sanctum::actingAs($client);
    $this->putJson('/api/v1/client/me/preferences', ['accessibility' => ['high_contrast' => true]])->assertOk();
    expect($this->getJson('/api/v1/me/preferences')->json('data.accessibility.high_contrast'))->toBeTrue()
        ->and($this->getJson('/api/v1/me')->json('data.client_profile.preferences.accessibility.high_contrast'))->toBeTrue();
    // La ruta del cliente sigue siendo solo del cliente; sin sesión, 401.
    Sanctum::actingAs(Sprint04::technician()->user);
    $this->getJson('/api/v1/client/me/preferences')->assertForbidden();
});

it('S05-TC-279 «Cerrar las otras sesiones» conserva la actual, cierra las demás y se audita', function () {
    $password = 'Clave-Sintetica-279!';
    $user = Sprint04::technician()->user;
    $user->forceFill(['password' => $password])->save();
    Sprint01::actAsSpa($this);
    $other = Sprint01::loginThroughApi($this, $user->email, $password);
    Sprint01::forgetSession();
    $current = Sprint01::loginThroughApi($this, $user->email, $password);
    Sprint01::forgetSession();
    $cookie = config('session.cookie');
    expect(DB::table('sessions')->where('user_id', $user->id)->count())->toBe(2);

    $response = $this->withUnencryptedCookie($cookie, $current)->postJson('/api/v1/me/sessions/revoke-others')->assertOk()
        ->assertJsonPath('data.closed', 1)->assertJsonPath('data.message', 'Cerramos 1 sesión en otro equipo.');
    Sprint01::assertSpanishText($response->json('data.message'));
    Sprint01::forgetSession();
    $this->withUnencryptedCookie($cookie, $current)->getJson('/api/v1/me')->assertOk();
    Sprint01::forgetSession();
    $this->withUnencryptedCookie($cookie, $other)->getJson('/api/v1/me')->assertUnauthorized();
    $audit = DB::table('audit_entries')->where('action', 'auth.sessions_revoked')->sole();
    expect((int) $audit->subject_id)->toBe($user->id)->and(json_decode($audit->after_values, true))->toBe(['closed' => 1]);
    Sprint01::forgetSession();
    $this->postJson('/api/v1/me/sessions/revoke-others')->assertUnauthorized();
});

it('S05-TC-280 la decisión de verificación llega a la campana del técnico, sin los documentos', function () {
    Storage::fake('local');
    $approve = TechnicianProfileFactory::new()->create();
    $reject = TechnicianProfileFactory::new()->create();
    foreach ([$approve, $reject] as $technician) {
        TechnicianServiceFactory::new()->create(['technician_id' => $technician->id]);
        DB::table('technician_districts')->insert(['technician_id' => $technician->id, 'district_id' => DistrictFactory::new()->create()->id]);
        TechnicianDocumentFactory::new()->create(['technician_id' => $technician->id]);
    }
    Sanctum::actingAs(Sprint02::admin());
    $this->postJson("/api/v1/admin/technicians/{$approve->id}/reviews", ['decision' => 'approve',
        'reason' => 'Identidad, servicios, zona y evidencia revisados.', 'expected_version' => $approve->version])->assertCreated();
    $this->postJson("/api/v1/admin/technicians/{$reject->id}/reviews", ['decision' => 'reject',
        'reason' => 'Falta la constancia técnica legible.', 'expected_version' => $reject->version])->assertCreated();

    Sanctum::actingAs(User::find($approve->user_id));
    $item = collect($this->getJson('/api/v1/notifications')->assertOk()->json('data.items'))->firstWhere('type', 'technician.verification.approved');
    expect($item)->not->toBeNull()->and($item['title'])->toBe('Tu verificación fue aprobada')->and($item['category'])->toBe('verification')
        ->and(json_encode($item))->not->toContain('/media/');
    Sanctum::actingAs(User::find($reject->user_id));
    expect(collect($this->getJson('/api/v1/notifications')->json('data.items'))->pluck('type')->all())->toContain('technician.verification.rejected')
        ->not->toContain('technician.verification.approved');
});

it('S05-TC-281 el técnico recibe en su campana la oferta que venció sin respuesta', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $round = Sprint04::rounds($request->id)[0];
    $this->travelTo(now()->addMinutes(11));
    Sprint04::expireRound($round->id);

    $rows = DB::table('notifications')->where('user_id', $technician->user_id)->where('type', 'offer.expired')->get();
    expect($rows)->toHaveCount(1)->and($rows[0]->body)->toBe("La oferta de la solicitud #{$request->id} venció sin respuesta.")
        ->and(App\Modules\CNotifications\Application\NotificationContext::category('offer.expired'))->toBe('cancel')
        ->and(App\Modules\CNotifications\Application\NotificationContext::category('technician.verification.rejected'))->toBe('verification');
});
