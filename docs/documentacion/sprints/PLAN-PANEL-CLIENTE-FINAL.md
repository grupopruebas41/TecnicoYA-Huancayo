# Plan del panel del cliente final (Fase 0)

- **Fecha:** 2026-11-04. **Rama:** `feature/pimentel/cliente/fase0-plan-final`. El diagnóstico se hizo sobre `37d93bc`.
- **Estado:** C-1 a C-5 resueltos por Pimentel el 2026-11-04 (ver la §2). El PR #42 está integrado en `main` (`c574124`). Fase 1 integrada (PR #44 y #45), con los IDs S05-TC-115 a 147. Fase 2 terminada el 2026-11-04, a la espera de revisión, con los IDs S05-TC-148 a 180; la Fase 3 empieza en S05-TC-181.
- **Evidencia del diagnóstico:** [2026-11-04-37d93bc-fase0-reproduccion-errores.md](../evidencias/sprint-05/2026-11-04-37d93bc-fase0-reproduccion-errores.md).

## 1. Diagnóstico de los dos errores

| Referencia | Endpoint | Clase | Mensaje | Archivo:línea |
|---|---|---|---|---|
| `35cabaef-…` | `POST /orders` | `QueryException` | `no such table: service_orders` | `ServiceOrders.php:61` |
| `f1709070-…` | `GET /requests` | `ErrorException` | `Undefined property: stdClass::$order_id` | `ServiceRequestView.php:35` |

**Causa común: la migración `2026_10_28_000030_create_service_orders` no está aplicada en la base local** (29 de 30). No es un error de la lógica: con la migración aplicada, S05-TC-088 y S05-TC-101 pasan.

**Pero aplicarla no basta, y hay un defecto real:**

- La base local es **SQLite** (`database/local.sqlite`), no el MySQL `tecnicoya` que indica el prompt. El dato sale del registro; no se abrió `.env`.
- La migración 000030 ejecuta `ALTER TABLE … ADD CONSTRAINT` sin la guarda `DB::getDriverName() === 'mysql'` que usan las anteriores. En SQLite falla con `near "CONSTRAINT": syntax error`.
- SQLite no hace transaccional este esquema: un intento fallido deja `service_orders` creada y sin registrar, y el siguiente `migrate` también falla.
- La suite y la CI corren en MySQL, por eso no se detectó.

> **Aviso para el equipo:** no ejecuten `artisan migrate` en local hasta tener la corrección de la Fase 1. Hoy `service_orders` no existe, así que la base sigue limpia; un intento la dejaría a medias.

**Hallazgo aparte:** el `down()` de la migración `000027` no se puede revertir en MySQL (error 1553: el índice lo necesita una llave foránea). `migrate:rollback` completo falla.

## 2. Conflictos y decisiones pendientes

**Resueltos por Pimentel el 2026-11-04.** Las opciones elegidas son las recomendadas: C-1 A, C-2 A (acepta hasta 9 solicitudes activas), C-3 A, C-4 A y C-5 A. D-95, D-96 y D-97 las registran en `DECISIONES.md`; las tablas siguientes quedan como análisis.

**Instrucciones adicionales para las fases:**

- **Fase 1:**
  - la migración 000030 debe funcionar en MySQL y en SQLite, y recuperarse si `service_orders` quedó creada a medias;
  - una prueba o comprobación en CI ejecuta las migraciones sobre SQLite;
  - el README deja de indicar MySQL para el desarrollo local;
  - DEF-58 se registra y se corrige.
- **Fase 5:** el dictado por voz solo se activa al tocar el micrófono, después de aceptar el aviso (D-97).
- **Orden:** 1, 2, 3, 4, 5 y 6. Si el plazo no alcanza, se avisa a Pimentel antes de recortar; la Fase 6 debe verse al menos en una versión básica.

### C-1 · D-95 dice reemplazar solo «la parte de límites» de D-92, pero cambia más

D-92 define una solicitud **por subespecialidad**, con descripción, urgencia, marca, modelo, síntomas y fotos **por rubro**. D-95 pasa a una solicitud **por especialidad** con varias subcategorías, y no dice qué pasa con esos datos.

| Opción | Qué significa | Efecto |
|---|---|---|
| **A (recomendada)** | Un juego de datos por solicitud (especialidad): una descripción, una urgencia, una marca y un modelo; síntomas de cualquiera de sus subcategorías | Un técnico, una visita y un formulario más corto. D-95 debe declarar que reemplaza también esa parte de D-92 |
| B | Descripción y equipo por cada subcategoría, en la tabla intermedia | Más detalle, pero un formulario largo si se marcan muchas |

### C-2 · D-95 cambia el significado de D-11 y D-58

El parámetro `max_active_requests_per_client` está en una versión de reglas, y las versiones son inmutables (§8.5 de las reglas). D-95 tampoco define qué es un «pedido activo».

| Opción | Qué significa | Efecto |
|---|---|---|
| **A (recomendada)** | Parámetro nuevo `max_active_orders_per_client = 3` en una **versión nueva** de reglas (la 3, porque la 2 ya existe por D-63) | Respeta D-24 y §8.5. Hay que actualizar las reglas formalizadas (§7 y P10) |
| B | Reinterpretar el parámetro actual sin versión nueva | Menos trabajo, pero rompe la inmutabilidad y deja el nombre y la unidad falsos |

**Definiciones que propongo, con cualquiera de las dos:**

- Un pedido está activo si tiene al menos una solicitud desde `sent` hasta el cierre o la cancelación.
- Una solicitud sin pedido (dirigida o borrador del `RequestWizard`) cuenta como un pedido.
- Efecto que hay que aceptar: un cliente puede llegar a **9 solicitudes activas** (3 pedidos × 3 especialidades).
- La Parte C pide probar «4 pedidos activos previos → bloqueado», pero el bloqueo llega con 3. Probaré 2 (permitido), 3 (bloqueado) y 4 forzado por datos (bloqueado).

**Pruebas que cambiarían, con explicación en el commit:** S03-TC-030, 031 y 068; S05-TC-090, 091, 100 y 112.

### C-3 · D-96 deja sin definir el puntaje, y D-92 decía «matching del S4 sin cambios»

Hoy cada candidato tiene **un** servicio: de él salen la tarifa (T), la experiencia (E), el historial (H) y su fotografía en `matching_candidates` (`Matcher.php:57-76`). `reference_fee_snapshot` también guarda un solo monto. D-96 define quién es elegible, pero no con qué valores se puntúa.

| Opción | Tarifa T | Experiencia E | Historial H | Efecto |
|---|---|---|---|---|
| **A (recomendada)** | Suma de las tarifas del técnico en esas subcategorías | La menor | Servicios completados en cualquiera de ellas | Compara lo que realmente se pide. Con una sola subcategoría da lo mismo que `matching_v1`, así que las pruebas del S4 no cambian. Se registra como `matching_v2` |
| B | La de la primera subcategoría marcada | La de esa misma | La de esa misma | Sin cambiar el algoritmo, pero el orden en que se marca cambiaría el resultado y la tarifa quedaría corta |

Con la opción A, `reference_fee_snapshot` sería la suma de las tarifas «desde», siempre rotulada como referencial (RF-04).

### C-4 · La regla «nunca preguntes qué discapacidad tiene» y las tarjetas de la bienvenida

La regla A.4 prohíbe preguntarlo, y la Fase 5 propone tarjetas como «Veo poco» o «Me cuesta leer». Aunque no se guarden, se parecen a preguntar por una condición de salud, que es dato sensible en la Ley 29733.

| Opción | Tarjetas | Efecto |
|---|---|---|
| **A (recomendada)** | Redactadas como preferencia: «Letra grande y alto contraste», «Lectura más fácil», «Teclado o voz», «Pantalla simple», «Menos movimiento» | Cumple A.4 sin perder ninguna función |
| B | Textos de la Fase 5 tal como están, sin guardar la tarjeta elegida | Más directos, pero el riesgo sigue. Conviene que lo revise el equipo |

D-97 ya registra que solo se guardan los ajustes resultantes, nunca la tarjeta.

### C-5 · Orden de integración

El asistente vive en el PR #42, **sin integrar**, y su CI falla en las auditorías hasta que entre el PR #41.

| Opción | Qué significa | Efecto |
|---|---|---|
| **A (recomendada)** | El equipo integra #41, actualizo #42 con `main` (merge) y el equipo integra #42. La Fase 1 parte de `main` | Historia limpia y CI válida |
| B | La Fase 1 se apila sobre #42 | No espera, pero la CI seguirá en rojo y los PR quedan encadenados |

### Ajustes de numeración y nombres (no necesitan decisión)

- **Catálogo:** el último ID en #42 es **S05-TC-114**, no 087. Sigo desde **S05-TC-115**.
- **Defectos:** DEF-52 ya está usado en el PR #41. Los defectos de la Parte C pasan a:

  | Prompt | Real | Defecto |
  |---|---|---|
  | DEF-52 | **DEF-53** | 500 al enviar el pedido; la migración 000030 no corre en SQLite |
  | DEF-53 | **DEF-54** | 500 en Mis solicitudes |
  | DEF-54 | **DEF-55** | Aviso repetido (`OrderWizard.jsx:243` y `OrderSteps.jsx:61`) |
  | DEF-55 | **DEF-56** | Texto del pie (`orderModel.js:172`) |
  | DEF-56 | **DEF-57** | «Perfil de demostración…» (`DemoSeeder.php:102`) |
  | — | **DEF-58** | `down()` de la migración 000027 (severidad baja) |

- **Tabla de reseñas:** `technician_reviews` **ya existe** y guarda las revisiones de verificación del administrador (S2). Las reseñas de demostración irán en `technician_review_samples`, que el S6 no reutiliza.
- **Registro:** los defectos se registran en la Fase 1, cuando el #41 esté integrado, para no chocar en el CSV.
- **Cambio sin confirmar:** hay un cambio de espacios en `RegisterAccount.php:18` que no es de esta fase. No lo incluyo; Pimentel decide si lo descarta.

## 3. Inventario de pantallas

| Fase | Pantalla | Hoy | Cambio |
|---|---|---|---|
| 1 | Asistente del pedido | `order/OrderWizard.jsx`, `OrderSteps.jsx`, `orderModel.js` | Sin límite de rubros ni aviso; pie y paso 5 nuevos |
| 1 | Perfil público (texto) | `DemoSeeder.php:102` | Quitar el texto y agregar estado vacío |
| 2 | Mis solicitudes | `requests/MyRequests.jsx` | Pestañas, grupos por pedido, búsqueda, paginación, cancelar, skeleton |
| 3 | Buscar técnicos | `matching/TechnicianSearch.jsx` | Encabezado, chips, orden, tarjetas, favoritos |
| 3 | Perfil del técnico | `matching/TechnicianProfile.jsx` | Rediseño con 6 secciones |
| 3 | Mi perfil del técnico | Perfil existente | Campos nuevos editables |
| 4 | Barra superior y menú | `panel/PanelShell.jsx` (compartido) | ☰, campana, «Aa», avatar, menú nuevo, **solo para el rol cliente** |
| 4 | Panel del avatar | `AvatarMenu`, `ProfilePage.jsx` | Diálogo con 5 pestañas |
| 4 | Técnicos favoritos | Nueva | Lista |
| 4 | Especialidades, Novedades, Cómo funciona, Preguntas frecuentes, Privacidad y términos | Nuevas | Estáticas o con datos existentes |
| 4 | Plan Premium | Nueva | Presentación sin pagos, precio «Por definir» |
| 5 | Bienvenida y tutorial | Nuevas | Primer ingreso |
| 5 | Ajustes de accesibilidad | Nueva pestaña | Vista previa en vivo |
| 6 | Mis equipos, Sensores, Detalle del equipo, Alertas, Promociones, Garantías | Nuevas | Franja «Modo demostración: lecturas simuladas» |
| 6 | Detalle del usuario (admin) | Existente | Cambiar plan con motivo |

## 4. Endpoints

| Fase | Endpoint | Cambio |
|---|---|---|
| 1 | `POST /orders` | `items` por especialidad con `subcategory_ids[]`; sin máximo de rubros; límite por pedidos |
| 1 | `GET /orders/quota` | Cuenta pedidos; quita `max_items` |
| 1 | `GET /requests`, `GET /requests/{id}`, ofertas | Agregan `subcategories[]`; `subcategory` se conserva como principal |
| 2 | `GET /requests` | `tab`, `q`, paginación, grupo por pedido, técnico asignado y línea resumida |
| 2 | `POST /requests/{id}/cancellation` | **Nuevo** (HU-S05-06, TC-069 y 070, D-28) |
| 3 | `GET /technicians` | `sort=price\|experience`, `min_rating`, `available_today` |
| 3 | `GET /technicians/{id}` | Disponibilidad, distritos, verificado, garantía, «qué incluye», reseñas |
| 3 | `PATCH /technicians/me…` | Campos nuevos con límites de longitud |
| 3 | `GET`, `PUT` y `DELETE /client/favorites…` | **Nuevos** |
| 4 | `GET`, `POST`, `PATCH` y `DELETE /client/addresses…` | **Nuevos** |
| 5 | `GET` y `PUT /client/me/preferences` | **Nuevos** (D-97) |
| 6 | `PATCH /admin/users/{id}/plan` | **Nuevo**, auditado y con motivo |
| 6 | `/client/equipment`, `/client/iot/devices`, `/client/iot/alerts`, `/client/warranties`, `/client/promotions` | **Nuevos**, 403 para free y otros roles |
| 6 | `POST /client/iot/alerts/{id}/request` | **Nuevo**, con idempotencia |

## 5. Migraciones previstas

| Fase | Migración | Contenido |
|---|---|---|
| 1 | Corrección de `000030` | Guardas de MySQL. Se edita porque no está en `main` y porque una migración posterior no puede arreglar una que falla |
| 1 | `000031` | `request_subcategories`; `service_orders.item_count` sin tope de 3; versión 2 de reglas (según C-2) |
| 1 | `000027` | Corregir `down()` (DEF-58), con una migración nueva si procede |
| 3 | `000032` | `technician_profiles`: `work_style`, `warranty_text`; `technician_services.includes`; `client_favorite_technicians`; `technician_review_samples` |
| 4 | `000033` | `client_addresses`; `service_requests.address_id` solo si hace falta |
| 5 | `000034` | `client_profiles`: `accessibility_prefs`, `onboarding_completed_at`, `tour_completed_at` |
| 6 | `000035` a `000037` | `plan`, `plan_since`; `client_equipment`; `iot_devices`, `iot_readings`, `iot_alerts`; `warranties`; audiencia premium en comunicados |

Todas deben correr en **MySQL y en SQLite**: S05-TC-115 lo comprueba.

**Dato de modelo (Fase 1):** se conserva `service_requests.subcategory_id` como subcategoría principal, porque la usan más de 30 clases. La lista completa va en `request_subcategories`.

## 6. IDs previstos por fase

Son rangos orientativos desde **S05-TC-115**; cada catálogo fija los definitivos. El conteo actual de la rama es de 60 Pest y 54 Vitest, sin ninguna Cypress del S5 ejecutada.

| Fase | Pest | Vitest | Cypress | Total |
|---|---|---|---|---|
| 1 | 115–132 | 133–146 | 147–149 | 35 |
| 2 | 150–155 | 156–166 | 167–169 | 20 |
| 3 | 170–183 | 184–198 | 199–202 | 33 |
| 4 | 203–210 | 211–223 | 224–226 | 24 |
| 5 | 227–233 | 234–247 | 248–252 | 26 |
| 6 | 253–276 | 277–288 | 289–292 | 40 |
| **Total** | **77** | **79** | **22** | **178** |

**Primeras pruebas de la Fase 1:**

- S05-TC-115: todas las migraciones corren en SQLite.
- S05-TC-116 y 117: forma del contrato de `POST /orders` y `GET /requests`.
- Después, las pruebas mínimas de la Parte C: 3 especialidades → N solicitudes, límite, atomicidad, idempotencia, técnico que no cubre todas.

## 7. Riesgos

| Riesgo | Efecto | Medida |
|---|---|---|
| **Plazo de D-72:** Claude Code hace frontend solo hasta el 2026-11-19 | Faltan 15 días para 6 fases | Priorizar 1 a 3. Si no alcanza, acordar el relevo a Codex o ampliar D-72 |
| **Memoria:** 1,08 GB libres ahora (se piden 1,5 GB para Cypress) | Cypress no se puede ejecutar; el MySQL de pruebas ya se detuvo por memoria una vez | Dejar las specs escritas, anotarlo en el relevo y correrlas al cierre con Docker y SonarQube detenidos |
| **Cambiar la elegibilidad** toca `Eligibility`, `Matcher`, `RoundOpener`, `OfferView` y `TechnicianHistory` | Regresión del S4 | Las pruebas de una sola subcategoría no deben cambiar; mutación del módulo al cierre |
| **`PanelShell` es compartido** con el administrador y el técnico | Romper otros paneles y las Cypress del S1 al S4 | Cambios activados por rol y regresión Vitest de los otros paneles |
| **Base local en SQLite, CI en MySQL** | Se repite un error como DEF-53 | S05-TC-115 en la suite y CHECK solo con guarda |
| **Cancelar con ofertas abiertas** | Choque con el flujo de ofertas (RN-11) | Prueba propia; el largo del motivo se propone en la Fase 2 |
| **Dictado por voz:** en Chrome, `SpeechRecognition` envía el audio a un servicio externo | Privacidad (Ley 29733) | Aviso antes del primer uso y dictado apagado por defecto |
| **Dependencias nuevas:** `vitest-axe`, `cypress-axe` y la fuente legible | Más auditoría | Solo de desarrollo; la fuente se incluye en el repositorio con su licencia |
| **Reseñas de demostración** | Que parezcan reales o influyan en el puntaje | Solo en local, rotuladas, y H no las lee. En producción se ve «Nuevo» |
| **IoT y plan premium** quedan fuera del catálogo base de sprints | Inflan el conteo del S5 sin cubrir un RF del curso | Marcarlos en el catálogo como adicionales |
| **Técnico favorito que no ofrece la subcategoría de la alerta** | La solicitud dirigida daría 422 | Propongo pasar al matching normal; se confirma en la Fase 6 |

## 8. Cómo cierra cada fase

Cada fase termina con PR, tabla de IDs de rojo a verde, defectos y decisiones nuevos, capturas (1366 y 390, claro y oscuro), pasos de prueba manual y pendientes, y me detengo hasta que se revise.
