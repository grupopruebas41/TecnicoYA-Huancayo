# Contrato de API · Sprint 1

**Versión:** 1.0 · **Fecha:** 2026-10-09 · **Autor:** Claude Code (paso S1.1) · **Revisor:** [PENDIENTE]
**Base:** `backend/api` en la rama `feature/mayhuasca/f-administracion/s01`. Catálogo de casos: [CATALOGO-S01.csv](CATALOGO-S01.csv). Decisiones aplicadas: D-14 (un rol por cuenta), D-32 (sanciones), D-43 (registro con sesión abierta) y D-44 (auditoría de accesos de administradores).

## 1. Reglas comunes

- **Prefijo:** `/api/v1`, salvo `GET /sanctum/csrf-cookie`.
- **Sesión SPA (Sanctum):** cookie de sesión `HttpOnly` y `SameSite=Lax`. React **no guarda tokens** en `localStorage` ni en `sessionStorage`; la identidad se consulta siempre en `GET /me`.
- **CSRF:** antes de cada `POST`, `PATCH`, `PUT` o `DELETE`, se llama a `GET /sanctum/csrf-cookie` y se envía la cabecera `X-XSRF-TOKEN` con el valor decodificado de la cookie `XSRF-TOKEN` (legible por JavaScript). Sin ella: **419**.
- **Cabeceras:** `Accept: application/json`, `Content-Type: application/json` cuando hay cuerpo, y `credentials: 'include'`. La petición debe salir del origen de la SPA configurado en `SANCTUM_STATEFUL_DOMAINS`.
- **Respuesta correcta:** `{ "data": …, "meta": { "request_id": "uuid", "server_time": "ISO-8601" } }`. `204` no tiene cuerpo.
- **Respuesta de error** (todas las rutas `/api/v1`):

```json
{
  "message": "Revisa los campos indicados.",
  "errors": { "email": ["El valor de correo ya está registrado."] },
  "error": { "code": "VALIDATION_FAILED", "message": "Revisa los campos indicados.", "fields": { "email": ["El valor de correo ya está registrado."] } },
  "meta": { "request_id": "9b0c…", "server_time": "2026-10-09T15:00:00.000000Z" }
}
```

Para la pantalla, usar `error.message` como alerta general y `error.fields` (igual a `errors`) como mensajes por campo. `error.code` es estable para la lógica; nunca se muestra.

| Estado | `error.code` | `error.message` (texto real de `lang/es/api.php`) |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Tu sesión no está activa. Inicia sesión nuevamente. |
| 401 | `INVALID_CREDENTIALS` | El correo o la contraseña no son válidos. |
| 403 | `FORBIDDEN` | No tienes permiso para realizar esta acción. |
| 403 | `SESSION_ACTIVE` (D-43) | Ya tienes una sesión activa. Cierra sesión para crear otra cuenta. |
| 404 | `NOT_FOUND` | El recurso solicitado no está disponible. |
| 409 | `STALE_VERSION` | La información cambió. Actualiza y vuelve a intentarlo. |
| 419 | `SESSION_EXPIRED` | Tu sesión venció. Actualiza la página e inicia sesión nuevamente. |
| 422 | `VALIDATION_FAILED` | Revisa los campos indicados. (más `fields`) |
| 429 | `TOO_MANY_REQUESTS` | Hay demasiados intentos. Espera antes de volver a intentarlo. (cabecera `Retry-After` en segundos) |
| 500 | `INTERNAL_ERROR` | No pudimos completar la operación. Comunica el identificador de la solicitud a soporte. |

**Fallo de red** (sin respuesta): la SPA no afirma éxito ni fracaso. Muestra «No pudimos confirmar el resultado. Revisa tu conexión y consulta el estado antes de repetir la operación.» y vuelve a leer el estado (`GET /me`), como pide la adenda S01.

**Límite de intentos:** `auth/register` y `auth/login` comparten el limitador `spa-auth`, de `AUTH_ATTEMPTS_PER_MINUTE` por IP y minuto (10 por defecto). Al superarlo: 429 con `Retry-After`.

## 2. Tabla de decisión rol × ruta

Se usan cinco actores: anónimo, cliente, técnico, administrador y **cuenta suspendida** (`is_active = false`, con sesión abierta antes de la suspensión).

| Ruta | Anónimo | Cliente | Técnico | Administrador | Suspendida |
|---|---|---|---|---|---|
| `GET /sanctum/csrf-cookie` | 204 | 204 | 204 | 204 | 204 |
| `POST /auth/register` | 201 / 422 | 403 `SESSION_ACTIVE` | 403 `SESSION_ACTIVE` | 403 `SESSION_ACTIVE` | 403 `SESSION_ACTIVE` |
| `POST /auth/login` | 200 / 401 | 200 (otra cuenta; rota la sesión) | ídem | ídem; auditado (D-44) | 401 `INVALID_CREDENTIALS` (mismo mensaje que contraseña errónea) |
| `POST /auth/logout` | 401 | 204 | 204 | 204; auditado (D-44) | 204 |
| `GET /me` | 401 | 200 | 200 (con `technician_profile`) | 200 | 403 |
| `PATCH /me` | 401 | 200 / 409 / 422 | 200 / 409 / 422 | 200 / 409 / 422 | 403 |
| `GET /catalog/specialties` | 200 | 200 | 200 | 200 | 200 |
| `GET /catalog/subcategories` | 200 / 422 | ídem | ídem | ídem | ídem |
| Ruta admin (p. ej. `POST /admin/subcategories`, S2) | 401 | 403 | 403 (auditado) | 201 con `catalog.manage` | 403 |

Ocultar un botón no autoriza nada: el servidor decide en todas las celdas.

## 3. Endpoints

### 3.1 `GET /sanctum/csrf-cookie`

- **Rol:** público. **Respuesta:** `204` y las cookies `XSRF-TOKEN` (legible) y de sesión (`HttpOnly`).

### 3.2 `POST /api/v1/auth/register`

- **Rol:** solo **anónimo** (D-43). **Limitador:** `spa-auth`. No inicia sesión: tras el 201, la SPA muestra el éxito y vuelve al formulario de inicio de sesión.
- **Payload:**

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | obligatorio, de 2 a 100 caracteres |
| `email` | string | obligatorio, correo válido de hasta 254 caracteres, único; el servidor lo guarda en minúsculas y sin espacios |
| `password` | string | obligatorio, al menos 8 caracteres y **como máximo 72 bytes** (UTF-8) |
| `password_confirmation` | string | igual a `password` |
| `account_type` | string | `client` o `technician` (`admin` se rechaza) |
| `client_type` | string | `household` o `mype`; obligatorio si `account_type=client` y **prohibido** si es `technician` |
| `role`, `role_id`, `permissions`, `is_active`, `status`, `verification_status`, `verified*`, `available_now`, `version`, `user_id`, `id`… | — | prohibidos (422) |

- **201:**

```json
{ "data": { "id": "42", "name": "Ana Prueba", "phone": null, "role": { "code": "technician" }, "version": 1, "permissions": [],
  "technician_profile": { "status": "pending_verification", "verification_status": "pending", "available_now": false } },
  "meta": { "request_id": "…", "server_time": "…" } }
```

Un cliente recibe lo mismo sin `technician_profile`. La respuesta **no incluye el correo**.

- **Errores:** 422 (mensajes por campo: «El campo nombre debe tener al menos 2 caracteres.», «La contraseña no debe superar 72 bytes.», «La confirmación de contraseña no coincide.», «El valor de correo ya está registrado.», «El campo tipo de cliente no está permitido para este tipo de cuenta.»), 403 `SESSION_ACTIVE`, 419 y 429.

```json
{ "message": "Ya tienes una sesión activa. Cierra sesión para crear otra cuenta.", "errors": {},
  "error": { "code": "SESSION_ACTIVE", "message": "Ya tienes una sesión activa. Cierra sesión para crear otra cuenta.", "fields": {} }, "meta": { … } }
```

### 3.3 `POST /api/v1/auth/login`

- **Rol:** público. **Limitador:** `spa-auth`. Rota el identificador de sesión al autenticar.
- **Payload:** `{ "email": "ana.prueba@example.test", "password": "…" }`. El correo se normaliza igual que en el registro.
- **200:** la misma forma de `data` que `GET /me`.
- **401 `INVALID_CREDENTIALS`:** correo inexistente, contraseña errónea **o cuenta suspendida**. Las tres reciben la misma respuesta, sin revelar cuál es.
- **422** sin correo o sin contraseña · **419** sin CSRF · **429** con `Retry-After`.
- **Auditoría (D-44):** para una cuenta administradora quedan `auth.login` (éxito) o `auth.login_failed` (fallo) en `audit_entries`, sin contraseña.

### 3.4 `POST /api/v1/auth/logout`

- **Rol:** cualquier sesión, incluida la suspendida. **204**, invalida la sesión y regenera el token CSRF. Sin sesión: **401**. En un administrador queda `auth.logout` (D-44).

### 3.5 `GET /api/v1/me`

- **Rol:** sesión activa con cuenta habilitada. Suspendida: **403**; sin sesión: **401**.
- **200:**

```json
{ "data": { "id": "7", "name": "Administración de prueba", "phone": "+51 064 123456", "role": { "code": "admin" }, "version": 3,
  "permissions": ["announcements.manage", "catalog.manage", "technicians.verify"] }, "meta": { … } }
```

`permissions` va ordenado, con los permisos del rol más las concesiones individuales (solo para administradores). Para un cliente es `[]`. `technician_profile` aparece solo para técnicos. Nunca incluye el correo, la contraseña, `remember_token` ni datos de sesión.

### 3.6 `PATCH /api/v1/me`

- **Rol:** sesión activa con cuenta habilitada (cualquiera de los tres roles). La identidad sale de la sesión; nunca se acepta `user_id`.
- **Payload:**

| Campo | Regla |
|---|---|
| `expected_version` | **obligatorio**, entero ≥ 1, igual a `data.version` de la última lectura |
| `name` | opcional; si se envía, de 2 a 100 caracteres |
| `phone` | opcional, `null` borra; hasta 20 caracteres con `^\+?[0-9 ()-]+$` |
| `email`, `password`, `password_confirmation`, `account_type`, `client_type` y los campos privilegiados | prohibidos: 422 «No está permitido modificar el campo …» |

```json
{ "name": "Ana Prueba", "phone": "+51 (064) 123-45678", "expected_version": 3 }
```

- **200:** `data` como en `GET /me`, con `version` + 1.
- **409 `STALE_VERSION`:** otra pestaña guardó antes. La SPA ofrece «Recargar perfil y descartar mis cambios» y vuelve a pedir `GET /me`.
- **422** con `fields` · **403** suspendida · **401** sin sesión · **419** sin CSRF.

### 3.7 `GET /api/v1/catalog/specialties`

- **Rol:** público (igual para los cinco actores). **200:** solo especialidades activas, ordenadas.

```json
{ "data": [ { "id": 1, "code": "computo", "name": "Cómputo", "description": "…" } ], "meta": { … } }
```

### 3.8 `GET /api/v1/catalog/subcategories?specialty_id={id}`

- **Rol:** público. `specialty_id` es obligatorio, entero y existente; si no: **422** en «especialidad». Solo devuelve subcategorías activas de una especialidad activa; si la especialidad está inactiva, `[]`.

```json
{ "data": [ { "id": 3, "specialty_id": 1, "code": "computo-hardware", "name": "Hardware", "description": "…", "image_url": null } ], "meta": { … } }
```

La SPA trata `[]` como estado vacío y un fallo como error con «Reintentar». Nunca sustituye la respuesta por datos de la demo.

## 4. Pedidos a Codex (N.4 y N.5)

1. **DEF-36:** agregar `type="button"` a los 4 botones (3 en `AccountApp.jsx` y 1 en `Catalog.jsx`). Prueba: S01-TC-084.
2. **D-43:** la SPA no ofrece «Crear una cuenta» con una sesión abierta. Si recibe `SESSION_ACTIVE`, muestra `error.message`.
3. Mostrar el 429 con `error.message` y volver a habilitar el botón (S01-TC-083).
4. Casos a implementar: Cypress S01-TC-072 a 077 y Vitest S01-TC-078 a 085. Los Cypress usan los usuarios `e2e-{rol}@example.test` del arrancador y deben ejecutarse en el slot B.
