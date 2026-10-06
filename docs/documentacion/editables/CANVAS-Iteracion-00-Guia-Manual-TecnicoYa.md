# Iteración 0 · Guía manual de instalación, configuración y estructura

**Proyecto:** TécnicoYa Huancayo · MVP  
**Fecha:** 5 de octubre de 2026 · **Versión:** 1.0  
**Estado:** procedimiento y plantillas para ejecución manual. No acredita instalación completa, migración, pruebas aprobadas ni despliegue.

## 1. Resultado esperado y entorno elegido

Al terminar tendrás React, Laravel y MySQL comunicándose; Sanctum y Reverb instalados; un entorno de calidad con SonarQube; carpetas iniciales, control de versiones y un endpoint que comprueba la conexión real con MySQL. Registrarás las comprobaciones antes de comenzar Sprint 1.

**Entorno de esta guía: Docker Compose en local y Docker Compose en el servidor.** En Windows se utiliza Docker Desktop con contenedores Linux. El PHP de XAMPP que ya tienes puede servir para herramientas de consola; no es necesario iniciar Apache ni la base incluida en XAMPP para seguir la ruta principal.

Esto conserva el entorno previsto en el [diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md). La alternativa con PHP de XAMPP se explica en la sección 14; no se mezclan ambas formas de ejecutar la API simultáneamente.

### Alcance

| Se prepara en Iteración 0 | Se implementa después, sin alterar los ocho sprints |
|---|---|
| Dependencias, conexión, carpetas y herramientas | Registro, login funcional, RBAC y catálogo: Sprint 1 |
| Instalación y conexión básica de Reverb/Echo | Canales privados del negocio, eventos, SLA y reasignación: Sprint 4 |
| Procesos de cola y programador listos | Jobs de 10 minutos, 24 y 48 horas en sus sprints correspondientes |
| SonarQube iniciado y proyecto creado | Análisis continuo por incremento; Quality Gate final y despliegue: Sprint 8 |
| Pruebas de salud del entorno | Casos funcionales de los ocho CANVAS de sprint |

Instalar Sanctum no implementa el inicio de sesión. Abrir un WebSocket no demuestra entrega de notificaciones. Iniciar SonarQube no equivale a haber aprobado un análisis.

### Fuentes y continuidad

- [Análisis del MVP](CANVAS-Analisis-MVP-TecnicoYa.md), derivado de Fuente 0 y aclaraciones.
- [Diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md) y [estructura de carpetas](CANVAS-Estructura-Carpetas-TecnicoYa.md).
- [Plan de ocho sprints](sprints-01-08/CANVAS-Plan-Sprints-01-08.md) y [backlog técnico](CANVAS-Backlog-Tecnico-Implementacion-TecnicoYa.md).
- Documentación oficial enlazada en los pasos para instalación. No se usa para cambiar requisitos del negocio.

## 2. Antes de ejecutar: distinguir proyecto nuevo y repositorio actual

Tu repositorio ya contiene `backend/api`, `frontend/web`, Dockerfiles, migraciones y un Compose histórico con PostgreSQL/Python. No ejecutes `create-project` ni `create vite` encima de esas carpetas.

**Ruta A — laboratorio limpio:** sigue los pasos de creación en una carpeta nueva, por ejemplo `C:\Users\James\Documents\ChatGPT\TecnicoYa-Iteracion0`. Permite aprender y verificar la base objetivo sin tocar el proyecto existente. El laboratorio no sustituye automáticamente el producto.

**Ruta B — adaptación del proyecto existente:** conserva el código, omite la creación de Laravel/React y aplica cambios pequeños en una rama. Revisa primero esta matriz:

| Hallazgo comprobado | Acción necesaria en la adaptación |
|---|---|
| `config/database.php` solo declara `pgsql` y `sqlite` | Incorporar una conexión MySQL compatible con Laravel 12, conservando las conexiones existentes mientras dure la transición. Usar `DB_DATABASE` y `DB_USERNAME` en la nueva conexión. |
| Hay cuatro migraciones de negocio históricas | Revisar SQL específico de PostgreSQL, claves, tipos y orden. No ejecutar el conjunto a ciegas contra MySQL ni contra datos de uso real. |
| El Dockerfile actual instala el controlador PostgreSQL | Añadir un Dockerfile local independiente con `pdo_mysql`; no sustituir el archivo de despliegue vigente en este paso. |
| Existe autenticación propia con middleware `token` y JWT | Instalar Sanctum sin borrar rutas ni cambiar su significado. La transición de login/RBAC necesita pruebas y corresponde al Sprint 1. |
| No se observan migraciones estándar de sesiones/cache/jobs | Crearlas cuando corresponda, evitando tablas duplicadas. Revisar también sus archivos de configuración. |
| Hay interfaz y pruebas existentes | Conservar diseño y pruebas. Los ejemplos de página de salud son temporales; no reemplazan `App` del producto. |

**Punto de control:** el recorrido de arranque de esta guía es directamente aplicable al esqueleto Laravel nuevo. En el repositorio histórico, la conexión y las migraciones son una adaptación pendiente; no basta copiar las variables de entorno. El endpoint de salud puede verificarse antes de migrar tablas de negocio.

Nunca uses `migrate:fresh`, `git reset --hard` ni `docker compose down -v` como solución genérica a errores de instalación. La base del laboratorio tiene nombre y volumen separados.

## 3. Instalación y comprobación de herramientas en Windows

Abre PowerShell en Visual Studio Code. Los comandos PowerShell de esta guía se ejecutan desde la raíz del proyecto salvo que el paso indique otra ubicación. Los comandos de servidor están marcados como Bash.

### 3.1 Inventario observado

Se consultaron versiones; no se instalaron ni actualizaron herramientas:

| Herramienta | Detectado en este equipo | Uso en la guía |
|---|---|---|
| PHP | 8.2.12, `C:\xampp\php\php.exe` | Herramienta local existente; contenedor de aplicación PHP 8.3 |
| Composer | 2.10.3 | Crear el esqueleto; dependencias de ejecución dentro del contenedor |
| Node | 24.19.0 | React y herramientas de pruebas; contenedor Node 24 |
| Docker Compose | 5.5.1 | Orquestación; versión de CLI no confirma que el motor esté encendido |
| Git | Ejecutable disponible; repositorio existente | Ramas, revisiones y registro de cambios |

Se conserva Laravel 12, la versión mayor declarada por el backend. No se aprovecha esta iteración para actualizarlo a Laravel 13. El frontend existente conserva sus versiones y lockfile; una plantilla React nueva puede resolver versiones distintas y no autoriza actualizar el producto.

### 3.2 PHP

1. Si ya tienes PHP, identifica cuál usará la terminal:

```powershell
Get-Command php
php -v
php --ini
php -m
```

2. En una máquina nueva, descarga PHP para Windows desde [PHP oficial](https://www.php.net/downloads.php?os=windows). Instala el runtime Visual C++ requerido por esa compilación y añade su carpeta al `PATH`. Si usas PHP independiente, crea `php.ini` a partir de `php.ini-development`.
3. Comprueba las extensiones requeridas por Composer/Laravel y por la conexión: OpenSSL, PDO, `pdo_mysql`, Mbstring, Fileinfo, XML, cURL y Zip. Habilita extensiones en el `php.ini` que muestre `php --ini`, no en una copia distinta.
4. Reinicia la terminal tras cambiar `PATH`. No reemplaces el PHP de XAMPP sin revisar sus dependencias. El Dockerfile adjunto instala las extensiones de la ejecución Linux.

Referencia: [instalación manual de PHP en Windows](https://www.php.net/manual/en/install.windows.manual.php).

### 3.3 Composer

1. Descarga y ejecuta `Composer-Setup.exe` desde [Composer oficial](https://getcomposer.org/doc/00-intro.md).
2. Selecciona el `php.exe` correcto durante la instalación.
3. Abre otra terminal y comprueba:

```powershell
composer --version
composer diagnose
```

No uses `--ignore-platform-reqs` para ocultar incompatibilidades. Corrige la versión o extensión que indique Composer.

### 3.4 Node y Git

1. Instala Node 24 LTS desde [Node.js](https://nodejs.org/en/download) en un equipo nuevo. En este equipo ya está presente; no agregues otro instalador encima del administrador de versiones existente.
2. Instala Git desde [Git para Windows](https://git-scm.com/install/windows).
3. Comprueba:

```powershell
node -v
npm -v
git --version
```

### 3.5 Docker Desktop y MySQL

1. Habilita virtualización y WSL 2 siguiendo [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Si WSL no está instalado, ejecuta `wsl --install` en PowerShell como administrador y reinicia cuando lo solicite Windows.
3. Instala Docker Desktop, selecciona el motor WSL 2 y los contenedores Linux. Abre Docker Desktop y espera a que el motor esté listo.
4. Verifica:

```powershell
wsl --status
docker version
docker compose version
docker run --rm hello-world
```

**MySQL se instala mediante la imagen `mysql:8.4` del Compose del paso 7.** No necesitas instalar otra instancia nativa ni activar la base de XAMPP. El host tendrá acceso opcional por `localhost:3307`; los contenedores usarán `mysql:3306`. Un cliente gráfico es opcional. Referencia: [MySQL con Docker](https://dev.mysql.com/doc/refman/8.4/en/docker-mysql-getting-started.html).

## 4. Repositorio y ramas

### Ruta A: solo en una carpeta nueva

```powershell
$labPath = 'C:\Users\James\Documents\ChatGPT\TecnicoYa-Iteracion0'
if (Test-Path -LiteralPath $labPath) { throw 'La carpeta ya existe. No recrearla.' }
New-Item -ItemType Directory -Path $labPath
Set-Location -LiteralPath $labPath
git init -b main
git config --local user.name 'TU NOMBRE'
git config --local user.email 'TU CORREO DE GIT'
```

Crea `README.md` con el nombre y propósito del laboratorio. Crea `.gitignore` antes del primer commit:

```gitignore
**/.env
**/.env.*
!**/.env.example
!**/*.env.example
**/vendor/
**/node_modules/
**/dist/
**/coverage/
**/.phpunit.cache/
**/storage/logs/*
**/cypress/screenshots/
**/cypress/videos/
.scannerwork/
```

```powershell
git add README.md .gitignore
git commit -m "docs: iniciar laboratorio de iteracion 0"
git switch -c develop
git switch -c codex/iteracion-0
```

### Ruta B: repositorio actual

```powershell
Set-Location -LiteralPath 'C:\Users\James\Documents\ChatGPT\Software TecnicoYa-Huancayo'
git status --short
git branch --show-current
git switch -c codex/iteracion-0
```

Si esa rama existe, usa `git switch codex/iteracion-0`. Los cambios sin commit pueden viajar con la rama: identifica su autor y alcance antes de incluirlos en un commit. No modifiques ni fuerces la rama remota por seguir este ejemplo.

Propuesta sencilla: `main` conserva versiones aceptadas; `develop` integra incrementos; `codex/iteracion-0` contiene esta preparación. Si el equipo ya utiliza otra convención, mantén la existente y documenta la equivalencia. Los sprints son unidades de trabajo; las ramas no reemplazan la revisión y aceptación de cada sprint.

Cuando tengas un repositorio remoto vacío, puedes enlazar su URL real con `git remote add origin URL_DEL_REPOSITORIO`. Revisa `git remote -v` antes: no agregues un segundo `origin`. Publica únicamente commits revisados; nunca archivos `.env` ni documentos privados de usuarios.

## 5. Crear Laravel, React y carpetas

### Solo Ruta A: creación de los proyectos

Desde la raíz del laboratorio:

```powershell
New-Item -ItemType Directory -Force backend, frontend, infrastructure, database, docs
composer create-project laravel/laravel backend/api "^12.0" --no-scripts
npm create vite@latest frontend/web -- --template react
```

Si Vite pregunta si debe instalar e iniciar inmediatamente, termina la creación sin dejar un servidor abierto: instalaremos explícitamente a continuación. `--no-scripts` evita ejecutar automáticamente la preparación de Laravel antes de configurar el entorno. Si no existe `backend/api/.env`, créalo con la plantilla del paso 6. Referencias: [Laravel 12](https://laravel.com/framework/docs/12.x/installation) y [Vite](https://vite.dev/guide/).

### Ambas rutas: estructura mínima

```powershell
$folders = @(
  'backend/api/docker',
  'backend/api/app/Modules',
  'backend/api/app/Shared',
  'frontend/web/src/lib',
  'frontend/web/cypress/e2e',
  'infrastructure',
  'docs/evidencias/iteracion-00'
)
$folders | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ }
```

En `app/Modules/README.md` registra los módulos previstos: ARequests, BMatching, COffers, DService, ERatings y FAdministration. Sus clases y subcarpetas se crean cuando una historia las necesita. Los portales cliente, técnico y administrador compartirán React; no crees tres aplicaciones independientes.

No elimines `python/`, `domain/`, pruebas o archivos históricos del repositorio existente. Su transición se controla por separado.

## 6. Preparar archivos de configuración

Las [plantillas adjuntas](iteracion-00/plantillas/) están guardadas dentro de la documentación. **No están instaladas en la aplicación.** Copia su contenido a estos destinos, siempre respecto a la raíz del proyecto donde estés ejecutando el laboratorio:

| Plantilla | Destino |
|---|---|
| [Dockerfile.local](iteracion-00/plantillas/Dockerfile.local) | `backend/api/docker/Dockerfile.local` |
| [docker-compose.iter0.yml](iteracion-00/plantillas/docker-compose.iter0.yml) | `infrastructure/docker-compose.iter0.yml` |
| [docker.env.example](iteracion-00/plantillas/docker.env.example) | `infrastructure/.env.docker` para secretos locales; una copia vacía en `infrastructure/.env.example` |
| [backend.env.example](iteracion-00/plantillas/backend.env.example) | `backend/api/.env`, solo en proyecto nuevo |
| [frontend.env.example](iteracion-00/plantillas/frontend.env.example) | `frontend/web/.env.local` |

En el repositorio existente combina las variables necesarias con sus archivos actuales, conservando las demás. Guarda también ejemplos sin secretos en `.env.example`; no sobrescribas una `APP_KEY` existente. Usa UTF-8 sin BOM para los archivos de entorno y configuración.

### Secretos y puertos

En `infrastructure/.env.docker`, completa tres contraseñas distintas: `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` y `SONAR_DB_PASSWORD`. Puedes generar cada valor localmente con:

```powershell
php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
```

No pegues esos valores en documentación, capturas o Git. Compose proporciona `DB_PASSWORD` a Laravel: no necesitas duplicarlo en el `.env` del backend mientras uses los contenedores. Los campos son obligatorios incluso si todavía no arrancas SonarQube, porque Compose resuelve la configuración completa.

| Dirección | Desde dónde se usa | Significado |
|---|---|---|
| `http://localhost:5173` | Navegador | React |
| `http://localhost:8000` | Navegador | API |
| `mysql:3306` | Laravel dentro de Docker | Base del producto |
| `localhost:3307` | Cliente de BD en Windows | La misma base MySQL |
| `reverb:8080` | Laravel dentro de Docker | Publicar eventos |
| `localhost:8080` | Echo en el navegador | Conectar por WebSocket |
| `http://localhost:9000` | Navegador local | SonarQube |

Usa `localhost` de manera consistente al abrir React y API; no lo alternes con `127.0.0.1` durante las pruebas de cookies. Si ya corre Vite en 5173, detén tu proceso anterior desde su terminal antes de iniciar otro, o cambia coordinadamente puerto, CORS, variables y pruebas.

`VITE_*` se incorpora al JavaScript público: nunca contiene contraseñas, `APP_KEY` ni `REVERB_APP_SECRET`. La clave `REVERB_APP_KEY` identifica públicamente la aplicación y sí se comparte con Echo.

## 7. Docker Compose y primer arranque de MySQL

El Compose adjunto es **local y separado del Compose histórico**. Define servicios `mysql`, `api`, `frontend` y perfiles opcionales `realtime`, `async` y `quality`. Usa volúmenes separados para datos y dependencias Linux. No reutiliza el `vendor` ni los `node_modules` de Windows.

En la raíz del proyecto, define este arreglo al abrir cada terminal PowerShell:

```powershell
$dc = @('--env-file', 'infrastructure/.env.docker', '-f', 'infrastructure/docker-compose.iter0.yml')
docker compose @dc config --quiet
docker compose @dc build api
docker compose @dc up -d mysql
docker compose @dc ps
```

Espera a que MySQL indique `healthy`. Si falla:

```powershell
docker compose @dc logs --tail 80 mysql
```

El healthcheck de MySQL solo indica que responde el proceso. El endpoint posterior comprueba la conexión con las credenciales de Laravel. Si cambias contraseñas después de inicializar el volumen, editar `.env.docker` no cambia automáticamente las cuentas ya creadas en MySQL: actualiza la cuenta mediante un procedimiento controlado, sin borrar datos.

Instala dependencias del backend dentro de Linux:

```powershell
docker compose @dc run --rm api composer install
docker compose @dc run --rm api composer check-platform-reqs
```

**Solo si `APP_KEY` está vacía en este entorno nuevo:**

```powershell
docker compose @dc run --rm api php artisan key:generate
```

Las imágenes usan etiquetas de familia para el primer arranque. Antes de cerrar la iteración registra sus versiones y digests, y fija esos digests en la configuración aceptada. No actualices imágenes de servidor solo porque una etiqueta cambió.

## 8. Instalar Sanctum y Reverb

### 8.1 Sanctum

En un Laravel nuevo:

```powershell
docker compose @dc run --rm api php artisan install:api
```

Si ofrece ejecutar migraciones, responde **no** hasta revisar el paso 9. En el repositorio existente, revisa antes `git diff` y el contenido de rutas; el instalador no debe reemplazar tus endpoints. Si las rutas API ya están registradas, puedes instalar el paquete con `composer require laravel/sanctum` dentro del contenedor y aplicar manualmente la configuración siguiendo su documentación.

En `bootstrap/app.php`, agrega `$middleware->statefulApi();` dentro del callback `withMiddleware` existente. Conserva sus aliases y demás configuración:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
    // Conservar aquí la configuración existente.
})
```

Comprueba que `withRouting` incluya `api: __DIR__.'/../routes/api.php'`. La SPA usará sesión y CSRF; no guardes tokens de login en `localStorage`. El Sprint 1 implementará los endpoints de registro/login/logout y permisos. [Referencia Sanctum SPA](https://laravel.com/framework/docs/12.x/sanctum#spa-authentication).

### 8.2 Reverb

```powershell
docker compose @dc run --rm api php artisan install:broadcasting
```

Selecciona **Reverb** si pregunta por el proveedor. Acepta instalar sus dependencias PHP. Si propone instalar dependencias JavaScript en Laravel, omite esa parte: React vive en otro módulo y se configura más adelante.

Comprueba `config/broadcasting.php`, `config/reverb.php`, `routes/channels.php` y el registro de broadcasting en `bootstrap/app.php`. Conserva las credenciales generadas por el instalador; completa el `.env` sin duplicar nombres de variable. Ajusta:

```dotenv
REVERB_HOST=reverb
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

Dentro de la aplicación configurada en `config/reverb.php`, establece `allowed_origins` a `['localhost']` en el laboratorio. Son nombres de host; no agregues el esquema o la ruta. Conserva el resto del archivo generado. En el servidor se reemplazará por el dominio real. [Referencia de Reverb](https://laravel.com/framework/docs/12.x/reverb).

`REVERB_SERVER_*` indica dónde escucha el proceso; `REVERB_HOST` indica dónde publica Laravel; `VITE_REVERB_HOST` indica dónde se conecta el navegador. No son intercambiables dentro de Docker.

## 9. Tablas técnicas y configuración de sesiones/colas

### Laravel nuevo

Inspecciona las migraciones estándar. Normalmente incluyen usuarios/sesiones, cache y jobs. Ejecuta estos generadores **solo cuando no exista ya una migración equivalente**:

```powershell
docker compose @dc run --rm api php artisan make:session-table
docker compose @dc run --rm api php artisan make:cache-table
docker compose @dc run --rm api php artisan make:queue-table
docker compose @dc run --rm api php artisan make:queue-failed-table
```

En un esqueleto que ya contiene esas tablas, omite todos esos generadores. Revisa el SQL y luego migra la base vacía del laboratorio:

```powershell
docker compose @dc run --rm api php artisan migrate --pretend
docker compose @dc run --rm api php artisan migrate
docker compose @dc run --rm api php artisan migrate:status
```

Ahora cambia `SESSION_DRIVER=database` y `CACHE_STORE=database` en `backend/api/.env`; mantén `QUEUE_CONNECTION=database`. El esquema de negocio completo se incorporará por incrementos, no importando de golpe el SQL conceptual de referencia.

### Repositorio existente

Primero completa la adaptación del paso 2. No ejecutes los comandos anteriores hasta revisar las migraciones históricas y la configuración. Agregar MySQL y verificar `SELECT 1` es preparación; trasladar datos, estados y comportamiento corresponde a una migración del producto con pruebas, respaldo y rollback documentados.

La `APP_KEY` se conserva. Generar otra sobre datos cifrados existentes puede impedir su lectura. Esta guía no convierte automáticamente las cuentas históricas al esquema objetivo.

## 10. CORS y conexión React–API

### Laravel

```powershell
docker compose @dc run --rm api php artisan config:publish cors
```

Combina el archivo generado con la [plantilla CORS](iteracion-00/plantillas/cors.php). Permite el origen exacto `http://localhost:5173` y credenciales. La lista de rutas cubre API, CSRF y autorización del broadcasting. No uses `allowed_origins=['*']` con la sesión de la SPA. CORS no sustituye autenticación ni RBAC.

### React

Desde la raíz, instala las librerías en el frontend. Para el proyecto existente, `npm ci` primero conserva lo resuelto por su lockfile; para una plantilla nueva sin lockfile, usa `npm install`:

```powershell
Push-Location frontend/web
# Elegir uno: npm ci (con lockfile) o npm install (primer arranque sin lockfile).
npm install axios laravel-echo pusher-js
Pop-Location
docker compose @dc run --rm frontend npm ci
```

Copia [http.js](iteracion-00/plantillas/http.js) a `frontend/web/src/lib/http.js` y [echo.js](iteracion-00/plantillas/echo.js) a `frontend/web/src/lib/echo.js`. Fusiona si existen clientes HTTP o conexiones equivalentes. Completa `VITE_REVERB_APP_KEY` con la clave pública que generó Reverb.

La futura secuencia de autenticación será: `prepareSession()` → POST de login con credenciales/CSRF → GET del usuario autenticado. Todavía no debes considerar esa secuencia implementada. El cliente Echo adjunto solo prepara la conexión de transporte; el autorizador de canales privados y sus permisos se integrarán con la sesión y pruebas posteriores.

## 11. Endpoint de salud y arranque de la aplicación

Copia [HealthController.php](iteracion-00/plantillas/HealthController.php) a `backend/api/app/Http/Controllers/HealthController.php`. Agrega a `routes/api.php`, sin repetir imports existentes:

```php
use App\Http\Controllers\HealthController;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

Route::get('/v1/health', HealthController::class)
    ->withoutMiddleware([EnsureFrontendRequestsAreStateful::class]);
```

El archivo debe importar `Illuminate\Support\Facades\Route` si todavía no lo hace. Ubica esta ruta fuera de grupos autenticados. Es una excepción de salud sin datos personales; excluir el middleware de sesión permite responder 503 de manera controlada aunque MySQL no esté disponible. No excluyas ese middleware de las rutas del negocio.

Laravel añade `/api` a las rutas de `api.php`; el resultado será `/api/v1/health`. El controlador consulta MySQL y responde:

```json
{"status":"ok","database":"up"}
```

Si falla la conexión devuelve HTTP 503 y `{"status":"degraded","database":"down"}`, sin excepciones internas. No demuestra que Reverb, las colas o el esquema de negocio estén correctos; tienen comprobaciones independientes.

En un esqueleto nuevo, Laravel tiene además `/up` como comprobación de vida. El proyecto actual configura `/health`: conserva esa ruta o documenta el cambio, sin crear dos endpoints con el mismo nombre.

```powershell
docker compose @dc run --rm api php artisan config:clear
docker compose @dc up -d api frontend
docker compose @dc --profile realtime up -d reverb
docker compose @dc --profile async up -d worker scheduler
docker compose @dc ps
Invoke-RestMethod http://localhost:8000/api/v1/health
```

Comprueba visualmente React en `http://localhost:5173`. Para verificar la llamada desde React, incorpora temporalmente este efecto en un componente de diagnóstico del laboratorio, con `useEffect` importado:

```jsx
useEffect(() => {
  http.get('/api/v1/health')
    .then(({ data }) => console.info('API/MySQL:', data.status))
    .catch(() => console.error('No se pudo conectar con la API'));
}, []);
```

Importa `http` desde tu `src/lib/http.js`. En DevTools → Network comprueba la petición 200 y el JSON; no basta que se vea el HTML. En el producto existente usa un diagnóstico temporal y retíralo al terminar; no sustituyas la landing.

Para comprobar WebSocket importa `getEcho`/`disconnectEcho` del cliente y, temporalmente en el laboratorio, conéctalo en un efecto con limpieza:

```jsx
useEffect(() => {
  getEcho();
  return () => disconnectEcho();
}, []);
```

DevTools → Network → WS debe mostrar el cambio de protocolo 101 y establecimiento de conexión. No publiques eventos de usuarios en canales públicos para probar. El perfil `async` solo deja procesos listos; `--tries=1` es configuración de laboratorio, no una política de reintento del SLA. La política real, idempotencia y recuperación se diseñan por job en Sprint 4.

## 12. Arrancar SonarQube

SonarQube usa **su propia base PostgreSQL** en este entorno. MySQL sigue siendo la base del producto; no se está volviendo a la arquitectura histórica. SonarQube no utiliza MySQL entre sus bases compatibles. [Bases admitidas por SonarQube](https://docs.sonarsource.com/sonarqube-community-build/server-installation/installing-the-database).

1. Asigna memoria suficiente a Docker Desktop para MySQL, la aplicación y SonarQube. Como punto de partida de laboratorio, reserva aproximadamente 8 GB si tu equipo lo permite y mide consumo; no es una garantía de capacidad.
2. Revisa los límites del kernel Linux donde corre Docker: `vm.max_map_count >= 524288`, `fs.file-max >= 131072`; el Compose incluye límites de archivos/procesos del contenedor. [Requisitos Linux oficiales](https://docs.sonarsource.com/sonarqube-community-build/server-installation/pre-installation/linux).
3. En Docker Desktop/WSL, identifica primero las distribuciones:

```powershell
wsl --list --verbose
```

Si existe `docker-desktop` y permite acceso, comprueba y ajusta allí, no en una distribución Ubuntu ajena al motor:

```powershell
wsl -d docker-desktop -u root sysctl vm.max_map_count fs.file-max
wsl -d docker-desktop -u root sysctl -w vm.max_map_count=524288
wsl -d docker-desktop -u root sysctl -w fs.file-max=131072
```

No reduzcas valores si ya son superiores. Estos cambios pueden perderse al reiniciar Docker Desktop: compruébalos después de reiniciar. Si tu instalación no expone esa distribución, configura el kernel del backend real siguiendo la documentación de tu versión; no desactives las comprobaciones de Elasticsearch para ocultarlo.

4. Descarga la imagen inicial y registra su identidad:

```powershell
docker pull sonarqube:community
docker image inspect --format '{{index .RepoDigests 0}}' sonarqube:community
```

Pega el digest devuelto como `SONAR_IMAGE=sonarqube@sha256:...` en `infrastructure/.env.docker`. No copies literalmente los puntos suspensivos. Para las demás imágenes registra también sus digests al finalizar.

5. Arranca el perfil de calidad:

```powershell
docker compose @dc --profile quality up -d sonarqube
docker compose @dc logs --tail 100 sonarqube
Invoke-RestMethod http://localhost:9000/api/system/status
```

Espera a `status: UP`; durante la inicialización puede aparecer otro estado. Abre `http://localhost:9000`, inicia con las credenciales iniciales `admin` / `admin` y cambia inmediatamente la contraseña. Crea un proyecto local con clave `tecnicoya-huancayo`; guarda cualquier token de análisis fuera del repositorio. [Instalación oficial mediante Docker](https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-docker-image/set-up-and-start-container).

En I0 se registra disponibilidad y proyecto creado. El scanner, reportes de cobertura y umbrales deben incorporarse progresivamente con las pruebas; no declares un Quality Gate aprobado por iniciar el servidor. No abras 9000 a Internet para esta práctica.

## 13. Preparar Pest, Cypress y evidencias BDD

Estos pasos no reemplazan los 118 casos previstos de los sprints. Los identificadores de entorno son `TC-I0-*` para no renumerar ese catálogo.

### Pest

Para Laravel 12 y PHPUnit 11, esta guía propone Pest 3 y plugin Laravel 3. El plugin exige Laravel 12.25 o superior dentro de la rama 12; verifica el lockfile antes de aceptar una actualización menor. [Compatibilidad declarada por el plugin](https://raw.githubusercontent.com/pestphp/pest-plugin-laravel/3.x/composer.json).

```powershell
docker compose @dc run --rm api composer show laravel/framework
docker compose @dc run --rm api composer require --dev "pestphp/pest:^3.8" "pestphp/pest-plugin-laravel:^3.0" --with-all-dependencies
docker compose @dc run --rm api php vendor/pestphp/pest/bin/pest --init
```

Si existe `tests/Pest.php`, intégralo sin borrarlo. Comprueba que las pruebas Feature usen `Tests\TestCase`. Copia [HealthTest.php](iteracion-00/plantillas/HealthTest.php) a `backend/api/tests/Feature/HealthTest.php` y ejecuta únicamente esa prueba inicialmente:

```powershell
docker compose @dc run --rm api php vendor/pestphp/pest/bin/pest tests/Feature/HealthTest.php
```

Sus dos escenarios usan un doble de la conexión para verificar HTTP 200/503 y ausencia de información interna. La llamada real del paso 11 valida MySQL. No agregues `RefreshDatabase` a esta prueba de entorno. Antes de pruebas que escriban datos, crea una base y credenciales de testing separadas; nunca apuntes a la base con datos reales.

### Cypress

En Windows, para que Cypress abra su navegador:

```powershell
Push-Location frontend/web
npm install --save-dev cypress
Pop-Location
```

Copia [cypress.config.js](iteracion-00/plantillas/cypress.config.js) a `frontend/web/cypress.config.js` y [health.cy.js](iteracion-00/plantillas/health.cy.js) a `frontend/web/cypress/e2e/health.cy.js`. Si ya hay configuración, incorpora el caso conservando la existente.

```powershell
docker compose @dc run --rm frontend npm ci
Push-Location frontend/web
npx cypress open
# Alternativa sin interfaz:
npx cypress run --spec cypress/e2e/health.cy.js
Pop-Location
```

React y API deben estar activos. `cy.request` verifica API/MySQL, pero no prueba CORS del navegador; esa comprobación se realiza desde React en el paso 11. Registrar un caso en Gherkin tampoco lo automatiza por sí solo: sus expectativas deben quedar implementadas en Pest/Cypress.

### Casos de aceptación de I0

| ID | Dado / Cuando / Entonces | Evidencia prevista |
|---|---|---|
| TC-I0-01 | Dado Docker activo, cuando inicio MySQL, entonces queda saludable | Estado y versión sin credenciales |
| TC-I0-02 | Dada la API configurada, cuando consulto salud, entonces obtengo 200 y BD disponible | Respuesta real y prueba Pest |
| TC-I0-03 | Dada una excepción de conexión, cuando consulto salud, entonces recibo 503 sin detalles internos | Prueba Pest con fallo simulado |
| TC-I0-04 | Dado React en el origen autorizado, cuando llama a la API, entonces puede leer el JSON | Network del navegador y consola sin error CORS |
| TC-I0-05 | Dada la configuración SPA, cuando solicito CSRF, entonces se establece la cookie correspondiente | Petición `/sanctum/csrf-cookie` con credenciales; sin capturar sus valores |
| TC-I0-06 | Dado Echo con clave pública válida, cuando se conecta, entonces se establece WebSocket | HTTP 101; no acredita canales privados |
| TC-I0-07 | Dado SonarQube iniciado, cuando consulto estado, entonces devuelve UP | Estado, versión y proyecto creado |
| TC-I0-08 | Dadas variables locales con secretos, cuando reviso Git, entonces no están versionadas | `git check-ignore` y revisión del diff preparado |

## 14. Alternativa local con PHP de XAMPP

No es la ruta principal de esta guía. Sirve si decides ejecutar Laravel/React directamente en Windows manteniendo MySQL y SonarQube en Docker. XAMPP distribuye MariaDB en sus versiones modernas; eso no equivale a adoptar MySQL para este proyecto. [FAQ de XAMPP](https://www.apachefriends.org/faq_windows.html).

1. Detén `api`, `frontend`, `reverb`, `worker` y `scheduler` del Compose antes de usar los mismos puertos de forma nativa. Mantén `mysql`.
2. Para esta alternativa cambia en el `.env` del backend: `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_DATABASE=tecnicoya_iter0`, `DB_USERNAME=tecnicoya` y la misma contraseña local de MySQL. Cambia `REVERB_HOST=127.0.0.1`; conserva el puerto 8080.
3. Verifica que PHP de Windows tenga `pdo_mysql`. Instala dependencias nativas con `composer install` en `backend/api` y `npm ci` en `frontend/web`; los volúmenes Linux no sirven como dependencias nativas.
4. En terminales distintas, desde el backend ejecuta `php artisan serve --host=127.0.0.1 --port=8000`, `php artisan reverb:start --host=127.0.0.1 --port=8080`, `php artisan queue:work` y `php artisan schedule:work`. Desde el frontend ejecuta `npm run dev -- --port 5173`.
5. Abre el navegador usando `localhost` y repite las verificaciones. El servidor Apache de XAMPP no es necesario para `artisan serve`. Si una dependencia exige una extensión no disponible en Windows, vuelve a la ruta Docker y no ignores el requisito.

No alternes entornos sin restaurar los hosts apropiados. Docker usa nombres de servicio; Windows usa puertos publicados. Documenta cuál elegiste en el acta de I0.

## 15. Preparar el servidor Linux para Docker Compose

**Supuesto operativo propuesto:** servidor Ubuntu 24.04 LTS con acceso SSH. El proveedor, dominio y capacidad todavía no están definidos por esta guía. No se considera que exista un despliegue porque se documenten estos pasos.

En un servidor nuevo sin paquetes Docker incompatibles, instala el motor desde el repositorio oficial. Estos comandos son **Bash en el servidor**, no PowerShell en Windows:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

Si ya tiene Docker u otros contenedores, revisa la instalación antes de modificar paquetes o reiniciar servicios. [Procedimiento oficial para Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

Si alojas SonarQube en ese host, configura los límites del kernel de forma persistente en un archivo de `/etc/sysctl.d/`, respetando valores superiores ya existentes:

```text
vm.max_map_count=524288
fs.file-max=131072
```

Aplica con `sudo sysctl --system` y verifica los valores. En I0 basta preparar herramientas/accesos y documentar la decisión; no necesitas publicar el producto.

**Para el despliegue público del Sprint 8**, se necesita una configuración de producción distinta: frontend compilado, servidor web/reverse proxy y PHP-FPM, TLS/WSS, dominio real, cookies seguras, `APP_DEBUG=false`, imágenes fijadas, secretos de servidor, procesos de cola/scheduler supervisados, respaldos y restauración probada. No publiques `artisan serve`, Vite ni este Compose local como solución de producción. MySQL y SonarQube permanecen en redes restringidas. Se conserva el objetivo de mismo origen para frontend/API y canales privados autorizados.

## 16. Verificación final y Definition of Done

Desde la raíz y con `$dc` definido:

```powershell
docker compose @dc config --quiet
docker compose @dc ps
docker compose @dc exec api php artisan route:list --path=api/v1/health
Invoke-RestMethod http://localhost:8000/api/v1/health
Invoke-RestMethod http://localhost:9000/api/system/status
docker compose @dc exec api php artisan schedule:list
git check-ignore backend/api/.env frontend/web/.env.local infrastructure/.env.docker
git status --short
```

`schedule:list` vacío es válido en I0: todavía no existen las tareas de negocio. Para CORS, además de la petición real de React, puedes inspeccionar el preflight:

```powershell
curl.exe -i -X OPTIONS http://localhost:8000/api/v1/health -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Content-Type"
```

Debe permitir el origen exacto y credenciales. Una llamada sin `Origin` desde PowerShell no valida CORS. Para CSRF, usa `prepareSession()` desde React y comprueba el 204 y la cookie; no registres su valor como evidencia pública.

### I0 puede cerrarse cuando

- [ ] Entorno elegido y versiones/digests registrados; Docker funciona tras reiniciar.
- [ ] Repositorio/rama definidos; archivos sensibles ignorados y ausencia de secretos en los commits.
- [ ] Laravel y React arrancan desde instrucciones reproducibles; se conservan lockfiles.
- [ ] MySQL es accesible con usuario de aplicación y la API devuelve 200 de salud.
- [ ] React consume esa respuesta en navegador sin errores CORS.
- [ ] Sanctum está instalado y CSRF responde; login/RBAC quedan identificados para Sprint 1.
- [ ] Reverb/Echo establecen conexión; reglas de canales privados pendientes de sus sprints.
- [ ] Procesos async arrancan sin errores de tablas; no se afirman SLA implementados.
- [ ] SonarQube está UP y su contraseña inicial fue reemplazada.
- [ ] Pruebas de salud previstas ejecutadas, resultados y defectos registrados.
- [ ] Si se trabaja en el repositorio existente, se ha documentado y verificado su adaptación técnica; una demostración en el laboratorio no se presenta como migración del producto.
- [ ] Revisión del incremento y pendientes aprobados para pasar al Sprint 1, sin alterar los ocho sprints.

Guarda en `docs/evidencias/iteracion-00/`: versiones, comandos utilizados, respuestas sin secretos, resultado real de TC-I0, defectos y acta de revisión. Para cada prueba registra fecha, entorno, commit, esperado, obtenido y estado. Mantén NO EJECUTADO hasta tener evidencia.

Antes del commit, revisa los cambios de Composer/npm y los archivos preparados con `git diff` y `git diff --cached`. Añade explícitamente los archivos de esta iteración con `git add RUTAS_REVISADAS`; no uses una inclusión indiscriminada si hay trabajo previo. Crea el commit y solicita la revisión del equipo según su flujo habitual.

### Problemas frecuentes

| Síntoma | Revisar |
|---|---|
| Docker muestra solo cliente o error de conexión | Abrir Docker Desktop y esperar al motor Linux |
| `Database connection [mysql] not configured` | Adaptar `config/database.php`; el proyecto histórico no tiene esa conexión |
| `could not find driver` | `pdo_mysql` en el PHP que realmente ejecuta Laravel; reconstruir imagen si se modificó Dockerfile |
| MySQL saludable pero API en 503 | Usuario/contraseña/base y host; `localhost` no apunta a MySQL dentro del contenedor API |
| Tabla `sessions`, `cache` o `jobs` inexistente | Migraciones técnicas y driver activo; no borrar la BD |
| 419 al autenticar en etapas posteriores | CSRF previo, envío de cookies y header, mismo hostname y origen autorizado |
| React funciona en PowerShell pero falla en navegador | CORS y puerto/origen exactos |
| Reverb rechaza el origen | `allowed_origins`, hostname y credenciales públicas coincidentes |
| SonarQube reinicia | Memoria, logs de Elasticsearch, límites del kernel real y conexión a su PostgreSQL |
| Cambiar `.env` no cambia el comportamiento | `config:clear`, recrear servicios que reciben `env_file` y reiniciar Vite |

Para aplicar cambios de entorno a procesos ya activos, recrea los servicios pertinentes con `docker compose @dc up -d --force-recreate api frontend` y, si estaban habilitados, sus perfiles. Para terminar el laboratorio utiliza `docker compose @dc --profile realtime --profile async --profile quality stop`; conserva volúmenes y datos.

## 17. Relación con calidad y seguridad

I0 deja evidencia verificable del proceso: entradas, responsable, tareas, criterios de aceptación, resultados y pendientes. Eso apoya el enfoque por procesos de ISO 9001. Las comprobaciones de disponibilidad/configuración apoyan los objetivos de calidad de ISO/IEC 25010; secretos, permisos y exposición mínima apoyan ISO/IEC 27001/27701; planificación, registro y escenarios de prueba se relacionan con ISO/IEC/IEEE 29119 (2, 3 y 4).

Estas relaciones no acreditan certificación ni cumplimiento integral. DevSecOps implica incorporar seguridad y pruebas desde la preparación; BDD expresa comportamientos comprobables; Scrum mantiene los ocho incrementos aprobados; SOLID orientará las responsabilidades al implementar los módulos, sin crear abstracciones vacías en esta instalación.
