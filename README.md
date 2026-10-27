# TécnicoYa Huancayo

Marketplace web que conecta hogares y MYPES de Huancayo con técnicos independientes verificados en cómputo, refrigeración comercial y electricidad. Proyecto del curso Pruebas y Calidad de Software, Universidad Continental.

Reglas de trabajo (personas y agentes): **[AGENTS.md](AGENTS.md)** · Plan vigente: **[PLAN-MAESTRO-v3](docs/documentacion/plan-pruebas-v3/PLAN-MAESTRO-v3.md)** · Decisiones: **[DECISIONES.md](docs/documentacion/sprints/DECISIONES.md)**

## Stack vigente

| Módulo | Tecnología | Función |
| --- | --- | --- |
| `frontend/web` | React 18 + Vite 8 | Pantallas v1 en `src/features/*`: cuenta, perfil, catálogo y las de los sprints siguientes |
| `backend/api` | Laravel 12, API `/api/v1`, sesión Sanctum (cookie + CSRF) | Identidad y permisos, catálogo, perfiles, solicitudes; módulos en `app/Modules/A..F` |
| Base de datos | MySQL 8.4 | Producto (`infrastructure/docker-compose.yml`) y pruebas (`backend/api/docker-compose.testing.yml`) |
| Pruebas | Pest 3, Vitest 5, Cypress 16.1, SonarQube | Meta: 60 o más IDs aprobados por sprint (36 Pest, 14 Cypress, 10 Vitest) |

## Histórico retirado

Se retiró el 2026-10-16 (D-26 y D-62); queda en el historial de Git con la etiqueta `v0.3-antes-retiro-prototipo` (`cced99e`):
- la API `/api/*` con token propio, salvo `GET /api/health`, que usa el arrancador E2E;
- la demo `localStorage` (`#demo` en la SPA);
- el servicio Python de matching (`python/api`), `domain/rules.json` y `scripts/sync-rules.py`.

Histórico que no se sigue:
- PostgreSQL;
- el plan de 10 iteraciones de los PDF 08 a 17 de `docs/documentacion/`;
- la implementación anterior de `docs/legacy/`.

## Desarrollo local

Requisitos:
- PHP 8.2 (XAMPP, `C:\xampp\php\php.exe`) con Composer;
- Node 24;
- MySQL 8.4 con la base `tecnicoya` y el usuario `tecnicoya` de `backend/api/.env.example`.

El MySQL/MariaDB de XAMPP no se usa.

```powershell
# 1. Backend en http://127.0.0.1:3000
cd backend/api
copy .env.example .env           # completa DB_PASSWORD y las claves de Reverb; .env no se versiona
composer install
php artisan key:generate
php artisan migrate              # aplica las migraciones pendientes; repítelo tras integrar un PR con migraciones
php artisan db:seed              # permisos, catálogo y distritos (idempotente; no crea cuentas)
php artisan storage:link         # sirve las fotos públicas de /storage
php artisan serve --port=3000

# 2. Frontend en http://127.0.0.1:5173 (otra terminal). Vite reenvía /api y /sanctum al puerto 3000.
cd frontend/web
copy .env.example .env
npm ci
npm run dev
```

**Cuentas:**
- **Administrador:** `php artisan tecnicoya:provision-admin`.
- **Datos de demostración** (solo con `APP_ENV=local`):
  1. define `TECNICOYA_DEMO_PASSWORD` con 12 caracteres o más, en la terminal o en `.env`;
  2. ejecuta `php artisan db:seed --class=DemoSeeder`.

  Crea cuentas `demo-*@example.test` con esa contraseña:
  - administrador;
  - cliente hogar y cliente MYPE;
  - tres técnicos verificados y uno pendiente.

  También pone la foto de cada subcategoría y tres comunicados de ejemplo. Repetirlo no duplica nada.
- **Tiempo real, cola y avisos** (opcionales):
  - `php artisan reverb:start`;
  - `php artisan queue:work`;
  - `php artisan schedule:work`.

## Ejecutar las pruebas

Requisitos: PHP 8.2 (XAMPP, `C:\xampp\php\php.exe`) con Composer, Node 24, Docker Desktop y Chrome. Copia `backend/api/.env.testing.example` a `backend/api/.env.testing` y completa `DB_PASSWORD`; ese archivo no se versiona.

```powershell
# 1. Base de pruebas MySQL 8.4 (solo desde la carpeta principal; puerto 3306 libre)
cd backend/api
docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait

# 2. Backend: Pest (slot A, base tecnicoya_testing)
composer install
php artisan test                 # o: composer test:junit (reporte JUnit) · composer test:coverage

# 3. Frontend: Vitest y build
cd ..\..\frontend\web
npm ci
npm test
npm run build

# 4. E2E: Cypress contra Laravel + MySQL reales (desde la raíz)
cd ..\..
node scripts/run-e2e.mjs --sprint 01 --junit

# 5. Conteo de IDs por sprint y herramienta
node scripts/contar-pruebas-sprint.mjs
```

**Notas:**
- El arrancador E2E quita `ELECTRON_RUN_AS_NODE`, que heredan las terminales de VS Code; con ella activa, Cypress muere con `0xC000001D`.
- Para trabajar con dos agentes en paralelo (slots A y B) ver [ENTORNO-PARALELO.md](docs/documentacion/sprints/ENTORNO-PARALELO.md).

## Documentación

- Estado real del proyecto: [CONTEXTO-COMPLETO-2026-10-09](docs/documentacion/analisis-estado/CONTEXTO-COMPLETO-2026-10-09.md)
- Registro de defectos: [REGISTRO-DEFECTOS](docs/documentacion/calidad/REGISTRO-DEFECTOS.md)
- Especificación por sprint: `docs/documentacion/editables/sprints-01-08/CANVAS-Sprint-0N.md`
- Evidencias: `docs/documentacion/evidencias/sprint-NN/`
