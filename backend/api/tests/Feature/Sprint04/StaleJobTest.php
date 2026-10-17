<?php

// S04-TC-073 y 074 · HU-S04-07, HU-S04-08 · TC-058: todo job lleva la generación de búsqueda; si ya no es la vigente,
// termina sin efectos y deja un registro técnico (contrato §3).
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\Support\Sprint04;

uses(RefreshDatabase::class);

beforeEach(fn () => Sprint04::boot($this));

/** Lleva la solicitud hasta asignada con el único técnico aceptando. */
function s04Assign(object $test, object $request, $technician): void
{
    Sprint04::respond($test, $technician, Sprint04::offerTo($request->id, $technician->id), 'accept')->assertOk();
    Sprint04::select($test, $request, Sprint04::offerTo($request->id, $technician->id)->id)->assertOk();
}

it('S04-TC-073 ignora un job de ronda con una generación anterior [TC-058]', function () {
    $technician = Sprint04::technician();
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    s04Assign($this, $request, $technician);
    $offers = DB::table('offers')->count();
    Log::spy();

    Sprint04::openRound($request->id, 1);

    expect(Sprint04::generation($request->id))->toBe(2)
        ->and(Sprint04::rounds($request->id))->toHaveCount(1)
        ->and(DB::table('offers')->count())->toBe($offers);
    Log::shouldHaveReceived('info')->withArgs(fn ($message, $context = []) => $message === 'job.stale_generation'
        && $context['request_id'] === $request->id && $context['job_generation'] === 1 && $context['current_generation'] === 2)->once();
});

it('S04-TC-074 no expira con un job antiguo una solicitud que pasó de pendiente a asignada', function () {
    $request = Sprint04::sentRequest();
    Sprint04::prepare($request->id);
    $technician = Sprint04::technician();
    Sprint04::retryPending($request->id);
    s04Assign($this, $request, $technician);
    $this->travel(24)->hours();

    Sprint04::expirePending($request->id, 1);

    expect(DB::table('service_requests')->where('id', $request->id)->value('status'))->toBe('assigned')
        ->and(Sprint04::events($request->id, 'request.expired'))->toBe(0);
});
