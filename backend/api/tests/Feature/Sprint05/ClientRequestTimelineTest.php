<?php

// S05-TC-009 a 013 · Panel del cliente (adelanto S5, D-87): listado ampliado de GET /requests y línea de tiempo del
// titular en GET /requests/{id} (TIMELINE-01, D-89; adelanto parcial de HU-S05-05 [TC-067]).
use Carbon\CarbonImmutable;
use Database\Factories\ClientProfileFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

/** Evento sintético de la línea de tiempo, a los minutos indicados desde ahora. */
function s05Event(int $requestId, string $type, int $minutes, array $extra = []): void
{
    DB::table('request_events')->insert($extra + [
        'request_id' => $requestId, 'actor_id' => null, 'event_type' => $type, 'from_status' => 'sent', 'to_status' => 'sent',
        'summary' => 'Resumen interno', 'metadata' => null, 'occurred_at' => CarbonImmutable::now()->addMinutes($minutes),
        'correlation_id' => 'corr-'.$type.'-'.$minutes, 'request_version' => 2,
    ]);
}

it('S05-TC-009 el listado del cliente trae subcategoría, distrito y fecha de cambio, y solo sus solicitudes', function () {
    $mine = Sprint04::sentRequest(['district_id' => Sprint04::district('EL-TAMBO')]);
    $theirs = Sprint04::sentRequest();
    Sanctum::actingAs(Sprint04::clientUser($mine));

    $rows = $this->getJson('/api/v1/requests')->assertOk()->json('data');

    expect(array_column($rows, 'id'))->toBe([$mine->id])
        ->and($rows[0]['subcategory'])->toBe(['id' => Sprint04::subcategory(), 'name' => 'Reparación de hardware'])
        ->and($rows[0]['district'])->toBe(['id' => Sprint04::district('EL-TAMBO'), 'name' => 'El Tambo'])
        ->and($rows[0])->toHaveKey('updated_at')
        ->and(json_encode($rows))->not->toContain((string) $theirs->address);
});

it('S05-TC-010 la línea de tiempo del titular va en orden y solo con los tipos y textos de la lista fija [TC-067]', function () {
    $request = Sprint04::sentRequest();
    s05Event($request->id, 'round.opened', 2);
    s05Event($request->id, 'request.registered', -5, ['from_status' => null, 'to_status' => 'registered']);
    s05Event($request->id, 'request.attachment_added', -4);
    s05Event($request->id, 'request.submitted', -3, ['from_status' => 'registered', 'to_status' => 'sent']);
    s05Event($request->id, 'admin.internal_note', 1);
    s05Event($request->id, 'request.assigned', 5, ['to_status' => 'assigned']);
    Sanctum::actingAs(Sprint04::clientUser($request));

    $timeline = $this->getJson("/api/v1/requests/{$request->id}")->assertOk()->json('data.timeline');

    expect(array_column($timeline, 'type'))->toBe(['request.registered', 'request.submitted', 'round.opened', 'request.assigned'])
        ->and(array_column($timeline, 'label'))->toBe(['Solicitud registrada', 'Solicitud enviada', 'Enviamos tu solicitud a técnicos disponibles', 'Elegiste a tu técnico'])
        ->and(array_keys($timeline[0]))->toBe(['type', 'label', 'from_status', 'to_status', 'occurred_at'])
        ->and([$timeline[0]['from_status'], $timeline[0]['to_status'], $timeline[3]['to_status']])->toBe([null, 'registered', 'assigned']);
});

it('S05-TC-011 la línea de tiempo no expone el resumen, los metadatos, el actor ni la correlación', function () {
    $request = Sprint04::sentRequest();
    $admin = ClientProfileFactory::new()->create()->user;
    s05Event($request->id, 'request.pending', 1, ['summary' => 'Motivo administrativo reservado', 'actor_id' => $admin->id,
        'metadata' => json_encode(['reason' => 'dato-secreto-xyz', 'run_id' => 99])]);
    Sanctum::actingAs(Sprint04::clientUser($request));

    $response = $this->getJson("/api/v1/requests/{$request->id}")->assertOk();

    expect($response->json('data.timeline.0.label'))->toBe('Sin técnicos disponibles por ahora; seguimos buscando');
    expect(json_encode($response->json('data.timeline')))->not->toContain('Motivo administrativo')->not->toContain('dato-secreto-xyz')
        ->not->toContain('corr-')->not->toContain('actor')->not->toContain('metadata')->not->toContain('run_id');
});

it('S05-TC-012 el técnico notificado ve el detalle sin la línea de tiempo del cliente', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    expect(Sprint04::offerTo($request->id, $technician->id))->not->toBeNull();
    Sanctum::actingAs($technician->user);

    $this->getJson("/api/v1/requests/{$request->id}")->assertOk()->assertJsonMissingPath('data.timeline');
});

it('S05-TC-013 la línea de tiempo refleja el flujo real del S4 hasta la asignación [TC-067]', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    Sprint04::respond($this, $technician, Sprint04::offerTo($request->id, $technician->id), 'accept')->assertOk();
    Sprint04::select($this, $request, Sprint04::offerTo($request->id, $technician->id)->id)->assertOk();

    $timeline = $this->getJson("/api/v1/requests/{$request->id}")->assertOk()->json('data.timeline');

    expect(array_column($timeline, 'type'))->toBe(['round.opened', 'round.awaiting_choice', 'request.assigned'])
        ->and(end($timeline)['to_status'])->toBe('assigned');
});
