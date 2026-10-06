<?php

/**
 * Cuenta los IDs de caso TC distintos aprobados en Pest (meta: 60, plan de pruebas v2 §6).
 *
 * Uso, desde la raíz del repositorio y con MySQL de pruebas levantado:
 *   php scripts/contar-casos-tc.php            ejecuta Pest y cuenta
 *   php scripts/contar-casos-tc.php --sin-ejecutar   cuenta el último junit.xml
 *
 * Reglas de conteo:
 * - El ID es el TC-NNN con que empieza el nombre de la prueba (después de "it"/"test").
 *   Las pruebas sin ese prefijo no cuentan.
 * - Un ID está aprobado solo si todas sus pruebas pasaron. Si alguna falló o dio error, es fallido.
 *   Si alguna se omitió (skip, todo, incompleta) y ninguna falló, es omitido. Ni fallidos ni omitidos cuentan.
 * - Para la meta solo cuentan los IDs clasificados como «Backend Pest previsto» en
 *   Matriz-Trazabilidad-TC.csv; los demás se informan aparte (p. ej. complementos de casos Cypress).
 */

const META = 60;

$root = dirname(__DIR__);
$backend = $root.'/backend/api';
$junit = $backend.'/test-results/junit.xml';
$matrix = $root.'/docs/documentacion/editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv';

if (! in_array('--sin-ejecutar', $argv, true)) {
    $exitCode = runPest($backend, $junit);
    echo "Pest terminó con código $exitCode.\n\n";
}
if (! is_file($junit)) {
    fwrite(STDERR, "No existe $junit. Ejecuta el script sin --sin-ejecutar.\n");
    exit(2);
}

$results = classifyIds(readTestcases($junit));
$candidates = readPestCandidates($matrix);
printReport($results, $candidates);
exit(empty($results['fallido']) ? 0 : 1);

/** Ejecuta la suite completa y deja el informe JUnit; no se puede correr a la vez que Cypress. */
function runPest(string $backend, string $junit): int
{
    @mkdir(dirname($junit), 0777, true);
    @unlink($junit);
    $command = sprintf('cd %s && %s artisan test --log-junit=%s', escapeshellarg($backend), escapeshellarg(PHP_BINARY), escapeshellarg($junit));
    passthru($command, $exitCode);

    return $exitCode;
}

/** Devuelve [nombre, estado] de cada <testcase>; estado: aprobado | fallido | omitido. */
function readTestcases(string $junit): array
{
    $xml = simplexml_load_file($junit);
    if ($xml === false) {
        fwrite(STDERR, "No se pudo leer $junit.\n");
        exit(2);
    }
    $cases = [];
    foreach ($xml->xpath('//testcase') as $testcase) {
        $state = 'aprobado';
        if (isset($testcase->failure) || isset($testcase->error)) {
            $state = 'fallido';
        } elseif (isset($testcase->skipped) || isset($testcase->incomplete)) {
            $state = 'omitido';
        }
        $cases[] = [(string) $testcase['name'], $state];
    }

    return $cases;
}

/** Agrupa por ID TC: fallido domina sobre omitido, y omitido sobre aprobado. */
function classifyIds(array $cases): array
{
    $byId = [];
    $withoutId = 0;
    foreach ($cases as [$name, $state]) {
        if (! preg_match('/^(?:it |test )?(TC-\d{3})\b/', $name, $match)) {
            $withoutId++;
            continue;
        }
        $byId[$match[1]][] = $state;
    }
    $result = ['aprobado' => [], 'fallido' => [], 'omitido' => [], 'sin_id' => $withoutId, 'pruebas' => count($cases)];
    foreach ($byId as $id => $states) {
        $final = in_array('fallido', $states, true) ? 'fallido' : (in_array('omitido', $states, true) ? 'omitido' : 'aprobado');
        $result[$final][] = $id;
    }
    foreach (['aprobado', 'fallido', 'omitido'] as $key) {
        sort($result[$key]);
    }

    return $result;
}

/** IDs con clasificación «Backend Pest previsto» en la matriz de trazabilidad. */
function readPestCandidates(string $matrix): array
{
    $handle = fopen($matrix, 'r');
    $header = fgetcsv($handle, escape: '');
    $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
    $idColumn = array_search('ID', $header, true);
    $classColumn = array_search('Clasificación_plan', $header, true);
    $candidates = [];
    while (($row = fgetcsv($handle, escape: '')) !== false) {
        if (($row[$classColumn] ?? '') === 'Backend Pest previsto') {
            $candidates[$row[$idColumn]] = true;
        }
    }
    fclose($handle);

    return $candidates;
}

function printReport(array $results, array $candidates): void
{
    $approved = $results['aprobado'];
    $countable = array_values(array_filter($approved, fn ($id) => isset($candidates[$id])));
    $outside = array_values(array_diff($approved, $countable));

    echo "=== Conteo de casos TC en Pest ===\n";
    echo "Pruebas en el informe: {$results['pruebas']} (sin ID TC, no cuentan: {$results['sin_id']})\n";
    printf("IDs TC aprobados:  %d %s\n", count($approved), listIds($approved));
    printf("IDs TC fallidos:   %d %s\n", count($results['fallido']), listIds($results['fallido']));
    printf("IDs TC omitidos:   %d %s\n", count($results['omitido']), listIds($results['omitido']));
    printf("Aprobados fuera de «Backend Pest previsto» (no cuentan para la meta): %d %s\n", count($outside), listIds($outside));
    printf("Aprobados que cuentan para la meta: %d de %d\n", count($countable), META);
    printf("Faltan para %d: %d\n", META, max(0, META - count($countable)));
}

function listIds(array $ids): string
{
    return $ids === [] ? '' : '['.implode(', ', $ids).']';
}
