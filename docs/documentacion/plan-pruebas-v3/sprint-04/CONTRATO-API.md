# Contrato de API · Sprint 4

**Versión:** 1.1 (2026-10-17, S4.3: lo que fijó la implementación, ver §11) · 1.0 (decisiones D-62 a D-71 aplicadas; análisis en [ANALISIS-S04.md](ANALISIS-S04.md)) · **Fecha:** 2026-10-16 · **Autor:** Claude Code (S4.1 y S4.3) · **Revisor:** [PENDIENTE]
**Base:** `main` `cced99e`; rama `feature/mayhuasca/b-matching/s04`.
**Catálogo:** [CATALOGO-S04.csv](CATALOGO-S04.csv): 132 casos ejecutables (101 Pest, 18 Cypress y 13 Vitest). La v1.0 tenía 119; se agregaron S04-TC-120 a 127 (guarda de comandos destructivos, PR #19) y 128 a 132 (distrito base y herramientas E2E).
**Decisiones aplicadas:** D-11, D-18 a D-25, D-32, D-33, D-36 y D-57 a D-71.

> **Estado de las rutas:**
> - **[existe]**: ya responde en `main`.
> - **[cambia]**: existe y en S4.3 se le agrega comportamiento.
> - **[nuevo]**: se implementa en S4.3.
>
> Con este contrato Codex construye pantallas y Vitest (S4.4). Cypress queda para cuando se integre el PR de S4.3 (S4.5).

## 1. Reglas comunes

Siguen vigentes las reglas del §1 de los contratos de [S1](../sprint-01/CONTRATO-API.md), [S2](../sprint-02/CONTRATO-API.md) y [S3](../sprint-03/CONTRATO-API.md):
- prefijo `/api/v1`;
- Sanctum SPA con CSRF;
- envoltura `{ data, meta: { request_id, server_time } }`;
- errores con `error.code`, `error.message` y `error.fields`;
- **un fallo de red no es éxito ni fracaso: se vuelve a leer el estado.**

**Tiempo:**
- Toda fecha va en UTC ISO-8601 con microsegundos.
- `meta.server_time` es la hora del servidor al responder.
- El cronómetro se calcula como `expires_at − server_time`, más el tiempo local transcurrido desde que llegó la respuesta. **Nunca autoriza nada:** el servidor vuelve a comprobar el plazo bajo bloqueo (SEC-S04-04, D-21).

**`Idempotency-Key`** (UUID v4, opcional en la API y **obligatorio en la SPA**) en:
- `POST /requests` **[cambia, D-60]**;
- `POST /requests/{id}/submission` [existe];
- `POST /offers/{id}/response`;
- `POST /requests/{id}/selection`;
- `POST /requests/{id}/alternative-searches`.

La misma clave con el mismo cuerpo devuelve la respuesta guardada; la misma clave con otro cuerpo, 409 `STALE_VERSION`. La SPA genera una clave por intento del usuario y la **reutiliza en el reintento** automático tras un fallo de red.

**Códigos nuevos:**

| Estado | `error.code` | Cuándo | Mensaje |
|---|---|---|---|
| 409 | `OFFER_EXPIRED` | Respuesta con la hora del servidor ≥ `expires_at`, aunque la oferta figure `pending` | «La oferta venció. Ya no puedes responderla.» |
| 409 | `OFFER_NOT_PENDING` | La oferta ya fue respondida, vencida o retirada | «Esta oferta ya no está disponible.» |
| 409 | `TECHNICIAN_UNAVAILABLE` | Al aceptar: el técnico dejó de ser elegible (pausa, suspensión, servicio). Al elegir: el elegido dejó de estarlo | Técnico: «Ya no estás disponible para esta solicitud.» Cliente: «El técnico ya no está disponible. Elige otra opción.» |
| 409 | `SCHEDULE_CONFLICT` | Al elegir: la franja del técnico se ocupó (otra cita confirmada) | «El técnico ya no tiene disponible esa franja. Elige otra opción.» |
| 409 | `ROUND_NOT_CLOSED` | Elegir con la ronda aún `open` (D-22) | «Espera a que respondan todos o venza el plazo.» |
| 409 | `NO_ALTERNATIVES_PENDING` | `alternative-searches` sin una solicitud directa fallida | «Esta solicitud no espera tu autorización.» |
| 409 | `MEDIA_LINKED` | `DELETE /media/{id}` de una evidencia adjunta (D-61) | «La foto está adjunta a una solicitud. Quítala primero de la solicitud.» |
| 409 | `STALE_VERSION` | `expected_version` obsoleta o clave reutilizada con otro cuerpo (igual que en S3) | «La información cambió. Actualiza y vuelve a intentarlo.» |
| 404 | `NOT_FOUND` | Oferta, solicitud o archivo **ajeno**: nunca se revela que existe | — |

**Estado y fase de la solicitud.** El `status` de S3 (D-13) se amplía con los valores que ya permite el CHECK. Además, `phase` le dice a la pantalla qué mostrar:

| `status` | `phase` | Texto en pantalla | Qué puede hacer el cliente |
|---|---|---|---|
| `sent` | `matching` | Buscando técnicos | Esperar |
| `sent` | `awaiting_responses` | Esperando respuestas | Esperar (la ronda está `open`) |
| `sent` | `awaiting_choice` | Elige a tu técnico | `POST …/selection` |
| `sent` | `direct_declined` | Tu técnico no respondió | Ver alternativas y `POST …/alternative-searches` |
| `pending_availability` | `pending_availability` | Pendiente de disponibilidad | Esperar hasta `pending_expires_at` |
| `assigned` | `assigned` | Asignada | — (la atención llega en S5) |
| `expired` | `expired` | Expirada | Crear otra solicitud (ya no cuenta para el máximo de D-11) |

**Estados de la oferta:** `pending`, `accepted`, `rejected`, `expired` y `withdrawn` (retirada al asignarse otro técnico o al dejar de estar disponible). **Aceptar no es asignar** (RN-10.3).

## 2. Tabla de decisión rol × ruta

Actores:
- **A:** anónimo;
- **C:** cliente titular;
- **C2:** otro cliente;
- **T:** técnico destinatario;
- **T2:** otro técnico;
- **Adm:** administrador;
- **S:** cuenta suspendida.

| Ruta | A | C | C2 | T | T2 | Adm | S |
|---|---|---|---|---|---|---|---|
| `GET /offers`, `GET /offers/{id}` | 401 | 403 | 403 | 200 (solo las suyas) | 404 en la de T | 403 | 403 |
| `POST /offers/{id}/response` | 401 | 403 | 403 | 200 / 409 / 422 | 404 | 403 | 403 |
| `GET /requests/{id}` | 401 | 200 | 404 | 200 sin `address` hasta ser asignado | 404 | 404 | 403 |
| `GET /requests/{id}/candidates` | 401 | 200 | 404 | 403 | 403 | 403 | 403 |
| `POST /requests/{id}/selection`, `…/alternative-searches` | 401 | 200 o 202 / 409 / 422 | 404 | 403 | 403 | 403 | 403 |
| `GET /notifications` | 401 | 200 (las suyas) | 200 (las suyas) | 200 (las suyas) | 200 (las suyas) | 200 (las suyas) | 403 |
| `POST /broadcasting/auth` `private-requests.{id}` | 401 | 200 | 403 | 403 | 403 | 403 | 403 |
| `POST /broadcasting/auth` `private-technicians.{id}` | 401 | 403 | 403 | 200 (su id) | 403 | 403 | 403 |
| `POST /broadcasting/auth` `private-users.{id}` | 401 | 200 (su id) | 403 | 200 (su id) | 403 | 200 (su id) | 403 |
| `DELETE /media/{id}` (evidencia) | 401 | 204 / 409 | 404 | 404 | 404 | 404 | 403 |

El técnico «notificado» es el que tiene una oferta en cualquier ronda de esa solicitud. Puede leer la descripción, el distrito, la modalidad, la franja y las fotos de evidencia (TC-127, ahora con relación), pero **no la dirección** hasta que lo asignen (SEC-S04-05).

## 3. Proceso interno (sin ruta) [nuevo]

Lo ejecutan jobs (cola `database`) y el scheduler. Las pruebas los ejecutan de forma explícita con reloj controlado.

| Paso | Job | Cuándo | Efecto |
|---|---|---|---|
| 1 | `PrepareMatching(request_id, generation)` | Tras el commit del envío (`afterCommit`) o de `alternative-searches` | Ejecuta el matching (§3.1) y encola `OpenOfferRound` |
| 2 | `OpenOfferRound(request_id, generation)` | Tras el paso 1, al vencer una ronda sin aceptaciones o al reintentar el pendiente | Ronda de hasta `max_simultaneous_offers` (3) con los que no tuvieron oferta (RN-11.1); `direct` con un solo destinatario (RN-12); sin candidatos → `pending_availability` conservando el primer plazo (D-21) |
| 3 | `ExpireOfferRound(round_id, generation)` | Con retardo hasta `expires_at`, más un barrido del scheduler cada minuto | Vence las `pending`. Si hay aceptación → `awaiting_choice`; si es automática y sin aceptación → paso 2; si es directa sin aceptación → `direct_declined` |
| 4 | `RetryPendingMatching(request_id, generation)` | Scheduler cada 5 min (D-67) | Repite los pasos 1 y 2 sin mover `pending_expires_at` |
| 5 | `ExpirePendingRequest(request_id, generation)` | Scheduler, cuando `now ≥ pending_expires_at` | `expired` y `closed_at`, una sola vez (RN-11.3) |
| 6 | `DeliverNotification(notification_id)` | Tras el commit | Envío a la sandbox; intento inicial y hasta `max_delivery_retries` (3) reintentos, a 1, 2 y 4 min del intento anterior (D-68). Nunca mueve un plazo |
| 7 | `PublishOutboxEvent(outbox_id)` | Tras el commit | Envío por Reverb; una sola vez por `event_id` |

Todo job lleva la generación (`search_generation`). Si no coincide con la vigente, termina sin efectos (TC-058). **El orden de bloqueo** es siempre el mismo:
1. `service_requests`;
2. `offer_rounds`;
3. `offers`;
4. `technician_profiles`, en orden de id.

### 3.1 Matching (`BMatching`, algoritmo `matching_v1`)

**Elegibilidad (RN-05).** Un candidato queda excluido, con su código, en cuanto falla un filtro:

| Código | Causa |
|---|---|
| `technician_suspended` | `status = suspended` |
| `not_active` | otro estado distinto de `active` |
| `not_verified` | `verification_status` distinto de `approved` |
| `account_disabled` | usuario inactivo |
| `service_not_offered` | sin el servicio activo de la subcategoría |
| `district_not_covered` | no cubre el distrito |
| `paused` | pausa vigente en `[starts_at, ends_at)` |
| `outside_availability` | la franja o el instante actual de la solicitud `asap` no caen en una franja activa |
| `schedule_conflict` | cita confirmada que se solapa con la franja programada |
| `appointment_within_2h` | en una solicitud `asap`, cita en `[now, now + 2 h)` (D-23) |

**Puntaje (D-20).** P = wC·C + wT·T + wH·H + wE·E, con los pesos de la versión de reglas de la solicitud:
- C = clamp(1 − d / Dref), y C = 1 si Dref = 0;
- T = (pmax − p) / (pmax − pmin), y T = 0,50 si pmax = pmin;
- H = 0,50 sin historial suficiente o sin reseñas; H = q / 5 con reseñas vigentes (S6);
- E = clamp(a / Aref), y E = 0 si Aref = 0.

**Orden:** por puntaje sin redondear y, a igual puntaje, por promedio real. El empate persistente comparte `tie_group`; en el corte de ronda decide el `verified_at` más antiguo y se registra `tie_break` (D-65). La distancia d son los km de `district_distances` entre el distrito base del técnico y el de la solicitud (D-64).

## 4. Ofertas del técnico (módulo `BMatching`)

### 4.1 `GET /offers` [nuevo]

Filtros:
- `status`, con uno o varios de `pending`, `accepted`, `rejected`, `expired` y `withdrawn`; por defecto, todos;
- `page`, que va de 1 en adelante;
- `per_page`, de 1 a 50 y 20 por defecto.

El orden es por `available_at` descendente. Solo devuelve las ofertas del técnico de la sesión.

```json
{
  "data": {
    "items": [
      {
        "id": 501, "status": "pending", "version": 1,
        "round": { "id": 77, "round_no": 1, "kind": "automatic" },
        "available_at": "2026-10-20T14:00:00.000000Z",
        "expires_at": "2026-10-20T14:10:00.000000Z",
        "responded_at": null,
        "reference_fee": { "amount": "90.00", "currency": "PEN", "is_reference": true },
        "request": {
          "id": 310, "subcategory": { "id": 4, "name": "Mantenimiento de equipos de frío" },
          "district": { "id": 2, "name": "El Tambo" },
          "mode": "scheduled",
          "preferred_start_at": "2026-10-21T15:00:00.000000Z",
          "preferred_end_at": "2026-10-21T17:00:00.000000Z",
          "description": "La cámara de frío no baja de 8 grados desde ayer.",
          "evidence": [{ "media_id": 88, "url": "/api/v1/media/88" }],
          "address": null
        }
      }
    ],
    "pagination": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
  },
  "meta": { "request_id": "6f1c…", "server_time": "2026-10-20T14:01:30.000000Z" }
}
```

`request.address` es `null` hasta que el técnico sea el asignado (SEC-S04-05).

### 4.2 `GET /offers/{id}` [nuevo]

Devuelve el mismo objeto de un elemento de §4.1. Una oferta ajena responde 404. Se usa para recuperar el estado tras un fallo de red o una reconexión.

### 4.3 `POST /offers/{id}/response` [nuevo]

```http
POST /api/v1/offers/501/response
Idempotency-Key: 2b0f3c9e-5a8d-4c1e-9f7a-1d2e3f4a5b6c
```
```json
{ "decision": "accept", "expected_version": 1, "reason": null }
```

- `decision`: `accept` o `reject`. Error: «La respuesta debe ser aceptar o rechazar.»
- `expected_version`: entero de 1 en adelante.
- `reason`: texto opcional, solo para `reject`. **Sin límite de longitud** hasta que se decida (no se inventa un número). La pantalla no lo exige.

**200:**
```json
{
  "data": { "id": 501, "status": "accepted", "version": 2, "responded_at": "2026-10-20T14:09:59.000000Z",
            "round": { "id": 77, "status": "open" } },
  "meta": { "request_id": "…", "server_time": "2026-10-20T14:09:59.120000Z" }
}
```

**Errores:**
- 409 `OFFER_EXPIRED`, `OFFER_NOT_PENDING`, `TECHNICIAN_UNAVAILABLE` (solo al aceptar) o `STALE_VERSION`;
- 422 `VALIDATION_FAILED`;
- 404 si la oferta es ajena.

**Efectos:**
- aceptar no crea participación ni cita;
- un rechazo, cuando era la última `pending` sin aceptaciones, cierra la ronda y abre la siguiente sin esperar al job (RN §5.3).

## 5. Elección del cliente (módulo `BMatching`)

### 5.1 `GET /requests/{id}/candidates` [nuevo]

Solo el titular. Devuelve **solo las ofertas `accepted`** de la ronda vigente, o las alternativas en `direct_declined`. **Nunca** incluye ofertas pendientes, rechazadas, vencidas ni de otras solicitudes, ni el puntaje o los factores, que son explicación interna (SEC-S04-01).

En `awaiting_choice`:
```json
{
  "data": {
    "phase": "awaiting_choice", "request_version": 6,
    "round": { "id": 77, "round_no": 1, "kind": "automatic", "status": "awaiting_choice" },
    "accepted": [
      {
        "offer_id": 501, "rank_position": 1, "tie_group": null,
        "technician": { "id": 12, "display_name": "Frío Andino Servicios", "provider_type": "company",
                        "rating": { "average": null, "count": 0 } },
        "reference_fee": { "amount": "90.00", "currency": "PEN", "is_reference": true },
        "distance": { "km": "3.500", "approximate": true, "label": "aproximada por zona" },
        "estimate": { "status": "new", "minutes": null, "label": "Nuevo, sin estimación" }
      }
    ],
    "alternatives": []
  },
  "meta": { "request_id": "…", "server_time": "…" }
}
```

En `direct_declined`, `accepted` va vacío y `alternatives` trae hasta 3 tarjetas con la misma forma, sin `offer_id` (**a nadie se le contactó todavía**). `distance` es `null` solo si el técnico no declaró distrito base. `estimate` vale `{ "status": "estimated", "minutes": 90, "label": "Tiempo estimado: 1 h 30 min" }` con 3 o más participaciones finalizadas en la subcategoría (mediana, D-69) y `new` en otro caso.

### 5.2 `POST /requests/{id}/selection` [nuevo]

```http
POST /api/v1/requests/310/selection
Idempotency-Key: 7c1d…
```
```json
{ "offer_id": 501, "expected_version": 6 }
```

**200:**
```json
{
  "data": {
    "request": { "id": 310, "status": "assigned", "phase": "assigned", "version": 7 },
    "participation": { "id": 41, "slot": "primary", "status": "assigned", "technician_id": 12,
                       "reference_fee": { "amount": "90.00", "currency": "PEN", "is_reference": true },
                       "assigned_at": "2026-10-20T14:12:00.000000Z" },
    "appointment": { "id": 33, "status": "confirmed",
                     "starts_at": "2026-10-21T15:00:00.000000Z", "ends_at": "2026-10-21T17:00:00.000000Z" }
  },
  "meta": { "request_id": "…", "server_time": "…" }
}
```

En una solicitud `asap`, la cita va de `assigned_at` a `assigned_at + 2 h` (D-66).

**Errores:**
- 409 `ROUND_NOT_CLOSED`, `TECHNICIAN_UNAVAILABLE`, `SCHEDULE_CONFLICT` o `STALE_VERSION`;
- 422 si `offer_id` no es una aceptada de esta solicitud;
- 404 si la solicitud es ajena.

Con `TECHNICIAN_UNAVAILABLE` o `SCHEDULE_CONFLICT`, esa oferta queda `withdrawn`. Si no queda ninguna aceptada, la ronda se cierra y se abre la siguiente (automática) o se pasa a `direct_declined` (directa). **La SPA vuelve a leer `GET /requests/{id}/candidates` tras cualquier 409.**

### 5.3 `POST /requests/{id}/alternative-searches` [nuevo]

Solo en `direct_declined`. El cuerpo es `{ "expected_version": 6 }`.

**202:**
```json
{ "data": { "id": 310, "status": "sent", "phase": "matching", "version": 7, "search_generation": 2 },
  "meta": { "request_id": "…", "server_time": "…" } }
```

Abre una búsqueda automática **sin el técnico objetivo**. Errores: 409 `NO_ALTERNATIVES_PENDING` o `STALE_VERSION`, y 404 si la solicitud es ajena.

### 5.4 `GET /requests/{id}` [cambia]

Se agregan campos al detalle de S3:

```json
{
  "data": {
    "id": 310, "status": "sent", "phase": "awaiting_responses", "version": 5, "search_generation": 1,
    "search": {
      "current_round": { "id": 77, "round_no": 1, "kind": "automatic", "status": "open",
                          "opened_at": "2026-10-20T14:00:00.000000Z", "expires_at": "2026-10-20T14:10:00.000000Z",
                          "offers_total": 3, "accepted_count": 0 },
      "pending_since": null, "pending_expires_at": null
    },
    "assignment": null
  },
  "meta": { "request_id": "…", "server_time": "…" }
}
```

- Al titular le dice cuántas ofertas hay, pero no a quién se enviaron.
- `assignment` repite `participation` y `appointment` de §5.2 cuando el estado es `assigned`.
- Al técnico notificado le llega el mismo detalle de S3 con `address = null` hasta que lo asignen y sin `search`.

### 5.5 `POST /requests` [cambia, D-60]

Es igual que en S3 y añade la cabecera opcional `Idempotency-Key`. Con la misma clave y el mismo cuerpo devuelve el **mismo 201 con el mismo `id`**; con otro cuerpo, 409 `STALE_VERSION`.

## 6. Archivos: `DELETE /media/{id}` [nuevo, D-61]

Aplica a `purpose=evidence` del dueño, cuando no está en `request_attachments`. Responde **204** sin cuerpo:
- marca `retired_at`;
- borra el archivo del disco;
- registra `audit_entries` con la acción `media.retired`.

**Errores:**
- 409 `MEDIA_LINKED` si está adjunta;
- 404 si es ajena, si ya está retirada o si tiene otro `purpose` (los archivos de portafolio y documentos se retiran por su recurso);
- 401 si no hay sesión.

La SPA pide confirmación antes de llamar (CRUD-03).

## 7. Notificaciones (módulo `CNotifications`)

### 7.1 `GET /notifications` [nuevo]

Lista la bandeja del usuario de la sesión, ordenada por `created_at` descendente. Acepta `after_id` para recuperar lo que falte al reconectar, `page` y `per_page` (de 1 a 50; 20 por defecto).

```json
{
  "data": {
    "items": [
      { "id": 9001, "type": "offer.created", "title": "Nueva solicitud para ti",
        "body": "Mantenimiento de equipos de frío en El Tambo. Responde antes de las 09:10.",
        "subject": { "type": "offer", "id": 501 }, "event_id": "0b6e…", "created_at": "2026-10-20T14:00:00.000000Z",
        "read_at": null }
    ],
    "pagination": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
  },
  "meta": { "request_id": "…", "server_time": "…" }
}
```

- El texto de `body` sale en la hora de Lima.
- La bandeja no depende del correo: la notificación se crea en la misma transacción que la oferta (D-21).
- El correo de la sandbox (mailer `log`) lleva sus intentos en `notification_attempts`, que **no se exponen** en la API de S4.

## 8. Tiempo real: Reverb y Echo [nuevo, D-70]

**Conexión.** Echo con `broadcaster: 'reverb'`. La clave y el host salen de `VITE_REVERB_*` (puerto 8081 en el slot A y 8082 en el B). La autorización usa `POST /api/v1/broadcasting/auth` con la sesión y el CSRF de Sanctum.

**Canales privados:**

| Canal | Quién se suscribe | Eventos |
|---|---|---|
| `private-requests.{requestId}` | Solo el cliente titular | `request.updated` |
| `private-technicians.{technicianProfileId}` | Solo ese técnico | `offer.created`, `offer.updated` |
| `private-users.{userId}` | El propio usuario | `notification.created` |

**Carga mínima** (SEC-S04-05: sin dirección, descripción, teléfono ni correo):
```json
{ "event_id": "0b6e2f7a-…", "type": "request.updated", "request_id": 310, "status": "sent",
  "phase": "awaiting_choice", "version": 6, "occurred_at": "2026-10-20T14:10:00.000000Z" }
```
```json
{ "event_id": "9d41…", "type": "offer.created", "offer_id": 501, "request_id": 310, "status": "pending",
  "version": 1, "expires_at": "2026-10-20T14:10:00.000000Z", "occurred_at": "2026-10-20T14:00:00.000000Z" }
```

**Reglas de Echo para la SPA:**
1. **Un evento es un aviso, no un dato:** al recibirlo, la SPA vuelve a pedir el recurso por la API (`GET /requests/{id}`, `GET /offers/{id}` o `GET /notifications?after_id=`) y pinta lo que devuelve la API.
2. **Deduplicación:**
   - se guardan los `event_id` ya vistos (los últimos 200);
   - se ignora un `event_id` repetido;
   - se ignora una `version` menor o igual que la que ya se muestra para ese recurso.
3. **Al reconectar** (`connected` después de `disconnected` o `unavailable`):
   - se pide **una vez** el estado de lo que esté en pantalla: el detalle de la solicitud o `GET /offers?status=pending,accepted`;
   - además, `GET /notifications?after_id=<último visto>`.
   - No se reproducen los eventos perdidos: manda la API.
4. **Sin Reverb** (la conexión falla): la pantalla funciona igual con recargas manuales y muestra «Sin conexión en tiempo real. Actualiza para ver cambios.» (`role=status`).

Los eventos se publican **solo después del commit**, desde `outbox_events` (TC-046). El tiempo real no promete orden entre canales.

## 9. Datos E2E (para el S4.5 de Codex)

`Sprint04E2ESeeder` se ejecuta con la guarda `E2EDatabaseGuard` (D-59) y con `node scripts/run-e2e.mjs --sprint 04 --slot B`. Cuentas sintéticas en `@example.test`:

| Cuenta | Para qué sirve |
|---|---|
| `e2e-client-match` | Solicitud programada en `awaiting_choice` con dos aceptaciones |
| `e2e-client-direct` | Solicitud directa con su oferta a punto de vencer |
| `e2e-client-pending` | Solicitud en `pending_availability` |
| `e2e-technician-frio` y `e2e-technician-electro` | Ofertas `pending` |
| `e2e-technician-busy` | Cita confirmada que provoca `SCHEDULE_CONFLICT` |

**Tareas de Cypress**, que el arrancador expone con `cy.task` y que solo funcionan con `APP_ENV=testing` y la base del slot:
- `serverClock('+10m')`: adelanta el reloj del **servidor** por medio de `App\Shared\Clock`. `cy.clock` solo mueve el del navegador; el reloj vuelve a la hora real al terminar cada spec.
- `runJobs()`: ejecuta `queue:work --stop-when-empty` y el barrido del scheduler una vez.
- `openRoundFor('<cuenta técnico>')`: abre una ronda para el técnico indicado, para probar el tiempo real.

El arrancador levanta también Reverb, la cola y el scheduler del slot (D-70). El bloqueo `tmp/e2e-cypress.lock` sigue siendo global.

## 10. Cambios respecto de S3

| Ruta o pieza | Cambio |
|---|---|
| `POST /requests` | Acepta `Idempotency-Key` (D-60) |
| `POST /requests/{id}/submission` | Tras el commit encola `PrepareMatching`; la respuesta no cambia |
| `GET /requests/{id}` | Nuevos campos `phase`, `search_generation`, `search` y `assignment`; el técnico notificado puede leerla, sin dirección |
| `GET /media/{id}` | El técnico notificado puede descargar las evidencias de esa solicitud |
| `GET /requests` | Cada elemento añade `phase` |
| Nuevas | `GET /offers`, `GET /offers/{id}`, `POST /offers/{id}/response`, `GET /requests/{id}/candidates`, `POST /requests/{id}/selection`, `POST /requests/{id}/alternative-searches`, `GET /notifications`, `DELETE /media/{id}` y `POST /broadcasting/auth` |
| Versión de reglas | Parámetros de matching en la versión 2 (D-63) |
| `PATCH /technicians/me/profile` | Acepta `base_district_id` (distrito activo; 422 «Selecciona un distrito activo.»); `GET` lo devuelve (D-64) |

## 11. Cambios de la versión 1.1 (S4.3)

Lo que fijó la implementación del backend. No cambia ninguna ruta ni código de error de la v1.0.

| Tema | Precisión |
|---|---|
| Paso 1 y 2 (§3) | `PrepareMatching` ejecuta el matching **y abre la ronda en el mismo job** (S04-TC-030 exige una ronda tras preparar). `OpenOfferRound` queda para reintentos explícitos. |
| Barrido (§3) | El scheduler ejecuta `php artisan tecnicoya:sweep` cada minuto: vence rondas, expira o reintenta pendientes (cada 5 min desde el pendiente o el último reintento, D-67), entrega notificaciones atrasadas y publica el outbox. |
| Reasignación | Cada ronda nueva vuelve a ejecutar el matching (los datos pudieron cambiar) y excluye a quien ya tuvo oferta en la solicitud (RN-11.1). |
| Distancia sin distrito base | Si el técnico no declaró distrito base, **C = 0** (la cercanía no aporta) y `distance` va en `null`. **Pendiente de confirmar: DIST-02 en DECISIONES.md.** |
| Respuestas 409 idempotentes | `POST /offers/{id}/response`, `…/selection` y `…/alternative-searches` guardan también sus 409 de negocio con la `Idempotency-Key`: repetir la misma clave y cuerpo devuelve el mismo 409. Tras un 409 la SPA genera una clave nueva. |
| Retiro por indisponibilidad | En `selection`, `TECHNICIAN_UNAVAILABLE` o `SCHEDULE_CONFLICT` retiran la oferta y suben `request_version`; si no queda ninguna aceptada sigue la búsqueda (§5.2). |
| Notificaciones de la bandeja | `offer.created` al técnico; `request.awaiting_choice`, `request.direct_declined`, `request.pending` y `request.expired` al cliente; `request.assigned` al técnico elegido. |
| `GET /offers` | `status` admite la lista separada por comas (`?status=pending,accepted`) o como arreglo. |
| `GET /requests/{id}` | `search.alternatives_available` (booleano) en `direct_declined`. |
| `GET /technicians/me/profile` | Devuelve `base_district_id` (D-64; S04-TC-128). |
| Carga de `notification.created` | `event_id`, `type`, `notification_id` y `occurred_at` (§8). |
| Aislamiento de MySQL | La conexión usa **READ COMMITTED** (`DB_ISOLATION_LEVEL`): tras esperar el bloqueo de la solicitud se lee lo confirmado y no hay bloqueos de hueco (deadlocks hallados con S04-TC-040 y 045). |
| Datos E2E (§9) | Sin cambios de cuentas. Las ofertas del seeder duran 10 min desde la siembra: usar `serverClock` y reponerlo con `serverClock('reset')`. Tareas en `scripts/e2e-tareas-s04.mjs`: `on('task', tareasSprint04())` en la configuración de Cypress. |
