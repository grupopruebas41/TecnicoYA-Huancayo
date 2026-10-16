<?php

return [
    // Retención de claves Idempotency-Key: propuesta del diseño técnico (7 días), pendiente de validar.
    // Es un parámetro técnico, no una regla de negocio; las restricciones de dominio evitan duplicados después.
    'idempotency_retention_days' => (int) env('IDEMPOTENCY_RETENTION_DAYS', 7),
];
