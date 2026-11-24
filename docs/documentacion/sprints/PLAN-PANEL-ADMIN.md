# Plan · Panel del administrador al nivel del cliente y del técnico

- **Fecha:** 2026-11-24.
- **Autor:** Claude Code (Fase A0, sin código de producto).
- **Base revisada:** `main` en `90a2a62` (#67 integrado).
- **Decisiones tomadas al empezar:** D-115 (reglas visibles, no editables), D-116 (intervenir solo con «Cancelar con motivo» y «Reenviar al emparejamiento») y D-117 (bienvenida y tutorial de 5 pasos).
- **Decisiones del plan:** ADM-13 a ADM-19 (§5), **tomadas el 2026-11-24** como D-118 a D-124: opción A en todas; en ADM-19, las 5 zonas del informe (Pilcomayo y Huancán se suman al seeder).
- **Dónde cuenta:** adelanto del Sprint 7 (D-73), con IDs **S07-TC** desde **S07-TC-144** (la última usada es S07-TC-143).
- **Versión anterior:** el plan del 2026-10-26 (Fases 1 a 4: base de paneles, usuarios, comunicados y correo) ya está ejecutado. Queda en el historial de Git, en `90a2a62`.

## 1. Inventario real (2026-11-24)

### 1.1 Permisos

`AuthorizationSeeder` da al rol `admin` cinco permisos, con el middleware `permission:`:

| Permiso | Qué protege hoy |
|---|---|
| `dashboard.view` | Inicio (`GET /admin/dashboard`), Estadísticas (`GET /admin/statistics`) y Solicitudes en solo lectura (`GET /admin/requests` y `/admin/requests/{id}`) |
| `catalog.manage` | Especialidades, subcategorías, distritos y Palabras clave del buscador (diccionario, búsquedas sin resultado y sugerencias de la IA) |
| `announcements.manage` | Comunicados: CRUD, publicación, despublicación, orden, restauración, eliminación definitiva y duplicado |
| `users.manage` | Usuarios: lista, alta, detalle, edición, eliminación (anonimizar), bloqueo, desbloqueo, plan del cliente (`PATCH /admin/users/{id}/plan`), restablecer acceso, cerrar sesiones y enlace de activación |
| `technicians.verify` | Verificación: cola, detalle, aprobar u observar, suspender y reactivar |

Existe `user_permissions` para administradores parciales, así que las pruebas «administrador sin el permiso» ya se pueden escribir.

### 1.2 Pantallas y endpoints

Abreviaturas: **SPA** = `frontend/web/src`; **API** = `/api/v1`.

| Pantalla pedida | Estado hoy | Qué hay (archivos) | Qué falta |
|---|---|---|---|
| **Menú agrupado** | Parcial | `AccountApp.jsx`: General (Inicio, Estadísticas), Gestión (Usuarios, Verificación, Solicitudes) y Contenido (Catálogo, Comunicados). Contadores de técnicos por verificar y comunicados vigentes, desde `/admin/dashboard` | Los 6 grupos nuevos y Próximamente, con `aria-disabled`; contadores de Alertas operativas y de Solicitudes sin técnico |
| **Bienvenida y tutorial** | No existe | El motor está en `client/ClientOnboarding.jsx` (`WelcomeDialog` y `Tour`), reutilizado por `TechnicianOnboarding.jsx`. `/me/preferences` ya guarda `onboarding_completed_at` y `tour_completed_at` para los tres roles (D-105) | Tarjetas y 5 pasos del administrador y «Repetir el tutorial» en Ayuda. D-104 (d) decía que el administrador no tenía; D-117 lo cambia |
| **Accesibilidad en «Tu cuenta»** | **Ya existe** | `AccountPanel.jsx` (`ADMIN_TABS`) muestra «Accesibilidad» con los 8 ajustes de `quickAccessibility.jsx` (tamaño de texto y 7 interruptores) | Solo una prueba Vitest que lo fije para el administrador y la ayuda del administrador en la vista previa |
| **Inicio** | Básico | `panel/AdminHome.jsx`: total por estado, técnicos por verificar, usuarios nuevos, últimos 5 eventos, calificaciones «no disponible» y 3 accesos rápidos | Saludo, 6 indicadores animados, gráfico de 7 y 30 días, Tareas pendientes, 10 entradas de actividad y diseño nuevo |
| **Solicitudes** | Solo lectura | `admin/RequestsAdmin.jsx` y `AdminRequests.php`: filtros de estado, distrito, especialidad, fechas y número. El detalle trae descripción, cliente (id y nombre), técnico, conteo de ofertas por estado y línea de tiempo **con `summary` y actor** | Subcategorías, cada oferta con su estado y tiempos, las dos acciones de D-116, CSV y diseño de tabla |
| **Emparejamiento en vivo** | No existe | `matching_runs`, `offer_rounds` y `offers`. Reverb solo tiene canales `requests.{id}`, `technicians.{id}` y `users.{id}` | Endpoint del tablero, canal privado del administrador y pantalla |
| **Alertas operativas** | No existe | Hay datos para calcularlas: `service_requests`, `offers`, `pending_expires_at` e `iot_alerts` | Endpoint, umbrales (ADM-13) y pantalla |
| **Usuarios** | Completo en funciones | `admin/UsersAdmin.jsx`, `UserDetail.jsx`, `UserForm.jsx` y `ManageUsers.php` (filtros de rol, estado, distrito y fechas) | Filtro por plan, tarjetas, detalle con pestañas (Datos, Actividad, Solicitudes u Ofertas, Auditoría) y diseño nuevo. Se mantienen todas las acciones |
| **Verificación** | Funcional | `administration/VerificationAdmin.jsx` (estilo S2): cola por estado, documentos y aprobar u observar. La API ya tiene suspensión y reactivación, **sin pantalla** | Pestañas Por revisar, Observados y Aprobados, orden por antigüedad, vista previa segura y suspender o reactivar |
| **Desempeño de técnicos** | No existe | `TechnicianStats.php` (cálculo del propio técnico, Fase T4) | Endpoint agregado para todos, con umbral (ADM-13) |
| **Catálogo** | Completo | `CatalogAdmin.jsx` y `CatalogSection.jsx` | Solo encabezado y ubicación en el menú (NEGOCIO) |
| **Zonas y tarifas** | No existe | `districts`, `technician_districts`, `technician_services` y `service_rate_versions`. **Solo hay 3 distritos sembrados** (Huancayo, El Tambo y Chilca) | Endpoint de solo lectura y pantalla (ADM-19) |
| **Planes y Premium** | Solo en el detalle del usuario | `PATCH /admin/users/{id}/plan` con motivo y auditoría (D-98); `client_profiles.plan` y `plan_since` | Lista de Premium y Free y pantalla propia |
| **Promociones** | Solo lectura en el cliente | No hay tabla propia: son comunicados con `kind = promotion` (`PremiumController::promotions`, solo para Premium). El administrador las crea hoy en Comunicados | Audiencia por plan, condiciones y pantalla propia (ADM-17) |
| **IoT** | Solo el cliente | `iot_devices`, `iot_readings`, `iot_alerts` y `IotMonitor.php` | Endpoint del administrador sin datos personales y pantalla con la franja «Modo demostración» |
| **Comunicados** | Completo | `AnnouncementsAdmin.jsx` (D-83 y D-84) | Solo ubicación en el menú (CONTENIDO) |
| **Palabras clave** | Completo | `admin/KeywordsAdmin.jsx` (D-94) | Solo ubicación en el menú |
| **Preguntas frecuentes y consejos** | Fijos en el código | `client/helpContent.js` (`FAQ`), `client/homeContent.js` (`TIPS`, uno por mes) y `technician/TechnicianHelp.jsx` (`FAQ`) | Tabla, CRUD y lectura desde la API (ADM-18) |
| **Estadísticas** | Funcional | `admin/StatisticsPage.jsx` y `AdminStatistics.php`: por día, especialidad, distrito, embudo, ofertas, técnicos por estado, usuarios nuevos y comunicados; 7, 30 o 90 días | Gráficos con el lenguaje visual nuevo, embudo con «asignada» y CSV |
| **Auditoría** | No existe | `audit_entries` (actor, acción, permiso, sujeto, motivo, antes y después, `correlation_id`), con índices por sujeto, actor y acción | Endpoint con filtros, detalle y CSV, con campos sensibles ocultos |
| **Reglas del negocio** | No existe | `rule_parameters`, `rule_versions` (v1, v2 y v3) y `rule_values`; pesos en `matching_weights`; `RuleBook`. Garantía (30 días), mantenimiento (180 días) y el «doble de la tolerancia» de IoT **están en el código**, no en las reglas | Endpoint de solo lectura y pantalla (D-115 y ADM-16) |
| **Barra superior, campana y «Tu cuenta»** | Completo (T1) | `PanelShell.jsx`, `NotificationBell.jsx` y `AccountPanel.jsx` | Avisos de la campana hacia las secciones nuevas (`staffTarget`) |

### 1.3 Pruebas y E2E

- **Pest:** `tests/Feature/*Admin*`, `AdminUsersTest` y otros (S02 y S07). Suite completa: 536 de 536 en el último relevo.
- **Vitest:** `features/admin/admin.test.jsx`, `panel/staffShell.test.jsx` y los `sprint02*`.
- **Cypress:** **no hay `cypress/e2e/sprint-07` ni `Sprint07E2ESeeder`**, y el workflow `e2e-cierre` corre por defecto `01` a `05`. La Fase A1 los crea.
- **Demo:** `DemoSeeder` crea `demo-admin@example.test`, pero `firstVisit` no se le aplica: no vuelve a la primera visita (el administrador todavía no tiene bienvenida).

## 2. Lenguaje visual y reglas comunes

- **Clases nuevas** con prefijo `adm-` (archivo `features/admin/adm.css`). No se reutilizan `.tech-*`, `.cx-*` ni `.tcard-*`: ya hubo 4 choques (DEF-70, 77 y 79, y `request-steps`).
- **Piezas:**
  - contenido centrado de unos 1200 px;
  - encabezado de página con ícono en cuadro de color;
  - tarjetas con ícono en círculo;
  - estados con color, ícono y texto;
  - cuadrículas que llenan el ancho;
  - estados vacíos con ilustración SVG propia.
- **Tabla común `AdmTable`:** búsqueda, filtros, orden por columna (`aria-sort`), paginación y, a 390 px, tarjetas apiladas. Se reutiliza en todas las pantallas con lista.
- **Formato:** importes «S/ 50,00» y fechas «4 dic · 09:00», con los formateadores existentes del cliente (se mueven a un módulo compartido si hace falta, sin cambiar su salida).
- **Movimiento:** contadores y gráficos animados que respetan `reduce_motion` y `prefers-reduced-motion`.
- **Accesibilidad:** contraste AA en los dos temas, objetivos de 44 px, `type` en todos los botones, foco visible y gráficos con resumen en texto.
- **CRUD:** alertas de éxito y de error, confirmación antes de eliminar o retirar y doble validación (cliente y servidor).
- **CSV:**
  - texto UTF-8 con BOM y separador `;` (Excel en español);
  - celdas que empiezan con `=`, `+`, `-`, `@`, tabulador o retorno se prefijan con `'` (inyección de fórmulas);
  - como máximo 5000 filas, con aviso si se corta;
  - cada exportación se audita (`*.exported`, con los filtros y sin datos).

## 3. Fases

Las cifras de pruebas son **estimaciones**. Los IDs se asignan en orden desde S07-TC-144; los rangos son orientativos y se ajustan al cerrar cada fase. Cada fase incluye 403 para cliente, técnico y administrador sin el permiso, y la auditoría de cada acción sensible.

### Fase A1 · Base y menú

- **Rama:** `feature/pimentel/admin/a1-base`.
- **Menú** (`AccountApp.jsx`, con los permisos de ADM-14):
  - **GENERAL:** Inicio.
  - **OPERACIÓN:** Solicitudes, Emparejamiento en vivo y Alertas operativas.
  - **PERSONAS:** Usuarios, Verificación de técnicos y Desempeño de técnicos.
  - **NEGOCIO:** Catálogo, Zonas y tarifas de referencia, Planes y Premium, Promociones e IoT.
  - **CONTENIDO:** Comunicados, Palabras clave del buscador y Preguntas frecuentes y consejos.
  - **CONTROL:** Estadísticas e informes, Auditoría y Reglas del negocio.
  - **PRÓXIMAMENTE:** Reseñas (S6), Incidencias (S7) y Pagos (S8), con `aria-disabled="true"`, sin navegar y con el texto «Disponible en el Sprint N».
  - Las secciones que llegan en fases posteriores muestran mientras tanto una página «En preparación» con su estado vacío; no hay enlaces rotos.
- **Contadores del menú:** `GET /admin/dashboard` suma `badges` con `verification_pending`, `operational_alerts` y `requests_unassigned`, en un número fijo de consultas.
- **Bienvenida y tutorial (D-117):** `AdminOnboarding.jsx` sobre `WelcomeDialog` y `Tour`. Los 5 pasos son el menú, Inicio y Tareas pendientes, Solicitudes y emparejamiento, Usuarios y verificación, y «Aa» y Tu cuenta. Se guarda en `/me/preferences`. Se suma una página Ayuda con «Repetir el tutorial».
- **Accesibilidad:** se fija con una prueba que el administrador tiene los 8 ajustes.
- **Demo:** `demo-admin` vuelve a su primera visita en cada siembra.
- **E2E:** `Sprint07E2ESeeder`, `cypress/e2e/sprint-07/` y `07` en el workflow `e2e-cierre`.
- **Permisos y datos (hecho en A1):** los 3 permisos de D-119 en `AuthorizationSeeder` (idempotente, el mismo mecanismo de D-74), Pilcomayo y Huancán en `DistrictSeeder` (D-124) y la versión 4 de las reglas (D-121), adelantada desde A2 porque los contadores del menú necesitan los umbrales de D-118.
- **Pruebas (hecho):** Pest S07-TC-144 a 152 y 166 (10), Vitest S07-TC-153 a 162 (10) y Cypress S07-TC-163 a 165 (3). Las fases siguientes empiezan en S07-TC-167.

### Fase A2 · Inicio

- **Rama:** `feature/pimentel/admin/a2-inicio`.
- **Endpoint:** `GET /admin/dashboard` ampliado, de forma aditiva para no romper S07-TC anteriores:
  - **`kpis`:** solicitudes de hoy (en hora de Lima), buscando técnico ahora (`sent` sin asignar y `pending_availability`), técnicos activos y verificados, tiempo medio de asignación en 30 días (envío a `assigned`; «—» sin datos), clientes Premium y alertas IoT abiertas;
  - **`series`:** de 7 y 30 días, con creadas, asignadas, canceladas y vencidas por día;
  - **`tasks`:** cada tarea con su contador y su sección de destino: documentos por revisar, sin técnico más de 30 minutos, pendientes de 24 h por vencer, búsquedas sin resultado nuevas, fallas IoT sin solicitud y técnicos con desempeño bajo (umbrales de ADM-13);
  - **`recent_events`:** pasa de 5 a 10 entradas.
- **Pantalla:** saludo con la fecha, 6 indicadores con conteo animado, gráfico de barras apiladas (7 o 30 días) con su resumen en texto y tabla oculta para lectores, Tareas pendientes con acceso directo, Actividad reciente y accesos rápidos (crear comunicado, crear usuario y revisar verificación, según permisos).
- **Reglas:** garantía, mantenimiento y factor IoT pasan a leerse del `RuleBook` (la versión 4 ya existe desde A1).
- **Hecho (2026-11-25):** además, la demo del Inicio (`DemoAdminOperations`) y el lugar de carga de las distancias de D-124 (`data/district-distances.php`). `RuleBook::formalized` lee los parámetros formalizados y, antes de la v4, usa el valor con que se formalizaron.
- **Pruebas (hecho):** Pest S07-TC-167 a 178 (12), Vitest S07-TC-179 a 186 (8) y Cypress S07-TC-187 a 189 (3). Después, DEF-83 (Inicio y Estadísticas sobre SQLite y partes del Inicio aisladas) sumó S07-TC-190 a 194. La Fase A3 empieza en S07-TC-195.

### Fase A3 · Operación

- **Rama:** `feature/pimentel/admin/a3-operacion`.
- **Solicitudes:**
  - **Detalle ampliado:** cliente con id, nombre para mostrar, distrito y plan (sin correo, teléfono ni dirección); especialidad y subcategorías; línea de tiempo con textos fijos; cada oferta con su técnico, ronda, estado, enviada, respondida o vencida, y minutos de respuesta; y técnico asignado.
  - **`POST /admin/requests/{id}/cancellation`:** motivo obligatorio de 10 a 500 caracteres y `expected_version`. Pasa a `cancelled` con el código nuevo `admin_intervention`, retira las ofertas abiertas, audita `request.admin_cancelled` y avisa al cliente (y al técnico según ADM-15).
  - **`POST /admin/requests/{id}/rematch`:** motivo obligatorio, `expected_version` e idempotencia. Abre una ronda nueva con las reglas vigentes mediante `MatchingFlow::searchAgain` con el disparador `admin_rematch`, audita `request.admin_rematched` y avisa al cliente. **No existe ningún endpoint para asignar a mano** (D-116), y una prueba lo comprueba.
  - **`GET /admin/requests/export`:** CSV de la vista filtrada.
  - **Pantalla:** `AdmTable`, panel de detalle y diálogos de confirmación con motivo obligatorio.
- **Emparejamiento en vivo:**
  - **`GET /admin/matching/live`:** solicitudes en búsqueda con su ronda, ofertas abiertas con `expires_at` (la cuenta regresiva se calcula en el cliente con el reloj del servidor), vencidas en las últimas 24 horas y pendientes de 24 h con su vencimiento.
  - **Tiempo real:** canal privado `admin.matching`, autorizado con `dashboard.view`. Emite solo una señal «cambió la solicitud N», sin datos personales, desde los eventos que el flujo ya publica, y la pantalla vuelve a pedir el tablero. Sin Reverb, o si se corta, consulta cada 30 segundos. El indicador de conexión dice «En vivo», «Reconectando» o «Actualiza cada 30 s».
- **Alertas operativas:** `GET /admin/alerts`, una lista priorizada con los tipos de ADM-13 (sin técnico más de 30 minutos, pendiente de 24 h por vencer, ofertas vencidas en cadena y fallas IoT sin atender), cada una con su acción directa (abrir la solicitud, reenviar o ver el equipo).
- **Migración:** `admin_intervention` en el CHECK de `cancellation_reason_code` y el permiso `requests.intervene` (si ADM-14 sale A).
- **Pruebas (S07-TC-184 a 215 aprox.):** Pest 18 (detalle sin datos sensibles, cancelar en cada estado permitido y prohibido, 409 por versión, motivo en sus bordes, reenviar con idempotencia y ronda nueva, aviso al cliente, auditoría, «no hay asignación manual», CSV con inyección neutralizada y filas acotadas, tablero, autorización del canal y cada tipo de alerta en su borde), Vitest 11 (con `vi.useFakeTimers` para la cuenta regresiva y el respaldo de 30 s) y Cypress 3.

### Fase A4 · Personas

- **Rama:** `feature/pimentel/admin/a4-personas`.
- **Usuarios:**
  - `GET /admin/users` admite el filtro `plan`;
  - `GET /admin/users/{id}` suma las pestañas: actividad (accesos y cambios de la cuenta), solicitudes del cliente u ofertas del técnico (paginadas) y auditoría del sujeto;
  - pantalla con tabla y tarjetas y detalle con pestañas. Se mantienen todas las acciones actuales y sus pruebas.
- **Verificación de técnicos:**
  - bandeja con pestañas Por revisar, Observados y Aprobados, ordenada por antigüedad de la solicitud (la más antigua primero) y con contador por pestaña;
  - **vista previa segura:** `GET /admin/technicians/{id}/documents/{media}/preview` solo con `technicians.verify`. Se sirve `inline` con `Content-Security-Policy: sandbox`, `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`. Las imágenes se ven en `<img>` y el PDF en un `<iframe sandbox>`, sin descarga automática. Cada vista se audita (`technician.document_viewed`);
  - aprobar u observar con nota, y la UI de suspender y reactivar (la API ya existe).
- **Desempeño de técnicos:** `GET /admin/technicians/performance`, de 30 días y calculado con datos reales: tasa de aceptación, tiempo medio de respuesta, ofertas vencidas, cancelaciones y trabajos completados. Lleva la señal de alerta del umbral de ADM-13, «—» sin datos y acceso al perfil.
- **Pruebas (S07-TC-216 a 243 aprox.):** Pest 13, Vitest 12 y Cypress 3. Las de `VerificationAdmin` y `UsersAdmin` que cambien se adaptan explicando el motivo en el código.

### Fase A5 · Negocio y contenido

- **Rama:** `feature/pimentel/admin/a5-negocio`. Si crece, se parte en `a5-negocio` y `a5-contenido`.
- **Planes y Premium:** `GET /admin/plans` (lista de clientes con su plan y fecha, filtro y búsqueda) y el `PATCH /admin/users/{id}/plan` existente, con motivo. El precio dice «Por definir».
- **Promociones:** según ADM-17. Crear, editar, programar (`starts_at`), retirar, imagen, vigencia, condiciones y audiencia «clientes Premium» o «todos los clientes». El cliente las ve en Promociones.
- **IoT:** `GET /admin/iot`, con los equipos con sensor por cliente (número de cliente y distrito, sin nombre ni dirección), estado, última lectura y alertas abiertas, más la franja «Modo demostración» (D-99).
- **Zonas y tarifas de referencia:** `GET /admin/zones`, de solo lectura. Por distrito activo (ADM-19), técnicos activos y verificados por especialidad, y tarifa mínima, media y máxima por subcategoría con las tarifas vigentes. «Sin datos» si no hay técnicos.
- **Preguntas frecuentes y consejos:** según ADM-18. CRUD con orden y publicación para «Cliente» y «Técnico», y los «Consejos del mes». El cliente y el técnico los leen de la API.
- **Migraciones:** las de ADM-17 y ADM-18.
- **Pruebas (S07-TC-244 a 283 aprox.):** Pest 22, Vitest 15 y Cypress 3.

### Fase A6 · Control

- **Rama:** `feature/pimentel/admin/a6-control`.
- **Auditoría:**
  - `GET /admin/audit`, con buscador y filtros de actor, acción, entidad y fechas, paginado;
  - `GET /admin/audit/{id}`, con el detalle y su `correlation_id`;
  - `GET /admin/audit/export`, en CSV;
  - **campos ocultos** en `before_values` y `after_values`: `password`, `current_password`, `token`, `*_token`, `secret`, `remember_token` y `api_key`, que se muestran como «[oculto]». Hay una prueba con cada uno.
- **Reglas del negocio:** `GET /admin/rules`, de solo lectura (D-115). Cada parámetro con su valor, unidad, versión vigente, fecha de vigencia, motivo de la versión y la decisión que lo respalda (D-11/D-95, D-21, D-20, RN-11.2, D-103…), además de los pesos de `matching_weights`. Ningún verbo de escritura; una prueba comprueba 405.
- **Estadísticas e informes:** rediseño con gráficos por especialidad, distrito y estado, embudo (enviada → oferta → aceptada → asignada) y `GET /admin/statistics/export`.
- **Pruebas (S07-TC-284 a 309 aprox.):** Pest 13, Vitest 10 y Cypress 3.

### Demo (en cada fase, solo con `APP_ENV=local`)

`DemoSeeder` deja contenido para cada pantalla, todo con `@example.test` y rotulado como demostración:
- un técnico por verificar y uno observado;
- solicitudes buscando técnico (una de más de 30 minutos), una pendiente de 24 h por vencer, una vencida y una cancelada por el administrador;
- promociones (Premium y todos);
- preguntas y consejos;
- una falla IoT sin solicitud;
- entradas de auditoría.

`demo-admin` vuelve a su primera visita en cada siembra.

## 4. Riesgos

| Riesgo | Cómo se controla |
|---|---|
| Choque de clases CSS con `technician.css`, `search.css` y `client.css` | Prefijo `adm-` y una prueba que busca clases nuevas sin prefijo en `adm.css`. Capturas a 1366 y 390 en los dos temas |
| Exponer datos personales en el detalle de la solicitud, en IoT o en los CSV | Proyecciones explícitas (nunca `select *`), una prueba de «campos que no deben aparecer» por endpoint y CSV sin correo ni teléfono |
| El reenvío al emparejamiento choca con un job en curso (dos rondas) | Bloqueo de la fila y `generation` (el mecanismo de `MatchingFlow`), idempotencia y 409 por versión |
| La cancelación del administrador libera el cupo de pedidos (D-95) | Prueba explícita de que el pedido deja de contar, como S05-TC-408 |
| Vista previa del documento como vector XSS (PDF o SVG) | Solo los tipos que ya admite `StoreMediaRequest`, `CSP: sandbox`, `nosniff`, `<iframe sandbox>` y nunca `image/svg+xml` en línea |
| Inyección de fórmulas en los CSV | Prefijo `'` y prueba con `=HYPERLINK(...)` |
| Secretos en la auditoría | Ocultar por lista de claves, con una prueba por clave |
| Canal de Reverb del administrador visible para otros roles | Autorización por permiso en `channels.php` y prueba 403 para cliente, técnico y administrador sin permiso |
| El Inicio se vuelve lento por los agregados | Número fijo de consultas (prueba con `DB::getQueryLog`) |
| Romper S07-TC anteriores del panel | Cambios aditivos en `/admin/dashboard` y `/admin/requests`; si una prueba cambia, se explica en el código |
| Cypress del S07 nuevas en CI (sin siembra hasta ahora) | `Sprint07E2ESeeder` en A1 y `e2e-cierre` lanzado en cada rama antes de pedir la integración |
| Quality Gate (fiabilidad y seguridad A en código nuevo) | Componentes pequeños, sin ternarios anidados nuevos y SonarQube solo al cierre (regla 12b). Revisión con la lista de `DEUDA-TECNICA.md` |
| Una corrida de `artisan test` a la vez | Pest solo en el slot A y nunca en paralelo con Cypress u otra corrida |

## 5. Decisiones del plan

**Tomadas el 2026-11-24 por Pimentel (D-118 a D-124):** opción A en ADM-13 a ADM-18. En ADM-19 se siembran las 5 zonas del informe (Huancayo, El Tambo, Chilca, Pilcomayo y Huancán), sin inventar técnicos, solicitudes, estadísticas ni distancias entre distritos. Se conserva la tabla con las opciones que se evaluaron.

| ID | Decisión | Opción A (recomendada) | Opción B | Antes de |
|---|---|---|---|---|
| **ADM-13** | Umbrales de alertas y tareas | **Sin técnico:** más de 30 minutos desde el envío sin asignar. **Pendiente por vencer:** quedan 2 horas o menos de las 24. **Ofertas vencidas en cadena:** 2 rondas seguidas vencidas sin ninguna aceptación. **Falla IoT sin atender:** alerta de falla abierta más de 60 minutos sin solicitud. **Desempeño bajo:** con 5 o más ofertas en 30 días, aceptación menor al 40 % o 3 o más vencidas. **Búsquedas sin resultado nuevas:** las de los últimos 7 días sin revisar. Los valores se guardan como reglas (ADM-16 A) | Los mismos conceptos con umbrales más laxos (60 minutos sin técnico, 4 horas por vencer y aceptación menor al 25 %), fijos en el código | A2 |
| **ADM-14** | Permisos nuevos | Tres permisos nuevos: `requests.intervene` (cancelar y reenviar), `audit.view` (Auditoría y exportes) y `content.manage` (preguntas frecuentes y consejos). Las pantallas de lectura (Emparejamiento, Alertas, Desempeño, Zonas, IoT y Reglas) usan `dashboard.view`; Planes, `users.manage`; y Promociones, `announcements.manage`. Permite administradores parciales (HU-S07-07) | Ningún permiso nuevo: intervenir con `dashboard.view`, auditoría con `users.manage` y contenido con `announcements.manage`. Es más simple, pero quien solo ve el Inicio podría cancelar solicitudes | A1 |
| **ADM-15** | Cuándo se interviene (D-116) | **Cancelar:** en `sent`, `pending_availability` y `assigned` (no en `in_progress` ni en estados cerrados). Si hay técnico asignado, también se le avisa, sin el motivo. **Reenviar:** solo en `sent` sin asignar y en `pending_availability`; una solicitud `expired` sigue cerrada y el cliente crea otra | **Cancelar:** solo sin técnico asignado. **Reenviar:** también `expired` en las 24 horas siguientes, que se reabre y vuelve a contar para el límite de 3 pedidos | A3 |
| **ADM-16** | Garantía (30 días), mantenimiento (180 días) y «doble de la tolerancia» IoT, hoy en el código | **Versión 4 de las reglas**, con los mismos valores copiados de la v3 más esos tres y los umbrales de ADM-13 (`editable = 0`). El código los lee del `RuleBook`; la vista muestra versión y fecha para todos | Se muestran como «Fijado en el código» con la decisión que los respalda (D-103) y sin versión. No hay migración, pero no cumple del todo «versión vigente y fecha» de D-115 | A2 |
| **ADM-17** | Promociones | **Se extienden los comunicados** de `kind = promotion` con `audience_plan` (`all` o `premium`) y `conditions` (hasta 500 caracteres), reutilizando imagen, vigencia, publicación y auditoría de D-83 y D-84. `GET /client/promotions` sale del middleware `premium` y filtra por plan: el Free ve solo las de «todos los clientes» | Tabla `promotions` nueva con su propio ciclo de vida, endpoints y pruebas. Separa conceptos, pero duplica el editor y la revisión de imágenes | A5 |
| **ADM-18** | Preguntas frecuentes y consejos | Tabla `help_entries` (`kind` faq o tip, `audience` client o technician, título, texto, `month` de 1 a 12 solo para consejos, `position`, `status` draft o published y `version`), sembrada con el contenido fijo actual. El cliente y el técnico leen `GET /help`; si la API falla, ven error con «Reintentar» (una sola fuente) | La misma tabla, pero la SPA conserva el contenido fijo como respaldo si la API falla. Es más robusto, pero hay dos fuentes que pueden diferir | A5 |
| **ADM-19** | Zonas: el prompt dice «5 distritos» y la base tiene 3 | Mostrar **todos los distritos activos** (hoy 3: Huancayo, El Tambo y Chilca). Si el administrador da de alta más en Catálogo, aparecen solos. No se inventan datos | Sembrar 2 distritos más (por ejemplo, Pilcomayo y Huancán) con sus distancias de D-64. Cambia la matriz de distancias y el matching | A5 |

## 6. Entrega de cada fase

1. Rama `feature/pimentel/admin/<fase>` desde `main` actualizado.
2. Pruebas en rojo (Pest y Vitest) en un commit y la implementación en otro.
3. Cypress afectadas actualizadas y 3 o más nuevas en `sprint-07`.
4. Pest completa en el slot A, Vitest, lint y build. `e2e-cierre` en la rama.
5. Capturas a 1366 y 390, claro y oscuro, en `evidencias/sprint-07/admin-<fase>/`.
6. Actualizar `CATALOGO-S07.csv`, `CONTRATO-API.md`, `DECISIONES.md`, `REGISTRO-DEFECTOS.csv` (desde DEF-81), el avance y `HANDOFF-claude.md`.
7. PR con resumen, IDs en rojo y en verde, DEF y D nuevos, capturas y pasos para probar con `demo-admin@example.test`. El equipo lo integra con «Create a merge commit».
