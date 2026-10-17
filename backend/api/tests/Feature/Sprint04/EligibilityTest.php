<?php

// S04-TC-001 a 012 · HU-S04-01 · RF-06, RF-07, RF-10; RN-05 · tabla de decisión de elegibilidad: un ID por fila con
// su código de exclusión (contrato §3.1). Reloj controlado en el martes 2026-10-20 a las 09:00 de Lima.
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

function s04Exclusion(int $requestId, int $technicianId): array
{
    $candidate = Sprint04::candidate($requestId, $technicianId);

    return [(int) $candidate->eligible, $candidate->exclusion_code, $candidate->rank_position];
}

it('S04-TC-001 deja elegible al técnico que cumple todos los filtros, con fotografía [TC-039]', function () {
    $technician = Sprint04::technician(['fee' => '90.00', 'years' => 6]);
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    $run = Sprint04::run($request->id);
    expect($run->status)->toBe('completed')
        ->and((int) $run->rule_version_id)->toBe((int) $request->rule_version_id)
        ->and(s04Exclusion($request->id, $technician->id))->toBe([1, null, 1]);
    $snapshot = json_decode(Sprint04::candidate($request->id, $technician->id)->input_snapshot, true);
    expect($snapshot['fee'])->toBe('90.00')
        ->and($snapshot['fee_source'])->toBe('technician_service')
        ->and($snapshot['experience_years'])->toBe(6)
        ->and(json_encode($snapshot))->not->toContain('Jirón sintético');
});

it('S04-TC-002 nunca ofrece al suspendido aunque tenga el mejor puntaje potencial [TC-040]', function () {
    $active = Sprint04::technician(['fee' => '120.00', 'years' => 1]);
    $suspended = Sprint04::technician(['fee' => '50.00', 'years' => 15]);
    DB::table('technician_profiles')->where('id', $suspended->id)->update(['status' => 'suspended']);
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $suspended->id))->toBe([0, 'technician_suspended', null])
        ->and(DB::table('offers')->where('request_id', $request->id)->pluck('technician_id')->all())->toBe([$active->id]);
});

it('S04-TC-003 excluye al técnico sin verificación aprobada y deja la solicitud pendiente', function () {
    $pending = Sprint04::technician(['profile' => ['verification_status' => 'pending']]);
    $rejected = Sprint04::technician(['profile' => ['verification_status' => 'rejected']]);
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $pending->id))->toBe([0, 'not_verified', null])
        ->and(s04Exclusion($request->id, $rejected->id))->toBe([0, 'not_verified', null])
        ->and(DB::table('offers')->count())->toBe(0)
        ->and(DB::table('service_requests')->where('id', $request->id)->value('status'))->toBe('pending_availability');
});

it('S04-TC-004 excluye al técnico con la cuenta deshabilitada', function () {
    $technician = Sprint04::technician();
    DB::table('users')->where('id', $technician->user_id)->update(['is_active' => false]);
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $technician->id))->toBe([0, 'account_disabled', null])
        ->and(Sprint04::offerTo($request->id, $technician->id))->toBeNull();
});

it('S04-TC-005 excluye al técnico que no ofrece la subcategoría o la tiene inactiva', function () {
    $other = Sprint04::technician(['subcategory' => 'computo-redes']);
    $inactive = Sprint04::technician();
    DB::table('technician_services')->where('technician_id', $inactive->id)->update(['active' => 0]);
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $other->id))->toBe([0, 'service_not_offered', null])
        ->and(s04Exclusion($request->id, $inactive->id))->toBe([0, 'service_not_offered', null])
        ->and(DB::table('offers')->count())->toBe(0);
});

it('S04-TC-006 excluye al técnico que no cubre el distrito de la solicitud', function () {
    $tambo = Sprint04::technician(['districts' => [Sprint04::district('EL-TAMBO')]]);
    $retired = Sprint04::technician(['districts' => [Sprint04::district('CHILCA')]]);
    DB::table('technician_districts')->where('technician_id', $retired->id)->update(['active' => 0]);
    $request = Sprint04::sentRequest(['district_id' => Sprint04::district('CHILCA')]);

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $tambo->id))->toBe([0, 'district_not_covered', null])
        ->and(s04Exclusion($request->id, $retired->id))->toBe([0, 'district_not_covered', null]);
});

it('S04-TC-007 excluye al técnico con una pausa vigente sin fin [TC-132]', function () {
    $technician = Sprint04::technician();
    Sprint04::pause($technician->id, CarbonImmutable::now()->subHour());
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $technician->id))->toBe([0, 'paused', null])
        ->and(Sprint04::offerTo($request->id, $technician->id))->toBeNull();
});

it('S04-TC-008 no excluye por una pausa que termina exactamente ahora', function () {
    $technician = Sprint04::technician();
    Sprint04::pause($technician->id, CarbonImmutable::now()->subHours(3), CarbonImmutable::now());
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $technician->id))->toBe([1, null, 1])
        ->and(Sprint04::offerTo($request->id, $technician->id)?->status)->toBe('pending');
});

it('S04-TC-009 excluye al técnico cuya franja semanal no contiene la franja programada', function () {
    $short = Sprint04::technician(['slots' => false]);
    Sprint04::weeklySlot($short->id, 2, '08:00:00', '16:00:00');
    $wide = Sprint04::technician(['slots' => false]);
    Sprint04::weeklySlot($wide->id, 2, '08:00:00', '18:00:00');
    $request = Sprint04::scheduled('2026-10-27', '15:00', '17:00'); // martes

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $short->id))->toBe([0, 'outside_availability', null])
        ->and(s04Exclusion($request->id, $wide->id))->toBe([1, null, 1]);
});

it('S04-TC-010 deja no disponible al técnico con una cita solapada y acepta la contigua [TC-133]', function () {
    $busy = Sprint04::technician();
    Sprint04::appointment($busy->id, CarbonImmutable::parse('2026-10-27 16:00', 'America/Lima')->utc(), CarbonImmutable::parse('2026-10-27 18:00', 'America/Lima')->utc());
    $contiguous = Sprint04::technician();
    Sprint04::appointment($contiguous->id, CarbonImmutable::parse('2026-10-27 15:00', 'America/Lima')->utc(), CarbonImmutable::parse('2026-10-27 17:00', 'America/Lima')->utc());
    $request = Sprint04::scheduled('2026-10-27', '17:00', '19:00');

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $busy->id))->toBe([0, 'schedule_conflict', null])
        ->and(s04Exclusion($request->id, $contiguous->id)[0])->toBe(1);
});

it('S04-TC-011 excluye en una inmediata al técnico con una cita que empieza a 1:59 h', function () {
    $technician = Sprint04::technician();
    Sprint04::appointment($technician->id, CarbonImmutable::now()->addMinutes(119), CarbonImmutable::now()->addMinutes(239));
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $technician->id))->toBe([0, 'appointment_within_2h', null]);
});

it('S04-TC-012 no excluye en una inmediata por una cita que empieza a 2:00 h exactas', function () {
    $technician = Sprint04::technician();
    Sprint04::appointment($technician->id, CarbonImmutable::now()->addHours(2), CarbonImmutable::now()->addHours(4));
    $request = Sprint04::sentRequest();

    Sprint04::prepare($request->id);

    expect(s04Exclusion($request->id, $technician->id))->toBe([1, null, 1]);
});
