<?php

// S05-TC-421 a 423 · Cuentas de la exposición en el DemoSeeder (solo APP_ENV=local): demo-expo-cliente (Premium con todos sus
// datos y 1 pedido activo) y demo-expo-tecnico (verificado con agenda, historial y estadísticas). En cada siembra vuelven a su
// primera visita sin duplicar datos. Contraseña de TECNICOYA_DEMO_PASSWORD; aquí, una sintética generada al vuelo.
use App\Models\User;
use App\Modules\ARequests\Application\ActiveOrders;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    $this->password = Str::password(20);
    $name = DemoSeeder::PASSWORD_VARIABLE;
    putenv("$name={$this->password}");
    $_ENV[$name] = $_SERVER[$name] = $this->password;
    $this->app['env'] = 'local';
    $this->seed(DemoSeeder::class);
});

function s05Expo(string $alias): User
{
    return User::query()->where('email', "$alias@example.test")->firstOrFail();
}

/** Primera visita: sin bienvenida, tutorial, accesibilidad, avisos ni tema elegidos. */
function s05FirstVisit(User $user): void
{
    $row = DB::table('users')->where('id', $user->id)->first();
    expect([$row->onboarding_completed_at, $row->tour_completed_at, $row->accessibility_prefs, $row->offer_alert_prefs, $row->theme_preference])
        ->toBe([null, null, null, null, null]);
}

it('S05-TC-421 demo-expo-cliente es Premium con equipos, sensores con lecturas, una falla, promociones, garantías, 1 pedido activo y favoritos', function () {
    $user = s05Expo('demo-expo-cliente');
    $client = DB::table('client_profiles')->where('user_id', $user->id)->first();
    expect(Hash::check($this->password, $user->password))->toBeTrue()
        ->and($user->role->code ?? DB::table('roles')->where('id', $user->role_id)->value('code'))->toBe('client')
        ->and($client->plan)->toBe('premium');
    s05FirstVisit($user);

    Sanctum::actingAs($user);
    expect($this->getJson('/api/v1/client/equipment')->assertOk()->json('data.items'))->toHaveCount(3);
    $sensors = collect($this->getJson('/api/v1/client/iot/devices')->assertOk()->json('data.items'));
    expect($sensors)->toHaveCount(3)
        ->and($sensors->every(fn ($sensor) => count($sensor['readings']) >= 24 && $sensor['status'] !== 'no_data'))->toBeTrue();
    $alerts = collect($this->getJson('/api/v1/client/iot/alerts')->json('data.items'));
    expect($alerts->where('severity', 'failure')->whereNull('resolved_at')->count())->toBe(1)
        ->and($this->getJson('/api/v1/client/promotions')->json('data.items'))->not->toBeEmpty()
        ->and(collect($this->getJson('/api/v1/client/warranties')->json('data.items'))->where('active', true))->not->toBeEmpty()
        ->and(app(ActiveOrders::class)->count((int) $client->id))->toBe(1)
        ->and($this->getJson('/api/v1/client/favorites')->json('data.items'))->toHaveCount(3);
});

it('S05-TC-422 demo-expo-tecnico está verificado con 2 documentos aprobados, servicios, portafolio, agenda, historial y estadísticas', function () {
    $user = s05Expo('demo-expo-tecnico');
    $technician = DB::table('technician_profiles')->where('user_id', $user->id)->first();
    expect(Hash::check($this->password, $user->password))->toBeTrue()
        ->and([$technician->status, $technician->verification_status])->toBe(['active', 'approved'])
        ->and(DB::table('technician_documents')->where('technician_id', $technician->id)->where('review_status', 'approved')->count())->toBe(2)
        ->and(DB::table('technician_services')->where('technician_id', $technician->id)->where('reference_fee', '>', 0)->count())->toBeGreaterThanOrEqual(2)
        ->and(DB::table('portfolio_items')->where('technician_id', $technician->id)->count())->toBeGreaterThanOrEqual(1)
        ->and(DB::table('appointments')->where('technician_id', $technician->id)->where('starts_at', '>=', now()->startOfDay())->count())->toBeGreaterThanOrEqual(1)
        ->and(DB::table('offers')->where('technician_id', $technician->id)->distinct()->pluck('status')->sort()->values()->all())->toBe(['accepted', 'expired', 'rejected'])
        ->and(DB::table('participations')->where('technician_id', $technician->id)->where('status', 'completed')->count())->toBeGreaterThan(5);
    s05FirstVisit($user);

    Sanctum::actingAs($user);
    $stats = $this->getJson('/api/v1/technicians/me/stats?period=month')->assertOk()->json('data');
    expect($stats['totals']['accepted'])->toBeGreaterThan(0)->and($stats['totals']['completed'])->toBeGreaterThan(0);
    expect($this->getJson("/api/v1/technicians/{$technician->id}")->assertOk()->json('data.response_minutes'))->not->toBeNull();
});

it('S05-TC-423 al volver a sembrar, las dos cuentas regresan a su primera visita sin duplicar sus datos', function () {
    $client = s05Expo('demo-expo-cliente');
    $technician = s05Expo('demo-expo-tecnico');
    DB::table('users')->whereIn('id', [$client->id, $technician->id])->update(['onboarding_completed_at' => now(), 'tour_completed_at' => now(),
        'accessibility_prefs' => json_encode(['text_size' => 'large']), 'theme_preference' => 'dark']);
    DB::table('users')->where('id', $technician->id)->update(['offer_alert_prefs' => json_encode(['sound' => true])]);
    $count = fn () => [DB::table('client_equipment')->where('user_id', $client->id)->count(),
        DB::table('client_favorite_technicians')->where('client_user_id', $client->id)->count(),
        DB::table('offers')->where('technician_id', DB::table('technician_profiles')->where('user_id', $technician->id)->value('id'))->count(),
        DB::table('portfolio_items')->where('technician_id', DB::table('technician_profiles')->where('user_id', $technician->id)->value('id'))->count()];
    $before = $count();

    $this->seed(DemoSeeder::class);

    s05FirstVisit($client->fresh());
    s05FirstVisit($technician->fresh());
    expect($count())->toBe($before)
        ->and(app(ActiveOrders::class)->count((int) DB::table('client_profiles')->where('user_id', $client->id)->value('id')))->toBe(1);
});
