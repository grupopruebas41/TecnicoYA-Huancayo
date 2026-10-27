# Contrato de API · adelanto del Sprint 7

| Campo | Valor |
|---|---|
| Versión | 1.1 (2026-10-26: rubros declarados por especialidad, ver §6) · 1.0 (2026-10-26) |
| Autor | Claude Code |
| Revisor | [PENDIENTE] |
| Base | `main` `01b93ee` (rama `feature/mayhuasca/auth/registro-detallado`) |
| Decisiones | D-73 (adelanto del S7 con IDs S07-TC), D-75 (nombres y apellidos) y D-80 (campos del registro y recuperación de contraseña) |
| Catálogo de casos | [CATALOGO-S07.csv](CATALOGO-S07.csv): S07-TC-001 a 016 y 031 a 035 en Pest; S07-TC-017 a 030 y 036 a 045 en Vitest |

Todas las rutas van bajo `/api/v1`, usan la sesión SPA de Sanctum y siguen las mismas convenciones que el contrato v1 (S1 a S4):
- el sobre `data` en las respuestas correctas;
- `error`, `errors` y `message` en español en los errores.

## 1. `POST /auth/register` **[cambia]**

Este endpoint es la ampliación del registro del S1 (D-80). Su respuesta 201 no cambia y sigue sin aceptarse una sesión activa (D-43). Las cuentas `admin` siguen prohibidas por esta vía (TC-008).

| Campo | Cliente | Técnico | Regla |
|---|---|---|---|
| `given_names`, `family_names` | obligatorio | obligatorio | De 2 a 50 caracteres cada uno. Componen `name` (D-75). |
| `name` | alternativa | alternativa | Se sigue aceptando si no se envían nombres y apellidos (lo usan las pruebas del S1). No se puede enviar junto con ellos. |
| `email` | obligatorio | obligatorio | Igual que en el S1. Se normaliza a minúsculas y es único sin distinguir mayúsculas. |
| `phone` | obligatorio | obligatorio | `^9\d{8}$`: celular peruano de 9 dígitos que empieza en 9. |
| `password`, `password_confirmation` | obligatorio | obligatorio | Igual que en el S1: al menos 8 caracteres, como máximo 72 bytes, y confirmación. |
| `account_type` | `client` | `technician` | — |
| `terms_accepted` | obligatorio | obligatorio | `accepted`. Se guarda `users.terms_accepted_at`. |
| `client_type` | obligatorio | prohibido | `household` o `mype`. |
| `district_id` | obligatorio | prohibido | Distrito **activo**. Se guarda en `client_profiles.district_id`. |
| `business_name` | opcional, solo MYPE | prohibido | Hasta 180 caracteres. |
| `reference_address` | opcional | prohibido | Hasta 255 caracteres. Es **privada**: se guarda en `client_profiles.default_address` y no se devuelve. |
| `base_district_id` | prohibido | obligatorio | Distrito activo (D-64). |
| `district_ids` | prohibido | obligatorio | Lista de distritos activos y distintos. El distrito base **siempre** se agrega (`technician_districts`). |
| `specialty_ids` | prohibido | obligatorio | De 1 a 10 especialidades activas y distintas (`technician_specialties`). **No** crea servicios ni tarifas; eso sigue en el panel del técnico. |
| `subcategory_ids` | prohibido | obligatorio | Rubros activos y distintos, de 1 a 60; cada uno de una especialidad declarada y activa (si no, 422 en `subcategory_ids.N`: «El rubro no pertenece a una especialidad que elegiste.») y al menos uno por especialidad declarada (si no, 422 en `subcategory_ids`: «Elige al menos un rubro de <especialidad>.»). Se guardan en `technician_declared_subcategories`. |
| `experience_years` | prohibido | obligatorio | Entero de 0 a 50. |
| `whatsapp` | prohibido | opcional | Mismo formato que `phone`. |

**Ejemplo de técnico:**

```json
{ "account_type": "technician", "given_names": "Ana Lucía", "family_names": "Quispe Rojas", "email": "ana@example.test",
  "phone": "987654321", "password": "…", "password_confirmation": "…", "terms_accepted": true,
  "base_district_id": 2, "district_ids": [2, 1], "specialty_ids": [10], "subcategory_ids": [101, 103], "experience_years": 4 }
```

Los errores devuelven 422 con el campo afectado, por ejemplo `district_id`, `district_ids.0`, `specialty_ids.0`, `phone`, `terms_accepted` o `business_name`. El mensaje del teléfono es «El teléfono debe tener 9 dígitos y empezar en 9.».

## 2. `GET /me` **[cambia]**

La respuesta agrega `given_names` y `family_names` (pueden ser `null` en cuentas anteriores).

Para el cliente agrega `client_profile: {client_type, district_id}`. El distrito principal precarga la nueva solicitud del asistente S3. La dirección de referencia **no** se expone.

## 3. `POST /auth/password/forgot` **[nuevo]**

| | |
|---|---|
| Cuerpo | `{ "email": "…" }` |
| Respuesta | **202** `{ "data": { "message": "Si el correo existe, te enviamos un enlace para restablecer tu contraseña." } }`, **siempre la misma**, exista o no la cuenta |
| Envío | Solo para cuentas activas y no anonimizadas, con el broker de Laravel: un pedido por minuto por cuenta y el resto también responde 202. El token es aleatorio, de un solo uso y se guarda con hash en `password_reset_tokens`. Vence a los **60 min**. |
| Enlace | `{SPA_URL}/#cuenta/restablecer?token=…&email=…`. Correo en español. En desarrollo, `MAIL_MAILER=log` deja el enlace en `storage/logs`. |
| Límites | `throttle:password-forgot`: **10 por IP por minuto** (`PASSWORD_RESET_PER_IP_PER_MINUTE`) y **3 por correo cada 15 min** (`PASSWORD_RESET_PER_EMAIL`). Al superarlos responde 429 «Hay demasiados intentos. Espera antes de volver a intentarlo.» |
| Auditoría | `auth.password_reset_requested` solo para administradores (D-44), sin token. |

## 4. `POST /auth/password/reset` **[nuevo]**

| | |
|---|---|
| Cuerpo | `{ "email", "token", "password", "password_confirmation" }`, con las reglas de contraseña del registro |
| Respuesta | **200** `{ "data": { "message": "Tu contraseña se actualizó. Inicia sesión con la nueva contraseña." } }` |
| Efectos | Cambia la contraseña, renueva `remember_token`, incrementa `auth_version` y **borra todas las sesiones** de la cuenta, como la suspensión de D-32. El token se consume. |
| Errores | 422 en `token` con «El enlace no es válido o venció. Pide uno nuevo.» si el token está vencido, usado, es ajeno o es inventado. 422 en `password` si no cumple las reglas, y en ese caso el token **no** se consume. |
| Límites | `throttle:spa-auth` (igual que el inicio de sesión). |
| Auditoría | `auth.password_reset` solo para administradores (D-44), sin token ni contraseña. |

## 5. Datos

Migración `2026_10_26_000024_add_registration_details`:
- `users`: `given_names`, `family_names` y `terms_accepted_at`;
- `client_profiles`: `district_id`, FK a `districts`;
- tabla `technician_specialties` (`technician_id`, `specialty_id`, `created_at`);
- tabla `password_reset_tokens`, si no existe.

`Sprint01E2ESeeder` llama ahora también a `DistrictSeeder`, porque el registro de las Cypress del S1 necesita distritos activos.

## 6. Cambios de la versión 1.1 (2026-10-26): rubros declarados

- **`POST /auth/register`** (técnico): campo obligatorio `subcategory_ids` (ver §1). Los rubros declarados **no** son servicios: no se crean `technician_services` ni versiones de tarifa, y el matching sigue excluyendo al técnico (`not_active` al registrarse; `service_not_offered` aunque ya esté verificado) hasta que cargue su tarifa. Casos S07-TC-031 a 035.
- **`GET /me`** (técnico): `technician_profile.declared_subcategories`: `[{id, name, specialty_id}]`.
- **`GET /technicians/me/profile`**: `declared_subcategories`: `[{subcategory_id, subcategory_name, specialty_id, specialty_name, has_rate}]`. `has_rate` es verdadero si ya hay un servicio activo de ese rubro. «Servicios y tarifas» muestra los que no tienen tarifa con «Agrega tu tarifa para empezar a recibir solicitudes de este rubro.».
- **Datos:** migración aditiva `2026_10_26_000025_create_technician_declared_subcategories` (`technician_id`, `subcategory_id`, `created_at`).

## 7. Cambios de la versión 1.2 (2026-10-26): Fase 1 del panel del administrador

Plan: `docs/documentacion/sprints/PLAN-PANEL-ADMIN.md`, con las decisiones D-73 a D-79. Casos: Pest S07-TC-046 a 056; Vitest S07-TC-057 a 071.

### 7.1 `GET /admin/dashboard` **[nuevo]**

| | |
|---|---|
| Permiso | `dashboard.view` (PERM-01). 401 sin sesión, 403 sin el permiso. |
| Respuesta | **200** `{ "data": { requests_by_status, requests_total, technicians_pending_verification, new_users, ratings, generated_at } }` |
| `requests_by_status` | Los 10 estados de `service_requests` en el orden del ciclo de vida (`registered`, `sent`, `pending_availability`, `assigned`, `in_progress`, `completed`, `closed`, `unrated`, `cancelled`, `expired`), con 0 si no hay. `requests_total` es la suma. |
| `technicians_pending_verification` | Perfiles con `verification_status = pending`. |
| `new_users` | `last_7_days` y `last_30_days`: `{client, technician, admin, total}` por `created_at`. Excluye cuentas anonimizadas. |
| `ratings` | `{available: false, average: null, count: 0, available_from: "Sprint 6"}`. No se inventan cifras: las calificaciones llegan en el S6. |
| Datos personales | Ninguno, solo conteos. |

### 7.2 `POST /me/password` **[nuevo]**

| | |
|---|---|
| Cuerpo | `{ "current_password", "password", "password_confirmation" }` |
| Reglas | `current_password` obligatorio y correcto: si no, 422 «La contraseña actual no es correcta.». `password` con las reglas del registro (8 caracteres como mínimo y 72 bytes como máximo), confirmada y distinta de la actual: si no, 422 «La nueva contraseña debe ser distinta de la actual.». |
| Respuesta | **200** `{ "data": { "message": "Tu contraseña se actualizó. Cerramos tus otras sesiones." } }` |
| Efectos | Cambia la contraseña e incrementa `auth_version`. Borra las **demás** sesiones de la cuenta y **conserva la actual**: el hash que guarda `AuthenticateSession` se refresca. |
| Límites | `throttle:spa-auth`. |
| Auditoría | `auth.password_changed` solo para administradores (D-44), sin contraseñas. |

### 7.3 `PATCH /me` **[cambia]**

- **`given_names` y `family_names`** (D-75): van juntos (`required_with`), de 2 a 50 caracteres cada uno, y componen `name`. `name` sigue aceptándose en las cuentas anteriores, pero no junto con ellos (`prohibits`).
- **`theme_preference`** (D-76): `light`, `dark`, `system` o `null`.
- **`avatar_media_id`** (D-77): `id` de un medio **propio**, con finalidad `avatar`, `scan_status = clean` y no retirado. Si no, 422 «La foto debe ser una imagen tuya, subida como foto de perfil y revisada.». `null` quita la foto.
- Se mantiene `expected_version`, que responde 409 si la versión está desactualizada.

### 7.4 `GET /me` **[cambia]**

Agrega `theme_preference` y `avatar_url`. `avatar_url` es `/api/v1/media/{id}` solo si el medio está limpio y no retirado; si no, es `null` y la SPA muestra las iniciales.

### 7.5 `POST /media` **[cambia]**

Nueva finalidad `avatar`. Pasa por `ImageSanitizer` como el portafolio: JPG, PNG o WebP de hasta 5 MB, y se le quita el EXIF.

### 7.6 Endpoints existentes que la SPA usa ahora

- `GET /notifications`, para la campana de la barra superior.
- `POST /admin/technicians/{id}/suspension` y `/reactivation`, con `{reason, expected_version}`. Ahora tienen pantalla en Verificación.

### 7.7 Datos y permisos

- Migración aditiva `2026_10_26_000026_add_panel_preferences_to_users`:
  - `users.theme_preference` (string 10, nullable, `CHECK chk_users_theme` en MySQL);
  - `users.avatar_media_id`, FK a `media_files` con `nullOnDelete`;
  - el `CHECK chk_media_purpose` se rehace para incluir `avatar`.
- `AuthorizationSeeder` (idempotente) agrega `dashboard.view` «Ver el inicio del panel de administración» y `users.manage` «Administrar usuarios», ambos para el administrador. `users.manage` todavía no protege ningún endpoint: lo usará la Fase 2 (Usuarios).

### 7.8 Ajustes de la revisión del PR #32 (D-82)

- **Errores:** sin cambio en la respuesta. El `meta.request_id` que la SPA muestra como «Referencia» se escribe también en el contexto del log (`request_id`) de cada excepción reportada, para rastrear un error a partir de la captura del usuario (S07-TC-072).
- **Catálogo:** la lista compacta usa los mismos endpoints de §7 del S2. La tarifa sale de `reference_fee` y la miniatura de `image_url`: `hero_media_id` en las especialidades y `carousel_media_id` en las subcategorías. El cambio de estado sigue siendo `PATCH` con `active` y `expected_version`.

## 8. Cambios de la versión 1.3 (2026-10-26): comunicados en carrusel (bloque B, D-83)

### 8.1 `POST /media` **[cambia]**
- Finalidad nueva `announcement`, con el permiso `announcements.manage` (si falta, responde 403).
- Admite solo `image/jpeg` o `image/webp`, de hasta 600 KB (`errors.file`: «…como máximo 600 KB.»). Pasa por `ImageSanitizer` y se guarda sin EXIF.

### 8.2 `POST /admin/announcements` y `PATCH /admin/announcements/{id}` **[cambia]**
- **Campos nuevos:**
  - `source`: `image`, `genially` o `text`;
  - `kind`: `promotion`, `raffle`, `news` o `notice`;
  - `image_media_id`, `mobile_media_id`, `genially_url` y `alt_text`.
- **`source=image`:** exige `kind`, `alt_text` (5 a 250 caracteres) e `image_media_id`. La imagen debe ser media `announcement` revisada, en proporción 3:1 (±1 %) y de al menos 1440 × 480. `mobile_media_id` es opcional: 3:2 de al menos 810 × 540.
- **`source=genially`:** exige `kind`, `alt_text` y `genially_url`, que se normaliza a `https://view.genially.com/<código>`. `image_media_id` es opcional (portada) y `mobile_media_id` se rechaza.
- **Sin `source`:** el alta es el comunicado de texto del S2 y `body` es obligatorio. Con imagen o Genially, `body` es opcional y se guarda `""`.
- **En `PATCH`:** las exigencias del origen se aplican cuando se envía `source`; sin él, contra el origen guardado (D-84, §8.9).

### 8.3 `POST /admin/announcements/{id}/publication` **[cambia]**
- Vuelve a comprobar la imagen y el enlace (por ejemplo, una imagen retirada después de guardar). Si algo falla, responde 422 con el campo afectado.

### 8.4 `DELETE /admin/announcements/{id}/publication` **[nuevo]**
- Cuerpo: `{ "expected_version": n }`.
- Pasa de publicado a borrador, con 200 y la representación del comunicado. Audita `announcement.unpublished`.
- Si no está publicado, responde 409 `ANNOUNCEMENT_NOT_PUBLISHED`; con versión vieja, 409.

### 8.5 `PUT /admin/announcements/order` **[nuevo]**
- Cuerpo: `{ "audience": "client" | "technician", "ids": [uuid…] }`. `ids` debe contener una vez cada comunicado no retirado de esa audiencia, borradores incluidos.
- Respuesta 200: `{ "data": { "audience", "ids" } }`. Audita `announcement.reordered` con el orden anterior y el nuevo.
- Con un conjunto incompleto o ajeno responde 422 `ids`; sin permiso, 403.

### 8.6 `GET /admin/announcements` **[cambia]**
- Cada fila agrega:
  - `phase`: `draft`, `scheduled`, `active`, `expired` o `retired`;
  - `positions`: por ejemplo `{ "client": 2, "technician": 1 }`;
  - `source`, `kind`, `image_media_id`, `image_url`, `mobile_media_id`, `mobile_image_url`, `genially_url` y `alt_text`.

### 8.7 `GET /announcements` **[cambia]**
- Ordena por la posición en la audiencia del lector; la posición 0 va al final, por prioridad e inicio como en el S2.
- Cada elemento agrega `source`, `kind`, `image_url`, `mobile_image_url`, `genially_url`, `alt_text` y `position`. Los ids de media no se exponen.

### 8.8 Datos
- **Migración `2026_10_26_000027_add_carousel_to_announcements`:**
  - `announcements.source` (por defecto `text`, `CHECK`), `kind` (`CHECK`), `image_media_id` y `mobile_media_id` (FK a `media_files` con `nullOnDelete`), `genially_url` y `alt_text`;
  - `announcement_audiences.position`, con índice `(role_id, position)`;
  - el `CHECK chk_media_purpose` suma `announcement`.
- En una base existente basta `php artisan migrate`. No hay permisos nuevos.

### 8.9 Edición en cualquier estado, restauración y eliminación (versión 1.4, 2026-10-27, D-84)

**`PATCH /admin/announcements/{id}`** **[cambia]**
- Acepta borradores y publicados (programados, vigentes o vencidos), con `expected_version`. Si otro administrador lo cambió antes, responde 409 `STALE_VERSION`.
- Sin `source`, las exigencias se validan contra el origen guardado. Así se reemplaza la imagen principal o la móvil, o el enlace de Genially, sin reenviar todo.
- **En un publicado:**
  - el cambio se ve de inmediato en `GET /announcements`;
  - se vuelve a comprobar el contenido;
  - se audita `announcement.published_edited` con los valores de antes y después de los campos que cambiaron (y de `audiences`, si cambia).
- **En un borrador:** sigue auditando `announcement.updated`, como en el S2.
- **En un retirado:** responde 409 `ANNOUNCEMENT_RETIRED`; primero hay que restaurarlo.

**`POST /admin/announcements/{id}/restoration`** **[nuevo]**
- Cuerpo: `{ "expected_version": n }`.
- El retirado pasa a borrador (`retired_at` vuelve a nulo) y entra al final del carrusel de cada audiencia. Responde 200 con la representación del comunicado y audita `announcement.restored`.
- Si no está retirado, responde 409 `ANNOUNCEMENT_NOT_RETIRED`; con versión vieja, 409.

**`DELETE /admin/announcements/{id}/permanent`** **[nuevo]**
- Cuerpo: `{ "expected_version": n, "confirmation": "ELIMINAR" }`. Cualquier otra confirmación responde 422 `confirmation`.
- Solo admite borradores, vencidos y retirados. Un vigente o programado responde 409 `ANNOUNCEMENT_DELETE_PUBLISHED` («despublícalo primero»); si no existe, 404.
- **Efectos:**
  - borra el comunicado y sus filas de `announcement_audiences`;
  - las imágenes (principal o móvil) que ningún otro comunicado usa quedan con `retired_at`;
  - las posiciones del carrusel que quedan se renumeran sin huecos.
- **Respuesta:** 200 con `{ "data": { "id", "deleted": true } }`.
- **Auditoría:** `announcement.deleted`.
  - Antes: foto previa con título, estado, origen, tipo, audiencias, fechas, imágenes, Genially y versión.
  - Después: `{ id, deleted, retired_media }`.
- `DELETE /admin/announcements/{id}` sigue siendo **retirar** (S02-TC-028, sin cambios).
- Sin `announcements.manage`, las tres operaciones responden 403.

## 9. Cambios de la versión 1.5 (2026-10-27): bloque C · usuarios, estadísticas, solicitudes e Inicio (D-85)

### 9.1 Usuarios (`users.manage`)

**Reglas comunes:**
- Toda acción que cambia algo exige `reason` (5 a 500 caracteres); salvo el alta y el reenvío de activación, también `expected_version`.
- **Errores:**
  - 409 `STALE_VERSION` si la versión no coincide;
  - 409 `USER_SELF_ACTION` sobre la propia cuenta (salvo editar);
  - 409 `USER_ANONYMIZED` sobre una cuenta eliminada;
  - 409 `USER_LAST_ADMIN` si dejaría el sistema sin administradores activos.
- **Auditoría** en `audit_entries`, con `subject_type=user`, el motivo, los estados y los campos editados; nunca contraseñas ni tokens.
- **Estado del usuario** (`status`), en orden de prioridad: `anonymized`, `blocked` (`is_active=false`), `pending_activation` (con `invited_at` y sin `activated_at`) y `active`.

**`GET /admin/users`**
- Filtros:
  - `q`: nombre o correo, sin distinguir mayúsculas;
  - `role`: `client`, `technician` o `admin`;
  - `status`;
  - `district_id`: distrito del cliente o distrito base del técnico;
  - `created_from` y `created_to`: `Y-m-d`;
  - `page` y `per_page` (hasta 100).
- Sin `status`, oculta los anonimizados.
- Responde `{items, page, per_page, total}`. Cada ítem trae `id`, `name`, `given_names`, `family_names`, `email`, `phone`, `role`, `status`, `district` (`{id, name}` o null), `created_at` y `version`.

**`GET /admin/users/{id}`**
- Responde `{user, client, technician, requests, audit}`:
  - `requests`: las últimas 20 solicitudes de la cuenta como cliente, o las que atendió como técnico;
  - `audit`: las últimas 20 entradas de la cuenta, con acción, motivo, actor y fecha.

**`POST /admin/users`** (alta)
- Datos: `account_type` (`client`, `technician` o `admin`), `given_names`, `family_names`, `email`, `phone` y `reason`.
- Según el tipo:
  - cliente: los campos de D-80 (`client_type`, `district_id`, `business_name` y `reference_address`);
  - técnico: `base_district_id`, `district_ids`, `specialty_ids`, `subcategory_ids` y `experience_years`.
- `password` y `terms_accepted` están prohibidos.
- Crea la cuenta con una contraseña aleatoria que nadie conoce y `invited_at`, y envía `AccountActivation` con el enlace `#cuenta/activar?token=…&email=…` (broker `activations`, 72 horas, un solo uso).
- Responde 201 con el usuario.

**`PATCH /admin/users/{id}`**
- Campos: `given_names`, `family_names`, `email` (único), `phone`, `district_id` (el del cliente o el distrito base del técnico), `client_type`, `business_name` y `reference_address`.
- Exige `reason` y `expected_version`. `role` y `password` están prohibidos.
- Audita `user.updated` con antes y después de los campos que cambiaron.

**Acciones sobre la cuenta:**

| Ruta | Efecto | Auditoría |
|---|---|---|
| `POST /admin/users/{id}/block` | `is_active=false`, cierra las sesiones y sube `auth_version` (D-32). Si ya está bloqueada, 409 `USER_ALREADY_BLOCKED` | `user.blocked` |
| `POST /admin/users/{id}/unblock` | Vuelve a activa. Si no está bloqueada, 409 `USER_NOT_BLOCKED` | `user.unblocked` |
| `POST /admin/users/{id}/access-reset` | Invalida la contraseña, cierra las sesiones y envía el enlace de restablecimiento (el de activación si la cuenta está pendiente) | `user.access_reset` |
| `DELETE /admin/users/{id}/sessions` | Cierra todas las sesiones sin bloquear. Responde con `closed_sessions` | `user.sessions_closed` |
| `POST /admin/users/{id}/activation-link` | Solo con `reason`. Reenvía la activación y anula el enlace anterior. Si la cuenta ya está activa, 409 `USER_ALREADY_ACTIVE` | `user.activation_sent` |
| `DELETE /admin/users/{id}` | Eliminar = anonimizar, con `confirmation: "ELIMINAR"`. Nombre «Usuario eliminado»; correo `anonimo-<id>@anonimo.invalid`; sin teléfono, nombres, foto, razón social ni dirección; inactiva y con sesiones y tokens borrados. Las solicitudes se conservan | `user.anonymized` |

**`POST /auth/password/reset`** **[cambia]**
- Si la cuenta está pendiente de activación, usa el broker `activations` (72 horas).
- Al terminar, marca `activated_at` y `email_verified_at`.

### 9.2 `GET /admin/statistics?days=7|30|90` (`dashboard.view`)

- Por defecto, 30 días, contados hasta hoy en UTC. La respuesta trae:
  - `range`: `{days, from, to}`;
  - `requests_per_day`: un elemento por día, con ceros explícitos;
  - `requests_by_specialty` y `requests_by_district`: `{id, name, total}`, de mayor a menor;
  - `funnel`: `{sent, with_offers, assigned, completed}`;
  - `offers`: `{total, accepted, rejected, expired, acceptance_rate, avg_response_seconds}`. Los dos últimos son null si no hay respuestas;
  - `technicians_by_status`, `new_users_by_role` (sin anonimizados) y `active_announcements_by_audience`;
  - `generated_at`.
- Son 8 agregados SQL, con un número fijo de consultas, sin datos personales.

### 9.3 Solicitudes en solo lectura (`dashboard.view`)

**`GET /admin/requests`**
- Filtros: `status`, `district_id`, `specialty_id`, `created_from`, `created_to`, `q` (número de solicitud) y la paginación.
- Cada ítem trae `id`, `status`, `specialty`, `subcategory`, `district`, `client` (nombre), `technician` (`{id, name}` o null), `created_at` y `submitted_at`. Sin dirección.

**`GET /admin/requests/{id}`**
- Responde `{request, client, technician, offers, timeline}`:
  - `request` agrega `description`, `mode`, la ventana preferida, `reference_fee` y `cancellation_reason`;
  - `offers` cuenta por estado;
  - `timeline` trae los `request_events` en orden.
- No hay rutas de escritura: `POST`, `PATCH` y `DELETE` responden 405.

### 9.4 `GET /admin/dashboard` **[cambia]**

- Agrega `announcements_active` (contador del menú «Comunicados»).
- Agrega `recent_events`: las últimas 5 acciones hechas por una persona, sin sesiones ni siembra, con `action`, `reason`, `subject_type`, `actor` y `occurred_at`.

### 9.5 Datos

- **Migración `2026_10_27_000028_add_activation_to_users`:** `users.invited_at` y `users.activated_at`. Las cuentas existentes quedan activas. En una base existente basta `php artisan migrate`.
- **Configuración:** broker `activations` en `config/auth.php`, con la misma tabla `password_reset_tokens` y 4320 minutos. No hay permisos nuevos.
