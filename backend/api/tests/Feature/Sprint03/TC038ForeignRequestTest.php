<?php

// TC-038 · HU-S03-06 · RF-01, RF-02, RF-33 · AC-S03-06-02
// Solo lectura protegida: no hay dato que guardar, por eso no aplica la verificación de validación CRUD.
use Database\Factories\ClientProfileFactory;
use Database\Factories\ServiceRequestFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

it('TC-038: deniega el detalle de la solicitud de otro cliente sin descripción, dirección ni evidencias', function () {
    // Dado dos clientes con solicitudes diferentes
    $mine = ServiceRequestFactory::new()->create(['description' => 'Mi impresora no imprime en color.']);
    $theirs = ServiceRequestFactory::new()->create([
        'description' => 'Texto privado del otro cliente', 'address' => 'Dirección privada del otro cliente',
    ]);
    Sanctum::actingAs($mine->client->user);

    // Cuando uno consulta por identificador el detalle de la solicitud del otro
    $denied = $this->getJson("/api/v1/requests/{$theirs->id}");

    // Entonces se deniega en español sin descripción ni dirección
    $denied->assertNotFound();
    Sprint01::assertSpanishText((string) $denied->json('message'));
    expect($denied->getContent())->not->toContain('Texto privado del otro cliente')->not->toContain('Dirección privada');

    // Y su propia solicitud sí aparece, en su lista y en su detalle
    $this->getJson("/api/v1/requests/{$mine->id}")->assertOk()->assertJsonPath('data.description', 'Mi impresora no imprime en color.');
    expect(array_column($this->getJson('/api/v1/requests')->assertOk()->json('data'), 'id'))->toBe([$mine->id]);
});
