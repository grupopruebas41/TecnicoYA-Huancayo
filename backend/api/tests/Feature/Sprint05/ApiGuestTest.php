<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('S05-TC-377 sin sesión y sin pedir JSON, la API responde 401 en JSON y nunca 500 (no hay ruta «login» a la que redirigir)', function () {
    // Cierre S4-S5: el workflow e2e-cierre recibió un 500 «Route [login] not defined» al consultar la API sin cabeceras de la
    // SPA (S05-TC-272). Los navegadores y las herramientas no siempre mandan Accept: application/json.
    foreach (['/api/v1/client/iot/devices', '/api/v1/me', '/api/v1/technicians/me/home'] as $path) {
        $this->get($path)->assertStatus(401)->assertJsonPath('error.code', 'UNAUTHENTICATED');
    }
});
