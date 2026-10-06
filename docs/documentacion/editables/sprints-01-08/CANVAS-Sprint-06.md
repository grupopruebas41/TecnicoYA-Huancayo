# CANVAS · Sprint 6 — Calificación, historial y apelaciones

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** RF-23 a RF-27; calificación en 48 h y edición, cierre sin calificar, reseñas públicas, historial, calificaciones recibidas, apelación y resolución administrativa, criterios de matching visibles.

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Cerrar el ciclo de cada participación con una evaluación versionada y mecanismos de revisión, ofreciendo un historial confiable y criterios transparentes de asignación.

## 2. Dependencias, límites y condiciones de entrada

Depende de reportes/fechas individuales del Sprint 5 y matching versionado del Sprint 4. La pantalla administrativa de apelaciones se entrega aquí; no se retrasa hasta completar el panel en Sprint 7. Promedios válidos alimentan las nuevas evaluaciones, sin recalcular rankings históricos.

**Decisiones por resolver para las historias afectadas:** P07 plazo de apelación, calendario y efectos de anulación; P13 cierre global con dos técnicos; P17 moderación/respuestas; P23 anclaje de edición. Las 48 h desde primera calificación sin reinicio son propuesta pendiente de ratificación.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S06-01 | HU-16 | RF-23 | Calificar mi atención |
| HU-S06-02 | HU-16 | RF-23 | Editar conservando versiones |
| HU-S06-03 | HU-15 | RF-24 | Cerrar sin calificar |
| HU-S06-04 | HU-16, HU-18 | RF-23, RF-25 | Reseñas y respuestas públicas |
| HU-S06-05 | HU-17 | RF-26 | Apelar una calificación |
| HU-S06-06 | HU-17, HU-28 | RF-26, RF-33 | Resolución motivada |
| HU-S06-07 | HU-18, HU-19 | RF-25, RF-27 | Historial y criterios transparentes |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | ERatings y React features/ratings; separar envío, edición, respuesta, apelación y resolución. Consulta de historial reutiliza solicitudes/participaciones sin duplicar registros. |
| RT-02 | Tablas: ratings, rating_versions, rating_replies, rating_appeals, appeal_evidence, rating_resolutions; participations.rating_status y deadlines individuales. |
| RT-03 | Aplicar contratos del módulo E del CANVAS técnico para calificar, editar, apelar y resolver. Exigir autor/participación/versión; no convertir cambios de calificación en edición libre de filas. |
| RT-04 | CloseUnratedParticipation es idempotente. Ediciones validan el reloj en cada petición aunque no exista un job que cierre la edición; la UI no decide vigencia. |
| RT-05 | Resolución sobre versión vigente con control de concurrencia; conservar versión apelada, revisada y resultante. RefreshRatingSummary recalcula desde datos válidos tras commit. |
| RT-06 | GET /technicians/me/matching-criteria muestra factores/pesos y tratamiento de ausencia de datos, sin exponer datos de competidores. RNF-12: cobertura ≥70% del alcance acordado de calificación; probar fronteras y jobs repetidos. |

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
| T-S06-01 | HU-S06-01 | FE: aviso/formulario; API: dueño y ventana; datos: calificación única y primera versión. | TC-073, TC-074 |
| T-S06-02 | HU-S06-02 | FE: editar con límite visible; dominio: editar con versión/Clock; datos: rating_versions y fecha inicial inmutable. | TC-075, TC-076 |
| T-S06-03 | HU-S06-03 | Aplicación: job CloseUnratedParticipation; FE: estado final; datos: rating_status independiente por participación. | TC-077, TC-078 |
| T-S06-04 | HU-S06-04 | FE: reseñas/promedio/respuesta; API: técnico afectado y texto seguro; datos: ratings válidas y rating_replies según política. | TC-079, TC-080 |
| T-S06-05 | HU-S06-05 | FE: motivo/evidencia/estado; API: titular, plazo y política de duplicados; datos: rating_appeals y versión cuestionada. | TC-081, TC-082 |
| T-S06-06 | HU-S06-06 | FE: comparar versión/revisar/decidir; aplicación: transacción, auditoría y recálculo; datos: rating_resolutions y versiones. | TC-083, TC-084 |
| T-S06-07 | HU-S06-07 | FE: filtros por estado/fecha y pantalla criterios; API: proyecciones por rol; datos: joins de historial y versión de reglas aplicada. | TC-085, TC-086 |

**T-S06-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S06-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S06-01 · Calificar mi atención

Como **cliente**, quiero **calificar de 1 a 5 con comentario**, para **compartir mi experiencia tras la atención**.

**Fuente:** HU-16. **Requerimientos:** RF-23.

- **AC-S06-01-01 / TC-073: Dado** mi participación finalizó hace 24 horas y no tiene calificación, **cuando** envío puntaje 4 y comentario válido, **entonces** se registra una calificación con su primera versión y se marca la participación como calificada.
- **AC-S06-01-02 / TC-074: Dado** una participación propia dentro de la ventana, **cuando** envío puntaje 6, **entonces** la API rechaza el valor sin crear calificación.

### HU-S06-02 · Editar conservando versiones

Como **cliente autor**, quiero **corregir mi calificación dentro del plazo permitido**, para **ajustar mi opinión manteniendo el historial**.

**Fuente:** HU-16. **Requerimientos:** RF-23.

- **AC-S06-02-01 / TC-075: Dado** una calificación creada hace 12 horas y política P23 ratificada, **cuando** su autor edita nota y comentario, **entonces** se agrega una versión y el límite sigue a 48 horas de la primera calificación. **Condicionado a P23.**
- **AC-S06-02-02 / TC-076: Dado** una calificación cuya ventana de edición ya terminó, **cuando** su autor intenta editar, **entonces** se rechaza sin nueva versión ni cambio del promedio.

### HU-S06-03 · Cerrar sin calificar

Como **cliente**, quiero **ver el cierre cuando no califico a tiempo**, para **tener un estado final claro**.

**Fuente:** HU-15. **Requerimientos:** RF-24.

- **AC-S06-03-01 / TC-077: Dado** una participación finalizada sin nota que alcanzó su plazo de 48 horas, **cuando** se ejecuta dos veces el job de cierre, **entonces** queda Sin calificar una sola vez sin crear una nota automática ni afectar otra participación. **Condicionado a P12, P13.**
- **AC-S06-03-02 / TC-078: Dado** una participación calificada válidamente antes del vencimiento, **cuando** se ejecuta después un job atrasado de cierre sin calificar, **entonces** se conserva la calificación y no cambia a Sin calificar.

### HU-S06-04 · Reseñas y respuestas públicas

Como **técnico**, quiero **ver mis reseñas y responder de forma identificada**, para **dar contexto a mis futuros clientes**.

**Fuente:** HU-16, HU-18. **Requerimientos:** RF-23, RF-25.

- **AC-S06-04-01 / TC-079: Dado** un técnico tiene dos calificaciones activas de 4 y 5 y una anulada de 1, **cuando** se consulta el promedio bajo política aprobada de excluir anuladas, **entonces** se muestra 4.5 calculado solo de las dos notas activas. **Condicionado a P07.**
- **AC-S06-04-02 / TC-080: Dado** una respuesta de reseña contiene etiquetas de script, **cuando** se muestra la respuesta en el perfil público, **entonces** el contenido no se ejecuta como código en el navegador.

### HU-S06-05 · Apelar una calificación

Como **técnico afectado**, quiero **presentar una apelación con motivo y evidencia**, para **solicitar revisión sin cambiar la nota por mi cuenta**.

**Fuente:** HU-17. **Requerimientos:** RF-26.

- **AC-S06-05-01 / TC-081: Dado** una reseña propia dentro del plazo de apelación ratificado, **cuando** el técnico presenta motivo y evidencia permitidos, **entonces** se crea una apelación vinculada a la versión de la reseña sin modificar su nota. **Condicionado a P07, P17.**
- **AC-S06-05-02 / TC-082: Dado** un técnico intenta apelar la reseña de otro prestador, **cuando** envía el identificador de esa calificación, **entonces** la API deniega y no crea apelación.

### HU-S06-06 · Resolución motivada

Como **administrador resolutor**, quiero **mantener, ajustar o anular una calificación con motivo**, para **resolver disputas dejando evidencia**.

**Fuente:** HU-17, HU-28. **Requerimientos:** RF-26, RF-33.

- **AC-S06-06-01 / TC-083: Dado** una apelación abierta y la versión vigente revisada por un administrador autorizado, **cuando** resuelve mantener, ajustar o anular con motivo obligatorio, **entonces** se conserva la decisión y las versiones correspondientes con auditoría y se actualizan agregados según política aprobada. **Condicionado a P07.**
- **AC-S06-06-02 / TC-084: Dado** el administrador cargó una versión que el cliente editó después, **cuando** intenta resolver usando la versión anterior, **entonces** recibe conflicto y debe revisar la versión vigente sin sobrescribirla.

### HU-S06-07 · Historial y criterios transparentes

Como **cliente o técnico**, quiero **consultar mi historial y los criterios que me corresponden**, para **comprender los servicios y el proceso de selección**.

**Fuente:** HU-18, HU-19. **Requerimientos:** RF-25, RF-27.

- **AC-S06-07-01 / TC-085: Dado** un usuario con participaciones de distintos estados y periodos, **cuando** consulta su historial con filtros, **entonces** recibe únicamente sus registros coincidentes y sus calificaciones vinculadas.
- **AC-S06-07-02 / TC-086: Dado** un técnico autenticado consulta criterios de matching, **cuando** se devuelve la explicación, **entonces** ve pesos, elegibilidad y tratamiento sin historial sin direcciones, documentos ni puntajes privados de otros técnicos.

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-06.feature](bdd/sprint-06.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
# language: es
@sprint_06 @planificado
Característica: Sprint 6 - Calificación, historial y apelaciones
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_073 @HU_S06_01 @automatizar
  Escenario: TC-073 - Envío en ventana válida
    Dado mi participación finalizó hace 24 horas y no tiene calificación
    Cuando envío puntaje 4 y comentario válido
    Entonces se registra una calificación con su primera versión y se marca la participación como calificada

  @TC_074 @HU_S06_01 @automatizar
  Escenario: TC-074 - Nota fuera de rango
    Dado una participación propia dentro de la ventana
    Cuando envío puntaje 6
    Entonces la API rechaza el valor sin crear calificación

  @TC_075 @HU_S06_02 @automatizar @pendiente_P23
  Escenario: TC-075 - Edición no renueva plazo
    Dado una calificación creada hace 12 horas y política P23 ratificada
    Cuando su autor edita nota y comentario
    Entonces se agrega una versión y el límite sigue a 48 horas de la primera calificación

  @TC_076 @HU_S06_02 @automatizar
  Escenario: TC-076 - Edición vencida
    Dado una calificación cuya ventana de edición ya terminó
    Cuando su autor intenta editar
    Entonces se rechaza sin nueva versión ni cambio del promedio

  @TC_077 @HU_S06_03 @automatizar @pendiente_P12 @pendiente_P13
  Escenario: TC-077 - Vencimiento individual
    Dado una participación finalizada sin nota que alcanzó su plazo de 48 horas
    Cuando se ejecuta dos veces el job de cierre
    Entonces queda Sin calificar una sola vez sin crear una nota automática ni afectar otra participación

  @TC_078 @HU_S06_03 @automatizar
  Escenario: TC-078 - Ya fue calificada
    Dado una participación calificada válidamente antes del vencimiento
    Cuando se ejecuta después un job atrasado de cierre sin calificar
    Entonces se conserva la calificación y no cambia a Sin calificar

  @TC_079 @HU_S06_04 @automatizar @pendiente_P07
  Escenario: TC-079 - Promedio real
    Dado un técnico tiene dos calificaciones activas de 4 y 5 y una anulada de 1
    Cuando se consulta el promedio bajo política aprobada de excluir anuladas
    Entonces se muestra 4.5 calculado solo de las dos notas activas

  @TC_080 @HU_S06_04 @automatizar
  Escenario: TC-080 - Texto no ejecutable
    Dado una respuesta de reseña contiene etiquetas de script
    Cuando se muestra la respuesta en el perfil público
    Entonces el contenido no se ejecuta como código en el navegador

  @TC_081 @HU_S06_05 @automatizar @pendiente_P07 @pendiente_P17
  Escenario: TC-081 - Apelación admitida
    Dado una reseña propia dentro del plazo de apelación ratificado
    Cuando el técnico presenta motivo y evidencia permitidos
    Entonces se crea una apelación vinculada a la versión de la reseña sin modificar su nota

  @TC_082 @HU_S06_05 @automatizar
  Escenario: TC-082 - Apelación ajena
    Dado un técnico intenta apelar la reseña de otro prestador
    Cuando envía el identificador de esa calificación
    Entonces la API deniega y no crea apelación

  @TC_083 @HU_S06_06 @automatizar @pendiente_P07
  Escenario: TC-083 - Resolución válida
    Dado una apelación abierta y la versión vigente revisada por un administrador autorizado
    Cuando resuelve mantener, ajustar o anular con motivo obligatorio
    Entonces se conserva la decisión y las versiones correspondientes con auditoría y se actualizan agregados según política aprobada

  @TC_084 @HU_S06_06 @automatizar
  Escenario: TC-084 - Reseña cambió al resolver
    Dado el administrador cargó una versión que el cliente editó después
    Cuando intenta resolver usando la versión anterior
    Entonces recibe conflicto y debe revisar la versión vigente sin sobrescribirla

  @TC_085 @HU_S06_07 @automatizar
  Escenario: TC-085 - Historial propio filtrado
    Dado un usuario con participaciones de distintos estados y periodos
    Cuando consulta su historial con filtros
    Entonces recibe únicamente sus registros coincidentes y sus calificaciones vinculadas

  @TC_086 @HU_S06_07 @automatizar
  Escenario: TC-086 - Criterios sin datos de competidores
    Dado un técnico autenticado consulta criterios de matching
    Cuando se devuelve la explicación
    Entonces ve pesos, elegibilidad y tratamiento sin historial sin direcciones, documentos ni puntajes privados de otros técnicos
```

## 8. Casos de prueba previstos (14)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-073 · Envío en ventana válida

**Traza:** RF-23 → HU-16 → HU-S06-01 → AC-S06-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** mi participación finalizó hace 24 horas y no tiene calificación.
- **Pasos previstos:** preparar la precondición en el entorno aislado; envío puntaje 4 y comentario válido; consultar estado persistido y efectos observables.
- **Resultado esperado:** se registra una calificación con su primera versión y se marca la participación como calificada.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC073.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-073/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-074 · Nota fuera de rango

**Traza:** RF-23 → HU-16 → HU-S06-01 → AC-S06-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una participación propia dentro de la ventana.
- **Pasos previstos:** preparar la precondición en el entorno aislado; envío puntaje 6; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API rechaza el valor sin crear calificación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC074.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-074/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-075 · Edición no renueva plazo

**Traza:** RF-23 → HU-16 → HU-S06-02 → AC-S06-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una calificación creada hace 12 horas y política P23 ratificada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; su autor edita nota y comentario; consultar estado persistido y efectos observables.
- **Resultado esperado:** se agrega una versión y el límite sigue a 48 horas de la primera calificación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC075.php (destino propuesto)`.
- **Dependencia de decisión:** P23.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-075/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-076 · Edición vencida

**Traza:** RF-23 → HU-16 → HU-S06-02 → AC-S06-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una calificación cuya ventana de edición ya terminó.
- **Pasos previstos:** preparar la precondición en el entorno aislado; su autor intenta editar; consultar estado persistido y efectos observables.
- **Resultado esperado:** se rechaza sin nueva versión ni cambio del promedio.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC076.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-076/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-077 · Vencimiento individual

**Traza:** RF-24 → HU-15 → HU-S06-03 → AC-S06-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una participación finalizada sin nota que alcanzó su plazo de 48 horas.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta dos veces el job de cierre; consultar estado persistido y efectos observables.
- **Resultado esperado:** queda Sin calificar una sola vez sin crear una nota automática ni afectar otra participación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC077.php (destino propuesto)`.
- **Dependencia de decisión:** P12, P13.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-077/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-078 · Ya fue calificada

**Traza:** RF-24 → HU-15 → HU-S06-03 → AC-S06-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una participación calificada válidamente antes del vencimiento.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta después un job atrasado de cierre sin calificar; consultar estado persistido y efectos observables.
- **Resultado esperado:** se conserva la calificación y no cambia a Sin calificar.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC078.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-078/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-079 · Promedio real

**Traza:** RF-23, RF-25 → HU-16, HU-18 → HU-S06-04 → AC-S06-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico tiene dos calificaciones activas de 4 y 5 y una anulada de 1.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se consulta el promedio bajo política aprobada de excluir anuladas; consultar estado persistido y efectos observables.
- **Resultado esperado:** se muestra 4.5 calculado solo de las dos notas activas.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC079.php (destino propuesto)`.
- **Dependencia de decisión:** P07.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-079/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-080 · Texto no ejecutable

**Traza:** RF-23, RF-25 → HU-16, HU-18 → HU-S06-04 → AC-S06-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una respuesta de reseña contiene etiquetas de script.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se muestra la respuesta en el perfil público; consultar estado persistido y efectos observables.
- **Resultado esperado:** el contenido no se ejecuta como código en el navegador.
- **Nivel/herramienta:** E2E / Cypress.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-06/tc-080.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-080/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-081 · Apelación admitida

**Traza:** RF-26 → HU-17 → HU-S06-05 → AC-S06-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una reseña propia dentro del plazo de apelación ratificado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el técnico presenta motivo y evidencia permitidos; consultar estado persistido y efectos observables.
- **Resultado esperado:** se crea una apelación vinculada a la versión de la reseña sin modificar su nota.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC081.php (destino propuesto)`.
- **Dependencia de decisión:** P07, P17.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-081/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-082 · Apelación ajena

**Traza:** RF-26 → HU-17 → HU-S06-05 → AC-S06-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico intenta apelar la reseña de otro prestador.
- **Pasos previstos:** preparar la precondición en el entorno aislado; envía el identificador de esa calificación; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API deniega y no crea apelación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC082.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-082/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-083 · Resolución válida

**Traza:** RF-26, RF-33 → HU-17, HU-28 → HU-S06-06 → AC-S06-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una apelación abierta y la versión vigente revisada por un administrador autorizado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; resuelve mantener, ajustar o anular con motivo obligatorio; consultar estado persistido y efectos observables.
- **Resultado esperado:** se conserva la decisión y las versiones correspondientes con auditoría y se actualizan agregados según política aprobada.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC083.php (destino propuesto)`.
- **Dependencia de decisión:** P07.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-083/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-084 · Reseña cambió al resolver

**Traza:** RF-26, RF-33 → HU-17, HU-28 → HU-S06-06 → AC-S06-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** el administrador cargó una versión que el cliente editó después.
- **Pasos previstos:** preparar la precondición en el entorno aislado; intenta resolver usando la versión anterior; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe conflicto y debe revisar la versión vigente sin sobrescribirla.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC084.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-084/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-085 · Historial propio filtrado

**Traza:** RF-25, RF-27 → HU-18, HU-19 → HU-S06-07 → AC-S06-07-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un usuario con participaciones de distintos estados y periodos.
- **Pasos previstos:** preparar la precondición en el entorno aislado; consulta su historial con filtros; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe únicamente sus registros coincidentes y sus calificaciones vinculadas.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC085.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-085/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-086 · Criterios sin datos de competidores

**Traza:** RF-25, RF-27 → HU-18, HU-19 → HU-S06-07 → AC-S06-07-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico autenticado consulta criterios de matching.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se devuelve la explicación; consultar estado persistido y efectos observables.
- **Resultado esperado:** ve pesos, elegibilidad y tratamiento sin historial sin direcciones, documentos ni puntajes privados de otros técnicos.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint06/TC086.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-06/TC-086/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S06-01 | Solo cliente autor de la participación puede calificarla; solo técnico afectado puede responder/apelar. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S06-02 | Puntaje entero 1..5, contenido tratado como texto y adjuntos privados; controles anti-XSS en reseñas y respuestas. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S06-03 | Administrador resolutor necesita permiso, motivo y auditoría atómica; una apelación no modifica sola la nota. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S06-04 | Rechazar decisiones sobre versiones obsoletas; preservar evidencia y acceso restringido al historial de moderación. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S06-05 | No publicar datos privados en historial público ni transformar el factor neutro del matching en una calificación inventada. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

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

- [ ] Envío y edición respetan sus ventanas distintas con reloj del servidor y decisiones ratificadas.
- [ ] Calificación única por participación, versiones conservadas y cierre Sin calificar idempotente.
- [ ] Reseñas, respuestas y promedios corresponden solo a datos válidos y políticas de moderación acordadas.
- [ ] Apelaciones se resuelven con motivo, versión vigente y auditoría; conflictos obligan a recargar.
- [ ] Historial y criterios de matching son accesibles por rol y propiedad sin modificar evaluaciones históricas.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 6 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-06/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
