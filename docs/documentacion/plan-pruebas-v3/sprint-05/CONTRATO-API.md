# Contrato de API · adelanto del Sprint 5 (panel del cliente)

| Campo | Valor |
|---|---|
| Versión | 1.0 (2026-10-27) |
| Autor | Claude Code |
| Revisor | [PENDIENTE] |
| Base | `main` `c7dc292` (rama `feature/mayhuasca/cliente/cercania`) |
| Decisiones | D-87 (adelanto del S5 con IDs S05-TC), D-88 (cercanía), D-89 (línea de tiempo), D-90 (leídas) y D-91 (datos del cliente) |
| Catálogo de casos | [CATALOGO-S05.csv](CATALOGO-S05.csv): S05-TC-001 a 024 en Pest |
| Plan | [PLAN-PANEL-CLIENTE.md](../../sprints/PLAN-PANEL-CLIENTE.md) |

Todas las rutas van bajo `/api/v1`, usan la sesión SPA de Sanctum y siguen las convenciones del contrato v1 (S1 a S4): el sobre `data` en las respuestas correctas y `error`, `errors` y `message` en español en los errores. **Todos los cambios son aditivos**: ningún campo existente cambia de nombre ni de tipo.

## 1. `GET /technicians` **[cambia]** (D-88)

Parámetros nuevos (un parámetro desconocido sigue dando 422, contrato S3 §5.1):

| Parámetro | Valores | Detalle |
|---|---|---|
| `sort` | `name` (por defecto) o `proximity` | Con `name`, el orden y la forma de la respuesta no cambian |
| `max_fee` | número de 0 a 10 000 | Al menos un servicio que cumple los demás filtros (`specialty_id`, `subcategory_id`) tiene `reference_fee <= max_fee`; el límite se incluye |

**Origen de la cercanía:** `district_id` si se envía (sigue filtrando a los técnicos que cubren ese distrito); si no, el distrito principal del cliente (`client_profiles.district_id`). Sin origen: **422** en `sort` («Elige un distrito o registra tu distrito principal para ordenar por cercanía.»).

**Orden con `sort=proximity`:** sin puntaje (RT-02).
1. Técnicos cuyo distrito base es el origen.
2. Técnicos con par en `district_distances` (D-64), por km ascendente.
3. Técnicos sin distrito base o sin par en la matriz.

El desempate es por `display_name` e `id`, así que la paginación es estable.

**Tarjeta:** las claves del S3 más, solo con `sort=proximity`:

```json
"distance": {"km": 3.5, "same_district": false, "approximate": true, "label": "aproximada por zona"}
```

`distance` es `null` en el grupo 3. Nunca se exponen el distrito base, el teléfono, el WhatsApp, el correo ni la dirección.

## 2. `GET /requests` **[cambia]** (D-87)

Cada fila suma `subcategory {id, name}`, `district {id, name}` y `updated_at`.

## 3. `GET /requests/{id}` **[cambia]** (D-89)

Solo para el **titular**, el detalle suma `timeline`, en orden cronológico (`occurred_at` e id):

```json
"timeline": [{"type": "request.submitted", "label": "Solicitud enviada", "from_status": "registered", "to_status": "sent",
              "occurred_at": "2026-10-20T14:00:00.000000Z"}]
```

| `type` | `label` |
|---|---|
| `request.registered` | Solicitud registrada |
| `request.submitted` | Solicitud enviada |
| `round.opened` | Enviamos tu solicitud a técnicos disponibles |
| `request.pending` | Sin técnicos disponibles por ahora; seguimos buscando |
| `round.awaiting_choice` | Hay técnicos que aceptaron: elige uno |
| `matching.direct_declined` | El técnico que elegiste no aceptó la solicitud |
| `matching.direct_unavailable` | El técnico que elegiste no está disponible |
| `request.alternative_search` | Autorizaste buscar otros técnicos |
| `selection.unavailable` | El técnico elegido ya no estaba disponible |
| `request.assigned` | Elegiste a tu técnico |
| `request.expired` | La solicitud venció sin técnico asignado |

Los demás tipos (correcciones, fotos o tipos futuros) no se muestran. Nunca van `summary`, `metadata`, `actor_id` ni `correlation_id`. El técnico notificado recibe el detalle **sin** `timeline`. La SPA vuelve a pedir el detalle al recibir `request.updated` en `requests.{id}` (contrato S4 §8).

## 4. Notificaciones (D-90)

### 4.1 `GET /notifications` **[cambia]**

| Parámetro | Valores |
|---|---|
| `state` | `read` o `unread` |
| `type` | tipo de notificación, por ejemplo `request.assigned` (hasta 60 caracteres, minúsculas, `_` y `.`) |

`data` suma `unread_count`, que cuenta **todas** las no leídas del usuario, sin importar los filtros ni la página: `{items, pagination, unread_count}`.

### 4.2 `POST /notifications/{id}/read` **[nuevo]**

Marca como leída una notificación **propia** y devuelve el ítem con la forma del §7.1 del S4. Repetirla conserva la primera `read_at`. Una notificación ajena o inexistente da **404** sin cambios.

### 4.3 `POST /notifications/read-all` **[nuevo]**

Marca todas las propias sin leer y devuelve `{"updated": n}`.

Las tres rutas exigen sesión (401) y comparten el middleware `technician.not_suspended` de la bandeja.

## 5. `PATCH /me` y `GET /me` **[cambia]** (D-91)

`PATCH /me` admite, **solo para cuentas con perfil de cliente**:

| Campo | Regla |
|---|---|
| `district_id` | distrito activo; obligatorio si se envía |
| `reference_address` | texto de hasta 255 caracteres; `null` la borra |

Un técnico o administrador que los envía recibe **422** («Este dato solo se guarda en el perfil de un cliente.»). Usa el `expected_version` del usuario (409 si está desfasado) y sube también la versión de `client_profiles`.

`GET /me` y `PATCH /me` devuelven `client_profile.reference_address` **solo a su dueño**. El registro y el inicio de sesión siguen sin devolverla (S07-TC-001, D-80).

## 6. Datos

Sin migraciones. Se usan `district_distances` (D-64), `request_events`, `notifications.read_at` y `client_profiles.default_address`, que ya existían.
