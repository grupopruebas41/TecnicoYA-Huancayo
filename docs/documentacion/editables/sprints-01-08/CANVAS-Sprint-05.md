# CANVAS · Sprint 5 — Atención, agenda y seguimiento

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** RF-19 a RF-22; estados del servicio, Iniciar atención y Finalizar servicio, agenda técnica, reprogramación, coordinación de varios técnicos, línea de tiempo y WhatsApp tras asignación, cancelación.

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Permitir ejecutar y seguir cada atención desde la asignación hasta su reporte final, preservando acuerdos de horario, privacidad y la independencia de cada participante.

## 2. Dependencias, límites y condiciones de entrada

Requiere asignaciones, reservas mínimas, eventos y reloj del Sprint 4. El Sprint 5 persiste completed_at y rating_due_at; la interfaz de calificación y su vencimiento se completan en Sprint 6. La reasignación automática consume el mecanismo del Sprint 4; la manual permanece en Sprint 7.

**Decisiones por resolver para las historias afectadas:** P05/P16 franjas y duraciones; P06 máximo de reprogramaciones; P13 aceptación y cierre global de dos técnicos; P14 cancelación/reprogramación en casos límite. No activar coordinación múltiple con reglas parciales sin resolver P13.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S05-01 | HU-06, HU-12 | RF-19 | Agenda personal |
| HU-S05-02 | HU-15 | RF-19, RF-22 | Inicio y finalización |
| HU-S05-03 | HU-13 | RF-20 | Reprogramación por acuerdo |
| HU-S05-04 | HU-14 | RF-21 | Técnico adicional autorizado |
| HU-S05-05 | HU-12, HU-24 | RF-19, RF-33 | Línea de tiempo y contacto |
| HU-S05-06 | HU-12 | RF-19 | Cancelación del cliente |
| HU-S05-07 | HU-13 | RF-19, RF-20 | Retiro e incidencia |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | DService: máquina de estados y casos StartParticipation, CompleteParticipation, RequestReschedule, RespondReschedule, ProposeAdditionalTechnician y CancelRequest; React features/service y requests. |
| RT-02 | Tablas: participations, appointments, reschedule_requests/responses, service_reports/evidence, additional_technician_proposals, incidents/evidence, reassignment_records y request_events. |
| RT-03 | Contratos: /appointments, /requests/{id}/timeline y /cancellation; /participations/{id}/start\|completion\|withdrawal; /requests/{id}/reschedules, /reschedules/{id}/response y propuestas de adicional, según diseño. |
| RT-04 | Aceptación de reprogramación mueve reservas en transacción y vuelve a revisar conflictos. ExpireRescheduleProposal conserva fecha original al vencer 24 h sin respuesta; condiciones especiales según P14. |
| RT-05 | Finalización por participación con reporte; completed_at del servidor y ventana individual de 48 h. El cliente no confirma el cierre. No finalizar automáticamente al segundo técnico. |
| RT-06 | Agenda lista/calendario con rango acotado y zona America/Lima para presentación; persistir UTC. Eventos se emiten tras commit y el historial conserva actor, momento y motivo. |

| Área | Ruta relativa a la raíz del proyecto | Uso |
| --- | --- | --- |
| Frontend | frontend/web/src/features/{requests,matching,offers,service,ratings,administration} | Destino modular orientativo del diseño; adaptar componentes existentes sin sustituir el proyecto completo. |
| Backend | backend/api/app/Modules/{ARequests,BMatching,COffers,DService,ERatings,FAdministration} | Separar HTTP, Application, Domain e Infrastructure cuando existan responsabilidades concretas; no crear capas vacías por formalidad. |
| Persistencia | backend/api/database/migrations y seeders; database/ | Migraciones MySQL versionadas como fuente ejecutable; database conserva documentación/referencia, no un segundo esquema contradictorio. |
| Pruebas PHP | backend/api/tests/Unit y tests/Feature | Rutas de destino propuestas para Pest, API y MySQL; introducir carpetas por módulo al implementar. |
| Pruebas navegador | frontend/web/cypress/e2e/sprint-NN | Ruta prevista para recorridos Cypress; los .feature entregados son especificaciones, no pruebas Cypress implementadas. |
| Entorno | infrastructure/ y .devops/ | Conservar las raíces existentes para Compose, despliegue y automatización; fijar un solo pipeline activo al implementar. |
| Evidencia | docs/documentacion/evidencias/sprint-NN/ | Ruta propuesta para informes, resultados, defectos y acta. Esta entrega no crea resultados ficticios. |
| Documentación | docs/documentacion/editables/sprints-01-08/ | CANVAS, escenarios y catálogo de pruebas previstos en esta entrega. |

Raíz: `C:/Users/James/Documents/ChatGPT/Software TecnicoYa-Huancayo`. Las rutas modulares y de pruebas son destinos del diseño, no afirmaciones sobre implementación existente. La carpeta histórica `python/` se conserva, pero el diseño actual concentra matching en Laravel; no se migra ni elimina código en esta entrega documental.

## 5. Tareas de la iteración

Orden de trabajo: refinamiento y contrato → migración/modelo → dominio/caso de uso/API → interfaz → integración y pruebas → revisión y evidencia. Validar un flujo completo antes de extender al siguiente. No delegar permisos ni estados al navegador.

| Tarea | Historia | Trabajo por capa y entregable | Pruebas previstas |
| --- | --- | --- | --- |
| T-S05-01 | HU-S05-01 | FE: calendario/lista/filtros; API: consultas por titular y rango; datos: appointments y participations vigentes. | TC-059, TC-060 |
| T-S05-02 | HU-S05-02 | FE: acciones según estado y reporte; API: start/completion con versión; datos: reporte único, completed_at y rating_due_at. | TC-061, TC-062 |
| T-S05-03 | HU-S05-03 | FE: propuesta/respuesta; dominio: validar franja y contraparte; datos: anterior/propuesta/respuestas y nueva reserva atómica. | TC-063, TC-064 |
| T-S05-04 | HU-S05-04 | FE: propuesta del principal/decisión del cliente; dominio: cupo y aceptación técnica; datos: additional_technician_proposals y participaciones distintas. | TC-065, TC-066 |
| T-S05-05 | HU-S05-05 | FE: timeline y enlace WhatsApp; API: proyecciones según estado y relación; datos: request_events sin exposición de motivos administrativos privados. | TC-067, TC-068 |
| T-S05-06 | HU-S05-06 | FE: motivo/confirmación; dominio: transición permitida y reservas; datos: evento de cancelación sin borrado de solicitud. | TC-069, TC-070 |
| T-S05-07 | HU-S05-07 | FE: retiro con motivo/reportar incidencia; aplicación: diferencia retiro confirmado de denuncia; datos: incidents y vínculo a reasignación. | TC-071, TC-072 |

**T-S05-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S05-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S05-01 · Agenda personal

Como **técnico**, quiero **ver mis citas en calendario y lista**, para **organizar las atenciones asignadas**.

**Fuente:** HU-06, HU-12. **Requerimientos:** RF-19.

- **AC-S05-01-01 / TC-059: Dado** dos técnicos con citas diferentes en un mismo día, **cuando** uno consulta su agenda en lista y calendario, **entonces** ambas vistas muestran solo sus citas y los mismos horarios locales.
- **AC-S05-01-02 / TC-060: Dado** un técnico sin permiso sobre otra cuenta, **cuando** manipula el filtro para obtener citas del otro técnico, **entonces** la API no devuelve ninguna cita privada ajena.

### HU-S05-02 · Inicio y finalización

Como **técnico asignado**, quiero **registrar el inicio y el trabajo realizado**, para **dejar constancia verificable de mi atención**.

**Fuente:** HU-15. **Requerimientos:** RF-19, RF-22.

- **AC-S05-02-01 / TC-061: Dado** una participación asignada al técnico autenticado, **cuando** inicia la atención y después finaliza con reporte válido, **entonces** queda finalizada con reporte y plazo de calificación a 48 horas del cierre individual, sin confirmación adicional del cliente.
- **AC-S05-02-02 / TC-062: Dado** una participación ya finalizada con reporte y fecha de cierre, **cuando** se repite el mismo comando de finalización, **entonces** no se duplica el reporte ni se renueva el plazo de calificación.

### HU-S05-03 · Reprogramación por acuerdo

Como **cliente o técnico participante**, quiero **proponer un nuevo horario a la otra parte**, para **cambiar la cita solo por acuerdo**.

**Fuente:** HU-13. **Requerimientos:** RF-20.

- **AC-S05-03-01 / TC-063: Dado** una cita vigente y una propuesta de nueva franja libre, **cuando** la contraparte acepta dentro del plazo, **entonces** se libera la reserva anterior y se confirma la nueva en la misma transacción.
- **AC-S05-03-02 / TC-064: Dado** una propuesta pendiente durante 24 horas y una cita original futura, **cuando** el scheduler vence la propuesta, **entonces** la propuesta queda vencida y se mantiene la cita original sin nueva reserva.

### HU-S05-04 · Técnico adicional autorizado

Como **cliente**, quiero **autorizar un segundo técnico propuesto**, para **coordinar un servicio que requiere apoyo**.

**Fuente:** HU-14. **Requerimientos:** RF-21.

- **AC-S05-04-01 / TC-065: Dado** una solicitud con principal y adicional autorizados y en atención, **cuando** el principal registra su finalización, **entonces** solo su participación finaliza y abre su plazo; el adicional continúa en atención. **Condicionado a P13.**
- **AC-S05-04-02 / TC-066: Dado** una solicitud con principal y adicional vigentes, **cuando** se propone incorporar un tercer técnico simultáneo, **entonces** el sistema rechaza la incorporación y conserva las dos participaciones existentes.

### HU-S05-05 · Línea de tiempo y contacto

Como **cliente titular**, quiero **seguir la atención y acceder al contacto cuando corresponda**, para **coordinar con el técnico asignado**.

**Fuente:** HU-12, HU-24. **Requerimientos:** RF-19, RF-33.

- **AC-S05-05-01 / TC-067: Dado** un cliente titular de una solicitud recién asignada, **cuando** abre su detalle, **entonces** ve la línea de tiempo autorizada y el WhatsApp del técnico asignado.
- **AC-S05-05-02 / TC-068: Dado** una oferta aceptada pero aún no elegida por el cliente, **cuando** se consulta el detalle permitido, **entonces** no se revela todavía el WhatsApp ni la dirección exacta al técnico.

### HU-S05-06 · Cancelación del cliente

Como **cliente**, quiero **cancelar antes de iniciarse la atención**, para **detener una solicitud que ya no necesito**.

**Fuente:** HU-12. **Requerimientos:** RF-19.

- **AC-S05-06-01 / TC-069: Dado** una solicitud Asignada cuya atención no ha empezado, **cuando** el titular confirma cancelar con motivo, **entonces** queda Cancelada, se liberan las reservas aplicables y se conserva el historial. **Condicionado a P14.**
- **AC-S05-06-02 / TC-070: Dado** una solicitud con atención ya iniciada, **cuando** el cliente usa la cancelación ordinaria previa a atención, **entonces** la API informa conflicto y no marca la solicitud como cancelada.

### HU-S05-07 · Retiro e incidencia

Como **técnico o cliente afectado**, quiero **registrar impedimentos e inasistencias**, para **permitir una respuesta trazable**.

**Fuente:** HU-13. **Requerimientos:** RF-19, RF-20.

- **AC-S05-07-01 / TC-071: Dado** un técnico asignado antes de atención y una política de retiro aprobada, **cuando** registra su retiro con motivo, **entonces** se conserva la incidencia y se inicia la reasignación aplicable sin perder la participación anterior. **Condicionado a P14.**
- **AC-S05-07-02 / TC-072: Dado** un cliente reporta que el técnico no asistió, **cuando** se registra el reporte, **entonces** queda una incidencia para revisión y no se suspende ni reemplaza automáticamente por la sola denuncia.

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-05.feature](bdd/sprint-05.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
# language: es
@sprint_05 @planificado
Característica: Sprint 5 - Atención, agenda y seguimiento
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_059 @HU_S05_01 @automatizar
  Escenario: TC-059 - Citas propias
    Dado dos técnicos con citas diferentes en un mismo día
    Cuando uno consulta su agenda en lista y calendario
    Entonces ambas vistas muestran solo sus citas y los mismos horarios locales

  @TC_060 @HU_S05_01 @automatizar
  Escenario: TC-060 - Agenda ajena
    Dado un técnico sin permiso sobre otra cuenta
    Cuando manipula el filtro para obtener citas del otro técnico
    Entonces la API no devuelve ninguna cita privada ajena

  @TC_061 @HU_S05_02 @automatizar
  Escenario: TC-061 - Atención finalizada
    Dado una participación asignada al técnico autenticado
    Cuando inicia la atención y después finaliza con reporte válido
    Entonces queda finalizada con reporte y plazo de calificación a 48 horas del cierre individual, sin confirmación adicional del cliente

  @TC_062 @HU_S05_02 @automatizar
  Escenario: TC-062 - Finalización repetida
    Dado una participación ya finalizada con reporte y fecha de cierre
    Cuando se repite el mismo comando de finalización
    Entonces no se duplica el reporte ni se renueva el plazo de calificación

  @TC_063 @HU_S05_03 @automatizar
  Escenario: TC-063 - Aceptación por contraparte
    Dado una cita vigente y una propuesta de nueva franja libre
    Cuando la contraparte acepta dentro del plazo
    Entonces se libera la reserva anterior y se confirma la nueva en la misma transacción

  @TC_064 @HU_S05_03 @automatizar
  Escenario: TC-064 - Propuesta sin respuesta
    Dado una propuesta pendiente durante 24 horas y una cita original futura
    Cuando el scheduler vence la propuesta
    Entonces la propuesta queda vencida y se mantiene la cita original sin nueva reserva

  @TC_065 @HU_S05_04 @automatizar @pendiente_P13
  Escenario: TC-065 - Finalizaciones independientes
    Dado una solicitud con principal y adicional autorizados y en atención
    Cuando el principal registra su finalización
    Entonces solo su participación finaliza y abre su plazo; el adicional continúa en atención

  @TC_066 @HU_S05_04 @automatizar
  Escenario: TC-066 - Tercer participante vigente
    Dado una solicitud con principal y adicional vigentes
    Cuando se propone incorporar un tercer técnico simultáneo
    Entonces el sistema rechaza la incorporación y conserva las dos participaciones existentes

  @TC_067 @HU_S05_05 @automatizar
  Escenario: TC-067 - Contacto tras asignación
    Dado un cliente titular de una solicitud recién asignada
    Cuando abre su detalle
    Entonces ve la línea de tiempo autorizada y el WhatsApp del técnico asignado

  @TC_068 @HU_S05_05 @automatizar
  Escenario: TC-068 - Contacto antes de asignación
    Dado una oferta aceptada pero aún no elegida por el cliente
    Cuando se consulta el detalle permitido
    Entonces no se revela todavía el WhatsApp ni la dirección exacta al técnico

  @TC_069 @HU_S05_06 @automatizar @pendiente_P14
  Escenario: TC-069 - Cancelación antes de atender
    Dado una solicitud Asignada cuya atención no ha empezado
    Cuando el titular confirma cancelar con motivo
    Entonces queda Cancelada, se liberan las reservas aplicables y se conserva el historial

  @TC_070 @HU_S05_06 @automatizar
  Escenario: TC-070 - Cancelación durante atención
    Dado una solicitud con atención ya iniciada
    Cuando el cliente usa la cancelación ordinaria previa a atención
    Entonces la API informa conflicto y no marca la solicitud como cancelada

  @TC_071 @HU_S05_07 @automatizar @pendiente_P14
  Escenario: TC-071 - Retiro del técnico asignado
    Dado un técnico asignado antes de atención y una política de retiro aprobada
    Cuando registra su retiro con motivo
    Entonces se conserva la incidencia y se inicia la reasignación aplicable sin perder la participación anterior

  @TC_072 @HU_S05_07 @automatizar
  Escenario: TC-072 - Reporte de inasistencia
    Dado un cliente reporta que el técnico no asistió
    Cuando se registra el reporte
    Entonces queda una incidencia para revisión y no se suspende ni reemplaza automáticamente por la sola denuncia
```

## 8. Casos de prueba previstos (14)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-059 · Citas propias

**Traza:** RF-19 → HU-06, HU-12 → HU-S05-01 → AC-S05-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** dos técnicos con citas diferentes en un mismo día.
- **Pasos previstos:** preparar la precondición en el entorno aislado; uno consulta su agenda en lista y calendario; consultar estado persistido y efectos observables.
- **Resultado esperado:** ambas vistas muestran solo sus citas y los mismos horarios locales.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-05/tc-059.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-059/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-060 · Agenda ajena

**Traza:** RF-19 → HU-06, HU-12 → HU-S05-01 → AC-S05-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico sin permiso sobre otra cuenta.
- **Pasos previstos:** preparar la precondición en el entorno aislado; manipula el filtro para obtener citas del otro técnico; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API no devuelve ninguna cita privada ajena.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC060.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-060/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-061 · Atención finalizada

**Traza:** RF-19, RF-22 → HU-15 → HU-S05-02 → AC-S05-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una participación asignada al técnico autenticado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; inicia la atención y después finaliza con reporte válido; consultar estado persistido y efectos observables.
- **Resultado esperado:** queda finalizada con reporte y plazo de calificación a 48 horas del cierre individual, sin confirmación adicional del cliente.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC061.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-061/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-062 · Finalización repetida

**Traza:** RF-19, RF-22 → HU-15 → HU-S05-02 → AC-S05-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una participación ya finalizada con reporte y fecha de cierre.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se repite el mismo comando de finalización; consultar estado persistido y efectos observables.
- **Resultado esperado:** no se duplica el reporte ni se renueva el plazo de calificación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC062.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-062/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-063 · Aceptación por contraparte

**Traza:** RF-20 → HU-13 → HU-S05-03 → AC-S05-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una cita vigente y una propuesta de nueva franja libre.
- **Pasos previstos:** preparar la precondición en el entorno aislado; la contraparte acepta dentro del plazo; consultar estado persistido y efectos observables.
- **Resultado esperado:** se libera la reserva anterior y se confirma la nueva en la misma transacción.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC063.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-063/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-064 · Propuesta sin respuesta

**Traza:** RF-20 → HU-13 → HU-S05-03 → AC-S05-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una propuesta pendiente durante 24 horas y una cita original futura.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el scheduler vence la propuesta; consultar estado persistido y efectos observables.
- **Resultado esperado:** la propuesta queda vencida y se mantiene la cita original sin nueva reserva.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC064.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-064/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-065 · Finalizaciones independientes

**Traza:** RF-21 → HU-14 → HU-S05-04 → AC-S05-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud con principal y adicional autorizados y en atención.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el principal registra su finalización; consultar estado persistido y efectos observables.
- **Resultado esperado:** solo su participación finaliza y abre su plazo; el adicional continúa en atención.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC065.php (destino propuesto)`.
- **Dependencia de decisión:** P13.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-065/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-066 · Tercer participante vigente

**Traza:** RF-21 → HU-14 → HU-S05-04 → AC-S05-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud con principal y adicional vigentes.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se propone incorporar un tercer técnico simultáneo; consultar estado persistido y efectos observables.
- **Resultado esperado:** el sistema rechaza la incorporación y conserva las dos participaciones existentes.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC066.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-066/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-067 · Contacto tras asignación

**Traza:** RF-19, RF-33 → HU-12, HU-24 → HU-S05-05 → AC-S05-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente titular de una solicitud recién asignada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; abre su detalle; consultar estado persistido y efectos observables.
- **Resultado esperado:** ve la línea de tiempo autorizada y el WhatsApp del técnico asignado.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-05/tc-067.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-067/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-068 · Contacto antes de asignación

**Traza:** RF-19, RF-33 → HU-12, HU-24 → HU-S05-05 → AC-S05-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una oferta aceptada pero aún no elegida por el cliente.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se consulta el detalle permitido; consultar estado persistido y efectos observables.
- **Resultado esperado:** no se revela todavía el WhatsApp ni la dirección exacta al técnico.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC068.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-068/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-069 · Cancelación antes de atender

**Traza:** RF-19 → HU-12 → HU-S05-06 → AC-S05-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud Asignada cuya atención no ha empezado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el titular confirma cancelar con motivo; consultar estado persistido y efectos observables.
- **Resultado esperado:** queda Cancelada, se liberan las reservas aplicables y se conserva el historial.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC069.php (destino propuesto)`.
- **Dependencia de decisión:** P14.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-069/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-070 · Cancelación durante atención

**Traza:** RF-19 → HU-12 → HU-S05-06 → AC-S05-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud con atención ya iniciada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el cliente usa la cancelación ordinaria previa a atención; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API informa conflicto y no marca la solicitud como cancelada.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC070.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-070/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-071 · Retiro del técnico asignado

**Traza:** RF-19, RF-20 → HU-13 → HU-S05-07 → AC-S05-07-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico asignado antes de atención y una política de retiro aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; registra su retiro con motivo; consultar estado persistido y efectos observables.
- **Resultado esperado:** se conserva la incidencia y se inicia la reasignación aplicable sin perder la participación anterior.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC071.php (destino propuesto)`.
- **Dependencia de decisión:** P14.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-071/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-072 · Reporte de inasistencia

**Traza:** RF-19, RF-20 → HU-13 → HU-S05-07 → AC-S05-07-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente reporta que el técnico no asistió.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se registra el reporte; consultar estado persistido y efectos observables.
- **Resultado esperado:** queda una incidencia para revisión y no se suspende ni reemplaza automáticamente por la sola denuncia.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint05/TC072.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-05/TC-072/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S05-01 | Solo el técnico asignado inicia/finaliza su propia participación; no confiar en id de actor del cuerpo. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S05-02 | Datos de contacto y dirección exacta únicamente según relación autorizada tras asignación; revocación y estados posteriores conforme política acordada. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S05-03 | Control de versión y transacción para evitar inicio/cancelación o reprogramaciones incompatibles simultáneas. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S05-04 | Reportes y evidencias validados y privados; registrar incidencias sin convertir una denuncia no revisada en sanción automática. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S05-05 | Técnico adicional necesita propuesta, autorización del cliente y aceptación definida; no permite autoasignarse terceros. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

Transversal: detectar secretos y dependencias vulnerables, revisar entradas y permisos, usar datos sintéticos y conservar auditoría desde la primera acción sensible. La instrumentación se introduce junto al flujo; la interfaz completa y el endurecimiento permanecen en los sprints previstos.

## 10. Definition of Done

### DoD común del incremento

- [ ] Las historias comprometidas cumplen sus criterios positivos, alternativos y de autorización; las decisiones pendientes que condicionan su aceptación están resueltas y registradas. Un caso condicionado no se cuenta como aprobado por omisión.
- [ ] Código revisado y responsabilidades separadas conforme diseño modular/SOLID; contratos, migraciones, diccionario y trazabilidad actualizados para el incremento real, sin afirmar que todo el proyecto está terminado.
- [ ] Build y pruebas aplicables ejecutados en entorno aislado con versiones identificadas. Casos de servidor usan MySQL cuando se evalúa integridad/concurrencia; Cypress no sustituye la prueba de transacción.
- [ ] Sin secretos en el repositorio o artefactos. Autorización por rol/propiedad, validación y privacidad del nuevo flujo probadas; sin defectos bloqueantes de seguridad/integridad. Umbrales de defectos restantes se acuerdan en P21.
- [ ] Regresión de comportamientos afectados de sprints anteriores realizada; fallos y excepciones documentados con responsable y resolución. No marcar aprobado un escenario omitido ni un test deshabilitado.
- [ ] Evidencias vinculadas a TC, HU, RF/RNF, commit, entorno/versiones, dataset, resultado, fecha y defecto. Los informes del runner son evidencia; una captura aislada no demuestra integridad.
- [ ] Incremento integrado y demostrable en el entorno acordado; revisión con el asesor, observaciones y aceptación registradas. Retrospectiva identifica mejoras sin cambiar silenciosamente los ocho alcances.

### DoD específica de este sprint

- [ ] Agenda y detalle reflejan reservas y eventos consistentes para cada identidad.
- [ ] Inicio/finalización respetan transiciones válidas, persisten reporte y abren ventana individual sin pedir confirmación extra al cliente.
- [ ] Reprogramación requiere a la contraparte; vencimiento 24 h conserva cita original según política ratificada.
- [ ] Principal más un adicional como máximo; cada finalización independiente y estado global conforme P13 aprobado.
- [ ] Cancelación, retiro e incidencia conservan historial y activan solo los efectos autorizados.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 5 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-05/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
