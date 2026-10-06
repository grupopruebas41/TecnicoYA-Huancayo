<?php

/**
 * Convierte las rutas absolutas de un informe Clover de Pest/PHPUnit en rutas relativas a la raíz
 * del repositorio (backend/api/app/...). Así SonarQube las resuelve tanto con el scanner nativo de
 * Windows como con el contenedor, que monta el repositorio en /usr/src.
 *
 * Uso: php scripts/normalizar-clover.php backend/api/test-results/clover.xml
 */

$root = str_replace('\\', '/', dirname(__DIR__)).'/';
$report = $argv[1] ?? '';
if (! is_file($report)) {
    fwrite(STDERR, "No existe el informe Clover: $report\n");
    exit(2);
}

$xml = new DOMDocument();
if (! $xml->load($report)) {
    fwrite(STDERR, "No se pudo leer $report\n");
    exit(2);
}

$changed = 0;
foreach ($xml->getElementsByTagName('file') as $file) {
    $path = str_replace('\\', '/', $file->getAttribute('name'));
    if (strncasecmp($path, $root, strlen($root)) === 0) {
        $file->setAttribute('name', substr($path, strlen($root)));
        $changed++;
    }
}

$xml->save($report);
echo "Clover normalizado: $changed archivos con ruta relativa a la raíz del repositorio.\n";
