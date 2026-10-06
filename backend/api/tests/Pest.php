<?php

/*
| Configuración de Pest. Las pruebas escritas con it()/test() en Feature y Unit
| heredan Tests\TestCase (con la protección de base de pruebas).
| RefreshDatabase se declara en cada archivo que use la base de datos.
*/

pest()->extend(Tests\TestCase::class)->in('Feature', 'Unit');
