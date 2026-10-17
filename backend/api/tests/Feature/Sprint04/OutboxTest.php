<?php

// S04-TC-029 y 068 · HU-S04-04, HU-S04-09 · RF-29 · TC-046: los avisos salen de outbox_events solo después del commit
// y una sola vez por event_id.
use App\Modules\CNotifications\Events\OutboxBroadcast;
use App\Modules\CNotifications\Jobs\PublishOutboxEvent;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    Event::fake([OutboxBroadcast::class]);
});

it('S04-TC-029 no publica avisos cuando la apertura de la ronda se revierte [TC-046]', function () {
    Sprint04::technician();
    Sprint04::technician();
    $request = Sprint04::sentRequest();
    DB::listen(function (QueryExecuted $query) {
        if (str_starts_with($query->sql, 'insert into `outbox_events`')) {
            throw new RuntimeException('Fallo forzado antes del commit de la ronda.');
        }
    });

    expect(fn () => Sprint04::prepare($request->id))->toThrow(RuntimeException::class, 'Fallo forzado');
    $this->artisan('tecnicoya:sweep')->assertSuccessful();

    expect(DB::table('offer_rounds')->count())->toBe(0)
        ->and(DB::table('offers')->count())->toBe(0)
        ->and(DB::table('outbox_events')->count())->toBe(0)
        ->and(DB::table('notifications')->count())->toBe(0);
    Event::assertNotDispatched(OutboxBroadcast::class);
});

it('S04-TC-068 publica una sola vez la fila del outbox aunque el job corra dos veces', function () {
    Sprint04::technician();
    Sprint04::prepare(Sprint04::sentRequest()->id);
    $row = DB::table('outbox_events')->where('event_type', 'offer.created')->first();

    dispatch_sync(new PublishOutboxEvent($row->id));
    $publishedAt = DB::table('outbox_events')->where('id', $row->id)->value('published_at');
    $this->travel(30)->seconds();
    dispatch_sync(new PublishOutboxEvent($row->id));

    Event::assertDispatchedTimes(OutboxBroadcast::class, 1);
    expect($publishedAt)->not->toBeNull()
        ->and(DB::table('outbox_events')->where('id', $row->id)->value('published_at'))->toBe($publishedAt)
        ->and(DB::table('outbox_deliveries')->where('outbox_event_id', $row->id)->count())->toBe(1);
});
