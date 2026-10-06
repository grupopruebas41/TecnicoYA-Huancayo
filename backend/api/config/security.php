<?php

return [
    // Política técnica inicial: mismo límite de autenticación que la API histórica.
    'auth_attempts_per_minute' => (int) env('AUTH_ATTEMPTS_PER_MINUTE', 10),
];
