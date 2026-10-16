# S4.4 · Frontend · 2026-10-16

Base origin/main 38c9c14; rama feature/delgado/b-matching/s04, slot B. Código comprobado: dac617f.

## Implementación

- Ofertas: cronómetro desde expires_at y meta.server_time más performance.now; aceptar/rechazar con idempotencia, confirmación de rechazo, recuperación de 409/red y detalle sin fabricar datos privados.
- Cliente: fases, candidatos, empate, tarifa referencial, elección confirmada, lectura de candidatos tras cualquier 409, pendiente con fecha de Lima y autorización de alternativas.
- Reverb/Echo: canales privados por recurso, autorización Sanctum vía /api/v1/broadcasting/auth, eventos como avisos, últimas 200 identidades y versión por recurso; recuperación al reconectar y fallback manual accesible.
- Notificaciones: after_id, paginación de recuperación y deduplicación.
- D-60: POST /requests lleva clave estable; un reintento automático ante red, con cuerpo y clave iguales. Rechazo definitivo libera el intento para corregirlo. D-61: DELETE /media/{id} confirmado; 409 conserva la miniatura.
- D-64: distrito base desde catálogo activo en el perfil técnico. No se editaron backend ni scripts comunes.

## Pruebas y evidencias

- Rojo 757abe1: 13 escenarios escritos; la suite falló en importación por componentes aún ausentes (0 ejecutados; no se presentan como 13 fallos de aserción).
- Verde b5b8891, recuperación dac617f. Resultado final: **142/142 Vitest, 20 archivos, 13 IDs S04-TC-101–113 distintos**. Complementos reutilizan IDs sin inflar conteo.
- Cobertura de líneas global **84,26 %**; detalle por módulo en log verde-recuperacion. JUnit/LCOV anonimizados.
- Build y npm audit: salida 0; 0 vulnerabilidades. node --check de las specs: salida 0.
- Cypress, Docker, Pest y SonarQube: NO ejecutados localmente. La CI no sustituye la regresión real de S4.5.
- Los logs incluyen HEAD al iniciar; verde-recuperacion se ejecutó sobre e9d7504 más los cambios confirmados como dac617f. No hubo cambios de código posteriores a esa corrida.
- Fallos intermedios conservados: prueba S3 prohibía repetir creación, reemplazada por la condición D-60 (dos POST, misma clave, sin falso éxito); una edición inicial cambió la aserción del caso equivocado, corregida sin relajar el caso de creación exitosa (sigue exigiendo un POST).

## Cypress preparado, no aprobado

18 IDs exactos S04-TC-083–100 están representados. 13 tienen pasos ejecutables, **5 permanecen skip con motivo** y no cuentan como implementados ni aprobados:

| ID | Precisión pedida a Claude Code antes del S4.5 |
|---|---|
| S04-TC-086 | Fixture/tarea real con expires_at = server_time + 60 s; controlar también performance.now al avanzar el navegador. |
| S04-TC-087 | Preparación aislada de envío y dos aceptaciones, sin depender de la ejecución previa de otro caso. |
| S04-TC-089 | Identificar solicitud y oferta cuyo técnico busy tiene conflicto de franja real. |
| S04-TC-094 | Tarea para republicar mismo event_id y control de desconexión/reconexión sin datos inventados. |
| S04-TC-100 | Fixture aislado que vincule cliente, oferta aceptada y técnico para verificar la dirección antes/después. |

Además: acordar reinicio de fixtures/reloj entre casos para evitar contaminación; verificar serverClock, runJobs y openRoundFor y su retorno en el arrancador real. Las specs están preparadas contra nombres del contrato, aún sin validar sus precondiciones en el seeder final. No se inventaron tareas adicionales. La cobertura E2E de teclado debe completar elección y Espacio en S4.5; el caso preparado inicia con Enter y foco del rechazo.

## Configuración y precisiones de integración

Vite requiere VITE_REVERB_APP_KEY (clave pública, nunca el secreto), VITE_REVERB_HOST, VITE_REVERB_PORT y VITE_REVERB_SCHEME. Slot B usa puerto 8082 conforme a D-70; el arrancador debe suministrarlos, sin versionar .env. Sin configuración se muestra el fallback.
Confirmar que /broadcasting/auth respete la envoltura data del §1 (el autorizador usa r.data), y que /me incluya technician_profile.id para el canal. Si Laravel devuelve el formato nativo de Pusher sin envoltura, documentarlo antes de la adaptación.
El catálogo asigna archivos individuales por caso; la implementación agrupa casos en offers/sprint04.test.jsx, offers/sprint04Flows.test.jsx y realtime/Realtime.test.jsx, conservando todos los IDs.
D-26 conserva la nota de retiro y la etiqueta v0.3-antes-retiro-prototipo de main; importar los documentos antiguos del backend no revierte ese registro.

Revisor: [PENDIENTE]. SonarQube/Quality Gate: pendiente de cierre; no se declara aprobado.
