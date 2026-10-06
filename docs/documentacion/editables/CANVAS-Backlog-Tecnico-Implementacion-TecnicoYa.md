# CANVAS · Backlog Técnico de Implementación

**TécnicoYa Huancayo · Versión 1.0 · 5 de octubre de 2026**

**Estado:** propuesta de priorización y estimación para refinamiento. Conserva los ocho sprints aprobados y sus 59 historias. No acredita implementación, ejecución de pruebas ni aceptación académica.

## 1. Objetivo y decisiones de planificación

Convertir el plan aprobado en trabajo implementable para un equipo junior: datos y contrato → lógica de backend → interfaz conectada → pruebas y evidencia, entregando recorridos completos dentro de cada sprint. La Iteración 0 es instalación/estructura previa y no forma parte de los puntos de esta entrega.

Arquitectura de referencia: React; API REST Laravel modular; MySQL; Reverb/Echo; Docker Compose; Pest y Cypress; SonarQube. Se preservan las raíces frontend/web, backend/api, database, infrastructure y .devops. La arquitectura histórica de PostgreSQL/Python permanece como antecedente y no añade servicios al diseño vigente.

El diccionario completo orienta el esquema, pero las migraciones se implementan por incremento. La reserva mínima necesaria para evitar doble asignación se entrega en Sprint 4; agenda completa en Sprint 5. Auditoría de acciones sensibles desde que existen; consulta administrativa completa en Sprint 7. Seguridad y pruebas acompañan cada sprint; Sprint 8 concentra endurecimiento y regresión final.

## 2. Convenciones de puntos y MoSCoW

**Puntos:** estimación inicial relativa de esfuerzo, complejidad e incertidumbre, propuesta por el asistente. Escala por tarea: 1, 2, 3, 5, 8. Un punto no equivale a una hora o día. El equipo debe calibrar los valores con trabajo conocido; no se atribuyen estas cifras a una exigencia de Scrum.

Se puntúan las tareas porque así se solicita. Los puntos de cada historia, épica y sprint son únicamente la suma de sus tareas: no son una segunda estimación ni deben volver a sumarse. Los habilitadores compartidos se cuentan una sola vez. Si después se estima directamente en story points por historia, se sustituye este método y se recalibran los totales.

| Prioridad | Interpretación en este backlog |
| --- | --- |
| Must have | Núcleo del flujo, integridad, seguridad o requisito necesario para aceptar el incremento. |
| Should have | Funcionalidad aprobada de valor complementario que se prioriza después de las dependencias críticas dentro de su mismo sprint. Sigue incluida; no se retira automáticamente. |
| Could have | No se agregan mejoras opcionales nuevas a esta línea base. Toda candidata requiere registrar alcance y estimación antes de incorporarla. |
| Won’t have en este MVP | Chat/LLM, pagos reales, suscripción comercial, aplicación móvil nativa, geolocalización real y multitenencia empresarial ampliada. Sin sprint ni puntos asignados. |

Las prioridades y puntos son propuestas revisables. La asignación de sprint reproduce la aprobada por el usuario. Si la capacidad no alcanza, presentar el conflicto antes de cambiar alcance u orden; una prioridad Should no autoriza omitir un requisito aprobado.

## 3. Épicas y resumen de capacidad

| Épica | Resultado | Sprint | Historias | Tareas | Puntos agregados |
| --- | --- | --- | --- | --- | --- |
| EP-01 · Identidad, permisos y base del producto | Acceso real por rol y catálogo inicial reproducible. | 1 | 6 | 25 | 53 |
| EP-02 · Oferta profesional y presentación pública | Técnicos revisados, oferta configurable y landing integrada. | 2 | 7 | 29 | 78 |
| EP-03 · Captura de necesidades y descubrimiento | Solicitud en cinco pasos y búsqueda con privacidad. | 3 | 6 | 24 | 60 |
| EP-04 · Matching, ofertas y asignación confiable | Selección reproducible, respuesta temporal y elección segura. | 4 | 10 | 41 | 124 |
| EP-05 · Atención, agenda y coordinación | Ejecución trazable por participación y cambios controlados. | 5 | 7 | 28 | 79 |
| EP-06 · Reputación e historial | Calificación versionada, cierre y revisión de apelaciones. | 6 | 7 | 28 | 78 |
| EP-07 · Supervisión y gobierno administrativo | Intervenciones, reglas y reportes con permisos y auditoría. | 7 | 7 | 28 | 90 |
| EP-08 · Servicios finales y entrega del MVP | Simulación económica, calidad y demostración recuperable. | 8 | 9 | 36 | 109 |

**Total propuesto:** 59 historias, 239 tareas y **671 puntos de tarea**. Incluye 3 habilitadores técnicos compartidos. Cobertura documental: RF-01..RF-33 y RNF-01..RNF-14. Los RF-C conservan el desglose complementario de las fuentes.

No existe velocidad medida ni duración acordada de sprint: estos totales no prueban que el alcance quepa en ocho periodos de una duración determinada. Revisar especialmente los Sprints 4 y 8 por concurrencia, incertidumbre y verificación. La observación de disponibilidad y los estudios con participantes tienen tiempo de calendario que los puntos no representan.

## 4. Dependencias e infraestructura compartida

Una dependencia HU exige sus criterios de aceptación terminados; una dependencia BT exige el entregable técnico señalado. ITER-0 es la única precondición externa al grafo. Las decisiones Pxx son condiciones de refinamiento y se listan aparte; no se consideran resueltas por tener una dependencia de código cumplida.

| ID | Sprint / épica | Tarea compartida | Puntos / prioridad | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| BT-BASE-01 | 1 / EP-01 | Contrastar la implementación histórica, fijar versiones compatibles y comprobar React–Laravel–MySQL | 3 / Must | ITER-0 | RF-28, RF-33; RNF-11, RNF-13, RNF-14 |
| BT-BASE-02 | 2 / EP-02 | Implementar almacenamiento y acceso seguro a medios públicos y privados | 5 / Must | HU-S01-04 | RF-33, RF-C01, RF-C06; RNF-09, RNF-11, RNF-14 |
| BT-BASE-04 | 4 / EP-04 | Preparar Clock, colas MySQL, workers, scheduler y outbox compartido | 5 / Must | HU-S03-06 | RF-15, RF-16, RF-17, RF-29; RNF-07, RNF-11, RNF-12, RNF-13 |

- **BT-BASE-01:** Reutilizar estructura de Iteración 0; configurar base aislada, migraciones de identidad/permisos/sesión/auditoría compartidos y prueba de humo de conexión. Documentar diferencias antes de migrar datos. Esta tarea es propietaria de la base compartida; las historias solo la amplían. **Salida verificable:** Conexión real y esquema compartido reproducibles; versión de herramientas y estrategia de migración registradas.
- **BT-BASE-02:** Crear media_files y adaptador de almacenamiento; validar contenido, finalidad y límites aprobados, generar nombres internos, autorizar subidas/descargas y separar galería pública de documentos privados. Las historias añaden vínculos y pantallas, no otro servicio de archivos. **Salida verificable:** Archivo propio permitido, descarga ajena denegada y contenido no permitido rechazado; P17 resuelto para formatos/límites.
- **BT-BASE-04:** Implementar infraestructura reutilizable y reloj de prueba; separar colas de dominio/entrega, registro de trabajo fallido y publicación tras commit. Los jobs de negocio y Reverb se implementan en sus historias; no se estiman dos veces aquí. **Salida verificable:** Job de prueba recuperable e idempotente; rollback sin publicación; entorno apto para los plazos del Sprint 4.

React y Laravel se conectan desde Sprint 1. Medios públicos/privados compartidos aparecen en Sprint 2. Workers, scheduler y outbox se habilitan en Sprint 4; Reverb/Echo se integran en HU-S04-09. Exportaciones reutilizan las colas en Sprint 7. SonarQube y el despliegue de demostración se completan en Sprint 8. Echo es una biblioteca frontend; los workers ejecutan código del mismo backend.

## 5. Backlog detallado por sprint

### Sprint 1 · Base técnica, autenticación, roles y catálogo

**Épica:** EP-01. **Objetivo:** Entregar acceso por identidad y permisos reales sobre la API y MySQL, con perfiles mínimos y catálogo inicial reproducible, para que los siguientes sprints trabajen sobre una base común.

**Alcance aprobado:** RF-28, RF-33; registro e inicio de sesión por rol (cliente, técnico, administrador), RBAC, perfiles básicos, estado de verificación del técnico, catálogo semilla de 3 especialidades y ~30 subcategorías, conexión React–Laravel–MySQL y rutas protegidas.

**Total:** 53 puntos agregados de 25 tareas. **Dependencias del incremento:** La Iteración 0 debe haber dejado instalación, estructura y entorno local operativos. Revisar las diferencias del código histórico antes de migrar; no borrar datos. El administrador inicial se aprovisiona por mecanismo restringido; su gestión completa corresponde al Sprint 7.

**Decisiones del sprint:** P20: cuenta con un rol o varios; propuesta actual de un rol. P22: representación de revisión rechazada. P03/P16: catálogo de distritos y referencias económicas; no asignar valores de mercado inventados. Versiones compatibles y responsable del backlog P04 aún por registrar.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** BT-BASE-01 → HU-S01-06 → HU-S01-01 → HU-S01-02 → HU-S01-03 → HU-S01-04 → HU-S01-05. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 1](sprints-01-08/CANVAS-Sprint-01.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S01-01 | Registro de cliente | Must | 9 | BT-BASE-01 | RF-28; RNF-08, RNF-09, RNF-11, RNF-14 |
| HU-S01-02 | Alta de técnico pendiente | Must | 8 | BT-BASE-01 | RF-28, RF-33; RNF-08, RNF-09, RNF-11, RNF-14 |
| HU-S01-03 | Sesión y cierre por rol | Must | 10 | HU-S01-01, HU-S01-02 | RF-28; RNF-03, RNF-08, RNF-09, RNF-10 |
| HU-S01-04 | Autorización efectiva | Must | 10 | HU-S01-03 | RF-33; RNF-09, RNF-11 |
| HU-S01-05 | Perfil básico propio | Must | 7 | HU-S01-04 | RF-28, RF-33, RF-C06; RNF-03, RNF-09, RNF-14 |
| HU-S01-06 | Catálogo inicial y conexión | Must | 6 | BT-BASE-01 | RF-C01, RF-28, RF-33; RNF-03, RNF-11, RNF-14 |

#### HU-S01-01 · Registro de cliente

Como **cliente**, quiero **crear mi cuenta**, para **acceder a mis propios servicios**.

**Traza:** HU-01 → HU-S01-01 → TC-001, TC-002.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S01-01-01 | Datos/contrato: Preparar o ampliar users/client_profiles y correo único; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | BT-BASE-01 |
| BT-S01-01-02 | Backend: Implementar API: RegisterClient con validación y transacción | 3 | Must | BT-S01-01-01 |
| BT-S01-01-03 | Frontend/integración: Construir y conectar formulario con errores por campo | 2 | Must | BT-S01-01-02 |
| BT-S01-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-001 (Alta válida), TC-002 (Correo duplicado); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S01-01-03 |

Todas las tareas anteriores pertenecen a **EP-01, Sprint 1** y trazan a **RF-28; RNF-08, RNF-09, RNF-11, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S01-01-01 / TC-001: Dado** un correo sintético no registrado y datos de cliente válidos, **cuando** el visitante confirma el formulario de registro, **entonces** se crea exactamente un usuario cliente y su perfil, sin permisos administrativos.
- **AC-S01-01-02 / TC-002: Dado** una cuenta ya registrada con el mismo correo normalizado, **cuando** se intenta registrar otra cuenta con ese correo, **entonces** la API rechaza el duplicado y no crea usuario ni perfil adicional.

#### HU-S01-02 · Alta de técnico pendiente

Como **técnico**, quiero **registrarme y completar mis datos iniciales**, para **solicitar posteriormente mi verificación**.

**Traza:** HU-01, HU-02 → HU-S01-02 → TC-003, TC-004.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S01-02-01 | Datos/contrato: Preparar o ampliar perfil técnico con estado y verificación separados; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | BT-BASE-01 |
| BT-S01-02-02 | Backend: Implementar API: RegisterTechnician | 2 | Must | BT-S01-02-01 |
| BT-S01-02-03 | Frontend/integración: Construir y conectar alta técnica y estado pendiente | 2 | Must | BT-S01-02-02 |
| BT-S01-02-04 | Pruebas y evidencia: Implementar y ejecutar TC-003 (Técnico nuevo), TC-004 (Autoactivación rechazada); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S01-02-03 |

Todas las tareas anteriores pertenecen a **EP-01, Sprint 1** y trazan a **RF-28, RF-33; RNF-08, RNF-09, RNF-11, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S01-02-01 / TC-003: Dado** datos de un técnico sin cuenta previa, **cuando** se completa el registro técnico, **entonces** el perfil queda Pendiente de verificación y permite editar únicamente sus datos básicos.
- **AC-S01-02-02 / TC-004: Dado** una cuenta técnica pendiente, **cuando** envía verificación aprobada, estado activo o permisos en la edición de perfil, **entonces** se rechazan los campos privilegiados y el estado persistido no cambia.

#### HU-S01-03 · Sesión y cierre por rol

Como **usuario de cualquiera de los tres roles**, quiero **iniciar y cerrar sesión**, para **acceder a mi panel con una identidad comprobada**.

**Traza:** HU-01 → HU-S01-03 → TC-005, TC-006.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S01-03-01 | Datos/contrato: Preparar o ampliar sesiones del servidor, sin credenciales persistidas en React; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S01-01, HU-S01-02 |
| BT-S01-03-02 | Backend: Implementar API: login/logout con sesión y CSRF | 3 | Must | BT-S01-03-01 |
| BT-S01-03-03 | Frontend/integración: Construir y conectar cliente HTTP, rutas y /me | 3 | Must | BT-S01-03-02 |
| BT-S01-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-005 (Acceso de cada rol), TC-006 (Sesión cerrada); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S01-03-03 |

Todas las tareas anteriores pertenecen a **EP-01, Sprint 1** y trazan a **RF-28; RNF-03, RNF-08, RNF-09, RNF-10**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S01-03-01 / TC-005: Dado** una cuenta activa de cliente, técnico o administrador aprovisionado, **cuando** inicia sesión con credenciales válidas y consulta /me, **entonces** recibe su identidad y permisos y se abre el panel correspondiente al rol.
- **AC-S01-03-02 / TC-006: Dado** una sesión válida abierta, **cuando** el usuario cierra sesión y reutiliza su cookie para consultar /me, **entonces** la sesión anterior es inválida y la API responde 401.

#### HU-S01-04 · Autorización efectiva

Como **administrador responsable**, quiero **restringir cada operación a su rol y propietario**, para **evitar acceso o cambios no autorizados**.

**Traza:** HU-24, HU-28 → HU-S01-04 → TC-007, TC-008.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S01-04-01 | Datos/contrato: Preparar o ampliar concesiones mínimas y auditoría de operaciones privilegiadas; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S01-03 |
| BT-S01-04-02 | Backend: Implementar API: Policies/permissions | 3 | Must | BT-S01-04-01 |
| BT-S01-04-03 | Frontend/integración: Construir y conectar guardas de rutas y limpieza de caché al cambiar cuenta | 2 | Must | BT-S01-04-02 |
| BT-S01-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-007 (Ruta administrativa denegada), TC-008 (Alta administrativa pública denegada); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S01-04-03 |

Todas las tareas anteriores pertenecen a **EP-01, Sprint 1** y trazan a **RF-33; RNF-09, RNF-11**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S01-04-01 / TC-007: Dado** un usuario cliente autenticado, **cuando** consulta directamente una ruta administrativa protegida, **entonces** recibe 403 sin datos ni cambios administrativos.
- **AC-S01-04-02 / TC-008: Dado** un visitante sin sesión privilegiada, **cuando** solicita registro enviando account_type=admin, **entonces** el alta es rechazada y no se crea ninguna cuenta administrativa.

#### HU-S01-05 · Perfil básico propio

Como **usuario**, quiero **consultar y editar mis datos básicos**, para **mantener mi información sin alterar mi rol**.

**Traza:** HU-24, HU-29 → HU-S01-05 → TC-009, TC-010.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S01-05-01 | Datos/contrato: Preparar o ampliar actualización sin perder relación de perfil; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S01-04 |
| BT-S01-05-02 | Backend: Implementar API: GET/PATCH /me con campos permitidos y expected_version | 2 | Must | BT-S01-05-01 |
| BT-S01-05-03 | Frontend/integración: Construir y conectar formulario Mi perfil | 2 | Must | BT-S01-05-02 |
| BT-S01-05-04 | Pruebas y evidencia: Implementar y ejecutar TC-009 (Edición propia), TC-010 (Escritura obsoleta); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S01-05-03 |

Todas las tareas anteriores pertenecen a **EP-01, Sprint 1** y trazan a **RF-28, RF-33, RF-C06; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S01-05-01 / TC-009: Dado** una cuenta con versión de perfil vigente, **cuando** actualiza nombre y teléfono permitidos, **entonces** se guardan esos campos y se incrementa la versión sin cambiar permisos.
- **AC-S01-05-02 / TC-010: Dado** el perfil cambió después de cargar el formulario, **cuando** se envía una edición con expected_version anterior, **entonces** la API informa conflicto 409 y conserva la edición más reciente.

#### HU-S01-06 · Catálogo inicial y conexión

Como **usuario**, quiero **consultar el catálogo inicial desde la API**, para **usar las mismas especialidades en todos los módulos**.

**Traza:** HU-05, HU-25 → HU-S01-06 → TC-011, TC-012.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S01-06-01 | Datos/contrato: Preparar o ampliar semilla única 3/30 y migraciones verificadas; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | BT-BASE-01 |
| BT-S01-06-02 | Backend: Implementar API: lectura pública solo de activos | 1 | Must | BT-S01-06-01 |
| BT-S01-06-03 | Frontend/integración: Construir y conectar consumo del catálogo y estados carga/error/vacío | 1 | Must | BT-S01-06-02 |
| BT-S01-06-04 | Pruebas y evidencia: Implementar y ejecutar TC-011 (Semilla repetible), TC-012 (Lectura real del catálogo); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S01-06-03 |

Todas las tareas anteriores pertenecen a **EP-01, Sprint 1** y trazan a **RF-C01, RF-28, RF-33; RNF-03, RNF-11, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S01-06-01 / TC-011: Dado** una base MySQL de pruebas migrada, **cuando** se ejecuta dos veces la semilla inicial, **entonces** existen tres especialidades y treinta subcategorías sin duplicados y con relaciones válidas.
- **AC-S01-06-02 / TC-012: Dado** el entorno React–Laravel–MySQL está disponible, **cuando** el navegador consulta especialidades y subcategorías, **entonces** muestra el catálogo recibido por API y trata un fallo de red sin sustituirlo por datos ficticios silenciosos.

### Sprint 2 · Landing, administración de catálogo y perfil del técnico

**Épica:** EP-02. **Objetivo:** Hacer visible la oferta del marketplace y permitir que el administrador y los técnicos preparen información verificable que alimentará la búsqueda y el matching.

**Alcance aprobado:** Landing de 10 secciones; administración de categorías/subcategorías y foto de carrusel, comunicados y verificación de técnicos; perfil y portafolio técnico, disponibilidad, zona, servicios ofrecidos, tarifas y pausa temporal (RF-05, RF-07).

**Total:** 78 puntos agregados de 29 tareas. **Dependencias del incremento:** Depende de identidad, RBAC y catálogo del Sprint 1. RF-07 se prepara aquí mediante datos de habilitación; su filtro integrado se valida en Sprint 4. No se incorpora todavía el motor de matching ni la búsqueda completa del Sprint 3.

**Decisiones del sprint:** P03 distritos; P05/P16 duración y compatibilidad de franjas; P17 límites y formatos de archivos; P18 efectos de suspensión; P19 cambios de catálogo sobre solicitudes futuras/activas; P22 rechazo de verificación. Resolver la política aplicable antes de aceptar cada historia afectada.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** BT-BASE-02 → HU-S02-02 → HU-S02-04 → HU-S02-06 → HU-S02-07 → HU-S02-01 → HU-S02-03 → HU-S02-05. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 2](sprints-01-08/CANVAS-Sprint-02.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S02-01 | Landing y carrusel | Should | 10 | HU-S01-03, HU-S02-02 | RF-C08; RNF-03, RNF-04 |
| HU-S02-02 | Catálogo administrable | Must | 10 | HU-S01-04, HU-S01-06, BT-BASE-02 | RF-C01, RF-C02; RNF-03, RNF-09, RNF-14 |
| HU-S02-03 | Comunicados por audiencia | Should | 10 | HU-S01-04, BT-BASE-02 | RF-C04, RF-C09; RNF-03, RNF-09, RNF-14 |
| HU-S02-04 | Verificación administrativa | Must | 11 | HU-S01-02, HU-S01-04, BT-BASE-02 | RF-07, RF-30, RF-33; RNF-09, RNF-14 |
| HU-S02-05 | Perfil y portafolio | Should | 11 | HU-S01-05, BT-BASE-02 | RF-C06, RF-33; RNF-03, RNF-09, RNF-14 |
| HU-S02-06 | Disponibilidad, zona y pausa | Must | 12 | HU-S02-02, HU-S02-04 | RF-05, RF-07; RNF-03, RNF-09, RNF-14 |
| HU-S02-07 | Servicios y tarifas | Must | 9 | HU-S02-02, HU-S02-04 | RF-05, RF-07, RF-C06; RNF-09, RNF-14 |

#### HU-S02-01 · Landing y carrusel

Como **visitante**, quiero **entender el servicio y navegar hacia registro o búsqueda**, para **identificar la especialidad que necesito**.

**Traza:** HU-31 → HU-S02-01 → TC-013, TC-014.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S02-01-01 | Datos/contrato: Preparar o ampliar solo contenido sintético rotulado; reutilizar esquema compartido y versionar cambios necesarios | 1 | Should | HU-S01-03, HU-S02-02 |
| BT-S02-01-02 | Backend: Reutilizar API pública del catálogo y conectar imágenes/textos de landing, sin duplicar endpoints | 1 | Should | BT-S02-01-01 |
| BT-S02-01-03 | Frontend/integración: Construir y conectar Header, Hero, Especialidades, Cómo funciona, Confianza, Testimonios, CTA técnicos, FAQ, CTA final y Footer | 5 | Should | BT-S02-01-02 |
| BT-S02-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-013 (Diez secciones navegables), TC-014 (Carrusel accesible); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Should | BT-S02-01-03 |

Todas las tareas anteriores pertenecen a **EP-02, Sprint 2** y trazan a **RF-C08; RNF-03, RNF-04**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S02-01-01 / TC-013: Dado** un visitante abre la landing en móvil y escritorio, **cuando** recorre sus diez secciones y usa los CTA de acceso, **entonces** lee los títulos completos, llega a la cuenta correcta y no encuentra paneles privados dentro de la landing.
- **AC-S02-01-02 / TC-014: Dado** el carrusel está visible y el usuario ha solicitado movimiento reducido, **cuando** se carga la sección y navega con teclado, **entonces** la reproducción automática permanece pausada y los controles permiten cambiar de tarjeta con foco visible.

#### HU-S02-02 · Catálogo administrable

Como **administrador de catálogo**, quiero **gestionar subcategorías y fotos**, para **mantener una oferta clara sin perder referencias**.

**Traza:** HU-25 → HU-S02-02 → TC-015, TC-016.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S02-02-01 | Datos/contrato: Preparar o ampliar relación rubro-subcategoría, imagen y activación lógica, distritos aprobados; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S01-04, HU-S01-06, BT-BASE-02 |
| BT-S02-02-02 | Backend: Implementar API: altas y cambios autorizados | 3 | Must | BT-S02-02-01 |
| BT-S02-02-03 | Frontend/integración: Construir y conectar tablas/formularios/foto | 3 | Must | BT-S02-02-02 |
| BT-S02-02-04 | Pruebas y evidencia: Implementar y ejecutar TC-015 (Alta de subcategoría), TC-016 (Desactivar conserva historial); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S02-02-03 |

Todas las tareas anteriores pertenecen a **EP-02, Sprint 2** y trazan a **RF-C01, RF-C02; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S02-02-01 / TC-015: Dado** un administrador autorizado y una especialidad activa, **cuando** crea una subcategoría con imagen validada, **entonces** la subcategoría aparece en su especialidad y la foto aprobada se ofrece al carrusel.
- **AC-S02-02-02 / TC-016: Dado** una subcategoría referenciada por un servicio de prueba, **cuando** el administrador la desactiva, **entonces** deja de ofrecerse para nuevos registros pero conserva su identidad y referencias anteriores.

#### HU-S02-03 · Comunicados por audiencia

Como **administrador de comunicaciones**, quiero **publicar avisos con audiencia y vigencia**, para **informar solo a los usuarios correspondientes**.

**Traza:** HU-27 → HU-S02-03 → TC-017, TC-018.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S02-03-01 | Datos/contrato: Preparar o ampliar announcements y audiencias sin publicación automática de duplicados; reutilizar esquema compartido y versionar cambios necesarios | 2 | Should | HU-S01-04, BT-BASE-02 |
| BT-S02-03-02 | Backend: Implementar API: validar audiencia/fechas/enlace | 3 | Should | BT-S02-03-01 |
| BT-S02-03-03 | Frontend/integración: Construir y conectar editor con vista previa, duplicar y retirar | 3 | Should | BT-S02-03-02 |
| BT-S02-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-017 (Audiencia vigente), TC-018 (Duplicado en borrador); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Should | BT-S02-03-03 |

Todas las tareas anteriores pertenecen a **EP-02, Sprint 2** y trazan a **RF-C04, RF-C09; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S02-03-01 / TC-017: Dado** un comunicado vigente dirigido solo a técnicos, **cuando** un cliente y un técnico consultan sus comunicados, **entonces** solo el técnico recibe ese comunicado.
- **AC-S02-03-02 / TC-018: Dado** un comunicado publicado, **cuando** el administrador lo duplica, **entonces** se crea una copia en borrador que no aparece aún en ningún panel.

#### HU-S02-04 · Verificación administrativa

Como **administrador verificador**, quiero **revisar los datos y evidencias del técnico**, para **habilitar solo perfiles revisados**.

**Traza:** HU-02 → HU-S02-04 → TC-019, TC-020.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S02-04-01 | Datos/contrato: Preparar o ampliar revisión y vínculos documentales auditados; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S01-02, HU-S01-04, BT-BASE-02 |
| BT-S02-04-02 | Backend: Implementar API: ReviewTechnician con versión y permiso | 3 | Must | BT-S02-04-01 |
| BT-S02-04-03 | Frontend/integración: Construir y conectar bandeja pendiente/ficha/decisión/motivo | 3 | Must | BT-S02-04-02 |
| BT-S02-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-019 (Aprobación documentada), TC-020 (Documento ajeno denegado); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S02-04-03 |

Todas las tareas anteriores pertenecen a **EP-02, Sprint 2** y trazan a **RF-07, RF-30, RF-33; RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S02-04-01 / TC-019: Dado** un perfil pendiente con los datos y evidencias exigidos por la política aprobada, **cuando** el administrador autorizado aprueba la revisión, **entonces** se registra la decisión, su autor y fecha y el perfil adquiere la habilitación prevista.
- **AC-S02-04-02 / TC-020: Dado** un técnico intenta consultar el documento privado de otro técnico, **cuando** solicita su URL por identificador, **entonces** se deniega la descarga sin revelar el contenido.

#### HU-S02-05 · Perfil y portafolio

Como **técnico**, quiero **publicar mi experiencia y trabajos autorizados**, para **presentar mi especialización a futuros clientes**.

**Traza:** HU-29 → HU-S02-05 → TC-021, TC-022.

**Condiciones específicas de pruebas:** P17 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S02-05-01 | Datos/contrato: Preparar o ampliar media privada/pública y portafolio separado de documentos; reutilizar esquema compartido y versionar cambios necesarios | 2 | Should | HU-S01-05, BT-BASE-02 |
| BT-S02-05-02 | Backend: Implementar API: pertenencia y validación de archivos | 3 | Should | BT-S02-05-01 |
| BT-S02-05-03 | Frontend/integración: Construir y conectar bio y galería con estados | 3 | Should | BT-S02-05-02 |
| BT-S02-05-04 | Pruebas y evidencia: Implementar y ejecutar TC-021 (Trabajo publicado), TC-022 (Archivo no permitido); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Should | BT-S02-05-03 |

Todas las tareas anteriores pertenecen a **EP-02, Sprint 2** y trazan a **RF-C06, RF-33; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S02-05-01 / TC-021: Dado** un técnico propietario de una imagen permitida para portafolio, **cuando** publica un trabajo con título y descripción, **entonces** el trabajo aparece en su galería pública sin incluir documentos de verificación.
- **AC-S02-05-02 / TC-022: Dado** un archivo cuyo contenido no cumple la política de imágenes aprobada, **cuando** se intenta subir como foto de portafolio, **entonces** se rechaza y no queda disponible para descarga pública. Condicionado a P17.

#### HU-S02-06 · Disponibilidad, zona y pausa

Como **técnico**, quiero **configurar franjas y cobertura y pausar temporalmente mi oferta**, para **controlar cuándo puedo recibir solicitudes**.

**Traza:** HU-06 → HU-S02-06 → TC-023, TC-024.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S02-06-01 | Datos/contrato: Preparar o ampliar slots, cobertura y pausas, diferenciados del estado de verificación; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S02-02, HU-S02-04 |
| BT-S02-06-02 | Backend: Implementar API: intervalos válidos y versión | 3 | Must | BT-S02-06-01 |
| BT-S02-06-03 | Frontend/integración: Construir y conectar editor de franjas/distritos/pausa | 3 | Must | BT-S02-06-02 |
| BT-S02-06-04 | Pruebas y evidencia: Implementar y ejecutar TC-023 (Configuración válida), TC-024 (Intervalo inválido); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S02-06-03 |

Todas las tareas anteriores pertenecen a **EP-02, Sprint 2** y trazan a **RF-05, RF-07; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S02-06-01 / TC-023: Dado** un técnico habilitado y distritos de prueba aprobados, **cuando** guarda horarios y activa una pausa temporal válida, **entonces** se conservan horarios y zona y la pausa queda disponible para el filtro de elegibilidad.
- **AC-S02-06-02 / TC-024: Dado** un técnico con horario previamente guardado, **cuando** envía una franja cuyo fin es anterior al inicio, **entonces** recibe validación de error y el horario anterior no se altera.

#### HU-S02-07 · Servicios y tarifas

Como **técnico**, quiero **seleccionar las subcategorías que ofrezco y sus tarifas referenciales**, para **mostrar condiciones consistentes**.

**Traza:** HU-05, HU-06 → HU-S02-07 → TC-025, TC-026.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S02-07-01 | Datos/contrato: Preparar o ampliar technician_services y service_rate_versions; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S02-02, HU-S02-04 |
| BT-S02-07-02 | Backend: Implementar API: categorías activas y ámbito verificado | 3 | Must | BT-S02-07-01 |
| BT-S02-07-03 | Frontend/integración: Construir y conectar selector por rubro y tarifa por servicio | 2 | Must | BT-S02-07-02 |
| BT-S02-07-04 | Pruebas y evidencia: Implementar y ejecutar TC-025 (Nueva versión de tarifa), TC-026 (Tarifa negativa); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S02-07-03 |

Todas las tareas anteriores pertenecen a **EP-02, Sprint 2** y trazan a **RF-05, RF-07, RF-C06; RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S02-07-01 / TC-025: Dado** un servicio técnico con tarifa referencial de prueba 50 y versión 1, **cuando** su propietario cambia la referencia a 60, **entonces** se crea versión 2 y la versión 1 conserva el valor 50 sin sobrescritura.
- **AC-S02-07-02 / TC-026: Dado** un técnico editando su propio servicio, **cuando** envía una tarifa referencial negativa, **entonces** la API rechaza el valor y no crea una versión de tarifa.

### Sprint 3 · Solicitud y búsqueda de técnicos

**Épica:** EP-03. **Objetivo:** Permitir que el cliente describa, revise y envíe su necesidad de forma segura y consulte técnicos por especialidad, conservando la distinción entre búsqueda automática y solicitud dirigida.

**Alcance aprobado:** RF-01 a RF-04; Nueva solicitud en 5 pasos con evidencias y tarifa referencial; Buscar técnicos con filtros y perfil público; Solicitar servicio con técnico precargado; Mis solicitudes (estructura base).

**Total:** 60 puntos agregados de 24 tareas. **Dependencias del incremento:** Requiere catálogo activo, perfiles, cobertura y tarifas de Sprint 2 y sesiones de Sprint 1. La emisión de ofertas, ranking y cronómetro se conectarán en Sprint 4; este incremento no debe mostrar asignaciones ficticias. Reseñas públicas se conectarán en Sprint 6, manteniendo estados vacíos honestos.

**Decisiones del sprint:** P03 cobertura; P05 franja inmediata; P10 máximo de solicitudes activas; P16 duración de citas y relación de tarifas; P17 política de evidencias; P22 estado Registrada/Enviada. No declarar aprobadas decisiones de negocio aún abiertas.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** HU-S03-01 → HU-S03-02 → HU-S03-03 → HU-S03-04 → HU-S03-05 → HU-S03-06. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 3](sprints-01-08/CANVAS-Sprint-03.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S03-01 | Solicitud en cinco pasos | Must | 14 | HU-S01-04, HU-S02-02 | RF-01, RF-02; RNF-03, RNF-05, RNF-09, RNF-14 |
| HU-S03-02 | Evidencias privadas | Must | 9 | HU-S03-01, BT-BASE-02 | RF-03, RF-33; RNF-03, RNF-09, RNF-14 |
| HU-S03-03 | Tarifa y ubicación | Must | 9 | HU-S03-01, HU-S02-06, HU-S02-07 | RF-01, RF-04, RF-C02; RNF-03, RNF-05, RNF-09 |
| HU-S03-04 | Búsqueda y perfil público | Must | 10 | HU-S02-04, HU-S02-05, HU-S02-06, HU-S02-07 | RF-C06; RNF-03, RNF-09 |
| HU-S03-05 | Solicitud desde perfil | Must | 7 | HU-S03-01, HU-S03-04 | RF-01, RF-02, RF-C06; RNF-03, RNF-09 |
| HU-S03-06 | Mis solicitudes y envío repetido | Must | 11 | HU-S03-01, HU-S03-02, HU-S03-03 | RF-01, RF-02, RF-33; RNF-03, RNF-09, RNF-11 |

#### HU-S03-01 · Solicitud en cinco pasos

Como **cliente**, quiero **registrar y revisar mi solicitud en cinco pasos**, para **explicar la falla sin omitir información**.

**Traza:** HU-03 → HU-S03-01 → TC-027, TC-028.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S03-01-01 | Datos/contrato: Preparar o ampliar request y eventos con propietario de sesión; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S01-04, HU-S02-02 |
| BT-S03-01-02 | Backend: Implementar API: validación, creación y envío separados | 3 | Must | BT-S03-01-01 |
| BT-S03-01-03 | Frontend/integración: Construir y conectar asistente y resumen editable | 5 | Must | BT-S03-01-02 |
| BT-S03-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-027 (Recorrido con corrección), TC-028 (Datos obligatorios ausentes); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S03-01-03 |

Todas las tareas anteriores pertenecen a **EP-03, Sprint 3** y trazan a **RF-01, RF-02; RNF-03, RNF-05, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S03-01-01 / TC-027: Dado** un cliente autenticado y catálogo activo, **cuando** completa los cinco pasos, vuelve a corregir la descripción y confirma, **entonces** se guarda la descripción corregida y se envía una sola solicitud con resumen consistente.
- **AC-S03-01-02 / TC-028: Dado** el cliente omite la subcategoría o la descripción requerida, **cuando** intenta enviar el resumen, **entonces** el sistema identifica los campos incompletos y no envía una solicitud inválida.

#### HU-S03-02 · Evidencias privadas

Como **cliente**, quiero **adjuntar fotos de la falla**, para **facilitar su evaluación sin exponerlas a terceros**.

**Traza:** HU-04 → HU-S03-02 → TC-029, TC-030.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S03-02-01 | Datos/contrato: Preparar o ampliar adjunto privado de solicitud; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S03-01, BT-BASE-02 |
| BT-S03-02-02 | Backend: Implementar API: finalidad/propiedad y tipo | 3 | Must | BT-S03-02-01 |
| BT-S03-02-03 | Frontend/integración: Construir y conectar selección, vista previa y retirar antes de enviar | 2 | Must | BT-S03-02-02 |
| BT-S03-02-04 | Pruebas y evidencia: Implementar y ejecutar TC-029 (Foto propia vinculada), TC-030 (Referencia de archivo ajeno); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S03-02-03 |

Todas las tareas anteriores pertenecen a **EP-03, Sprint 3** y trazan a **RF-03, RF-33; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S03-02-01 / TC-029: Dado** una solicitud registrada propia y una imagen válida, **cuando** el cliente adjunta la imagen y consulta el resumen, **entonces** la foto queda vinculada solo a esa solicitud y visible al propietario autorizado.
- **AC-S03-02-02 / TC-030: Dado** un archivo privado perteneciente a otro cliente, **cuando** se intenta vincular su identificador a una solicitud propia, **entonces** la API deniega la asociación y el archivo sigue privado.

#### HU-S03-03 · Tarifa y ubicación

Como **cliente**, quiero **conocer la referencia económica y confirmar la zona y horario**, para **enviar una necesidad dentro de la cobertura**.

**Traza:** HU-03, HU-05 → HU-S03-03 → TC-031, TC-032.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S03-03-01 | Datos/contrato: Preparar o ampliar instantánea referencial y zona, no importe final de cobro; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S03-01, HU-S02-06, HU-S02-07 |
| BT-S03-03-02 | Backend: Implementar API: tarifa desde fuente autorizada y cobertura | 3 | Must | BT-S03-03-01 |
| BT-S03-03-03 | Frontend/integración: Construir y conectar paso 4 con modalidad y franja | 2 | Must | BT-S03-03-02 |
| BT-S03-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-031 (Tarifa referencial visible), TC-032 (Fuera de cobertura); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S03-03-03 |

Todas las tareas anteriores pertenecen a **EP-03, Sprint 3** y trazan a **RF-01, RF-04, RF-C02; RNF-03, RNF-05, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S03-03-01 / TC-031: Dado** una subcategoría con tarifa referencial de prueba aprobada, **cuando** el cliente selecciona el servicio y revisa el resumen, **entonces** se muestra el monto como referencial y se conserva su procedencia sin tratarlo como pago.
- **AC-S03-03-02 / TC-032: Dado** un distrito que no pertenece al catálogo activo, **cuando** el cliente intenta confirmar una solicitud para ese distrito, **entonces** se informa fuera de cobertura y no se envía la solicitud.

#### HU-S03-04 · Búsqueda y perfil público

Como **cliente**, quiero **filtrar técnicos y revisar sus perfiles públicos**, para **comparar especialidad, zona y experiencia**.

**Traza:** HU-29, HU-05 → HU-S03-04 → TC-033, TC-034.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S03-04-01 | Datos/contrato: Preparar o ampliar servicios activos, portafolio y medias de prueba o ausencia de historial; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S02-04, HU-S02-05, HU-S02-06, HU-S02-07 |
| BT-S03-04-02 | Backend: Implementar API: GET technicians con proyección pública | 3 | Must | BT-S03-04-01 |
| BT-S03-04-03 | Frontend/integración: Construir y conectar filtros combinables y tarjetas paginadas | 3 | Must | BT-S03-04-02 |
| BT-S03-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-033 (Filtros combinados), TC-034 (Perfil sin datos privados); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S03-04-03 |

Todas las tareas anteriores pertenecen a **EP-03, Sprint 3** y trazan a **RF-C06; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S03-04-01 / TC-033: Dado** técnicos de prueba con distintos rubros, zonas y calificaciones, **cuando** el cliente combina especialidad, subcategoría, distrito y calificación mínima, **entonces** recibe únicamente técnicos que cumplen todos los filtros y un estado vacío si no hay coincidencias.
- **AC-S03-04-02 / TC-034: Dado** un técnico con bio pública, documentos privados y teléfono de contacto, **cuando** un cliente consulta su perfil antes de asignación, **entonces** recibe bio y portafolio público pero no documentos privados ni WhatsApp.

#### HU-S03-05 · Solicitud desde perfil

Como **cliente**, quiero **solicitar a un técnico elegido desde su perfil**, para **mantener mi elección durante el registro**.

**Traza:** HU-10, HU-29 → HU-S03-05 → TC-035, TC-036.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S03-05-01 | Datos/contrato: Preparar o ampliar source y objetivo persistidos; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S03-01, HU-S03-04 |
| BT-S03-05-02 | Backend: Implementar API: validar target_technician_id y servicio ofrecido | 2 | Must | BT-S03-05-01 |
| BT-S03-05-03 | Frontend/integración: Construir y conectar CTA con técnico precargado y opción clara de revisar | 2 | Must | BT-S03-05-02 |
| BT-S03-05-04 | Pruebas y evidencia: Implementar y ejecutar TC-035 (Origen dirigido preservado), TC-036 (Objetivo incompatible); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S03-05-03 |

Todas las tareas anteriores pertenecen a **EP-03, Sprint 3** y trazan a **RF-01, RF-02, RF-C06; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S03-05-01 / TC-035: Dado** un cliente abre un técnico que ofrece la subcategoría seleccionada, **cuando** pulsa Solicitar servicio y confirma los cinco pasos, **entonces** la solicitud conserva source=profile y ese técnico objetivo sin generar una asignación automática.
- **AC-S03-05-02 / TC-036: Dado** el técnico precargado no ofrece la subcategoría enviada, **cuando** se intenta enviar esa combinación manipulada, **entonces** la API rechaza la incompatibilidad sin sustituir silenciosamente al técnico.

#### HU-S03-06 · Mis solicitudes y envío repetido

Como **cliente**, quiero **ver mis solicitudes sin duplicados**, para **recuperar el estado después de una interrupción**.

**Traza:** HU-03, HU-12, HU-24 → HU-S03-06 → TC-037, TC-038.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S03-06-01 | Datos/contrato: Preparar o ampliar evento único de envío y versión; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S03-01, HU-S03-02, HU-S03-03 |
| BT-S03-06-02 | Backend: Implementar API: filtro por titular e idempotencia | 3 | Must | BT-S03-06-01 |
| BT-S03-06-03 | Frontend/integración: Construir y conectar listado base/detalle y manejo de reintento | 3 | Must | BT-S03-06-02 |
| BT-S03-06-04 | Pruebas y evidencia: Implementar y ejecutar TC-037 (Reintento del mismo envío), TC-038 (Solicitud ajena); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S03-06-03 |

Todas las tareas anteriores pertenecen a **EP-03, Sprint 3** y trazan a **RF-01, RF-02, RF-33; RNF-03, RNF-09, RNF-11**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S03-06-01 / TC-037: Dado** una solicitud propia y una clave de idempotencia ya confirmada para su envío, **cuando** se repite el mismo comando tras perder la respuesta, **entonces** se obtiene el mismo resultado y no se duplica solicitud ni evento de envío.
- **AC-S03-06-02 / TC-038: Dado** dos clientes con solicitudes diferentes, **cuando** uno consulta por identificador el detalle de la solicitud del otro, **entonces** se deniega sin descripción privada, dirección ni evidencias.

### Sprint 4 · Matching, notificación, SLA y reasignación

**Épica:** EP-04. **Objetivo:** Transformar una solicitud enviada en ofertas trazables y una asignación elegida por el cliente, respetando elegibilidad, límites temporales, concurrencia y recuperación de fallos.

**Alcance aprobado:** RF-06 a RF-18 y RF-29; parámetros y pesos del matching; algoritmo; notificación a 3 técnicos; SLA de 10 minutos; reasignación automática; Pendiente de disponibilidad de 24 h; Reverb/Echo; solicitudes entrantes con cronómetro.

**Total:** 124 puntos agregados de 41 tareas. **Dependencias del incremento:** Requiere Sprints 1–3 y datos de disponibilidad/tarifas. El historial real llegará en Sprint 6: usar tratamiento de técnico nuevo acordado y fixtures, sin inventar reseñas. La reserva mínima al asignar pertenece a este sprint para impedir dobles asignaciones; el calendario y gestión de citas completos permanecen en Sprint 5. Edición administrativa de reglas y reasignación manual quedan en Sprint 7.

**Decisiones del sprint:** P05/P16 franjas y duración; P11 momento y plazo de elección; P12 fronteras temporales, recuperación y avisos; P15 normalización/estimaciones/empate residual; P19 vigencia de reglas. Propuestas: oferta válida mientras now < deadline y reloj 24 h sin reinicio por job. No aprobar esos escenarios condicionados hasta ratificar sus decisiones.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** BT-BASE-04 → HU-S04-01 → HU-S04-02 → HU-S04-03 → HU-S04-04 → HU-S04-05 → HU-S04-06 → HU-S04-07 → HU-S04-08 → HU-S04-09 → HU-S04-10. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 4](sprints-01-08/CANVAS-Sprint-04.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S04-01 | Elegibilidad y subcategoría | Must | 11 | HU-S03-06, HU-S02-06, HU-S02-07, BT-BASE-04 | RF-06, RF-07, RF-10; RNF-01, RNF-09, RNF-11, RNF-12 |
| HU-S04-02 | Puntuación y desempate | Must | 13 | HU-S04-01 | RF-06, RF-08, RF-09; RNF-01, RNF-11, RNF-12, RNF-14 |
| HU-S04-03 | Estimaciones y técnico nuevo | Must | 10 | HU-S04-02 | RF-11, RF-12; RNF-01, RNF-03, RNF-12 |
| HU-S04-04 | Ronda y notificaciones | Must | 14 | HU-S04-02, HU-S04-03, BT-BASE-04 | RF-13, RF-15, RF-29; RNF-07, RNF-09, RNF-12, RNF-14 |
| HU-S04-05 | Respuesta y límite del SLA | Must | 10 | HU-S04-04 | RF-15, RF-16; RNF-03, RNF-09, RNF-12 |
| HU-S04-06 | Elección y concurrencia | Must | 16 | HU-S04-05 | RF-18; RNF-02, RNF-09, RNF-12, RNF-14 |
| HU-S04-07 | Reasignación y ruta dirigida | Must | 14 | HU-S04-05, HU-S03-05 | RF-16, RF-17; RNF-07, RNF-09, RNF-12 |
| HU-S04-08 | Pendiente durante 24 horas | Must | 10 | HU-S04-07 | RF-14; RNF-07, RNF-12 |
| HU-S04-09 | Tiempo real y recuperación | Must | 12 | HU-S04-04, HU-S04-05, BT-BASE-04 | RF-29; RNF-03, RNF-09, RNF-10, RNF-12 |
| HU-S04-10 | Entrega y reintentos controlados | Must | 9 | HU-S04-04, BT-BASE-04 | RF-15, RF-29; RNF-07; RNF-07, RNF-12 |

#### HU-S04-01 · Elegibilidad y subcategoría

Como **cliente**, quiero **recibir candidatos habilitados para mi necesidad**, para **evitar propuestas que no puedan atenderla**.

**Traza:** HU-06, HU-07 → HU-S04-01 → TC-039, TC-040.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-01-01 | Datos/contrato: Preparar o ampliar snapshot de exclusiones; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S03-06, HU-S02-06, HU-S02-07, BT-BASE-04 |
| BT-S04-01-02 | Backend: Conectar elegibilidad al caso de uso de matching y comunicar estado de búsqueda a React | 5 | Must | BT-S04-01-01 |
| BT-S04-01-03 | Frontend/integración: Construir y conectar estados de búsqueda | 1 | Must | BT-S04-01-02 |
| BT-S04-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-039 (Elegible en su servicio), TC-040 (Mejor puntaje pero suspendido); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S04-01-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-06, RF-07, RF-10; RNF-01, RNF-09, RNF-11, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-01-01 / TC-039: Dado** un técnico verificado activo que ofrece la subcategoría y cubre zona/franja sin pausa, **cuando** se ejecuta el matching de esa solicitud, **entonces** el técnico queda elegible con snapshot y puede ser evaluado por el ranking.
- **AC-S04-01-02 / TC-040: Dado** un técnico suspendido con un puntaje potencial mayor al de los activos, **cuando** se filtran los candidatos, **entonces** se excluye por suspensión y nunca recibe oferta.

#### HU-S04-02 · Puntuación y desempate

Como **cliente**, quiero **obtener un orden de candidatos consistente**, para **comparar las mejores alternativas según reglas conocidas**.

**Traza:** HU-07 → HU-S04-02 → TC-041, TC-042.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-02-01 | Datos: Crear versiones de reglas, pesos y snapshot de factores con suma 100 y referencias preservadas | 3 | Must | HU-S04-01 |
| BT-S04-02-02 | Dominio: Implementar scorer y ordenamiento, desempate por promedio y política pendiente de empate residual | 5 | Must | BT-S04-02-01 |
| BT-S04-02-03 | Integración: Conectar el scorer a la ejecución interna del matching y devolver ranking explicable; sin pantalla nueva | 2 | Must | BT-S04-02-02 |
| BT-S04-02-04 | Pruebas: Automatizar cálculo 75/100, desempates y rechazo de configuración inválida con fixtures deterministas | 3 | Must | BT-S04-02-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-06, RF-08, RF-09; RNF-01, RNF-11, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-02-01 / TC-041: Dado** factores normalizados 1, 0.5, 0.8 y 0.4 con pesos 35, 20, 30 y 15, **cuando** se calcula el puntaje, **entonces** el resultado es 75 sobre 100 y conserva los cuatro aportes.
- **AC-S04-02-02 / TC-042: Dado** dos candidatos elegibles con igual puntaje y promedios reales 4.8 y 4.2, **cuando** se ordena el ranking, **entonces** el candidato con promedio 4.8 precede al de 4.2.

#### HU-S04-03 · Estimaciones y técnico nuevo

Como **cliente y técnico**, quiero **distinguir estimaciones de datos reales**, para **interpretar distancia y experiencia sin falsa precisión**.

**Traza:** HU-08 → HU-S04-03 → TC-043, TC-044.

**Condiciones específicas de pruebas:** P15 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-03-01 | Datos/contrato: Preparar o ampliar referencia de distrito, duración y procedencia; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S04-02 |
| BT-S04-03-02 | Backend: Implementar dominio: política de datos ausentes | 3 | Must | BT-S04-03-01 |
| BT-S04-03-03 | Frontend/integración: Construir y conectar rótulos de aproximación/nuevo | 2 | Must | BT-S04-03-02 |
| BT-S04-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-043 (Distancia aproximada por zona), TC-044 (Perfil sin historial); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S04-03-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-11, RF-12; RNF-01, RNF-03, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-03-01 / TC-043: Dado** una matriz sintética aprobada de distancias entre distritos, **cuando** se calcula y muestra una distancia de un candidato, **entonces** se rotula distancia aproximada por zona y no se presenta como geolocalización exacta.
- **AC-S04-03-02 / TC-044: Dado** un técnico elegible sin servicios ni calificaciones y la política de nuevos aprobada, **cuando** se evalúan historial y tiempo estimado, **entonces** se usa factor de historial neutro 0.5 y se muestra Nuevo y estimación general sin publicar una reseña ficticia. Condicionado a P15.

#### HU-S04-04 · Ronda y notificaciones

Como **técnico**, quiero **recibir una oferta persistida**, para **responder una necesidad dentro del plazo**.

**Traza:** HU-09, HU-20 → HU-S04-04 → TC-045, TC-046.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-04-01 | Datos/contrato: Preparar o ampliar ofertas/destinatarios únicos y plazos persistidos; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S04-02, HU-S04-03, BT-BASE-04 |
| BT-S04-04-02 | Backend: Implementar aplicación: OpenOfferRound/outbox | 5 | Must | BT-S04-04-01 |
| BT-S04-04-03 | Frontend/integración: Construir y conectar bandeja entrante | 3 | Must | BT-S04-04-02 |
| BT-S04-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-045 (Tres ofertas como máximo), TC-046 (Rollback no notifica éxito); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S04-04-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-13, RF-15, RF-29; RNF-07, RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-04-01 / TC-045: Dado** cinco candidatos elegibles ordenados y una solicitud automática enviada, **cuando** se abre la primera ronda, **entonces** se generan exactamente tres ofertas a los tres primeros y ningún cuarto destinatario.
- **AC-S04-04-02 / TC-046: Dado** una apertura de ronda cuya transacción falla antes del commit, **cuando** el worker de entrega busca mensajes publicables, **entonces** no publica avisos de ofertas que no quedaron confirmadas en la base.

#### HU-S04-05 · Respuesta y límite del SLA

Como **técnico destinatario**, quiero **aceptar o rechazar una oferta a tiempo**, para **participar sin decisiones contradictorias**.

**Traza:** HU-09 → HU-S04-05 → TC-047, TC-048.

**Condiciones específicas de pruebas:** P12 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-05-01 | Datos/contrato: Preparar o ampliar estado de oferta separado de participación; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S04-04 |
| BT-S04-05-02 | Backend: Implementar API: respuesta con versión/reloj | 3 | Must | BT-S04-05-01 |
| BT-S04-05-03 | Frontend/integración: Construir y conectar cronómetro/aceptar/rechazar | 3 | Must | BT-S04-05-02 |
| BT-S04-05-04 | Pruebas y evidencia: Implementar y ejecutar TC-047 (Aceptación dentro de plazo), TC-048 (Aceptación en el límite exacto); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S04-05-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-15, RF-16; RNF-03, RNF-09, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-05-01 / TC-047: Dado** una oferta propia pendiente cuyo plazo termina dentro de un minuto, **cuando** el técnico acepta, **entonces** la oferta pasa a aceptada sin asignación ni participación automática.
- **AC-S04-05-02 / TC-048: Dado** una oferta propia pendiente y el reloj del servidor igual a expires_at, **cuando** el técnico intenta aceptar aunque el job no se ejecutó, **entonces** la API responde conflicto por vencimiento y no acepta la oferta. Condicionado a P12.

#### HU-S04-06 · Elección y concurrencia

Como **cliente**, quiero **elegir una oferta aceptada válida**, para **confirmar un técnico disponible**.

**Traza:** HU-10 → HU-S04-06 → TC-049, TC-050.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-06-01 | Datos/contrato: Preparar o ampliar participación/cita única y eventos; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S04-05 |
| BT-S04-06-02 | Backend: Implementar aplicación: AssignTechnician con bloqueo/revalidación | 5 | Must | BT-S04-06-01 |
| BT-S04-06-03 | Frontend/integración: Construir y conectar candidatos aceptados y confirmación | 3 | Must | BT-S04-06-02 |
| BT-S04-06-04 | Pruebas y evidencia: Implementar y ejecutar TC-049 (Elección válida), TC-050 (Dos reservas incompatibles); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S04-06-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-18; RNF-02, RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-06-01 / TC-049: Dado** una oferta aceptada de mi solicitud y un técnico aún disponible, **cuando** confirmo mi elección, **entonces** se crea una participación principal y la reserva aplicable con tarifa notificada y estado Asignada.
- **AC-S04-06-02 / TC-050: Dado** dos clientes eligen simultáneamente al mismo técnico para la misma franja incompatible, **cuando** ambas transacciones intentan confirmar, **entonces** solo una reserva se confirma y la otra informa conflicto sin doble ocupación.

#### HU-S04-07 · Reasignación y ruta dirigida

Como **cliente**, quiero **recibir alternativas cuando no hay respuesta**, para **continuar la búsqueda manteniendo mi decisión**.

**Traza:** HU-09, HU-10 → HU-S04-07 → TC-051, TC-052.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-07-01 | Datos/contrato: Preparar o ampliar generación/rondas históricas; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S04-05, HU-S03-05 |
| BT-S04-07-02 | Backend: Implementar Dominio: ExpireOfferRound y ruta automática/directa | 5 | Must | BT-S04-07-01 |
| BT-S04-07-03 | Frontend/integración: Construir y conectar alternativas requieren autorización en ruta directa | 2 | Must | BT-S04-07-02 |
| BT-S04-07-04 | Pruebas y evidencia: Implementar y ejecutar TC-051 (Siguiente ronda única), TC-052 (Fallo de solicitud directa); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S04-07-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-16, RF-17; RNF-07, RNF-09, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-07-01 / TC-051: Dado** tres ofertas sin aceptación vencidas y otros tres candidatos válidos, **cuando** se ejecuta dos veces el job de expiración, **entonces** se abre una sola nueva ronda de hasta tres ofertas y se conserva el historial.
- **AC-S04-07-02 / TC-052: Dado** una solicitud desde perfil cuyo único técnico no respondió dentro del SLA, **cuando** vence su oferta, **entonces** se ofrecen alternativas al cliente y no se contacta ni asigna a otro técnico sin su autorización.

#### HU-S04-08 · Pendiente durante 24 horas

Como **cliente**, quiero **conocer el resultado cuando no hay técnicos disponibles**, para **evitar una espera indefinida**.

**Traza:** HU-11 → HU-S04-08 → TC-053, TC-054.

**Condiciones específicas de pruebas:** P12 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-08-01 | Datos/contrato: Preparar o ampliar pendienteVenceEn estable y generación; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S04-07 |
| BT-S04-08-02 | Backend: Implementar dominio: RetryPendingMatching/ExpirePendingRequest | 3 | Must | BT-S04-08-01 |
| BT-S04-08-03 | Frontend/integración: Construir y conectar aviso/fecha límite | 2 | Must | BT-S04-08-02 |
| BT-S04-08-04 | Pruebas y evidencia: Implementar y ejecutar TC-053 (Agotamiento de candidatos), TC-054 (Expiración idempotente); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S04-08-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-14; RNF-07, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-08-01 / TC-053: Dado** una solicitud sin candidatos elegibles en ninguna ronda restante, **cuando** termina la búsqueda, **entonces** queda Pendiente de disponibilidad con su fecha límite de 24 horas registrada.
- **AC-S04-08-02 / TC-054: Dado** una solicitud aún pendiente que alcanzó su límite de 24 horas, **cuando** se repite el job de expiración, **entonces** se registra una sola transición a Expirada sin renovar el límite ni abrir nuevas rondas. Condicionado a P12.

#### HU-S04-09 · Tiempo real y recuperación

Como **usuario autorizado**, quiero **recibir cambios sin perder el estado tras desconexión**, para **seguir la solicitud de forma consistente**.

**Traza:** HU-20 → HU-S04-09 → TC-055, TC-056.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-09-01 | Datos/contrato: Preparar o ampliar el contrato y fixtures de tiempo real y recuperación; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S04-04, HU-S04-05, BT-BASE-04 |
| BT-S04-09-02 | Backend: Implementar API: canales privados; infraestructura: Reverb real y outbox | 3 | Must | BT-S04-09-01 |
| BT-S04-09-03 | Frontend/integración: Construir y conectar Echo con event_id/version y recuperación API | 3 | Must | BT-S04-09-02 |
| BT-S04-09-04 | Pruebas y evidencia: Implementar y ejecutar TC-055 (Evento repetido tras reconexión), TC-056 (Canal ajeno denegado); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S04-09-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-29; RNF-03, RNF-09, RNF-10, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-09-01 / TC-055: Dado** un cliente autorizado reconecta y recibe dos copias del mismo evento confirmado, **cuando** Echo procesa ambas y consulta el estado actual, **entonces** muestra una sola notificación lógica y la versión vigente.
- **AC-S04-09-02 / TC-056: Dado** un cliente sin relación con una solicitud, **cuando** intenta suscribirse a su canal privado, **entonces** Laravel deniega la autorización y no recibe eventos privados.

#### HU-S04-10 · Entrega y reintentos controlados

Como **operador del entorno de prueba**, quiero **recuperar entregas fallidas sin duplicarlas**, para **mantener trazabilidad de las ofertas**.

**Traza:** HU-09, HU-20 → HU-S04-10 → TC-057, TC-058.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S04-10-01 | Datos: Persistir intentos, evento lógico y límite de reintentos reutilizando outbox | 2 | Must | HU-S04-04, BT-BASE-04 |
| BT-S04-10-02 | Backend: Implementar entrega sandbox, recuperación y descarte de generación obsoleta sin extender SLA | 3 | Must | BT-S04-10-01 |
| BT-S04-10-03 | Integración: Conectar el sender a worker-delivery y registrar fallos útiles para operación; sin panel adicional | 1 | Must | BT-S04-10-02 |
| BT-S04-10-04 | Pruebas: Automatizar caída permanente, límite de tres reintentos, duplicados y ejecución de job antiguo | 3 | Must | BT-S04-10-03 |

Todas las tareas anteriores pertenecen a **EP-04, Sprint 4** y trazan a **RF-15, RF-29; RNF-07; RNF-07, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S04-10-01 / TC-057: Dado** una notificación sandbox cuya entrega falla siempre, **cuando** se ejecuta el intento inicial y hasta tres reintentos configurados, **entonces** se registra fallo definitivo sin un cuarto reintento y sin extender el SLA de la oferta.
- **AC-S04-10-02 / TC-058: Dado** una solicitud cuya generación cambió tras una operación confirmada, **cuando** se ejecuta un job de ronda con generación anterior, **entonces** no altera la generación vigente ni crea ofertas obsoletas.

### Sprint 5 · Atención, agenda y seguimiento

**Épica:** EP-05. **Objetivo:** Permitir ejecutar y seguir cada atención desde la asignación hasta su reporte final, preservando acuerdos de horario, privacidad y la independencia de cada participante.

**Alcance aprobado:** RF-19 a RF-22; estados del servicio, Iniciar atención y Finalizar servicio, agenda técnica, reprogramación, coordinación de varios técnicos, línea de tiempo y WhatsApp tras asignación, cancelación.

**Total:** 79 puntos agregados de 28 tareas. **Dependencias del incremento:** Requiere asignaciones, reservas mínimas, eventos y reloj del Sprint 4. El Sprint 5 persiste completed_at y rating_due_at; la interfaz de calificación y su vencimiento se completan en Sprint 6. La reasignación automática consume el mecanismo del Sprint 4; la manual permanece en Sprint 7.

**Decisiones del sprint:** P05/P16 franjas y duraciones; P06 máximo de reprogramaciones; P13 aceptación y cierre global de dos técnicos; P14 cancelación/reprogramación en casos límite. No activar coordinación múltiple con reglas parciales sin resolver P13.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** HU-S05-01 → HU-S05-02 → HU-S05-03 → HU-S05-04 → HU-S05-05 → HU-S05-06 → HU-S05-07. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 5](sprints-01-08/CANVAS-Sprint-05.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S05-01 | Agenda personal | Must | 8 | HU-S04-06 | RF-19; RNF-03, RNF-09 |
| HU-S05-02 | Inicio y finalización | Must | 11 | HU-S04-06, HU-S05-01 | RF-19, RF-22; RNF-03, RNF-09, RNF-14 |
| HU-S05-03 | Reprogramación por acuerdo | Must | 16 | HU-S05-01 | RF-20; RNF-03, RNF-09, RNF-14 |
| HU-S05-04 | Técnico adicional autorizado | Must | 16 | HU-S05-02, HU-S04-07 | RF-21; RNF-09, RNF-11, RNF-14 |
| HU-S05-05 | Línea de tiempo y contacto | Must | 9 | HU-S04-06, HU-S04-09, HU-S05-02 | RF-19, RF-33; RNF-03, RNF-09 |
| HU-S05-06 | Cancelación del cliente | Must | 9 | HU-S04-06, HU-S05-02 | RF-19; RNF-09, RNF-14 |
| HU-S05-07 | Retiro e incidencia | Must | 10 | HU-S05-02, HU-S04-07 | RF-19, RF-20; RNF-09, RNF-14 |

#### HU-S05-01 · Agenda personal

Como **técnico**, quiero **ver mis citas en calendario y lista**, para **organizar las atenciones asignadas**.

**Traza:** HU-06, HU-12 → HU-S05-01 → TC-059, TC-060.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S05-01-01 | Datos/contrato: Preparar o ampliar appointments y participations vigentes; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S04-06 |
| BT-S05-01-02 | Backend: Implementar API: consultas por titular y rango | 2 | Must | BT-S05-01-01 |
| BT-S05-01-03 | Frontend/integración: Construir y conectar calendario/lista/filtros | 3 | Must | BT-S05-01-02 |
| BT-S05-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-059 (Citas propias), TC-060 (Agenda ajena); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S05-01-03 |

Todas las tareas anteriores pertenecen a **EP-05, Sprint 5** y trazan a **RF-19; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S05-01-01 / TC-059: Dado** dos técnicos con citas diferentes en un mismo día, **cuando** uno consulta su agenda en lista y calendario, **entonces** ambas vistas muestran solo sus citas y los mismos horarios locales.
- **AC-S05-01-02 / TC-060: Dado** un técnico sin permiso sobre otra cuenta, **cuando** manipula el filtro para obtener citas del otro técnico, **entonces** la API no devuelve ninguna cita privada ajena.

#### HU-S05-02 · Inicio y finalización

Como **técnico asignado**, quiero **registrar el inicio y el trabajo realizado**, para **dejar constancia verificable de mi atención**.

**Traza:** HU-15 → HU-S05-02 → TC-061, TC-062.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S05-02-01 | Datos/contrato: Preparar o ampliar reporte único, completed_at y rating_due_at; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S04-06, HU-S05-01 |
| BT-S05-02-02 | Backend: Implementar API: start/completion con versión | 3 | Must | BT-S05-02-01 |
| BT-S05-02-03 | Frontend/integración: Construir y conectar acciones según estado y reporte | 3 | Must | BT-S05-02-02 |
| BT-S05-02-04 | Pruebas y evidencia: Implementar y ejecutar TC-061 (Atención finalizada), TC-062 (Finalización repetida); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S05-02-03 |

Todas las tareas anteriores pertenecen a **EP-05, Sprint 5** y trazan a **RF-19, RF-22; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S05-02-01 / TC-061: Dado** una participación asignada al técnico autenticado, **cuando** inicia la atención y después finaliza con reporte válido, **entonces** queda finalizada con reporte y plazo de calificación a 48 horas del cierre individual, sin confirmación adicional del cliente.
- **AC-S05-02-02 / TC-062: Dado** una participación ya finalizada con reporte y fecha de cierre, **cuando** se repite el mismo comando de finalización, **entonces** no se duplica el reporte ni se renueva el plazo de calificación.

#### HU-S05-03 · Reprogramación por acuerdo

Como **cliente o técnico participante**, quiero **proponer un nuevo horario a la otra parte**, para **cambiar la cita solo por acuerdo**.

**Traza:** HU-13 → HU-S05-03 → TC-063, TC-064.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S05-03-01 | Datos/contrato: Preparar o ampliar anterior/propuesta/respuestas y nueva reserva atómica; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S05-01 |
| BT-S05-03-02 | Backend: Implementar dominio: validar franja y contraparte | 5 | Must | BT-S05-03-01 |
| BT-S05-03-03 | Frontend/integración: Construir y conectar propuesta/respuesta | 3 | Must | BT-S05-03-02 |
| BT-S05-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-063 (Aceptación por contraparte), TC-064 (Propuesta sin respuesta); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S05-03-03 |

Todas las tareas anteriores pertenecen a **EP-05, Sprint 5** y trazan a **RF-20; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S05-03-01 / TC-063: Dado** una cita vigente y una propuesta de nueva franja libre, **cuando** la contraparte acepta dentro del plazo, **entonces** se libera la reserva anterior y se confirma la nueva en la misma transacción.
- **AC-S05-03-02 / TC-064: Dado** una propuesta pendiente durante 24 horas y una cita original futura, **cuando** el scheduler vence la propuesta, **entonces** la propuesta queda vencida y se mantiene la cita original sin nueva reserva.

#### HU-S05-04 · Técnico adicional autorizado

Como **cliente**, quiero **autorizar un segundo técnico propuesto**, para **coordinar un servicio que requiere apoyo**.

**Traza:** HU-14 → HU-S05-04 → TC-065, TC-066.

**Condiciones específicas de pruebas:** P13 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S05-04-01 | Datos/contrato: Preparar o ampliar additional_technician_proposals y participaciones distintas; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S05-02, HU-S04-07 |
| BT-S05-04-02 | Backend: Implementar dominio: cupo y aceptación técnica | 5 | Must | BT-S05-04-01 |
| BT-S05-04-03 | Frontend/integración: Construir y conectar propuesta del principal/decisión del cliente | 3 | Must | BT-S05-04-02 |
| BT-S05-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-065 (Finalizaciones independientes), TC-066 (Tercer participante vigente); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S05-04-03 |

Todas las tareas anteriores pertenecen a **EP-05, Sprint 5** y trazan a **RF-21; RNF-09, RNF-11, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S05-04-01 / TC-065: Dado** una solicitud con principal y adicional autorizados y en atención, **cuando** el principal registra su finalización, **entonces** solo su participación finaliza y abre su plazo; el adicional continúa en atención. Condicionado a P13.
- **AC-S05-04-02 / TC-066: Dado** una solicitud con principal y adicional vigentes, **cuando** se propone incorporar un tercer técnico simultáneo, **entonces** el sistema rechaza la incorporación y conserva las dos participaciones existentes.

#### HU-S05-05 · Línea de tiempo y contacto

Como **cliente titular**, quiero **seguir la atención y acceder al contacto cuando corresponda**, para **coordinar con el técnico asignado**.

**Traza:** HU-12, HU-24 → HU-S05-05 → TC-067, TC-068.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S05-05-01 | Datos/contrato: Preparar o ampliar request_events sin exposición de motivos administrativos privados; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S04-06, HU-S04-09, HU-S05-02 |
| BT-S05-05-02 | Backend: Implementar API: proyecciones según estado y relación | 2 | Must | BT-S05-05-01 |
| BT-S05-05-03 | Frontend/integración: Construir y conectar timeline y enlace WhatsApp | 3 | Must | BT-S05-05-02 |
| BT-S05-05-04 | Pruebas y evidencia: Implementar y ejecutar TC-067 (Contacto tras asignación), TC-068 (Contacto antes de asignación); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S05-05-03 |

Todas las tareas anteriores pertenecen a **EP-05, Sprint 5** y trazan a **RF-19, RF-33; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S05-05-01 / TC-067: Dado** un cliente titular de una solicitud recién asignada, **cuando** abre su detalle, **entonces** ve la línea de tiempo autorizada y el WhatsApp del técnico asignado.
- **AC-S05-05-02 / TC-068: Dado** una oferta aceptada pero aún no elegida por el cliente, **cuando** se consulta el detalle permitido, **entonces** no se revela todavía el WhatsApp ni la dirección exacta al técnico.

#### HU-S05-06 · Cancelación del cliente

Como **cliente**, quiero **cancelar antes de iniciarse la atención**, para **detener una solicitud que ya no necesito**.

**Traza:** HU-12 → HU-S05-06 → TC-069, TC-070.

**Condiciones específicas de pruebas:** P14 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S05-06-01 | Datos/contrato: Preparar o ampliar evento de cancelación sin borrado de solicitud; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S04-06, HU-S05-02 |
| BT-S05-06-02 | Backend: Implementar dominio: transición permitida y reservas | 3 | Must | BT-S05-06-01 |
| BT-S05-06-03 | Frontend/integración: Construir y conectar motivo/confirmación | 2 | Must | BT-S05-06-02 |
| BT-S05-06-04 | Pruebas y evidencia: Implementar y ejecutar TC-069 (Cancelación antes de atender), TC-070 (Cancelación durante atención); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S05-06-03 |

Todas las tareas anteriores pertenecen a **EP-05, Sprint 5** y trazan a **RF-19; RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S05-06-01 / TC-069: Dado** una solicitud Asignada cuya atención no ha empezado, **cuando** el titular confirma cancelar con motivo, **entonces** queda Cancelada, se liberan las reservas aplicables y se conserva el historial. Condicionado a P14.
- **AC-S05-06-02 / TC-070: Dado** una solicitud con atención ya iniciada, **cuando** el cliente usa la cancelación ordinaria previa a atención, **entonces** la API informa conflicto y no marca la solicitud como cancelada.

#### HU-S05-07 · Retiro e incidencia

Como **técnico o cliente afectado**, quiero **registrar impedimentos e inasistencias**, para **permitir una respuesta trazable**.

**Traza:** HU-13 → HU-S05-07 → TC-071, TC-072.

**Condiciones específicas de pruebas:** P14 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S05-07-01 | Datos/contrato: Preparar o ampliar incidents y vínculo a reasignación; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S05-02, HU-S04-07 |
| BT-S05-07-02 | Backend: Implementar aplicación: diferencia retiro confirmado de denuncia | 3 | Must | BT-S05-07-01 |
| BT-S05-07-03 | Frontend/integración: Construir y conectar retiro con motivo/reportar incidencia | 2 | Must | BT-S05-07-02 |
| BT-S05-07-04 | Pruebas y evidencia: Implementar y ejecutar TC-071 (Retiro del técnico asignado), TC-072 (Reporte de inasistencia); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S05-07-03 |

Todas las tareas anteriores pertenecen a **EP-05, Sprint 5** y trazan a **RF-19, RF-20; RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S05-07-01 / TC-071: Dado** un técnico asignado antes de atención y una política de retiro aprobada, **cuando** registra su retiro con motivo, **entonces** se conserva la incidencia y se inicia la reasignación aplicable sin perder la participación anterior. Condicionado a P14.
- **AC-S05-07-02 / TC-072: Dado** un cliente reporta que el técnico no asistió, **cuando** se registra el reporte, **entonces** queda una incidencia para revisión y no se suspende ni reemplaza automáticamente por la sola denuncia.

### Sprint 6 · Calificación, historial y apelaciones

**Épica:** EP-06. **Objetivo:** Cerrar el ciclo de cada participación con una evaluación versionada y mecanismos de revisión, ofreciendo un historial confiable y criterios transparentes de asignación.

**Alcance aprobado:** RF-23 a RF-27; calificación en 48 h y edición, cierre sin calificar, reseñas públicas, historial, calificaciones recibidas, apelación y resolución administrativa, criterios de matching visibles.

**Total:** 78 puntos agregados de 28 tareas. **Dependencias del incremento:** Depende de reportes/fechas individuales del Sprint 5 y matching versionado del Sprint 4. La pantalla administrativa de apelaciones se entrega aquí; no se retrasa hasta completar el panel en Sprint 7. Promedios válidos alimentan las nuevas evaluaciones, sin recalcular rankings históricos.

**Decisiones del sprint:** P07 plazo de apelación, calendario y efectos de anulación; P13 cierre global con dos técnicos; P17 moderación/respuestas; P23 anclaje de edición. Las 48 h desde primera calificación sin reinicio son propuesta pendiente de ratificación.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** HU-S06-01 → HU-S06-02 → HU-S06-03 → HU-S06-05 → HU-S06-06 → HU-S06-07 → HU-S06-04. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 6](sprints-01-08/CANVAS-Sprint-06.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S06-01 | Calificar mi atención | Must | 11 | HU-S05-02 | RF-23; RNF-03, RNF-09, RNF-12, RNF-14 |
| HU-S06-02 | Editar conservando versiones | Must | 10 | HU-S06-01 | RF-23; RNF-09, RNF-12, RNF-14 |
| HU-S06-03 | Cerrar sin calificar | Must | 9 | HU-S06-01, HU-S05-04, BT-BASE-04 | RF-24; RNF-09, RNF-12 |
| HU-S06-04 | Reseñas y respuestas públicas | Should | 11 | HU-S06-01, HU-S06-02 | RF-23, RF-25; RNF-03, RNF-09, RNF-12 |
| HU-S06-05 | Apelar una calificación | Must | 12 | HU-S06-02, BT-BASE-02 | RF-26; RNF-09, RNF-12, RNF-14 |
| HU-S06-06 | Resolución motivada | Must | 16 | HU-S06-05 | RF-26, RF-33; RNF-09, RNF-12, RNF-14 |
| HU-S06-07 | Historial y criterios transparentes | Must | 9 | HU-S06-01, HU-S04-03 | RF-25, RF-27; RNF-03, RNF-09 |

#### HU-S06-01 · Calificar mi atención

Como **cliente**, quiero **calificar de 1 a 5 con comentario**, para **compartir mi experiencia tras la atención**.

**Traza:** HU-16 → HU-S06-01 → TC-073, TC-074.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S06-01-01 | Datos/contrato: Preparar o ampliar calificación única y primera versión; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S05-02 |
| BT-S06-01-02 | Backend: Implementar API: dueño y ventana | 3 | Must | BT-S06-01-01 |
| BT-S06-01-03 | Frontend/integración: Construir y conectar aviso/formulario | 3 | Must | BT-S06-01-02 |
| BT-S06-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-073 (Envío en ventana válida), TC-074 (Nota fuera de rango); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S06-01-03 |

Todas las tareas anteriores pertenecen a **EP-06, Sprint 6** y trazan a **RF-23; RNF-03, RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S06-01-01 / TC-073: Dado** mi participación finalizó hace 24 horas y no tiene calificación, **cuando** envío puntaje 4 y comentario válido, **entonces** se registra una calificación con su primera versión y se marca la participación como calificada.
- **AC-S06-01-02 / TC-074: Dado** una participación propia dentro de la ventana, **cuando** envío puntaje 6, **entonces** la API rechaza el valor sin crear calificación.

#### HU-S06-02 · Editar conservando versiones

Como **cliente autor**, quiero **corregir mi calificación dentro del plazo permitido**, para **ajustar mi opinión manteniendo el historial**.

**Traza:** HU-16 → HU-S06-02 → TC-075, TC-076.

**Condiciones específicas de pruebas:** P23 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S06-02-01 | Datos/contrato: Preparar o ampliar rating_versions y fecha inicial inmutable; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S06-01 |
| BT-S06-02-02 | Backend: Implementar dominio: editar con versión/Clock | 3 | Must | BT-S06-02-01 |
| BT-S06-02-03 | Frontend/integración: Construir y conectar editar con límite visible | 2 | Must | BT-S06-02-02 |
| BT-S06-02-04 | Pruebas y evidencia: Implementar y ejecutar TC-075 (Edición no renueva plazo), TC-076 (Edición vencida); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S06-02-03 |

Todas las tareas anteriores pertenecen a **EP-06, Sprint 6** y trazan a **RF-23; RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S06-02-01 / TC-075: Dado** una calificación creada hace 12 horas y política P23 ratificada, **cuando** su autor edita nota y comentario, **entonces** se agrega una versión y el límite sigue a 48 horas de la primera calificación. Condicionado a P23.
- **AC-S06-02-02 / TC-076: Dado** una calificación cuya ventana de edición ya terminó, **cuando** su autor intenta editar, **entonces** se rechaza sin nueva versión ni cambio del promedio.

#### HU-S06-03 · Cerrar sin calificar

Como **cliente**, quiero **ver el cierre cuando no califico a tiempo**, para **tener un estado final claro**.

**Traza:** HU-15 → HU-S06-03 → TC-077, TC-078.

**Condiciones específicas de pruebas:** P12, P13 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S06-03-01 | Datos/contrato: Preparar o ampliar rating_status independiente por participación; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S06-01, HU-S05-04, BT-BASE-04 |
| BT-S06-03-02 | Backend: Implementar Aplicación: job CloseUnratedParticipation | 3 | Must | BT-S06-03-01 |
| BT-S06-03-03 | Frontend/integración: Construir y conectar estado final | 2 | Must | BT-S06-03-02 |
| BT-S06-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-077 (Vencimiento individual), TC-078 (Ya fue calificada); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S06-03-03 |

Todas las tareas anteriores pertenecen a **EP-06, Sprint 6** y trazan a **RF-24; RNF-09, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S06-03-01 / TC-077: Dado** una participación finalizada sin nota que alcanzó su plazo de 48 horas, **cuando** se ejecuta dos veces el job de cierre, **entonces** queda Sin calificar una sola vez sin crear una nota automática ni afectar otra participación. Condicionado a P12, P13.
- **AC-S06-03-02 / TC-078: Dado** una participación calificada válidamente antes del vencimiento, **cuando** se ejecuta después un job atrasado de cierre sin calificar, **entonces** se conserva la calificación y no cambia a Sin calificar.

#### HU-S06-04 · Reseñas y respuestas públicas

Como **técnico**, quiero **ver mis reseñas y responder de forma identificada**, para **dar contexto a mis futuros clientes**.

**Traza:** HU-16, HU-18 → HU-S06-04 → TC-079, TC-080.

**Condiciones específicas de pruebas:** P07 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S06-04-01 | Datos/contrato: Preparar o ampliar ratings válidas y rating_replies según política; reutilizar esquema compartido y versionar cambios necesarios | 2 | Should | HU-S06-01, HU-S06-02 |
| BT-S06-04-02 | Backend: Implementar API: técnico afectado y texto seguro | 3 | Should | BT-S06-04-01 |
| BT-S06-04-03 | Frontend/integración: Construir y conectar reseñas/promedio/respuesta | 3 | Should | BT-S06-04-02 |
| BT-S06-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-079 (Promedio real), TC-080 (Texto no ejecutable); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Should | BT-S06-04-03 |

Todas las tareas anteriores pertenecen a **EP-06, Sprint 6** y trazan a **RF-23, RF-25; RNF-03, RNF-09, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S06-04-01 / TC-079: Dado** un técnico tiene dos calificaciones activas de 4 y 5 y una anulada de 1, **cuando** se consulta el promedio bajo política aprobada de excluir anuladas, **entonces** se muestra 4.5 calculado solo de las dos notas activas. Condicionado a P07.
- **AC-S06-04-02 / TC-080: Dado** una respuesta de reseña contiene etiquetas de script, **cuando** se muestra la respuesta en el perfil público, **entonces** el contenido no se ejecuta como código en el navegador.

#### HU-S06-05 · Apelar una calificación

Como **técnico afectado**, quiero **presentar una apelación con motivo y evidencia**, para **solicitar revisión sin cambiar la nota por mi cuenta**.

**Traza:** HU-17 → HU-S06-05 → TC-081, TC-082.

**Condiciones específicas de pruebas:** P07, P17 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S06-05-01 | Datos/contrato: Preparar o ampliar rating_appeals y versión cuestionada; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S06-02, BT-BASE-02 |
| BT-S06-05-02 | Backend: Implementar API: titular, plazo y política de duplicados | 3 | Must | BT-S06-05-01 |
| BT-S06-05-03 | Frontend/integración: Construir y conectar motivo/evidencia/estado | 3 | Must | BT-S06-05-02 |
| BT-S06-05-04 | Pruebas y evidencia: Implementar y ejecutar TC-081 (Apelación admitida), TC-082 (Apelación ajena); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S06-05-03 |

Todas las tareas anteriores pertenecen a **EP-06, Sprint 6** y trazan a **RF-26; RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S06-05-01 / TC-081: Dado** una reseña propia dentro del plazo de apelación ratificado, **cuando** el técnico presenta motivo y evidencia permitidos, **entonces** se crea una apelación vinculada a la versión de la reseña sin modificar su nota. Condicionado a P07, P17.
- **AC-S06-05-02 / TC-082: Dado** un técnico intenta apelar la reseña de otro prestador, **cuando** envía el identificador de esa calificación, **entonces** la API deniega y no crea apelación.

#### HU-S06-06 · Resolución motivada

Como **administrador resolutor**, quiero **mantener, ajustar o anular una calificación con motivo**, para **resolver disputas dejando evidencia**.

**Traza:** HU-17, HU-28 → HU-S06-06 → TC-083, TC-084.

**Condiciones específicas de pruebas:** P07 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S06-06-01 | Datos/contrato: Preparar o ampliar rating_resolutions y versiones; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S06-05 |
| BT-S06-06-02 | Backend: Implementar aplicación: transacción, auditoría y recálculo | 5 | Must | BT-S06-06-01 |
| BT-S06-06-03 | Frontend/integración: Construir y conectar comparar versión/revisar/decidir | 3 | Must | BT-S06-06-02 |
| BT-S06-06-04 | Pruebas y evidencia: Implementar y ejecutar TC-083 (Resolución válida), TC-084 (Reseña cambió al resolver); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S06-06-03 |

Todas las tareas anteriores pertenecen a **EP-06, Sprint 6** y trazan a **RF-26, RF-33; RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S06-06-01 / TC-083: Dado** una apelación abierta y la versión vigente revisada por un administrador autorizado, **cuando** resuelve mantener, ajustar o anular con motivo obligatorio, **entonces** se conserva la decisión y las versiones correspondientes con auditoría y se actualizan agregados según política aprobada. Condicionado a P07.
- **AC-S06-06-02 / TC-084: Dado** el administrador cargó una versión que el cliente editó después, **cuando** intenta resolver usando la versión anterior, **entonces** recibe conflicto y debe revisar la versión vigente sin sobrescribirla.

#### HU-S06-07 · Historial y criterios transparentes

Como **cliente o técnico**, quiero **consultar mi historial y los criterios que me corresponden**, para **comprender los servicios y el proceso de selección**.

**Traza:** HU-18, HU-19 → HU-S06-07 → TC-085, TC-086.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S06-07-01 | Datos/contrato: Preparar o ampliar joins de historial y versión de reglas aplicada; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S06-01, HU-S04-03 |
| BT-S06-07-02 | Backend: Implementar API: proyecciones por rol | 3 | Must | BT-S06-07-01 |
| BT-S06-07-03 | Frontend/integración: Construir y conectar filtros por estado/fecha y pantalla criterios | 3 | Must | BT-S06-07-02 |
| BT-S06-07-04 | Pruebas y evidencia: Implementar y ejecutar TC-085 (Historial propio filtrado), TC-086 (Criterios sin datos de competidores); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Must | BT-S06-07-03 |

Todas las tareas anteriores pertenecen a **EP-06, Sprint 6** y trazan a **RF-25, RF-27; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S06-07-01 / TC-085: Dado** un usuario con participaciones de distintos estados y periodos, **cuando** consulta su historial con filtros, **entonces** recibe únicamente sus registros coincidentes y sus calificaciones vinculadas.
- **AC-S06-07-02 / TC-086: Dado** un técnico autenticado consulta criterios de matching, **cuando** se devuelve la explicación, **entonces** ve pesos, elegibilidad y tratamiento sin historial sin direcciones, documentos ni puntajes privados de otros técnicos.

### Sprint 7 · Panel administrador completo

**Épica:** EP-07. **Objetivo:** Completar la supervisión operativa y el gobierno de parámetros y accesos, permitiendo intervenciones justificadas y reportes verificables sin alterar el historial.

**Alcance aprobado:** RF-30 y RF-31; dashboard con métricas, gráficos y alertas; solicitudes con reasignación manual; clientes, soporte y bloqueo; reglas editables con historial; exportación Excel/PDF; cuentas de administrador y auditoría.

**Total:** 90 puntos agregados de 28 tareas. **Dependencias del incremento:** Consume los ciclos y datos de Sprints 1–6. Reutiliza catálogo/verificación/comunicados de Sprint 2 y apelaciones de Sprint 6. Backend y bandeja de soporte administrativo se completan aquí con tickets sintéticos; el acceso de ayuda/soporte del cliente y técnico se integra en Sprint 8.

**Decisiones del sprint:** P18 efectos de bloqueo/suspensión sobre sesiones y servicios abiertos; P19 aplicación temporal de cambios; P21 fórmulas de dashboard y alertas, criterios de exportación y capacidad. Definir protección del último administrador responsable sin añadir un cuarto rol.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** HU-S07-02 → HU-S07-03 → HU-S07-05 → HU-S07-07 → HU-S07-01 → HU-S07-04 → HU-S07-06. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 7](sprints-01-08/CANVAS-Sprint-07.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S07-01 | Dashboard y alertas | Should | 13 | HU-S04-08, HU-S05-02, HU-S06-01 | RF-30; RNF-03, RNF-09 |
| HU-S07-02 | Reasignación manual controlada | Must | 15 | HU-S04-06, HU-S04-07, HU-S05-07 | RF-30, RF-33; RNF-09, RNF-12, RNF-14 |
| HU-S07-03 | Clientes y bloqueos | Must | 11 | HU-S01-04, HU-S05-06 | RF-30, RF-33, RF-C12; RNF-09, RNF-14 |
| HU-S07-04 | Soporte administrativo | Should | 10 | HU-S01-04, HU-S03-06 | RF-30, RF-C07; RNF-03, RNF-09, RNF-14 |
| HU-S07-05 | Reglas e historial | Must | 14 | HU-S04-02, HU-S04-08 | RF-C03, RF-30; RNF-09, RNF-12, RNF-14 |
| HU-S07-06 | Reportes Excel y PDF | Should | 13 | HU-S07-01, HU-S04-10 | RF-31; RNF-03, RNF-09, RNF-14 |
| HU-S07-07 | Administradores y auditoría | Must | 14 | HU-S01-04, HU-S07-02, HU-S07-03, HU-S07-05 | RF-C05, RF-33; RNF-09, RNF-11, RNF-14 |

#### HU-S07-01 · Dashboard y alertas

Como **administrador supervisor**, quiero **consultar métricas por periodo, especialidad y zona**, para **identificar trabajo pendiente y problemas de atención**.

**Traza:** HU-21 → HU-S07-01 → TC-087, TC-088.

**Condiciones específicas de pruebas:** P21 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S07-01-01 | Datos/contrato: Preparar o ampliar fixture con resultados manualmente calculados y fórmula aprobada; reutilizar esquema compartido y versionar cambios necesarios | 2 | Should | HU-S04-08, HU-S05-02, HU-S06-01 |
| BT-S07-01-02 | Backend: Implementar API: agregaciones con filtros | 3 | Should | BT-S07-01-01 |
| BT-S07-01-03 | Frontend/integración: Construir y conectar tarjetas/gráficos/alertas | 5 | Should | BT-S07-01-02 |
| BT-S07-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-087 (Métricas reproducibles), TC-088 (Pendiente mayor de 20 horas); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Should | BT-S07-01-03 |

Todas las tareas anteriores pertenecen a **EP-07, Sprint 7** y trazan a **RF-30; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S07-01-01 / TC-087: Dado** un dataset sintético con conteos esperados y definición de cumplimiento de SLA aprobada, **cuando** el administrador aplica filtros de fecha y especialidad, **entonces** tarjetas y gráficos coinciden con los resultados esperados del mismo conjunto. Condicionado a P21.
- **AC-S07-01-02 / TC-088: Dado** una solicitud pendiente de 21 horas y otra de 19 horas, **cuando** se consulta el panel de alertas, **entonces** solo la primera aparece en la alerta de pendientes de más de 20 horas.

#### HU-S07-02 · Reasignación manual controlada

Como **administrador con permiso de reasignación**, quiero **intervenir una solicitud con motivo**, para **resolver incidencias conservando trazabilidad**.

**Traza:** HU-21, HU-28 → HU-S07-02 → TC-089, TC-090.

**Condiciones específicas de pruebas:** P11, P14 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S07-02-01 | Datos/contrato: Preparar o ampliar intervención, participación anterior y auditoría; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S04-06, HU-S04-07, HU-S05-07 |
| BT-S07-02-02 | Backend: Implementar aplicación: nuevo intento y generación mediante módulo dueño | 5 | Must | BT-S07-02-01 |
| BT-S07-02-03 | Frontend/integración: Construir y conectar ficha/selección/revisión del motivo | 3 | Must | BT-S07-02-02 |
| BT-S07-02-04 | Pruebas y evidencia: Implementar y ejecutar TC-089 (Intervención válida), TC-090 (Sin permiso de reasignación); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S07-02-03 |

Todas las tareas anteriores pertenecen a **EP-07, Sprint 7** y trazan a **RF-30, RF-33; RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S07-02-01 / TC-089: Dado** una solicitud reasignable, un reemplazo elegible y política de respuesta aprobada, **cuando** el administrador autorizado solicita reasignación con motivo y versión vigente, **entonces** se registra la intervención y nueva generación con ofertas autorizadas, sin forzar asignación ni borrar al técnico anterior. Condicionado a P11, P14.
- **AC-S07-02-02 / TC-090: Dado** un administrador que no tiene requests.reassign, **cuando** invoca la operación manual, **entonces** recibe 403 y no cambian solicitud, ofertas ni participantes.

#### HU-S07-03 · Clientes y bloqueos

Como **administrador autorizado**, quiero **revisar historial y bloquear o desbloquear con motivo**, para **controlar abusos conforme una política conocida**.

**Traza:** HU-21, HU-28 → HU-S07-03 → TC-091, TC-092.

**Condiciones específicas de pruebas:** P18 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S07-03-01 | Datos/contrato: Preparar o ampliar client_blocks e historial sin borrado; reutilizar esquema compartido y versionar cambios necesarios | 2 | Must | HU-S01-04, HU-S05-06 |
| BT-S07-03-02 | Backend: Implementar aplicación: acceso de cuenta y efectos aprobados | 3 | Must | BT-S07-03-01 |
| BT-S07-03-03 | Frontend/integración: Construir y conectar ficha/listado y acciones motivadas | 3 | Must | BT-S07-03-02 |
| BT-S07-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-091 (Bloqueo conforme política), TC-092 (Bloqueo sin motivo); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S07-03-03 |

Todas las tareas anteriores pertenecen a **EP-07, Sprint 7** y trazan a **RF-30, RF-33, RF-C12; RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S07-03-01 / TC-091: Dado** un cliente y una política de bloqueo/sesión ratificada, **cuando** el administrador autorizado registra un bloqueo con motivo, **entonces** se impiden las acciones definidas por esa política y se conserva historial de servicio y auditoría. Condicionado a P18.
- **AC-S07-03-02 / TC-092: Dado** un administrador autorizado selecciona un cliente, **cuando** solicita bloquearlo sin motivo, **entonces** se rechaza la operación sin cambiar acceso ni crear un bloqueo activo.

#### HU-S07-04 · Soporte administrativo

Como **administrador de soporte**, quiero **revisar y resolver tickets**, para **atender incidencias con seguimiento**.

**Traza:** HU-30 → HU-S07-04 → TC-093, TC-094.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S07-04-01 | Datos/contrato: Preparar o ampliar support_tickets/updates y acceso al contexto autorizado; reutilizar esquema compartido y versionar cambios necesarios | 2 | Should | HU-S01-04, HU-S03-06 |
| BT-S07-04-02 | Backend: Implementar API: permiso/versión | 3 | Should | BT-S07-04-01 |
| BT-S07-04-03 | Frontend/integración: Construir y conectar bandeja de tickets sintéticos y resolución | 3 | Should | BT-S07-04-02 |
| BT-S07-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-093 (Resolución de ticket), TC-094 (Resolución no autorizada); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Should | BT-S07-04-03 |

Todas las tareas anteriores pertenecen a **EP-07, Sprint 7** y trazan a **RF-30, RF-C07; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S07-04-01 / TC-093: Dado** un ticket sintético abierto y un administrador con permiso de soporte, **cuando** registra una resolución válida, **entonces** el ticket queda resuelto con autor, fecha y actualización de historial.
- **AC-S07-04-02 / TC-094: Dado** un usuario sin permiso de soporte administrativo, **cuando** intenta resolver un ticket, **entonces** la API deniega y el ticket permanece intacto.

#### HU-S07-05 · Reglas e historial

Como **administrador de reglas**, quiero **editar parámetros mediante nuevas versiones**, para **ajustar el negocio sin borrar decisiones previas**.

**Traza:** HU-26 → HU-S07-05 → TC-095, TC-096.

**Condiciones específicas de pruebas:** P19 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S07-05-01 | Datos/contrato: Preparar o ampliar versiones inmutables aplicadas al matching; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S04-02, HU-S04-08 |
| BT-S07-05-02 | Backend: Implementar dominio: validar y publicar | 5 | Must | BT-S07-05-01 |
| BT-S07-05-03 | Frontend/integración: Construir y conectar editor/rangos/suma/historial | 3 | Must | BT-S07-05-02 |
| BT-S07-05-04 | Pruebas y evidencia: Implementar y ejecutar TC-095 (Publicación de versión válida), TC-096 (Pesos que suman 95); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S07-05-03 |

Todas las tareas anteriores pertenecen a **EP-07, Sprint 7** y trazan a **RF-C03, RF-30; RNF-09, RNF-12, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S07-05-01 / TC-095: Dado** pesos 35, 20, 30 y 15 y plazos válidos con motivo, **cuando** el administrador publica una nueva versión bajo la política de vigencia acordada, **entonces** queda disponible la versión nueva y los rankings previos conservan la versión anterior. Condicionado a P19.
- **AC-S07-05-02 / TC-096: Dado** una configuración vigente correcta, **cuando** se intenta publicar pesos cuya suma es 95, **entonces** la API rechaza y mantiene intacta la configuración vigente.

#### HU-S07-06 · Reportes Excel y PDF

Como **administrador de reportes**, quiero **exportar cobertura y desempeño**, para **entregar información verificable**.

**Traza:** HU-22 → HU-S07-06 → TC-097, TC-098.

**Condiciones específicas de pruebas:** P21 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S07-06-01 | Datos/contrato: Preparar o ampliar operations/export_files privados y métricas coherentes; reutilizar esquema compartido y versionar cambios necesarios | 2 | Should | HU-S07-01, HU-S04-10 |
| BT-S07-06-02 | Backend: Implementar aplicación: job de exportación con autor | 5 | Should | BT-S07-06-01 |
| BT-S07-06-03 | Frontend/integración: Construir y conectar filtros/estado de operación/descarga | 3 | Should | BT-S07-06-02 |
| BT-S07-06-04 | Pruebas y evidencia: Implementar y ejecutar TC-097 (Exportaciones equivalentes), TC-098 (Descarga ajena); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Should | BT-S07-06-03 |

Todas las tareas anteriores pertenecen a **EP-07, Sprint 7** y trazan a **RF-31; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S07-06-01 / TC-097: Dado** un reporte con filtros y resultados esperados aprobados, **cuando** se generan sus exportaciones XLSX y PDF, **entonces** ambas contienen el mismo periodo, filtros y cifras que la consulta y quedan vinculadas a su operación. Condicionado a P21.
- **AC-S07-06-02 / TC-098: Dado** una exportación privada completada para un administrador, **cuando** otro usuario sin permiso intenta descargarla por identificador, **entonces** se deniega sin exponer el archivo ni una URL pública.

#### HU-S07-07 · Administradores y auditoría

Como **administrador responsable**, quiero **gestionar cuentas privilegiadas y revisar acciones sensibles**, para **mantener separación de funciones y rendición de cuentas**.

**Traza:** HU-28 → HU-S07-07 → TC-099, TC-100.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S07-07-01 | Datos/contrato: Preparar o ampliar concesiones y registros inmutables para operaciones ordinarias; reutilizar esquema compartido y versionar cambios necesarios | 1 | Must | HU-S01-04, HU-S07-02, HU-S07-03, HU-S07-05 |
| BT-S07-07-02 | Backend: Implementar API: admins.manage/audit.read y transacción | 5 | Must | BT-S07-07-01 |
| BT-S07-07-03 | Frontend/integración: Construir y conectar cuentas/permisos y auditoría de solo lectura | 3 | Must | BT-S07-07-02 |
| BT-S07-07-04 | Pruebas y evidencia: Implementar y ejecutar TC-099 (Alta por responsable), TC-100 (Fallo de auditoría); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 5 | Must | BT-S07-07-03 |

Todas las tareas anteriores pertenecen a **EP-07, Sprint 7** y trazan a **RF-C05, RF-33; RNF-09, RNF-11, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S07-07-01 / TC-099: Dado** un administrador con admins.manage y datos de una cuenta nueva, **cuando** crea otro administrador con permisos explícitos, **entonces** se crea la cuenta con esas concesiones y se registra quién autorizó el alta sin exponer su contraseña.
- **AC-S07-07-02 / TC-100: Dado** una acción administrativa sensible cuya escritura de auditoría falla, **cuando** se intenta confirmar su transacción, **entonces** se revierte todo el cambio de negocio y no se emite un evento de éxito.

### Sprint 8 · Pagos, notificaciones, endurecimiento y despliegue

**Épica:** EP-08. **Objetivo:** Integrar los recorridos finales y demostrar un MVP desplegable y verificable, con simulación económica inequívoca, controles de seguridad revisados y evidencias reales de calidad.

**Alcance aprobado:** RF-32; método de pago y comprobante simulado sin dinero real, historial y ganancias del técnico, preferencias de notificación, ayuda y soporte; endurecimiento; regresión y pruebas no funcionales; SonarQube con Quality Gate; despliegue en servidor.

**Total:** 109 puntos agregados de 36 tareas. **Dependencias del incremento:** Integra Sprints 1–7: participaciones/tarifas históricas, notificaciones desde Sprint 4 y soporte administrativo desde Sprint 7. No posponer aquí la seguridad básica: se endurecen controles ya construidos. Servidor de demostración académica, no operación comercial ni cobros reales.

**Decisiones del sprint:** P01 moneda; P02/P16 cálculo y procedencia de montos para ganancias simuladas y métodos; P08 retención/anonimización; P09 muestra/ventana de observación; P12 avisos obligatorios; P21 protocolo de carga, métricas de cobertura, defectos y fórmulas. El plan actual confirma historial/ganancias/comprobante simulados; no reactiva confirmación financiera ni validez tributaria de propuestas anteriores.

**Orden sugerido dentro del sprint, una vez disponibles las dependencias anteriores:** HU-S08-01 → HU-S08-02 → HU-S08-03 → HU-S08-04 → HU-S08-05 → HU-S08-06 → HU-S08-07 → HU-S08-08 → HU-S08-09. Las actividades independientes pueden prepararse en paralelo; cada HU se entrega con sus cuatro tareas.

**Fuente de criterios y DoD:** [CANVAS Sprint 8](sprints-01-08/CANVAS-Sprint-08.md).

| Historia | Título | MoSCoW | Puntos agregados | Dependencias | RF / RNF |
| --- | --- | --- | --- | --- | --- |
| HU-S08-01 | Métodos y comprobante simulado | Must | 12 | HU-S05-02, HU-S01-04 | RF-32, RF-C11; RNF-03, RNF-09, RNF-14 |
| HU-S08-02 | Historial y ganancias simuladas | Should | 9 | HU-S08-01, HU-S06-07 | RF-32, RF-C11; RNF-03, RNF-09 |
| HU-S08-03 | Preferencias y bandeja de avisos | Should | 10 | HU-S04-09, HU-S04-10 | RF-C09, RF-29; RNF-03, RNF-07, RNF-09 |
| HU-S08-04 | Ayuda y soporte de usuarios | Should | 8 | HU-S07-04, BT-BASE-02 | RF-C07; RNF-03, RNF-09 |
| HU-S08-05 | Regresión y endurecimiento | Must | 16 | HU-S08-01, HU-S08-02, HU-S08-03, HU-S08-04, HU-S07-07, HU-S06-06 | RF-33; RNF-08, RNF-09, RNF-10; RNF-08, RNF-09, RNF-10, RNF-11 |
| HU-S08-06 | Quality Gate y cobertura | Must | 10 | HU-S08-05 | RNF-11, RNF-12; RNF-11, RNF-12 |
| HU-S08-07 | Rendimiento y concurrencia | Must | 14 | HU-S08-05 | RNF-01, RNF-02; RNF-01, RNF-02, RNF-12 |
| HU-S08-08 | Usabilidad y beneficio académico | Must | 14 | HU-S08-05 | RNF-03, RNF-04, RNF-05; RNF-03, RNF-04, RNF-05 |
| HU-S08-09 | Despliegue, respaldo y recuperación | Must | 16 | HU-S08-06, HU-S08-07, HU-S08-08 | RNF-06, RNF-10, RNF-13, RNF-14; RNF-06, RNF-10, RNF-13, RNF-14 |

#### HU-S08-01 · Métodos y comprobante simulado

Como **cliente**, quiero **registrar un método y consultar una constancia simulada**, para **conservar el registro sin efectuar un pago real**.

**Traza:** HU-23 → HU-S08-01 → TC-101, TC-102.

**Condiciones específicas de pruebas:** P01, P02, P16 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-01-01 | Datos/contrato: Preparar o ampliar método por solicitud, registro y comprobante simulado por participación; reutilizar esquema compartido y versionar cambios necesarios | 3 | Must | HU-S05-02, HU-S01-04 |
| BT-S08-01-02 | Backend: Implementar API: propietario e idempotencia | 3 | Must | BT-S08-01-01 |
| BT-S08-01-03 | Frontend/integración: Construir y conectar selección/aviso/descarga | 3 | Must | BT-S08-01-02 |
| BT-S08-01-04 | Pruebas y evidencia: Implementar y ejecutar TC-101 (Constancia inequívoca), TC-102 (Comprobante ajeno); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Must | BT-S08-01-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RF-32, RF-C11; RNF-03, RNF-09, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-01-01 / TC-101: Dado** una participación propia con registro económico sintético permitido, **cuando** el cliente selecciona método y obtiene el comprobante, **entonces** la selección se conserva y el archivo dice simulado y sin validez tributaria sin iniciar un cobro. Condicionado a P01, P02, P16.
- **AC-S08-01-02 / TC-102: Dado** un comprobante privado de otro cliente, **cuando** se intenta descargar usando su identificador, **entonces** se deniega sin revelar montos ni archivo.

#### HU-S08-02 · Historial y ganancias simuladas

Como **técnico**, quiero **consultar el resumen económico simulado por periodo**, para **demostrar la trazabilidad de mis atenciones**.

**Traza:** HU-23, HU-18 → HU-S08-02 → TC-103, TC-104.

**Condiciones específicas de pruebas:** P02, P21 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-02-01 | Datos/contrato: Preparar o ampliar registros simulados sin mezclar tarifas actuales con importes históricos; reutilizar esquema compartido y versionar cambios necesarios | 1 | Should | HU-S08-01, HU-S06-07 |
| BT-S08-02-02 | Backend: Implementar API: fórmula y estados aprobados | 3 | Should | BT-S08-02-01 |
| BT-S08-02-03 | Frontend/integración: Construir y conectar totales/historial/exportación propia | 3 | Should | BT-S08-02-02 |
| BT-S08-02-04 | Pruebas y evidencia: Implementar y ejecutar TC-103 (Total conforme fórmula), TC-104 (Tarifa actual no cambia historial); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Should | BT-S08-02-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RF-32, RF-C11; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-02-01 / TC-103: Dado** registros sintéticos propios de 50 y 70 incluidos por la fórmula aprobada y otro de un tercero, **cuando** el técnico consulta su periodo, **entonces** el resumen muestra 120 como ganancia simulada y excluye al tercero. Condicionado a P02, P21.
- **AC-S08-02-02 / TC-104: Dado** una atención con importe simulado histórico 50 y tarifa actual actualizada a 80, **cuando** se consulta el historial de la atención, **entonces** se conserva el importe histórico 50 y no se presenta 80 como pago ocurrido.

#### HU-S08-03 · Preferencias y bandeja de avisos

Como **usuario**, quiero **elegir preferencias y revisar mis avisos**, para **recibir información según las opciones permitidas**.

**Traza:** HU-20 → HU-S08-03 → TC-105, TC-106.

**Condiciones específicas de pruebas:** P12 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-03-01 | Datos/contrato: Preparar o ampliar preferencias y entregas sandbox; reutilizar esquema compartido y versionar cambios necesarios | 2 | Should | HU-S04-09, HU-S04-10 |
| BT-S08-03-02 | Backend: Implementar API: dueño y avisos obligatorios | 3 | Should | BT-S08-03-01 |
| BT-S08-03-03 | Frontend/integración: Construir y conectar preferencias/bandeja/marcar leída | 2 | Should | BT-S08-03-02 |
| BT-S08-03-04 | Pruebas y evidencia: Implementar y ejecutar TC-105 (Preferencia opcional respetada), TC-106 (Aviso ajeno no editable); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 3 | Should | BT-S08-03-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RF-C09, RF-29; RNF-03, RNF-07, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-03-01 / TC-105: Dado** un usuario desactiva un canal opcional conforme política aprobada, **cuando** se genera una notificación opcional de ese canal, **entonces** no se entrega por el canal desactivado y se conserva el aviso interno aplicable. Condicionado a P12.
- **AC-S08-03-02 / TC-106: Dado** una notificación dirigida a otro usuario, **cuando** se intenta marcarla como leída por identificador, **entonces** la API deniega y su estado no cambia.

#### HU-S08-04 · Ayuda y soporte de usuarios

Como **cliente o técnico**, quiero **consultar ayuda y enviar un ticket propio**, para **recibir soporte sin un chat adicional**.

**Traza:** HU-30 → HU-S08-04 → TC-107, TC-108.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-04-01 | Datos/contrato: Preparar o ampliar tickets vinculados a la bandeja de Sprint 7; reutilizar esquema compartido y versionar cambios necesarios | 1 | Should | HU-S07-04, BT-BASE-02 |
| BT-S08-04-02 | Backend: Implementar API: /support-cases con propiedad de solicitud | 2 | Should | BT-S08-04-01 |
| BT-S08-04-03 | Frontend/integración: Construir y conectar FAQ, contacto institucional y formulario | 3 | Should | BT-S08-04-02 |
| BT-S08-04-04 | Pruebas y evidencia: Implementar y ejecutar TC-107 (Ticket integrado), TC-108 (Solicitud ajena en soporte); cubrir permisos y regresión afectada, actualizar trazas y registrar resultados reales | 2 | Should | BT-S08-04-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RF-C07; RNF-03, RNF-09**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-04-01 / TC-107: Dado** un cliente autenticado con una solicitud propia, **cuando** envía un ticket válido y soporte lo resuelve, **entonces** puede consultar su ticket y la resolución registrada en la bandeja administrativa.
- **AC-S08-04-02 / TC-108: Dado** un usuario conoce el identificador de una solicitud ajena, **cuando** lo adjunta como contexto de un ticket, **entonces** se deniega el vínculo y no se revela información de esa solicitud.

#### HU-S08-05 · Regresión y endurecimiento

Como **equipo**, quiero **verificar el sistema integrado y sus límites de acceso**, para **entregar un incremento sin regresiones conocidas críticas**.

**Traza:** HU-24, HU-28, HU-32 → HU-S08-05 → TC-109, TC-110.

**Condiciones específicas de pruebas:** Sin Pxx adicional en los casos de esta historia; revisar las decisiones generales del sprint. Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-05-01 | Preparación QA: Consolidar fixtures, matriz de abusos y regresión acumulada de los ocho sprints | 3 | Must | HU-S08-01, HU-S08-02, HU-S08-03, HU-S08-04, HU-S07-07, HU-S06-06 |
| BT-S08-05-02 | Seguridad: Revisar y corregir autorización, CSRF, archivos, XSS, secretos y configuración de ejecución | 5 | Must | BT-S08-05-01 |
| BT-S08-05-03 | Integración: Ejecutar recorridos completos por rol y comprobar persistencia, concurrencia y recuperación | 5 | Must | BT-S08-05-02 |
| BT-S08-05-04 | Evidencia: Registrar resultados y defectos, corregir/reprobar y vincular revisión al commit candidato | 3 | Must | BT-S08-05-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RF-33; RNF-08, RNF-09, RNF-10; RNF-08, RNF-09, RNF-10, RNF-11**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-05-01 / TC-109: Dado** un entorno integrado con cliente, técnico verificado y administrador de prueba, **cuando** se ejecuta solicitud, oferta, elección, atención, calificación y consulta administrativa, **entonces** cada etapa se persiste una sola vez y solo los roles autorizados pueden intervenir.
- **AC-S08-05-02 / TC-110: Dado** el artefacto candidato y la configuración del servidor de demostración, **cuando** se inspeccionan bundle, imagen, puertos, depuración y cookies bajo HTTPS, **entonces** no contienen secretos, MySQL no es público, debug está desactivado y la sesión usa protecciones acordadas.

#### HU-S08-06 · Quality Gate y cobertura

Como **equipo**, quiero **evaluar el código y las pruebas con una puerta de calidad**, para **impedir la entrega de una versión que incumpla controles acordados**.

**Traza:** HU-32 → HU-S08-06 → TC-111, TC-112.

**Condiciones específicas de pruebas:** P21 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-06-01 | Calidad: Definir alcance de cobertura y condiciones del Quality Gate según P21 | 2 | Must | HU-S08-05 |
| BT-S08-06-02 | CI: Integrar informes reales, scanner y acceso restringido a SonarQube | 3 | Must | BT-S08-06-01 |
| BT-S08-06-03 | Integración: Bloquear promoción si falla la puerta y publicar informes de cobertura por módulo | 3 | Must | BT-S08-06-02 |
| BT-S08-06-04 | Verificación: Ejecutar casos de gate aprobado/fallido y conservar configuración e informes identificables | 2 | Must | BT-S08-06-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RNF-11, RNF-12; RNF-11, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-06-01 / TC-111: Dado** un commit con suites obligatorias aprobadas e informes auténticos, **cuando** SonarQube evalúa los umbrales aprobados y cobertura del núcleo, **entonces** el pipeline solo habilita la entrega si el gate pasa y conserva métricas y alcance. Condicionado a P21.
- **AC-S08-06-02 / TC-112: Dado** un análisis cuya puerta de calidad falla, **cuando** el pipeline intenta continuar al despliegue, **entonces** se bloquea la promoción del artefacto y se conserva el motivo del fallo.

#### HU-S08-07 · Rendimiento y concurrencia

Como **equipo**, quiero **medir tiempos bajo carga representativa**, para **contrastar los objetivos con datos reproducibles**.

**Traza:** HU-32 → HU-S08-07 → TC-113, TC-114.

**Condiciones específicas de pruebas:** P16, P21 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-07-01 | Protocolo: Aprobar dataset, hardware, carga de 200 usuarios, duración y estadístico de aceptación | 3 | Must | HU-S08-05 |
| BT-S08-07-02 | Carga: Implementar escenarios de carga y medición de matching con herramienta por fijar | 5 | Must | BT-S08-07-01 |
| BT-S08-07-03 | Integridad: Verificar reservas, ofertas y estado de MySQL después de la carga concurrente | 3 | Must | BT-S08-07-02 |
| BT-S08-07-04 | Evidencia: Conservar distribución de tiempos, errores y cuellos de botella; reportar metas alcanzadas o fallidas | 3 | Must | BT-S08-07-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RNF-01, RNF-02; RNF-01, RNF-02, RNF-12**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-07-01 / TC-113: Dado** un servidor, dataset, mezcla de operaciones y estadístico temporal aprobados, **cuando** se ejecuta el protocolo con 200 usuarios concurrentes y solicitudes de matching, **entonces** se registra la distribución completa y se verifica matching ≤3 s bajo el criterio acordado sin ocultar errores. Condicionado a P21.
- **AC-S08-07-02 / TC-114: Dado** solicitudes concurrentes que compiten por franjas de técnicos de prueba, **cuando** se ejecuta la carga y se inspeccionan invariantes de MySQL, **entonces** no existen reservas incompatibles dobles ni ofertas activas por encima del límite. Condicionado a P16, P21.

#### HU-S08-08 · Usabilidad y beneficio académico

Como **asesor y equipo**, quiero **evaluar experiencia y tiempo de búsqueda**, para **contrastar los objetivos sin inventar resultados**.

**Traza:** HU-31, HU-32 → HU-S08-08 → TC-115, TC-116.

**Condiciones específicas de pruebas:** P09, P21 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-08-01 | Protocolo: Acordar participantes, consentimiento, escenarios, tamaños y navegadores de prueba | 3 | Must | HU-S08-05 |
| BT-S08-08-02 | Evaluación: Ejecutar estudio con participantes: cinco pasos, tiempo de solicitud, SUS y búsqueda comparada | 5 | Must | BT-S08-08-01 |
| BT-S08-08-03 | Compatibilidad: Verificar recorridos en Chrome, Edge y Firefox y móvil/escritorio con teclado | 3 | Must | BT-S08-08-02 |
| BT-S08-08-04 | Evidencia: Analizar medianas, SUS, fallos y limitaciones; no sustituir resultados humanos por datos inventados | 3 | Must | BT-S08-08-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RNF-03, RNF-04, RNF-05; RNF-03, RNF-04, RNF-05**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-08-01 / TC-115: Dado** participantes y protocolo aprobados, con autorización de evidencias, **cuando** completan la solicitud de cinco pasos y el cuestionario SUS, **entonces** se reportan SUS y tiempos y se verifica SUS ≥70 y mediana ≤3 min incluyendo fallos según protocolo. Condicionado a P09, P21.
- **AC-S08-08-02 / TC-116: Dado** tres escenarios por especialidad y participantes aprobados con orden alternado, **cuando** se comparan búsquedas informales y en TécnicoYa hasta técnico confirmado, **entonces** se reportan medianas y limitaciones y se contrasta reducción ≥30% sin declararla alcanzada si falla. Condicionado a P09, P21.

#### HU-S08-09 · Despliegue, respaldo y recuperación

Como **operador del entorno académico**, quiero **desplegar y recuperar una versión identificable**, para **mantener una demostración controlada y verificable**.

**Traza:** HU-32 → HU-S08-09 → TC-117, TC-118.

**Condiciones específicas de pruebas:** P09, P21 Estado: propuesto; ejecución pendiente.

| Tarea | Área / entregable | Puntos | MoSCoW | Dependencias |
| --- | --- | --- | --- | --- |
| BT-S08-09-01 | Preparación: Validar configuración, manifiesto de imágenes, respaldos y migraciones compatibles en Compose | 3 | Must | HU-S08-06, HU-S08-07, HU-S08-08 |
| BT-S08-09-02 | Despliegue: Publicar en servidor académico con gateway HTTPS/WSS y servicios internos; ejecutar humo por roles | 5 | Must | BT-S08-09-01 |
| BT-S08-09-03 | Recuperación: Restaurar base y archivos en entorno aislado, verificar jobs/Reverb y ensayar reversión compatible | 5 | Must | BT-S08-09-02 |
| BT-S08-09-04 | Observación: Monitorear disponibilidad durante la ventana aprobada y documentar operación y aceptación | 3 | Must | BT-S08-09-03 |

Todas las tareas anteriores pertenecen a **EP-08, Sprint 8** y trazan a **RNF-06, RNF-10, RNF-13, RNF-14; RNF-06, RNF-10, RNF-13, RNF-14**. La matriz adjunta repite estos campos por tarea para importación o filtrado.

**Aceptación vinculada:**

- **AC-S08-09-01 / TC-117: Dado** un respaldo de base/archivos de prueba y una imagen identificada compatible, **cuando** se restaura en entorno aislado y se ejecutan smoke de sesión, solicitud, jobs y Reverb, **entonces** los datos y relaciones esperadas se recuperan y el flujo básico funciona sin borrar la base de demostración.
- **AC-S08-09-02 / TC-118: Dado** una ventana y horario de monitoreo ratificados y servidor desplegado, **cuando** se recopilan todas las observaciones de salud y fallos durante esa ventana, **entonces** se calcula disponibilidad con el protocolo acordado y solo se declara RNF cumplido si alcanza 99%. Condicionado a P09, P21.

## 6. Reglas para ejecutar este backlog

1. Refinar las decisiones que afectan a la historia y acordar sus criterios BDD; no inventar plazos, umbrales o políticas pendientes.
2. Confirmar dependencias y revisar el código real: no se ha descontado trabajo existente porque este backlog no es una auditoría de implementación. Reestimar según lo validado, conservando el ID y la trazabilidad.
3. Preparar contrato/datos; implementar reglas y autorización; conectar React; automatizar y ejecutar los TC. El orden de las cuatro tareas es una secuencia de referencia, no una prohibición de preparar UI y pruebas en paralelo con un contrato acordado.
4. Crear o ampliar una migración una sola vez. Los datos/servicios ya introducidos se reutilizan; los puntos de una historia posterior cubren sus cambios, no su reconstrucción.
5. Mantener campos de seguimiento por tarea: responsable, estado, estimación revisada, fecha, commit/PR, evidencia y defecto. En esta entrega permanecen sin asignación ni resultados ficticios.
6. Revisar incremento con el asesor; presentar lo completado y lo que no cumple DoD. Antes de mover una historia de sprint, informar al usuario y registrar la decisión.

## 7. Definition of Ready y Definition of Done

**Ready:** actor/valor y RF/RNF identificados; dependencias disponibles; reglas relevantes acordadas; datos de prueba y contrato definidos; puntos revisados por Developers y capacidad discutida. No toda decisión del proyecto debe resolverse para iniciar una historia independiente.

**Done:** comportamiento y permisos cumplen los criterios; código revisado; migraciones y contratos actualizados; pruebas pertinentes y regresión ejecutadas; defectos/seguridad tratados según umbral aprobado; evidencia vinculada al commit; documentación y revisión del incremento registradas. El detalle específico permanece en cada CANVAS de sprint.

Una tarea técnica completada no significa que su historia esté aceptada. Los 118 TC son casos previstos de los CANVAS anteriores; aquí se vinculan, no se duplican ni se declaran ejecutados. La cobertura documental no equivale a cobertura de código ni a cumplir los RNF.

## 8. Control de incertidumbre y riesgos de estimación

- Matching: cerrar normalización, tratamiento sin historial y desempate residual (P15); fixtures no equivalen a calibración real.
- Relojes/elección/reservas: P11, P12 y P16 afectan tareas de concurrencia y pueden cambiar puntos.
- Dos técnicos/cancelación: P13/P14 afectan estado global y sustitución; no aprobar escenarios con reglas parciales.
- Reglas/sanciones: P18/P19 deben definir efecto en sesiones y servicios vigentes antes de habilitar intervenciones.
- Pagos: historial y ganancias son simulados por el plan reciente; P01/P02/P16/P21 concretan moneda, fórmula y datos, sin procesamiento financiero.
- Calidad: P09/P21 determinan muestra, ventana, carga, medición y umbrales; los tiempos de espera reales no se reducen por asignar menos puntos.
- Privacidad: P08 sigue abierto. Refinamiento y controles de datos pertenecen a HU-S08-05; no se programa borrado o anonimización automática sin una política acordada.

## 9. Archivos y fuentes

- [Matriz de tareas, puntos, dependencias y RF/RNF](backlog-tecnico/Backlog-Tareas.csv).
- [Matriz de historias y estimaciones agregadas](backlog-tecnico/Backlog-Historias.csv).
- [Datos estructurados del backlog](backlog-tecnico/Backlog-Tecnico.json).
- [Plan aprobado de ocho sprints](sprints-01-08/CANVAS-Plan-Sprints-01-08.md).
- [CANVAS de análisis](CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md) y [diccionario MySQL](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md).
- Fuente 0 y respuestas aportadas por el usuario, leídas durante la planificación; las instrucciones posteriores del chat prevalecen en alcance y tecnologías.
- Backlog anterior: documento 03 de `v2/contenido.json`. Se conserva como antecedente; no se reutilizan sus diez iteraciones ni numeración antigua de historias.

ISO 9001, ISO/IEC 25010, 27001, 27701 y 29119-2/3/4 permanecen como referencias de proceso, calidad, seguridad, privacidad y evidencia. Esta estimación no acredita cumplimiento, certificación ni capacidad medida del equipo.
