<?php

return [
    // Política técnica inicial: mismo límite de autenticación que la API histórica.
    'auth_attempts_per_minute' => (int) env('AUTH_ATTEMPTS_PER_MINUTE', 10),
    // D-80: URL pública de la SPA para el enlace de recuperación de contraseña.
    'spa_url' => env('SPA_URL', 'http://127.0.0.1:5173'),
    // D-80: solicitudes de enlace de recuperación por IP (por minuto) y por correo (cada 15 minutos).
    'password_reset_per_ip_per_minute' => (int) env('PASSWORD_RESET_PER_IP_PER_MINUTE', 10),
    'password_reset_per_email_per_15_minutes' => (int) env('PASSWORD_RESET_PER_EMAIL', 3),
];
