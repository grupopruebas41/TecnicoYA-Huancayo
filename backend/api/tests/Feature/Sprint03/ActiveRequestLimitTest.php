<?php

// S03-TC-030 y 031 · HU-S03-06 · RF-01 · D-11 y D-58: máximo de 3 solicitudes activas (TC-122).
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Database\Factories\DistrictFactory;
use Database\Seeders\AuthorizationSeeder;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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

it('S03-TC-030 rechaza la cuarta solicitud activa, no cuenta las registradas y guarda la versión de reglas [TC-122]', function () {
    // Reloj del S3: la versión 2 de reglas (D-63) rige desde el 2026-10-16; antes, la vigente es la 1.
    $this->travelTo(CarbonImmutable::parse('2026-10-15 15:00:00', 'UTC'));
    $registered = [Sprint03::register($this, $this->districtId), Sprint03::register($this, $this->districtId)];
    $sent = [Sprint03::sent($this, $this->districtId), Sprint03::sent($this, $this->districtId), Sprint03::sent($this, $this->districtId)];

    $fourth = Sprint03::submit($this, $registered[0]['id'], $registered[0]['version']);

    $fourth->assertConflict()->assertJsonPath('error.code', 'ACTIVE_REQUEST_LIMIT');
    Sprint01::assertSpanishText($fourth->json('message'));
    expect($fourth->json('message'))->toContain('3');
    expect(DB::table('service_requests')->where('id', $registered[0]['id'])->value('status'))->toBe('registered')
        ->and(DB::table('service_requests')->where('status', 'sent')->count())->toBe(3);

    $ruleVersion = DB::table('rule_versions')->where('version_no', 1)->value('id');
    expect($ruleVersion)->not->toBeNull()
        ->and(DB::table('service_requests')->whereIn('id', $sent)->pluck('rule_version_id')->unique()->values()->all())->toBe([$ruleVersion])
        ->and(DB::table('service_requests')->where('id', $registered[1]['id'])->value('rule_version_id'))->toBeNull();
});

it('S03-TC-031 el reintento del tercer envío con su clave no cuenta dos veces [TC-122]', function () {
    Sprint03::sent($this, $this->districtId);
    Sprint03::sent($this, $this->districtId);
    $third = Sprint03::register($this, $this->districtId);
    $key = (string) Str::uuid();

    $first = Sprint03::submit($this, $third['id'], $third['version'], $key)->assertAccepted();
    $retry = Sprint03::submit($this, $third['id'], $third['version'], $key)->assertAccepted();

    expect($retry->json('data'))->toBe($first->json('data'))
        ->and(DB::table('service_requests')->where('status', 'sent')->count())->toBe(3)
        ->and(DB::table('request_events')->where('request_id', $third['id'])->where('event_type', 'request.submitted')->count())->toBe(1);
});
