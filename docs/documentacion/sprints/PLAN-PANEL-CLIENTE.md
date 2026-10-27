# Plan · Panel del cliente

- **Fecha:** 2026-10-27.
- **Autor:** Claude Code. Asume backend y frontend según D-72.
- **Estado:** confirmado por Pimentel el 2026-10-27, con las cinco decisiones en la opción A (D-87 a D-91; ASES-01 sigue pendiente). La Fase C1 va en dos PR: primero la API (`feature/mayhuasca/cliente/cercania`) y después la SPA (`feature/delgado/cliente/panel-base`). En la API se agregó `unread_count` dentro de `data` y no se necesitó ningún índice nuevo.
- **Base revisada:** `main` en `c7dc292` (después del PR #37).
- **Reutiliza:** `PanelShell`, `NotificationBell`, `ProfilePage`, los tokens y el estilo del panel del administrador (D-82 y D-85).

## 1. Inventario: qué existe y qué falta

| Sección | API existente (`/api/v1`) | UI existente | Pruebas existentes | Qué falta | Sprint |
|---|---|---|---|---|---|
| **Marco del panel** | `GET /me` con `role`, `permissions[]` y `client_profile.district_id` | `AccountApp` ya monta `PanelShell` para el cliente, pero con solo dos secciones: «Inicio» (que mete todo `Sprint02Portal`: comunicados, notificaciones y `ClientPortal` con sus pestañas `s02-nav`) y «Mi perfil» | Vitest `panel.test` y `accessibility`; Cypress S01–S04 con `data-cy="portal-client"` y `logout` | Menú agrupado del cliente (General, Servicios y Cuenta); cada vista como sección propia, sin las pestañas `s02-nav`; iconos nuevos (`search`, `plus`, `bell`) | **C1** |
| **Campana** | `GET /notifications` devuelve `{items, pagination}` | `NotificationBell` espera que `data` sea un arreglo | `panel.test` simula `{data: [...]}` | **Defecto:** con la API real, la campana siempre muestra 0 y «No tienes notificaciones», porque `data` no es un arreglo. Se corrige y la prueba usa la forma real. Además: tiempo real (`notification.created`) y enlace «Ver todas» | **C1** (DEF-49) |
| **Inicio** | `GET /announcements` (por rol); `GET /requests` (lista con `phase`); `GET /catalog/specialties` | `RoleAnnouncements` con `AnnouncementCarousel` (D-83) | S02/S07 del carrusel | Inicio propio con carrusel, tarjetas de resumen (activas y «por elegir técnico») calculadas de `GET /requests`, botón «Pedir un técnico», «Técnicos cerca de ti» (4) y accesos por rubro. **No se muestran** «próxima cita» (no hay citas hasta el S5) ni «calificaciones» (S6) | **C1** |
| **Buscar técnicos** | `GET /technicians`: verificados, activos, sin pausa y con servicio activo; filtros `specialty_id`, `subcategory_id`, `district_id` y `min_rating`; **orden por nombre**, sin distancia; proyección pública sin teléfono ni dirección | `TechnicianSearch`, `TechnicianCard` y `TechnicianProfile` | Pest S03 (búsqueda y lista blanca); Vitest S03; Cypress `technician-card` | `sort=proximity` (mismo distrito, luego km de `district_distances` D-64, luego el resto), `distance` en cada tarjeta, filtro `max_fee` y tarifa visible en la tarjeta. Rediseño de las tarjetas | **C1** (BUSQ-01) |
| **Nueva solicitud** | `POST/PATCH /requests`, adjuntos y envío; el distrito ya se precarga desde `client_profile.district_id` | `RequestWizard` (5 pasos), `WizardFields`, `EvidencePicker` y `RequestSummary` | Pest S03; Vitest `sprint03`, `requestFlows` y `defaultDistrict`; Cypress S03 («Siguiente», «Paso 5», «Enviar solicitud») | Solo rediseño visual (indicador de pasos y tarjetas). Sin cambios de API ni de textos que usa Cypress | **C1** |
| **Mis solicitudes** | `GET /requests` (sin subcategoría ni distrito); `GET /requests/{id}` (sin línea de tiempo); candidatos, elección y búsqueda alternativa (S4) con Reverb (`request.updated`) | `MyRequests` (lista plana), `RequestTracking`, `CandidateList` y `SelectionDialog` | Pest S03/S04; Vitest `sprint04*`; Cypress «Ver solicitud #», «Continuar solicitud #» | Pestañas por estado (Borradores, En búsqueda, Por elegir, Asignadas y Cerradas), tarjetas con estado de color, `subcategory` y `district` en el listado, y **línea de tiempo** (`timeline` desde `request_events`) que se refresca con `request.updated` | **C1** (TIMELINE-01, adelanto parcial de HU-S05-05) |
| **Notificaciones** | `GET /notifications` con `read_at`, pero **nada marca una notificación como leída** | `Notifications` (lista simple con tiempo real), dentro del Inicio | Pest S04 `CNotifications`; Vitest `Realtime.test` | Bandeja propia con filtros (todas, no leídas, leídas y tipo) y «Marcar como leída» / «Marcar todas». Requiere endpoints nuevos (NOTIF-02) | **C1** (adelanto parcial de HU-S08-03) |
| **Mi perfil** | `PATCH /me` admite nombre, teléfono, avatar y tema; **no** el distrito ni la dirección del cliente. `POST /me/password` | `ProfilePage` (datos, foto y contraseña) | Pest S07 (perfil y contraseña); Vitest `panel.test` | Bloque «Datos de cliente»: distrito principal y dirección de referencia (privada), con doble validación y `expected_version` | **C1** (PERFIL-02) |
| **Mis citas** | Ninguna (`appointments` no existe) | Ninguna | — | Agenda, reprogramar, cancelar y WhatsApp tras la asignación (HU-S05-01, 03, 05 y 06) | **S5** |
| **Calificaciones** | Ninguna | `TechnicianProfile` dice «Sin reseñas publicadas todavía» | — | Calificar, editar, historial y reseñas (HU-S06-01 a 07) | **S6** |
| **Pagos y Ayuda** | Ninguna | Ninguna | — | Comprobante simulado (HU-S08-01), ayuda y soporte (HU-S08-04), preferencias de notificación (HU-S08-03) | **S8** |
| **Asesoría remota** | — | — | — | Cambia el matching del S4 (modo, cobertura y distancia). **Decisión pendiente** (§4); fuera de alcance | — |

## 2. Alcance por fases

### Fase C1 · Panel base del cliente (ahora)

**Menú (sobre `PanelShell`):**
- **General:** Inicio.
- **Servicios:** Nueva solicitud, Buscar técnicos y Mis solicitudes (con contador de las que esperan tu elección).
- **Cuenta:** Notificaciones (con contador de no leídas) y Mi perfil.

Los botones del menú conservan los textos «Nueva solicitud» y «Mis solicitudes», y siguen `data-cy="portal-client"`, `logout`, `technician-card` y los textos que usan las Cypress S01–S04 («Ver solicitud #», «Continuar solicitud #», «Siguiente», «Enviar solicitud»).

**Endpoints (backend en `feature/mayhuasca/cliente/cercania`):**

| Método y ruta | Cambio | Detalle |
|---|---|---|
| `GET /technicians` | Ampliado | `sort=proximity` (por defecto, `name`, el orden actual). Origen: `district_id` si se envía; si no, el distrito principal del cliente; sin origen, 422. Orden: mismo distrito (0 km), luego km ascendente de `district_distances`, luego los que no tienen distrito base o distancia en la matriz; el desempate es por nombre e id. Cada tarjeta suma `distance: {km, same_district, approximate: true, label}` o `null`. Filtro nuevo `max_fee` (0–10000): al menos un servicio que cumpla los filtros con `reference_fee <= max_fee`. Sigue la lista blanca: sin teléfono, dirección, correo ni distrito base explícito |
| `GET /requests` | Ampliado (aditivo) | Cada fila suma `subcategory {id, name}`, `district {id, name}` y `updated_at` |
| `GET /requests/{id}` | Ampliado (aditivo), solo para el titular | `timeline[]` con `{type, label, from_status, to_status, occurred_at}` desde `request_events`, con lista blanca de tipos y textos fijos en español. Sin `actor`, `metadata`, `correlation_id` ni motivos administrativos. El técnico notificado no la recibe |
| `POST /notifications/{id}/read` | Nuevo | Marca como leída una notificación propia (idempotente). Ajena o inexistente: 404 sin cambios |
| `POST /notifications/read-all` | Nuevo | Marca todas las propias; devuelve cuántas cambió |
| `GET /notifications` | Ampliado | Filtros `state` (`read` o `unread`) y `type`; `unread_count` en la respuesta para la campana |
| `PATCH /me` | Ampliado, solo para clientes | `client_profile.district_id` (distrito activo) y `client_profile.default_address` (0–200, privada), con `expected_version`. Un técnico o administrador que los envía recibe 422 |

**Migraciones:** ninguna. Opcional: un índice `notifications(user_id, read_at)` si las consultas lo piden (se decide midiendo).

**Pantallas (frontend en `feature/delgado/cliente/panel-base`):**
- **Inicio:** carrusel, dos tarjetas de resumen con datos reales, «Pedir un técnico», «Técnicos cerca de ti» y accesos por rubro (abren la búsqueda filtrada). Estados de carga, vacío y error con «Reintentar» en cada bloque, sin que el fallo de uno tumbe los demás.
- **Buscar técnicos:** filtros por rubro, servicio, distrito y tarifa máxima, tarjetas con foto o iniciales, «a 3,5 km · aproximada por zona» o «En tu distrito», «Desde S/ X» y la paginación actual. El texto «El orden no es un ranking» se ajusta a «Ordenados por cercanía a tu distrito; no es una recomendación».
- **Nueva solicitud:** el asistente actual con indicador de pasos y estilo del panel.
- **Mis solicitudes:** pestañas con contador, tarjetas con estado de color (texto con contraste AA, sin depender solo del color) y detalle con resumen, línea de tiempo, seguimiento y elección.
- **Notificaciones:** bandeja con filtros, marcar como leída y marcar todas, con alertas de éxito y error.
- **Mi perfil:** `ProfilePage` con el bloque «Datos de cliente».

**Casos de prueba estimados (IDs `S05-TC-NNN`, ver ORG-03):**
- **Pest, unos 30:**
  - cercanía (10): mismo distrito primero, km ascendente, sin distrito base al final, sin par en la matriz al final, origen desde el perfil, `district_id` como origen, sin origen 422, `sort` inválido 422, `max_fee` filtra y valida, lista blanca sin datos privados;
  - listado de solicitudes (2): subcategoría y distrito, y solo las propias;
  - línea de tiempo (6): orden cronológico, lista blanca de tipos, sin metadatos ni motivos, el técnico no la ve, solicitud ajena 404 y refleja la elección del S4;
  - notificaciones (7): marcar propia, idempotencia, ajena 404, marcar todas solo las propias, filtros `state` y `type`, `unread_count`, 401;
  - perfil del cliente (5): distrito activo, distrito inactivo 422, dirección larga 422, versión obsoleta 409, técnico 422.
- **Vitest, unos 35:** menú y contadores (4), Inicio (6), cercanía y filtros (6), Mis solicitudes con pestañas y línea de tiempo en tiempo real (7), Notificaciones (6), Mi perfil del cliente (4) y campana con la forma real de la API (2).
- **Cypress:** sin ejecutar salvo pedido. Las S01–S04 se revisan por texto y `data-cy`; las que cambien se adaptan sin correrlas y quedan para la regresión.

**Capturas:** Playwright con Chromium, tema claro y oscuro, a 1366 y 390 px, con la API real del slot A: Inicio, Buscar, Nueva solicitud, Mis solicitudes (lista y detalle), Notificaciones y Mi perfil.

### Sprint 5 · Mis citas
Agenda, reprogramación, cancelación, técnico adicional y WhatsApp tras la asignación, según el CANVAS S5. La línea de tiempo de C1 se amplía allí con las citas y el contacto (TC-067 y TC-068 completos).

### Sprint 6 · Calificaciones
Calificar en 48 horas, editar, historial y reseñas públicas. La tarjeta «Calificaciones» del Inicio y el filtro `min_rating` empiezan a mostrar datos entonces.

### Sprint 8 · Pagos simulados, preferencias y Ayuda
Comprobante simulado, preferencias por canal (TC-105) y soporte. La marca de leída de C1 se reutiliza.

## 3. Sprints que no se deben romper

| Parte | Origen | Cómo se protege |
|---|---|---|
| Búsqueda pública y su lista blanca | Sprint 3 (RT-02: «no implementar ranking») | `sort=name` sigue siendo el valor por defecto y las Pest S03 no cambian. La cercanía es un orden explícito, sin puntaje (BUSQ-01) |
| Asistente, envío y evidencias | Sprint 3 | Solo cambia el estilo. Los textos de botones y títulos de paso se conservan |
| Candidatos, elección y tiempo real | Sprint 4 (cierre S4.6 pendiente de Cypress y SonarQube) | `RequestTracking` y `SelectionDialog` se reutilizan tal cual. Las respuestas solo ganan campos |
| Bandeja `GET /notifications` | Sprint 4 (`CNotifications`) | La forma `{items, pagination}` no cambia; `unread_count` es aditivo |
| `PATCH /me` | Sprints 1 y 7 | Siguen prohibidos `email` y `password`; los campos nuevos solo para clientes |

## 4. Decisiones que necesito antes de la Fase C1

La recomendada va primero. Al decidirlas se registran en `DECISIONES.md` (D-87 en adelante).

| ID | Decisión | Opción A (recomendada) | Opción B |
|---|---|---|---|
| **ORG-03** | Dónde cuentan las pruebas del panel del cliente | **Adelanto del Sprint 5** con IDs `S05-TC` (catálogo nuevo `CATALOGO-S05.csv`), como D-73 hizo con el S7. La línea de tiempo lleva `[TC-067]` parcial | IDs `S07-TC`, junto al panel del administrador. Mezcla dos épicas en un catálogo que el S7 ya usa |
| **BUSQ-01** | Orden por cercanía | Ampliar `GET /technicians` con `sort=proximity` y `max_fee`; distancia «aproximada por zona» como en los candidatos del S4, y el texto aclara que no es una recomendación | Endpoint aparte `GET /client/nearby-technicians`, solo para clientes. Aísla el S3, pero duplica la consulta y la lista blanca |
| **TIMELINE-01** | Qué ve el cliente en la línea de tiempo | Lista blanca de tipos de `request_events` con textos fijos (registrada, enviada, buscando, ofertas, elección, asignada, cerrada, vencida); nunca `summary`, `metadata` ni el actor | Mostrar todos los eventos con su `summary`. Es más simple, pero puede exponer textos internos (el CANVAS S5 pide no exponer motivos administrativos) |
| **NOTIF-02** | Leídas y no leídas | **Adelanto** de la marca de leída de HU-S08-03 (`POST /notifications/{id}/read` y `read-all`, solo el dueño; cubre TC-106). Las preferencias por canal siguen en el S8 | Sin marca de leída hasta el S8: la bandeja solo filtra por tipo y la campana cuenta las nuevas desde la última visita (guardado local) |
| **PERFIL-02** | Datos del cliente editables | Distrito principal y dirección de referencia en `PATCH /me` (`client_profile.*`), solo para clientes | También el tipo (Hogar o MYPE) y la razón social. Toca reglas de D-80 que no están pedidas |
| **ASES-01** | Asesoría remota | **Pendiente, fuera de C1.** Cambia el modo de la solicitud, la cobertura y la distancia del matching del S4; necesita su propio análisis | — |

**Defecto encontrado en el inventario:** DEF-49, la campana del panel siempre cuenta 0 con la API real (espera un arreglo en `data` y recibe `{items, pagination}`); su prueba simula la forma equivocada. Se corrige en C1 con prueba en rojo primero.

## 5. Ramas y entrega

- **Backend:** `feature/mayhuasca/cliente/cercania`, desde `main`. Pest en rojo, implementación, contrato (`plan-pruebas-v3/sprint-05/CONTRATO-API.md`, nuevo).
- **Frontend:** `feature/delgado/cliente/panel-base` (ya creada desde `c7dc292`, con este plan). Se rebasa sobre `main` cuando se integre la de backend, o sale de la de backend si van en un solo PR. Vitest en rojo, implementación, capturas.
- **Ejecución:** Pest en el slot A con las guardas DEF-44 y DEF-45; Vitest, lint, build, `npm audit` y `composer audit`; capturas en primer plano; Cypress solo a pedido.
- **Documentos:** `DECISIONES.md`, `CONTRATO-API.md` del S5, `CATALOGO-S05.csv`, `REGISTRO-DEFECTOS.csv` (DEF-49), avance y `HANDOFF-claude.md`.
- **Revisión con `demo-cliente@example.test`:** después de `php artisan db:seed --class=DemoSeeder`, que ya crea tres técnicos verificados con distrito base y tarifa.
