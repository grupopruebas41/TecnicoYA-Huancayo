# S4.5 · preparación e integración · 2026-10-17

Rama: feature/delgado/b-matching/s04. PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/20.
Merge de origin/main 4c56cd7: f0612cf. Implementación: 8b5c811. Cypress preparados: 345bf88.
Los logs con f0612cf identifican el HEAD antes del commit, con los cambios de trabajo que quedaron en los dos commits indicados. No son resultados de un árbol limpio f0612cf.

## Resultados reales

- Vitest final: 146/146, 21 archivos, salida 0; cobertura: líneas 84,22 %, sentencias 78,94 %, ramas 73,37 %, funciones 77,44 %. Ofertas: líneas 92,17 %; tiempo real: 91,83 %.
- Build: aprobado, salida 0.
- npm audit: 0 vulnerabilidades, salida 0.
- Cypress S04: NO EJECUTADO. Ningún aprobado inferido. 17 casos preparados y S04-TC-094 omitido por tarea faltante.
- Regresiones S01, S02, S03: NO EJECUTADAS.
- Memoria libre observada: 0,59 / 0,94 / 0,73 GiB. Se avisó al usuario y no se arrancó Cypress, Reverb, cola, scheduler, Docker, Pest ni SonarQube. Pendiente liberar memoria para retomar las cuatro corridas secuenciales.

## Preparación y cambios

- tareasSprint04 registradas; openRoundFor recibe correo sintético completo. Cada caso restaura serverClock antes/después; pruebas de respuesta actúan sobre offer_id retornado por la tarea.
- S04-TC-086: datos HTTP reales intactos; reloj monotónico del navegador controlado hasta los últimos 60 s del SLA, después 59 s y 1 s. Mantiene aserciones 00:01, 00:00, deshabilitado y Plazo vencido. Preparado, no validado en Cypress.
- S04-TC-087: nueva solicitud desde el asistente, dos aceptaciones mediante API real y regreso del cliente. Preparado, no validado.
- S04-TC-089: usa el candidato busy y solicitud programada del seeder; exige 409 SCHEDULE_CONFLICT, recarga y ausencia de falso éxito. El 088 usa otra ronda para no consumir esa solicitud. Preparado, no validado.
- S04-TC-100: ronda propia de openRoundFor, lectura privada antes, elección mediante API autenticada del cliente y lectura después. Preparado, no validado.
- Reverb: VITE_REVERB_* ya estaba conectado; se adapta el cuerpo nativo {auth} exclusivamente en broadcasting/auth. Se consulta el ID del perfil por GET /technicians/me/profile porque /me no lo incluye; nunca se suscribe a technicians.undefined. Sin perfil, conserva lectura HTTP y aviso de desconexión.
- Después de 409 se descarta Idempotency-Key en respuesta de oferta y búsqueda alternativa, incluso si no cambia la versión del recurso.

## Único bloqueo de preparación confirmado: S04-TC-094

El módulo scripts/e2e-tareas-s04.mjs solo ofrece serverClock, runJobs y openRoundFor. No permite republicar un mismo event_id. Pedido a Claude Code: agregar una tarea aislada que encuentre un evento real de una solicitud del cliente sintético, devuelva event_id/request_id/version/canal y publique ese mismo evento dos veces por Reverb sin cambiar el estado de negocio ni crear otros IDs. Debe funcionar en el slot del arrancador y respetar la guarda *_testing. Así se verifica deduplicación/reconexión contra transporte real sin cy.intercept de respuestas inventadas. La cuenta y la autenticación ya existen; falta la operación de replay, no un endpoint de producto.

## Continuación

Con memoria suficiente, ejecutar S04, S01, S02 y S03 uno por vez con node scripts/run-e2e.mjs --sprint NN --slot B --junit. Si fallan, conservar evidencia y diagnosticar; no relajar aserciones. No se afirma que los 17 preparados pasen hasta ejecutarlos. No se modificó backend/.

Revisor humano: [PENDIENTE]. CI: consultar el último commit del PR; se registra al terminar la ejecución remota.
