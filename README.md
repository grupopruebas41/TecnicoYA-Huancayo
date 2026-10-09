# TécnicoYa Huancayo

Marketplace web que conecta hogares y MYPES de Huancayo con técnicos independientes verificados en cómputo, refrigeración comercial y electricidad. Proyecto del curso Pruebas y Calidad de Software, Universidad Continental.

Reglas de trabajo (personas y agentes): **[AGENTS.md](AGENTS.md)** · Plan vigente: **[PLAN-MAESTRO-v3](docs/documentacion/plan-pruebas-v3/PLAN-MAESTRO-v3.md)** · Decisiones: **[DECISIONES.md](docs/documentacion/sprints/DECISIONES.md)**

## Stack vigente

| Módulo | Tecnología | Función |
| --- | --- | --- |
| `frontend/web` | React 18 + Vite 5 | Pantallas v1 en `src/features/*`: cuenta, perfil, catálogo y las de los sprints siguientes |
| `backend/api` | Laravel 12, API `/api/v1`, sesión Sanctum (cookie + CSRF) | Identidad y permisos, catálogo, perfiles, solicitudes; módulos en `app/Modules/A..F` |
| Base de datos | MySQL 8.4 | Producto (`infrastructure/docker-compose.yml`) y pruebas (`backend/api/docker-compose.testing.yml`) |
| Pruebas | Pest 3, Vitest 2.1, Cypress 16.1, SonarQube | Meta: 60 o más IDs aprobados por sprint (36 Pest, 14 Cypress, 10 Vitest) |

## Histórico congelado

No se amplía; solo se mantienen sus pruebas como regresión hasta retirarlo cuando las pantallas v1 de S2 y S3 pasen sus pruebas Cypress (D-26):
- la API `/api/*` con token propio, salvo `GET /api/health`, que usa el arrancador E2E;
- la demo `localStorage` (`#demo` en la SPA);
- el servicio Python de matching (`python/api`) y `domain/rules.json`, sincronizado con `scripts/sync-rules.py`;
- PostgreSQL;
- el plan de 10 iteraciones de los PDF 08 a 17 de `docs/documentacion/`;
- la implementación anterior de `docs/legacy/`.

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
