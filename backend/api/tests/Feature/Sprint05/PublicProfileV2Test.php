<?php

// S05-TC-190 a 194 y 196 · Fase 3 del panel final · Perfil público moderno del técnico (D-101, propuesta): forma de
// trabajo, garantía, «qué incluye» cada servicio, distritos, semana de disponibilidad por franjas, reseñas de ejemplo
// separadas de las calificaciones y portafolio con «antes y después». Nunca expone contacto, dirección ni documentos.
use Database\Factories\ClientProfileFactory;
use Database\Factories\MediaFileFactory;
use Database\Factories\TechnicianDocumentFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Storage::fake('public');
    $this->client = ClientProfileFactory::new()->create(['district_id' => Sprint04::district()])->user;
    $this->technician = Sprint04::technician([
        'profile' => ['display_name' => 'Rosa Quispe', 'experience_years' => 9, 'bio' => 'Reparo equipos de frío comercial.',
            'work_style' => 'Diagnóstico antes de cotizar.', 'warranty_text' => 'Garantía de 30 días en la mano de obra.'],
        'subcategory' => 'frio-vitrinas', 'fee' => '120.00', 'slots' => false,
        'districts' => [Sprint04::district('HUANCAYO'), Sprint04::district('EL-TAMBO')],
    ]);
    DB::table('technician_services')->where('technician_id', $this->technician->id)->update(['includes' => 'Revisión del compresor y limpieza del condensador.']);
    Sanctum::actingAs($this->client);
});

function s05Profile(object $test, int $id): array
{
    return $test->getJson("/api/v1/technicians/$id")->assertOk()->json('data');
}

it('S05-TC-190 el perfil público trae verificado, forma de trabajo, garantía, qué incluye, especialidades y distritos', function () {
    $profile = s05Profile($this, $this->technician->id);

    expect($profile['verified'])->toBeTrue()
        ->and($profile['work_style'])->toBe('Diagnóstico antes de cotizar.')
        ->and($profile['warranty_text'])->toBe('Garantía de 30 días en la mano de obra.')
        ->and($profile['services'][0]['includes'])->toBe('Revisión del compresor y limpieza del condensador.')
        ->and(array_column($profile['specialties'], 'name'))->toBe(['Refrigeración comercial'])
        ->and(array_column($profile['districts'], 'name'))->toBe(['El Tambo', 'Huancayo'])
        ->and($profile['favorite'])->toBeFalse();

    DB::table('technician_profiles')->where('id', $this->technician->id)->update(['work_style' => null, 'warranty_text' => null, 'verification_status' => 'pending']);
    $bare = s05Profile($this, $this->technician->id);
    expect([$bare['work_style'], $bare['warranty_text'], $bare['verified']])->toBe([null, null, false]);
});

it('S05-TC-191 la semana de disponibilidad marca Mañana 08–12, Tarde 12–18 y Noche 18–21 por superposición', function () {
    Sprint04::weeklySlot($this->technician->id, 1, '08:00:00', '18:00:00'); // mañana y tarde
    Sprint04::weeklySlot($this->technician->id, 2, '17:00:00', '20:00:00'); // tarde y noche
    Sprint04::weeklySlot($this->technician->id, 3, '06:00:00', '12:00:00'); // termina justo al empezar la tarde: solo mañana
    Sprint04::weeklySlot($this->technician->id, 4, '21:00:00', '23:00:00'); // empieza al terminar la noche: ninguna
    Sprint04::weeklySlot($this->technician->id, 5, '08:00:00', '12:00:00');
    DB::table('availability_slots')->where('weekday', 5)->update(['valid_until' => '2026-10-19']); // vencida
    Sprint04::weeklySlot($this->technician->id, 6, '12:00:00', '13:00:00');
    DB::table('availability_slots')->where('weekday', 6)->update(['active' => 0]);

    $availability = s05Profile($this, $this->technician->id)['availability'];

    expect(array_column($availability['week'], 'bands', 'weekday'))->toBe([
        1 => ['morning', 'afternoon'], 2 => ['afternoon', 'night'], 3 => ['morning'], 4 => [], 5 => [], 6 => [], 7 => [],
    ])->and(array_column($availability['week'], 'day'))->toBe(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'])
        // Martes 09:00 en Lima: la franja de hoy empieza a las 17:00 y no ha terminado.
        ->and($availability['available_today'])->toBeTrue();
});

it('S05-TC-192 el perfil público nunca expone teléfono, correo, WhatsApp, dirección ni documentos [TC-034]', function () {
    DB::table('technician_profiles')->where('id', $this->technician->id)->update(['whatsapp' => '+51987654321']);
    $document = TechnicianDocumentFactory::new()->create(['technician_id' => $this->technician->id]);
    $user = DB::table('users')->where('id', $this->technician->user_id)->first(['email', 'phone']);

    $body = $this->getJson("/api/v1/technicians/{$this->technician->id}")->assertOk()->getContent();

    expect($body)->not->toContain('987654321')->not->toContain($user->email)->not->toContain((string) $user->phone)
        ->not->toContain('user_id')->not->toContain('documents')->not->toContain('address')->not->toContain('base_district')
        ->not->toContain('/api/v1/media/'.$document->media_id);
});

it('S05-TC-193 las reseñas de ejemplo traen promedio, barras de 5 a 1 y la marca de demostración; sin ellas, vacío', function () {
    foreach ([[5, '2026-10-10'], [5, '2026-10-12'], [4, '2026-10-01'], [3, '2026-09-20'], [5, '2026-10-15']] as [$rating, $on]) {
        DB::table('technician_review_samples')->insert(['technician_id' => $this->technician->id, 'rating' => $rating,
            'comment' => "Comentario de $rating estrellas.", 'author_label' => 'Cliente de El Tambo', 'reviewed_on' => $on]);
    }

    $profile = s05Profile($this, $this->technician->id);

    expect($profile['rating'])->toBe(['average' => null, 'count' => 0])
        ->and($profile['sample_rating'])->toBe(['average' => 4.4, 'count' => 5, 'distribution' => ['5' => 3, '4' => 1, '3' => 1, '2' => 0, '1' => 0]])
        ->and(array_column($profile['reviews'], 'reviewed_on'))->toBe(['2026-10-15', '2026-10-12', '2026-10-10', '2026-10-01', '2026-09-20'])
        ->and(array_keys($profile['reviews'][0]))->toEqualCanonicalizing(['id', 'rating', 'comment', 'author_label', 'reviewed_on', 'sample'])
        ->and(array_unique(array_column($profile['reviews'], 'sample')))->toBe([true]);

    $other = Sprint04::technician(['slots' => false]);
    $empty = s05Profile($this, $other->id);
    expect([$empty['sample_rating'], $empty['reviews']])->toBe([null, []]);
});

it('S05-TC-194 el técnico edita forma de trabajo, garantía y qué incluye con límites en español y sin nueva versión de tarifa', function () {
    Sanctum::actingAs($this->technician->user);
    $own = $this->getJson('/api/v1/technicians/me/profile')->assertOk()->json('data');
    $service = ['subcategory_id' => Sprint04::subcategory('frio-vitrinas'), 'reference_fee' => '120.00'];

    $long = $this->patchJson('/api/v1/technicians/me/profile', ['work_style' => str_repeat('a', 501), 'warranty_text' => str_repeat('b', 301),
        'expected_version' => $own['version']]);
    Sprint01::assertSpanishValidation($long, ['work_style', 'warranty_text']);
    expect($long->json('errors.work_style.0'))->toBe('La forma de trabajo admite hasta 500 caracteres.')
        ->and($long->json('errors.warranty_text.0'))->toBe('La garantía admite hasta 300 caracteres.');
    $longIncludes = $this->putJson('/api/v1/technicians/me/services', ['services' => [$service + ['includes' => str_repeat('c', 301)]],
        'expected_version' => $own['version']]);
    expect($longIncludes->assertUnprocessable()->json('errors')['services.0.includes'][0])->toBe('«Qué incluye» admite hasta 300 caracteres.');

    $this->patchJson('/api/v1/technicians/me/profile', ['work_style' => str_repeat('a', 500), 'warranty_text' => '',
        'expected_version' => $own['version']])->assertOk();
    $version = $this->getJson('/api/v1/technicians/me/profile')->json('data.version');
    $saved = $this->putJson('/api/v1/technicians/me/services', ['services' => [$service + ['includes' => 'Incluye repuestos menores.']],
        'expected_version' => $version])->assertOk();
    $mine = $this->getJson('/api/v1/technicians/me/profile')->json('data');

    expect($mine['work_style'])->toHaveLength(500)
        ->and($mine['warranty_text'])->toBeNull()
        ->and($mine['services'][0]['includes'])->toBe('Incluye repuestos menores.')
        ->and($mine['services'][0]['rate_version'])->toBe(1)
        ->and(DB::table('service_rate_versions')->count())->toBe(0)
        ->and($saved->json('data.version'))->toBe($version + 1);
});

it('S05-TC-196 el portafolio marca cada imagen como antes o después y valida la marca en español', function () {
    Sanctum::actingAs($this->technician->user);
    $before = MediaFileFactory::new()->publicImage()->create(['owner_id' => $this->technician->user_id]);
    $after = MediaFileFactory::new()->publicImage()->create(['owner_id' => $this->technician->user_id]);
    $payload = ['title' => 'Cambio de compresor', 'status' => 'published', 'media_ids' => [$before->id, $after->id]];

    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/portfolio', $payload + ['image_stages' => ['antes', 'after']]), ['image_stages.0']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/technicians/me/portfolio', $payload + ['image_stages' => ['before']]), ['image_stages']);
    $this->postJson('/api/v1/technicians/me/portfolio', $payload + ['image_stages' => ['before', 'after']])->assertCreated();
    $plain = MediaFileFactory::new()->count(2)->publicImage()->create(['owner_id' => $this->technician->user_id])->modelKeys();
    $this->postJson('/api/v1/technicians/me/portfolio', ['title' => 'Sin marca', 'media_ids' => $plain] + $payload)->assertCreated();

    $gallery = collect(s05Profile($this, $this->technician->id)['portfolio'])->keyBy('title');
    expect(array_column($gallery['Cambio de compresor']['images'], 'stage'))->toBe(['before', 'after'])
        ->and(array_column($gallery['Sin marca']['images'], 'stage'))->toBe([null, null])
        ->and(Str::of(json_encode($gallery))->contains('caption'))->toBeTrue();
});
