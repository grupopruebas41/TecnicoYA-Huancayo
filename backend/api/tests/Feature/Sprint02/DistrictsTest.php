<?php

// HU-S02-02 y HU-S02-06 · RF-C01, RF-05 · Distritos de cobertura (D-15; contrato S2 §3.2 y §7.5).
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AuthorizationSeeder::class);
    Sprint01::actAsSpa($this);
});

it('S02-TC-020 siembra Huancayo, El Tambo y Chilca una sola vez y no pisa lo que cambió el administrador', function () {
    $this->seed(DistrictSeeder::class);
    DB::table('districts')->where('name', 'El Tambo')->update(['active' => 0]);

    $this->seed(DistrictSeeder::class);

    expect(DB::table('districts')->orderBy('id')->pluck('name')->all())->toBe(['Huancayo', 'El Tambo', 'Chilca'])
        ->and(DB::table('districts')->orderBy('id')->pluck('active')->all())->toBe([1, 0, 1]);
    expect(array_column($this->getJson('/api/v1/catalog/districts')->assertOk()->json('data'), 'name'))->toBe(['Huancayo', 'Chilca']);
});

it('S02-TC-021 CRUD-01 crea y desactiva un distrito con auditoría; el inactivo sale del catálogo público', function () {
    $admin = Sprint02::admin();
    Sanctum::actingAs($admin);

    $created = $this->postJson('/api/v1/admin/districts', ['name' => 'Pilcomayo'])->assertCreated()
        ->assertJsonPath('data.code', 'PILCOMAYO')->assertJsonPath('data.active', true)->assertJsonPath('data.version', 1);
    $id = $created->json('data.id');
    Sprint01::assertSpanishValidation($this->postJson('/api/v1/admin/districts', ['name' => 'Pilcomayo']), ['name']);
    expect(array_column($this->getJson('/api/v1/catalog/districts')->json('data'), 'id'))->toContain($id);

    $this->patchJson("/api/v1/admin/districts/$id", ['active' => false, 'expected_version' => 1])
        ->assertOk()->assertJsonPath('data.active', false)->assertJsonPath('data.version', 2);

    expect(array_column($this->getJson('/api/v1/catalog/districts')->json('data'), 'id'))->not->toContain($id);
    expect(Sprint02::itemsWith($this->getJson('/api/v1/admin/districts')->assertOk()->json('data'), 'id', $id)[0]['active'])->toBeFalse();
    $this->assertDatabaseHas('audit_entries', ['actor_id' => $admin->id, 'action' => 'catalog.district.created', 'subject_id' => $id]);
    $this->assertDatabaseHas('audit_entries', ['actor_id' => $admin->id, 'action' => 'catalog.district.updated', 'subject_id' => $id]);
});
