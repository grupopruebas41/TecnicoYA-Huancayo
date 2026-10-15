<?php

// S03-TC-049 y 050 · HU-S03-03 · RF-01 · D-55 (inicio programado) y D-56 (dirección de 5 a 255).
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
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

afterEach(fn () => Carbon::setTestNow());

it('S03-TC-049 rechaza un inicio programado anterior a la hora del servidor, acepta el exacto y revalida al enviar [TC-121]', function () {
    Carbon::setTestNow('2026-10-15 15:00:00');
    $scheduled = fn (string $start) => ['mode' => 'scheduled', 'preferred_start_at' => $start, 'preferred_end_at' => '2026-10-15T17:00:00Z'];

    $past = $this->postJson('/api/v1/requests', Sprint03::requestPayload($this->districtId, $scheduled('2026-10-15T14:59:59Z')));
    Sprint01::assertSpanishValidation($past, ['preferred_start_at']);
    $this->assertDatabaseCount('service_requests', 0);

    $request = Sprint03::register($this, $this->districtId, $scheduled('2026-10-15T15:00:00Z'));

    Carbon::setTestNow('2026-10-15 15:00:01');
    Sprint01::assertSpanishValidation(Sprint03::submit($this, $request['id'], $request['version']), ['preferred_start_at']);
    expect(DB::table('service_requests')->where('id', $request['id'])->value('status'))->toBe('registered');
});

it('S03-TC-050 acepta direcciones de 5 y 255 caracteres y rechaza 4 y 256 al registrar y al corregir', function () {
    foreach ([str_repeat('d', 4), str_repeat('d', 256), '  '.str_repeat('d', 4).'  '] as $address) {
        Sprint01::assertSpanishValidation(
            $this->postJson('/api/v1/requests', Sprint03::requestPayload($this->districtId, ['address' => $address])), ['address']);
    }
    $this->assertDatabaseCount('service_requests', 0);

    Sprint03::register($this, $this->districtId, ['address' => str_repeat('d', 5)]);
    $request = Sprint03::register($this, $this->districtId, ['address' => str_repeat('d', 255)]);

    Sprint01::assertSpanishValidation(
        $this->patchJson("/api/v1/requests/{$request['id']}", ['address' => str_repeat('e', 256), 'expected_version' => $request['version']]), ['address']);
    expect(DB::table('service_requests')->where('id', $request['id'])->value('address'))->toBe(str_repeat('d', 255));
});
