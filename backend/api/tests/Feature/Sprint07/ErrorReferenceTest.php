<?php

// S07-TC-072 · Regresión del PR #32 (foto de perfil): la «Referencia» que ve el usuario en un error 500 debe
// estar en el registro de Laravel para poder rastrearlo. Antes solo iba en la respuesta (meta.request_id).
use Illuminate\Log\Events\MessageLogged;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;

it('S07-TC-072 un error interno registra en el log la misma referencia que devuelve al usuario', function () {
    Route::middleware('api')->get('/api/v1/_s07-tc-072', fn () => throw new RuntimeException('fallo sintético'));
    $logged = [];
    Event::listen(MessageLogged::class, function (MessageLogged $event) use (&$logged) {
        $logged[] = $event;
    });

    $response = $this->getJson('/api/v1/_s07-tc-072')->assertStatus(500)->assertJsonPath('error.code', 'INTERNAL_ERROR');
    $reference = $response->json('meta.request_id');

    expect($reference)->toBeString()->not->toBe('')
        ->and($logged)->toHaveCount(1)
        ->and($logged[0]->level)->toBe('error')
        ->and($logged[0]->context['request_id'] ?? null)->toBe($reference);
});
