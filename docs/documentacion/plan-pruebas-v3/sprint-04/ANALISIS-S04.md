# Análisis del Sprint 4 · Brechas, decisiones y retiro del prototipo

**Versión:** 1.0 · **Fecha:** 2026-10-16 · **Autor:** Claude Code (S4.1) · **Revisor:** [PENDIENTE]
**Rama:** `feature/mayhuasca/b-matching/s04`, desde `main` `cced99e` (PR #17 integrado).
**Fuentes:** DECISIONES.md (hasta D-61), REGLAS-DE-NEGOCIO-FORMALIZADAS §2 a §10, CANVAS-Sprint-04, ADENDA-Sprint-04, PLAN-MAESTRO-v3, CATALOGO-TC v2 (TC-039 a 058, 132, 133 y 140), INFORME-SPRINT-03 §4.2 y §6, diccionario MySQL (T19, T29, T33 a T39, T53, T54, T70 y T71) y el código de `main`.
**Documentos del sprint:** [CONTRATO-API.md](CONTRATO-API.md) y [CATALOGO-S04.csv](CATALOGO-S04.csv).

## 1. Decisiones que ya aplican (no se vuelven a preguntar)

| Pendiente | Decisión | Qué fija en S4 |
|---|---|---|
| MATCH-01 | **D-19** | El matching es PHP dentro de Laravel (`BMatching`). El servicio Python no se usa. |
| P05 | **D-23** | Atención inmediata: técnico sin citas en las próximas 2 h, en el intervalo `[ahora, ahora + 2 h)`. |
| P11 | **D-22** | El cliente elige cuando se cierra la ronda, sin plazo nuevo, y se revalida la disponibilidad al elegir. |
| P12 | **D-21** | Intervalo `[inicio, vencimiento)`: a los 10:00 exactos la oferta ya venció. El SLA empieza con la oferta en la bandeja aunque falle el envío externo. El reloj de 24 h no se reinicia por un job. |
| P15 | **D-20** | `Dref` y `Aref` son los máximos entre los elegibles de cada ejecución. H = 0,50 para técnico nuevo y para el que tiene 3 o más servicios sin reseñas. El empate persistente se muestra como empate. Sin historial suficiente se muestra «Nuevo, sin estimación». |
| P16 | **D-25** | La tarifa es la que declara el técnico por subcategoría (`technician_services`, versionada) y el técnico define sus franjas. |
| P19 | **D-24** | Cada solicitud conserva la versión de reglas con la que se envió. |
| P18 | D-32 | Un técnico suspendido no recibe ofertas; las atenciones en curso siguen. |
| P07 | D-18 | El promedio usa solo calificaciones vigentes. En S4 no hay calificaciones (llegan en S6). |
| IDEM-01 | **D-60** | `POST /requests` acepta `Idempotency-Key` con el mismo mecanismo del envío. |
| MEDIA-02 | **D-61** | `DELETE /media/{id}` solo para el dueño y solo si no está vinculada; vinculada → 409. |

Con D-20 el método para los casos sin división queda fijado en S4 así:
- si todas las distancias son iguales (`Dref = 0`), C = 1 para todos;
- si todas las experiencias son 0 (`Aref = 0`), E = 0 para todos;
- si todas las tarifas coinciden, T = 0,50 (`equal_price_factor`).

Son los valores de cada fórmula en su límite (distancia 0 o experiencia 0), así que no hace falta otra decisión.

## 2. Tabla de brechas

Estado: **existe** (reutilizable tal cual), **parcial** (hay piezas en `main`) o **falta**.

| HU | RF / RNF | Endpoint o proceso | Pantalla (Codex) | Pruebas | Estado y qué hay hoy |
|---|---|---|---|---|---|
| HU-S04-01 Elegibilidad | RF-06, 07, 10; RN-05 | Interno: `PrepareMatching`; resultado visible en `GET /requests/{id}` (`phase`) | «Buscando técnicos» en el detalle de la solicitud | Pest 001 a 013 | **Parcial.** `TechnicianSearch::eligible()` ya filtra estado, verificación, cuenta, servicio activo, distrito y pausa (D-57): se extrae a un filtro común en `BMatching`. **Faltan** la franja (`availability_slots`), las citas (D-23), el motivo de exclusión y la fotografía (`matching_runs` y `matching_candidates`). |
| HU-S04-02 Puntuación y desempate | RF-06, 08, 09; RN-06, RN-07 | Interno: `Scorer` y `Ranker` | — | Pest 014 a 020 y 023 a 026 | **Falta.** `app/Services/Matching.php` (prototipo) usa `rules.json`, `secondaryZoneProximity` y `maxExperienceYears`, que contradicen D-20 y RN-28; `python/api/app.py` duplica lo mismo. **No se reutilizan.** Falta `matching_weights` (T29) con el CHECK de la suma igual a 100. |
| HU-S04-03 Estimaciones | RF-11, 12; RN-08, RN-09 | Campos `distance` y `estimate` en candidatos y ofertas | Etiquetas «aproximada por zona» y «Nuevo, sin estimación» | Pest 021 y 022; Vitest 105 y 106; Pest 115 y 116 | **Falta.** No existe `district_distances` (T19) ni un distrito base del técnico (solo `technician_districts` de cobertura). La estimación necesita duraciones reales, que llegan en S5 (DIST-01, EST-01). |
| HU-S04-04 Ronda y notificaciones | RF-13, 15, 29; RN-10.2 | Interno: `OpenOfferRound`; `GET /offers` y `GET /offers/{id}` | Bandeja de ofertas del técnico | Pest 027 a 032 | **Falta.** Faltan `offer_rounds` (T35), `offers` (T36), `notifications` (T53), `notification_attempts` (T54), `outbox_events` (T70) y `outbox_deliveries` (T71). **El nombre `offers` lo ocupa la tabla del prototipo** (RETIRO-01). |
| HU-S04-05 Respuesta y SLA | RF-15, 16; RN-10.1 | `POST /offers/{id}/response` | Cronómetro y botones Aceptar y Rechazar | Pest 033 a 043; Cypress 083 a 086 | **Falta.** El prototipo valida en milisegundos sobre su propia tabla. |
| HU-S04-06 Elección y concurrencia | RF-18; RN-10.3 | `GET /requests/{id}/candidates` y `POST /requests/{id}/selection` | Lista de aceptados y confirmación | Pest 044 a 052; Cypress 087 a 089 | **Falta.** Faltan `participations` (T38) y `appointments` (T39), con la reserva mínima del CANVAS §2. |
| HU-S04-07 Reasignación y ruta dirigida | RF-16, 17; RN-11.1, RN-12 | Interno: `ExpireOfferRound`; `POST /requests/{id}/alternative-searches` | Alternativas tras una solicitud directa fallida | Pest 053 a 058; Cypress 090 | **Parcial.** S3 ya guarda `source=profile` y `target_technician_id` y revalida el técnico objetivo al enviar. Falta toda la lógica de rondas. |
| HU-S04-08 Pendiente 24 h | RF-14; RN-11.2, RN-11.3 | Interno: `RetryPendingMatching` y `ExpirePendingRequest`; campos en `GET /requests/{id}` | Aviso con la fecha límite | Pest 059 a 063; Cypress 091 y 092 | **Parcial.** `service_requests` ya tiene `pending_since`, `pending_expires_at`, `search_generation` y los estados `pending_availability` y `expired` en su CHECK (migración 000017). Falta la lógica. |
| HU-S04-09 Tiempo real | RF-29; SEC-S04-02 | `POST /broadcasting/auth`, canales privados, eventos y `GET /notifications` | Echo: deduplicación y recuperación al reconectar | Pest 064 a 070; Cypress 093 a 095; Vitest 103 y 104 | **Falta.** No hay `laravel/reverb`, ni `config/broadcasting.php`, ni `routes/channels.php`, ni `laravel-echo` en el frontend (DEP-01). |
| HU-S04-10 Entrega y reintentos | RF-15, 29; RNF-07 | Interno: `DeliverNotification` y `PublishOutboxEvent` | — | Pest 071 a 075; Pest 118 | **Falta.** |
| Transversal D-60 | RF-01; RT-06 | `POST /requests` con `Idempotency-Key` | El asistente manda la clave y reintenta | Pest 076 a 078; Cypress 099; Vitest 112 | **Parcial.** `App\Shared\Http\Idempotency` ya existe y se usa en el envío; solo falta llamarlo en el registro. |
| Transversal D-61 | RF-03; RF-33 | `DELETE /media/{id}` | Quitar foto no adjuntada, con confirmación | Pest 079 a 082; Cypress 098; Vitest 113 | **Falta.** Hoy solo se desvincula (`DELETE /requests/{id}/attachments/{media}`). |
| Transversal RNF-01 | RNF-01 (D-33) | `matching_runs.duration_ms` | — | Pest 024 | **Falta.** La carga con k6 sigue en S8. |
| Deuda S3 | — | `RuleBook` | — | Mutación de la clase | **Pendiente:** 2 `php:S112` en `RuleBook.php:19` y `27`, que se corrigen con una excepción dedicada al tocar la clase. |

**Lo que no se reutiliza del código histórico** (para no duplicar lógica):
- `app/Services/Marketplace.php` y `Matching.php`;
- las tablas `requests`, `offers` y `technicians` del prototipo;
- `marketplace:tick`, programado cada segundo;
- `python/api`.

Usan identificadores UUID, tiempos en milisegundos, `rules.json` y una máquina de estados propia (C10).

## 3. Resumen del catálogo

Archivo: [CATALOGO-S04.csv](CATALOGO-S04.csv).

| Herramienta | Ejecutables | IDs | Mínimo |
|---|---:|---|---:|
| Pest | **88** | S04-TC-001 a 082 y 114 a 119 | 36 |
| Cypress | **18** | S04-TC-083 a 100 | 14 |
| Vitest | **13** | S04-TC-101 a 113 | 10 |
| **Total ejecutable** | **119** | | 60 |

**Casos base cubiertos:** TC-039 a 058, TC-132 y TC-133. TC-140 queda bloqueado (EST-01). TC-133 deja de estar condicionado porque P05 y P16 ya se decidieron (D-23 y D-25).

**Técnicas por enfoque obligatorio:**

| Enfoque | Casos |
|---|---|
| Límites de tiempo con reloj controlado: 9:59, 10:00 y 10:01 min | 033, 034 y 035 (Pest); 085 y 086 (Cypress con reloj de servidor); 101 y 102 (Vitest) |
| Límites de 23:59 y 24:00 h | 060 y 061 |
| Límite de 1:59 y 2:00 h (D-23) | 011 y 012 |
| Límite de fin de pausa `[inicio, fin)` | 008 |
| Tabla de decisión de elegibilidad, un ID por fila con su código de exclusión | 001 a 013 |
| Puntuación calculada a mano con datos sintéticos | 014 (75,00), 015 (73,00 / 50,00 / 30,00), 016 (60,00 para todos) y 019 (puntaje sin redondear) |
| Concurrencia con **dos procesos PHP reales** y barrera `GET_LOCK` de MySQL, sin `sleep` | 040 (dos respuestas del mismo técnico), 045 (dos clientes, misma franja) y 046 (dos elecciones del mismo cliente) |
| Concurrencia por orden de bloqueo (job frente a respuesta) | 039 |
| Idempotencia de los jobs | 030, 053, 061, 068, 073 y 074 |
| Reintentos (máximo 3) | 071 y 072 |
| Nadie ve ofertas ajenas | 037, 048, 069 y 070 |
| Tabla rol × ruta | 038, 065 y 066 |
| Matching en 3 s o menos (RNF-01) | 024 |
| Seguridad y privacidad (SEC-S04-01 a 06) | 029, 052, 067 y 075 |
| Familias P11-B (CRUD, VAL y AUTH) | Columna `familia_p11b` del CSV |

**Desbloqueados el 2026-10-16** (D-64 a D-69; antes bloqueados):

| ID | Caso | Lo bloquea |
|---|---|---|
| S04-TC-114 | Corte de ronda con empate entre el 3.º y el 4.º | EMP-01 |
| S04-TC-115 | Distancia desde el distrito base con la matriz de distritos [TC-043] | DIST-01 |
| S04-TC-116 | Estimación con historial suficiente [TC-140] | EST-01 (y las duraciones reales de S5) |
| S04-TC-117 | Reserva de una solicitud inmediata al elegir | RES-01 |
| S04-TC-118 | Intervalos entre reintentos de entrega | NOTIF-01 |
| S04-TC-119 | Reintento periódico durante el pendiente | PEND-01 |

Pasaron a ejecutables con su mismo ID y el resultado esperado de la opción A.

## 4. Decisiones del S4

**Decididas por Pimentel el 2026-10-16:** las nueve en opción A (D-62 a D-70) y los supuestos de diseño (D-71). DIST-01 con los km por ruta en auto entre plazas principales (Google Maps): Huancayo–El Tambo 3,5; Huancayo–Chilca 2,5; El Tambo–Chilca 5,5; mismo distrito 1. Se conservan abajo las opciones tal como se presentaron.

Cada una tiene dos opciones y la recomendación. **No se implementa nada que dependa de ellas hasta que decidas.** La principal (PHP o Python) ya está decidida en D-19 y no se pregunta.

| ID | Pregunta | Opción A | Opción B | Recomendación |
|---|---|---|---|---|
| **RETIRO-01** | ¿Cuándo se retira el prototipo respecto del S4? | **Antes del S4.2**, en un PR propio. Se libera el nombre `offers` del diccionario (T36), desaparece la segunda máquina de estados (C10) y se apaga el `marketplace:tick` de cada segundo antes de añadir los jobs v1. | Al final del S4 o en el S8. La tabla v1 se llama `request_offers` (desvío del diccionario) y conviven dos schedulers. | **A** |
| **PARAM-02** | ¿Cómo entran los parámetros de S4 en `rule_*`? Son `offer_sla_minutes = 10`, `max_simultaneous_offers = 3`, `pending_hours = 24`, `new_technician_history_factor = 0,50`, `history_real_after_completed_services = 3`, `equal_price_factor = 0,50`, `max_delivery_retries = 3` (RNF-07) y los pesos 35/20/30/15 en `matching_weights`. | **Versión 2 publicada por migración**: copia completa de la v1 más los nuevos valores, `effective_at = 2026-10-16`. Las solicitudes enviadas con la v1 no tienen parámetros de matching: la ejecución registra el diagnóstico `RULES_INCOMPLETE` y no abre ofertas (no hay datos reales de producción). | Añadir las filas a la **v1** ya publicada y recalcular su `content_hash`. Es más simple, pero reescribe una versión publicada, algo que RN-28 y §8.6 prohíben. | **A** |
| **DIST-01** | ¿Desde dónde se mide la distancia `dᵢ`? Hoy el técnico solo tiene distritos de cobertura, y como cubrir el distrito ya es requisito para ser elegible, todas las distancias serían 0 y el peso de cercanía (35 %) no influiría. | Añadir `technician_profiles.base_district_id` (el técnico lo declara en su perfil; Codex suma el campo) y la tabla `district_distances` (T19). El equipo aprueba los km entre los centros de Huancayo, El Tambo y Chilca y su procedencia (RN-09). Las pruebas usan una matriz sintética. | Sin distrito base: `dᵢ = 0` si el técnico cubre el distrito de la solicitud, así que C = 1 para todos (`Dref = 0`). La cercanía no discrimina hasta un sprint posterior. | **A**, con los km medidos por el equipo (no los propongo yo) |
| **EMP-01** | Empate persistente que cruza el corte de la ronda, por ejemplo cuando el 3.º y el 4.º empatan. D-20 dice que se muestra como empate, pero no cómo se corta. | Criterio secundario explícito solo para el corte: `verified_at` más antiguo (antigüedad como técnico verificado). Queda registrado en `matching_candidates` como `tie_break = verified_at`. | Diferir todo el grupo empatado a la ronda siguiente (la ronda sale con menos de 3 ofertas). Si el grupo empieza en el 1.er puesto y no cabe, sorteo con la semilla guardada en el run. | **A**: es reproducible y no deja rondas vacías |
| **RES-01** | ¿Qué reserva crea la elección en una solicitud **inmediata** (`asap`), que no tiene franja? | Una cita `[assigned_at, assigned_at + 2 h)`, coherente con D-23: impide asignar al mismo técnico dos atenciones inmediatas a la vez. | Sin cita en S4 para `asap`; solo se reservan las programadas y la agenda completa llega en S5. | **A** |
| **PEND-01** | Durante el pendiente de 24 h, ¿cada cuánto se reintenta el matching y a quién? | Cada **5 min** (scheduler), solo con técnicos que nunca tuvieron oferta en esa solicitud. Se conserva el primer `pending_expires_at`. | Sin reintento periódico: solo se reintenta cuando un técnico cambia su disponibilidad, sus servicios o su pausa (por evento). | **A**: es determinista y se prueba con reloj controlado |
| **NOTIF-01** | Intervalos entre reintentos de entrega (RNF-07 dejó los intervalos a P12, y D-21 no los fija) | **1, 2 y 4 min** después del intento inicial. El último cae a los 7 min, dentro del SLA de 10. | Tres reintentos seguidos cada 30 s. | **A** |
| **EST-01** | Fórmula del tiempo estimado con historial suficiente (RF-11, TC-140) | **Mediana** de `completed_at − started_at` de las participaciones finalizadas del técnico en la misma subcategoría, con un mínimo de 3, en minutos enteros. | **Promedio** de todas sus participaciones finalizadas, en cualquier subcategoría. | **A**, que resiste mejor los valores atípicos. Igual queda sin datos reales hasta S5 |
| **DEP-01** | Dependencias del tiempo real: `laravel/reverb` (backend) y `laravel-echo` con `pusher-js` (frontend), más un puerto de Reverb por slot | Instalarlas sin `-W`. Puertos **8081 en el slot A y 8082 en el B**, levantados por `scripts/run-e2e.mjs` junto con `queue:work` y `schedule:work`. | Sin Reverb en S4: sondeo de `GET /requests/{id}` cada pocos segundos. TC-055 y TC-056 quedarían sin Reverb real, en contra del CANVAS §7 y la DoD. | **A** |

**Supuestos de diseño** (no son reglas de negocio; los aplico salvo que digas otra cosa):
- **Horario en una solicitud `asap`:** el «horario compatible» de RN-05 exige que el instante actual caiga en una franja activa del técnico, además de D-23.
- **Experiencia y tarifa:** se toman del servicio de esa subcategoría, es decir, `technician_services.experience_years` y `reference_fee`.
- **Cierre por vencimiento:** una solicitud que vence (`expired`) guarda `closed_at` y deja de contar para el máximo de 3 activas (D-11).
- **Canal de notificación de S4:** la bandeja interna (`notifications`) más un correo de sandbox (mailer `log`). La bandeja nunca depende de que el correo salga.
- **Alcance de `DELETE /media/{id}`:** solo aplica a `purpose=evidence`. Los demás archivos se retiran por su propio recurso (portafolio, documentos).

## 5. Retiro del prototipo (DEF-22, D-26): plan, sin ejecutar

La condición de D-26 se cumple: S02 y S03 pasaron 17/17 en Cypress (`evidencias/sprint-03/cierre`). **No se retiró nada.**

**Orden propuesto** (con RETIRO-01 = A, antes del S4.2):

| Paso | Quién | Rama | Qué |
|---|---|---|---|
| 0 | Equipo (Pimentel) | — | Etiqueta `prototipo-historico` sobre `main` antes del primer cambio (D-26: «el código queda en el historial con una etiqueta»). El *push* de la etiqueta lo autoriza el equipo. |
| 1 | **Codex** | `feature/delgado/f-administracion/s04-retiro` | Desacoplar la v1 del prototipo y luego borrar el frontend histórico (lista F). |
| 2 | **Claude Code** | `feature/pimentel/infra/s04-retiro-prototipo` | Backend y API con token (lista B), con una migración nueva que borra las tablas. Puede ir en paralelo con el paso 1: la demo `#demo` usa `localStorage` y no llama a `/api/*`. |
| 3 | **Claude Code** | la misma del paso 2 | Python, infraestructura y documentos (lista P). |
| 4 | Claude Code y Codex | — | Regresión: Pest completo, Vitest, Cypress de S01 a S03 (uno a la vez), conteo y CI. Se cierran DEF-22 y DEF-26. |

**F · Frontend (Codex).** Antes de borrar hay que desacoplar tres cosas que la v1 todavía importa:
- `features/administration/Sprint02Portal.jsx` importa `src/Announcements.jsx`;
- `features/matching/TechnicianSearch.jsx` importa `src/TechnicianProfile.jsx`, que a su vez importa `domain/matching.js`;
- `features/administration/SessionForm.jsx` importa `src/auth.css`.

Una vez movido lo que la v1 necesita, se retira:
- en `App.jsx`, la ruta `#demo` y el `import Marketplace`;
- en `Auth.jsx`, el enlace «Explorar los tres perfiles en la demo»;
- `src/Marketplace.jsx`, `Auth.jsx`, `AccountPanel.jsx`, `marketplace-api.js` y `LegacyServiceCarousel.jsx`;
- `src/domain/` completo: `demo.js`, `matching.js`, `permissions.js`, `announcements.js`, `rules.json`, `matching-fixture.json` y `marketplace.test.js`;
- `access.test.jsx`, `forms.test.jsx` y las partes de prototipo de `ServiceCarousel.test.jsx`, `Announcements.test.jsx` y `TechnicianProfile.test.jsx`;
- `marketplace.css` (y su import en `main.jsx`), si ya no lo usa nada de la v1.

Codex comprueba antes que ningún ID `SNN-TC` de Vitest esté en esos archivos.

**B · Backend (Claude Code):**
- `routes/api.php`: se quitan `/login`, `/register`, `/logout`, `/state` y `/actions/{action}`. **Se mantiene `GET /api/health`.**
- Se borran `app/Http/Controllers/MarketplaceController.php`, `app/Http/Controllers/AuthController.php` (el de token; el v1 está en `FAdministration`) y `app/Http/Middleware/ApiToken.php`, con su alias `token` en `bootstrap/app.php`.
- Se borran `app/Services/Marketplace.php`, `Matching.php`, `Permissions.php` y `Announcements.php`, después de comprobar que la v1 no los usa (`FAdministration` tiene los suyos).
- Se borra `resources/domain/rules.json` y, en `config/marketplace.php`, solo la clave `python_url` (`idempotency_retention_days` se queda).
- `routes/console.php`: se quitan `marketplace:tick`, su `Schedule … everySecond()` y `marketplace:admin`. El alta de administradores sigue con `ProvisionAdmin`.
- Se borran `tests/Feature/MarketplaceTest.php` y `AnnouncementsTest.php`, que son regresión del prototipo y no cuentan.
- Migración nueva `drop_prototype_tables`, en este orden: `offers`, `requests`, `technicians`, `api_tokens` y `access_events`. Las migraciones antiguas no se editan, y `users` se queda porque la crea la misma migración inicial. La columna heredada `users.role` se revisa aparte: `User::$fillable` todavía la nombra, así que no se borra en este paso.

**P · Python, infraestructura y documentos (Claude Code, rama de Pimentel):**
- `python/` completo: `api/app.py`, `test_matching.py`, `rules.json`, `matching-fixture.json`, `Dockerfile`, `requirements.txt` y `README.md`;
- `.runtime-python/`, si existe en local, porque no está versionado;
- `infrastructure/docker-compose.yml`: el servicio `matching` y `PYTHON_URL`;
- `.vscode/tasks.json`: la tarea «Python matching»;
- `project.yml`: `python: auto`;
- en `AGENTS.md` §2, la lista de congelado pasa a «retirado el AAAA-MM-DD (etiqueta …)»;
- `PLAN-MAESTRO-v3` §1 y §10;
- `DECISIONES.md`: nota en D-26 con la fecha real del retiro;
- `REGISTRO-DEFECTOS`: se cierran DEF-22 y DEF-26.

## 6. Plan del S4.2 y el S4.3 (tras tu confirmación)

1. **S4.2, Pest en rojo:** un commit `test(s04)` con los 82 casos Pest, con la evidencia `evidencias/sprint-04/01-rojo-antes-de-implementar.txt`.
2. **S4.3, en verde:**
   - migraciones: T19, si se aprueba DIST-01; T29 y T33 a T39 (la reserva mínima); T53, T54, T70 y T71; y la versión 2 de reglas (PARAM-02);
   - `BMatching` (elegibilidad, scorer, ranker, rondas, ofertas y elección), con un reloj inyectado;
   - `CNotifications` (bandeja, intentos, outbox y broadcasting);
   - jobs y scheduler, D-60, D-61 y `Sprint04E2ESeeder` con la guarda `E2EDatabaseGuard` (D-59).
3. **Mutación en el S4.3:** solo sobre las clases nuevas o modificadas del sprint (`--path` con la lista exacta). **Nunca a la vez que el Cypress de Codex:** antes de lanzarla compruebo que `tmp/e2e-cypress.lock` esté libre y lo tomo durante la corrida, como en S3.3.
4. **Cobertura:** 70 % o más en `BMatching` y `CNotifications`; `composer audit` limpio; PR hacia `main`.
