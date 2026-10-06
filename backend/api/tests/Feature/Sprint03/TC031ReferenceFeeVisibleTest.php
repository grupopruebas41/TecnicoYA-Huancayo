<?php

// TC-031 · HU-S03-03 · RF-01, RF-04, RF-C02 · AC-S03-03-01
// Moneda PEN por defecto del diccionario (P01 pendiente); relación con la tarifa del técnico: P16.
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint01;
use Tests\Support\Sprint03;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed([AuthorizationSeeder::class, CatalogSeeder::class]);
    Sprint01::actAsSpa($this);
});

it('TC-031: muestra la tarifa como referencial con su procedencia y conserva la fotografía al cambiar el catálogo', function () {
    // Dado una subcategoría con tarifa referencial de prueba aprobada
    $subcategoryId = (int) DB::table('subcategories')->where('code', 'computo-hardware')->value('id');
    DB::table('subcategories')->where('id', $subcategoryId)->update(['reference_fee' => '45.00']);
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $district = DistrictFactory::new()->create();

    // Cuando envía una tarifa propia en la solicitud, se rechaza en español (el cliente no fija importes)
    $invalid = $this->postJson('/api/v1/requests', Sprint03::requestPayload($district->id, ['reference_fee' => '1.00']));
    Sprint01::assertSpanishValidation($invalid, ['reference_fee']);
    $this->assertDatabaseCount('service_requests', 0);

    // Cuando selecciona el servicio y revisa el resumen
    $id = $this->postJson('/api/v1/requests', Sprint03::requestPayload($district->id))->assertCreated()->json('data.id');
    DB::table('subcategories')->where('id', $subcategoryId)->update(['reference_fee' => '80.00']);
    $fee = $this->getJson("/api/v1/requests/$id")->assertOk()->json('data.reference_fee');

    // Entonces se muestra el monto como referencial, con su procedencia y sin tratarlo como pago
    expect($fee)->toBe([
        'amount' => '45.00', 'currency' => 'PEN', 'source' => 'subcategory',
        'is_reference' => true, 'is_payment' => false,
    ]);
    $this->assertDatabaseHas('service_requests', ['id' => $id, 'reference_fee_snapshot' => '45.00']);
});
