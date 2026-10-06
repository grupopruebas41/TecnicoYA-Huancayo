# CANVAS · Sprint 1 — Base técnica, autenticación, roles y catálogo

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** RF-28, RF-33; registro e inicio de sesión por rol (cliente, técnico, administrador), RBAC, perfiles básicos, estado de verificación del técnico, catálogo semilla de 3 especialidades y ~30 subcategorías, conexión React–Laravel–MySQL y rutas protegidas.

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Entregar acceso por identidad y permisos reales sobre la API y MySQL, con perfiles mínimos y catálogo inicial reproducible, para que los siguientes sprints trabajen sobre una base común.

## 2. Dependencias, límites y condiciones de entrada

La Iteración 0 debe haber dejado instalación, estructura y entorno local operativos. Revisar las diferencias del código histórico antes de migrar; no borrar datos. El administrador inicial se aprovisiona por mecanismo restringido; su gestión completa corresponde al Sprint 7.

**Decisiones por resolver para las historias afectadas:** P20: cuenta con un rol o varios; propuesta actual de un rol. P22: representación de revisión rechazada. P03/P16: catálogo de distritos y referencias económicas; no asignar valores de mercado inventados. Versiones compatibles y responsable del backlog P04 aún por registrar.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S01-01 | HU-01 | RF-28 | Registro de cliente |
| HU-S01-02 | HU-01, HU-02 | RF-28, RF-33 | Alta de técnico pendiente |
| HU-S01-03 | HU-01 | RF-28 | Sesión y cierre por rol |
| HU-S01-04 | HU-24, HU-28 | RF-33 | Autorización efectiva |
| HU-S01-05 | HU-24, HU-29 | RF-28, RF-33, RF-C06 | Perfil básico propio |
| HU-S01-06 | HU-05, HU-25 | RF-C01, RF-28, RF-33 | Catálogo inicial y conexión |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | Mantener frontend/web y backend/api. Mapear el código existente a src/features/administration y app/Modules/FAdministration; las carpetas de destino son propuestas del diseño, no carpetas ya implementadas. |
| RT-02 | Conectar React al cliente HTTP común y Laravel a MySQL con migraciones/seeders versionados; verificar FK, unicidad de correo y relaciones de perfil con una BD de pruebas aislada. |
| RT-03 | Aplicar la sesión SPA propuesta: cookie de sesión HttpOnly, CSRF, rotación al autenticar y cierre invalidante. No guardar tokens de sesión en localStorage; React consulta /me para rol y permisos. |
| RT-04 | Contratos existentes del diseño: /sanctum/csrf-cookie, /api/v1/auth/register, /auth/login, /auth/logout, /me y /catalog/specialties\|subcategories. Salvo CSRF, las rutas abreviadas llevan /api/v1. |
| RT-05 | Tablas foco: roles, permissions, users, role_permissions, user_permissions, client_profiles, technician_profiles, specialties, subcategories y sesiones. Inicializar audit_entries para acciones sensibles sin adelantar su panel del Sprint 7. |
| RT-06 | Semilla idempotente de tres rubros y 30 subcategorías de referencia (11/9/10); RNF-08/09/11/14. Probar build React, conexión, migraciones y permisos en CI; datos sintéticos y secretos fuera del repositorio. |

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
| T-S01-01 | HU-S01-01 | FE: formulario con errores por campo; API: RegisterClient con validación y transacción; datos: users/client_profiles y correo único. | TC-001, TC-002 |
| T-S01-02 | HU-S01-02 | FE: alta técnica y estado pendiente; API: RegisterTechnician; datos: perfil técnico con estado y verificación separados. | TC-003, TC-004 |
| T-S01-03 | HU-S01-03 | FE: cliente HTTP, rutas y /me; API: login/logout con sesión y CSRF; datos: sesiones del servidor, sin credenciales persistidas en React. | TC-005, TC-006 |
| T-S01-04 | HU-S01-04 | FE: guardas de rutas y limpieza de caché al cambiar cuenta; API: Policies/permissions; datos: concesiones mínimas y auditoría de operaciones privilegiadas. | TC-007, TC-008 |
| T-S01-05 | HU-S01-05 | FE: formulario Mi perfil; API: GET/PATCH /me con campos permitidos y expected_version; datos: actualización sin perder relación de perfil. | TC-009, TC-010 |
| T-S01-06 | HU-S01-06 | FE: consumo del catálogo y estados carga/error/vacío; API: lectura pública solo de activos; datos: semilla única 3/30 y migraciones verificadas. | TC-011, TC-012 |

**T-S01-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S01-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S01-01 · Registro de cliente

Como **cliente**, quiero **crear mi cuenta**, para **acceder a mis propios servicios**.

**Fuente:** HU-01. **Requerimientos:** RF-28.

- **AC-S01-01-01 / TC-001: Dado** un correo sintético no registrado y datos de cliente válidos, **cuando** el visitante confirma el formulario de registro, **entonces** se crea exactamente un usuario cliente y su perfil, sin permisos administrativos.
- **AC-S01-01-02 / TC-002: Dado** una cuenta ya registrada con el mismo correo normalizado, **cuando** se intenta registrar otra cuenta con ese correo, **entonces** la API rechaza el duplicado y no crea usuario ni perfil adicional.

### HU-S01-02 · Alta de técnico pendiente

Como **técnico**, quiero **registrarme y completar mis datos iniciales**, para **solicitar posteriormente mi verificación**.

**Fuente:** HU-01, HU-02. **Requerimientos:** RF-28, RF-33.

- **AC-S01-02-01 / TC-003: Dado** datos de un técnico sin cuenta previa, **cuando** se completa el registro técnico, **entonces** el perfil queda Pendiente de verificación y permite editar únicamente sus datos básicos.
- **AC-S01-02-02 / TC-004: Dado** una cuenta técnica pendiente, **cuando** envía verificación aprobada, estado activo o permisos en la edición de perfil, **entonces** se rechazan los campos privilegiados y el estado persistido no cambia.

### HU-S01-03 · Sesión y cierre por rol

Como **usuario de cualquiera de los tres roles**, quiero **iniciar y cerrar sesión**, para **acceder a mi panel con una identidad comprobada**.

**Fuente:** HU-01. **Requerimientos:** RF-28.

- **AC-S01-03-01 / TC-005: Dado** una cuenta activa de cliente, técnico o administrador aprovisionado, **cuando** inicia sesión con credenciales válidas y consulta /me, **entonces** recibe su identidad y permisos y se abre el panel correspondiente al rol.
- **AC-S01-03-02 / TC-006: Dado** una sesión válida abierta, **cuando** el usuario cierra sesión y reutiliza su cookie para consultar /me, **entonces** la sesión anterior es inválida y la API responde 401.

### HU-S01-04 · Autorización efectiva

Como **administrador responsable**, quiero **restringir cada operación a su rol y propietario**, para **evitar acceso o cambios no autorizados**.

**Fuente:** HU-24, HU-28. **Requerimientos:** RF-33.

- **AC-S01-04-01 / TC-007: Dado** un usuario cliente autenticado, **cuando** consulta directamente una ruta administrativa protegida, **entonces** recibe 403 sin datos ni cambios administrativos.
- **AC-S01-04-02 / TC-008: Dado** un visitante sin sesión privilegiada, **cuando** solicita registro enviando account_type=admin, **entonces** el alta es rechazada y no se crea ninguna cuenta administrativa.

### HU-S01-05 · Perfil básico propio

Como **usuario**, quiero **consultar y editar mis datos básicos**, para **mantener mi información sin alterar mi rol**.

**Fuente:** HU-24, HU-29. **Requerimientos:** RF-28, RF-33, RF-C06.

- **AC-S01-05-01 / TC-009: Dado** una cuenta con versión de perfil vigente, **cuando** actualiza nombre y teléfono permitidos, **entonces** se guardan esos campos y se incrementa la versión sin cambiar permisos.
- **AC-S01-05-02 / TC-010: Dado** el perfil cambió después de cargar el formulario, **cuando** se envía una edición con expected_version anterior, **entonces** la API informa conflicto 409 y conserva la edición más reciente.

### HU-S01-06 · Catálogo inicial y conexión

Como **usuario**, quiero **consultar el catálogo inicial desde la API**, para **usar las mismas especialidades en todos los módulos**.

**Fuente:** HU-05, HU-25. **Requerimientos:** RF-C01, RF-28, RF-33.

- **AC-S01-06-01 / TC-011: Dado** una base MySQL de pruebas migrada, **cuando** se ejecuta dos veces la semilla inicial, **entonces** existen tres especialidades y treinta subcategorías sin duplicados y con relaciones válidas.
- **AC-S01-06-02 / TC-012: Dado** el entorno React–Laravel–MySQL está disponible, **cuando** el navegador consulta especialidades y subcategorías, **entonces** muestra el catálogo recibido por API y trata un fallo de red sin sustituirlo por datos ficticios silenciosos.

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-01.feature](bdd/sprint-01.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
# language: es
@sprint_01 @planificado
Característica: Sprint 1 - Base técnica, autenticación, roles y catálogo
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_001 @HU_S01_01 @automatizar
  Escenario: TC-001 - Alta válida
    Dado un correo sintético no registrado y datos de cliente válidos
    Cuando el visitante confirma el formulario de registro
    Entonces se crea exactamente un usuario cliente y su perfil, sin permisos administrativos

  @TC_002 @HU_S01_01 @automatizar
  Escenario: TC-002 - Correo duplicado
    Dado una cuenta ya registrada con el mismo correo normalizado
    Cuando se intenta registrar otra cuenta con ese correo
    Entonces la API rechaza el duplicado y no crea usuario ni perfil adicional

  @TC_003 @HU_S01_02 @automatizar
  Escenario: TC-003 - Técnico nuevo
    Dado datos de un técnico sin cuenta previa
    Cuando se completa el registro técnico
    Entonces el perfil queda Pendiente de verificación y permite editar únicamente sus datos básicos

  @TC_004 @HU_S01_02 @automatizar
  Escenario: TC-004 - Autoactivación rechazada
    Dado una cuenta técnica pendiente
    Cuando envía verificación aprobada, estado activo o permisos en la edición de perfil
    Entonces se rechazan los campos privilegiados y el estado persistido no cambia

  @TC_005 @HU_S01_03 @automatizar
  Escenario: TC-005 - Acceso de cada rol
    Dado una cuenta activa de cliente, técnico o administrador aprovisionado
    Cuando inicia sesión con credenciales válidas y consulta /me
    Entonces recibe su identidad y permisos y se abre el panel correspondiente al rol

  @TC_006 @HU_S01_03 @automatizar
  Escenario: TC-006 - Sesión cerrada
    Dado una sesión válida abierta
    Cuando el usuario cierra sesión y reutiliza su cookie para consultar /me
    Entonces la sesión anterior es inválida y la API responde 401

  @TC_007 @HU_S01_04 @automatizar
  Escenario: TC-007 - Ruta administrativa denegada
    Dado un usuario cliente autenticado
    Cuando consulta directamente una ruta administrativa protegida
    Entonces recibe 403 sin datos ni cambios administrativos

  @TC_008 @HU_S01_04 @automatizar
  Escenario: TC-008 - Alta administrativa pública denegada
    Dado un visitante sin sesión privilegiada
    Cuando solicita registro enviando account_type=admin
    Entonces el alta es rechazada y no se crea ninguna cuenta administrativa

  @TC_009 @HU_S01_05 @automatizar
  Escenario: TC-009 - Edición propia
    Dado una cuenta con versión de perfil vigente
    Cuando actualiza nombre y teléfono permitidos
    Entonces se guardan esos campos y se incrementa la versión sin cambiar permisos

  @TC_010 @HU_S01_05 @automatizar
  Escenario: TC-010 - Escritura obsoleta
    Dado el perfil cambió después de cargar el formulario
    Cuando se envía una edición con expected_version anterior
    Entonces la API informa conflicto 409 y conserva la edición más reciente

  @TC_011 @HU_S01_06 @automatizar
  Escenario: TC-011 - Semilla repetible
    Dado una base MySQL de pruebas migrada
    Cuando se ejecuta dos veces la semilla inicial
    Entonces existen tres especialidades y treinta subcategorías sin duplicados y con relaciones válidas

  @TC_012 @HU_S01_06 @automatizar
  Escenario: TC-012 - Lectura real del catálogo
    Dado el entorno React–Laravel–MySQL está disponible
    Cuando el navegador consulta especialidades y subcategorías
    Entonces muestra el catálogo recibido por API y trata un fallo de red sin sustituirlo por datos ficticios silenciosos
```

## 8. Casos de prueba previstos (12)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-001 · Alta válida

**Traza:** RF-28 → HU-01 → HU-S01-01 → AC-S01-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un correo sintético no registrado y datos de cliente válidos.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el visitante confirma el formulario de registro; consultar estado persistido y efectos observables.
- **Resultado esperado:** se crea exactamente un usuario cliente y su perfil, sin permisos administrativos.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-01/tc-001.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-001/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-002 · Correo duplicado

**Traza:** RF-28 → HU-01 → HU-S01-01 → AC-S01-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una cuenta ya registrada con el mismo correo normalizado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta registrar otra cuenta con ese correo; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API rechaza el duplicado y no crea usuario ni perfil adicional.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC002.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-002/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-003 · Técnico nuevo

**Traza:** RF-28, RF-33 → HU-01, HU-02 → HU-S01-02 → AC-S01-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** datos de un técnico sin cuenta previa.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se completa el registro técnico; consultar estado persistido y efectos observables.
- **Resultado esperado:** el perfil queda Pendiente de verificación y permite editar únicamente sus datos básicos.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC003.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-003/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-004 · Autoactivación rechazada

**Traza:** RF-28, RF-33 → HU-01, HU-02 → HU-S01-02 → AC-S01-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una cuenta técnica pendiente.
- **Pasos previstos:** preparar la precondición en el entorno aislado; envía verificación aprobada, estado activo o permisos en la edición de perfil; consultar estado persistido y efectos observables.
- **Resultado esperado:** se rechazan los campos privilegiados y el estado persistido no cambia.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC004.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-004/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-005 · Acceso de cada rol

**Traza:** RF-28 → HU-01 → HU-S01-03 → AC-S01-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una cuenta activa de cliente, técnico o administrador aprovisionado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; inicia sesión con credenciales válidas y consulta /me; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe su identidad y permisos y se abre el panel correspondiente al rol.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-01/tc-005.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-005/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-006 · Sesión cerrada

**Traza:** RF-28 → HU-01 → HU-S01-03 → AC-S01-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una sesión válida abierta.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el usuario cierra sesión y reutiliza su cookie para consultar /me; consultar estado persistido y efectos observables.
- **Resultado esperado:** la sesión anterior es inválida y la API responde 401.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC006.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-006/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-007 · Ruta administrativa denegada

**Traza:** RF-33 → HU-24, HU-28 → HU-S01-04 → AC-S01-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un usuario cliente autenticado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; consulta directamente una ruta administrativa protegida; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe 403 sin datos ni cambios administrativos.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC007.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-007/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-008 · Alta administrativa pública denegada

**Traza:** RF-33 → HU-24, HU-28 → HU-S01-04 → AC-S01-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un visitante sin sesión privilegiada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; solicita registro enviando account_type=admin; consultar estado persistido y efectos observables.
- **Resultado esperado:** el alta es rechazada y no se crea ninguna cuenta administrativa.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC008.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-008/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-009 · Edición propia

**Traza:** RF-28, RF-33, RF-C06 → HU-24, HU-29 → HU-S01-05 → AC-S01-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una cuenta con versión de perfil vigente.
- **Pasos previstos:** preparar la precondición en el entorno aislado; actualiza nombre y teléfono permitidos; consultar estado persistido y efectos observables.
- **Resultado esperado:** se guardan esos campos y se incrementa la versión sin cambiar permisos.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC009.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-009/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-010 · Escritura obsoleta

**Traza:** RF-28, RF-33, RF-C06 → HU-24, HU-29 → HU-S01-05 → AC-S01-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** el perfil cambió después de cargar el formulario.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se envía una edición con expected_version anterior; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API informa conflicto 409 y conserva la edición más reciente.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC010.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-010/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-011 · Semilla repetible

**Traza:** RF-C01, RF-28, RF-33 → HU-05, HU-25 → HU-S01-06 → AC-S01-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una base MySQL de pruebas migrada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta dos veces la semilla inicial; consultar estado persistido y efectos observables.
- **Resultado esperado:** existen tres especialidades y treinta subcategorías sin duplicados y con relaciones válidas.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint01/TC011.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-011/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-012 · Lectura real del catálogo

**Traza:** RF-C01, RF-28, RF-33 → HU-05, HU-25 → HU-S01-06 → AC-S01-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** el entorno React–Laravel–MySQL está disponible.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el navegador consulta especialidades y subcategorías; consultar estado persistido y efectos observables.
- **Resultado esperado:** muestra el catálogo recibido por API y trata un fallo de red sin sustituirlo por datos ficticios silenciosos.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-01/tc-012.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-01/TC-012/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S01-01 | Registro público limitado a cliente/técnico: rechazar role=admin, permisos y verificación enviados por el navegador. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S01-02 | Validación del servidor, contraseñas con bcrypt según RNF-08, límites de intentos configurados y error genérico de acceso. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S01-03 | Probar permisos tanto en navegación como en API; ocultar un botón no es autorización. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S01-04 | Sesiones, hashes y secretos no aparecen en respuestas ni logs. Cookie Secure cuando el entorno usa HTTPS; CSRF probado en mutaciones. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S01-05 | Revisión de dependencias y secretos en cada cambio; registrar acceso y aprovisionamiento privilegiado sin incluir contraseñas. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

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

- [ ] Registro y acceso de cliente/técnico funcionan; acceso de administrador aprovisionado funciona sin alta pública privilegiada.
- [ ] Una cuenta técnica nueva queda pendiente de verificación y solo puede completar su perfil autorizado.
- [ ] API deniega rutas administrativas a otros roles y datos de otro propietario.
- [ ] Migraciones y semillas se reproducen en MySQL aislado; la segunda ejecución de semillas no duplica el catálogo.
- [ ] Los tres roles recorren UI→API→MySQL con sesión real. La demo localStorage no se acepta como evidencia de este incremento.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 1 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-01/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
