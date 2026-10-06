# CANVAS · Sprint 3 — Solicitud y búsqueda de técnicos

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** RF-01 a RF-04; Nueva solicitud en 5 pasos con evidencias y tarifa referencial; Buscar técnicos con filtros y perfil público; Solicitar servicio con técnico precargado; Mis solicitudes (estructura base).

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Permitir que el cliente describa, revise y envíe su necesidad de forma segura y consulte técnicos por especialidad, conservando la distinción entre búsqueda automática y solicitud dirigida.

## 2. Dependencias, límites y condiciones de entrada

Requiere catálogo activo, perfiles, cobertura y tarifas de Sprint 2 y sesiones de Sprint 1. La emisión de ofertas, ranking y cronómetro se conectarán en Sprint 4; este incremento no debe mostrar asignaciones ficticias. Reseñas públicas se conectarán en Sprint 6, manteniendo estados vacíos honestos.

**Decisiones por resolver para las historias afectadas:** P03 cobertura; P05 franja inmediata; P10 máximo de solicitudes activas; P16 duración de citas y relación de tarifas; P17 política de evidencias; P22 estado Registrada/Enviada. No declarar aprobadas decisiones de negocio aún abiertas.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S03-01 | HU-03 | RF-01, RF-02 | Solicitud en cinco pasos |
| HU-S03-02 | HU-04 | RF-03, RF-33 | Evidencias privadas |
| HU-S03-03 | HU-03, HU-05 | RF-01, RF-04, RF-C02 | Tarifa y ubicación |
| HU-S03-04 | HU-29, HU-05 | RF-C06 | Búsqueda y perfil público |
| HU-S03-05 | HU-10, HU-29 | RF-01, RF-02, RF-C06 | Solicitud desde perfil |
| HU-S03-06 | HU-03, HU-12, HU-24 | RF-01, RF-02, RF-33 | Mis solicitudes y envío repetido |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | React: features/requests y búsqueda/perfil en features/matching, formularios reutilizables y API común; separar estado de pasos de datos persistidos. |
| RT-02 | Laravel: ARequests para CreateRequest/SubmitRequest y evidencias; BMatching solo consulta de técnicos en este sprint; no implementar ranking prematuramente. |
| RT-03 | Contratos: POST /requests; POST/DELETE /requests/{id}/attachments; POST /requests/{id}/submission; GET /requests, /requests/{id}; GET /technicians y /technicians/{id}, bajo /api/v1. |
| RT-04 | Tablas: service_requests, request_attachments, request_events y media_files; precargar source=profile y target_technician_id cuando corresponda. Validar relaciones en servidor. |
| RT-05 | Cinco pasos exactos: especialidad; subcategoría; descripción/fotos; ubicación y modalidad/horario; resumen/envío. No añadir un sexto paso para agenda. |
| RT-06 | Persistir envío e identificador idempotente para no duplicar por doble clic o reintento. Conexión futura a PrepareMatching documentada, sin marcar una búsqueda simulada como real. RNF-03/05: probar pasos/teclado y preparar medición de mediana ≤3 min con protocolo P21. |

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
| T-S03-01 | HU-S03-01 | FE: asistente y resumen editable; API: validación, creación y envío separados; datos: request y eventos con propietario de sesión. | TC-027, TC-028 |
| T-S03-02 | HU-S03-02 | FE: selección, vista previa y retirar antes de enviar; API: finalidad/propiedad y tipo; datos: adjunto privado de solicitud. | TC-029, TC-030 |
| T-S03-03 | HU-S03-03 | FE: paso 4 con modalidad y franja; API: tarifa desde fuente autorizada y cobertura; datos: instantánea referencial y zona, no importe final de cobro. | TC-031, TC-032 |
| T-S03-04 | HU-S03-04 | FE: filtros combinables y tarjetas paginadas; API: GET technicians con proyección pública; datos: servicios activos, portafolio y medias de prueba o ausencia de historial. | TC-033, TC-034 |
| T-S03-05 | HU-S03-05 | FE: CTA con técnico precargado y opción clara de revisar; API: validar target_technician_id y servicio ofrecido; datos: source y objetivo persistidos. | TC-035, TC-036 |
| T-S03-06 | HU-S03-06 | FE: listado base/detalle y manejo de reintento; API: filtro por titular e idempotencia; datos: evento único de envío y versión. | TC-037, TC-038 |

**T-S03-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S03-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S03-01 · Solicitud en cinco pasos

Como **cliente**, quiero **registrar y revisar mi solicitud en cinco pasos**, para **explicar la falla sin omitir información**.

**Fuente:** HU-03. **Requerimientos:** RF-01, RF-02.

- **AC-S03-01-01 / TC-027: Dado** un cliente autenticado y catálogo activo, **cuando** completa los cinco pasos, vuelve a corregir la descripción y confirma, **entonces** se guarda la descripción corregida y se envía una sola solicitud con resumen consistente.
- **AC-S03-01-02 / TC-028: Dado** el cliente omite la subcategoría o la descripción requerida, **cuando** intenta enviar el resumen, **entonces** el sistema identifica los campos incompletos y no envía una solicitud inválida.

### HU-S03-02 · Evidencias privadas

Como **cliente**, quiero **adjuntar fotos de la falla**, para **facilitar su evaluación sin exponerlas a terceros**.

**Fuente:** HU-04. **Requerimientos:** RF-03, RF-33.

- **AC-S03-02-01 / TC-029: Dado** una solicitud registrada propia y una imagen válida, **cuando** el cliente adjunta la imagen y consulta el resumen, **entonces** la foto queda vinculada solo a esa solicitud y visible al propietario autorizado.
- **AC-S03-02-02 / TC-030: Dado** un archivo privado perteneciente a otro cliente, **cuando** se intenta vincular su identificador a una solicitud propia, **entonces** la API deniega la asociación y el archivo sigue privado.

### HU-S03-03 · Tarifa y ubicación

Como **cliente**, quiero **conocer la referencia económica y confirmar la zona y horario**, para **enviar una necesidad dentro de la cobertura**.

**Fuente:** HU-03, HU-05. **Requerimientos:** RF-01, RF-04, RF-C02.

- **AC-S03-03-01 / TC-031: Dado** una subcategoría con tarifa referencial de prueba aprobada, **cuando** el cliente selecciona el servicio y revisa el resumen, **entonces** se muestra el monto como referencial y se conserva su procedencia sin tratarlo como pago.
- **AC-S03-03-02 / TC-032: Dado** un distrito que no pertenece al catálogo activo, **cuando** el cliente intenta confirmar una solicitud para ese distrito, **entonces** se informa fuera de cobertura y no se envía la solicitud.

### HU-S03-04 · Búsqueda y perfil público

Como **cliente**, quiero **filtrar técnicos y revisar sus perfiles públicos**, para **comparar especialidad, zona y experiencia**.

**Fuente:** HU-29, HU-05. **Requerimientos:** RF-C06.

- **AC-S03-04-01 / TC-033: Dado** técnicos de prueba con distintos rubros, zonas y calificaciones, **cuando** el cliente combina especialidad, subcategoría, distrito y calificación mínima, **entonces** recibe únicamente técnicos que cumplen todos los filtros y un estado vacío si no hay coincidencias.
- **AC-S03-04-02 / TC-034: Dado** un técnico con bio pública, documentos privados y teléfono de contacto, **cuando** un cliente consulta su perfil antes de asignación, **entonces** recibe bio y portafolio público pero no documentos privados ni WhatsApp.

### HU-S03-05 · Solicitud desde perfil

Como **cliente**, quiero **solicitar a un técnico elegido desde su perfil**, para **mantener mi elección durante el registro**.

**Fuente:** HU-10, HU-29. **Requerimientos:** RF-01, RF-02, RF-C06.

- **AC-S03-05-01 / TC-035: Dado** un cliente abre un técnico que ofrece la subcategoría seleccionada, **cuando** pulsa Solicitar servicio y confirma los cinco pasos, **entonces** la solicitud conserva source=profile y ese técnico objetivo sin generar una asignación automática.
- **AC-S03-05-02 / TC-036: Dado** el técnico precargado no ofrece la subcategoría enviada, **cuando** se intenta enviar esa combinación manipulada, **entonces** la API rechaza la incompatibilidad sin sustituir silenciosamente al técnico.

### HU-S03-06 · Mis solicitudes y envío repetido

Como **cliente**, quiero **ver mis solicitudes sin duplicados**, para **recuperar el estado después de una interrupción**.

**Fuente:** HU-03, HU-12, HU-24. **Requerimientos:** RF-01, RF-02, RF-33.

- **AC-S03-06-01 / TC-037: Dado** una solicitud propia y una clave de idempotencia ya confirmada para su envío, **cuando** se repite el mismo comando tras perder la respuesta, **entonces** se obtiene el mismo resultado y no se duplica solicitud ni evento de envío.
- **AC-S03-06-02 / TC-038: Dado** dos clientes con solicitudes diferentes, **cuando** uno consulta por identificador el detalle de la solicitud del otro, **entonces** se deniega sin descripción privada, dirección ni evidencias.

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-03.feature](bdd/sprint-03.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
# language: es
@sprint_03 @planificado
Característica: Sprint 3 - Solicitud y búsqueda de técnicos
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_027 @HU_S03_01 @automatizar
  Escenario: TC-027 - Recorrido con corrección
    Dado un cliente autenticado y catálogo activo
    Cuando completa los cinco pasos, vuelve a corregir la descripción y confirma
    Entonces se guarda la descripción corregida y se envía una sola solicitud con resumen consistente

  @TC_028 @HU_S03_01 @automatizar
  Escenario: TC-028 - Datos obligatorios ausentes
    Dado el cliente omite la subcategoría o la descripción requerida
    Cuando intenta enviar el resumen
    Entonces el sistema identifica los campos incompletos y no envía una solicitud inválida

  @TC_029 @HU_S03_02 @automatizar
  Escenario: TC-029 - Foto propia vinculada
    Dado una solicitud registrada propia y una imagen válida
    Cuando el cliente adjunta la imagen y consulta el resumen
    Entonces la foto queda vinculada solo a esa solicitud y visible al propietario autorizado

  @TC_030 @HU_S03_02 @automatizar
  Escenario: TC-030 - Referencia de archivo ajeno
    Dado un archivo privado perteneciente a otro cliente
    Cuando se intenta vincular su identificador a una solicitud propia
    Entonces la API deniega la asociación y el archivo sigue privado

  @TC_031 @HU_S03_03 @automatizar
  Escenario: TC-031 - Tarifa referencial visible
    Dado una subcategoría con tarifa referencial de prueba aprobada
    Cuando el cliente selecciona el servicio y revisa el resumen
    Entonces se muestra el monto como referencial y se conserva su procedencia sin tratarlo como pago

  @TC_032 @HU_S03_03 @automatizar
  Escenario: TC-032 - Fuera de cobertura
    Dado un distrito que no pertenece al catálogo activo
    Cuando el cliente intenta confirmar una solicitud para ese distrito
    Entonces se informa fuera de cobertura y no se envía la solicitud

  @TC_033 @HU_S03_04 @automatizar
  Escenario: TC-033 - Filtros combinados
    Dado técnicos de prueba con distintos rubros, zonas y calificaciones
    Cuando el cliente combina especialidad, subcategoría, distrito y calificación mínima
    Entonces recibe únicamente técnicos que cumplen todos los filtros y un estado vacío si no hay coincidencias

  @TC_034 @HU_S03_04 @automatizar
  Escenario: TC-034 - Perfil sin datos privados
    Dado un técnico con bio pública, documentos privados y teléfono de contacto
    Cuando un cliente consulta su perfil antes de asignación
    Entonces recibe bio y portafolio público pero no documentos privados ni WhatsApp

  @TC_035 @HU_S03_05 @automatizar
  Escenario: TC-035 - Origen dirigido preservado
    Dado un cliente abre un técnico que ofrece la subcategoría seleccionada
    Cuando pulsa Solicitar servicio y confirma los cinco pasos
    Entonces la solicitud conserva source=profile y ese técnico objetivo sin generar una asignación automática

  @TC_036 @HU_S03_05 @automatizar
  Escenario: TC-036 - Objetivo incompatible
    Dado el técnico precargado no ofrece la subcategoría enviada
    Cuando se intenta enviar esa combinación manipulada
    Entonces la API rechaza la incompatibilidad sin sustituir silenciosamente al técnico

  @TC_037 @HU_S03_06 @automatizar
  Escenario: TC-037 - Reintento del mismo envío
    Dado una solicitud propia y una clave de idempotencia ya confirmada para su envío
    Cuando se repite el mismo comando tras perder la respuesta
    Entonces se obtiene el mismo resultado y no se duplica solicitud ni evento de envío

  @TC_038 @HU_S03_06 @automatizar
  Escenario: TC-038 - Solicitud ajena
    Dado dos clientes con solicitudes diferentes
    Cuando uno consulta por identificador el detalle de la solicitud del otro
    Entonces se deniega sin descripción privada, dirección ni evidencias
```

## 8. Casos de prueba previstos (12)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-027 · Recorrido con corrección

**Traza:** RF-01, RF-02 → HU-03 → HU-S03-01 → AC-S03-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente autenticado y catálogo activo.
- **Pasos previstos:** preparar la precondición en el entorno aislado; completa los cinco pasos, vuelve a corregir la descripción y confirma; consultar estado persistido y efectos observables.
- **Resultado esperado:** se guarda la descripción corregida y se envía una sola solicitud con resumen consistente.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-03/tc-027.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-027/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-028 · Datos obligatorios ausentes

**Traza:** RF-01, RF-02 → HU-03 → HU-S03-01 → AC-S03-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** el cliente omite la subcategoría o la descripción requerida.
- **Pasos previstos:** preparar la precondición en el entorno aislado; intenta enviar el resumen; consultar estado persistido y efectos observables.
- **Resultado esperado:** el sistema identifica los campos incompletos y no envía una solicitud inválida.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-03/tc-028.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-028/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-029 · Foto propia vinculada

**Traza:** RF-03, RF-33 → HU-04 → HU-S03-02 → AC-S03-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud registrada propia y una imagen válida.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el cliente adjunta la imagen y consulta el resumen; consultar estado persistido y efectos observables.
- **Resultado esperado:** la foto queda vinculada solo a esa solicitud y visible al propietario autorizado.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC029.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-029/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-030 · Referencia de archivo ajeno

**Traza:** RF-03, RF-33 → HU-04 → HU-S03-02 → AC-S03-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un archivo privado perteneciente a otro cliente.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta vincular su identificador a una solicitud propia; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API deniega la asociación y el archivo sigue privado.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC030.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-030/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-031 · Tarifa referencial visible

**Traza:** RF-01, RF-04, RF-C02 → HU-03, HU-05 → HU-S03-03 → AC-S03-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una subcategoría con tarifa referencial de prueba aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el cliente selecciona el servicio y revisa el resumen; consultar estado persistido y efectos observables.
- **Resultado esperado:** se muestra el monto como referencial y se conserva su procedencia sin tratarlo como pago.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC031.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-031/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-032 · Fuera de cobertura

**Traza:** RF-01, RF-04, RF-C02 → HU-03, HU-05 → HU-S03-03 → AC-S03-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un distrito que no pertenece al catálogo activo.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el cliente intenta confirmar una solicitud para ese distrito; consultar estado persistido y efectos observables.
- **Resultado esperado:** se informa fuera de cobertura y no se envía la solicitud.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC032.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-032/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-033 · Filtros combinados

**Traza:** RF-C06 → HU-29, HU-05 → HU-S03-04 → AC-S03-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** técnicos de prueba con distintos rubros, zonas y calificaciones.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el cliente combina especialidad, subcategoría, distrito y calificación mínima; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe únicamente técnicos que cumplen todos los filtros y un estado vacío si no hay coincidencias.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC033.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-033/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-034 · Perfil sin datos privados

**Traza:** RF-C06 → HU-29, HU-05 → HU-S03-04 → AC-S03-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico con bio pública, documentos privados y teléfono de contacto.
- **Pasos previstos:** preparar la precondición en el entorno aislado; un cliente consulta su perfil antes de asignación; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe bio y portafolio público pero no documentos privados ni WhatsApp.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC034.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-034/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-035 · Origen dirigido preservado

**Traza:** RF-01, RF-02, RF-C06 → HU-10, HU-29 → HU-S03-05 → AC-S03-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente abre un técnico que ofrece la subcategoría seleccionada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; pulsa Solicitar servicio y confirma los cinco pasos; consultar estado persistido y efectos observables.
- **Resultado esperado:** la solicitud conserva source=profile y ese técnico objetivo sin generar una asignación automática.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC035.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-035/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-036 · Objetivo incompatible

**Traza:** RF-01, RF-02, RF-C06 → HU-10, HU-29 → HU-S03-05 → AC-S03-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** el técnico precargado no ofrece la subcategoría enviada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta enviar esa combinación manipulada; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API rechaza la incompatibilidad sin sustituir silenciosamente al técnico.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC036.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-036/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-037 · Reintento del mismo envío

**Traza:** RF-01, RF-02, RF-33 → HU-03, HU-12, HU-24 → HU-S03-06 → AC-S03-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud propia y una clave de idempotencia ya confirmada para su envío.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se repite el mismo comando tras perder la respuesta; consultar estado persistido y efectos observables.
- **Resultado esperado:** se obtiene el mismo resultado y no se duplica solicitud ni evento de envío.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC037.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-037/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-038 · Solicitud ajena

**Traza:** RF-01, RF-02, RF-33 → HU-03, HU-12, HU-24 → HU-S03-06 → AC-S03-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** dos clientes con solicitudes diferentes.
- **Pasos previstos:** preparar la precondición en el entorno aislado; uno consulta por identificador el detalle de la solicitud del otro; consultar estado persistido y efectos observables.
- **Resultado esperado:** se deniega sin descripción privada, dirección ni evidencias.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint03/TC038.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-03/TC-038/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S03-01 | Propiedad de solicitud y archivos comprobada en cada acceso, no solo en el listado. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S03-02 | No serializar dirección exacta, teléfono ni documentos en búsquedas/perfiles públicos. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S03-03 | Validar subcategoría activa, coherencia con rubro, distrito permitido y técnico objetivo en backend. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S03-04 | Límites de archivos, nombres generados y almacenamiento privado; sin aceptar rutas arbitrarias ni vínculos a archivos de otra cuenta. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S03-05 | Consultas parametrizadas, filtros permitidos y paginación; idempotencia ligada al usuario, operación y contenido. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

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

- [ ] Flujo de cinco pasos permite volver sin perder datos y revisar antes del envío.
- [ ] Evidencias y tarifa referencial aparecen en el resumen y quedan asociadas al titular.
- [ ] Listado y detalle muestran únicamente solicitudes propias; errores/carga/vacío son utilizables.
- [ ] Búsqueda por rubro, subcategoría, zona y calificación mínima; sin reseñas se muestra ausencia de datos.
- [ ] Solicitud dirigida conserva el técnico elegido para Sprint 4; el flujo de matching aún no se declara terminado.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 3 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-03/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
