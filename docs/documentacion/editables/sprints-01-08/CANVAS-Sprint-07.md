# CANVAS · Sprint 7 — Panel administrador completo

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** RF-30 y RF-31; dashboard con métricas, gráficos y alertas; solicitudes con reasignación manual; clientes, soporte y bloqueo; reglas editables con historial; exportación Excel/PDF; cuentas de administrador y auditoría.

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Completar la supervisión operativa y el gobierno de parámetros y accesos, permitiendo intervenciones justificadas y reportes verificables sin alterar el historial.

## 2. Dependencias, límites y condiciones de entrada

Consume los ciclos y datos de Sprints 1–6. Reutiliza catálogo/verificación/comunicados de Sprint 2 y apelaciones de Sprint 6. Backend y bandeja de soporte administrativo se completan aquí con tickets sintéticos; el acceso de ayuda/soporte del cliente y técnico se integra en Sprint 8.

**Decisiones por resolver para las historias afectadas:** P18 efectos de bloqueo/suspensión sobre sesiones y servicios abiertos; P19 aplicación temporal de cambios; P21 fórmulas de dashboard y alertas, criterios de exportación y capacidad. Definir protección del último administrador responsable sin añadir un cuarto rol.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S07-01 | HU-21 | RF-30 | Dashboard y alertas |
| HU-S07-02 | HU-21, HU-28 | RF-30, RF-33 | Reasignación manual controlada |
| HU-S07-03 | HU-21, HU-28 | RF-30, RF-33, RF-C12 | Clientes y bloqueos |
| HU-S07-04 | HU-30 | RF-30, RF-C07 | Soporte administrativo |
| HU-S07-05 | HU-26 | RF-C03, RF-30 | Reglas e historial |
| HU-S07-06 | HU-22 | RF-31 | Reportes Excel y PDF |
| HU-S07-07 | HU-28 | RF-C05, RF-33 | Administradores y auditoría |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | React features/administration; FAdministration para supervisión/reportes/reglas/permisos. Una intervención delega a COffers/DService, no modifica estados por SQL directo. |
| RT-02 | Contratos: /admin/dashboard, /admin/requests, /admin/clients, /admin/rule-versions, /admin/reports, /admin/report-exports, /operations/{id}, /exports/{id}/download, /admin/accounts y /admin/audit. |
| RT-03 | Reasignar: POST /admin/requests/{id}/reassignments con replacement_technician_id, reason y expected_version. La propuesta vigente espera respuesta del reemplazo y elección/autorización definida; no forzar disponibilidad ni sustituir participación en silencio. |
| RT-04 | Tablas: reassignment_records, client_blocks, support_tickets/updates, rule_versions/values/weights, audit_entries, operations/export_files y permisos; preservar relaciones a eventos anteriores. |
| RT-05 | Publicar parámetros crea versión nueva y conserva pesos aplicados. Validar suma 100, rangos y motivo; vigencia sobre trabajo abierto resuelta en P19 antes de habilitar edición. |
| RT-06 | Exportar mediante cola de entrega con operación consultable, filtros persistidos y descarga privada. Reportes reproducibles: documentar fórmula, denominador, periodo y zona horaria; no deducir SLA de datos incompletos. |
| RT-07 | Alertas de SLA reiterado/calificación baja requieren umbrales aprobados; pendientes mayores de 20 h según fuente. Una alerta no ejecuta automáticamente una sanción. |

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
| T-S07-01 | HU-S07-01 | FE: tarjetas/gráficos/alertas; API: agregaciones con filtros; datos: fixture con resultados manualmente calculados y fórmula aprobada. | TC-087, TC-088 |
| T-S07-02 | HU-S07-02 | FE: ficha/selección/revisión del motivo; aplicación: nuevo intento y generación mediante módulo dueño; datos: intervención, participación anterior y auditoría. | TC-089, TC-090 |
| T-S07-03 | HU-S07-03 | FE: ficha/listado y acciones motivadas; aplicación: acceso de cuenta y efectos aprobados; datos: client_blocks e historial sin borrado. | TC-091, TC-092 |
| T-S07-04 | HU-S07-04 | FE: bandeja de tickets sintéticos y resolución; API: permiso/versión; datos: support_tickets/updates y acceso al contexto autorizado. | TC-093, TC-094 |
| T-S07-05 | HU-S07-05 | FE: editor/rangos/suma/historial; dominio: validar y publicar; datos: versiones inmutables aplicadas al matching. | TC-095, TC-096 |
| T-S07-06 | HU-S07-06 | FE: filtros/estado de operación/descarga; aplicación: job de exportación con autor; datos: operations/export_files privados y métricas coherentes. | TC-097, TC-098 |
| T-S07-07 | HU-S07-07 | FE: cuentas/permisos y auditoría de solo lectura; API: admins.manage/audit.read y transacción; datos: concesiones y registros inmutables para operaciones ordinarias. | TC-099, TC-100 |

**T-S07-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S07-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S07-01 · Dashboard y alertas

Como **administrador supervisor**, quiero **consultar métricas por periodo, especialidad y zona**, para **identificar trabajo pendiente y problemas de atención**.

**Fuente:** HU-21. **Requerimientos:** RF-30.

- **AC-S07-01-01 / TC-087: Dado** un dataset sintético con conteos esperados y definición de cumplimiento de SLA aprobada, **cuando** el administrador aplica filtros de fecha y especialidad, **entonces** tarjetas y gráficos coinciden con los resultados esperados del mismo conjunto. **Condicionado a P21.**
- **AC-S07-01-02 / TC-088: Dado** una solicitud pendiente de 21 horas y otra de 19 horas, **cuando** se consulta el panel de alertas, **entonces** solo la primera aparece en la alerta de pendientes de más de 20 horas.

### HU-S07-02 · Reasignación manual controlada

Como **administrador con permiso de reasignación**, quiero **intervenir una solicitud con motivo**, para **resolver incidencias conservando trazabilidad**.

**Fuente:** HU-21, HU-28. **Requerimientos:** RF-30, RF-33.

- **AC-S07-02-01 / TC-089: Dado** una solicitud reasignable, un reemplazo elegible y política de respuesta aprobada, **cuando** el administrador autorizado solicita reasignación con motivo y versión vigente, **entonces** se registra la intervención y nueva generación con ofertas autorizadas, sin forzar asignación ni borrar al técnico anterior. **Condicionado a P11, P14.**
- **AC-S07-02-02 / TC-090: Dado** un administrador que no tiene requests.reassign, **cuando** invoca la operación manual, **entonces** recibe 403 y no cambian solicitud, ofertas ni participantes.

### HU-S07-03 · Clientes y bloqueos

Como **administrador autorizado**, quiero **revisar historial y bloquear o desbloquear con motivo**, para **controlar abusos conforme una política conocida**.

**Fuente:** HU-21, HU-28. **Requerimientos:** RF-30, RF-33, RF-C12.

- **AC-S07-03-01 / TC-091: Dado** un cliente y una política de bloqueo/sesión ratificada, **cuando** el administrador autorizado registra un bloqueo con motivo, **entonces** se impiden las acciones definidas por esa política y se conserva historial de servicio y auditoría. **Condicionado a P18.**
- **AC-S07-03-02 / TC-092: Dado** un administrador autorizado selecciona un cliente, **cuando** solicita bloquearlo sin motivo, **entonces** se rechaza la operación sin cambiar acceso ni crear un bloqueo activo.

### HU-S07-04 · Soporte administrativo

Como **administrador de soporte**, quiero **revisar y resolver tickets**, para **atender incidencias con seguimiento**.

**Fuente:** HU-30. **Requerimientos:** RF-30, RF-C07.

- **AC-S07-04-01 / TC-093: Dado** un ticket sintético abierto y un administrador con permiso de soporte, **cuando** registra una resolución válida, **entonces** el ticket queda resuelto con autor, fecha y actualización de historial.
- **AC-S07-04-02 / TC-094: Dado** un usuario sin permiso de soporte administrativo, **cuando** intenta resolver un ticket, **entonces** la API deniega y el ticket permanece intacto.

### HU-S07-05 · Reglas e historial

Como **administrador de reglas**, quiero **editar parámetros mediante nuevas versiones**, para **ajustar el negocio sin borrar decisiones previas**.

**Fuente:** HU-26. **Requerimientos:** RF-C03, RF-30.

- **AC-S07-05-01 / TC-095: Dado** pesos 35, 20, 30 y 15 y plazos válidos con motivo, **cuando** el administrador publica una nueva versión bajo la política de vigencia acordada, **entonces** queda disponible la versión nueva y los rankings previos conservan la versión anterior. **Condicionado a P19.**
- **AC-S07-05-02 / TC-096: Dado** una configuración vigente correcta, **cuando** se intenta publicar pesos cuya suma es 95, **entonces** la API rechaza y mantiene intacta la configuración vigente.

### HU-S07-06 · Reportes Excel y PDF

Como **administrador de reportes**, quiero **exportar cobertura y desempeño**, para **entregar información verificable**.

**Fuente:** HU-22. **Requerimientos:** RF-31.

- **AC-S07-06-01 / TC-097: Dado** un reporte con filtros y resultados esperados aprobados, **cuando** se generan sus exportaciones XLSX y PDF, **entonces** ambas contienen el mismo periodo, filtros y cifras que la consulta y quedan vinculadas a su operación. **Condicionado a P21.**
- **AC-S07-06-02 / TC-098: Dado** una exportación privada completada para un administrador, **cuando** otro usuario sin permiso intenta descargarla por identificador, **entonces** se deniega sin exponer el archivo ni una URL pública.

### HU-S07-07 · Administradores y auditoría

Como **administrador responsable**, quiero **gestionar cuentas privilegiadas y revisar acciones sensibles**, para **mantener separación de funciones y rendición de cuentas**.

**Fuente:** HU-28. **Requerimientos:** RF-C05, RF-33.

- **AC-S07-07-01 / TC-099: Dado** un administrador con admins.manage y datos de una cuenta nueva, **cuando** crea otro administrador con permisos explícitos, **entonces** se crea la cuenta con esas concesiones y se registra quién autorizó el alta sin exponer su contraseña.
- **AC-S07-07-02 / TC-100: Dado** una acción administrativa sensible cuya escritura de auditoría falla, **cuando** se intenta confirmar su transacción, **entonces** se revierte todo el cambio de negocio y no se emite un evento de éxito.

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-07.feature](bdd/sprint-07.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
# language: es
@sprint_07 @planificado
Característica: Sprint 7 - Panel administrador completo
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_087 @HU_S07_01 @automatizar @pendiente_P21
  Escenario: TC-087 - Métricas reproducibles
    Dado un dataset sintético con conteos esperados y definición de cumplimiento de SLA aprobada
    Cuando el administrador aplica filtros de fecha y especialidad
    Entonces tarjetas y gráficos coinciden con los resultados esperados del mismo conjunto

  @TC_088 @HU_S07_01 @automatizar
  Escenario: TC-088 - Pendiente mayor de 20 horas
    Dado una solicitud pendiente de 21 horas y otra de 19 horas
    Cuando se consulta el panel de alertas
    Entonces solo la primera aparece en la alerta de pendientes de más de 20 horas

  @TC_089 @HU_S07_02 @automatizar @pendiente_P11 @pendiente_P14
  Escenario: TC-089 - Intervención válida
    Dado una solicitud reasignable, un reemplazo elegible y política de respuesta aprobada
    Cuando el administrador autorizado solicita reasignación con motivo y versión vigente
    Entonces se registra la intervención y nueva generación con ofertas autorizadas, sin forzar asignación ni borrar al técnico anterior

  @TC_090 @HU_S07_02 @automatizar
  Escenario: TC-090 - Sin permiso de reasignación
    Dado un administrador que no tiene requests.reassign
    Cuando invoca la operación manual
    Entonces recibe 403 y no cambian solicitud, ofertas ni participantes

  @TC_091 @HU_S07_03 @automatizar @pendiente_P18
  Escenario: TC-091 - Bloqueo conforme política
    Dado un cliente y una política de bloqueo/sesión ratificada
    Cuando el administrador autorizado registra un bloqueo con motivo
    Entonces se impiden las acciones definidas por esa política y se conserva historial de servicio y auditoría

  @TC_092 @HU_S07_03 @automatizar
  Escenario: TC-092 - Bloqueo sin motivo
    Dado un administrador autorizado selecciona un cliente
    Cuando solicita bloquearlo sin motivo
    Entonces se rechaza la operación sin cambiar acceso ni crear un bloqueo activo

  @TC_093 @HU_S07_04 @automatizar
  Escenario: TC-093 - Resolución de ticket
    Dado un ticket sintético abierto y un administrador con permiso de soporte
    Cuando registra una resolución válida
    Entonces el ticket queda resuelto con autor, fecha y actualización de historial

  @TC_094 @HU_S07_04 @automatizar
  Escenario: TC-094 - Resolución no autorizada
    Dado un usuario sin permiso de soporte administrativo
    Cuando intenta resolver un ticket
    Entonces la API deniega y el ticket permanece intacto

  @TC_095 @HU_S07_05 @automatizar @pendiente_P19
  Escenario: TC-095 - Publicación de versión válida
    Dado pesos 35, 20, 30 y 15 y plazos válidos con motivo
    Cuando el administrador publica una nueva versión bajo la política de vigencia acordada
    Entonces queda disponible la versión nueva y los rankings previos conservan la versión anterior

  @TC_096 @HU_S07_05 @automatizar
  Escenario: TC-096 - Pesos que suman 95
    Dado una configuración vigente correcta
    Cuando se intenta publicar pesos cuya suma es 95
    Entonces la API rechaza y mantiene intacta la configuración vigente

  @TC_097 @HU_S07_06 @automatizar @pendiente_P21
  Escenario: TC-097 - Exportaciones equivalentes
    Dado un reporte con filtros y resultados esperados aprobados
    Cuando se generan sus exportaciones XLSX y PDF
    Entonces ambas contienen el mismo periodo, filtros y cifras que la consulta y quedan vinculadas a su operación

  @TC_098 @HU_S07_06 @automatizar
  Escenario: TC-098 - Descarga ajena
    Dado una exportación privada completada para un administrador
    Cuando otro usuario sin permiso intenta descargarla por identificador
    Entonces se deniega sin exponer el archivo ni una URL pública

  @TC_099 @HU_S07_07 @automatizar
  Escenario: TC-099 - Alta por responsable
    Dado un administrador con admins.manage y datos de una cuenta nueva
    Cuando crea otro administrador con permisos explícitos
    Entonces se crea la cuenta con esas concesiones y se registra quién autorizó el alta sin exponer su contraseña

  @TC_100 @HU_S07_07 @automatizar
  Escenario: TC-100 - Fallo de auditoría
    Dado una acción administrativa sensible cuya escritura de auditoría falla
    Cuando se intenta confirmar su transacción
    Entonces se revierte todo el cambio de negocio y no se emite un evento de éxito
```

## 8. Casos de prueba previstos (14)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-087 · Métricas reproducibles

**Traza:** RF-30 → HU-21 → HU-S07-01 → AC-S07-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un dataset sintético con conteos esperados y definición de cumplimiento de SLA aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el administrador aplica filtros de fecha y especialidad; consultar estado persistido y efectos observables.
- **Resultado esperado:** tarjetas y gráficos coinciden con los resultados esperados del mismo conjunto.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC087.php (destino propuesto)`.
- **Dependencia de decisión:** P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-087/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-088 · Pendiente mayor de 20 horas

**Traza:** RF-30 → HU-21 → HU-S07-01 → AC-S07-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud pendiente de 21 horas y otra de 19 horas.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se consulta el panel de alertas; consultar estado persistido y efectos observables.
- **Resultado esperado:** solo la primera aparece en la alerta de pendientes de más de 20 horas.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC088.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-088/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-089 · Intervención válida

**Traza:** RF-30, RF-33 → HU-21, HU-28 → HU-S07-02 → AC-S07-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud reasignable, un reemplazo elegible y política de respuesta aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el administrador autorizado solicita reasignación con motivo y versión vigente; consultar estado persistido y efectos observables.
- **Resultado esperado:** se registra la intervención y nueva generación con ofertas autorizadas, sin forzar asignación ni borrar al técnico anterior.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC089.php (destino propuesto)`.
- **Dependencia de decisión:** P11, P14.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-089/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-090 · Sin permiso de reasignación

**Traza:** RF-30, RF-33 → HU-21, HU-28 → HU-S07-02 → AC-S07-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un administrador que no tiene requests.reassign.
- **Pasos previstos:** preparar la precondición en el entorno aislado; invoca la operación manual; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe 403 y no cambian solicitud, ofertas ni participantes.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC090.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-090/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-091 · Bloqueo conforme política

**Traza:** RF-30, RF-33, RF-C12 → HU-21, HU-28 → HU-S07-03 → AC-S07-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente y una política de bloqueo/sesión ratificada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el administrador autorizado registra un bloqueo con motivo; consultar estado persistido y efectos observables.
- **Resultado esperado:** se impiden las acciones definidas por esa política y se conserva historial de servicio y auditoría.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC091.php (destino propuesto)`.
- **Dependencia de decisión:** P18.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-091/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-092 · Bloqueo sin motivo

**Traza:** RF-30, RF-33, RF-C12 → HU-21, HU-28 → HU-S07-03 → AC-S07-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un administrador autorizado selecciona un cliente.
- **Pasos previstos:** preparar la precondición en el entorno aislado; solicita bloquearlo sin motivo; consultar estado persistido y efectos observables.
- **Resultado esperado:** se rechaza la operación sin cambiar acceso ni crear un bloqueo activo.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC092.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-092/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-093 · Resolución de ticket

**Traza:** RF-30, RF-C07 → HU-30 → HU-S07-04 → AC-S07-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un ticket sintético abierto y un administrador con permiso de soporte.
- **Pasos previstos:** preparar la precondición en el entorno aislado; registra una resolución válida; consultar estado persistido y efectos observables.
- **Resultado esperado:** el ticket queda resuelto con autor, fecha y actualización de historial.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC093.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-093/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-094 · Resolución no autorizada

**Traza:** RF-30, RF-C07 → HU-30 → HU-S07-04 → AC-S07-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un usuario sin permiso de soporte administrativo.
- **Pasos previstos:** preparar la precondición en el entorno aislado; intenta resolver un ticket; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API deniega y el ticket permanece intacto.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC094.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-094/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-095 · Publicación de versión válida

**Traza:** RF-C03, RF-30 → HU-26 → HU-S07-05 → AC-S07-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** pesos 35, 20, 30 y 15 y plazos válidos con motivo.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el administrador publica una nueva versión bajo la política de vigencia acordada; consultar estado persistido y efectos observables.
- **Resultado esperado:** queda disponible la versión nueva y los rankings previos conservan la versión anterior.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC095.php (destino propuesto)`.
- **Dependencia de decisión:** P19.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-095/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-096 · Pesos que suman 95

**Traza:** RF-C03, RF-30 → HU-26 → HU-S07-05 → AC-S07-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una configuración vigente correcta.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta publicar pesos cuya suma es 95; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API rechaza y mantiene intacta la configuración vigente.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC096.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-096/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-097 · Exportaciones equivalentes

**Traza:** RF-31 → HU-22 → HU-S07-06 → AC-S07-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un reporte con filtros y resultados esperados aprobados.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se generan sus exportaciones XLSX y PDF; consultar estado persistido y efectos observables.
- **Resultado esperado:** ambas contienen el mismo periodo, filtros y cifras que la consulta y quedan vinculadas a su operación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC097.php (destino propuesto)`.
- **Dependencia de decisión:** P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-097/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-098 · Descarga ajena

**Traza:** RF-31 → HU-22 → HU-S07-06 → AC-S07-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una exportación privada completada para un administrador.
- **Pasos previstos:** preparar la precondición en el entorno aislado; otro usuario sin permiso intenta descargarla por identificador; consultar estado persistido y efectos observables.
- **Resultado esperado:** se deniega sin exponer el archivo ni una URL pública.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC098.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-098/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-099 · Alta por responsable

**Traza:** RF-C05, RF-33 → HU-28 → HU-S07-07 → AC-S07-07-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un administrador con admins.manage y datos de una cuenta nueva.
- **Pasos previstos:** preparar la precondición en el entorno aislado; crea otro administrador con permisos explícitos; consultar estado persistido y efectos observables.
- **Resultado esperado:** se crea la cuenta con esas concesiones y se registra quién autorizó el alta sin exponer su contraseña.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC099.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-099/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-100 · Fallo de auditoría

**Traza:** RF-C05, RF-33 → HU-28 → HU-S07-07 → AC-S07-07-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una acción administrativa sensible cuya escritura de auditoría falla.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta confirmar su transacción; consultar estado persistido y efectos observables.
- **Resultado esperado:** se revierte todo el cambio de negocio y no se emite un evento de éxito.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint07/TC100.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-07/TC-100/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S07-01 | Permisos separados para reassign, rules.manage, reportes, soporte, admins.manage y audit.read; probar usuarios de administración sin cada concesión. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S07-02 | Toda acción sensible con actor, motivo, recurso, antes/después permitido y fecha; excluir contraseñas, cookies y archivos completos del log. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S07-03 | Auditoría obligatoria y cambio de negocio en una misma transacción: si falla el registro, no confirmar el cambio. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S07-04 | Exportaciones privadas con autorización vigente al descargar; neutralizar celdas interpretables como fórmulas y contenido activo en documentos. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S07-05 | Cuentas administrativas solo creadas por responsable; no contraseñas predeterminadas compartidas. Proteger último responsable operativo según política. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S07-06 | Filtrar/limitar consultas de auditoría y reportes; no ofrecer API de edición o borrado ordinario de auditoría. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

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

- [ ] Dashboard, métricas/alertas y filtros coinciden con dataset y fórmulas aprobadas.
- [ ] Reasignación manual valida elegibilidad, permisos, versión y generación y conserva al participante anterior.
- [ ] Clientes y tickets se supervisan; bloqueo/desbloqueo conserva motivo e historial y respeta efectos acordados.
- [ ] Reglas se versionan con validación y uso temporal explícito; pesos históricos permanecen intactos.
- [ ] Excel/PDF coinciden con el reporte y solo los autorizados descargan.
- [ ] Cuentas administrativas y consulta de auditoría funcionan sin escalamiento ni pérdida de trazabilidad.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 7 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-07/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
