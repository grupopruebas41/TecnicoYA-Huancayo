<?php

return [
    'paths' => ['api/v1/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'http://127.0.0.1:5173,http://localhost:5173'))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Content-Type', 'X-XSRF-TOKEN', 'X-Requested-With', 'Idempotency-Key'],
    // Fase A3 del panel del administrador: la SPA lee el nombre del CSV y el aviso de archivo cortado.
    'exposed_headers' => ['Content-Disposition', 'X-Export-Truncated'],
    'max_age' => 0,
    'supports_credentials' => true,
];
