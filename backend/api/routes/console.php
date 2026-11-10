<?php

use Illuminate\Support\Facades\Schedule;

// Los comandos del prototipo (marketplace:tick, programado cada segundo, y marketplace:admin) se retiraron
// (D-26, D-62). El alta de administradores sigue en app/Console/Commands/ProvisionAdmin.php.

// S4 (contrato §3): barrido de plazos, pendientes, entregas y outbox cada minuto, sin solaparse.
Schedule::command('tecnicoya:sweep')->everyMinute()->withoutOverlapping();

// Fase 6 (D-99): lecturas simuladas de los sensores de demostración cada 10 minutos.
Schedule::command('tecnicoya:iot-simulate')->everyTenMinutes()->withoutOverlapping();
