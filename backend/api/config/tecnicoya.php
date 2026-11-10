<?php

return [
    // Fase 6 (D-99): con true, tecnicoya:iot-simulate genera lecturas para todos los equipos; si no, solo para los demo.
    'iot_simulation' => env('IOT_SIMULATION', false),
];
