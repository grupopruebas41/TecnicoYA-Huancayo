<?php

/*
 * Matriz de distancias entre distritos (D-64 y D-124). Un par por fila, con los códigos de distrito, los km por ruta en
 * auto entre plazas principales, la fuente y la fecha de consulta.
 *
 * CÓMO CARGAR LOS PARES PENDIENTES (D-124): reemplazar `null` por los km con 3 decimales como texto (por ejemplo
 * '6.500'), poner la fuente y la fecha de la consulta y ejecutar, desde backend/api:
 *     php artisan db:seed --class=DistrictSeeder
 * La siembra inserta solo los pares que todavía no están en la base y nunca pisa uno existente (si un par ya cargado
 * cambia, se corrige desde el panel o con una migración). Mientras un par esté en `null` no se siembra y la cercanía
 * no aporta al puntaje para ese par (C = 0, como en D-86): nunca se inventa una distancia.
 */

$d64 = ['source' => 'Google Maps, ruta en auto entre plazas principales (D-64)', 'consulted_on' => null];
$pending = ['km' => null, 'source' => null, 'consulted_on' => null];

return [
    // D-64 (consulta del equipo del 2026-10-16) y 1 km dentro del mismo distrito.
    ['from' => 'HUANCAYO', 'to' => 'EL-TAMBO', 'km' => '3.500'] + $d64,
    ['from' => 'HUANCAYO', 'to' => 'CHILCA', 'km' => '2.500'] + $d64,
    ['from' => 'EL-TAMBO', 'to' => 'CHILCA', 'km' => '5.500'] + $d64,
    ['from' => 'HUANCAYO', 'to' => 'HUANCAYO', 'km' => '1.000'] + $d64,
    ['from' => 'EL-TAMBO', 'to' => 'EL-TAMBO', 'km' => '1.000'] + $d64,
    ['from' => 'CHILCA', 'to' => 'CHILCA', 'km' => '1.000'] + $d64,
    // D-124: Pilcomayo y Huancán, 1 km dentro del mismo distrito.
    ['from' => 'PILCOMAYO', 'to' => 'PILCOMAYO', 'km' => '1.000'] + $d64,
    ['from' => 'HUANCAN', 'to' => 'HUANCAN', 'km' => '1.000'] + $d64,
    // D-124: pendientes de la consulta del equipo. Completar km, source y consulted_on.
    ['from' => 'HUANCAYO', 'to' => 'PILCOMAYO'] + $pending,
    ['from' => 'HUANCAYO', 'to' => 'HUANCAN'] + $pending,
    ['from' => 'EL-TAMBO', 'to' => 'PILCOMAYO'] + $pending,
    ['from' => 'EL-TAMBO', 'to' => 'HUANCAN'] + $pending,
    ['from' => 'CHILCA', 'to' => 'PILCOMAYO'] + $pending,
    ['from' => 'CHILCA', 'to' => 'HUANCAN'] + $pending,
    ['from' => 'HUANCAN', 'to' => 'PILCOMAYO'] + $pending,
];
