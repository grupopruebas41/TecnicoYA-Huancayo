# Guía del código · Pimentel Chumbes, James · Base de datos, Docker, integración, calidad y panel del administrador

**Área:**
- base de datos: migraciones y seeders, con sus guardas;
- entornos Docker de prueba y de calidad;
- CI en GitHub Actions;
- SonarQube con su Quality Gate;
- pruebas de mutación;
- arrancador de las pruebas E2E y conteo de IDs por sprint;
- integración y cierre de cada sprint;
- en el adelanto del S7, el panel del administrador.

Esta guía explica, con el código real del repositorio, qué se construyó, dónde está cada pieza y cómo mostrarla.

---

## 1. Qué construyó el área, sprint por sprint

| Sprint | Qué se construyó |
|---|---|
| **S0 · Preparación** | Reglas comunes (`AGENTS.md`), dos entornos de prueba en paralelo (slots A y B sobre un solo MySQL), hoja de decisiones P01 a P23, registradas como D-10 a D-41, y el Quality Gate real de SonarQube. |
| **S1** | Cierre del sprint: regresión, mutación, SonarQube aprobado e informe. Se detectó y corrigió una mutación falsa en Windows (DEF-37). |
| **S2** | CI en GitHub Actions: Pest con cobertura, Vitest, build, `composer audit`, `npm audit` y el conteo de IDs. Cierre con DEF-40 y DEF-42 y el Gate aprobado. |
| **S3** | Parche de seguridad de dependencias (DEF-43). Guarda de los seeders E2E (DEF-44) y el cierre con el Gate aprobado a la primera. |
| **S4** | Retiro del prototipo antiguo (D-26 y D-62) con migración reversible y la guarda de comandos destructivos (DEF-45). Opción `--spec` del arrancador E2E. Cierre S4.6 con la tarea `replay` para el caso S04-TC-094, la mutación reproducible en Linux (DEF-46), `DemoSeeder` y la CI que no corre cuando solo cambian documentos. |
| **Adelanto del S7 · Panel del administrador** | Base común de paneles y Fase 1 (Inicio, perfil, tema y auditoría de accesos). Comunicados en carrusel con imagen o Genially. Usuarios (alta con enlace de activación, bloqueo, restablecer acceso y eliminar = anonimizar), menú agrupado, Estadísticas y Solicitudes en solo lectura. Reconfirmación de contraseña al crear un administrador. |

## 2. Pull requests del área

`gh pr list --state merged --search "head:feature/pimentel"` y los de documentación y cierre (`docs/pimentel/...`):

| PR | Título | Qué cambió |
|---|---|---|
| [#2](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/2) | ci(s00): entornos paralelos, reglas de agentes y deuda de backend | `AGENTS.md`, slots A y B, Docker de pruebas y limpieza inicial. |
| [#3](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/3) y [#4](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/4) | docs(s00): hoja de decisiones; registra las decisiones del equipo (D-10 a D-37) | Fuente única de decisiones: `DECISIONES.md`. |
| [#5](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/5) | ci(s00): Quality Gate real en SonarQube (paso 1.7) | `docker-compose.quality.yml`, la configuración del Gate y el exportador anónimo de hallazgos. |
| [#8](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/8) | S1.6: cierre del Sprint 1 | Regresión, mutación, SonarQube e informe del S1. |
| [#9](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/9) | ci(s02): pruebas, cobertura y auditorías en GitHub Actions | `.github/workflows/ci.yml` con backend, frontend y conteo. |
| [#13](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/13) | S2.6: cierre del Sprint 2 | DEF-40 y DEF-42, regresión, mutación, SonarQube e informe. |
| [#16](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/16) | fix(s03): parche de symfony/http-foundation y symfony/yaml (DEF-43) | Avisos de `composer audit` corregidos sin `-W`. |
| [#17](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/17) | S3.6: cierre del Sprint 3 | Guarda de los seeders E2E (DEF-44), regresión, mutación, SonarQube e informe. |
| [#19](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/19) | Retiro del prototipo: backend, Python e infraestructura y guarda de comandos destructivos (DEF-45) | Migración 000020, `DestructiveCommandGuard` y el retiro del servicio Python. |
| [#26](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/26) | docs(org): Claude Code asume el frontend mientras Codex no está disponible (D-72) | Reasignación registrada. |
| [#28](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/28) | chore(e2e): opción --spec del arrancador E2E | Permite correr un solo spec con los datos del sprint. |
| [#32](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/32) | feat(s07): Fase 1 del panel del administrador y base común de paneles | `PanelShell`, Inicio, perfil, tema y auditoría de accesos. |
| [#33](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/33) | feat(s07): comunicados en carrusel | Migración 000027, imágenes 3:1 y 3:2 (D-83), Genially y orden por audiencia. Ajuste posterior: editar, restaurar y eliminar (D-84). |
| [#34](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/34) | feat(s07): usuarios, menú agrupado, estadísticas, solicitudes e Inicio | Migración 000028, `ManageUsers`, `AdminStatistics`, `AdminRequests` y sus pantallas. |
| [#35](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/35) | feat(s07): reconfirmar la contraseña al crear un administrador (D-85) | `current_password` con un límite de 5 fallos cada 15 minutos. |
| [#36](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/36) | chore(s04): cierre del Sprint 4 (S4.6) | Tarea `replay` (S04-TC-094), D-86, mutación en Linux (DEF-46), `DemoSeeder`, README y CI que no corre con solo documentos. |

## 3. Archivos clave

| # | Ruta | Para qué sirve |
|---|---|---|
| 1 | `backend/api/database/migrations/` (28 migraciones) | Esquema de la base MySQL, versionado y reversible. |
| 2 | `backend/api/docker-compose.testing.yml` | MySQL 8.4 de pruebas con los dos slots. |
| 3 | `backend/api/database/seeders/E2EDatabaseGuard.php` | Impide sembrar datos de prueba fuera de un slot `_testing`. |
| 4 | `backend/api/app/Shared/Database/DestructiveCommandGuard.php` | Impide `migrate:fresh` o `db:seed` sobre una base que no sea de pruebas. |
| 5 | `backend/api/database/seeders/DemoSeeder.php` | Datos de demostración solo para desarrollo. |
| 6 | `scripts/run-e2e.mjs` | Arrancador E2E: base del slot, API, Vite, Reverb y Cypress, con bloqueos. |
| 7 | `scripts/contar-pruebas-sprint.mjs` | Cuenta los IDs aprobados por sprint y herramienta y comprueba la meta. |
| 8 | `.github/workflows/ci.yml` | CI: cambios, backend, frontend y conteo. |
| 9 | `scripts/mutacion.sh` y `.github/workflows/mutacion.yml` | Mutación reproducible en Linux con control negativo. |
| 10 | `sonar-project.properties` e `infrastructure/docker-compose.quality.yml` | Análisis de SonarQube y su Quality Gate. |
| 11 | `backend/api/app/Modules/FAdministration/Application/ManageUsers.php` | Usuarios del panel: alta, bloqueo, restablecer acceso y anonimizar. |
| 12 | `backend/api/app/Modules/FAdministration/Domain/AnnouncementImages.php` | Medidas exigidas a las imágenes del carrusel (D-83). |
| 13 | `frontend/web/src/features/panel/PanelShell.jsx` | Estructura común de los paneles: menú agrupado, tooltips, contadores y tema. |

### 3.1 Una migración: `2026_10_27_000028_add_activation_to_users.php` (líneas 14 a 25)

```php
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dateTime('invited_at', 6)->nullable()->after('terms_accepted_at');
            $table->dateTime('activated_at', 6)->nullable()->after('invited_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['invited_at', 'activated_at']));
    }
```

- **14 a 20 (`up`):** agrega dos columnas a `users`:
  - `invited_at`, el momento en que un administrador creó la cuenta;
  - `activated_at`, el momento en que la persona definió su contraseña.
- **17 y 18:** el `6` guarda microsegundos. Son `nullable`, así que las cuentas que ya existían siguen activas sin migrar datos.
- **22 a 25 (`down`):** deshace exactamente lo mismo. Todas las migraciones son reversibles; se probó también con la 000020, que retiró el prototipo.
- En una base existente basta `php artisan migrate`: solo aplica las pendientes.

### 3.2 `docker-compose.testing.yml`: la base de pruebas (líneas 19 a 37)

```yaml
services:
  mysql-test:
    image: mysql:8.4
    container_name: tecnicoya-mysql-test
    ports:
      - "127.0.0.1:3306:3306"
    environment:
      MYSQL_DATABASE: tecnicoya_testing
      MYSQL_USER: tecnicoya_test
      MYSQL_PASSWORD: ${DB_PASSWORD:?Defina DB_PASSWORD en backend/api/.env.testing}
      MYSQL_RANDOM_ROOT_PASSWORD: "yes"
    command:
      - --default-time-zone=+00:00
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    volumes:
      - tecnicoya-mysql-test-data:/var/lib/mysql
      - ./database/testing/initdb:/docker-entrypoint-initdb.d:ro
```

- **21:** la misma versión de MySQL que el producto (8.4).
- **24:** solo escucha en `127.0.0.1`, así que no se expone a la red.
- **26 y 27:** la base del slot A (`tecnicoya_testing`) y un usuario sin privilegios de root.
- **28:** la clave **no está en el repositorio**: se lee de `.env.testing`, que no se versiona. Si falta, Compose se detiene con un mensaje claro.
- **30:** root recibe una clave aleatoria que nadie usa.
- **32 a 34:** UTC y `utf8mb4`, para que las horas y las tildes sean iguales en todas las máquinas.
- **37:** el script de `initdb` crea la base del slot B (`tecnicoya_b_testing`) en el mismo contenedor. Así ahorramos RAM.

### 3.3 `E2EDatabaseGuard`: los datos de prueba nunca van a otra base (líneas 14 a 25)

```php
    public static function ensureIsolated(): void
    {
        $connection = config('database.connections.mysql');
        $database = (string) $connection['database'];
        if (! str_ends_with($database, '_testing') || ! in_array($database, self::SLOT_DATABASES, true)) {
            throw new SeedingRefused("Siembra E2E rechazada: la base «{$database}» no es un slot de pruebas (*_testing).");
        }
        if (! app()->environment('testing') || config('database.default') !== 'mysql'
            || $connection['host'] !== '127.0.0.1' || $connection['username'] !== 'tecnicoya_test') {
            throw new SeedingRefused('Fixtures E2E permitidos solo en la base aislada.');
        }
    }
```

- Nació del **DEF-44**: una siembra manual apuntó a la base de desarrollo.
- **18 y 19:** solo acepta las dos bases de los slots (`tecnicoya_testing` y `tecnicoya_b_testing`).
- **21 a 23:** además exige `APP_ENV=testing`, MySQL local y el usuario de pruebas.
- Cada seeder E2E la llama **antes de cualquier consulta**. Lo prueban S03-TC-082 y 083 y S04-TC-129, que verifican que hay 0 consultas cuando se rechaza.

### 3.4 `DestructiveCommandGuard`: artisan no borra la base equivocada (líneas 13 a 31)

```php
    public function check(string $command, ?string $connection): void
    {
        if (! in_array($command, $this->destructiveCommands(), true) || ! app()->environment('testing')) {
            return;
        }
        $connection ??= config('database.default');
        $driver = config("database.connections.$connection.driver");
        $database = (string) config("database.connections.$connection.database");
        $isolated = $driver === 'sqlite' ? $database === ':memory:' : str_ends_with($database, '_testing');
        if (! $isolated) {
            throw new DestructiveCommandRefused("Comando «{$command}» rechazado: con APP_ENV=testing la base «{$database}» "
                .'no termina en _testing. Ejecuta artisan con las variables del slot o con scripts/run-e2e.mjs.');
        }
    }

    private function destructiveCommands(): array
    {
        return ['migrate:fresh', 'migrate:refresh', 'migrate:reset', 'db:wipe', 'db:seed'];
    }
```

- Nació del **DEF-45**: `migrate:fresh --env=testing` lanzado a mano cayó en la base de desarrollo.
- **15:** solo actúa sobre los comandos que borran o siembran, y con `APP_ENV=testing`.
- **18 a 21:** averigua la base real de la conexión. Solo se consideran aisladas una base terminada en `_testing` o SQLite en memoria.
- **22 a 25:** si no es aislada, aborta **antes de conectar**, con un mensaje en español que dice cómo hacerlo bien.
- **29 a 31:** la lista es un método y no una constante, para que la cobertura y la mutación la midan.

### 3.5 `scripts/run-e2e.mjs`: un solo Cypress a la vez (líneas 127 a 134; uso en las líneas 193 y 216)

```js
async function lockOrWait(file, label, minutes) {
  for (let waited = 0; ; waited += 5) {
    if (tryLock(file)) { held.push(file); return; }
    if (waited === 0) console.log(`Esperando: ${label} ocupado por otro proceso (máximo ${minutes} min).`);
    if (waited >= minutes * 60) throw new Error(`${label} sigue ocupado tras ${minutes} min.`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

- **129:** `tryLock` crea un archivo de bloqueo de forma atómica. Si lo logra, este proceso es el dueño.
- **130:** si otro proceso lo tiene, avisa una vez.
- **131:** si tras el máximo sigue ocupado, falla con un mensaje claro en vez de colgarse.
- **132:** vuelve a intentar cada 5 s.
- **Uso:**
  - en la línea 193, cada slot tiene su propio bloqueo (`e2e-slot-A.lock`), así que nadie usa la misma base a la vez;
  - en la línea 216, `e2e-cypress.lock` es **global**: solo un Cypress a la vez en el PC (regla 12b, por la memoria).
- El arrancador además ejecuta `migrate:fresh` y el seeder E2E del sprint en la base del slot, levanta la API, Vite, Reverb, la cola y el scheduler, quita `ELECTRON_RUN_AS_NODE` y genera el JUnit.

### 3.6 `ci.yml`: no gastar minutos cuando solo cambian documentos (job `cambios`)

```yaml
  cambios:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    outputs:
      codigo: ${{ steps.diff.outputs.codigo }}
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5
        with:
          fetch-depth: 0
      - name: ¿Cambia algo fuera de docs/?
        id: diff
        shell: bash
        env:
          BASE: ${{ github.event.pull_request.base.sha }}
          HEAD: ${{ github.event.pull_request.head.sha }}
        run: |
          if [ "${{ github.event_name }}" != pull_request ]; then echo "codigo=true" >> "$GITHUB_OUTPUT"; exit 0; fi
          archivos="$(git diff --name-only "$BASE...$HEAD")"
          echo "$archivos"
          if echo "$archivos" | grep -qv '^docs/'; then echo "codigo=true" >> "$GITHUB_OUTPUT"; else echo "codigo=false" >> "$GITHUB_OUTPUT"; fi
```

- **`outputs.codigo`:** los jobs `backend` y `frontend` declaran `needs: cambios` e `if: needs.cambios.outputs.codigo == 'true'`.
- **`fetch-depth: 0`:** trae el historial para poder comparar la base del PR con su cabeza.
- **Primera línea del script:** en un push a `main` siempre corre todo.
- **`git diff --name-only`:** lista los archivos que cambia el PR.
- **Última línea:** si hay **algún** archivo fuera de `docs/`, corre todo; si no, los jobs se saltan. Un job saltado cuenta como aprobado y no bloquea el PR.
- **Las versiones de las acciones van fijadas por hash** (`@fbc6f39…`) y no por etiqueta: es seguridad de la cadena de suministro.
- **Los otros jobs:**
  - `backend` corre Pest con cobertura PCOV y `composer audit` sobre un MySQL efímero;
  - `frontend` corre Vitest con cobertura, el build y `npm audit`;
  - `conteo` ejecuta `contar-pruebas-sprint.mjs` sobre los JUnit de esa misma corrida.

### 3.7 `scripts/mutacion.sh`: mutación confiable (líneas 58 a 76)

```bash
php artisan migrate:fresh --force --no-ansi >/dev/null
export TECNICOYA_MUTATION_MIGRATED=1
# … cabecera con fecha, commit, sistema y PHP …
set +e
php -d pcov.enabled=1 -d pcov.directory=. vendor/bin/pest "${tests[@]}" --mutate --everything --clear-cache \
  --path="$(join "${paths[@]}")" --colors=never 2>&1 | tee -a "$out"
code=${PIPESTATUS[0]}
set -e
summary="$(grep -E '^\s*Mutations:' "$out" | tail -1)"
echo "# Resumen: ${summary:-sin resumen} · código $code" >> "$out"
[ -n "$summary" ] || { echo "La mutación no terminó (sin resumen)." >&2; exit 1; }
if [ "$sprint" = control ] && ! grep -qE 'Mutations:.*untested' "$out"; then
  echo "Control negativo FALLIDO: no hay sobrevivientes al mutar Scorer solo con EligibilityTest (DEF-46)." >&2
  exit 1
fi
```

- **Qué es la mutación:** el plugin cambia el código a propósito (por ejemplo `>=` por `>`) y vuelve a correr las pruebas. Si nada falla, el «mutante» **sobrevive**, lo que revela una aserción que falta. Es más exigente que la cobertura.
- **DEF-46:** en Windows, el plugin contaba como eliminados los mutantes cuyo proceso moría. Con eso el S3 dio un 93,05 % falso. Por eso ahora se mide en **Linux**, en el job «Mutación».
- **Primeras dos líneas:** se migra **una sola vez**. Antes, cada mutante repetía `migrate:fresh` y el corte por tiempo también contaba como eliminado.
- **Ejecución de Pest:** solo muta las clases del sprint (`--path`) con las pruebas del sprint.
- **Resumen:** si no hay línea de resumen, la corrida no terminó y el script falla.
- **Control negativo:** mutar `Scorer` solo con `EligibilityTest` **debe** dejar sobrevivientes. Si sale «todo eliminado», la medición no es confiable y el job falla.
- **Resultados reales en Linux (2026-10-27):**
  - S3: **63,21 %** (el informe del S3 ya está corregido);
  - S4: **68,61 %** (antes 63,12 %), después de reforzar las pruebas S04-TC-140 a 143.

### 3.8 `ManageUsers.php`: protecciones del panel de usuarios (líneas 309 a 336)

```php
    private function lockTarget(User $actor, int $id, ?int $expectedVersion, bool $allowSelf = false): object
    {
        if (! $allowSelf && $actor->id === $id) {
            throw $this->conflict('USER_SELF_ACTION', 'api.user_self_action');
        }
        $user = DB::table('users')->where('id', $id)->lockForUpdate()->first();
        abort_unless($user, 404);
        if ($user->anonymized_at !== null) {
            throw $this->conflict('USER_ANONYMIZED', 'api.user_anonymized');
        }
        abort_if($expectedVersion !== null && (int) $user->version !== $expectedVersion, 409);
        return $user;
    }

    private function assertNotLastAdmin(object $user): void
    {
        $adminRole = DB::table('roles')->where('code', 'admin')->value('id');
        if ((int) $user->role_id !== (int) $adminRole || ! $user->is_active) {
            return;
        }
        $others = DB::table('users')->where('role_id', $adminRole)->where('id', '!=', $user->id)->where('is_active', true)
            ->whereNull('anonymized_at')->lockForUpdate()->count();
        if ($others === 0) {
            throw $this->conflict('USER_LAST_ADMIN', 'api.user_last_admin');
        }
    }
```

- **311 a 313:** un administrador no puede bloquearse, restablecerse ni eliminarse a sí mismo.
- **314 y 315:** se bloquea la fila del usuario, y un id que no existe responde 404.
- **316 a 318:** una cuenta ya eliminada (anonimizada) no admite más acciones.
- **319:** control de versión; si alguien más la cambió, responde 409.
- **325 a 336:** nunca se bloquea ni se elimina al **último administrador activo**. `lockForUpdate` en el conteo evita que dos administradores se bloqueen entre sí al mismo tiempo y dejen el sistema sin ninguno.
- **El resto del caso de uso:**
  - el alta envía un enlace de activación de 72 h y el administrador nunca define contraseñas;
  - toda acción exige un motivo y queda en `audit_entries`;
  - «eliminar» anonimiza la cuenta y conserva las solicitudes.

  Lo prueban S07-TC-109 a 120 y 141 a 143.

### 3.9 `AnnouncementImages.php`: medidas de las imágenes del carrusel (líneas 16 a 40)

```php
    public const SLOTS = [
        'main' => ['ratio' => 3.0, 'width' => 1440, 'height' => 480],
        'mobile' => ['ratio' => 1.5, 'width' => 810, 'height' => 540],
    ];

    private const RATIO_TOLERANCE = 0.01;

    public function valid(mixed $mediaId, string $slot): bool
    {
        $media = is_numeric($mediaId) ? DB::table('media_files')->where('id', (int) $mediaId)->where('purpose', 'announcement')
            ->where('scan_status', 'clean')->whereNull('retired_at')->first() : null;
        if (! $media) {
            return false;
        }
        $path = Storage::disk($media->disk)->path($media->storage_key);
        $size = is_file($path) ? @getimagesize($path) : false;
        if ($size === false || $size[1] === 0) {
            return false;
        }
        [$width, $height] = $size;
        $rule = self::SLOTS[$slot];

        return $width >= $rule['width'] && $height >= $rule['height']
            && abs($width / $height - $rule['ratio']) / $rule['ratio'] <= self::RATIO_TOLERANCE;
    }
```

- **16 a 19:** según D-83, la imagen principal es 3:1 (mínimo 1440 × 480) y la móvil es 3:2 (mínimo 810 × 540).
- **21:** se admite un 1 % de desviación por el redondeo del recorte.
- **24 y 25:** solo vale un archivo subido **para comunicados**, revisado (`clean`) y no retirado.
- **29 y 30:** `getimagesize` lee las medidas reales del archivo guardado, así que no se confía en lo que diga el navegador.
- **38 y 39:** cumple si llega al mínimo y su proporción está dentro de la tolerancia.

### 3.10 `DemoSeeder.php`: datos de demostración seguros (líneas 50 a 58)

```php
    public function run(): void
    {
        if (! app()->environment('local')) {
            throw new SeedingRefused('DemoSeeder solo corre en desarrollo (APP_ENV=local).');
        }
        $password = env(self::PASSWORD_VARIABLE);
        if (! is_string($password) || mb_strlen($password) < self::MIN_PASSWORD_LENGTH) {
            throw new SeedingRefused('Define '.self::PASSWORD_VARIABLE.' con al menos '.self::MIN_PASSWORD_LENGTH.' caracteres.');
        }
```

- **52 a 54:** se niega a correr fuera de desarrollo, así que jamás crea cuentas de demostración en producción o en pruebas.
- **55 a 58:** la contraseña de las cuentas `demo-*@example.test` viene de la variable `TECNICOYA_DEMO_PASSWORD` y **nunca** está en el código.
- **Después**, el seeder:
  - llama a `DatabaseSeeder`;
  - crea las cuentas con `firstOrNew` y `updateOrInsert`, de forma idempotente;
  - pone la foto de cada subcategoría que no tiene una;
  - publica tres comunicados con imágenes que cumplen D-83.

  Lo prueba S04-TC-139.

## 4. Flujo de punta a punta

1. **Esquema.** `php artisan migrate` aplica las 28 migraciones (usuarios y roles, catálogo, solicitudes, matching, outbox, comunicados…).
   - Desarrollo usa la base `tecnicoya`.
   - Las pruebas usan `tecnicoya_testing` (slot A) o `tecnicoya_b_testing` (slot B), en el contenedor de `docker-compose.testing.yml`.
2. **Datos.**
   - `php artisan db:seed` carga permisos, catálogo y distritos, sin cuentas.
   - En desarrollo, `DemoSeeder` agrega las cuentas de demostración.
   - En pruebas, los `SprintNNE2ESeeder` crean las cuentas `e2e-*`, protegidos por `E2EDatabaseGuard`.
   - `DestructiveCommandGuard` impide borrar la base equivocada.
3. **Pruebas locales.**
   - Pest, desde `backend/api`, usa el slot A gracias a `tests/bootstrap.php`.
   - Vitest se corre desde `frontend/web`.
   - Cypress usa `node scripts/run-e2e.mjs --sprint NN --slot A --junit`, uno a la vez.
4. **CI (cada PR).**
   1. `cambios` decide si hay código;
   2. `backend` y `frontend` corren pruebas, cobertura y auditorías;
   3. `conteo` cuenta los IDs por sprint.
5. **Mutación** (a pedido). Se pone la etiqueta `mutacion-s03` o `mutacion-s04` al PR, y el job «Mutación» corre en Linux con control negativo y sube el informe.
6. **SonarQube** (al cierre de cada sprint).
   1. `composer test:sonar` y `npm run test:coverage` generan la cobertura;
   2. se levanta `infrastructure/docker-compose.quality.yml` y se analiza con `sonar-project.properties`;
   3. el Quality Gate «TecnicoYa» tiene 6 condiciones sobre el código nuevo. S1, S2 y S3 lo aprobaron; en el S2, tras justificar un falso positivo. El del S4 está pendiente por la RAM.
7. **Integración.** Cada integrante abre un PR desde su rama `feature/<integrante>/<módulo>/…`. Se integra a `main` solo por PR, sin `push --force` ni rebase de historial publicado.
8. **Panel del administrador.** Con la base lista, el administrador usa Inicio, Estadísticas, Usuarios, Verificación, Solicitudes, Catálogo y Comunicados. Cada acción sensible queda en `audit_entries`.

## 5. Pruebas del área

| Tema | Archivos | Ejemplos de ID |
|---|---|---|
| Guardas de la base | `tests/Feature/Sprint03/E2ESeederGuardTest.php`, `tests/Feature/Sprint04/DestructiveCommandGuardTest.php`, `tests/Feature/Sprint04/E2ESupportTest.php` | S03-TC-082 y 083, S04-TC-129 a 132 y 137 |
| `DemoSeeder` y DIST-02 | `tests/Feature/Sprint04/DemoSeederTest.php`, `tests/Feature/Sprint04/DistanceTest.php` | S04-TC-139 y 138 |
| Refuerzo de mutación | `tests/Feature/Sprint04/ResponseShapeTest.php` | S04-TC-140 a 143 |
| Panel del administrador (Pest) | `tests/Feature/Sprint07/UserAdministrationTest.php`, `AdminInsightsTest.php`, `AnnouncementLifecycleTest.php`, `AdminReconfirmationTest.php` | S07-TC-098 a 128, 141 y 142 |
| Panel del administrador (Vitest) | `frontend/web/src/features/admin/admin.test.jsx`, `frontend/web/src/features/panel/panel.test.jsx` | S07-TC-129 a 140 y 143 |

**Para correr una o dos en vivo** (PowerShell):

```powershell
# Pest, desde backend/api, con la base de pruebas arriba
C:\xampp\php\php.exe vendor\bin\pest tests\Feature\Sprint07\UserAdministrationTest.php --filter "S07-TC-116"
C:\xampp\php\php.exe vendor\bin\pest tests\Feature\Sprint04\DemoSeederTest.php

# Vitest, desde frontend/web
npx vitest run src/features/admin/admin.test.jsx -t "S07-TC-129"

# Conteo por sprint, desde la raíz, con los JUnit generados
node scripts/contar-pruebas-sprint.mjs
```

S07-TC-116 comprueba que nadie actúa sobre su propia cuenta ni bloquea al último administrador. S07-TC-129 comprueba el menú agrupado, los contadores accesibles y los tooltips.

## 6. Cómo mostrarlo en localhost

**Antes de abrir el navegador:**
1. Levanta la base de pruebas: `docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait`, desde `backend/api`.
2. Sigue el README de la raíz, en la sección «Desarrollo local»:
   1. `php artisan migrate`;
   2. `php artisan db:seed`;
   3. define `TECNICOYA_DEMO_PASSWORD` y ejecuta `php artisan db:seed --class=DemoSeeder`;
   4. `php artisan storage:link`;
   5. `php artisan serve --port=3000`;
   6. `npm run dev` en `frontend/web`.

| Dónde | Qué hacer |
|---|---|
| Terminal | Ejecuta `php artisan migrate:status` para mostrar las 28 migraciones aplicadas. Luego, con `APP_ENV=testing` y la base `tecnicoya` (desarrollo), intenta `php artisan migrate:fresh`: la guarda lo rechaza con su mensaje. |
| GitHub → Actions | Muestra una corrida de CI con sus jobs (cambios, backend, frontend y conteo) y la del workflow «Mutación», con su resumen. |
| `http://127.0.0.1:5173/#cuenta` | Entra con `demo-admin@example.test`. |
| Inicio | Muestra los accesos rápidos (Verificar técnicos, Crear comunicado, Crear usuario) y los últimos 5 eventos. |
| Estadísticas | Cambia entre 7, 30 y 90 días y abre «Ver los datos en una tabla». |
| Usuarios | Crea un cliente: no pide contraseña y el enlace de activación queda en `storage/logs/laravel.log`. Bloquéalo con un motivo y comprueba que tu propia cuenta no tiene esas acciones. Crea un administrador: pide tu contraseña. |
| Comunicados | Muestra el carrusel por audiencia, ordénalo, edita uno vigente (verás el aviso) y elimina uno vencido escribiendo ELIMINAR. |
| Menú contraído | Pasa el mouse o usa Tab sobre los iconos: aparece el tooltip con el nombre y el contador de Verificación. |
| SonarQube (solo si hay RAM) | Abre `http://127.0.0.1:9000/dashboard?id=tecnicoya-huancayo` y muestra el Gate. |

## 7. Preguntas probables del docente

1. **¿Por qué dos slots en un solo MySQL?**
   Dos agentes probaban en paralelo y el PC tiene poca RAM. Un contenedor con dos bases (`tecnicoya_testing` y `tecnicoya_b_testing`) aísla los datos sin duplicar el servidor.
2. **¿Cómo evitan borrar la base de desarrollo por error?**
   Con dos guardas, nacidas de defectos reales (DEF-44 y DEF-45):
   - `E2EDatabaseGuard` impide sembrar datos E2E fuera de un slot;
   - `DestructiveCommandGuard` impide `migrate:fresh` y `db:seed` sobre una base que no termine en `_testing`.

   Ambas están probadas.
3. **¿Qué mide la mutación que no mide la cobertura?**
   La cobertura dice qué líneas se ejecutaron; la mutación dice si las pruebas **detectan** un cambio. `CatalogController` tenía 100 % de cobertura y 9 mutantes vivos (S1).
4. **¿Por qué corrigieron el 93,05 % del S3?**
   Porque era falso: en Windows, el plugin contaba como eliminado un mutante cuyo proceso moría (DEF-46). Medido en Linux con control negativo, el valor real es 63,21 %, y el informe lo dice.
5. **¿Qué condiciones tiene el Quality Gate?**
   Son seis condiciones sobre el código nuevo, documentadas en `docs/documentacion/calidad/QUALITY-GATE.md`:
   - cobertura de al menos 70 %;
   - menos de 3 % de líneas duplicadas;
   - confiabilidad, seguridad y mantenibilidad en A;
   - 100 % de los puntos sensibles de seguridad revisados.

   S1, S2 y S3 lo aprobaron. La condición de los puntos sensibles no se evalúa si no hay ninguno.
6. **¿Por qué la CI no corre Cypress ni SonarQube?**
   Por decisión D-39: se corren localmente al cierre del sprint con datos y servicios reales, y la CI no reemplaza esas evidencias. Además, ahora la CI no gasta minutos si el PR solo cambia documentos.
7. **¿Cómo protegen el panel del administrador?**
   - Cada ruta exige un permiso (`users.manage`, `dashboard.view`…), probado con casos negativos.
   - Toda acción exige un motivo y queda auditada.
   - Nadie actúa sobre su propia cuenta y nunca se deja el sistema sin administradores.
   - Crear un administrador exige reingresar la contraseña.
   - Eliminar significa anonimizar.
8. **¿Cómo se integra el trabajo del equipo?**
   - Las ramas siguen el formato `feature/<integrante>/<módulo>/…`.
   - `main` solo cambia por pull request, con la CI en verde.
   - No se usa `push --force` ni rebase de historial publicado.
   - Cada PR deja su avance y sus evidencias en `docs/`, y los relevos en `HANDOFF-*.md`.

## 8. Nota de honestidad

El código de esta área se desarrolló con apoyo de agentes de IA (Claude Code y Codex) a partir de los prompts de `PROMPTS.md`. El integrante:
- revisó los cambios;
- tomó las decisiones registradas en `DECISIONES.md`;
- verificó las pruebas y las evidencias;
- integró cada cambio a `main` mediante pull requests.

Cada avance en `docs/avances/pimentel/` registra qué propuso la IA, qué se aceptó y qué se corrigió.
