<?php

// S05-TC-235 · Rediseño de la campana (Fase 4, modo rápido): cada aviso trae su categoría visual y el contexto de la
// solicitud (pedido, especialidad y subcategorías) para mostrarlo sin consultas extra.
use App\Modules\CNotifications\Application\Inbox;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

it('S05-TC-235 la bandeja suma categoría y contexto de la solicitud; un aviso sin solicitud queda sin contexto', function () {
    $request = Sprint04::sentRequest();
    $order = DB::table('service_orders')->insertGetId(['client_id' => $request->client_id, 'item_count' => 1, 'submitted_at' => now()]);
    DB::table('service_requests')->where('id', $request->id)->update(['order_id' => $order]);
    foreach (['computo-hardware', 'computo-redes'] as $position => $code) {
        DB::table('request_subcategories')->insert(['request_id' => $request->id, 'subcategory_id' => Sprint04::subcategory($code), 'position' => $position + 1]);
    }
    $user = Sprint04::clientUser($request);
    $inbox = app(Inbox::class);
    $inbox->notify($user->id, 'request.pending', 'Buscando técnicos disponibles', 'Seguimos buscando.', 'service_request', $request->id);
    $inbox->notify($user->id, 'request.awaiting_choice', 'Elige a tu técnico', 'Aceptaron tu solicitud.', 'service_request', $request->id);
    $inbox->notify($user->id, 'account.notice', 'Aviso de la cuenta', 'Texto.', 'user', $user->id);
    Sanctum::actingAs($user);

    $items = collect($this->getJson('/api/v1/notifications')->assertOk()->json('data.items'))->keyBy('type');

    expect($items['request.pending']['category'])->toBe('search')
        ->and($items['request.awaiting_choice']['category'])->toBe('offer')
        ->and($items['account.notice']['category'])->toBe('system')
        ->and($items['account.notice']['context'])->toBeNull()
        ->and($items['request.pending']['context'])->toMatchArray([
            'request_id' => $request->id, 'order_id' => $order, 'specialty' => 'Cómputo', 'status' => 'sent',
            'label' => "Pedido #$order · Solicitud #{$request->id} · Cómputo · Reparación de hardware, Redes e infraestructura",
        ]);
    $read = $this->postJson('/api/v1/notifications/'.$items['request.pending']['id'].'/read', [])->assertOk();
    expect($read->json('data.context.request_id'))->toBe($request->id)->and($read->json('data.category'))->toBe('search');
});
