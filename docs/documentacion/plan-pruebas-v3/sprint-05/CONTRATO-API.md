# Contrato de API · adelanto del Sprint 5 (panel del cliente)

| Campo | Valor |
|---|---|
| Versión | 1.0 (2026-10-27) |
| Autor | Claude Code |
| Revisor | [PENDIENTE] |
| Base | `main` `c7dc292` (rama `feature/mayhuasca/cliente/cercania`) |
| Decisiones | D-87 (adelanto del S5 con IDs S05-TC), D-88 (cercanía), D-89 (línea de tiempo), D-90 (leídas) y D-91 (datos del cliente) |
| Catálogo de casos | [CATALOGO-S05.csv](CATALOGO-S05.csv): S05-TC-001 a 024 en Pest y S05-TC-025 a 040 en Vitest (SPA, PR del frontend) |
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

## 7. `GET /client/home` **[nuevo]** (Inicio del cliente aprobado en la revisión del PR #39, versión 1.1 del 2026-10-28)

Solo para clientes (`role:client`; un técnico recibe 403). Número fijo de consultas, sin importar cuántos técnicos haya (S05-TC-054).

```json
{"district": {"id": 1, "name": "Huancayo"}, "technicians_in_zone": 7,
 "prices": [{"specialty_id": 1, "name": "Cómputo", "from_fee": "60.00", "currency": "PEN"}],
 "subcategories": [{"id": 4, "specialty_id": 1, "code": "computo-hardware", "name": "Reparación de hardware"}]}
```

| Campo | Detalle |
|---|---|
| `district` | Distrito principal del cliente, o `null` si no lo registró |
| `technicians_in_zone` | Técnicos elegibles (los mismos que `GET /technicians?district_id=`): verificados, activos, con cuenta habilitada, sin pausa vigente y con un servicio activo, que atienden ese distrito. `null` sin distrito |
| `prices` | Tarifa vigente más baja por especialidad activa entre técnicos elegibles. Las especialidades sin técnicos con tarifa no aparecen. Es referencial, no un cobro |
| `subcategories` | Subcategorías activas de especialidades activas, para resolver los atajos por problema (D-93) |

No incluye nombres, contacto ni identificadores de técnicos, ni la dirección del cliente.

## 8. Buscador «¿Qué se malogró?» (versión 1.2 del 2026-10-28, D-94)

### 8.1 `GET /catalog/suggestions?q=` **[nuevo]**

Público como el resto del catálogo. `q`: de 3 a 120 caracteres (422 en español). Límite de 30 consultas por minuto e IP (`SUGGESTIONS_PER_MINUTE`; 429 al pasarlo).

```json
{"source": "keywords", "level": "alta",
 "items": [{"subcategory_id": 14, "subcategory_name": "Congeladores industriales", "specialty_id": 2,
            "specialty_name": "Refrigeración comercial", "score": 9}]}
```

| Campo | Detalle |
|---|---|
| `source` | `keywords` (diccionario) o `ai` (la IA resolvió una consulta de confianza baja) |
| `level` | `alta` (puntaje de 8 o más), `media` (4 o más), `baja` o `null` sin coincidencias; con IA, `media` |
| `items` | Hasta 3 subcategorías activas de especialidades activas, la más probable primero; con IA, `score` es `null` |

Sin coincidencias, la consulta normalizada se cuenta en `keyword_misses`. La IA recibe solo el texto (hasta 120 caracteres) y la lista cerrada `[{id, name}]`. Cualquier id fuera de la lista se descarta y, ante un error o un tiempo agotado, se responde con el diccionario.

### 8.2 Catálogo › Palabras clave **[nuevo]** (`catalog.manage`, auditado)

| Método y ruta | Detalle |
|---|---|
| `GET /admin/keywords?subcategory_id=&q=&page=` | Frases (50 por página) con subcategoría, especialidad, peso, tipo, activa y versión |
| `POST /admin/keywords` | `subcategory_id`, `phrase` (2 a 120), `weight` (1 a 10) y `kind` (`objeto`, `sintoma` o `general`). Frase repetida en la subcategoría: 422. Audita `catalog.keyword_created` |
| `PATCH /admin/keywords/{id}` | `phrase`, `weight`, `kind` o `active` con `expected_version` (409 si cambió). Audita `catalog.keyword_updated`; las frases no se borran, se desactivan |
| `GET /admin/keywords/test?q=` | Probar una frase: solo el diccionario, con `level`, `items` y las frases que coincidieron (`matched`) |
| `GET /admin/keyword-misses` | Las 50 búsquedas sin resultado más frecuentes |
| `GET /admin/keyword-suggestions` | Frases sugeridas por la IA pendientes |
| `POST /admin/keyword-suggestions/{id}/approval` | Crea la frase (peso 5 y tipo general por defecto). Si la sugerencia ya se resolvió, 409. Audita `catalog.keyword_suggestion_approved` |
| `DELETE /admin/keyword-suggestions/{id}` | Descarta la frase sugerida. Audita `catalog.keyword_suggestion_discarded` |

### 8.3 Datos

Migración `000029`: `subcategory_keywords`, `keyword_misses` y `keyword_suggestions`. `KeywordSeeder` (en `DatabaseSeeder` y en las siembras E2E) carga `database/seeders/data/keywords.php` sin pisar lo que cambió el administrador.
