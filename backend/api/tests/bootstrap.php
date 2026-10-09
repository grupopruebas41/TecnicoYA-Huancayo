<?php

/*
| Arranque de PHPUnit/Pest: elige la base del slot de pruebas antes de que Laravel
| lea .env.testing.
|
| Slot (TECNICOYA_SLOT): variable de entorno del proceso; si no existe, la clave
| TECNICOYA_SLOT de .env.testing; si tampoco, A.
|   A → tecnicoya_testing (Claude Code)   B → tecnicoya_b_testing (Codex)
| Un DB_DATABASE definido en el entorno del proceso tiene prioridad sobre el slot.
| Tests\TestCase sigue rechazando cualquier base que no termine en _testing.
*/

require __DIR__.'/../vendor/autoload.php';

$bases = ['A' => 'tecnicoya_testing', 'B' => 'tecnicoya_b_testing'];

$slot = getenv('TECNICOYA_SLOT');
if ($slot === false || trim($slot) === '') {
    $archivo = __DIR__.'/../.env.testing';
    $valores = is_file($archivo) ? Dotenv\Dotenv::parse((string) file_get_contents($archivo)) : [];
    $slot = $valores['TECNICOYA_SLOT'] ?? 'A';
}
$slot = strtoupper(trim($slot));

if (! isset($bases[$slot])) {
    fwrite(STDERR, "TECNICOYA_SLOT inválido: use A o B.\n");
    exit(1);
}

$definir = function (string $nombre, string $valor): void {
    putenv("$nombre=$valor");
    $_ENV[$nombre] = $valor;
    $_SERVER[$nombre] = $valor;
};

$definir('TECNICOYA_SLOT', $slot);
$base = getenv('DB_DATABASE');
if ($base === false || $base === '') {
    $definir('DB_DATABASE', $bases[$slot]);
}
