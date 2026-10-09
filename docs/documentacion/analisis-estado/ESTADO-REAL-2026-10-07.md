# Estado real del proyecto TécnicoYa Huancayo

**Fecha del análisis:** 7 de octubre de 2026. **Tipo:** auditoría técnica de solo lectura.
**Raíz:** `C:\Users\<usuario>\Documents\ChatGPT\Software TecnicoYa-Huancayo`.

**Etiquetas:** **[VERIFICADO]** = comprobado ahora con un comando o leyendo el archivo; **[DOCUMENTADO]** = lo afirma un documento y no se comprobó; **[NO VERIFICABLE]** = no se puede comprobar desde este equipo. Los secretos y correos se reportan como **[OCULTO]** (ruta y línea, sin valor).

**Reglas aplicadas:** no se modificó ni borró ningún archivo existente; este informe es el único archivo nuevo. No se abrieron `.env`, `.env.testing`, `.env.quality.local` ni `sonar/issues.json`. No se ejecutaron Cypress, SonarQube, instalaciones ni migraciones de desarrollo. Sin commit ni push.

---

## 1. Git y repositorio

### 1.1 Ramas y remoto [VERIFICADO]

| Elemento | Valor |
|---|---|
| Rama actual | `main` en `d361c63` |
| Ramas locales | solo `main` |
| Ramas remotas | `origin/main` en `d361c63` (`origin/HEAD` → `origin/main`) |
| Remoto `origin` | `https://github.com/grupopruebas41/TecnicoYA-Huancayo.git` |
| Commits locales sin subir | 0 (`main` = `origin/main`; `git ls-remote` devuelve `d361c63`) |
| Rama `codex/sprint-01` | **ya no existe**: el reflog registra `Branch: renamed refs/heads/codex/sprint-01 to refs/heads/main` (2026-10-06 19:44:55 -0500) |
| Otras referencias | dos referencias técnicas de Codex (`refs/codex/turn-diffs/...`); sin stash |

**Cambio respecto a la sesión anterior [VERIFICADO por reflog]:** el 6 de octubre a las 19:42 se creó el commit `d361c63 "Primer commit - TecnicoYa-Huancayo"` sobre `codex/sprint-01` (encima de `7e97432`, Sprint 3), la rama se renombró a `main` y se publicó en un repositorio **distinto** al anterior (antes `James091104/Software-TecnicoYa-Huancayo`). El historial completo se conserva: los commits de los Sprints 1 a 3 (`c74b1ef`, `8997de8`, `57c30cf`, `7e97432`, etc.) existen y son ancestros de `main`.

**¿`codex/sprint-01` integrada en `main` o publicada?** [VERIFICADO] Sí, en la práctica: su contenido **es** la rama `main` actual (por renombrado, no por merge) y está publicada en `grupopruebas41/TecnicoYA-Huancayo`.

**Hallazgo de privacidad [VERIFICADO por `git show --stat`]:** el commit `d361c63` contiene un único archivo, `docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json` (7475 líneas). En la sesión anterior se comprobó que ese archivo contiene **114 veces un correo institucional personal** **[OCULTO]** y se dejó fuera de los commits por ese motivo. **Ahora está publicado en GitHub.** No se abrió el archivo en este análisis.

### 1.2 Archivos sin commit [VERIFICADO]

| Estado | Archivo |
|---|---|
| Modificado | `docs/documentacion/evidencias/sprint-01/continuacion/INFORME.md` (+7 −3; modificado 2026-10-06 20:17) |
| Nuevo | `docs/.../continuacion/sprint01-next-4-pest.txt` |
| Nuevo | `docs/.../continuacion/sprint01-next-4-sonar-analysis.txt` |
| Nuevo | `docs/.../continuacion/sprint01-next-4-sonar-summary.txt` |
| Nuevo | `docs/.../continuacion/sprint01-next-4-vitest.txt` |

Todos con fecha 2026-10-06 20:17, posteriores al último commit: corresponden a un segundo análisis de SonarQube no registrado en git.

### 1.3 Commits por fecha y autor [VERIFICADO]

| Fecha | Autor | Commits |
|---|---|---:|
| 2026-09-22 | James091104 | 1 |
| 2026-10-05 | James091104 | 5 |
| 2026-10-06 | James091104 | 29 |
| **Total** | | **35** |

Todos los commits figuran con un único autor git, aunque el equipo tiene tres integrantes. No hay ramas por integrante (ver Sección 6).

### 1.4 Tamaño y carpetas de primer nivel [VERIFICADO]

- `.git`: 150 MB (paquete 148,55 MiB). Archivos versionados: 172,3 MB en total. Directorio de trabajo sin `.git`: aproximadamente 534 MB (incluye `node_modules` y `vendor`, no versionados).
- Hay un video versionado en la raíz: `habitación typing.mp4` (6,8 MB), sin propósito documentado.

| Carpeta | Archivos versionados | MB | Propósito (comprobado por contenido) |
|---|---:|---:|---|
| `frontend/` | 575 | 103,7 | SPA React + Vite (`frontend/web`), medios del sitio y pruebas Vitest/Cypress |
| `docs/` | 275 | 48,9 | Documentación del proyecto, editables, PDF, fuentes y evidencias |
| `backend/` | 186 | 0,7 | API Laravel 12 (`backend/api`) con pruebas Pest/PHPUnit |
| `public/` | 4 | 12,1 | Landing estática histórica (`hero.css`, `hero.js`, `index.html`, video) |
| `scripts/` | 12 | 0,2 | Generadores de documentación, calidad, E2E, conteo TC y sincronización de reglas |
| `python/` | 9 | 0,0 | Servicio FastAPI de matching (`python/api`) con pytest |
| `.devops/` | 8 | 0,0 | Plantillas del Laboratorio DevOps (README, `gitlab.env.example`, `project.yml`) |
| `infrastructure/` | 5 | 0,0 | Docker Compose del producto (histórico) y de calidad (SonarQube) |
| `database/` | 3 | 0,0 | SQL histórico (`init.sql`, `seeds.sql`) |
| `domain/` | 2 | 0,0 | Reglas de negocio (`rules.json`) y fixture de matching |
| Raíz | 10 | 6,8 | `README.md`, `CI-CD.md`, `.gitlab-ci.yml`, `project.yml`, `LICENSE`, `.env.example`, workspace, video |

---

## 2. Inventario de código

### 2.a Backend Laravel (`backend/api`) [VERIFICADO]

| Elemento | Valor |
|---|---|
| Laravel | 12.68.0 (`php artisan --version`) |
| PHP CLI | 8.2.12 (XAMPP) |
| Paquetes de producción | `laravel/framework` ^12.0, `laravel/sanctum` 4.3.3, `laravel/tinker`, `firebase/php-jwt` 7.1.0 (herencia del token histórico) |
| Paquetes de desarrollo | `pestphp/pest` 3.8.7, `pestphp/pest-plugin-laravel` 3.2.0, `phpunit/phpunit` 11.5.56, Faker, Mockery, Pint, Sail, Pail, Collision |
| Idioma | `config/app.php`: `locale` y `fallback_locale` = `es`; `lang/es/api.php` (29 líneas), `auth.php` (7), `validation.php` (70) |

**Módulos en `app/Modules`** (de los seis A–F previstos en el CANVAS de estructura, existen dos):

| Módulo | Contenido |
|---|---|
| `ARequests` (RF-01..05) | `ManageServiceRequests`, `RequestTimeline`, `ServiceRequestView`; reglas `AttachableEvidence`, `TargetTechnicianOffers`; `ServiceRequestController`; 4 Form Requests |
| `FAdministration` (RF-28..33, RF-C) | 11 casos de uso (cuentas, perfil, catálogo, comunicados, revisión técnica, disponibilidad, servicios, portafolio, perfil público, aprovisionamiento); 4 reglas de dominio; 7 controladores; 11 Form Requests; `AccountData` |
| `BMatching`, `COffers`, `DService`, `ERatings` | **no encontrados** |

**Otros:**
- **Modelos (10):** `User`, `ClientProfile`, `TechnicianProfile`, `TechnicianService`, `ServiceRateVersion`, `TechnicianDocument`, `MediaFile`, `District`, `Announcement`, `ServiceRequest`.
- **Middleware (4):** `ApiToken` (histórico), `EnsureAccountIsActive`, `RequirePermission`, `RequireRole`.
- **Servicios compartidos:** `Shared/Audit/AuditTrail`, `Shared/Auth/EffectivePermissions`, `Shared/Http/ApiResponse`, `ApiExceptionRenderer`, `Idempotency`.
- **Servicios históricos** en `app/Services`: `Marketplace`, `Matching`, `Permissions`, `Announcements`.
- **Comando:** `ProvisionAdmin` (`tecnicoya:provision-admin`).
- **Seeders:** `AuthorizationSeeder`, `CatalogSeeder` (+ `data/catalog.csv`, 31 líneas: cabecera y 30 subcategorías), `Sprint01E2ESeeder`.
- **Factories (9):** `User`, `ClientProfile`, `TechnicianProfile`, `TechnicianService`, `TechnicianDocument`, `MediaFile`, `District`, `Announcement`, `ServiceRequest`.

**Migraciones (17) y tablas:**

| Migración | Tablas creadas (C) o ampliadas (A) |
|---|---|
| 2026_09_22_000001 marketplace | C: users, api_tokens, technicians, requests, offers *(históricas)* |
| 2026_09_28_000002 account_access | C: access_events; A: users |
| 2026_09_28_000003 announcements | C: announcements *(histórica, id UUID)* |
| 2026_10_04_000004 subcategories | A: requests, technicians |
| 2026_10_06_000005 | C: roles, permissions |
| 2026_10_06_000006 | A: users (role_id, phone, version, auth_version…) |
| 2026_10_06_000007 | C: role_permissions, user_permissions |
| 2026_10_06_000008 | C: client_profiles, technician_profiles |
| 2026_10_06_000009 | C: specialties, subcategories |
| 2026_10_06_000010 | C: sessions |
| 2026_10_06_000011 | C: audit_entries |
| 2026_10_07_000012 | C: districts, media_files |
| 2026_10_07_000013 | A: specialties, subcategories (medios) |
| 2026_10_07_000014 | C: technician_services, service_rate_versions, technician_districts, availability_slots, technician_pauses |
| 2026_10_07_000015 | C: technician_documents, technician_reviews, review_documents, portfolio_items, portfolio_images |
| 2026_10_07_000016 | C: announcement_audiences; A: announcements |
| 2026_10_07_000017 | C: service_requests, request_attachments, request_events, idempotency_records |

Hay **dos modelos de datos en paralelo**: el histórico (`requests`, `technicians`, `offers`, `api_tokens`) y el del diccionario v1 (`service_requests`, `technician_profiles`, etc.). No hay migración de datos entre ambos.

### 2.b Rutas [VERIFICADO con `php artisan route:list --json`]

**Rutas `/api/v1` (25) y `/sanctum/csrf-cookie`.** La columna «Prueba Pest» se comprobó leyendo cada archivo de prueba; la búsqueda automática por texto daba falsos positivos.

| Método | Ruta | Controlador | Middleware | Prueba Pest |
|---|---|---|---|---|
| GET | /sanctum/csrf-cookie | Sanctum `CsrfCookieController@show` | web | — (Cypress S01) |
| POST | /api/v1/auth/register | FAdministration `AuthController@register` | throttle:spa-auth | TC-002, 003, 004, 006, 008, 009, 010, 137 |
| POST | /api/v1/auth/login | FAdministration `AuthController@login` | throttle:spa-auth | TC-006, 137 |
| POST | /api/v1/auth/logout | FAdministration `AuthController@logout` | auth:sanctum | TC-006 |
| GET | /api/v1/me | `ProfileController@show` | auth:sanctum, account.active | TC-006, 137 |
| PATCH | /api/v1/me | `ProfileController@update` | auth:sanctum, account.active | TC-003, 004, 009, 010 |
| GET | /api/v1/catalog/specialties | `CatalogController@specialties` | público | TC-012 |
| GET | /api/v1/catalog/subcategories | `CatalogController@subcategories` | público | TC-012, 015, 016 |
| GET | /api/v1/media/{media} | `MediaController@show` | público con control de lectura | TC-020, 029, 030, 127 |
| GET | /api/v1/announcements | `AnnouncementController@index` | auth:sanctum, account.active | TC-017, 018 |
| POST | /api/v1/admin/subcategories | `AdminCatalogController@storeSubcategory` | + permission:catalog.manage | TC-015 |
| PATCH | /api/v1/admin/subcategories/{id} | `AdminCatalogController@updateSubcategory` | + permission:catalog.manage | TC-016 |
| POST | /api/v1/admin/announcements/{id}/duplicates | `AnnouncementController@duplicate` | + permission:announcements.manage | TC-018 |
| POST | /api/v1/admin/technicians/{id}/reviews | `TechnicianProfileController@review` | + permission:technicians.verify | TC-019 |
| PUT | /api/v1/technicians/me/availability | `TechnicianProfileController@availability` | + role:technician | TC-023, 024, 134 |
| PUT | /api/v1/technicians/me/services | `TechnicianProfileController@services` | + role:technician | TC-016, 025, 026, 134 |
| POST | /api/v1/technicians/me/portfolio | `TechnicianProfileController@storePortfolio` | + role:technician | TC-021 |
| GET | /api/v1/technicians/{id} | `TechnicianProfileController@show` | auth:sanctum, account.active | TC-034 |
| GET | /api/v1/technicians/{id}/portfolio | `TechnicianProfileController@portfolio` | público | TC-021 |
| GET | /api/v1/requests | ARequests `ServiceRequestController@index` | + role:client | TC-038 |
| POST | /api/v1/requests | `ServiceRequestController@store` | + role:client | TC-029, 030, 031, 032, 035, 036, 037, 119, 120, 121, 126, 129 |
| GET | /api/v1/requests/{id} | `ServiceRequestController@show` | auth:sanctum, account.active | TC-029, 031, 038, 127, 129 |
| PATCH | /api/v1/requests/{id} | `ServiceRequestController@update` | + role:client | TC-126 |
| POST | /api/v1/requests/{id}/attachments | `ServiceRequestController@attach` | + role:client | TC-029, 030, 126, 129 |
| DELETE | /api/v1/requests/{id}/attachments/{media} | `ServiceRequestController@detach` | + role:client | TC-129 |
| POST | /api/v1/requests/{id}/submission | `ServiceRequestController@submit` | + role:client | TC-037, 126 |

**Rutas históricas `/api` sin v1 (6):**

| Método | Ruta | Middleware | Pruebas | Estado |
|---|---|---|---|---|
| GET | /api/health | — | — | En uso por el arrancador E2E (`run-sprint01-e2e.mjs` espera `/api/health`) |
| POST | /api/register | throttle:10,1 | MarketplaceTest | Heredada; la usa el modo «en vivo» de `#demo` |
| POST | /api/login | throttle:10,1 | AnnouncementsTest, MarketplaceTest | Heredada (token Bearer propio) |
| POST | /api/logout | token | MarketplaceTest | Heredada |
| GET | /api/state | token | AnnouncementsTest, MarketplaceTest | Heredada |
| POST | /api/actions/{action} | token | AnnouncementsTest, MarketplaceTest | Heredada: ofertas, matching, calificación y comunicados del prototipo |

### 2.c Frontend (`frontend/web`) [VERIFICADO]

**Archivos en `src`:**
- **Pantallas históricas:** `App`, `Marketplace`, `Auth`, `AccountPanel`, `Announcements`, `ServiceCarousel`, `TechnicianProfile`, `VideoExperience`, `scroll/*`.
- **Dominio del prototipo:** `domain/demo.js`, `matching.js`, `permissions.js`, `announcements.js`, `rules.json`.
- **`features/administration`** (lo único nuevo): `AccountApp`, `Catalog`, `ProfileForm`, `SessionForm`, `forms`, `http.js`, `account.css`.

| Ruta en la SPA | Pantalla | Contrato |
|---|---|---|
| `#inicio` (landing) | `App` + carrusel + video | Estático (reglas locales `rules.json`) |
| `#cuenta`, `#plataforma` | `features/administration/AccountApp` | **`/api/v1` con sesión Sanctum** (CSRF + cookie): `/me`, `/auth/*`, `/catalog/*` |
| `#catalogo` | `features/administration/Catalog` | **`/api/v1/catalog/*`** |
| `#demo` | `Marketplace` | **Demostración `localStorage`** (`tecnicoya.marketplace.v1`); permite cambiar a modo «en vivo», que usa la API **histórica** `/api/*` con token Bearer (`marketplace-api.js`) |

- **Pantallas del frontend v1 que faltan:** no hay pantallas para lo implementado en los Sprints 2 y 3 (catálogo administrativo, comunicados v1, revisión técnica, disponibilidad, servicios, portafolio, solicitud en cinco pasos). Ese flujo solo existe en la demo y en la API histórica.
- **Códigos distintos en la demo:** usa subcategorías como `refrigeracion-vitrinas`, pero el catálogo v1 sembrado usa `frio-vitrinas` (`catalog.csv`).
- **Scripts de `package.json`:** `dev`, `build`, `start`, `test` (vitest run), `cy:open`, `cy:run`.
- **Cypress:** `cypress/e2e/sprint-01/` con **3 specs** (`catalog.cy.js`, `portals.cy.js`, `validation.cy.js`), además de `cypress.config.js` y `cypress.sprint01.config.js`. No hay specs para los Sprints 2 y 3.

### 2.d Servicio Python y reglas [VERIFICADO]

- **`python/api/app.py`** (FastAPI): `GET /health` y `POST /match`. Calcula el ranking ponderado con `RULES['weights']`.
- **Quién ejecuta el matching:** solo la API **histórica**. `app/Services/Matching.php` llama a `POST {PYTHON_URL}/match` con 2 s de espera y, si falla, calcula el ranking en PHP («fallback»). El frontend demo también calcula en JS (`domain/matching.js`). **La API v1 no tiene matching** (es del Sprint 4).
- **`rules.json`:** hay 4 copias idénticas (MD5 `cf1ccc07…`) en `domain/`, `python/api/`, `backend/api/resources/domain/` y `frontend/web/src/domain/`, sincronizadas por `scripts/sync-rules.py`.

| Parámetro en `rules.json` (versión 2) | Valor |
|---|---|
| `weights` | proximity 0.35, price 0.20, rating 0.30, experience 0.15 |
| `responseMinutes` | 10 |
| `maxSimultaneous` | 3 |
| `pendingHours` | 24 |
| `ratingHours` | 48 |
| `maxExperienceYears` | **10** |
| `secondaryZoneProximity` | **0.5** |
| `zones` | Huancayo, El Tambo, Chilca, Pilcomayo, Huancán |

Ojo: la formalización de reglas indica que la referencia de experiencia (Aref) y la normalización de cercanía **siguen pendientes de P15**, pero `rules.json` ya fija 10 años y 0,5 (ver Sección 5).

### 2.e Infraestructura [VERIFICADO]

| Pieza | Servicios | Motor de BD | Puertos publicados |
|---|---|---|---|
| `infrastructure/docker-compose.yml` (histórico del producto) | `database`, `matching` (build `python/api`), `api` (build `backend/api`), `web` | **PostgreSQL 16** (`DB_CONNECTION: pgsql`) | `5173` (web); PostgreSQL y API solo en la red interna |
| `backend/api/docker-compose.testing.yml` | `mysql-test` (`tecnicoya-mysql-test`) | **MySQL 8.4** | `127.0.0.1:3306` |
| `infrastructure/docker-compose.quality.yml` (perfil `quality`) | `sonar-db`, `sonarqube`, `sonar-scanner` (imágenes fijadas por digest) | PostgreSQL 16, solo base interna de SonarQube | `127.0.0.1:9000` |
| `.gitlab-ci.yml` | Solo `include: project root/laboratorio-devops, file /gitlab/student-pipeline.yml` | — | — |
| `CI-CD.md` y `.devops/` | Describen el «Framework Laboratorio DevOps» con etapas detect/build/test/quality/security/package/deploy/health | `project.yml`: «React, Laravel, FastAPI y **PostgreSQL**»; `database.engine: auto` | — |
| Plantillas en `docs/.../iteracion-00` y `sprint-01-manual` | `docker-compose.iter0.yml`, `docker-compose.sprint01-tests.yml` | MySQL 8.4 (y PostgreSQL 16 en iter0) | No se usan en ejecución |

**Configuración de Laravel por entorno:**

| Entorno | Motor |
|---|---|
| Pruebas (`phpunit.xml`) | MySQL |
| `.env.example` | `pgsql` |
| Valor por defecto de `config/database.php` | `pgsql` |
| `.env` local | SQLite (dato de la sesión anterior, no reabierto) [DOCUMENTADO] |

**`scripts/` (12):**
- Documentación: `generar-documentacion-v2.py`, `publicar-documentacion-v2.py`, `generar-expediente-pdfs.py`, `documentar-calidad.py`.
- Calidad: `initialize-quality.mjs`, `run-quality.ps1`, `report-quality.mjs`, `normalizar-clover.php`.
- Pruebas: `run-sprint01-e2e.mjs`, `contar-casos-tc.php`.
- Otros: `sync-rules.py`, `build-scroll-sequence.py`.

---

## 3. Pruebas

### 3.a Ejecución por suite (7 de octubre, sin Cypress)

**Incidencia de entorno [VERIFICADO]:** al iniciar la Sección 3, **Docker Desktop no respondía** (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`). No se arrancó Docker ni se tocaron sus archivos. Por eso la base MySQL de pruebas no estaba disponible y Pest no pudo ejecutarse con resultado válido.

**Incidencia del propio análisis:** el contador (`scripts/contar-casos-tc.php`) ejecuta Pest con `--log-junit` y **sobrescribió `backend/api/test-results/junit.xml`**. Es un artefacto generado, ignorado por git y que ya existía. No afecta a ningún archivo versionado, pero se deja constancia porque las reglas pedían no modificar archivos existentes.

| Suite | Total | Aprobadas | Fallidas | Omitidas | Aserciones | Estado |
|---|---:|---:|---:|---:|---:|---|
| Pest (`php artisan test`) hoy | 62 | 0 | 62 | 0 | 0 | **[VERIFICADO] no ejecutable**: las 62 fallan por `SQLSTATE[HY000] [2002]` (MySQL caído, Docker apagado). No es un fallo del código. |
| Pest, última ejecución en verde | 62 | 62 | 0 | 0 | 714 | **[DOCUMENTADO]** en `docs/documentacion/evidencias/sprint-03/04-verde-final.txt` (commit `7e97432`, 06-10 16:35) |
| Vitest (`npm test`, frontend/web) | 38 | 38 | 0 | 0 | — | **[VERIFICADO]** hoy |
| pytest (`python -m pytest`, python/api) | 4 | 4 | 0 | 0 | — | **[VERIFICADO]** hoy (12 avisos de funciones obsoletas de FastAPI/Python 3.14) |

Resúmenes finales tal como se obtuvieron hoy:

```
# Pest (Docker apagado)
  Tests:    62 failed (0 assertions)
  Duration: 268.75s

# Pest, última salida en verde guardada (06-10-2026)
  Tests:    62 passed (714 assertions)
  Duration: 35.45s

# Vitest
 Test Files  8 passed (8)
      Tests  38 passed (38)
   Duration  14.43s

# pytest
4 passed, 12 warnings in 0.84s
```

### 3.c Conteo de casos TC (`scripts/contar-casos-tc.php`)

| Medición | IDs TC aprobados | Cuentan para la meta | Faltan para 60 | Etiqueta |
|---|---:|---:|---:|---|
| Hoy (Docker apagado) | 0 | 0 | 60 | [VERIFICADO], pero sin validez por el entorno |
| Última ejecución en verde (06-10, 16:35, tras `7e97432`) | 38 | **37** (TC-012 no cuenta: está clasificado como Cypress) | **23** | [DOCUMENTADO] por la salida guardada y la lista de 3.b, que coinciden |

La última salida en verde contiene las 62 pruebas actuales y no hay cambios de código desde entonces (`git status` solo muestra evidencias). Por eso 37 de 60 es la cifra real más reciente, aunque hoy no se pudo reproducir.

### 3.b Pruebas Pest por archivo [VERIFICADO por lectura de archivos]

Total de pruebas Pest encontradas en `backend/api/tests`: **62** (todas en `tests/Feature`; `tests/Unit` solo tiene `.gitkeep`).

| # | ID TC | Archivo | Carpeta | Clasificación en la matriz | En la última salida verde (06-10, 16:35) |
|---|---|---|---|---|---|
| 1 | sin ID | `tests/Feature/AnnouncementsTest.php` | Feature | — (sin ID) | ✓ |
| 2 | sin ID | `tests/Feature/AnnouncementsTest.php` | Feature | — (sin ID) | ✓ |
| 3 | sin ID | `tests/Feature/AnnouncementsTest.php` | Feature | — (sin ID) | ✓ |
| 4 | sin ID | `tests/Feature/AnnouncementsTest.php` | Feature | — (sin ID) | ✓ |
| 5 | sin ID | `tests/Feature/AnnouncementsTest.php` | Feature | — (sin ID) | ✓ |
| 6 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 7 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 8 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 9 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 10 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 11 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 12 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 13 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 14 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 15 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 16 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 17 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 18 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 19 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 20 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 21 | sin ID | `tests/Feature/MarketplaceTest.php` | Feature | — (sin ID) | ✓ |
| 22 | sin ID | `tests/Feature/Sprint01/ProvisionAdminTest.php` | Sprint01 | — (sin ID) | ✓ |
| 23 | sin ID | `tests/Feature/Sprint01/ProvisionAdminTest.php` | Sprint01 | — (sin ID) | ✓ |
| 24 | sin ID | `tests/Feature/Sprint01/ProvisionAdminTest.php` | Sprint01 | — (sin ID) | ✓ |
| 25 | TC-002 | `tests/Feature/Sprint01/TC002DuplicateEmailTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 26 | TC-003 | `tests/Feature/Sprint01/TC003PendingTechnicianTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 27 | TC-004 | `tests/Feature/Sprint01/TC004SelfActivationRejectedTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 28 | TC-006 | `tests/Feature/Sprint01/TC006LogoutInvalidatesSessionTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 29 | TC-007 | `tests/Feature/Sprint01/TC007AdminRouteDeniedTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 30 | TC-008 | `tests/Feature/Sprint01/TC008PublicAdminSignupDeniedTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 31 | TC-009 | `tests/Feature/Sprint01/TC009OwnProfileEditTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 32 | TC-010 | `tests/Feature/Sprint01/TC010StaleWriteConflictTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 33 | TC-011 | `tests/Feature/Sprint01/TC011RepeatableCatalogSeedTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 34 | TC-012 | `tests/Feature/Sprint01/TC012CatalogApiTest.php` | Sprint01 | Otra herramienta / evaluación | ✓ |
| 35 | TC-137 | `tests/Feature/Sprint01/TC137PasswordNeverExposedTest.php` | Sprint01 | Backend Pest previsto | ✓ |
| 36 | TC-015 | `tests/Feature/Sprint02/TC015CreateSubcategoryTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 37 | TC-016 | `tests/Feature/Sprint02/TC016DeactivateSubcategoryTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 38 | TC-017 | `tests/Feature/Sprint02/TC017AnnouncementAudienceTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 39 | TC-018 | `tests/Feature/Sprint02/TC018DuplicateAnnouncementTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 40 | TC-019 | `tests/Feature/Sprint02/TC019DocumentedApprovalTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 41 | TC-020 | `tests/Feature/Sprint02/TC020ForeignDocumentDeniedTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 42 | TC-021 | `tests/Feature/Sprint02/TC021PublishedPortfolioWorkTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 43 | TC-023 | `tests/Feature/Sprint02/TC023ValidAvailabilityTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 44 | TC-024 | `tests/Feature/Sprint02/TC024InvalidIntervalTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 45 | TC-025 | `tests/Feature/Sprint02/TC025NewRateVersionTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 46 | TC-026 | `tests/Feature/Sprint02/TC026NegativeRateTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 47 | TC-134 | `tests/Feature/Sprint02/TC134ForeignAvailabilityOrRateTest.php` | Sprint02 | Backend Pest previsto | ✓ |
| 48 | TC-029 | `tests/Feature/Sprint03/TC029OwnPhotoLinkedTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 49 | TC-030 | `tests/Feature/Sprint03/TC030ForeignFileReferenceTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 50 | TC-031 | `tests/Feature/Sprint03/TC031ReferenceFeeVisibleTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 51 | TC-032 | `tests/Feature/Sprint03/TC032OutOfCoverageTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 52 | TC-034 | `tests/Feature/Sprint03/TC034PublicProfileWithoutPrivateDataTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 53 | TC-035 | `tests/Feature/Sprint03/TC035DirectedOriginPreservedTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 54 | TC-036 | `tests/Feature/Sprint03/TC036IncompatibleTargetTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 55 | TC-037 | `tests/Feature/Sprint03/TC037IdempotentSubmissionTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 56 | TC-038 | `tests/Feature/Sprint03/TC038ForeignRequestTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 57 | TC-119 | `tests/Feature/Sprint03/TC119RequiredDataRejectedTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 58 | TC-120 | `tests/Feature/Sprint03/TC120InactiveSubcategoryTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 59 | TC-121 | `tests/Feature/Sprint03/TC121ScheduledWithoutDateTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 60 | TC-126 | `tests/Feature/Sprint03/TC126SubmittedRequestImmutableTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 61 | TC-127 | `tests/Feature/Sprint03/TC127PhotosHiddenFromUnnotifiedTechnicianTest.php` | Sprint03 | Backend Pest previsto | ✓ |
| 62 | TC-129 | `tests/Feature/Sprint03/TC129RemovePhotoByApiTest.php` | Sprint03 | Backend Pest previsto | ✓ |

- Pruebas **sin ID TC:** 24 (21 históricas de `AnnouncementsTest`/`MarketplaceTest` y 3 `S01-SEC-ADMIN` de `ProvisionAdminTest`).
- **IDs duplicados:** ninguno.
- **IDs que no existen en la matriz:** ninguno.
- IDs con prueba Pest pero **no** clasificados como «Backend Pest previsto»: TC-012 (complemento de un caso de Cypress).

### 3.d Cypress (sin ejecutar) [VERIFICADO por lectura de specs y evidencias]

Specs: 3; casos (`it`): 9.

| Spec | Caso |
|---|---|
| `cypress/e2e/sprint-01/catalog.cy.js` | TC-012 muestra el catálogo real servido por Laravel/MySQL |
| `cypress/e2e/sprint-01/catalog.cy.js` | TC-012 informa un fallo realista sin inventar catálogo |
| `cypress/e2e/sprint-01/portals.cy.js` | TC-001 registra un cliente mediante formulario |
| `cypress/e2e/sprint-01/portals.cy.js` | TC-005 inicia sesión real como ${role} y mantiene identidad al recargar |
| `cypress/e2e/sprint-01/portals.cy.js` | TC-006 rechaza por HTTP la cookie de una sesión cerrada |
| `cypress/e2e/sprint-01/portals.cy.js` | S01-SEC-CSRF rechaza un login sin token CSRF en el servidor HTTP |
| `cypress/e2e/sprint-01/validation.cy.js` | TC-001 / TC-002: valida el registro en cliente y muestra el rechazo del correo duplicado del servidor |
| `cypress/e2e/sprint-01/validation.cy.js` | TC-005: muestra el error de credenciales del servidor en español |
| `cypress/e2e/sprint-01/validation.cy.js` | TC-009 / TC-010 / TC-137: valida el perfil, confirma el guardado y conserva una edición concurrente |

### 3.e Matriz frente a la realidad (TC-001 a TC-140)

Columnas:
- **Matriz:** estado registrado en `Matriz-Trazabilidad-TC.csv`.
- **Prueba:** tipo de prueba que existe hoy.
- **Pasa:** resultado en la última ejecución con evidencia: Pest en `evidencias/sprint-03/04-verde-final.txt` (6 de octubre); Cypress en `sprint01-next-3-cypress.txt`. Pest no se pudo ejecutar hoy porque Docker estaba apagado.

| ID | Sprint | Clasificación | Pendiente | Matriz | Prueba | Pasa | Discrepancia |
|---|---|---|---|---|---|---|---|
| TC-001 | 1 | Otra | — | APROBADO | Cypress | sí |  |
| TC-002 | 1 | Pest | — | APROBADO | Pest + Cypress | sí |  |
| TC-003 | 1 | Pest | — | APROBADO | Pest | sí |  |
| TC-004 | 1 | Pest | — | APROBADO | Pest | sí |  |
| TC-005 | 1 | Otra | — | APROBADO | Cypress | sí |  |
| TC-006 | 1 | Pest | — | APROBADO | Pest + Cypress | sí |  |
| TC-007 | 1 | Pest | — | APROBADO | Pest | sí |  |
| TC-008 | 1 | Pest | — | APROBADO | Pest | sí |  |
| TC-009 | 1 | Pest | — | APROBADO | Pest + Cypress | sí |  |
| TC-010 | 1 | Pest | — | APROBADO | Pest + Cypress | sí |  |
| TC-011 | 1 | Pest | — | APROBADO | Pest | sí |  |
| TC-012 | 1 | Otra | — | APROBADO | Pest + Cypress | sí |  |
| TC-013 | 2 | Otra | — | NO EJECUTADO | no | — |  |
| TC-014 | 2 | Otra | — | NO EJECUTADO | no | — |  |
| TC-015 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-016 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-017 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-018 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-019 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-020 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-021 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-022 | 2 | Pest | P17 | NO EJECUTADO | no | — |  |
| TC-023 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-024 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-025 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-026 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-027 | 3 | Otra | — | NO EJECUTADO | no | — |  |
| TC-028 | 3 | Otra | — | NO EJECUTADO | no | — |  |
| TC-029 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-030 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-031 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-032 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-033 | 3 | Pest | — | NO EJECUTADO | no | — |  |
| TC-034 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-035 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-036 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-037 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-038 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-039 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-040 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-041 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-042 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-043 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-044 | 4 | Pest | P15 | NO EJECUTADO | no | — |  |
| TC-045 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-046 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-047 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-048 | 4 | Pest | P12 | NO EJECUTADO | no | — |  |
| TC-049 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-050 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-051 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-052 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-053 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-054 | 4 | Pest | P12 | NO EJECUTADO | no | — |  |
| TC-055 | 4 | Otra | — | NO EJECUTADO | no | — |  |
| TC-056 | 4 | Híbrido Pest + transporte real | — | NO EJECUTADO | no | — |  |
| TC-057 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-058 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-059 | 5 | Otra | — | NO EJECUTADO | no | — |  |
| TC-060 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-061 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-062 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-063 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-064 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-065 | 5 | Pest | P13 | NO EJECUTADO | no | — |  |
| TC-066 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-067 | 5 | Otra | — | NO EJECUTADO | no | — |  |
| TC-068 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-069 | 5 | Pest | P14 | NO EJECUTADO | no | — |  |
| TC-070 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-071 | 5 | Pest | P14 | NO EJECUTADO | no | — |  |
| TC-072 | 5 | Pest | — | NO EJECUTADO | no | — |  |
| TC-073 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-074 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-075 | 6 | Pest | P23 | NO EJECUTADO | no | — |  |
| TC-076 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-077 | 6 | Pest | P12, P13 | NO EJECUTADO | no | — |  |
| TC-078 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-079 | 6 | Pest | P07 | NO EJECUTADO | no | — |  |
| TC-080 | 6 | Otra | — | NO EJECUTADO | no | — |  |
| TC-081 | 6 | Pest | P07, P17 | NO EJECUTADO | no | — |  |
| TC-082 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-083 | 6 | Pest | P07 | NO EJECUTADO | no | — |  |
| TC-084 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-085 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-086 | 6 | Pest | — | NO EJECUTADO | no | — |  |
| TC-087 | 7 | Pest | P21 | NO EJECUTADO | no | — |  |
| TC-088 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-089 | 7 | Pest | P11, P14 | NO EJECUTADO | no | — |  |
| TC-090 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-091 | 7 | Pest | P18 | NO EJECUTADO | no | — |  |
| TC-092 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-093 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-094 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-095 | 7 | Pest | P19 | NO EJECUTADO | no | — |  |
| TC-096 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-097 | 7 | Pest | P21 | NO EJECUTADO | no | — |  |
| TC-098 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-099 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-100 | 7 | Pest | — | NO EJECUTADO | no | — |  |
| TC-101 | 8 | Pest | P01, P02, P16 | NO EJECUTADO | no | — |  |
| TC-102 | 8 | Pest | — | NO EJECUTADO | no | — |  |
| TC-103 | 8 | Pest | P02, P21 | NO EJECUTADO | no | — |  |
| TC-104 | 8 | Pest | — | NO EJECUTADO | no | — |  |
| TC-105 | 8 | Pest | P12 | NO EJECUTADO | no | — |  |
| TC-106 | 8 | Pest | — | NO EJECUTADO | no | — |  |
| TC-107 | 8 | Otra | — | NO EJECUTADO | no | — |  |
| TC-108 | 8 | Pest | — | NO EJECUTADO | no | — |  |
| TC-109 | 8 | Otra | — | NO EJECUTADO | no | — |  |
| TC-110 | 8 | Otra | — | NO EJECUTADO | no | — |  |
| TC-111 | 8 | Otra | P21 | NO EJECUTADO | no | — |  |
| TC-112 | 8 | Otra | — | NO EJECUTADO | no | — |  |
| TC-113 | 8 | Otra | P21 | NO EJECUTADO | no | — |  |
| TC-114 | 8 | Otra | P16, P21 | NO EJECUTADO | no | — |  |
| TC-115 | 8 | Otra | P09, P21 | NO EJECUTADO | no | — |  |
| TC-116 | 8 | Otra | P09, P21 | NO EJECUTADO | no | — |  |
| TC-117 | 8 | Otra | — | NO EJECUTADO | no | — |  |
| TC-118 | 8 | Otra | P09, P21 | NO EJECUTADO | no | — |  |
| TC-119 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-120 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-121 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-122 | 3 | Pest | P10 | BLOQUEADO | no | — |  |
| TC-123 | 3 | Pest | P17 | BLOQUEADO | no | — |  |
| TC-124 | 3 | Otra | — | NO EJECUTADO | no | — |  |
| TC-125 | 3 | Otra | — | NO EJECUTADO | no | — |  |
| TC-126 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-127 | 3 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-128 | 3 | Otra | — | NO EJECUTADO | no | — |  |
| TC-129 | 3 | Pest | Retiro tras envío sin regla | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-130 | 3 | Pest | P17 | BLOQUEADO | no | — |  |
| TC-131 | 2 | Otra | — | NO EJECUTADO | no | — |  |
| TC-132 | 4 | Pest | — | NO EJECUTADO | no | — |  |
| TC-133 | 4 | Pest | P05, P16 (condicionado) | NO EJECUTADO | no | — |  |
| TC-134 | 2 | Pest | — | NO EJECUTADO | Pest | sí | Tiene prueba que pasa, pero la matriz no registra la ejecución |
| TC-135 | 2 | Otra | — | NO EJECUTADO | no | — |  |
| TC-136 | 8 | Otra | P21 (condicionado: versiones y resoluciones) | NO EJECUTADO | no | — |  |
| TC-137 | 1 | Pest | — | APROBADO | Pest + Cypress | sí |  |
| TC-138 | 8 | Pest | Reglas de capas por fijar en el diseño (condicionado) | NO EJECUTADO | no | — |  |
| TC-139 | 8 | Pest | — | NO EJECUTADO | no | — |  |
| TC-140 | 4 | Pest | P15 | BLOQUEADO | no | — |  |

**Resumen:** coherentes 13; con prueba que pasa pero sin registrar en la matriz 27; sin prueba 100; la matriz dice APROBADO sin prueba 0.

**Lectura de 3.e:**
- **27 casos tienen prueba que pasa, pero la matriz sigue en `NO EJECUTADO`:** todos los de los Sprints 2 y 3. Solo los 13 del Sprint 1 se registraron.
- **100 casos no tienen prueba**, ni de Pest ni de Cypress.
- Ningún caso figura como `APROBADO` sin prueba.

**Cypress [VERIFICADO por lectura]:** hay 3 specs y 9 bloques `it`. Uno de ellos (TC-005) se repite en un bucle para cliente, técnico y administrador, por eso la evidencia registra **11 casos**. La última evidencia de ejecución es `docs/documentacion/evidencias/sprint-01/continuacion/sprint01-next-3-cypress.txt`, commit `8997de8` del 06-10-2026 (11/11 en Chrome 154) [DOCUMENTADO]. Existe también `sprint01-next-4-vitest.txt` (sin commit, 06-10 20:17), pero no hay una ejecución de Cypress posterior.

### 3.f Cobertura

| Ámbito | Último valor | Fecha | Etiqueta |
|---|---|---|---|
| Backend PHP (`backend/api/test-results/clover.xml`, PCOV) | **96,0 %** de líneas (862/898, 71 archivos de `app/`) | 06-10-2026 21:35 | [VERIFICADO] leyendo el archivo existente (no se regeneró) |
| Backend en SonarQube | **0,0 %** en los dos análisis guardados | 1.º: `8997de8`; 2.º: `sprint01-next-4-sonar-summary.txt`, 06-10 20:17, sin commit | [VERIFICADO] leyendo los archivos: el informe Clover no llegó a importarse en ningún análisis |
| Frontend (Vitest) | **no encontrado**: sin configuración de cobertura ni carpeta `coverage/` | — | [VERIFICADO] |
| Python (pytest-cov) | `app.py` 100 % (39 sentencias) | 06-10-2026, medido en la sesión anterior | [DOCUMENTADO]; existe `python/api/.coverage`, pero no hay `.coveragerc` (el total incluye el archivo de pruebas) |

---

## 4. Sprints: plan contra realidad

**Fuentes leídas [VERIFICADO]:**
- `sprints-01-08/Plan-Sprints-01-08.json` (8 sprints con título, objetivo, dependencias, pendientes y criterios de terminado).
- Los 8 `CANVAS-Sprint-0N.md` y `CANVAS-Plan-Sprints-01-08.md`.
- `sprints-01-08/bdd/*.feature`, la matriz de trazabilidad y las adendas del docente.
- `CANVAS-Iteracion-00-Guia-Manual-TecnicoYa.md` e `iteracion-00/VALIDACION-DE-LA-ENTREGA.md`.

### 4.1 Tabla por iteración

**Criterio de avance real** (propio, explícito): 40 % pruebas Pest ejecutables aprobadas sobre las ejecutables planificadas; 20 % casos de Cypress, de carga o manuales con prueba sobre los planificados; 20 % pantallas de frontend v1 del sprint; 20 % controles de la DoD y las adendas (evidencia guardada, matriz actualizada, registro de alertas, Gate de SonarQube del sprint con cobertura, CI). El prototipo histórico (`#demo` y `/api/*`) no cuenta como avance, porque no cumple el contrato v1 ni el diccionario.

| It. | Objetivo (Plan JSON) | RF / HU | TC planificados (Pest / otros / híbrido) | Bloqueados o condicionados | Escenarios Gherkin | Pest hoy | Endpoints v1 | Pantallas v1 | Evidencias | Estado en la matriz | Avance real |
|---|---|---|---|---|---|---:|---:|---|---|---|---:|
| **I0** | Entorno compatible, aislamiento, salud, reportes | RNF de entorno (TC-I0 de la guía) | Sin TC numerados en la matriz | — | Casos de aceptación I0 en la guía §13 | 0 | `/api/health` histórico; **sin** `/api/v1/health` | — | `iteracion-00/VALIDACION-DE-LA-ENTREGA.md` (5-oct): instalación y arranque **NO EJECUTADOS** en esa validación | — | **≈55 %**: hay Docker MySQL de pruebas, Sanctum, Pest, Cypress, SonarQube local y PCOV. Faltan Reverb, salud v1, CI, servidor Linux y ramas por integrante |
| **S1** | Acceso por identidad y permisos reales sobre API y MySQL, perfiles mínimos y catálogo reproducible | RF-28, RF-33, RF-C01, RF-C06, RNF-08 · HU-S01-01..06 | 13 (10 / 3 / 0) | 0 | 12 | 11 IDs (10 + TC-012) y 3 `S01-SEC-ADMIN` | 7 (auth ×3, me ×2, catálogo ×2) + csrf-cookie | `AccountApp` (registro, login, perfil) y `Catalog` | `evidencias/sprint-01/` (grupos a–e en rojo y verde, Cypress 11/11, SonarQube) | 13 APROBADO | **≈90 %**: Pest 10/10, Cypress 3/3, frontend sí, DoD parcial (Gate sin cobertura, sin CI) |
| **S2** | Oferta visible; administrador y técnicos preparan información verificable | RF-04, 05, 07, 30, 33, RF-C01, C02, C04, C06, C08, C09 · HU-S02-01..07 | 17 (13 / 4 / 0) | 1: TC-022 (P17) | 14 | 12 | 10 | **ninguna** (solo la demo) | `evidencias/sprint-02/` (rojo y verde) | 17 NO EJECUTADO (desactualizada) | **≈45 %**: Pest 12/12, Cypress 0/4, frontend 0, DoD solo evidencia |
| **S3** | Describir, revisar y enviar la necesidad; consultar técnicos | RF-01, 02, 03, 04, 33, RF-C02, C06 · HU-S03-01..06 | 24 (19 / 5 / 0) | 3 bloqueados: TC-122 (P10), TC-123 (P17), TC-130 (P17). TC-033 no se puede probar todavía (necesita `ratings` de S5/S6, P07 y P15) | 12 | 15 | 8 | **ninguna** | `evidencias/sprint-03/` (rojo, verde y prueba de no trivialidad) | 21 NO EJECUTADO, 3 BLOQUEADO | **≈42 %**: Pest 15/16, Cypress 0/5, frontend 0, DoD solo evidencia |
| **S4** | Solicitud → ofertas trazables y asignación elegida | RF-05..18, RF-29, RNF-07 · HU-S04-01..10 | 23 (21 / 1 / 1: TC-056) | 1 bloqueado: TC-140 (P15). 4 condicionados: TC-044 (P15), TC-048 (P12), TC-054 (P12), TC-133 (P05/P16) | 20 | 0 | 0 | ninguna | ninguna | 22 NO EJECUTADO, 1 BLOQUEADO | **0 %** (el matching existe solo en el prototipo histórico y en Python) |
| **S5** | Ejecutar y seguir cada atención hasta su reporte | RF-19..22, RF-33 · HU-S05-01..07 | 14 (12 / 2 / 0) | 3: TC-065 (P13), TC-069 (P14), TC-071 (P14) | 14 | 0 | 0 | ninguna | ninguna | 14 NO EJECUTADO | **0 %** |
| **S6** | Evaluación versionada, revisión e historial | RF-23..27, RF-33 · HU-S06-01..07 | 14 (13 / 1 / 0) | 5: TC-075 (P23), TC-077 (P12/P13), TC-079 (P07), TC-081 (P07/P17), TC-083 (P07) | 14 | 0 | 0 | ninguna | ninguna | 14 NO EJECUTADO | **0 %** |
| **S7** | Supervisión, gobierno de parámetros y accesos | RF-30, 31, 33, RF-C03, C05, C07, C12 · HU-S07-01..07 | 14 (14 / 0 / 0) | 5: TC-087 (P21), TC-089 (P11/P14), TC-091 (P18), TC-095 (P19), TC-097 (P21) | 14 | 0 | 0 | ninguna | ninguna | 14 NO EJECUTADO | **0 %** |
| **S8** | MVP desplegable con simulación económica y controles revisados | RF-29, 32, 33, RF-C07, C09, C11 y RNF-01..14 · HU-S08-01..09 | 21 (9 / 12 / 0) | 4: TC-101 (P01/P02/P16), TC-103 (P02/P21), TC-105 (P12), TC-138 (reglas de capas) | 18 | 0 | 0 | ninguna | ninguna | 21 NO EJECUTADO | **0 %** |

**Totales [VERIFICADO]:**
- **Casos:** 140 planificados = 111 Pest + 28 de otras herramientas + 1 híbrido.
- **Bloqueados o condicionados:** 4 bloqueados y 22 condicionados, con lo que quedan 85 casos Pest ejecutables (84 en la práctica, porque TC-033 depende de las calificaciones).
- **Gherkin:** 118 escenarios en los `.feature` de los sprints, más 3 del Módulo A en `plan-pruebas-v2/modulo-a/Modulo-A-criticos.feature`.
- **Implementado hoy:** 3 de 8 sprints con backend v1 (S1 a S3) y 1 de 8 con frontend v1 (S1).

### 4.2 Capacidad de pruebas legítimas

- **IDs TC posibles hoy por sprint:** los casos Pest ejecutables de la matriz, es decir, sin bloqueados ni condicionados.
- **Controles transversales legítimos de las adendas** (VAL-02, AUTH-01, CRUD-02 a nivel de API): **estimación propia**. Se cuentan los recursos escribibles de la tabla §9.2 del plan de pruebas y solo las familias que **no** cubre ya un TC del mismo recurso. Las familias de interfaz (VAL-01, CRUD-01/03, NET-01) son de Cypress y no se suman a Pest. No se cuentan variantes del mismo ID ni repeticiones.

| Sprint | Pest ejecutables (IDs) | Pest aprobados hoy (última ejecución verde) | Controles transversales legítimos adicionales (estimación) | Techo legítimo de pruebas Pest | Brecha H1 (60 en total, acumulado) | Brecha H2 (60 por sprint) |
|---|---:|---:|---:|---:|---:|---:|
| S1 | 10 | 10 | ≈2 (validación de login, sesión inactiva) | ≈12 | — | 48 |
| S2 | 12 | 12 | ≈4 (AUTH-01 catálogo, comunicados y revisión sin permiso; VAL-02 portafolio) | ≈16 | — | 44 |
| S3 | 16 (15 practicables) | 15 | ≈2 (envío sin clave, edición con versión obsoleta) | ≈17 | — | 43 |
| S4 | 16 | 0 | ≈4 | ≈20 | — | 40 |
| S5 | 9 | 0 | ≈5 | ≈14 | — | 46 |
| S6 | 8 | 0 | ≈4 | ≈12 | — | 48 |
| S7 | 9 | 0 | ≈5 | ≈14 | — | 46 |
| S8 | 5 | 0 | ≈3 | ≈8 | — | 52 |
| **Total** | **85** | **37** | **≈29** | **≈113** | **23 por cubrir hoy** | **≈367 sin cubrir de 480** |

**Lectura H1 (al menos 60 pruebas TC aprobadas en total):** alcanzable con casos legítimos. Hoy hay 37; con los ejecutables de S4 (16) y S5 (9) se llegaría a unos 62 al cerrar S5. Si se resuelven P12 y P15, entran TC-044, 048, 054 y 140 en S4 y la meta podría alcanzarse en S4.

**Lectura H2 (60 por sprint, 480 en total):** **no alcanzable de forma legítima**. El techo estimado es de unas 113 pruebas Pest en todo el proyecto (unas 14 por sprint). Llegar a 60 por sprint exigiría unas 367 pruebas adicionales sin requisito ni riesgo que las respalde, es decir, relleno. No se recomienda; si el docente exige H2, hay que confirmar si cuenta Cypress, carga y pruebas manuales, o si la cifra se refiere al proyecto.

### 4.3 Plan del Word «Capítulos 1 al 8» frente al plan de 8 sprints [VERIFICADO leyendo el .docx]

El Word (`C:\Users\<usuario>\Downloads\Proyecto_TecnicoYa_Capitulos_1_al_8.docx`, 06-10 15:42), Tabla 5.4, propone **I0 + cinco iteraciones (S01 a S05)** con **su propia numeración de RF (RF-01 a RF-34)**:

| Iteración del Word | Contenido (Word) | RF (numeración del Word) | Situación que afirma el Word | Correspondencia aproximada con el plan de 8 sprints |
|---|---|---|---|---|
| I0 Configuración | Repositorio, Docker Compose, migraciones, pipeline | RNF-13, 15, 16 | «Presente en el código» | I0 |
| S01 Acceso y perfiles | Registro, sesión, roles, perfil, habilitación, disponibilidad | RF-01 a RF-10 | «Funciones presentes; registro formal pendiente» | S1 + S2 |
| S02 Solicitud y matching | Formulario, validación, filtro, ranking, primera ronda | RF-11 a RF-16 | Ídem | S3 + parte de S4 |
| S03 Ofertas y ejecución | Respuesta, confirmación, reasignación, espera, cancelación, inicio y cierre | RF-17 a RF-25 | Ídem | resto de S4 + S5 |
| S04 Calificación y administración | Calificación, historial, supervisión, control de acceso | RF-26 a RF-32 | Ídem | S6 + S7 |
| S05 Incidencias y calidad | Incidencias, HTTPS, E2E, mediciones no funcionales | RF-33, RF-34, RNF-01..06, 10, 14 | «Por desarrollar» | S8 |

Las «funciones presentes» del Word se refieren al **prototipo histórico** (`/api/actions`, `Marketplace`, demo `localStorage`, PostgreSQL), no a la API v1 construida en los Sprints 1 a 3. Los dos planes no son compatibles uno a uno: difieren en numeración de RF, módulos A–F y orden. Hay que decidir cuál es el oficial (ver Sección 5).

---

## 5. Documentos y PDF integrados

### 5.a Inventario documental del repositorio [VERIFICADO con `git ls-files`]

| Carpeta | Contenido (tipos) | Propósito |
|---|---|---|
| `docs/documentacion/` (raíz) | 17 PDF + `README.md` | Colección v2.0 del 29-09: análisis, backlog, diccionario PostgreSQL, diseño, iteraciones I01–I10 |
| `docs/documentacion/editables/` | 49 md, 11 feature, 11 csv, 9 json, 7 php, 7 js, 5 mmd, 4 py, 3 svg, 3 puml, otros | Fuentes vigentes de la línea v2/MySQL: CANVAS de análisis, diseño, diccionario, reglas de negocio y de programación, estructura, backlog, I0, Sprint 1 manual, sprints 01–08 (+ BDD), plan de pruebas v2, Módulo A y adendas del docente |
| `docs/documentacion/fuentes/` | 35 PDF, 2 json, 1 docx | `articulos/` (32 PDF + `manifest.json`) y otras fuentes |
| `docs/documentacion/evidencias/` | 20 txt, 15 md, 6 json | Ejecuciones reales: `sprint-01/` (grupos a–e, continuación, SonarQube), `sprint-02/`, `sprint-03/`, `v2/`, `revision-2026-09-22/` |
| `docs/documentacion/informe-final/` | 3 json, 2 xml, 1 md, 1 docx | Contenido editable del informe y evidencias del 30-09 |
| `docs/documentacion/historico/` | 16 PDF, 2 md, 1 json | Versión previa (v1, 29-09) |
| `docs/documentacion/trazabilidad/` | 5 csv | Matrices RF/RNF y de artículos (`v2/articulos.csv`) |
| `docs/documentacion/plan-de-pruebas/` | 2 PDF | Plan de pruebas previo |
| `docs/documentacion/sprints/S01..S04/` | 4 md | Carpetas de sprint antiguas (plan de 4-5 iteraciones del Word) |
| `docs/documentacion/estado-del-arte/`, `diseno-tecnico/` | 1 md cada una | Estado del arte y diseño |
| `docs/legacy/` | SQL, JS (Express), Python (asistente) | Implementaciones anteriores conservadas |
| `docs/documentacion/analisis-estado/` | este informe | Nuevo (único archivo creado en esta auditoría) |

**Artículos (`fuentes/articulos/manifest.json`) [VERIFICADO]:**
- **32 PDF y 30 distintos:** A04 duplica a A03 y A16 duplica a A15. El manifiesto solo guarda id, ruta, sha256, páginas y caracteres; los títulos y autores están en `trazabilidad/v2/articulos.csv` (30 filas).
- **Citados con autor y año** (búsqueda del primer apellido seguido del año): **14 de 30** en los `.md` del repositorio y **18 de 30** en el Word de capítulos 1 al 8. Los Markdown nuevos suelen citar por código (A27, A30), así que la cifra de los `.md` es un mínimo. Sin cita por autor y año en ninguno de los dos: A02, A03 (no figura el año), A05, A07, A08, A10, A11, A19 y A20.
- **Criterio temático** (por palabras del título en `articulos.csv`):
  - **IA y desarrollo de software:** solo **A21**, Peng et al. (2023), «The Impact of AI on Developer Productivity». A22 (Ibrahim y Zaki, 2026, recomendaciones de proveedores de IA) y A24 (Raj y Koushik, 2025, optimización de servicios con IA) tratan de IA pero no de desarrollo de software.
  - **Scrum:** **ninguno.**
  - **UML:** **ninguno por título.** La adenda P7 [DOCUMENTADO] identifica casos de uso en A27 (Rathod et al., 2025) y componentes en la tesis A30 (Bejarano Gavilanes, 2022).
  - Esto confirma el pendiente de la adenda P8: **no hay un artículo de IA + Scrum** en el corpus.

### 5.b Documentos externos buscados [VERIFICADO por búsqueda de nombres en el repositorio, Descargas, Documentos y Escritorio; no hay carpetas OneDrive]

| Documento | Ruta encontrada | Fecha de modificación | ¿Reflejado en el código? |
|---|---|---|---|
| `Proyecto_TecnicoYa_Capitulos_1_al_8.docx` | `C:\Users\<usuario>\Downloads\Proyecto_TecnicoYa_Capitulos_1_al_8.docx` (+ `.pdf` del 06-10 16:49) | 2026-10-06 15:42 | **Parcial:** describe el **prototipo histórico** (PostgreSQL, token propio, FastAPI, `/api/actions`). No refleja la API v1, Sanctum, MySQL ni los Sprints 1 a 3 |
| «Proyecto final - TecnicosYa» | 6 copias PDF en `Downloads` (`Proyecto final - TecnicosYa.docx.pdf` y `(1)`…`(5)`); la más reciente es `(5)`. El `.docx` original **no se encontró** | 2026-10-04 00:09 (la más reciente) | **Parcial:** declara Laravel, React y **MySQL** y RF-01..33, igual que el plan v2. Contiene datos personales (códigos de estudiante) **[OCULTO]** |
| `Plantilla_Estructura_de_proyecto_final` | `Downloads\Plantilla Estructura de proyecto final (4).docx`, `(4) (1).docx`, `(4) (2).docx` y `.docx.pdf` | 2026-10-05 22:29 (`(4) (2)`) | No aplica al código; define 14 capítulos (Sección 6) |
| `INDICACIONES_FINALES` | **no encontrado** (tampoco «Indicaciones») | — | — |
| `Formatos_del_1_al_6` | `Downloads\Formatos del 1 al 6.pdf` (y `Formatos_03.pdf`) | 2026-09-07 21:39 | Indirecto: análisis inicial (AS-IS, BPMN, TO-BE, SLA 10 min) que alimentó el análisis del MVP |
| `Formato_09` (alcance) | `Downloads\Formato 09 Alcance del proyecto software.docx.pdf` y `(1).pdf` | 2026-10-03 23:52 | **Sí:** Laravel, React y MySQL, RF-01..33 y RNF-01..14, igual que la v1 |
| Guía de Práctica N.° 11 (arquitectura conceptual) | `Downloads\GUÍA PRÁCTICA 11.docx`, `Guía de Práctica N° 11.pdf` y `(1).pdf` | 2026-10-03 22:55 (PDF), 2026-09-27 (docx) | Documental (capítulo 6 del Word y adenda P2); no aplica al código |
| `Resumen_de_los_PROMPTS` | `Downloads\Resumen de los PROMPTS.pdf` y `(1).pdf` | 2026-10-04 17:03 | **Sí** en la línea v2: prescribe Laravel, React, **MySQL**, Docker, Cypress, DevSecOps y BDD, y una secuencia de 11 prompts (análisis → diseño → diccionario → E-R → flujo → UML → iteraciones Scrum → orden → estructura → avance I0) que coincide con los CANVAS de `editables/` |

Lectura de archivos: los `.docx` se leyeron con `zipfile` y XML de la biblioteca estándar de Python (no están instalados `python-docx` ni `pypdf`); los PDF, con `pdftotext` de Git for Windows. No se instaló nada.

### 5.c Word «Capítulos 1 al 8» [VERIFICADO leyendo `word/document.xml`]

- **Estructura:** portada, capítulos 1 a 8 desarrollados (información general; contexto y problema; procesos AS-IS/TO-BE con P01–P15; requerimientos, actores y casos de uso; planificación y plan de calidad; diseño; arquitectura tecnológica; desarrollo). Los capítulos 9 y 10 aparecen solo como **texto de plantilla** («Debe explicar…», «Ejemplo: rama main, develop…»).
- **Requerimientos:** **RF-01 a RF-34** y **RNF-01 a RNF-26**, con requerimientos detallados RF-xx.y y 15 casos de uso (CU-xx).
- **Iteraciones:** I0 más S01 a S05 (Tabla 5.4; ver 4.3).
- **Casos de prueba:** IDs **TC-01** en adelante (dos dígitos) y `TC-RF-26`. Meta de «al menos 72 casos funcionales y 26 no funcionales» (98 en total, Tabla 5.15: 12/10/12/18/10/10 por módulo más 26 RNF).
- **Tecnología declarada:** React + Vite, Laravel, servicio de ranking **FastAPI**, **PostgreSQL 16** (despliegue) y **SQLite en memoria** (pruebas), Docker Compose, GitLab del laboratorio y SonarQube. Autenticación con tokens propios con hash.
- **Resultados de pruebas que afirma:** «Vitest 33 de 33, PHPUnit 19 de 19 (157 aserciones), pytest 3 de 3 y cobertura de Python de 100 %» y, más adelante, «35 pruebas en Vitest, 21 en PHPUnit y 4 en pytest».

### 5.d Discrepancias entre documentos y código

| # | Tema | Qué dice cada fuente | Fuente más reciente | Decisión necesaria |
|---|---|---|---|---|
| D1 | **Motor de base de datos** | PostgreSQL: Word (06-10), PDF v2 (29-09), `infrastructure/docker-compose.yml`, `.devops/project.yml`, `.env.example`, valor por defecto de `config/database.php`. MySQL: Formato 09 (03-10), PROMPTS (04-10), Proyecto final (04-10), diccionario y plan v2 (05-10), `phpunit.xml` y `docker-compose.testing.yml` (06-10). SQLite: `.env` local | Empate de fechas (06-10): el Word dice PostgreSQL; el código nuevo y las pruebas, MySQL | Fijar un motor oficial y alinear compose, `.env.example`, configuración y Word |
| D2 | **Numeración de RF** | Formato 09, análisis y matriz: RF-01..33 y RNF-01..14 (módulo A = solicitud). Word: RF-01..34 y RNF-01..26 (módulo A = acceso y cuentas) | Word (06-10) frente a matriz (05-10) | Elegir una numeración; si se mantiene la del Word, rehacer la trazabilidad de 140 TC |
| D3 | **Plan de sprints** | `sprints-01-08`: I0 + 8 sprints. Word: I0 + S01..S05. `docs/documentacion/sprints/S01..S04`: 4 carpetas antiguas | Word (06-10), aunque describe el prototipo | Declarar el plan oficial y retirar o archivar el otro |
| D4 | **Formato de IDs de caso** | Matriz y Pest: TC-001..TC-140 (3 dígitos). Word: TC-01.. y TC-RF-26 (2 dígitos). Plan: «TC-002 equivale a TC-02» | Matriz (06-10) | Unificar el formato en el Word |
| D5 | **Meta de pruebas** | Plan v2: ≥60 IDs Pest aprobados. Adenda o Word: ≥72 funcionales + 26 RNF = 98 casos. Usuario: «60» (sin precisar si es total o por sprint) | Word (06-10) | Precisar H1 o H2 (Sección 4.2) y si Cypress y manuales cuentan |
| D6 | **Estados de la solicitud** | v1 (diccionario): registered, sent, pending_availability, assigned, in_progress, completed, closed, unrated, cancelled, expired. Prototipo (`Marketplace.php`): searching, pending, proposed, confirmed, in_progress, completed, cancelled, expired, pending_availability | Diccionario (05-10) | P22 (transición al enviar) y migración del prototipo |
| D7 | **Parámetros de matching** | Pesos 35/20/30/15 coinciden en `rules.json`, reglas formalizadas y Word. Pero `rules.json` fija `maxExperienceYears = 10` y `secondaryZoneProximity = 0.5`, mientras las reglas formalizadas dicen que Aref y Dref **no tienen valor aprobado (P15)** | Reglas formalizadas (05-10) | Resolver P15 o retirar esos valores de `rules.json` |
| D8 | **Servicio de matching** | Word y PDF v2: FastAPI (Python) con fallback en PHP. Diseño técnico v2: no menciona Python (0 coincidencias). v1: sin matching (S4) | Diseño v2 (05-10) | Decidir si el matching v1 será Laravel o Python |
| D9 | **Autenticación** | Word y prototipo: token Bearer propio (`api_tokens`, `firebase/php-jwt`). Guía S1, reglas de programación y v1: Sanctum con cookie y CSRF | v1 (06-10) | Retirar el token histórico o documentar la convivencia |
| D10 | **Pipeline** | `.gitlab-ci.yml`, `CI-CD.md` y Word: GitLab del laboratorio (`root/laboratorio-devops`, «gitlabcontinental»). Remoto real: GitHub `grupopruebas41/TecnicoYA-Huancayo`, sin workflows. No hay evidencia de ejecución en ninguno | — | Elegir la plataforma de CI y configurarla con Pest, Vitest, Cypress y SonarQube |
| D11 | **Cifras de pruebas** | Word: Vitest 35, PHPUnit 21, pytest 4 (antes 33/19/3). INFORME S1: Pest 34–35. Medido: Vitest 38 (hoy), Pest 62 con 714 aserciones (última ejecución verde, 06-10), pytest 4 (hoy) | Medición propia | Actualizar el Word (capítulos 8 y 11–13) |
| D12 | **Repositorio** | Word 9.1.1: «Repositorio GitHub» (plantilla sin URL). Real: `grupopruebas41/TecnicoYA-Huancayo` (desde el 06-10 19:44); antes `James091104/Software-TecnicoYa-Huancayo` | git (06-10) | Registrar la URL oficial y retirar el remoto antiguo de la documentación |
| D13 | **Frontend** | Word describe las pantallas del prototipo. v1: solo cuenta, perfil y catálogo; los Sprints 2 y 3 no tienen interfaz | Código (06-10) | Planificar las pantallas v1 de S2 y S3 |

---

## 6. Indicaciones del docente

**Fuentes:** `INDICACIONES_FINALES` **no se encontró**. El checklist se arma con la Plantilla de estructura (`Plantilla Estructura de proyecto final (4) (2).docx`, 05-10, 14 capítulos), las adendas del docente (`editables/adendas-docente-2026-10-05/`) y el Resumen de PROMPTS. Estados: **Cumple**, **Parcial**, **Falta** o **No verificable**.

### 6.1 Por capítulo de la plantilla

| Cap. | Título (plantilla) | Estado | Evidencia |
|---|---|---|---|
| 1 | Información general del proyecto | **Cumple** | Word cap. 1 |
| 2 | Contexto organizacional y análisis del problema | **Cumple** | Word cap. 2; `CANVAS-Analisis-MVP` |
| 3 | Análisis de procesos (AS-IS / TO-BE) | **Cumple** | Word cap. 3 (P01–P15); `proceso-principal.bpmn` |
| 4 | Análisis de requerimientos | **Parcial** | Word cap. 4 con RF-01..34 y RNF-01..26, que no coinciden con Formato 09, la matriz ni el código (D2) |
| 5 | Planificación y plan de calidad | **Parcial** | Word cap. 5 (I0 + S01..S05 y 98 casos) frente a `PLAN-DE-PRUEBAS-TecnicoYa-v2.md` (8 sprints y 140 TC) (D3, D5) |
| 6 | Diseño del sistema | **Parcial** | Word cap. 6 (PostgreSQL) frente a `CANVAS-Diseno-Tecnico-MVP` y el diccionario MySQL (D1) |
| 7 | Arquitectura tecnológica | **Parcial** | Word cap. 7 describe el prototipo (token, FastAPI, PostgreSQL), no la v1 |
| 8 | Desarrollo del sistema | **Parcial** | Word cap. 8 (prototipo; cifras de pruebas desactualizadas, D11). Repositorio: S1–S3 v1 con evidencias |
| 9 | Control de versiones y repositorio | **Falta** en el documento | Word: solo texto de plantilla. Repositorio: GitHub `grupopruebas41/TecnicoYA-Huancayo`, una rama y un autor |
| 10 | Dockerización y despliegue | **Falta** en el documento / **Parcial** en el repositorio | Word: plantilla. Repositorio: `infrastructure/docker-compose.yml` (prototipo PostgreSQL), `docker-compose.testing.yml`, `docker-compose.quality.yml`, Dockerfiles |
| 11 | Estrategia de pruebas | **Falta** en el documento / **Cumple** en el repositorio | `PLAN-DE-PRUEBAS-TecnicoYa-v2.md`, `CATALOGO-TC.md`, matriz |
| 12 | Automatización de pruebas | **Falta** en el documento / **Parcial** en el repositorio | Pest 62, Vitest 38, pytest 4, Cypress 11 (solo S1); sin CI |
| 13 | Métricas de calidad | **Falta** en el documento / **Parcial** en el repositorio | Clover 96 %; SonarQube con 0 % de cobertura importada; registro de alertas solo para S1 |
| 14 | Implementación y monitoreo | **Falta** | Sin despliegue en servidor ni monitoreo |
| — | Conclusiones, recomendaciones, referencias (APA 7), anexos | **Cumple** en el Word | Referencias con autor, año, título y DOI o URL |

### 6.2 Requisitos transversales

| Requisito | Estado | Evidencia |
|---|---|---|
| SonarQube instalado y con reporte | **Parcial** | Instalado (`infrastructure/docker-compose.quality.yml`, `QUALITY.md`). Dos análisis, **ambos sobre `8997de8`** (Gate OK sin condiciones, cobertura 0,0 %, 7 bugs, 107 code smells). Sin análisis de los Sprints 2 y 3 |
| Alertas en cada CRUD | **Parcial** | `plan-pruebas-v2/Plantilla-Registro-Alertas.csv`: 19 alertas de S1 (12 aprobadas). S2 y S3 sin registro y sin pantallas |
| Carpeta de avance por integrante (`docs/avances/<integrante>/`) | **Falta** | No existe `docs/avances` |
| Ramas por integrante (`feature/<integrante>/<modulo>`) | **Falta** | Solo `main`; un único autor git |
| Primera versión desplegable | **Parcial** | `infrastructure/docker-compose.yml` despliega el **prototipo** (PostgreSQL). La v1 (MySQL/Sanctum) no tiene compose de despliegue |
| Despliegue en servidor | **Falta / No verificable** | Sin evidencia de servidor ni URL |
| Al menos 60 pruebas | **Depende de la lectura** | IDs TC Pest que cuentan para la meta: **37/60** (Falta). Todas las pruebas automatizadas: Pest 62 + Vitest 38 + pytest 4 + Cypress 11 = **115** (Cumpliría si cuentan todas). Por sprint (H2): **Falta** en todos |
| Producción hacia la semana 12 | **No verificable** | No se encontró calendario con fechas (CANVAS-Plan §15.2: «fechas no aprobadas») |
| Citas APA 7 | **Cumple** en el Word / **Parcial** en el repositorio | Word: referencias APA 7. `.md`: citas por código (A27…) y autor-año en parte |
| Artículo de IA y Scrum | **Falta** | Ningún artículo del corpus trata Scrum (5.a); adenda P8 pendiente |
| Docker | **Parcial** | Compose del prototipo, de pruebas y de calidad. Docker Desktop **apagado** al auditar |
| Pipeline | **Falta** | `.gitlab-ci.yml` solo incluye el pipeline del laboratorio; remoto en GitHub sin workflows; sin evidencia de ejecución |

---

## 7. Riesgos y bloqueos

### 7.1 Pendientes de decisión y TC que bloquean [VERIFICADO en la matriz]

`*` = BLOQUEADO; el resto, condicionado.

| Pendiente | Tema (análisis del MVP) | TC afectados |
|---|---|---|
| P01 | Moneda | TC-101 |
| P02 | Alcance de pagos y comprobante | TC-101, TC-103 |
| P03 | Distritos de cobertura | — (las pruebas usan distritos sintéticos) |
| P04 | Responsable del backlog | — |
| P05 | Margen de atención inmediata | TC-133 |
| P06 | Máximo de reprogramaciones | — |
| P07 | Apelaciones y promedio real | TC-079, TC-081, TC-083 (y TC-033, por su filtro de calificación) |
| P08 | Privacidad, retención y cierre de cuenta | — (RF-C10 sin caso) |
| P09 | Muestra y ventana de demostración | TC-115, TC-116, TC-118 |
| P10 | Solicitudes activas por cliente | TC-122* |
| P11 | Elección de candidatos y asignación | TC-089 |
| P12 | Relojes, rondas y notificaciones | TC-048, TC-054, TC-077, TC-105 |
| P13 | Reglas de dos técnicos | TC-065, TC-077 |
| P14 | Cancelación y reprogramación | TC-069, TC-071, TC-089 |
| P15 | Normalización de matching, sin historial, empate | TC-044, TC-140* (y TC-033) |
| P16 | Tarifas, métodos y franjas | TC-101, TC-114, TC-133 |
| P17 | Política de contenido y archivos | TC-022, TC-081, TC-123*, TC-130* |
| P18 | Sanciones | TC-091 |
| P19 | Vigencia de cambios administrativos | TC-095 |
| P20 | Persona con varios roles | — |
| P21 | Protocolo de calidad, carga y reportes | TC-087, 097, 103, 111, 113, 114, 115, 116, 118, 136 |
| P22 | Estados iniciales y verificación | — (afecta al nombre del estado tras el envío, TC-037/126, y al rechazo de verificación) |
| P23 | Anclaje de la edición de calificación | TC-075 |
| (sin Pxx) | Reglas de capas por fijar en el diseño | TC-138 |
| (sin Pxx) | Nombres de permisos `announcements.manage` y `technicians.verify` (propuestos) | TC-018, TC-019 |

### 7.2 Seguridad

| Hallazgo | Ruta y línea | Valor | Valoración |
|---|---|---|---|
| **Correo institucional personal publicado en GitHub** (114 apariciones, según la sesión anterior) | `docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json` (commit `d361c63`) | [OCULTO] (archivo no abierto) | **Alto (privacidad):** está en el historial publicado; borrarlo del árbol no lo saca del historial |
| Clave de aplicación en configuración de pruebas | `backend/api/phpunit.xml:10` | [OCULTO] | Bajo: es sintética (32 bytes de un único carácter repetido) y solo para pruebas |
| Correo en una prueba de frontend | `frontend/web/src/access.test.jsx:14` | [OCULTO] | Bajo: dominio de prueba `test.pe` |
| Códigos de estudiante en un PDF externo | `Downloads\Proyecto final - TecnicosYa.docx (5).pdf` (portada) | [OCULTO] | Fuera del repositorio; no copiar a la documentación pública |
| Secretos reales | `.env`, `.env.testing`, `infrastructure/.env.quality.local` | no abiertos | Ignorados por git (`.gitignore`) [DOCUMENTADO en sesiones previas] |

**Auditorías de dependencias [VERIFICADO, solo conteos]:**

| Auditoría | Total | Por severidad |
|---|---:|---|
| `composer audit` (backend/api) | 3 avisos en 2 paquetes | alta 1, media 1, baja 1 (identificados antes: Laravel < 12.69 y `league/commonmark`) |
| `npm audit` (frontend/web) | 7 | crítica 2, alta 2, moderada 3 |
| `npm audit` (raíz) | 0 | — |

**SonarQube** (`sonar/gate.json`, `sonar/measures.json` y `sprint01-next-4-sonar-summary.txt`) [VERIFICADO leyendo los archivos]:
- Gate `OK` sin condiciones en los dos análisis, ambos sobre la revisión `8997de8`.
- Medidas: 2521 líneas, cobertura 0,0 %, 7 bugs (fiabilidad C), 107 code smells, 0 vulnerabilidades, 0 hotspots, duplicación 0,0 %, deuda 754 min, seguridad y mantenibilidad A.
- No es un análisis vigente: el código de los Sprints 2 y 3 no se analizó.

### 7.3 Entorno [VERIFICADO]

| Recurso | Estado |
|---|---|
| Disco C: | 52,1 GB libres de 236,3 GB |
| RAM | **0,5 GB libres de 7,8 GB** (Chrome, Opera, Defender y VS Code entre los mayores consumos). SonarQube pide unos 4 GB |
| Memoria virtual | 7,8 GB libres de 27,1 GB |
| Docker Desktop | **Detenido** (sin procesos; el canal del motor no existe). Impidió ejecutar Pest hoy |
| Contenedor `tecnicoya-mysql-test` | No disponible al estar Docker detenido |

### 7.4 Repositorio

- **Archivos sin commit:** `INFORME.md` modificado y 4 evidencias `sprint01-next-4-*` (segundo análisis de SonarQube y Vitest), del 06-10 a las 20:17.
- **Ramas sin publicar:** ninguna. `main` = `origin/main`; `codex/sprint-01` se renombró a `main` y se publicó.
- **Riesgo de proceso:** todo el trabajo está en una sola rama y con un único autor, aunque las adendas piden ramas y avances por integrante.
- **Riesgo técnico:** dos modelos de datos en paralelo (histórico y v1) y dos autenticaciones (token y Sanctum), sin plan de retiro del prototipo.

---

*Informe completo: secciones 1 a 7. Análisis de solo lectura; el único archivo creado es este. Incidencia registrada: se regeneró `backend/api/test-results/junit.xml` (artefacto ignorado por git) al ejecutar el contador.*
