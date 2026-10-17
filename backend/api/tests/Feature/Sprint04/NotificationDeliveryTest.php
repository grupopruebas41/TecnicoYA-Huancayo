<?php

// S04-TC-031, 071, 072, 075 y 118 · HU-S04-10 · RF-15, RF-29; RNF-07 · D-21, D-68: la bandeja no depende del correo;
// intento inicial más 3 reintentos a 1, 2 y 4 min del anterior; errores guardados sin secretos.
use App\Modules\CNotifications\Application\DeliveryChannel;
use App\Modules\CNotifications\Jobs\DeliverNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(function () {
    Sprint04::boot($this);
    $this->technician = Sprint04::technician();
    $this->request = Sprint04::sentRequest();
});

/** Sandbox de correo que falla las primeras $failures veces (PHP_INT_MAX: siempre). */
function s04Sandbox(int $failures, string $message = 'Sandbox caído.'): void
{
    app()->instance(DeliveryChannel::class, new class($failures, $message) implements DeliveryChannel
    {
        public int $calls = 0;

        public function __construct(private readonly int $failures, private readonly string $message) {}

        public function send(object $notification): void
        {
            if (++$this->calls <= $this->failures) {
                throw new RuntimeException($this->message);
            }
        }
    });
}

function s04OfferNotification(int $requestId): object
{
    return DB::table('notifications')->where('type', 'offer.created')->where('subject_id', DB::table('offers')->where('request_id', $requestId)->value('id'))->first();
}

/** Ejecuta la entrega en cada instante (segundos desde el inicio) y devuelve los estados de los intentos. */
function s04DeliverAt(object $test, int $notificationId, array $seconds): array
{
    $start = now()->toImmutable();
    foreach ($seconds as $second) {
        $test->travelTo($start->addSeconds($second));
        dispatch_sync(new DeliverNotification($notificationId));
    }

    return DB::table('notification_attempts')->where('notification_id', $notificationId)->orderBy('attempt_no')
        ->get(['attempt_no', 'status', 'attempted_at'])->map(fn ($a) => [(int) $a->attempt_no, $a->status, $a->attempted_at])->all();
}

it('S04-TC-031 hace correr el SLA desde la bandeja aunque falle el correo', function () {
    s04Sandbox(PHP_INT_MAX);
    Sprint04::prepare($this->request->id);
    $offer = Sprint04::offerTo($this->request->id, $this->technician->id);

    dispatch_sync(new DeliverNotification(s04OfferNotification($this->request->id)->id));

    Sanctum::actingAs($this->technician->user);
    $this->getJson('/api/v1/offers')->assertOk()
        ->assertJsonPath('data.items.0.id', $offer->id)
        ->assertJsonPath('data.items.0.available_at', now()->toImmutable()->parse($offer->available_at)->toISOString())
        ->assertJsonPath('data.items.0.expires_at', now()->toImmutable()->parse($offer->expires_at)->toISOString());
    expect(DB::table('notification_attempts')->pluck('status')->all())->toBe(['failed'])
        ->and(Sprint04::offerTo($this->request->id, $this->technician->id)->expires_at)->toBe($offer->expires_at);
});

it('S04-TC-071 hace como máximo tres reintentos y ningún quinto intento [TC-057]', function () {
    s04Sandbox(PHP_INT_MAX);
    Sprint04::prepare($this->request->id);
    $offer = Sprint04::offerTo($this->request->id, $this->technician->id);
    $notification = s04OfferNotification($this->request->id);

    $attempts = s04DeliverAt($this, $notification->id, [0, 60, 180, 420, 900]);

    expect(array_column($attempts, 0))->toBe([1, 2, 3, 4])
        ->and(array_unique(array_column($attempts, 1)))->toBe(['failed'])
        ->and(DB::table('notifications')->where('id', $notification->id)->value('status'))->toBe('failed')
        ->and(Sprint04::offerTo($this->request->id, $this->technician->id)->expires_at)->toBe($offer->expires_at);
});

it('S04-TC-072 se detiene cuando la entrega funciona al tercer intento', function () {
    s04Sandbox(2);
    Sprint04::prepare($this->request->id);
    $notification = s04OfferNotification($this->request->id);

    $attempts = s04DeliverAt($this, $notification->id, [0, 60, 180, 420]);

    $row = DB::table('notifications')->find($notification->id);
    expect(array_map(fn ($a) => [$a[0], $a[1]], $attempts))->toBe([[1, 'failed'], [2, 'failed'], [3, 'sent']])
        ->and($row->status)->toBe('sent')
        ->and($row->delivered_at)->not->toBeNull()
        ->and($row->next_attempt_at)->toBeNull();
});

it('S04-TC-075 guarda el error de entrega saneado, sin el token ni la traza', function () {
    s04Sandbox(1, 'Fallo SMTP token=sk_sintetico_0123456789 en C:\\ruta\\interna\\Mailer.php:88');
    Sprint04::prepare($this->request->id);

    dispatch_sync(new DeliverNotification(s04OfferNotification($this->request->id)->id));

    $attempt = DB::table('notification_attempts')->first();
    expect($attempt->status)->toBe('failed')
        ->and($attempt->error_code)->toBe('SANDBOX_UNAVAILABLE')
        ->and(json_encode(DB::table('notification_attempts')->get()))->not->toContain('sk_sintetico')->not->toContain('Mailer.php')
        ->and(json_encode(DB::table('notifications')->get()))->not->toContain('sk_sintetico');
});

it('S04-TC-118 respeta los intervalos de 1, 2 y 4 minutos entre reintentos', function () {
    s04Sandbox(PHP_INT_MAX);
    Sprint04::prepare($this->request->id);
    $notification = s04OfferNotification($this->request->id);
    $start = now()->toImmutable();

    $attempts = s04DeliverAt($this, $notification->id, [0, 59, 60, 179, 180, 419, 420]);

    expect(array_map(fn ($a) => $start->diffInSeconds(now()->parse($a[2])), $attempts))->toEqual([0, 60, 180, 420])
        ->and(DB::table('notifications')->where('id', $notification->id)->value('next_attempt_at'))->toBeNull();
});
