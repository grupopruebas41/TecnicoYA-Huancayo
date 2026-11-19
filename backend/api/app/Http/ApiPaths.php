<?php

namespace App\Http;

/**
 * Cierre S4-S5 (Sonar S1192): segmentos de ruta de la API que se repetían en routes/api.php. Son constantes de clase y no
 * globales porque el archivo de rutas se carga en cada arranque de la aplicación (cada prueba).
 */
final class ApiPaths
{
    public const EQUIPMENT = 'equipment/{equipment}';

    public const SERVICE_REQUEST = 'requests/{serviceRequest}';

    public const USER = '{user}';
}
