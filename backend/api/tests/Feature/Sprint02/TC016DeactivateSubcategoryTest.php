<?php

// TC-016 · HU-S02-02 · RF-C01, RF-C02 · AC-S02-02-02
// El efecto sobre solicitudes abiertas sigue pendiente de P19: aquí solo se comprueba la conservación.
use Database\Factories\TechnicianProfileFactory;
use Database\Factories\TechnicianServiceFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint02;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

it('S02-TC-002 desactiva una subcategoría usada sin borrar su identidad ni sus referencias [TC-016]', function () {
    // Dado una subcategoría referenciada por un servicio de prueba
    $subcategoryId = Sprint02::subcategoryId('computo-redes');
    $service = TechnicianServiceFactory::new()->create(['subcategory_id' => $subcategoryId]);
    $original = DB::table('subcategories')->find($subcategoryId);
    Sanctum::actingAs(Sprint02::admin());

    // Cuando envía un estado inválido, no se guarda y el mensaje está en español
    $invalid = $this->patchJson("/api/v1/admin/subcategories/$subcategoryId", ['active' => 'quizás', 'expected_version' => 1]);
    Sprint01::assertSpanishValidation($invalid, ['active']);
    expect(DB::table('subcategories')->where('id', $subcategoryId)->value('active'))->toBe(1);

    // Cuando el administrador la desactiva
    $this->patchJson("/api/v1/admin/subcategories/$subcategoryId", ['active' => false, 'expected_version' => 1])
        ->assertOk()->assertJsonPath('data.active', false);

    // Entonces conserva su identidad y la referencia del servicio existente
    $this->assertDatabaseHas('subcategories', ['id' => $subcategoryId, 'code' => $original->code, 'name' => $original->name, 'active' => 0]);
    $this->assertDatabaseHas('technician_services', ['id' => $service->id, 'subcategory_id' => $subcategoryId]);

    // Y deja de ofrecerse en el catálogo y para nuevos registros de servicio
    $listed = $this->getJson('/api/v1/catalog/subcategories?specialty_id='.$original->specialty_id)->assertOk()->json('data');
    expect(Sprint02::itemsWith($listed, 'id', $subcategoryId))->toBe([]);
    $other = TechnicianProfileFactory::new()->create();
    Sanctum::actingAs($other->user);
    $register = $this->putJson('/api/v1/technicians/me/services', [
        'services' => [['subcategory_id' => $subcategoryId, 'reference_fee' => '40.00']],
        'expected_version' => $other->version,
    ]);
    Sprint01::assertSpanishValidation($register, ['services.0.subcategory_id']);
    $this->assertDatabaseMissing('technician_services', ['technician_id' => $other->id]);
});
