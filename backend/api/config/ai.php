<?php

// D-94 (RECO-01): proveedor de IA opcional del buscador «¿Qué se malogró?». Sin AI_PROVIDER, sin clave o sin modelo
// queda desactivado y solo responde el diccionario. La clave nunca se registra ni se devuelve.
return [
    'provider' => env('AI_PROVIDER', 'none'),
    'api_key' => env('AI_API_KEY', ''),
    'model' => env('AI_MODEL', ''),
    'timeout' => (float) env('AI_TIMEOUT', 4),
    'cache_hours' => 24,
];
