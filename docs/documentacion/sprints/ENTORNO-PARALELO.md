# Entorno de pruebas en paralelo (slots A y B)

Esta guía permite que Claude Code (backend) y Codex (frontend) ejecuten pruebas al mismo tiempo sin compartir base de datos ni puertos.

## Los dos slots

| Slot | Quién | Carpeta | Base MySQL | API E2E | Web E2E |
|---|---|---|---|---|---|
| **A** (predeterminado) | Claude Code | `Software TecnicoYa-Huancayo` (principal) | `tecnicoya_testing` | 8001 | 5174 |
| **B** | Codex | `..\TecnicoYa-cx` (worktree hermano) | `tecnicoya_b_testing` | 8002 | 5175 |

Los dos slots comparten **un solo contenedor** (`tecnicoya-mysql-test`, `127.0.0.1:3306`) y el mismo usuario `tecnicoya_test`, para ahorrar memoria.

**Cómo se elige el slot** (gana la primera opción definida):

1. `--slot`, solo en el arrancador E2E.
2. La variable de entorno `TECNICOYA_SLOT`.
3. La clave `TECNICOYA_SLOT` de `backend/api/.env.testing`.
4. Si no hay ninguna, el slot `A`.

| Pieza | Qué hace con el slot |
|---|---|
| `backend/api/tests/bootstrap.php` | Fija `DB_DATABASE` según el slot, salvo que el proceso ya traiga `DB_DATABASE` en su entorno. `phpunit.xml` no fuerza ningún valor |
| `Tests\TestCase` | Sigue deteniendo la suite si la base no termina en `_testing` |
| `scripts/run-e2e.mjs` | Usa la base, los puertos, la cookie de sesión, CORS y Sanctum del slot |
| `Sprint01E2ESeeder` | Solo acepta `tecnicoya_testing` o `tecnicoya_b_testing` (y exige que terminen en `_testing`) |
| Bloqueos en `tmp/` de la carpeta principal (compartidos por los dos worktrees) | `e2e-slot-A.lock` y `e2e-slot-B.lock`: un slot no se usa dos veces a la vez. `e2e-cypress.lock`: **un solo Cypress a la vez en todo el PC**; el segundo espera hasta 30 min. Un bloqueo de un proceso muerto se retira solo |

## Pasos que haces tú (una sola vez)

### 1. Recrear el volumen de pruebas, para crear la base del slot B

El script `backend/api/database/testing/initdb/01-slot-b.sql` crea `tecnicoya_b_testing` y da permisos al usuario de pruebas. La imagen de MySQL **solo lo ejecuta al crear el volumen**. Los datos del volumen son desechables: las pruebas los recrean.

Desde la **carpeta principal**, `backend/api`:

```powershell
docker compose -f docker-compose.testing.yml --env-file .env.testing down -v
docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait
```

`down -v` borra el volumen `tecnicoya-mysql-test-data`. **Levanta el contenedor solo desde la carpeta principal.** Desde el worktree, la ruta del montaje de `initdb` es distinta y Compose recrearía el contenedor en mitad de las pruebas del otro slot.

### 2. `.env.testing` de la carpeta de Codex

Copia a mano `backend/api/.env.testing` de la carpeta principal a `..\TecnicoYa-cx\backend\api\.env.testing`. No se versiona y ningún agente lo copia. Después, en la copia:

| Clave | Qué hacer |
|---|---|
| `TECNICOYA_SLOT` | Agregarla o cambiarla a `B` |
| `DB_PASSWORD` | **No cambiarla**: es el mismo usuario MySQL para los dos slots |
| `DB_DATABASE` | No agregarla. Si existe, quitarla: la base la decide el slot |
| `APP_ENV`, `APP_DEBUG`, `CACHE_STORE`, `SESSION_DRIVER` | Sin cambios |

En la carpeta principal puedes agregar `TECNICOYA_SLOT=A`. Es opcional, porque A es el valor por defecto.

### 3. Dependencias de la carpeta de Codex

Los worktrees no comparten `vendor/` ni `node_modules/`.

```powershell
cd ..\TecnicoYa-cx\backend\api
composer install
cd ..\..\frontend\web
npm ci
```

`npm ci` instala exactamente lo que dice `package-lock.json`. No uses `npm audit fix`.

### 4. Rama del worktree

`..\TecnicoYa-cx` se creó en `main`, que todavía **no** tiene estos cambios. Cuando se integre el PR de `feature/pimentel/f-administracion/s00`, actualiza el worktree:

```powershell
cd ..\TecnicoYa-cx
git switch main
git pull
git switch -c feature/delgado/<modulo>/sNN
```

Codex nunca trabaja en `main` (ver AGENTS.md).

## Cómo arrancar cada slot

**Base de datos** (una vez, desde la carpeta principal): ver el paso 1, con `up -d --wait` y sin `-v`.

**Pest:**

```powershell
# Slot A (carpeta principal)
cd backend\api
C:\xampp\php\php.exe artisan test

# Slot B (..\TecnicoYa-cx, con TECNICOYA_SLOT=B en su .env.testing)
cd ..\TecnicoYa-cx\backend\api
C:\xampp\php\php.exe artisan test
```

**E2E (Cypress)** desde la raíz de cada carpeta:

```powershell
node scripts/run-e2e.mjs --sprint 01              # usa el slot de .env.testing
node scripts/run-e2e.mjs --sprint 01 --slot B     # fuerza el slot
node scripts/run-sprint01-e2e.mjs                 # envoltura de compatibilidad = --sprint 01
```

El arrancador:
1. Migra y siembra con `SprintNNE2ESeeder` la base del slot.
2. Levanta `artisan serve` y Vite en los puertos del slot.
3. Espera el bloqueo global y ejecuta las specs de `frontend/web/cypress/e2e/sprint-NN/`, con `cypress.e2e.config.js`.
4. Quita del entorno `ELECTRON_RUN_AS_NODE`, la causa del fallo de Cypress diagnosticado en `evidencias/sprint-01/continuacion/DIAGNOSTICO-E2E-2026-10-09.md`.

Para un sprint nuevo hacen falta `database/seeders/SprintNNE2ESeeder.php` y `frontend/web/cypress/e2e/sprint-NN/`.

**Reglas mientras corre el E2E de un slot:**
- No ejecutes Pest **de ese mismo slot**, porque comparten la base.
- Pest del otro slot sí puede correr.

## Comprobar el slot B (después de los pasos 1 a 4)

```powershell
cd ..\TecnicoYa-cx\backend\api
C:\xampp\php\php.exe artisan test                  # esperado: 62 passed
cd ..\..
node scripts/run-e2e.mjs --sprint 01 --slot B      # esperado: 11/11
```
