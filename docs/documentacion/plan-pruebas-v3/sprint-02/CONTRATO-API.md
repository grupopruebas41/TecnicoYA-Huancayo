# Contrato de API · Sprint 2

**Versión:** 1.0 · **Fecha:** 2026-10-10 · **Autor:** Claude Code (paso S2.1) · **Revisor:** [PENDIENTE]
**Base:** `backend/api` en la rama `feature/mayhuasca/f-administracion/s02`. Catálogo de casos: [CATALOGO-S02.csv](CATALOGO-S02.csv) (89: 58 Pest, 17 Cypress y 14 Vitest).
**Decisiones aplicadas:** D-13, D-15, D-16, D-21, D-25, D-32 y **D-46 a D-52** (2026-10-10).

> Estado: las rutas marcadas **[existe]** ya responden en `main`; las demás se implementan en S2.3. Hasta que el PR de S2.3 se integre, Codex trabaja con este contrato (S2.4) y deja Cypress para S2.5.

## 1. Reglas comunes

Las del [contrato del Sprint 1](../sprint-01/CONTRATO-API.md) §1 siguen vigentes, sin cambios:
- prefijo `/api/v1`, sesión SPA de Sanctum y CSRF con `X-XSRF-TOKEN`;
- respuesta correcta `{ "data": …, "meta": { "request_id", "server_time" } }`; `204` sin cuerpo;
- error con `message`, `errors`, `error.code`, `error.message`, `error.fields` y `meta`;
- fallo de red: no afirmar éxito ni fracaso, y volver a leer el estado.

**Códigos nuevos o con más usos en S2:**

| Estado | `error.code` | Cuándo |
|---|---|---|
| 409 | `STALE_VERSION` | `expected_version` distinto del vigente, **o** transición de estado no permitida (aprobar un técnico activo, suspender un suspendido…). El mensaje es el genérico «La información cambió. Actualiza y vuelve a intentarlo.» |
| 409 | `ANNOUNCEMENT_NOT_EDITABLE` | `PATCH` o publicación de un comunicado que no es borrador (D-51): «Solo se pueden editar comunicados en borrador. Retíralo o duplícalo.» |
| 413 | — | Nunca: un archivo grande se rechaza con **422** en `file`. |

**Versiones:** todo recurso editable devuelve `version`. Para editarlo se envía `expected_version` con la última leída. Ante un 409, la SPA ofrece recargar y no reintenta sola.

**Eliminar vs. desactivar** (adenda S2, RT-05):

| Recurso | Operación de la pantalla | Qué hace el servidor | Confirmación (CRUD-03) |
|---|---|---|---|
| Especialidad, subcategoría, distrito | Desactivar / activar | `active=false/true`; conserva identidad y referencias | No (es reversible) |
| Comunicado | **Eliminar** | Lo retira: `retired_at`, sale de todos los paneles y se audita | **Sí** |
| Trabajo de portafolio | **Retirar** | `status=retired`; sale de la galería; filas e imágenes se conservan | **Sí** |
| Servicio del técnico | Quitar de la lista | `active=false`; las versiones de tarifa se conservan | No |
| Técnico | Suspender (solo backend en S2, D-50) | `status=suspended` con motivo | Pantalla en S7 |

## 2. Tabla de decisión rol × ruta

Actores: anónimo (A), cliente (C), técnico (T), administrador con el permiso (Adm), administrador **sin** ese permiso (Adm−) y cuenta suspendida (`users.is_active=false`, S).

| Ruta | A | C | T | Adm | Adm− | S |
|---|---|---|---|---|---|---|
| `GET /catalog/carousel`, `GET /catalog/districts` | 200 | 200 | 200 | 200 | 200 | 200 |
| `POST /media` (`portfolio`, `document`) | 401 | 403 | 201 / 422 | 403 | 403 | 403 |
| `POST /media` (`catalog`) | 401 | 403 | 403 | 201 (`catalog.manage`) | 403 | 403 |
| `/technicians/me/*` | 401 | 403 | 2xx / 409 / 422 | 403 | 403 | 403 |
| `/admin/specialties`, `/admin/subcategories`, `/admin/districts` | 401 | 403 | 403 | 2xx (`catalog.manage`) | 403 auditado | 403 |
| `/admin/announcements*` | 401 | 403 | 403 | 2xx (`announcements.manage`) | 403 auditado | 403 |
| `/admin/technicians*` | 401 | 403 | 403 | 2xx (`technicians.verify`) | 403 auditado | 403 |

La suspensión y la reactivación usan `technicians.verify` (D-16). Si el equipo crea un permiso propio de gestión de técnicos (RN-25), cambiará en S7.

## 3. Endpoints públicos

### 3.1 `GET /catalog/carousel` (HU-S02-01)

Sin sesión. Devuelve las subcategorías **activas** de especialidades **activas** con imagen **pública, revisada y no retirada**, ordenadas por especialidad y subcategoría. La SPA lo usa en el carrusel de la landing.

```json
{ "data": [ { "subcategory_id": 4, "specialty_id": 1, "specialty_name": "Cómputo", "name": "Mantenimiento de laptops",
  "description": "Limpieza y cambio de pasta térmica.", "image_url": "http://127.0.0.1:8001/api/v1/media/31" } ], "meta": { … } }
```

### 3.2 `GET /catalog/districts` (HU-S02-06)

Sin sesión. Distritos activos para el selector de zona (semilla D-15: Huancayo, El Tambo y Chilca).

```json
{ "data": [ { "id": 1, "code": "HUANCAYO", "name": "Huancayo" }, { "id": 2, "code": "EL-TAMBO", "name": "El Tambo" } ], "meta": { … } }
```

### 3.3 `GET /catalog/specialties`, `GET /catalog/subcategories?specialty_id=` **[existe]**

Sin cambios respecto al Sprint 1.

### 3.4 `GET /media/{id}` **[existe]**

Imagen pública revisada: libre. Archivo privado: solo para su dueño o, si es documento de verificación, para un administrador con `technicians.verify`. En cualquier otro caso responde **404**, sin revelar que el archivo existe. Cabecera `X-Content-Type-Options: nosniff`.

### 3.5 `GET /technicians/{id}` (con sesión) y `GET /technicians/{id}/portfolio` (pública) **[existe]**

Solo técnicos `active`. Un técnico pendiente, rechazado o **suspendido** responde 404. El perfil nunca incluye documentos, teléfono ni correo.

## 4. Archivos (`POST /media`, D-46 y D-47)

- **Petición:** `multipart/form-data` con `file` y `purpose`.

| `purpose` | Quién | Tipos aceptados (por **contenido**, no por extensión) | Tamaño | Resultado |
|---|---|---|---|---|
| `portfolio` | técnico | JPG, PNG, WebP | ≤ 5 242 880 bytes | `public`, `clean`, sin EXIF |
| `catalog` | admin con `catalog.manage` | JPG, PNG, WebP | ≤ 5 242 880 bytes | `public`, `clean`, sin EXIF |
| `document` | técnico | PDF, JPG, PNG | ≤ 5 242 880 bytes | `private`, `clean` (las imágenes, sin EXIF) |

- **201:**

```json
{ "data": { "id": 31, "purpose": "portfolio", "visibility": "public", "mime_type": "image/jpeg", "byte_size": 184233,
  "url": "http://127.0.0.1:8001/api/v1/media/31" }, "meta": { … } }
```

- **422** en `file` («El archivo debe ser una imagen JPG, PNG o WebP.», «El archivo no debe superar 5 MB.») o en `purpose`. No queda fila ni archivo en el disco.
- Subir un archivo **no** lo publica: hay que usar su `id` en un trabajo, una subcategoría, una especialidad o un documento.
- **Validación en el cliente (Vitest S02-TC-088):** los mismos tipos y el mismo límite. El servidor decide.

## 5. Técnico: perfil, documentos y portafolio (HU-S02-05)

### 5.1 `GET /technicians/me/profile`

Perfil propio completo: incluye borradores, documentos y estado de verificación.

```json
{ "data": {
  "id": 12, "display_name": "Técnico de prueba", "bio": "Diez años en refrigeración comercial.", "experience_years": 10,
  "status": "pending_verification", "verification_status": "rejected", "version": 7,
  "last_review": { "decision": "reject", "reason": "Falta el certificado vigente.", "reviewed_at": "2026-10-10T15:00:00.000000Z" },
  "services": [ { "subcategory_id": 4, "subcategory_name": "Mantenimiento de laptops", "reference_fee": "60.00", "currency": "PEN", "rate_version": 2, "active": true } ],
  "availability": { "slots": [ { "weekday": 1, "start": "08:00", "end": "12:00" } ], "district_ids": [1, 2],
    "pause": { "starts_at": "2026-10-11T13:00:00.000000Z", "ends_at": "2026-10-12T13:00:00.000000Z", "reason": "Viaje" } },
  "portfolio": [ { "id": 5, "title": "Cambio de compresor", "description": "…", "performed_on": "2026-09-30", "status": "draft", "version": 1,
    "images": [ { "media_id": 31, "position": 0, "url": "…/api/v1/media/31" } ] } ],
  "documents": [ { "id": 3, "document_type": "Certificado técnico", "review_status": "pending", "media_id": 40, "url": "…/api/v1/media/40" } ]
}, "meta": { … } }
```

`pause` es `null` si no hay una pausa vigente o futura. `last_review` es `null` si nunca fue revisado.

### 5.2 `PATCH /technicians/me/profile`

```json
{ "bio": "Diez años en refrigeración comercial.", "experience_years": 10, "expected_version": 7 }
```

- `bio`: opcional, texto de hasta 2000 caracteres o `null`. Se guarda tal cual y la SPA lo muestra como texto, nunca como HTML.
- `experience_years`: opcional, entero de 0 a 60.
- Prohibidos (422): `status`, `verification_status`, `technician_id`, `user_id` y `version`.
- **200:** el mismo `data` que §5.1. **409** con versión vieja.

### 5.3 `POST /technicians/me/verification-request` (D-50)

Sin cuerpo, salvo `{ "expected_version": 8 }`. Solo si `verification_status = rejected`: vuelve a `pending` y el técnico reaparece en la bandeja. **200** con `{ "verification_status": "pending", "version": 9 }`. En cualquier otro estado: **409**.

### 5.4 `POST /technicians/me/documents`

```json
{ "media_id": 40, "document_type": "Certificado técnico" }
```

- `media_id`: archivo propio subido con `purpose=document`, no usado en otro documento.
- `document_type`: texto de 2 a 60 caracteres.
- Como máximo **5 documentos vigentes** (no rechazados); el sexto: 422 en `media_id`.
- **201:** `{ "id": 3, "document_type": "Certificado técnico", "review_status": "pending", "media_id": 40 }`.

### 5.5 `POST /technicians/me/portfolio` **[existe; se amplía]**

```json
{ "title": "Cambio de compresor", "description": "Cámara de frío de una bodega.", "subcategory_id": 9,
  "performed_on": "2026-09-30", "status": "published", "media_ids": [31, 32] }
```

- `title`: de 2 a 160 caracteres. `description`: hasta 2000. `status`: `draft` o `published`.
- `media_ids`: **de 1 a 5** (D-46), propias, de `purpose=portfolio`, públicas y revisadas.
- **201:** `{ "id": 5, "status": "published", "version": 1 }`.

### 5.6 `PATCH /technicians/me/portfolio/{id}`

Mismos campos que §5.5, todos opcionales, más `expected_version`. Si se envía `media_ids`, reemplaza las imágenes. **200** con el trabajo como en §5.1. Trabajo de otro técnico o retirado: **404**.

### 5.7 `DELETE /technicians/me/portfolio/{id}`

Retira el trabajo (`status=retired`). **204**. Ajeno o ya retirado: **404**. La SPA pide confirmación antes (S02-TC-072).

## 6. Técnico: disponibilidad, zona, pausa y tarifas (HU-S02-06 y 07)

### 6.1 `PUT /technicians/me/availability` **[existe; reglas nuevas de D-49]**

```json
{ "slots": [ { "weekday": 1, "start": "08:00", "end": "12:00" }, { "weekday": 1, "start": "12:00", "end": "12:30" } ],
  "district_ids": [1, 2],
  "pause": { "starts_at": "2026-10-11T13:00:00Z", "ends_at": "2026-10-12T13:00:00Z", "reason": "Viaje" },
  "expected_version": 7 }
```

| Campo | Regla |
|---|---|
| `slots` | lista (puede ser vacía), hasta 21 |
| `slots.*.weekday` | 1 (lunes) a 7 (domingo) |
| `slots.*.start`, `end` | `HH:MM` de 00:00 a 23:59; `end` > `start`; **≥ 30 min**; sin cruzar la medianoche |
| solapamiento | dos franjas del mismo día **no se solapan**; las **contiguas** (`end` = `start` de la otra) sí se permiten. Error en `slots.N.start`: «La franja se solapa con otra del mismo día.» |
| `district_ids` | lista de distritos **activos**, sin repetir, hasta 20 |
| `pause` | `null` quita la pausa vigente o futura. Si existe: `starts_at` ≥ el minuto actual (zona del servidor); `ends_at` opcional y posterior a `starts_at`; `reason` hasta 255 caracteres |
| `expected_version` | obligatorio |

- **200:** `{ "technician_id": 12, "version": 8 }`. **409** con versión vieja. **422** sin escritura parcial.
- La pausa usa el intervalo [inicio, fin) (D-21): el técnico vuelve a estar disponible exactamente en `ends_at`.

### 6.2 `PUT /technicians/me/services` **[existe; reglas nuevas de D-48]**

```json
{ "services": [ { "subcategory_id": 4, "reference_fee": "60.00" } ], "expected_version": 8 }
```

- `reference_fee`: de **1.00 a 5000.00**, con **2 decimales como máximo** (se acepta número o texto). Mensajes: «La tarifa debe estar entre S/ 1,00 y S/ 5 000,00.» y «La tarifa admite como máximo 2 decimales.»
- `subcategory_id`: activa y de una especialidad activa; sin repetir.
- Un servicio que no se envía queda inactivo; sus versiones se conservan.
- Cambiar la tarifa crea la versión N+1 y se audita (`technician.rate.changed`). Enviar la misma tarifa no crea versión.
- **200:** `{ "technician_id": 12, "version": 9 }`.

## 7. Administración del catálogo (HU-S02-02, `catalog.manage`)

### 7.1 `GET /admin/specialties`

Incluye las inactivas, con sus subcategorías (también las inactivas).

```json
{ "data": [ { "id": 1, "code": "computo", "name": "Cómputo", "description": null, "image_id": 30,
  "image_url": "…/api/v1/media/30", "active": true, "version": 2,
  "subcategories": [ { "id": 4, "code": "computo-mantenimiento-de-laptops", "name": "Mantenimiento de laptops", "description": "…",
    "reference_fee": "45.00", "image_id": 31, "image_url": "…/api/v1/media/31", "active": true, "version": 3 } ] } ], "meta": { … } }
```

`reference_fee` de la subcategoría es una **referencia orientativa no vinculante** (D-52); la tarifa real la declara el técnico (D-25).

### 7.2 `POST /admin/specialties`

```json
{ "name": "Climatización", "description": "Aire acondicionado de ventana y split.", "image_id": 30 }
```

- `name`: de 2 a 120 caracteres, único. `description`: hasta 2000. `image_id`: imagen pública y revisada (`purpose=catalog`) o `null`.
- **201** con la especialidad como en §7.1 (sin `subcategories`). El `code` se genera a partir del nombre y no cambia.

### 7.3 `PATCH /admin/specialties/{id}`

`name`, `description`, `image_id` y `active`, todos opcionales, más `expected_version`; `code` prohibido. **200**. Desactivar oculta la especialidad, sus subcategorías y su carrusel del catálogo público sin tocar sus filas.

### 7.4 `POST /admin/subcategories` y `PATCH /admin/subcategories/{id}` **[existen]**

```json
{ "specialty_id": 1, "name": "Mantenimiento de laptops", "description": "…", "reference_fee": "45.00", "image_id": 31 }
```

```json
{ "active": false, "expected_version": 3 }
```

**201** / **200** con la subcategoría como en §7.1. Errores: 422 si la especialidad está inactiva, el nombre está repetido en la especialidad o la imagen no está revisada; 409 con versión vieja.

### 7.5 `GET`, `POST /admin/districts` y `PATCH /admin/districts/{id}`

```json
{ "name": "Pilcomayo" }
```

```json
{ "active": false, "expected_version": 1 }
```

- `name`: de 2 a 120 caracteres, único. El `code` se genera.
- **201** / **200:** `{ "id": 4, "code": "PILCOMAYO", "name": "Pilcomayo", "active": true, "version": 1 }`. `GET` incluye los inactivos.
- Un distrito inactivo deja de aceptarse como zona nueva, y los técnicos que ya lo tenían lo conservan.

## 8. Comunicados (HU-S02-03, `announcements.manage`)

Estados: `draft` → `published` → retirado (`retired_at`). La lectura para usuarios (`GET /announcements`) **[existe]** y devuelve los publicados, vigentes y no retirados de la audiencia del lector, con vigencia [inicio, fin).

### 8.1 `GET /admin/announcements?status=draft|published|retired`

Sin `status`, devuelve todos.

```json
{ "data": [ { "id": "6f1c…", "title": "Mantenimiento programado", "body": "El sábado …", "status": "published",
  "audiences": ["client", "technician"], "priority": 0, "link_url": "https://example.test/aviso", "link_label": "Ver detalle",
  "starts_at": "2026-10-11T13:00:00.000000Z", "ends_at": "2026-10-13T13:00:00.000000Z", "retired_at": null, "version": 2 } ], "meta": { … } }
```

### 8.2 `POST /admin/announcements`

```json
{ "title": "Mantenimiento programado", "body": "El sábado no habrá atención de 08:00 a 10:00.", "audiences": ["technician"],
  "starts_at": "2026-10-11T13:00:00Z", "ends_at": "2026-10-13T13:00:00Z", "priority": 0,
  "link_url": "https://example.test/aviso", "link_label": "Ver detalle" }
```

| Campo | Regla |
|---|---|
| `title` | de 3 a 120 caracteres |
| `body` | de 1 a 5000 caracteres; se muestra como texto (la vista previa no interpreta HTML, SEC-S02-03) |
| `audiences` | 1 o 2 de `client`, `technician`, sin repetir |
| `starts_at`, `ends_at` | fechas ISO-8601; `ends_at` > `starts_at` |
| `priority` | entero de 0 a 100 (orden en el panel; opcional, 0 por defecto) |
| `link_url` | opcional; solo `http` o `https`, hasta 2048 caracteres |
| `link_label` | obligatorio si hay `link_url`; hasta 40 caracteres |

**201** en `draft`, como en §8.1. Se audita `announcement.created`.

### 8.3 `PATCH /admin/announcements/{id}`

Los mismos campos, opcionales, más `expected_version`. Solo para un **borrador** (D-51); en otro caso, **409** `ANNOUNCEMENT_NOT_EDITABLE`. **200**.

### 8.4 `POST /admin/announcements/{id}/publication`

`{ "expected_version": 2 }`. Un borrador cuyo `ends_at` ya pasó responde 422 en `ends_at` («La vigencia ya terminó.»). **200** con `status: "published"`. Se audita.

### 8.5 `DELETE /admin/announcements/{id}`

Retira el comunicado: **204**. Sale de todos los paneles y queda en `GET /admin/announcements?status=retired`. Se audita `announcement.retired`. Si ya estaba retirado: **404**. La SPA pide confirmación antes (S02-TC-066).

### 8.6 `POST /admin/announcements/{id}/duplicates` **[existe]**

**201:** `{ "id": "a2d4…", "title": "…", "status": "draft", "version": 1 }`. La copia no tiene fechas: hay que completarlas antes de publicar.

## 9. Verificación de técnicos (HU-S02-04, `technicians.verify`)

**Transiciones (D-13, D-32, D-50):**

| Desde (`status` / `verification_status`) | Acción | Hacia | Si no |
|---|---|---|---|
| `pending_verification` / `pending` | aprobar (con checklist completo) | `active` / `approved` | 422 si falta un requisito |
| `pending_verification` / `pending` | rechazar con motivo | `pending_verification` / `rejected` | — |
| `pending_verification` / `rejected` | el técnico pide revisión (§5.3) | `pending_verification` / `pending` | — |
| `active` | suspender con motivo | `suspended`; sus sesiones se cierran | — |
| `suspended` | reactivar con motivo | `active` | — |
| cualquier otra combinación | cualquiera de las anteriores | sin cambios | **409** |

### 9.1 `GET /admin/technicians?status=pending|rejected|active|suspended`

```json
{ "data": [ { "id": 12, "display_name": "Técnico de prueba", "status": "pending_verification", "verification_status": "pending",
  "experience_years": 4, "documents_count": 2, "created_at": "2026-10-09T14:00:00.000000Z", "version": 3 } ], "meta": { … } }
```

Nunca incluye correo, teléfono ni contraseña.

### 9.2 `GET /admin/technicians/{id}`

```json
{ "data": { "id": 12, "display_name": "Técnico de prueba", "bio": "…", "experience_years": 4,
  "status": "pending_verification", "verification_status": "pending", "version": 3,
  "checklist": { "teléfono": true, "servicios con tarifa": true, "zona de atención": false, "experiencia declarada": true, "evidencia documental": true },
  "services": [ { "subcategory_id": 4, "subcategory_name": "Mantenimiento de laptops", "reference_fee": "60.00" } ],
  "districts": [ { "id": 1, "name": "Huancayo" } ],
  "documents": [ { "id": 3, "document_type": "Certificado técnico", "review_status": "pending", "media_id": 40, "url": "…/api/v1/media/40" } ],
  "reviews": [ { "decision": "reject", "reason": "Falta el certificado vigente.", "reviewed_at": "…" } ] }, "meta": { … } }
```

La checklist indica si el dato existe, sin mostrar el teléfono. El documento se abre con `url`, que sigue las reglas de §3.4.

### 9.3 `POST /admin/technicians/{id}/reviews` **[existe; se amplía con `reject`]**

```json
{ "decision": "reject", "reason": "Falta el certificado vigente.", "expected_version": 3 }
```

- `decision`: `approve` o `reject`. `reason`: de 5 a 2000 caracteres (obligatorio en ambas).
- **201:** `{ "id": 9, "technician_id": 12, "decision": "reject", "reviewed_at": "…" }`. Se audita `technician.review`.

### 9.4 `POST /admin/technicians/{id}/suspension` y `POST /admin/technicians/{id}/reactivation`

```json
{ "reason": "Incumplimiento reiterado documentado.", "expected_version": 4 }
```

- **200:** `{ "id": 12, "status": "suspended", "version": 5 }`.
- La suspensión cierra las sesiones abiertas del técnico (D-32) y lo saca del perfil público. **No** borra trabajos, documentos ni tarifas (SEC-S02-04). Se audita `technician.suspended` y `technician.reactivated`.
- **Sin pantalla en S2** (D-50): la interfaz es del Sprint 7.

## 10. Datos E2E para Codex (S2.5)

En S2.3 se agrega `Database\Seeders\Sprint02E2ESeeder`, que el arrancador E2E llama con `--sprint 02`. Contiene:
- la semilla de autorización, el catálogo y los distritos;
- un administrador con los tres permisos;
- un técnico **pendiente con la checklist completa**, otro pendiente incompleto y uno **activo** con servicio, franja y un trabajo publicado;
- un comunicado publicado y un borrador;
- una subcategoría con foto revisada para el carrusel.

Todo con datos sintéticos; correos `@example.test`. Las credenciales se documentan en el seeder, como en S1.

## 11. Pedidos a Codex (S2.4 y S2.5)

1. **Landing de 10 secciones** (HU-S02-01): Header, Hero, Especialidades, Cómo funciona, Confianza, Testimonios, CTA técnicos, FAQ, CTA final y Footer. Testimonios y cifras rotulados como ejemplos (SEC-S02-05). Carrusel desde `GET /catalog/carousel`, con 2,5 s, movimiento reducido y pausa fuera de pantalla. Casos S02-TC-059, 060, 084, 085 y 089.
2. **Panel admin:** catálogo (especialidades, subcategorías con foto y distritos), comunicados (con vista previa, duplicar, publicar y eliminar con confirmación) y verificación (bandeja, ficha, aprobar y rechazar con motivo). Sin pantalla de suspensión.
3. **Panel del técnico:** perfil y bio, documentos, portafolio (subir, publicar, editar y retirar con confirmación), franjas, zonas, pausa y tarifas.
4. Alertas de éxito y error en cada operación; confirmación antes de eliminar o retirar; validación de cliente según §4 a §8; textos en español; botones con `type`.
5. Casos Cypress S02-TC-059 a 075 y Vitest S02-TC-076 a 089 según el catálogo.
