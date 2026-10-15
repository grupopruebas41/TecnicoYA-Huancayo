<?php

// S03-TC-027 a 029 · HU-S03-01, 03 y 05 · SEC-S03-03: el envío revalida lo que pudo cambiar tras registrar.
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
    Sanctum::actingAs(ClientProfileFactory::new()->create()->user);
    $this->districtId = DistrictFactory::new()->create()->id;
});

/** La solicitud sigue registrada, sin evento de envío ni clave consumida. */
function expectStillRegistered(int $id, int $version): void
{
    $row = DB::table('service_requests')->find($id);
    expect($row->status)->toBe('registered')
        ->and((int) $row->version)->toBe($version)
        ->and($row->submitted_at)->toBeNull()
        ->and(DB::table('request_events')->where('request_id', $id)->where('event_type', 'request.submitted')->exists())->toBeFalse()
        ->and(DB::table('idempotency_records')->count())->toBe(0);
}

it('S03-TC-027 no envía si la subcategoría se desactivó después del registro [TC-120]', function () {
    $request = Sprint03::register($this, $this->districtId);
    DB::table('subcategories')->where('id', $request['subcategory']['id'])->update(['active' => 0]);

    Sprint01::assertSpanishValidation(Sprint03::submit($this, $request['id'], $request['version']), ['subcategory_id']);
    expectStillRegistered($request['id'], $request['version']);
});

it('S03-TC-028 no envía si el distrito quedó fuera de cobertura después del registro [TC-032]', function () {
    $request = Sprint03::register($this, $this->districtId);
    DB::table('districts')->where('id', $this->districtId)->update(['active' => 0]);

    $response = Sprint03::submit($this, $request['id'], $request['version']);

    Sprint01::assertSpanishValidation($response, ['district_id']);
    expect($response->json('errors.district_id.0'))->toBe('El distrito está fuera de cobertura.');
    expectStillRegistered($request['id'], $request['version']);
});

it('S03-TC-029 no envía si el técnico elegido se suspendió o dejó de ofrecer el servicio, sin sustituirlo [TC-036]', function () {
    $technician = Sprint03::searchableTechnician('computo-hardware', [$this->districtId]);
    Sprint03::searchableTechnician('computo-hardware', [$this->districtId]); // alternativa que no debe usarse
    $request = Sprint03::register($this, $this->districtId, ['source' => 'profile', 'target_technician_id' => $technician->id]);

    DB::table('technician_profiles')->where('id', $technician->id)->update(['status' => 'suspended']);
    Sprint01::assertSpanishValidation(Sprint03::submit($this, $request['id'], $request['version']), ['target_technician_id']);

    DB::table('technician_profiles')->where('id', $technician->id)->update(['status' => 'active']);
    DB::table('technician_services')->where('technician_id', $technician->id)->update(['active' => 0]);
    Sprint01::assertSpanishValidation(Sprint03::submit($this, $request['id'], $request['version']), ['target_technician_id']);

    expect((int) DB::table('service_requests')->where('id', $request['id'])->value('target_technician_id'))->toBe($technician->id);
    expectStillRegistered($request['id'], $request['version']);
});
