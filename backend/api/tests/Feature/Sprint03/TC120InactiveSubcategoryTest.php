<?php

// TC-120 · HU-S03-01 · RF-01 · Módulo A · AC-03.2, RN-27
// El contrato envía solo subcategory_id (la especialidad se deriva), así que la combinación cruzada
// especialidad/subcategoría no aplica; se prueban subcategoría inactiva, de rubro inactivo e inexistente.
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

it('TC-120: rechaza una subcategoría inactiva o de rubro inactivo identificándola y sin guardar la solicitud', function () {
    // Dado una subcategoría desactivada y otra cuyo rubro está desactivado
    $inactive = (int) DB::table('subcategories')->where('code', 'computo-redes')->value('id');
    DB::table('subcategories')->where('id', $inactive)->update(['active' => 0]);
    $electricity = (int) DB::table('specialties')->where('code', 'electricidad')->value('id');
    DB::table('specialties')->where('id', $electricity)->update(['active' => 0]);
    $inactiveParent = (int) DB::table('subcategories')->where('specialty_id', $electricity)->value('id');
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $district = DistrictFactory::new()->create();

    foreach ([$inactive, $inactiveParent, 999999] as $subcategoryId) {
        // Cuando intenta registrar una solicitud con ella
        $response = $this->postJson('/api/v1/requests', Sprint03::requestPayload($district->id, ['subcategory_id' => $subcategoryId]));

        // Entonces se rechaza señalando la subcategoría, en español
        Sprint01::assertSpanishValidation($response, ['subcategory_id']);
    }
    $this->assertDatabaseCount('service_requests', 0);
});
