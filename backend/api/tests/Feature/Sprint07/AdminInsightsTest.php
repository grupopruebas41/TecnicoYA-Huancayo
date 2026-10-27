<?php

// S07-TC-121 a 128 · Adelanto del Sprint 7 (bloque C, D-85) · Estadísticas del panel (GET /admin/statistics) con
// agregados SQL de datos reales y consultas acotadas; solicitudes en solo lectura con su línea de tiempo; y el Inicio
// con contadores del menú y los últimos eventos. Permiso dashboard.view. Las alertas del dashboard (TC-087 y 088)
// siguen en el Sprint 7.
use App\Models\TechnicianProfile;
use Carbon\CarbonImmutable;
use Database\Factories\AnnouncementFactory;
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\UserFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->admin = Sprint02::admin();
});

function s07iStats(object $test, int $days = 30): array
{
    Sprint01::forgetSession();
    Sanctum::actingAs($test->admin);

    return $test->getJson("/api/v1/admin/statistics?days=$days")->assertOk()->json('data');
}

/**
 * Datos del flujo real del S4: R1 (Cómputo, Huancayo) aceptada a los 2 min, asignada y terminada; R2 (Electricidad,
 * Huancayo) rechazada a los 4 min; R3 (Cómputo, El Tambo) registrada sin enviar; R4 de hace 40 días.
 */
function s07iDataset(object $test): array
{
    $computo = Sprint04::technician();
    $electro = Sprint04::technician(['subcategory' => 'electricidad-tableros']);
    // created_at explícito: el valor por defecto de la columna es el reloj de MySQL, no el reloj controlado.
    $r1 = Sprint04::sentRequest(['created_at' => now()]);
    $r2 = Sprint04::sentRequest(['created_at' => now(), 'subcategory_id' => Sprint04::subcategory('electricidad-tableros')]);
    $r3 = Sprint04::sentRequest(['created_at' => now(), 'status' => 'registered', 'submitted_at' => null, 'district_id' => Sprint04::district('EL-TAMBO')]);
    $r4 = Sprint04::sentRequest(['created_at' => now()->subDays(40), 'submitted_at' => now()->subDays(40)]);
    Sprint04::prepare($r1->id);
    Sprint04::prepare($r2->id);
    $test->travel(2)->minutes();
    Sprint04::respond($test, $computo, Sprint04::offerTo($r1->id, $computo->id), 'accept')->assertOk();
    $test->travel(2)->minutes();
    Sprint04::respond($test, $electro, Sprint04::offerTo($r2->id, $electro->id), 'reject')->assertOk();
    Sprint04::select($test, DB::table('service_requests')->find($r1->id), Sprint04::offerTo($r1->id, $computo->id)->id)->assertOk();
    DB::table('participations')->where('request_id', $r1->id)->update(['status' => 'completed', 'completed_at' => now()]);

    return compact('computo', 'electro', 'r1', 'r2', 'r3', 'r4');
}

it('S07-TC-121 las estadísticas exigen dashboard.view, aceptan 7, 30 o 90 días y devuelven un día por fecha con ceros', function () {
    Sprint01::forgetSession();
    $this->getJson('/api/v1/admin/statistics')->assertUnauthorized();
    Sanctum::actingAs(UserFactory::new()->client()->create());
    $this->getJson('/api/v1/admin/statistics')->assertForbidden();

    Sprint01::forgetSession();
    Sanctum::actingAs($this->admin);
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/admin/statistics?days=15'), ['days']);
    foreach ([7, 30, 90] as $days) {
        $data = s07iStats($this, $days);
        expect($data['range'])->toBe(['days' => $days, 'from' => now()->subDays($days - 1)->toDateString(), 'to' => now()->toDateString()])
            ->and($data['requests_per_day'])->toHaveCount($days)
            ->and(collect($data['requests_per_day'])->sum('total'))->toBe(0)
            ->and(end($data['requests_per_day']))->toBe(['date' => now()->toDateString(), 'total' => 0]);
    }
    expect(s07iStats($this)['range']['days'])->toBe(30);
});

it('S07-TC-122 agrega solicitudes por día, especialidad y distrito, y el embudo enviado, con ofertas, asignado y terminado', function () {
    s07iDataset($this);
    $data = s07iStats($this);

    expect(collect($data['requests_per_day'])->firstWhere('date', '2026-10-20')['total'])->toBe(3)
        ->and(collect($data['requests_per_day'])->sum('total'))->toBe(3)
        ->and(collect($data['requests_by_specialty'])->pluck('total', 'name')->all())->toBe(['Cómputo' => 2, 'Electricidad' => 1])
        ->and(collect($data['requests_by_district'])->pluck('total', 'name')->all())->toBe(['Huancayo' => 2, 'El Tambo' => 1])
        ->and($data['funnel'])->toBe(['sent' => 2, 'with_offers' => 2, 'assigned' => 1, 'completed' => 1]);
    // La de hace 40 días solo entra en la ventana de 90.
    expect(collect(s07iStats($this, 90)['requests_per_day'])->sum('total'))->toBe(4);
});

it('S07-TC-123 calcula la tasa de aceptación de ofertas y el tiempo medio de respuesta; sin respuestas devuelve nulos', function () {
    expect(s07iStats($this)['offers'])->toBe(['total' => 0, 'accepted' => 0, 'rejected' => 0, 'expired' => 0,
        'acceptance_rate' => null, 'avg_response_seconds' => null]);

    s07iDataset($this);
    expect(s07iStats($this)['offers'])->toBe(['total' => 2, 'accepted' => 1, 'rejected' => 1, 'expired' => 0,
        'acceptance_rate' => 0.5, 'avg_response_seconds' => 180]);
});

it('S07-TC-124 cuenta técnicos por estado, usuarios nuevos por rol y comunicados vigentes por audiencia', function () {
    TechnicianProfileFactory::new()->count(2)->create();
    TechnicianProfileFactory::new()->approved()->create();
    TechnicianProfileFactory::new()->approved()->create(['status' => 'suspended']);
    UserFactory::new()->client()->create(['anonymized_at' => now()]);
    UserFactory::new()->client()->create(['created_at' => now()->subDays(10)]);
    // El autor es el administrador de la prueba: la fábrica crearía otro administrador por comunicado.
    $by = ['created_by' => $this->admin->id, 'updated_by' => $this->admin->id];
    AnnouncementFactory::new()->forRoles(['client', 'technician'])->create($by);
    AnnouncementFactory::new()->forRoles(['client'])->create($by);
    AnnouncementFactory::new()->forRoles(['client'])->create($by + ['status' => 'draft']);
    AnnouncementFactory::new()->forRoles(['technician'])->create($by + ['retired_at' => now()]);

    $data = s07iStats($this, 7);
    expect($data['technicians_by_status'])->toBe(['pending_verification' => 2, 'active' => 1, 'inactive' => 0, 'suspended' => 1])
        ->and($data['new_users_by_role'])->toBe(['client' => 0, 'technician' => 4, 'admin' => 1, 'total' => 5])
        ->and($data['active_announcements_by_audience'])->toBe(['client' => 2, 'technician' => 1]);
    expect(s07iStats($this, 30)['new_users_by_role']['client'])->toBe(1);
});

it('S07-TC-125 las estadísticas usan un número fijo de consultas, sin importar cuántas solicitudes haya', function () {
    $count = function () {
        Sprint01::forgetSession();
        Sanctum::actingAs($this->admin);
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/v1/admin/statistics?days=30')->assertOk();
        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $queries;
    };
    Sprint04::sentRequest(['created_at' => now()]);
    $few = $count();
    foreach (range(1, 25) as $index) {
        Sprint04::sentRequest(['created_at' => now(), 'district_id' => Sprint04::district($index % 2 ? 'HUANCAYO' : 'EL-TAMBO')]);
    }
    // 8 agregados de las estadísticas más las consultas fijas de sesión y permisos.
    expect($count())->toBe($few)->and($few)->toBeLessThanOrEqual(20);
});

it('S07-TC-126 lista las solicitudes en solo lectura con filtros por estado, distrito, especialidad, fecha y número', function () {
    ['r1' => $r1, 'r2' => $r2, 'r3' => $r3, 'r4' => $r4] = s07iDataset($this);
    Sprint01::forgetSession();
    Sanctum::actingAs($this->admin);
    $ids = fn (string $query = '') => collect($this->getJson("/api/v1/admin/requests$query")->assertOk()->json('data.items'))->pluck('id')->all();

    expect($ids())->toBe([$r3->id, $r2->id, $r1->id, $r4->id])
        ->and($ids('?status=assigned'))->toBe([$r1->id])
        ->and($ids('?district_id='.Sprint04::district('EL-TAMBO')))->toBe([$r3->id])
        ->and($ids('?specialty_id='.DB::table('specialties')->where('code', 'electricidad')->value('id')))->toBe([$r2->id])
        ->and($ids('?created_from=2026-09-01&created_to=2026-09-30'))->toBe([$r4->id])
        ->and($ids("?q={$r2->id}"))->toBe([$r2->id]);
    $item = collect($this->getJson('/api/v1/admin/requests')->json('data.items'))->firstWhere('id', $r1->id);
    expect($item)->toMatchArray(['status' => 'assigned', 'specialty' => 'Cómputo', 'district' => 'Huancayo'])
        ->and($item['technician'])->not->toBeNull()->and($item)->not->toHaveKey('address');
    Sprint01::assertSpanishValidation($this->getJson('/api/v1/admin/requests?status=otro'), ['status']);

    Sprint01::forgetSession();
    Sanctum::actingAs(UserFactory::new()->client()->create());
    $this->getJson('/api/v1/admin/requests')->assertForbidden();
    $this->getJson("/api/v1/admin/requests/{$r1->id}")->assertForbidden();
});

it('S07-TC-127 el detalle de una solicitud muestra la línea de tiempo en orden, el cliente y el técnico asignado', function () {
    ['r1' => $r1, 'computo' => $computo] = s07iDataset($this);
    Sprint01::forgetSession();
    Sanctum::actingAs($this->admin);
    $detail = $this->getJson("/api/v1/admin/requests/{$r1->id}")->assertOk()->json('data');

    $events = DB::table('request_events')->where('request_id', $r1->id)->orderBy('occurred_at')->orderBy('id')->pluck('event_type')->all();
    expect($detail['request'])->toMatchArray(['id' => $r1->id, 'status' => 'assigned', 'subcategory' => 'Reparación de hardware', 'district' => 'Huancayo'])
        ->and($detail['technician'])->toMatchArray(['id' => $computo->id, 'name' => $computo->display_name])
        ->and($detail['client']['name'])->toBe(Sprint04::clientUser($r1)->name)
        ->and($detail['offers'])->toMatchArray(['total' => 1, 'accepted' => 1])
        ->and(collect($detail['timeline'])->pluck('event_type')->all())->toBe($events)
        ->and($events)->toContain('request.assigned')
        ->and($detail['timeline'][0])->toHaveKeys(['event_type', 'from_status', 'to_status', 'summary', 'occurred_at']);
    $this->getJson('/api/v1/admin/requests/999999')->assertNotFound();

    // Solo lectura: no hay rutas para cambiar una solicitud desde el panel.
    $before = DB::table('service_requests')->find($r1->id);
    foreach (['POST' => "/api/v1/admin/requests/{$r1->id}", 'PATCH' => "/api/v1/admin/requests/{$r1->id}", 'DELETE' => "/api/v1/admin/requests/{$r1->id}"] as $method => $uri) {
        expect($this->json($method, $uri, ['status' => 'cancelled'])->status())->toBe(405);
    }
    expect(DB::table('service_requests')->find($r1->id))->toEqual($before);
});

it('S07-TC-128 el Inicio entrega los contadores del menú y los últimos 5 eventos relevantes, sin datos personales', function () {
    TechnicianProfileFactory::new()->count(3)->create();
    AnnouncementFactory::new()->forRoles(['client'])->create(['created_by' => $this->admin->id, 'updated_by' => $this->admin->id]);
    AnnouncementFactory::new()->forRoles(['technician'])->create(['status' => 'draft', 'created_by' => $this->admin->id, 'updated_by' => $this->admin->id]);
    foreach (range(1, 7) as $index) {
        $this->travel(1)->minutes();
        DB::table('audit_entries')->insert(['actor_id' => $this->admin->id, 'actor_kind' => 'user', 'action' => $index % 2 ? 'user.blocked' : 'announcement.published',
            'permission_used' => 'users.manage', 'subject_type' => 'user', 'subject_id' => $this->admin->id, 'reason' => "Evento sintético $index",
            'correlation_id' => "c$index", 'occurred_at' => now(), 'source_code' => 'api.v1']);
    }
    $this->travel(1)->minutes();
    DB::table('audit_entries')->insert(['actor_id' => $this->admin->id, 'actor_kind' => 'user', 'action' => 'auth.login', 'subject_type' => 'user',
        'subject_id' => $this->admin->id, 'reason' => 'Inicio de sesión de administrador.', 'correlation_id' => 'c8', 'occurred_at' => now(), 'source_code' => 'api.v1']);

    Sprint01::forgetSession();
    Sanctum::actingAs($this->admin);
    $response = $this->getJson('/api/v1/admin/dashboard')->assertOk();
    $data = $response->json('data');
    expect($data['technicians_pending_verification'])->toBe(3)
        ->and($data['announcements_active'])->toBe(1)
        ->and(collect($data['recent_events'])->pluck('reason')->all())->toBe(['Evento sintético 7', 'Evento sintético 6', 'Evento sintético 5', 'Evento sintético 4', 'Evento sintético 3'])
        ->and($data['recent_events'][0])->toMatchArray(['action' => 'user.blocked', 'actor' => 'Administración de prueba']);
    expect($response->getContent())->not->toContain('@example');
});
