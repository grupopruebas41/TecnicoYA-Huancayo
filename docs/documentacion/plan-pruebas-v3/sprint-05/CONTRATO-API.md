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

## 9. Pedido por especialidades (versión 1.4 del 2026-11-04, D-95 y D-96; reemplaza a la 1.3 de D-92)

Un pedido agrupa una solicitud por especialidad, cada una con todas las subcategorías que el cliente marcó de esa especialidad. La solicitud dirigida a un técnico sigue siendo de una sola subcategoría (`POST /requests` con `source=profile`).

### 9.1 `GET /orders/quota` **[cambia]** (cliente)

```json
{"max": 3, "active": 1, "available": 2}
```

- `active` cuenta **pedidos activos**: pedidos con al menos una solicitud desde `sent` hasta el cierre o la cancelación. Una solicitud sin pedido cuenta como uno; `registered` no cuenta (D-95).
- Sale `max_items`: un pedido ya no tiene tope de rubros.
- Si el usuario no es cliente, responde 403.

### 9.2 `POST /orders` **[cambia]** (cliente, `Idempotency-Key` obligatoria)

```json
{"district_id": 1, "address": "Jr. Sintético 742", "address_reference": "Frente al parque", "mode": "scheduled",
 "scheduled_date": "2026-11-21", "time_slot": "tarde", "summary_confirmed": true,
 "items": [{"specialty_id": 2, "subcategory_ids": [14, 15], "description": "No enfría desde ayer…", "urgency": "urgente",
            "brand": "Marca", "model": "X-100", "symptom_ids": [101], "media_ids": [55]}]}
```

| Campo | Regla |
|---|---|
| `items` | Una o más especialidades (422 `order_items`) |
| `items.*.specialty_id` | Activa y sin repetirse en el pedido (422 `order_specialty` u `order_specialty_repeated`) |
| `items.*.subcategory_ids` | Al menos una; activas, de esa especialidad y sin repetirse en todo el pedido (422 en `items.N.subcategory_ids.M`). La primera es la principal |
| `items.*.description` | De 20 a 1000 caracteres (D-12); una por solicitud |
| `items.*.urgency` | `normal` o `urgente`. Es solo informativa: el técnico la ve en la oferta y no cambia el matching |
| `items.*.brand`, `items.*.model` | Opcionales, de hasta 60 caracteres; uno por solicitud |
| `items.*.symptom_ids` | Síntomas activos de cualquiera de sus subcategorías (422 en `items.N.symptom_ids.M`) |
| `items.*.media_ids` | Hasta 5 por solicitud. Cada foto debe ser propia, privada, revisada y libre, y no puede repetirse entre especialidades |
| `address_reference` | Opcional, de hasta 120 caracteres; se muestra con la regla de la dirección (SEC-S04-05) |
| `mode` | `asap`, o `scheduled` con `scheduled_date` (`Y-m-d`) y `time_slot` |
| `time_slot` | `manana` (08–12), `tarde` (12–18) o `noche` (18–21), en hora de Lima. Una franja que ya empezó da 422 (D-55). Se guarda como `preferred_start_at` y `preferred_end_at` en UTC |
| `source`, `target_technician_id` | Prohibidos (422 `order_targeted`) |

- **Límite (D-95):** con 3 pedidos activos o más, responde 409 `ACTIVE_REQUEST_LIMIT` y no crea nada. El envío de un borrador (`POST /requests/{id}/submission`) aplica el mismo límite.
- **Envío:** en una sola transacción, con su clave, crea el pedido y un borrador por especialidad, y los envía con el flujo del S3: revalidación, versión de reglas y `PrepareMatching` después del commit. O se envían todas o ninguna.
- **Idempotencia:** la misma clave con el mismo cuerpo devuelve el mismo 201; con otro cuerpo, 409.
- **Respuesta 201:**

```json
{"id": 9, "status": "sent", "requests": [{"id": 41, "status": "sent", "version": 2, "specialty": {"id": 2, "name": "Refrigeración comercial"},
  "subcategory": {"id": 14, "name": "Congeladores industriales"},
  "subcategories": [{"id": 14, "name": "Congeladores industriales"}, {"id": 15, "name": "Vitrinas"}]}]}
```

### 9.3 Catálogo **[cambia]**

- `GET /catalog/specialties` agrega `subcategory_count` (subcategorías activas).
- `GET /catalog/subcategories` agrega `reference_fee`: tarifa «desde», texto con 2 decimales, o `null`.
- `GET /catalog/subcategories/{id}/symptoms` **[nuevo]**, público: `[{"id", "name"}]` activos y en su orden. Si la subcategoría no existe o está inactiva, responde 404.

### 9.4 Solicitudes y ofertas **[cambia]**

- `GET /requests` agrega `order_id`, `urgency` y `subcategories` (`[{"id", "name"}]`).
- `GET /requests/{id}` agrega `order_id`, `urgency`, `brand`, `model`, `time_slot`, `address_reference`, `symptoms` (`[{"id", "name"}]`) y `subcategories`.
- En los dos, `subcategory` sigue siendo la principal. Una solicitud sin pedido trae en `subcategories` solo esa.
- `reference_fee.amount` es la suma de las tarifas «desde» del catálogo; `null` si ninguna tiene tarifa. Siempre es referencial (RF-04).
- La oferta del técnico (`GET /offers` y `GET /offers/{id}`) agrega en `request` los campos `urgency`, `brand`, `model`, `symptoms` (solo los nombres) y `subcategories`. `reference_fee.amount` es la suma de **sus** tarifas.
- El aviso `offer.created` nombra todas las subcategorías.

### 9.5 Matching (D-96)

- **Elegibilidad:** además de los filtros vigentes, el técnico debe tener activo el servicio de **todas** las subcategorías; si no, `service_not_offered`. Si nadie las atiende todas, la solicitud entra al pendiente de 24 h.
- **Puntaje (fórmula de D-20):** tarifa T = suma de sus tarifas; experiencia E = la menor; estimación de tiempo = mediana de los servicios de cualquiera de las subcategorías.
- **Registro:** `algorithm_version` = `matching_v2`. Con varias subcategorías, `input_snapshot` agrega `services` (`technician_service_id`, `subcategory_id`, `fee` y `experience_years` de cada una). Con una sola, la fotografía y el puntaje no cambian.

### 9.6 Datos

- **Migración `000030`:**
  - `service_orders` (`client_id`, `item_count`, `submitted_at`);
  - en `service_requests`: `order_id`, `urgency`, `brand`, `model`, `address_reference` y `time_slot`;
  - `subcategory_symptoms` y `request_symptoms`.
  - Corre en MySQL y en SQLite, y se recupera de un intento a medias (DEF-53).
- **Migración `000031`:**
  - `request_subcategories` (`request_id`, `subcategory_id`, `position`), solo en las solicitudes de un pedido;
  - `service_orders.item_count` sin tope, con mínimo 1;
  - versión 3 de reglas, vigente desde el 2026-11-04, con `max_active_orders_per_client` = 3 y sin `max_active_requests_per_client`; el resto y los pesos se copian de la versión 2.
- **`SymptomSeeder`:** es idempotente, está en `DatabaseSeeder` y en las siembras E2E, y siembra de 4 a 6 problemas por subcategoría (`database/seeders/data/symptoms.php`). Su edición desde el panel queda para el S7.

## 10. Mis solicitudes (versión 1.5 del 2026-11-04, Fase 2 del panel final)

`GET /requests` no cambia: lo siguen usando el Inicio y los contadores del panel.

### 10.1 `GET /client/requests` **[nuevo]** (cliente)

| Parámetro | Regla |
|---|---|
| `tab` | `active` (por defecto), `scheduled`, `completed` o `cancelled` |
| `q` | Opcional, hasta 100 caracteres. Busca, sin distinguir mayúsculas ni tildes, en subcategorías, especialidad, distrito, descripción, marca, modelo y `#número` |
| `page` | Desde 1 |
| `per_page` | De 1 a 30; por defecto, 10. Cuenta **grupos**, así un pedido nunca se parte entre páginas |

```json
{"items": [{"order": {"id": 9, "submitted_at": "2026-11-04T15:00:00.000000Z", "total": 3},
  "requests": [{"id": 41, "status": "sent", "phase": "awaiting_responses", "mode": "asap", "source": "automatic", "version": 2,
    "order_id": 9, "urgency": "normal", "specialty": {"id": 1, "name": "Cómputo"},
    "subcategories": [{"id": 14, "name": "Reparación de hardware"}], "district": {"id": 1, "name": "Huancayo"},
    "created_at": "…", "submitted_at": "…", "updated_at": "…", "preferred_start_at": null, "preferred_end_at": null, "time_slot": null,
    "technician": null, "recent_events": [{"type": "request.submitted", "label": "Solicitud enviada", "occurred_at": "…"}],
    "can_cancel": true}]}],
 "counts": {"active": 2, "scheduled": 1, "completed": 0, "cancelled": 1},
 "pagination": {"page": 1, "per_page": 10, "total": 1, "last_page": 1}}
```

- **Pestañas (D-100):**
  - `active`: `registered` (también si es programada), y `sent`, `pending_availability`, `assigned` e `in_progress` si son inmediatas;
  - `scheduled`: esos mismos estados, salvo `registered`, si son programadas;
  - `completed`: `completed`, `closed` y `unrated`;
  - `cancelled`: `cancelled` y `expired`.
- **`counts`:** por solicitud, y siguen la búsqueda.
- **`order`:** `null` en una solicitud sin pedido; `total` es el número de solicitudes del pedido, aunque la pestaña muestre menos.
- **`requests`:** dentro de un pedido, en el orden del pedido.
- **`technician`:** `{id, display_name}` del técnico asignado, o `null`. Nunca datos de contacto.
- **`recent_events`:** los 3 últimos de la lista fija de D-89.
- **Permisos:** otro rol, 403; sin sesión, 401. Cada cliente ve solo lo suyo.

### 10.2 `POST /requests/{id}/cancellation` **[nuevo]** (titular, `Idempotency-Key` obligatoria; HU-S05-06, D-28)

```json
{"reason_code": "other", "reason": "Ya lo resolví por otro medio.", "expected_version": 2}
```

- `reason_code` (D-100, aprobada el 2026-11-08): `solved`, `other_technician`, `reschedule`, `price`, `mistake` u `other`. Se guarda en `service_requests.cancellation_reason_code` (migración `000032`).
- `reason`: con `other`, obligatorio de 5 a 255 caracteres; con los demás, opcional y hasta 255. Se guarda en `cancellation_reason`; vacío queda `null`.

| Caso | Respuesta |
|---|---|
| Cancelada | 200 `{"id", "status": "cancelled", "phase": "cancelled", "version"}` |
| Sin `reason_code` o fuera de la lista; `reason` fuera de su regla; sin clave | 422 en español |
| Versión desactualizada | 409 `STALE_VERSION` |
| `in_progress`, `completed`, `closed`, `unrated`, `cancelled` o `expired` | 409 `CANCELLATION_NOT_ALLOWED` (TC-070) |
| Solicitud ajena | 404 |
| Otro rol | 403 |

**Efectos, en una transacción (TC-069):**

- las ofertas abiertas quedan `withdrawn` y las rondas abiertas, `closed`;
- la participación asignada y su cita quedan `cancelled`, y la franja del técnico se libera;
- sube `search_generation`, así los trabajos pendientes no tienen efecto;
- el pedido deja de contar para el límite de D-95 cuando no le queda ninguna solicitud abierta;
- los técnicos afectados reciben el aviso `request.cancelled`, sin el motivo;
- el historial se conserva y la línea de tiempo del titular suma `request.cancelled` («Cancelaste la solicitud»).

## 11. Buscar técnicos y perfil público modernos (versión 1.6 del 2026-11-09, Fase 3 del panel final, D-101 propuesta)

Migración `000033`. Corre en MySQL y en SQLite; los CHECK son solo de MySQL.

### 11.1 `GET /technicians` **[cambia]**

**Parámetros nuevos:**

- `sort`: `name` (por defecto), `proximity`, `price` o `experience`. Con `price` cuenta la tarifa más baja de los servicios que cumplen el filtro, de menor a mayor; con `experience`, los años, de mayor a menor. El empate es por nombre e id. Con `proximity`, `price` o `experience`, la tarjeta trae `distance` si hay origen; con `name`, no.
- `available_today`: `1` o `0`. Con `1` deja solo a quien tiene hoy, en Lima, una franja semanal vigente que no terminó o una puntual que termina después de ahora.

**Campos nuevos de la tarjeta:**

```json
{"specialties": [{"id": 2, "name": "Refrigeración comercial"}], "verified": true, "favorite": false,
 "rating": {"average": null, "count": 0}, "sample_rating": {"average": 4.6, "count": 5}}
```

- `favorite`: solo el del cliente de la sesión; con otro rol es `false`.
- `sample_rating`: resumen de las reseñas de ejemplo, o `null` si no hay. `rating` sigue siendo el de las calificaciones reales (S6).
- `min_rating` no lee las reseñas de ejemplo (D-18).

| Caso | Respuesta |
|---|---|
| `sort` fuera de la lista | 422 «El orden debe ser por cercanía, precio, experiencia o nombre.» |
| `available_today` no booleano | 422 «“Disponible hoy” debe ser sí o no.» |

### 11.2 `GET /technicians/{id}` **[cambia]**

Campos nuevos: `verified`, `work_style`, `warranty_text`, `specialties[]`, `districts[]`, `services[].includes`, `favorite`, `sample_rating` y `reviews[]`, además de:

```json
"availability": {"available_today": true, "week": [{"weekday": 1, "day": "Lunes", "bands": ["morning", "afternoon"]}]}
```

```json
"sample_rating": {"average": 4.4, "count": 5, "distribution": {"5": 3, "4": 1, "3": 1, "2": 0, "1": 0}},
"reviews": [{"id": 1, "rating": 5, "comment": "…", "author_label": "Bodega en El Tambo", "reviewed_on": "2026-10-15", "sample": true}]
```

- **Franjas:** `morning` de 08 a 12, `afternoon` de 12 a 18 y `night` de 18 a 21. Una banda cuenta si alguna franja semanal activa y vigente se superpone con ella.
- **Portafolio:** `portfolio[].images[].stage` vale `before`, `after` o `null`.
- **Nunca expone** teléfono, correo, WhatsApp, dirección, distrito base, `user_id` ni documentos (TC-034).

### 11.3 Técnicos favoritos **[nuevo]** (cliente)

| Endpoint | Respuesta |
|---|---|
| `GET /client/favorites` | 200 `{"items": [tarjeta]}`, del último guardado al primero. Incluye a los técnicos en pausa para poder quitarlos |
| `PUT /client/favorites/{technician}` | 200 `{"technician_id", "favorite": true}`; idempotente. Técnico no habilitado: 404 «Técnico no disponible.» |
| `DELETE /client/favorites/{technician}` | 204; idempotente |
| Sin sesión, otro rol | 401, 403 |

### 11.4 Edición del técnico **[cambia]**

- `PATCH /technicians/me/profile` acepta `work_style` (hasta 500) y `warranty_text` (hasta 300).
- `PUT /technicians/me/services` acepta `services[].includes` (hasta 300). No crea una versión de tarifa.
- `POST` y `PATCH /technicians/me/portfolio` aceptan `image_stages[]`, en el orden de `media_ids` y del mismo largo, con `before`, `after` o `null`.

### 11.5 Datos

| Tabla | Cambio |
|---|---|
| `technician_profiles` | `work_style` (500) y `warranty_text` (300) |
| `technician_services` | `includes` (300) |
| `portfolio_images` | `stage` (`before` o `after`) |
| `client_favorite_technicians` | **Nueva:** `client_user_id`, `technician_id` y `created_at`; clave primaria compuesta |
| `technician_review_samples` | **Nueva:** reseñas de ejemplo (`rating` de 1 a 5, `comment` de 500, `author_label` de 60 y `reviewed_on`). Solo el `DemoSeeder` las siembra |
