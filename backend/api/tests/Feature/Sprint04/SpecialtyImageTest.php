<?php

// S04-TC-133 · HU-S02-01 · RF-C08 · Pedido de Codex (PR #22): GET /catalog/specialties devuelve image_url (string|null)
// a partir de specialties.hero_media_id, solo si el medio es público, revisado (clean) y no retirado, como el carrusel.
use Database\Factories\MediaFileFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Storage::fake('public');
    Storage::fake('local');
    Sprint01::actAsSpa($this);
    $this->owner = Sprint02::admin();
});

it('S04-TC-133 expone la foto de la especialidad solo si es pública, revisada y no retirada [TC-012]', function () {
    $media = fn (array $state = []) => MediaFileFactory::new()->publicImage()->create(['owner_id' => $this->owner->id] + $state)->id;
    $clean = $media();
    DB::table('specialties')->where('code', 'computo')->update(['hero_media_id' => $clean]);
    DB::table('specialties')->where('code', 'refrigeracion')->update(['hero_media_id' => $media(['retired_at' => now()])]);
    DB::table('specialties')->where('code', 'electricidad')->update(['hero_media_id' => $media(['scan_status' => 'pending'])]);

    $response = $this->getJson('/api/v1/catalog/specialties')->assertOk();

    $items = collect($response->json('data'))->keyBy('code');
    expect(array_keys($items['computo']))->toEqualCanonicalizing(['id', 'code', 'name', 'description', 'image_url'])
        ->and($items['computo']['image_url'])->toEndWith("/api/v1/media/$clean")
        ->and($items['refrigeracion']['image_url'])->toBeNull()
        ->and($items['electricidad']['image_url'])->toBeNull();
    expect($response->getContent())->not->toContain('storage_key')->not->toContain('hero_media_id');

    // Un medio privado, aunque esté revisado, tampoco se expone; sin foto el campo va en null.
    DB::table('specialties')->where('code', 'computo')->update(['hero_media_id' => MediaFileFactory::new()->create(['owner_id' => $this->owner->id])->id]);
    DB::table('specialties')->where('code', 'electricidad')->update(['hero_media_id' => null]);

    $items = collect($this->getJson('/api/v1/catalog/specialties')->assertOk()->json('data'))->keyBy('code');
    expect($items->pluck('image_url')->all())->toBe([null, null, null])
        ->and($items->keys()->all())->toBe(['computo', 'refrigeracion', 'electricidad']);
});
