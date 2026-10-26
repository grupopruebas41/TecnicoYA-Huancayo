# Plan · Panel del administrador y base común de paneles

- **Fecha:** 2026-10-26.
- **Autor:** Claude Code. Asume backend y frontend según D-72, pendiente de integrar en el PR #26.
- **Estado:** Fase 0. Es un borrador para que el equipo lo confirme; no hay código todavía.
- **Base revisada:** `main` en `441644b`. Los PR #26 (D-72) y #27 (pulido de la landing, que define los tokens `--ty-md/lg/xl`) siguen **abiertos**.

## 1. Inventario: qué existe y qué falta

| Módulo | API existente (`/api/v1`) | UI existente (`frontend/web/src/features/administration`) | Pruebas existentes | Qué falta |
|---|---|---|---|---|
| **Sesión y perfil propio** | `GET /me` y `PATCH /me` (`name`, `phone`, `expected_version`; prohíbe `email` y `password`); `POST /auth/login`, `POST /auth/logout`; auditoría de accesos de administradores (D-44) | `AccountApp` (encabezado «Hola, …» con cerrar sesión), `ProfileForm` y `SessionForm` | Pest S01 (`AuthorizationMatrixTest` y otros); Vitest `ProfileForm`, `SessionForm` y `AccountApp` | Cambio de contraseña pidiendo la actual; avatar; preferencia de tema; layout de panel |
| **Panel por rol** | Rol y permisos en `/me` (`role.code` y `permissions[]`) | `Sprint02Portal`: pestañas `s02-nav` para el administrador (Catálogo, Comunicados, Verificación); el cliente ve `ClientPortal`, el técnico `OffersInbox` y `TechnicianPanel`; `RoleAnnouncements` y `Notifications` para todos | Vitest `sprint02Panels`, `sprint02` y `accessibility`; Cypress S01–S04 usa `data-cy="portal-*"` y `logout` | Barra lateral contraíble, barra superior con campana y avatar, cajón en móvil y tema claro/oscuro. Hay que conservar los `data-cy` |
| **Notificaciones** | `GET /notifications?after_id=` (bandeja del usuario; middleware `technician.not_suspended`); Reverb y Echo (D-70) | `realtime/Notifications.jsx` y `Realtime.jsx` | Pest S04 `CNotifications`; Vitest `Realtime.test` | Campana en la barra superior con contador de nuevas. Basta con lo que ya existe; no hay endpoint de «leídas» |
| **Inicio / KPIs** | Ninguno | Ninguna | — | Endpoint de indicadores para el administrador y pantalla con estados vacíos honestos. **No existe una tabla de calificaciones** (es del Sprint 6), así que ese KPI no se puede calcular hoy |
| **Catálogo** | `admin/specialties` (GET/POST/PATCH), `admin/subcategories` (POST/PATCH), `admin/districts` (GET/POST/PATCH), con `catalog.manage`; imagen por `image_id` (media `catalog`) y `reference_fee` (D-52) | `CatalogAdmin` (alta/edición, estado, imagen, tarifa; DEF-47 corregido) y `Catalog` público | Pest S02 (`SpecialtyCatalogTest`, `DistrictsTest`, TC015, TC016); Vitest `CatalogEdit` y `Catalog` | Solo integrarlo en el panel. No hacen falta endpoints nuevos |
| **Verificación de técnicos** | `admin/technicians` (lista y detalle), `reviews` (aprobar o rechazar con motivo), `suspension` y `reactivation` con motivo (D-32, D-50), con `technicians.verify`; documentos privados | `VerificationAdmin`: cola por estado, detalle con documentos, aprobar/rechazar con motivo. **No tiene pantalla de suspensión ni reactivación** (el comentario de la ruta dice «sin pantalla hasta el Sprint 7») | Pest S02 (`TechnicianVerificationTest`, TC019); Vitest `sprint02Panels` | Integrarlo en el panel y añadir la UI de suspender y reactivar con motivo (la API ya existe) |
| **Comunicados** | `admin/announcements` (CRUD, publicación, retiro y duplicado), con `announcements.manage`: `title`, `body`, `audiences[]` (rol), `starts_at`/`ends_at`, `priority`, `link_url`/`link_label` y `status`; `GET /announcements` filtra por rol; la columna `image` es `longText` heredada | `AnnouncementsAdmin` y `RoleAnnouncements` (lista) | Pest S02 (`AnnouncementAdminTest`, TC018); Vitest S02 | **Fase 3:** `type` (promoción, sorteo, actualización, aviso), imagen como media revisada (`image_media_id` y finalidad `announcement`), vista previa y carrusel en el Inicio del cliente y del técnico |
| **Usuarios** | Ninguno de administración. `users` tiene `name` (un solo campo), `email`, `phone`, `is_active`, `auth_version`, `email_verified_at` y `anonymized_at`; `client_profiles` tiene `default_address` (sin distrito); `technician_profiles` tiene `base_district_id` (D-64) y servicios con tarifa. Existe `password_reset_tokens` y `MAIL_MAILER=log` en `.env.example` | Ninguna | — | **Fase 2:** listado, filtros, alta sin contraseña con enlace de activación, edición, bloqueo y desbloqueo con motivo (D-32), protección del último administrador y auditoría; campos nombres/apellidos y distrito |
| **Correo** | `email_verified_at` existe pero no se usa; `PATCH /me` prohíbe `email` | Ninguna | — | **Fase 4:** cambio de correo con enlace firmado y aviso al correo anterior; verificación al registrarse |
| **Auditoría** | Tabla `audit_entries` (actor, acción, permiso, sujeto, motivo, antes/después y correlación) usada por catálogo, verificación y accesos | Ninguna | Pest S01/S02 comprueban entradas | La pantalla de auditoría es del Sprint 7 (fuera de alcance). Cada acción nueva se audita |

## 2. Alcance por fases

Las cifras de pruebas son **estimaciones**. Cada prueba lleva un ID `SNN-TC-NNN` según la decisión ORG-02 (§4).

### Fase 1 · Base común de paneles + Inicio del administrador + Mi perfil

**Endpoints nuevos (4):**

| Método y ruta | Permiso | Descripción |
|---|---|---|
| `GET /admin/dashboard` | `dashboard.view` (nuevo, PERM-01) | Devuelve `requests_by_status` (conteo por `service_requests.status`, con ceros explícitos para los estados del diccionario), `technicians_pending_verification`, `new_users` de los últimos 7 y 30 días por rol (sin cuentas anonimizadas) y `ratings` = `{available: false, average: null, count: 0}` hasta el Sprint 6. Sin cifras inventadas. Lleva `generated_at` con la hora del servidor |
| `POST /me/password` | Sesión activa | Recibe `current_password`, `password` y `password_confirmation`. La actual incorrecta devuelve 422 sin cambiar nada; la nueva sigue la regla de S1. Incrementa `auth_version`, lo que cierra las otras sesiones y conserva la actual; se audita sin valores |
| `PATCH /me` (ampliado) | Sesión activa | Acepta `avatar_media_id` (media propia con finalidad `avatar`, revisada) y `theme_preference` (`light`, `dark` o `system`) |
| `POST /media` (ampliado) | Sesión activa | Nueva finalidad `avatar`: solo imagen, saneada con `ImageSanitizer` y con un límite de tamaño |

**Migración (1):** `users.avatar_media_id` (nullable, FK a `media_files`) y `users.theme_preference` (nullable). Además, el permiso `dashboard.view` asignado al rol `admin`, con una migración de datos idempotente como el `AuthorizationSeeder`.

**Pantallas:**
- **Layout común `PanelShell`:**
  - barra lateral contraíble con iconos, `aria-current` en la sección activa y estado recordado por usuario;
  - en móvil, la barra lateral pasa a un cajón con foco atrapado, Escape y devolución del foco;
  - barra superior con campana (contador de nuevas desde `GET /notifications`) y menú del avatar (Mi perfil, Tema claro/oscuro, Cerrar sesión);
  - tema por `[data-theme]` con los tokens existentes: preferencia guardada en `/me` y, como respaldo, en `localStorage` con `try/catch`;
  - transiciones suaves, desactivadas con `prefers-reduced-motion`.
- **Menú del administrador:** Inicio, Catálogo, Verificación, Comunicados y Mi perfil. Los ítems dependen de `permissions[]`; Usuarios aparece en la Fase 2.
- **Inicio:** tarjetas de KPI con estados vacíos honestos («Aún no hay solicitudes», «Calificaciones disponibles desde el Sprint 6»), error con «Reintentar» y una lectura accesible de cada cifra.
- **Catálogo y Verificación:** las pantallas actuales, integradas sin cambiar su comportamiento. En Verificación se añaden suspender y reactivar con motivo y confirmación.
- **Mi perfil:** nombre, avatar (subida con vista previa) y cambio de contraseña. Doble validación y alertas de éxito y error.
- **Cliente y técnico:** usan el mismo `PanelShell` con su menú actual (su contenido no cambia en esta fase).

**Pruebas estimadas:**
- **Pest, unas 22:**
  - dashboard (8): 401, 403 sin permiso, conteos por estado con dataset sintético, ceros explícitos, pendientes de verificación, ventanas de 7 y 30 días con `travel`, exclusión de anonimizados y calificaciones no disponibles;
  - contraseña (8): actual incorrecta, confirmación distinta, nueva débil, nueva igual a la actual, éxito, otras sesiones invalidadas, auditoría sin valores y límite de intentos;
  - avatar y tema (6): media ajena, finalidad incorrecta, tipo no imagen, tema inválido, éxito y versión obsoleta con 409.
- **Vitest, unas 32:**
  - layout (10): contraer, `aria-current`, teclado, cajón móvil con Escape y foco, campana;
  - tema (5): `data-theme`, persistencia en la API, respaldo en `localStorage`, almacenamiento bloqueado y movimiento reducido;
  - Inicio (6): KPIs, vacíos, error con reintento y calificaciones no disponibles;
  - Mi perfil (7): validación de cliente, alertas, contraseña actual errónea y avatar;
  - suspensión (4): motivo obligatorio, confirmación, alertas y prueba negativa.

### Fase 2 · Usuarios

**Endpoints nuevos, todos con `users.manage` (nuevo):**
- `GET /admin/users`: búsqueda por nombre o correo; filtros `role`, `status` (activo, bloqueado o pendiente de activación) y `district_id`; paginado.
- `POST /admin/users`: cliente, técnico o administrador.
  - Campos comunes: nombres, apellidos, correo, teléfono, distrito y dirección de referencia.
  - Técnico: especialidades, distrito base y tarifa base.
  - **No recibe contraseña.**
- `GET /admin/users/{id}` y `PATCH /admin/users/{id}`, este con `expected_version`.
- `POST /admin/users/{id}/block` y `POST /admin/users/{id}/unblock`, con motivo obligatorio (D-32): bloquear cierra sesiones e impide nuevas solicitudes; las atenciones en curso siguen.
- `POST /admin/users/{id}/activation-link`: reenvía el enlace de activación. Usa `password_reset_tokens` con una notificación propia y caducidad; en desarrollo `MAIL_MAILER=log`.
- **Protección:** no se puede bloquear, degradar ni quitar el último administrador activo (409).
- **Auditoría:** cada operación se registra en `audit_entries`, sin datos sensibles.

**Migraciones (2):**
- `users.given_names`, `users.family_names` y `users.district_id`; `name` se conserva como nombre para mostrar (NOMBRES-01).
- `client_profiles.reference_address`, más la tabla `account_blocks` (historial de bloqueos con motivo, actor y fechas).

**Pantallas:** listado con búsqueda y filtros, formulario por rol, detalle con historial de bloqueos, bloquear y desbloquear con motivo y confirmación, y reenviar activación. Además, la pantalla pública «Definir contraseña» del enlace.

**Pruebas estimadas:** unas 32 de Pest (permisos, validación, enlace de activación con `MAIL_MAILER=log` y `Notification::fake`, último administrador, bloqueo con sesiones cerradas, filtros y auditoría) y unas 20 de Vitest.

### Fase 3 · Comunicados ampliados

**Endpoints:**
- `POST` y `PATCH /admin/announcements` aceptan `type` (`promotion`, `raffle`, `update` o `notice`) e `image_media_id` (media con finalidad `announcement`, revisada).
- `GET /announcements` devuelve solo los vigentes para el rol, ordenados por `priority`.
- Se conservan el duplicado, la publicación y el retiro.

**Migración (1):** `announcements.type` e `announcements.image_media_id`; la columna heredada `image` deja de escribirse.

**Pantallas:** editor con vista previa, tipo, audiencia, vigencia, orden y estado, y carrusel de comunicados vigentes en el Inicio del cliente y del técnico (pausa, teclado y movimiento reducido). **Sin pagos ni cupones reales.**

**Pruebas estimadas:** unas 14 de Pest y unas 14 de Vitest. Las pruebas S02 de comunicados (TC018 y `AnnouncementAdminTest`) deben seguir pasando.

### Fase 4 · Correo

**Endpoints:**
- `POST /me/email-change`: pide la contraseña actual y envía un enlace firmado al **nuevo** correo.
- `GET /email-change/{id}/confirm` (URL firmada y con caducidad): el correo **cambia solo al confirmar**, se avisa al anterior y se incrementa `auth_version`.
- `POST /auth/email/verification` (reenvío) y `GET /auth/email/verify/{id}/{hash}` (firmada) para la verificación al registrarse.

**Migración (1):** tabla `email_changes` (usuario, correo nuevo, hash del token, caducidad, confirmación y anulación).

**Pantallas:** cambio de correo en Mi perfil, aviso «verifica tu correo» y página de confirmación.

**Pruebas estimadas:** unas 16 de Pest y unas 8 de Vitest.

### Fuera de alcance (Sprint 7)

Reglas y pesos del matching con historial, reasignación manual, soporte, reportes Excel y PDF, y pantalla de auditoría.

## 3. Sprints cerrados que no se deben romper y relación con el Sprint 7

| Parte | Origen | Riesgo y cómo se protege |
|---|---|---|
| Catálogo, verificación y comunicados | Sprint 2 (cerrado, S2.6 con Quality Gate aprobado) | Se integran sin cambiar contratos. Sus Pest (TC015, TC016, TC018, TC019, etc.) y Vitest `sprint02*` siguen en verde. Si cambia el selector de pestañas `s02-nav`, se ajustan las pruebas **explicando el motivo** y conservando sus IDs |
| Sesión, perfil y matriz de autorización | Sprint 1 | `PATCH /me` sigue prohibiendo `email` y `password`; la contraseña va por un endpoint aparte. `AuthorizationMatrixTest` se amplía con las rutas nuevas, sin cambiar las existentes |
| Portales de cliente y técnico, ofertas y notificaciones | Sprints 3 y 4 | El `PanelShell` envuelve sin cambiar `ClientPortal`, `OffersInbox` ni `Notifications`. Se conservan los `data-cy` (`portal-*`, `logout`) que usan las Cypress de S01 a S04 (no se ejecutan sin pedido; queda como riesgo) |
| Dashboard (HU-S07-01), clientes y bloqueos (HU-S07-03), administradores (HU-S07-07) | **CANVAS del Sprint 7** | **Conflicto de fuentes** (regla 3): el CANVAS S7 se llama «Panel administrador completo» e incluye el dashboard con filtros y alertas (TC-087 y TC-088), los bloqueos (TC-091 y TC-092) y los administradores. El alcance pedido adelanta una parte (KPIs sin filtros ni alertas, usuarios y bloqueos). Ver ORG-02 |
| Comunicados ampliados y correo | No figuran en ningún CANVAS | Son requisitos nuevos del equipo; se registran como tales |

## 4. Decisiones que necesito antes de la Fase 1

Cada una tiene dos opciones; la recomendada va primero. Una vez decididas se registran en `DECISIONES.md`.

| ID | Decisión | Opción A (recomendada) | Opción B |
|---|---|---|---|
| **ORG-02** | Dónde cuenta este trabajo | Se adelanta del Sprint 7: el panel base, el Inicio y los usuarios cuentan como **S07-TC** (TC-087 parcial y TC-091/092 en la Fase 2) y los filtros y alertas del dashboard quedan para el S7. Respeta el CANVAS y no infla el sprint en curso | Se cuenta en el sprint en curso con IDs **S05-TC**, aunque el CANVAS S5 trata de la atención y la agenda. Habría que reescribir el plan del S5 |
| **PERM-01** | Autorización del Inicio y de Usuarios | Permisos nuevos `dashboard.view` y `users.manage` asignados al rol `admin` por migración idempotente: es el mismo mecanismo `permission:` de S2 | `role:admin` directo. Es más simple, pero no permite administradores parciales (HU-S07-07) |
| **NOMBRES-01** | Nombres y apellidos (Fase 2) | Añadir `given_names` y `family_names`; `name` queda como nombre para mostrar (`given_names + family_names`) y no rompe S1 ni el contrato | Sustituir `name` por los dos campos. Cambia el contrato v1 y las pruebas de S1 a S4 |
| **TEMA-01** | Dónde se guarda el tema | `users.theme_preference` en `/me` (es por usuario y viaja entre equipos), con `localStorage` como respaldo antes de iniciar sesión | Solo `localStorage` con `try/catch`. No necesita migración, pero el tema no viaja entre equipos |
| **AVATAR-01** | Foto de perfil | Finalidad de media `avatar`, saneada y revisada como el portafolio; las iniciales se usan como respaldo | Solo iniciales hasta el Sprint 8. Sin subida ni migración de media |
| **VERIF-01** | Cuenta con correo sin verificar (Fase 4) | Puede iniciar sesión, pero no enviar solicitudes ni aceptar ofertas hasta verificar. Esto no rompe a los usuarios de S1–S4, que se marcan como verificados por migración | No puede iniciar sesión hasta verificar. Es más estricto y obliga a migrar o verificar las cuentas existentes |
| **BASE-01** | Base de la rama de la Fase 1 | Integrar primero los PR #26 y #27 y crear la rama desde ese `main`: los tokens `--ty-md/lg/xl/2xl` y el estilo de la landing que el panel reutiliza están en el #27 | Empezar ya desde el `main` actual (`441644b`) y resolver después los conflictos de `tokens.css` y `HANDOFF` |

## 5. Ramas y entrega

- **Fase 1:** son 4 endpoints pequeños, así que va backend y frontend en una sola rama, `feature/pimentel/admin/panel-base`. Si las fases 2 a 4 crecen, el backend va en `feature/mayhuasca/admin/…` y el frontend en `feature/delgado/admin/…`.
- **Orden TDD por fase:** commit de pruebas en rojo (Pest y Vitest), implementación, evidencias.
- **Ejecución:**
  - Pest en el slot A (`tecnicoya_testing`), con las guardas DEF-44 y DEF-45;
  - Vitest, lint y build;
  - capturas con Playwright y el Chromium ya instalado (tema claro y oscuro, 1366 y 390 px);
  - Cypress solo a pedido.
- **Documentos que se actualizan:** `DECISIONES.md`, `CONTRATO-API.md`, el catálogo de casos y `HANDOFF-claude.md`.
