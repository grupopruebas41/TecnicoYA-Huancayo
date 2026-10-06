# Guía manual · Sprint 1

**TécnicoYa Huancayo — Base técnica, autenticación, roles y catálogo**  
**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026  
**Estado:** guía para implementar; aplicación, migraciones y pruebas funcionales NO ejecutadas en esta entrega.

## 1. Iteración y fuentes utilizadas

La solicitud menciona `[N]` y no contiene un nuevo archivo adjunto visible. Por la secuencia de trabajo, esta guía corresponde al **Sprint 1** del [CANVAS existente](sprints-01-08/CANVAS-Sprint-01.md). No sustituye los documentos de los otros siete sprints.

Se utiliza también el [diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), el [diccionario MySQL](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), la [guía de I0](CANVAS-Iteracion-00-Guia-Manual-TecnicoYa.md), el [backlog](CANVAS-Backlog-Tecnico-Implementacion-TecnicoYa.md) y las [reglas de programación](REGLAS-DE-PROGRAMACION-TecnicoYa.md).

**Resultado del sprint:** seis historias implementadas y doce casos base verificados: registro de cliente; técnico pendiente; login/logout de los tres roles; autorización; perfil propio; catálogo de tres especialidades y treinta subcategorías. No se implementan todavía matching, solicitudes completas, agenda, pagos, verificación administrativa completa ni los diez bloques de la landing.

> **Guía:** los comandos Artisan crean esqueletos. Después debes completar su comportamiento siguiendo los pasos; ejecutar un generador no implementa una historia.

## 2. Condiciones de entrada y decisiones que no debemos inventar

### I0 debe estar ejecutada, no solamente documentada

- Docker Compose, PHP/Laravel, React y MySQL funcionan en el entorno elegido.
- Sanctum está instalado, existe el cliente HTTP con cookies/CSRF y CORS permite el origen correspondiente.
- Pest y Cypress están instalados. Composer/npm tienen lockfiles y versiones compatibles.
- El endpoint de salud verifica MySQL. La guía de I0 por sí sola no demuestra esta condición.

### Decisiones pendientes

| Decisión | Tratamiento en esta guía |
|---|---|
| P20: uno o varios roles por cuenta | El diccionario y las plantillas usan la propuesta de un `role_id`. Antes de crear su esquema definitivo debe ratificarse. Si se aprueba multirrol, actualizar primero contrato, migraciones y tests; no sustituirlo silenciosamente. |
| P22: rechazo de verificación | S1 implementa únicamente la condición nueva `pending_verification` / `pending`; no resuelve rechazo ni suspensión. |
| P03/P16: distritos y referencias económicas | No sembrar distritos o precios inventados. Direcciones, tarifas y cobertura completa no bloquean un perfil básico si sus campos están diferidos/nulos según diseño. |
| P04/P21: responsables, métricas y Gate | Registrar responsable del incremento y condiciones de calidad antes de integrar el PR. No inventar cobertura aceptada. |
| Registro vs. diccionario | `client_profiles.client_type` es obligatorio en el diccionario pero no aparece en el contrato resumido de registro. La propuesta técnica de esta guía añade la selección `household/mype`; debe registrarse en el contrato, sin asignar “hogar” a todos por defecto. |
| Catálogo y fotografías | El diccionario exige imagen al publicar; S1 exige lectura del catálogo y S2 incorpora su administración/fotos. Confirmar cómo se distingue catálogo inicial de publicación comercial, o reutilizar medios públicos válidos existentes. No publicar filas que incumplan la regla ni declarar TC-012 aprobado con datos ficticios. |

La guía puede prepararse con estos pendientes. La implementación y aceptación de la historia afectada debe esperar su resolución. Los contratos detallados y nombres de clases aquí propuestos son elecciones de implementación; no convierten decisiones pendientes del producto en aprobaciones.

### Situación real del repositorio

El código revisado todavía utiliza `/api/login`, `/api/register`, middleware `token`, JWT y `users.role` como texto; su `config/database.php` no define MySQL y `phpunit.xml` selecciona SQLite. No es el esquema objetivo de este sprint.

Antes de aplicar la guía al producto, completa la transición técnica de I0 y registra cómo conviven o se retiran los endpoints históricos. Las pruebas anteriores siguen siendo referencia de regresión, no se borran porque fallen contra un contrato nuevo. No ejecutes migraciones nuevas sobre tablas incompatibles ni recrees el proyecto encima de las carpetas actuales.

## 3. Preparar rama, carpetas y evidencia

Abre PowerShell en Visual Studio Code. Los comandos siguientes parten de la raíz real; si trabajas en el laboratorio de I0, cambia solamente esa raíz:

```powershell
Set-Location -LiteralPath 'C:\Users\James\Documents\ChatGPT\Software TecnicoYa-Huancayo'
git status --short
git branch --show-current
git switch -c codex/sprint-01
$dc = @('--env-file', 'infrastructure/.env.docker', '-f', 'infrastructure/docker-compose.iter0.yml')
docker compose @dc config --quiet
docker compose @dc ps
Invoke-RestMethod http://localhost:8000/api/v1/health
```

Si la rama existe, utiliza `git switch codex/sprint-01`. Antes de cambiar de rama revisa los cambios sin commit; no los descartes ni los incluyas indiscriminadamente. `$dc` presupone que instalaste las plantillas de I0 en los destinos indicados allí; no apunta al Compose histórico.

```powershell
$paths = @(
 'backend/api/app/Modules/FAdministration/Application',
 'backend/api/app/Modules/FAdministration/Http/Controllers',
 'backend/api/app/Modules/FAdministration/Http/Requests',
 'backend/api/app/Modules/FAdministration/Http/Resources',
 'backend/api/app/Shared/Auth', 'backend/api/app/Shared/Audit',
 'backend/api/tests/Feature/Sprint01',
 'frontend/web/src/features/administration',
 'frontend/web/cypress/e2e/sprint-01',
 'docs/documentacion/evidencias/sprint-01'
)
$paths | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ }
```

Crea `docs/documentacion/evidencias/sprint-01/decisiones.md`: registra cada pendiente, decisión, responsable, fecha y documento afectado. No rellenes aprobaciones por anticipado.

## 4. BDD primero: preparar los doce casos

El archivo [sprint-01.feature](sprint-01-manual/sprint-01.feature) reproduce los doce escenarios del CANVAS con sus mismos identificadores. No necesita un adaptador Cucumber para usarse como especificación; Pest/Cypress materializan sus expectativas.

| TC | Historia | Comprobación principal | Automatización adjunta |
|---|---|---|---|
| TC-001 | HU-S01-01 | Cliente y perfil únicos, sin privilegios | Pest + Cypress |
| TC-002 | HU-S01-01 | Correo duplicado normalizado | Pest/MySQL |
| TC-003 | HU-S01-02 | Técnico pendiente y edición básica permitida | Pest/MySQL |
| TC-004 | HU-S01-02 | Rechazo de autoactivación/permisos | Pest/MySQL |
| TC-005 | HU-S01-03 | Login real y portal de cada rol | Cypress, tres variantes |
| TC-006 | HU-S01-03 | Cookie anterior inválida después de logout | Pest + Cypress/HTTP |
| TC-007 | HU-S01-04 | Control administrativo devuelve 403 | Pest, middleware real en ruta exclusiva de tests |
| TC-008 | HU-S01-04 | No existe registro público de administrador | Pest/MySQL |
| TC-009 | HU-S01-05 | Edición propia e incremento de versión | Pest/MySQL |
| TC-010 | HU-S01-05 | Conflicto 409 con edición obsoleta | Pest/MySQL |
| TC-011 | HU-S01-06 | Semilla 3/30 repetible e íntegra | Pest/MySQL |
| TC-012 | HU-S01-06 | Catálogo real y error de red visible | Cypress + filtrado API en Pest |

Ejemplo del comportamiento que debes acordar antes de escribirlo:

```gherkin
# language: es
Característica: Edición segura del perfil
  @TC_010
  Escenario: Escritura obsoleta
    Dado el perfil cambió después de cargar el formulario
    Cuando se envía una edición con expected_version anterior
    Entonces la API informa conflicto 409 y conserva la edición más reciente
```

Trabaja una historia a la vez: escenario → prueba que falle por la funcionalidad ausente → implementación mínima → prueba aprobada → refactorización. Diferencia un fallo esperado de un error de infraestructura o dependencia.

## 5. Preparar MySQL exclusivo de pruebas

**Nunca utilices la base con datos reales para Pest o los fixtures E2E.** La plantilla incluye otro servicio MySQL, sin puerto publicado, y una cuenta con acceso solamente a `tecnicoya_test`.

1. Copia [docker-compose.sprint01-tests.yml](sprint-01-manual/plantillas/docker-compose.sprint01-tests.yml) a `infrastructure/docker-compose.sprint01-tests.yml`.
2. Crea `infrastructure/.env.sprint01` con `TEST_DB_PASSWORD` y `TEST_ROOT_PASSWORD`, diferentes y generadas localmente.
3. Crea `backend/api/.env.testing` con estas variables; genera una `APP_KEY` de pruebas nueva, no rotes la clave de tu aplicación real:

```dotenv
APP_NAME=TecnicoYaTests
APP_ENV=testing
APP_KEY=
APP_DEBUG=false
SESSION_DOMAIN=null
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
LOG_CHANNEL=single
LOG_LEVEL=warning
HASH_DRIVER=bcrypt
```

Para obtener cada contraseña de infraestructura y después la clave de pruebas:

```powershell
php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
```

Pega los valores únicamente en sus archivos locales. Añade a `.gitignore` las rutas `infrastructure/.env.sprint01`, `backend/api/.env.testing`, `frontend/web/cypress.env.json` y cualquier informe que pueda incluir datos privados. Los archivos de ejemplo se guardan vacíos.

```powershell
$dt = @('--env-file', 'infrastructure/.env.sprint01', '-f', 'infrastructure/docker-compose.sprint01-tests.yml')
docker compose @dt config --quiet
docker compose @dt build api-test
docker compose @dt up -d mysql-test
docker compose @dt run --rm api-test composer install
docker compose @dt run --rm frontend-test npm ci
```

La plantilla utiliza `backend/api/docker/Dockerfile.local` creado en I0. El proceso de pruebas se conecta a `mysql-test:3306`; la API de navegador estará en `localhost:8001`, React en `localhost:5174`. La aplicación de desarrollo conserva 8000/5173. No ejecutar ambas suites de pruebas a la vez sobre esta misma base: Pest puede recrear tablas mientras Cypress las utiliza.

### Configurar Pest sin heredar SQLite

Copia [phpunit.sprint01.xml](sprint-01-manual/plantillas/phpunit.sprint01.xml) a `backend/api/phpunit.sprint01.xml` y [Sprint01TestCase.php](sprint-01-manual/plantillas/Sprint01TestCase.php) a `backend/api/tests/Sprint01TestCase.php`.

La clase verifica entorno, host, motor, base y usuario **antes** de que `RefreshDatabase` pueda recrear tablas. El XML no incluye contraseña ni clave; recibe los secretos del proceso. La caché de configuración utiliza una ruta temporal distinta.

En `tests/Pest.php`, aplica esta asociación al directorio del sprint:

```php
pest()->extend(Tests\Sprint01TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature/Sprint01');
```

Si ya existe una asociación general `Tests\TestCase` a todo `Feature`, ajústala para que no incluya `Feature/Sprint01`; no asignes dos clases base distintas a los mismos tests. Conserva los directorios anteriores con su configuración. No ejecutes esta suite con el XML histórico que selecciona SQLite.

## 6. Congelar el contrato técnico del incremento

Las rutas proceden del diseño; la forma detallada de respuesta que sigue es una **propuesta de implementación para que coincidan UI y plantillas**. Regístrala antes de codificar. Si cambia, actualiza pruebas y cliente juntos.

| Método/ruta | Acceso | Entrada / respuesta |
|---|---|---|
| GET `/sanctum/csrf-cookie` | Público, origen permitido | Cookie CSRF; 204 |
| POST `/api/v1/auth/register` | Público con CSRF desde SPA | `name,email,password,password_confirmation,account_type`; cliente: `client_type`; 201 |
| POST `/api/v1/auth/login` | Público con CSRF | `email,password`; 200 y sesión rotada |
| POST `/api/v1/auth/logout` | Autenticado | 204, sesión invalidada |
| GET `/api/v1/me` | Autenticado y cuenta habilitada | Perfil mínimo y permisos efectivos |
| PATCH `/api/v1/me` | Propietario | `name?`, `phone?`, `expected_version`; 200 o 409 |
| GET `/api/v1/catalog/specialties` | Público | `data` como lista de activos |
| GET `/api/v1/catalog/subcategories` | Público | Filtro `specialty_id`; lista de activos del rubro activo |

Respuesta propuesta de `/me`, con ejemplo de identificador sintético:

```json
{"data":{"id":"101","name":"Persona de prueba","phone":null,"role":{"code":"client"},"permissions":[],"version":1}}
```

Para técnicos incorpora el perfil mínimo y sus estados separados. No incluyas hash, tokens, direcciones o contactos privados ajenos. La representación de permisos es una lista de códigos; los IDs se envían como cadenas y `version` como entero. Errores de validación: 422 con `errors`; credenciales inválidas: 401 genérico; permiso insuficiente: 403; versión obsoleta: 409; CSRF: 419.

La guía propone mostrar éxito de registro y luego iniciar sesión explícitamente; no depende de un login automático. Conservar ese comportamiento en los selectores del E2E, o registrar y adaptar la alternativa antes de ejecutar los tests.

## 7. Base de datos: migraciones pequeñas y consistentes

No importes el SQL completo de referencia ni recrees `users` si existe. Después de resolver P20, inspecciona primero:

```powershell
docker compose @dc exec api php artisan migrate:status
```

Para un esqueleto de I0 con `users` estándar, genera migraciones sucesivas:

```powershell
docker compose @dc exec api php artisan make:migration create_roles_and_permissions_tables
docker compose @dc exec api php artisan make:migration extend_users_for_sprint01 --table=users
docker compose @dc exec api php artisan make:migration create_permission_pivots
docker compose @dc exec api php artisan make:migration create_basic_profiles
docker compose @dc exec api php artisan make:migration create_initial_catalog
docker compose @dc exec api php artisan make:migration create_audit_entries_table
```

Abre cada archivo generado y completa `up/down`. Si ya existe una tabla, utiliza una migración de ampliación y conversión, no otro `Schema::create`. Para el repositorio histórico prepara además el mapeo de `users.role` hacia `role_id`, conserva la información y prueba el cambio sobre una copia. No hagas la columna obligatoria hasta completar y verificar el mapeo.

| Orden | Tablas/campos | Comprobación |
|---|---|---|
| 1 | `roles`, `permissions` | Códigos únicos; roles `client`, `technician`, `admin` |
| 2 | `users` | `role_id`, correo único normalizado, hash, teléfono opcional, cuenta habilitada, versiones, campos del diccionario |
| 3 | `role_permissions`, `user_permissions` | PK compuestas, FK válidas; concesión individual con autor/fecha |
| 4 | `client_profiles`, `technician_profiles` | `user_id` único; datos básicos y estados separados |
| 5 | `specialties`, `subcategories` | Códigos únicos, relación padre, activo, orden y versión |
| 6 | `audit_entries` | Actor, acción, sujeto, motivo, correlación, fecha y cambios permitidos |
| 7 | `sessions` y tablas técnicas de I0 | Confirmar que ya existen; no duplicarlas |

Los tipos, tamaños y restricciones están en las secciones T01–T06, T08, T16–T17, T67 y T73 del diccionario. Ejemplo de FK al ampliar usuarios nuevos sin datos:

```php
Schema::table('users', function (Blueprint $table) {
    $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
    $table->string('phone', 20)->nullable();
    $table->unsignedInteger('version')->default(1);
});
```

Este fragmento **no es toda la migración** y no es adecuado para una tabla poblada sin una etapa nullable/backfill. Conserva `auth_version`, `is_active` y los demás campos correspondientes; no reduzcas el diccionario a tres columnas.

Las referencias opcionales a distritos/medios requieren sus tablas. Para una evolución por sprint, documenta qué columnas y FK se incorporarán con esos módulos, o crea primero las dependencias mínimas del diccionario. No dejes referencias a tablas inexistentes ni valores ficticios para sortear la FK. La regla de publicación de imágenes debe quedar resuelta antes de exponer el catálogo activo.

Cada `up/down` y callback debe cumplir el máximo de 150 líneas: divide migraciones o responsabilidades cuando sea necesario. Prueba rollback sobre la base aislada; `down()` no es un respaldo de datos.

## 8. Modelos, semillas y catálogo reproducible

Conserva `App\Models\User` como proveedor de autenticación. Agrega relaciones `role`, `clientProfile` y `technicianProfile`; oculta contraseña y `remember_token`; convierte `is_active` a boolean y `version` a entero. No devuelvas directamente todo el modelo.

Para clases que aún no existan:

```powershell
docker compose @dc exec api php artisan make:model Role
docker compose @dc exec api php artisan make:model Permission
docker compose @dc exec api php artisan make:model ClientProfile
docker compose @dc exec api php artisan make:model TechnicianProfile
docker compose @dc exec api php artisan make:model Specialty
docker compose @dc exec api php artisan make:model Subcategory
docker compose @dc exec api php artisan make:seeder AuthorizationSeeder
docker compose @dc exec api php artisan make:seeder CatalogSeeder
```

No generes otro `User`. La ubicación `App\Models` mantiene el proveedor existente; los casos de uso se ubican en FAdministration. Si el equipo ya acordó modelos en Infrastructure, conserva ese mapa e imports de forma consistente.

**AuthorizationSeeder:** inserta o actualiza por `code` los roles y permisos aprobados; relaciona concesiones mínimas sin crear administradores con contraseña. El ejemplo de control administrativo usa el permiso `catalog.manage`: debe estar documentado y asignado al rol autorizado, no a cliente/técnico. Para asignar permisos nunca confíes en un arreglo enviado desde el registro.

**CatalogSeeder:** usa el [CSV de referencia](sprint-01-manual/catalogo-referencia.csv), extraído del diccionario: 11/9/10. Mapea sus códigos propuestos contra los existentes antes de migrar. Utiliza `updateOrCreate` o `upsert` por código estable; conserva IDs y relaciones. No trunques tablas, no generes tarifas ni cambies IDs en cada ejecución. Si ya se administran datos, la semilla no debe sobrescribir decisiones posteriores de un administrador.

Ejemplo para una fila de especialidad, una vez acordados sus códigos:

```php
$specialty = Specialty::firstOrCreate(
    ['code' => $row['code']],
    ['name' => $row['name'], 'active' => true, 'display_order' => $row['order']]
);
```

Las variables `$row` provienen de la semilla aprobada; no son entrada del navegador. La semilla contiene datos iniciales; los valores configurables de negocio se consultarán desde sus tablas al implementar matching, no se duplican aquí.

**Verificación:** en la base aislada, ejecutar dos veces no cambia el número de registros ni los IDs. TC-011 lo automatiza. Comprueba además que una subcategoría no queda publicada bajo un rubro inactivo.

## 9. HU-S01-01 y HU-S01-02: registro

Genera las clases si no existen:

```powershell
docker compose @dc exec api php artisan make:request RegisterAccountRequest
docker compose @dc exec api php artisan make:class Modules/FAdministration/Application/RegisterAccount
docker compose @dc exec api php artisan make:controller AuthController
```

En este repositorio **AuthController ya existe**: no ejecutes el último generador encima de él. Crea un controlador modular `make:class Modules/FAdministration/Http/Controllers/AuthController` o adapta el existente bajo pruebas. Mueve el Form Request generado a su carpeta modular ajustando el namespace/imports, o conserva su ubicación convencional documentada; no mantengas dos implementaciones activas.

Completa el Form Request:

1. Normaliza correo con trim y minúsculas antes de validar y persistir; usa el mismo criterio en login y la restricción única.
2. Valida nombre, correo, confirmación de contraseña y la política de contraseña acordada. No inventes un nuevo mínimo de negocio en esta guía.
3. Limita `account_type` a `client,technician`. Valida `client_type` si se ratifica la extensión del contrato.
4. Marca como `prohibited` los campos privilegiados: `role`, `role_id`, `permissions`, `is_active`, `status`, `verification_status`, `verified_by` y cualquier autoría o concesión.
5. Entrega a la aplicación únicamente `$request->validated()` y una lista explícita de campos.

Completa `RegisterAccount` dentro de `DB::transaction`:

- Obtén el rol por código desde la tabla; si falta la semilla, falla de forma controlada, no uses un ID fijo.
- Crea usuario con hash bcrypt, nunca contraseña sin hash. El rol y habilitación inicial los asigna el servidor según el diseño.
- Si es cliente, crea un solo `client_profiles` con el tipo declarado y validado.
- Si es técnico, crea `technician_profiles` con `display_name`, estado `pending_verification`, verificación `pending` y `available_now=false`; no lo habilites para recibir trabajos.
- Devuelve 201 con una representación permitida. Un error intermedio revierte usuario y perfil.
- Maneja la violación de unicidad de correo producida por una carrera como error de registro coherente; no conviertas cualquier error SQL en “correo duplicado”.

El alta pendiente permite completar perfil básico; no equivale a cuenta técnica verificada. Ejecuta TC-001–004 y TC-008 después de completar API/modelos.

## 10. HU-S01-03: login/logout y sesión SPA

Mantén Sanctum `statefulApi()`, CORS con credenciales y los orígenes exactos de cada entorno. Antes de POST de registro/login, React solicita `/sanctum/csrf-cookie` mediante el cliente HTTP común.

El núcleo de login, después de la validación, será:

```php
if (!Auth::guard('web')->attempt([
    'email' => $request->validated('email'),
    'password' => $request->validated('password'),
    'is_active' => true,
])) {
    return response()->json(['message' => 'Credenciales no válidas.'], 401);
}
$request->session()->regenerate();
return new MeResource($request->user('web'));
```

En logout:

```php
Auth::guard('web')->logout();
$request->session()->invalidate();
$request->session()->regenerateToken();
return response()->noContent();
```

Agrega los imports necesarios en el controlador y pruebas de errores; estos fragmentos no reemplazan validación, limitación de intentos o políticas. No respondas distinto según exista o no el correo. No devuelvas JWT ni guardes tokens de sesión en React.

Una sesión válida de cliente/técnico/admin debe recuperar `/me`. La cuenta técnica pendiente puede entrar a su perfil; no se aplica una prohibición global de login por falta de verificación.

Configura limitación de intentos por una política técnica documentada, sin fijar números arbitrarios en cada ruta. No se implementa recuperación de contraseña completa si no forma parte de la historia comprometida; tampoco se muestra un botón que afirme enviarla sin backend.

Referencias técnicas: [Sanctum SPA](https://laravel.com/framework/docs/12.x/sanctum#spa-authentication) y [autenticación Laravel](https://laravel.com/framework/docs/12.x/authentication).

## 11. HU-S01-04: autorización y administrador inicial

```powershell
docker compose @dc exec api php artisan make:middleware EnsureAccountIsActive
docker compose @dc exec api php artisan make:middleware RequirePermission
docker compose @dc exec api php artisan make:policy UserPolicy --model=User
docker compose @dc exec api php artisan make:command ProvisionAdmin
```

Registra aliases `account.active` y `permission` en `bootstrap/app.php`; conserva los aliases existentes durante la transición. El primer middleware rechaza cuentas bloqueadas aunque aún presenten cookie; el segundo consulta concesiones efectivas y niega por defecto. No implementes `if admin then allow everything`.

Utiliza `auth:sanctum` para identidad y Policies para propiedad/recurso. Una consulta de catálogo público no requiere cuenta; GET/PATCH `/me` identifica al usuario desde sesión, no desde `user_id` enviado.

**Administrador inicial:** completa el comando `ProvisionAdmin` con firma propuesta `tecnicoya:provision-admin {--email=} {--name=}`. Debe leer la contraseña con `$this->secret()`, confirmar contraseña, validar política, rechazar sobrescritura accidental de otra cuenta, crear usuario/permisos mínimos y auditar todo en transacción. No aceptar contraseña como argumento visible del shell y no crear una ruta HTTP de aprovisionamiento.

Solo después de implementar y revisar el comando:

```powershell
docker compose @dc exec api php artisan tecnicoya:provision-admin --email="TU_CORREO_ADMIN" --name="TU_NOMBRE"
```

Sustituye las dos etiquetas por datos del administrador real; la contraseña se introduce de forma oculta. No se ejecuta este comando en esta entrega. Las cuentas E2E tienen otro seeder, exclusivo del entorno de pruebas, y no sirven como administrador del producto.

TC-007 prueba middleware real en una ruta registrada únicamente dentro de Pest; no añade un endpoint al producto. Compleméntalo con pruebas de Policies por propietario y con los endpoints administrativos reales cuando se introduzcan. No afirmes que esa prueba acredita por sí sola todos los permisos futuros.

## 12. HU-S01-05: perfil propio con control de versión

```powershell
docker compose @dc exec api php artisan make:request UpdateProfileRequest
docker compose @dc exec api php artisan make:class Modules/FAdministration/Application/UpdateProfile
docker compose @dc exec api php artisan make:resource MeResource
```

Valida `name`, `phone` y `expected_version`; prohíbe campos privilegiados y ediciones de correo/contraseña que no tengan un flujo aprobado. No cambies el rol por editar el perfil.

En `UpdateProfile`:

1. Abre una transacción.
2. Obtén el usuario autenticado por ID con `lockForUpdate()`.
3. Compara su `version` con `expected_version`. Si difieren, responde 409 y no escribe ningún campo.
4. Actualiza solo los campos permitidos y aumenta una vez la versión.
5. Devuelve el recurso fresco con la nueva versión.

> **Guía:** dos formularios pueden haberse abierto con versión 1. Tras guardar uno, la versión es 2; el segundo no debe sobrescribirlo sin enterarse del cambio.

La versión usada por este PATCH es `users.version`; no la confundas con `technician_profiles.version`. Las ediciones del perfil técnico ampliado pertenecen al Sprint 2. Ejecuta TC-009 y TC-010 y agrega una variante de usuario ajeno para la Policy; `/me` no acepta elegir a otra persona.

## 13. Registrar rutas e implementar lectura del catálogo

Agrega el grupo `/v1` a `routes/api.php`. Esquema de registro, después de implementar e importar las clases:

```php
Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::get('catalog/specialties', [CatalogController::class, 'specialties']);
    Route::get('catalog/subcategories', [CatalogController::class, 'subcategories']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::middleware('account.active')->group(function () {
            Route::get('me', [ProfileController::class, 'show']);
            Route::patch('me', [ProfileController::class, 'update']);
        });
    });
});
```

Añade los limitadores de autenticación acordados a las rutas correspondientes antes del merge. Se permite cerrar sesión aun si la cuenta acaba de bloquearse. El fragmento no incluye el healthcheck ni elimina rutas previas.

`CatalogController` debe filtrar activos, validar `specialty_id`, ordenar de manera estable y proyectar solo campos públicos. Una especialidad inactiva no debe exponer sus subcategorías. Esta guía propone `data: []` para ese filtro; congela el contrato junto a TC-012.

Verifica rutas sin publicar datos:

```powershell
docker compose @dc exec api php artisan route:list --path=api/v1 -v
```

No marques el sprint como migrado si React todavía llama a `/api/actions/*` o utiliza el estado de demo como backend de autenticación.

## 14. React: tres accesos, perfil y catálogo

Conserva el diseño visual existente. Dentro de `src/features/administration`, crea componentes con estas responsabilidades:

| Componente propuesto | Trabajo |
|---|---|
| `AuthProvider` | Estado `loading/authenticated/anonymous`; consulta `/me`; limpia identidad y caché al salir |
| `LoginForm` | CSRF → login → `/me`; errores genéricos; redirección por rol efectivo |
| `RegisterForm` | Cliente/técnico, tipo de cliente si procede, confirmación y errores de servidor |
| `ProtectedPortal` | Espera la carga de sesión; presenta solo el portal permitido; sin sustituir RBAC de API |
| `ProfileForm` | Envía nombre/teléfono/version; muestra conflicto 409 y permite recargar datos |
| `CatalogView` | Consume catálogo real; muestra carga, vacío y error, sin fallback silencioso |

Puedes conservar el router/hash existente; no es obligatorio instalar otra biblioteca. El contrato de navegación propuesto para las pruebas es `/#cuenta` para login/registro y `/#catalogo` para la vista mínima de catálogo. La landing completa permanece en Sprint 2.

Usa el cliente HTTP de I0, que activa credenciales y cabecera CSRF. Ejemplo del envío de login:

```javascript
await prepareSession();
await http.post('/api/v1/auth/login', { email, password });
const { data } = await http.get('/api/v1/me');
setCurrentUser(data.data);
```

No guardes la contraseña ni la cookie en estado persistente. Al cerrar sesión, espera confirmación, limpia datos sensibles y desconecta Echo si estaba activo. Si falla el logout, informa el error; no prometas que la sesión del servidor ya fue invalidada.

### Selectores estables para Cypress

Agrega `data-cy` sin cambiar el texto visible ni accesibilidad:

- Login: `login-email`, `login-password`, `login-submit`, `show-register`.
- Registro: `register-name`, `register-email`, `register-account-type`, `register-client-type`, `register-password`, `register-password-confirmation`, `register-submit`, `register-success`.
- Portales: `portal-client`, `portal-technician`, `portal-admin`; salida: `logout`.
- Catálogo: select `specialty-select`; lista `subcategory-list`; estado `catalog-error`.

El select de especialidad empieza sin selección y no consulta subcategorías hasta elegir un valor. Esto hace determinista la prueba. En error de catálogo se desmonta la lista para evitar que datos viejos parezcan actuales. Los IDs de opciones son los recibidos por la API. Si tu UI tiene otra estructura legítima, adapta los selectores, no el resultado de negocio esperado.

**Verificación:** un cliente no ve el portal administrativo al cambiar el hash, pero la prueba determinante sigue siendo la respuesta de la API. Tras refrescar el navegador, `/me` recupera la sesión sin usar tokens locales.

## 15. Instalar las plantillas de pruebas del sprint

Estos archivos son **código de prueba previsto**, no pruebas ya aprobadas. Requieren las clases, contratos y esquema implementados en los pasos anteriores.

| Archivo adjunto | Destino en el proyecto |
|---|---|
| [AuthenticationTest.php](sprint-01-manual/plantillas/AuthenticationTest.php) | `backend/api/tests/Feature/Sprint01/AuthenticationTest.php` |
| [CatalogTest.php](sprint-01-manual/plantillas/CatalogTest.php) | `backend/api/tests/Feature/Sprint01/CatalogTest.php` |
| [Sprint01E2ESeeder.php](sprint-01-manual/plantillas/Sprint01E2ESeeder.php) | `backend/api/database/seeders/Sprint01E2ESeeder.php` |
| [portals.cy.js](sprint-01-manual/plantillas/portals.cy.js) | `frontend/web/cypress/e2e/sprint-01/portals.cy.js` |
| [catalog.cy.js](sprint-01-manual/plantillas/catalog.cy.js) | `frontend/web/cypress/e2e/sprint-01/catalog.cy.js` |
| [cypress.sprint01.config.js](sprint-01-manual/plantillas/cypress.sprint01.config.js) | `frontend/web/cypress.sprint01.config.js` |

Las plantillas de la sección 5 completan el conjunto. No copies las pruebas al código activo antes de revisar sus precondiciones y decisiones pendientes.

### Ejecutar Pest primero

Detén los servicios HTTP de pruebas si están activos, para que no atiendan peticiones mientras se restablece el esquema:

```powershell
docker compose @dt stop api-test frontend-test
docker compose @dt run --rm api-test php vendor/pestphp/pest/bin/pest --configuration=phpunit.sprint01.xml
```

`RefreshDatabase` solo puede actuar sobre el MySQL aislado gracias a la clase de protección. Un fallo de esa protección debe investigarse, no quitarse. Estas pruebas pueden fallar inicialmente porque falta implementación; corrige la causa y conserva la evidencia de desarrollo.

Pest no prueba por sí solo la protección CSRF del navegador: Laravel la omite en su runner de pruebas. La variante `S01-SEC-CSRF` de Cypress hace una solicitud HTTP real sin token y espera 419. No desactives CSRF para aprobar pruebas. [Pruebas HTTP de Laravel](https://laravel.com/framework/docs/12.x/http-tests).

### Preparar fixtures E2E y ejecutar Cypress después

Después de Pest, migra y siembra la base aislada antes de iniciar la API HTTP:

```powershell
$env:TECNICOYA_E2E_PASSWORD = 'Aa9!' + (& php -r "echo bin2hex(random_bytes(20));")
docker compose @dt run --rm api-test php artisan migrate --no-interaction
docker compose @dt run --rm -e TECNICOYA_E2E_PASSWORD api-test php artisan db:seed --class=Sprint01E2ESeeder
docker compose @dt up -d api-test frontend-test
Invoke-RestMethod http://localhost:8001/api/v1/health
Push-Location frontend/web
npx cypress run --config-file cypress.sprint01.config.js
Pop-Location
Remove-Item Env:TECNICOYA_E2E_PASSWORD
```

El prefijo usado al generar la contraseña es sintético y no constituye una credencial compartida: el valor completo se genera durante la ejecución y nunca se versiona. El seeder exige una contraseña aleatoria suficientemente larga como medida de fixture, no impone la política de contraseñas del producto. La variable debe mantenerse en la misma terminal hasta terminar Cypress. Si necesitas repetir, genera otra y vuelve a sembrar.

El seeder crea `e2e-client@example.test`, `e2e-technician@example.test` y `e2e-admin@example.test` exclusivamente en la base de pruebas; valida entorno, host, nombre y usuario antes de escribir. No expone un endpoint HTTP de preparación. No equivale al aprovisionamiento real auditado.

La prueba de login debe enviar peticiones reales; no reemplaza `/login` o `/me` con respuestas falsas. TC-012 utiliza API real en su variante positiva y un fallo de red simulado solo para la negativa. `cy.request` no comprueba CORS; el login y catálogo desde React sí recorren el navegador. [Cypress request](https://docs.cypress.io/api/commands/request).

La reproducción de cookie invalidada utiliza valores solo en memoria y `log:false`; no adjuntes cookies a evidencias públicas. El archivo Cypress desactiva grabación automática y capturas de fallo para evitar publicar credenciales de fixture.

### Casos de seguridad complementarios antes del cierre

Los doce TC base no sustituyen estas verificaciones; registra identificadores `S01-SEC-*` sin renumerar el catálogo:

- Credenciales incorrectas y cuenta bloqueada no obtienen identidad.
- Sin sesión, `/me` devuelve 401; cliente/técnico no reciben permisos administrativos.
- Un perfil ajeno no puede modificarse mediante otra ruta, ID inyectado o campos adicionales.
- Provisionar administrador registra auditoría sin contraseña; si el registro durable falla, la acción no se confirma.
- El registro concurrente del mismo correo no deja dos usuarios ni un perfil huérfano.
- Hash/secretos no aparecen en respuestas ni logs; límites de intentos producen el resultado configurado.

La plantilla automatiza CSRF negativo; las demás variantes deben implementarse junto a los controles que prueban. No afirmar cobertura total por ejecutar solo las plantillas adjuntas.

## 16. Build, análisis y PR

Ejecuta las comprobaciones desde la raíz, una vez implementado el sprint:

```powershell
docker compose @dt run --rm api-test composer validate --strict
docker compose @dt run --rm api-test composer audit
docker compose @dt run --rm api-test php vendor/bin/pint --test
docker compose @dt run --rm frontend-test npm run build
Push-Location frontend/web
npm audit
Pop-Location
```

El lint JavaScript y la medición de 150 líneas se ejecutan con las herramientas/configuración adoptadas en I0 y las reglas. No se presupone un script `npm run lint` existente: el manifiesto revisado no lo contiene. Configúralo antes del primer merge; no presentes un comando inexistente como una comprobación aprobada.

Configura CI para ejecutar el mismo orden: MySQL aislado → Pest → fixtures E2E → API/React → Cypress → build/análisis → Gate. No hagas correr Pest con recreación de esquema en paralelo con Cypress sobre la misma base.

SonarQube requiere scanner, proyecto, credencial secreta y política aprobada. Una vez instalado el CLI y definida la configuración del proyecto, la invocación es `sonar-scanner -Dsonar.qualitygate.wait=true`; host y token se inyectan mediante `SONAR_HOST_URL` y `SONAR_TOKEN`, no como valores escritos en el comando ni en Git. No ejecutes ese ejemplo hasta verificar la edición/capacidad para el análisis previo al merge, señalada en las reglas. Esperar el Gate y enlazarlo al commit es obligatorio; iniciar SonarQube o terminar el scanner sin consultar el resultado no basta.

Si el Gate requiere cobertura, prepara el driver de cobertura PHP y los informes del frontend: el Dockerfile local de I0 no instala Xdebug/PCOV y Cypress por sí solo no produce cobertura instrumentada de la aplicación. No inventes un informe ni marques el umbral como satisfecho por no tener datos. Define esas herramientas y su alcance según P21 antes de integrar el PR.

Guarda salidas sanitizadas, versiones, commit y resultados en `docs/documentacion/evidencias/sprint-01/`. Actualiza contrato y trazabilidad. Revisa `git diff` y `git diff --cached`, añade solo archivos de esta historia y crea el PR con HU/RF, pruebas ejecutadas, cambios de seguridad y resultado del Gate. No se crea ni se publica un PR en esta entrega documental.

## 17. Definition of Done: puntos verificables

Todas las casillas quedan sin marcar hasta la ejecución real. Esta lista complementa, no rebaja, la DoD del CANVAS y las reglas nuevas.

| Punto | Cómo verificar | Evidencia requerida |
|---|---|---|
| Historias y pendientes | Revisar HU-S01-01 a HU-S01-06 y resoluciones aplicables | Decisiones y aceptación; sin supuestos ocultos |
| Registro cliente/técnico | TC-001 a TC-004 y TC-008 | Respuestas, conteos y estado persistido |
| Técnico pendiente | No se autoactiva; sí edita perfil básico | TC-003/004; políticas revisadas |
| Login de los tres roles | TC-005 por cada rol, recarga y `/me` | Cypress contra API real |
| Logout efectivo | Reutilizar cookie anterior obtiene 401 | TC-006; no solo pantalla de login |
| RBAC/propiedad | Denegar privilegios y acceso ajeno | TC-007/008 y S01-SEC complementarios |
| Perfil/versiones | Edición válida y conflicto obsoleto | TC-009/010 |
| MySQL y catálogo | FK/unicidad y semilla repetida 3/30 | TC-011 y estado de migraciones |
| Catálogo en React | API real y fallo visible sin fallback demo | TC-012 |
| Seguridad | CSRF, secretos, hashes, límites, auditoría y cuentas bloqueadas | Resultados por control SEC-S01-01 a 05 |
| Mantenibilidad | Formato, responsabilidades, funciones ≤150 líneas | Reportes y revisión de código |
| Calidad de integración | Pruebas, build, dependencias y Gate del commit final | CI/Quality Gate aprobados |
| Documentación | Contratos, cambios de esquema y RF→HU→TC consistentes | Diff, matriz y evidencias |
| Demostración | Flujo UI→API→MySQL en entorno acordado | Revisión del equipo/asesor y aceptación |

Checklist de cierre:

- [ ] Las doce pruebas base y controles complementarios aplicables se ejecutaron; no hay tests omitidos presentados como aprobados.
- [ ] Datos sintéticos aislados; ninguna prueba actuó sobre la base real.
- [ ] No existe alta pública de admin ni escalamiento mediante PATCH de perfil.
- [ ] Se verificaron todas las condiciones de la tabla y la DoD original.
- [ ] Observaciones/defectos tienen responsable y resolución; no hay bloqueantes de seguridad/integridad.
- [ ] Se registró revisión/retrospectiva sin cambiar el alcance de los ocho sprints.

**El sprint queda incompleto** si falta resolver una decisión que afecta su aceptación, si el acceso sigue siendo una demo local, si falla un control obligatorio o si no existe evidencia del Gate. Registrar el impedimento y la propuesta; no avanzar declarando una finalización ficticia.

## 18. Orden resumido para trabajar manualmente

1. Confirmar I0 y resolver decisiones que condicionan la historia.
2. Rama, evidencia, contrato y Gherkin.
3. Base aislada de pruebas y protección previa a cualquier recreación de tablas.
4. Migraciones/modelos/semillas mínimos del incremento.
5. Registro de cliente → registro técnico pendiente.
6. Login/logout → permisos y aprovisionamiento restringido.
7. Perfil propio con versión → catálogo desde API.
8. Integrar React por cada flujo, conservando la interfaz existente.
9. Pest → fixtures E2E → Cypress → controles complementarios.
10. Build, análisis, Gate, documentación, PR y demostración de la DoD.

Esta entrega proporciona instrucciones y plantillas de pruebas. Los servicios de negocio descritos deben implementarse manualmente; no son código ya instalado ni una afirmación de que el sprint esté terminado.
