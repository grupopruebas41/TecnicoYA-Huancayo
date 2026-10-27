<?php

namespace App\Modules\FAdministration\Domain;

/**
 * Enlace de Genially de un comunicado (D-83). Solo se acepta https://view.genially.com/<código>, con un segmento
 * opcional de nombre legible después del código; se descartan ese segmento, la consulta y el fragmento. Cualquier
 * otro esquema, dominio, puerto, usuario o ruta se rechaza: el enlace termina en un iframe.
 */
final class GeniallyUrl
{
    public const HOST = 'view.genially.com';

    public static function normalize(mixed $value): ?string
    {
        if (! is_string($value) || strlen($value) > 2048) {
            return null;
        }
        $parts = parse_url(trim($value));
        if ($parts === false || strtolower($parts['scheme'] ?? '') !== 'https' || strtolower($parts['host'] ?? '') !== self::HOST
            || isset($parts['port']) || isset($parts['user']) || isset($parts['pass'])) {
            return null;
        }
        $segments = explode('/', trim($parts['path'] ?? '', '/'));
        if (count($segments) > 2 || ! preg_match('/^[A-Za-z0-9]{6,64}$/', $segments[0])
            || (isset($segments[1]) && ! preg_match('/^[A-Za-z0-9-]{1,120}$/', $segments[1]))) {
            return null;
        }

        return 'https://'.self::HOST.'/'.$segments[0];
    }
}
