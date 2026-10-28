<?php

// S05-TC-068, 069 y 076 · Catálogo › Palabras clave (D-94): permisos, alta y edición auditadas, frases sugeridas por
// la IA (aprobar o descartar) y el diccionario sembrado de forma idempotente.
use Database\Factories\ClientProfileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\KeywordSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
    $this->hardware = (int) DB::table('subcategories')->where('code', 'computo-hardware')->value('id');
});

function s05Audits(string $action): int
{
    return DB::table('audit_entries')->where('action', $action)->count();
}

it('S05-TC-068 solo catalog.manage administra las frases; alta, duplicado, versión y desactivación quedan auditadas', function () {
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->getJson('/api/v1/admin/keywords')->assertForbidden();
    $admin = Sprint02::admin();
    Sprint02::revokeFromAdminRole('catalog.manage');
    Sanctum::actingAs($admin);
    $this->postJson('/api/v1/admin/keywords', ['subcategory_id' => $this->hardware, 'phrase' => 'Laptop', 'weight' => 6, 'kind' => 'objeto'])
        ->assertForbidden();
    // Se devuelve catalog.manage al rol admin (el seeder no vuelve a asignar un permiso existente).
    DB::table('role_permissions')->insert(['role_id' => DB::table('roles')->where('code', 'admin')->value('id'),
        'permission_id' => DB::table('permissions')->where('code', 'catalog.manage')->value('id')]);

    $created = $this->postJson('/api/v1/admin/keywords', ['subcategory_id' => $this->hardware, 'phrase' => '  Laptops ', 'weight' => 6,
        'kind' => 'objeto'])->assertCreated()->json('data');
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/keywords', ['subcategory_id' => $this->hardware, 'phrase' => 'laptop',
        'weight' => 6, 'kind' => 'objeto']), ['phrase']);
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/keywords', ['subcategory_id' => $this->hardware, 'phrase' => 'pantalla',
        'weight' => 11, 'kind' => 'cosa']), ['weight', 'kind']);
    $this->patchJson("/api/v1/admin/keywords/{$created['id']}", ['weight' => 7, 'expected_version' => 9])->assertConflict();
    $this->patchJson("/api/v1/admin/keywords/{$created['id']}", ['active' => false, 'expected_version' => 1])->assertOk()
        ->assertJsonPath('data.active', false)->assertJsonPath('data.version', 2);

    expect($created)->toMatchArray(['phrase' => 'Laptops', 'normalized_phrase' => 'laptop', 'weight' => 6, 'kind' => 'objeto', 'active' => true])
        ->and([s05Audits('catalog.keyword_created'), s05Audits('catalog.keyword_updated')])->toBe([1, 1])
        ->and($this->getJson('/api/v1/admin/keywords?subcategory_id='.$this->hardware)->assertOk()->json('data.items.0.subcategory_name'))
        ->toBe('Reparación de hardware')
        ->and($this->getJson('/api/v1/admin/keywords/test?q=mi+laptop')->assertOk()->json('data.items'))->toBe([]);
});

it('S05-TC-069 aprobar una frase sugerida por la IA la agrega al diccionario; descartar no; ambas una sola vez', function () {
    Sanctum::actingAs(Sprint02::admin());
    $now = now();
    $pending = fn (string $query) => DB::table('keyword_suggestions')->insertGetId(['normalized_query' => $query,
        'subcategory_id' => $this->hardware, 'status' => 'pending', 'count' => 3, 'last_seen_at' => $now, 'created_at' => $now, 'updated_at' => $now]);
    $approve = $pending('pantallita parpadea');
    $discard = $pending('cosa rara');
    DB::table('keyword_misses')->insert(['normalized_query' => 'quirofano', 'count' => 4, 'last_seen_at' => $now]);

    expect(array_column($this->getJson('/api/v1/admin/keyword-suggestions')->assertOk()->json('data'), 'query'))
        ->toEqualCanonicalizing(['pantallita parpadea', 'cosa rara'])
        ->and($this->getJson('/api/v1/admin/keyword-misses')->assertOk()->json('data.0'))->toMatchArray(['query' => 'quirofano', 'count' => 4]);

    $this->postJson("/api/v1/admin/keyword-suggestions/$approve/approval", ['weight' => 6, 'kind' => 'sintoma'])->assertOk()
        ->assertJsonPath('data.status', 'approved');
    $this->deleteJson("/api/v1/admin/keyword-suggestions/$discard")->assertOk()->assertJsonPath('data.status', 'discarded');
    $this->postJson("/api/v1/admin/keyword-suggestions/$approve/approval")->assertConflict();

    expect(DB::table('subcategory_keywords')->get(['normalized_phrase', 'weight', 'kind'])->map(fn ($r) => (array) $r)->all())
        ->toBe([['normalized_phrase' => 'pantallita parpadea', 'weight' => 6, 'kind' => 'sintoma']])
        ->and($this->getJson('/api/v1/admin/keyword-suggestions')->json('data'))->toBe([])
        ->and([s05Audits('catalog.keyword_suggestion_approved'), s05Audits('catalog.keyword_suggestion_discarded')])->toBe([1, 1]);
});

it('S05-TC-076 el diccionario sembrado tiene de 10 a 20 frases válidas por subcategoría activa y repetir no duplica', function () {
    $this->seed(KeywordSeeder::class);
    $first = DB::table('subcategory_keywords')->count();
    DB::table('subcategory_keywords')->where('subcategory_id', $this->hardware)->limit(1)->update(['weight' => 1, 'active' => 0]);
    $this->seed(KeywordSeeder::class);

    $perSubcategory = DB::table('subcategories')->where('active', 1)->pluck('id')
        ->map(fn (int $id) => DB::table('subcategory_keywords')->where('subcategory_id', $id)->count());
    expect(DB::table('subcategory_keywords')->count())->toBe($first)
        ->and($perSubcategory->min())->toBeGreaterThanOrEqual(10)
        ->and($perSubcategory->max())->toBeLessThanOrEqual(20)
        ->and($perSubcategory)->toHaveCount(30)
        ->and(DB::table('subcategory_keywords')->whereNotBetween('weight', [1, 10])->count())->toBe(0)
        ->and(DB::table('subcategory_keywords')->whereNotIn('kind', ['objeto', 'sintoma', 'general'])->count())->toBe(0)
        ->and(DB::table('subcategory_keywords')->where('active', 0)->count())->toBe(1);
});
