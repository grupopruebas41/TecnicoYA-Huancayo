# Calidad local del Sprint 1

Configuración separada en `docker-compose.quality.yml`, perfil `quality`. No arranca el compose histórico ni cambia PostgreSQL/MySQL del producto. PostgreSQL 16 es exclusivamente la base interna de SonarQube. Las tres imágenes están fijadas por digest consultado el 2026-10-06.

**Evidencia de esta entrega:** ver `docs/documentacion/evidencias/sprint-01/continuacion/INFORME.md`. El servidor se ejecuta con el perfil `quality`. El scanner puede ejecutarse en su contenedor o desde Windows con la misma configuración del proyecto.

## Arranque desde la raíz del repositorio

1. Comprobar `docker info`. Si falla, recuperar Docker Desktop antes de continuar. No restablecerlo a valores de fábrica: los volúmenes contienen datos.
2. Preparar `infrastructure/.env.quality.local` a partir de `.env.quality.example`, con una contraseña aleatoria para `SONAR_DB_PASSWORD`. Este archivo está ignorado por Git. En el equipo de esta entrega ya está preparado; conservarlo. No compartir su contenido.
3. Arrancar únicamente los servicios persistentes:

```powershell
docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality config --quiet
docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality up -d sonarqube
Invoke-RestMethod http://127.0.0.1:9000/api/system/status
```

Esperar a que `status` sea `UP`. Ante un fallo, consultar `docker compose ... logs sonarqube` usando los mismos argumentos de archivo y entorno. El equipo debe disponer de recursos para SonarQube (referencia oficial: 4 GB de RAM para una instalación pequeña), PostgreSQL y el scanner; no ejecutar a la vez los navegadores E2E. Cumplir los prerrequisitos de Elasticsearch del host Linux de Docker; no deshabilitar sus comprobaciones para forzar el arranque.

En este equipo, el límite de mapas de memoria del host WSL era 262144; se ajustó temporalmente al mínimo oficial de 524288. Después de reiniciar Docker/WSL, comprobarlo y, si hace falta, repetir:

```powershell
wsl -d docker-desktop -u root -- sysctl -w vm.max_map_count=524288
```

Este ajuste no cambia datos de la aplicación. Los límites de archivos y procesos del contenedor se declaran en Compose. Fuente: [prerrequisitos Linux de SonarQube](https://docs.sonarsource.com/sonarqube-community-build/server-installation/pre-installation/linux).

4. Inicializar **la instancia local nueva** y ejecutar el análisis:

```powershell
node scripts/initialize-quality.mjs
docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality run --rm sonar-scanner
node scripts/report-quality.mjs
```

La inicialización cambia la contraseña inicial de `admin`, crea un proyecto privado y un token de análisis restringido al proyecto con caducidad de 30 días. Guarda ambos valores exclusivamente en `.env.quality.local`. No intenta restablecer una instalación previa cuya contraseña se desconoce. Ante un token vencido, revocarlo/regenerarlo desde la administración local y actualizar ese archivo; nunca incluirlo en Git ni en la línea de comandos.

El scanner espera el Quality Gate y devuelve error si no se aprueba. No modificar el gate ni descartar incidencias para ocultar un fallo. `report-quality.mjs` recoge el resultado, las medidas, las incidencias y los hotspots en la carpeta de evidencias. Revisar los hotspots manualmente: no equivalen por sí solos a vulnerabilidades confirmadas.

### Alternativa del scanner en Windows

Ante el fallo de la imagen local después del reinicio y la lentitud de su nueva descarga, se utilizó la distribución oficial genérica de SonarScanner CLI 8.1.0.6389 con Java 21 ya instalado. El servidor y PostgreSQL permanecen en Docker Compose. Esta alternativa no cambia las reglas, el alcance ni el gate:

```powershell
Invoke-WebRequest https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-8.1.0.6389.zip -OutFile tmp/sonar-scanner-8.1.zip
Expand-Archive -LiteralPath tmp/sonar-scanner-8.1.zip -DestinationPath tmp/sonar-cli -Force
./scripts/run-quality.ps1 -ScannerPath tmp/sonar-cli/sonar-scanner-8.1.0.6389/bin/sonar-scanner.bat -JavaHome 'C:/Program Files/Android/Android Studio/jbr'
node scripts/report-quality.mjs
```

Adaptar `JavaHome` a la ubicación local de Java 21. En este equipo se verificó OpenJDK 21.0.10. El script lee el token del archivo ignorado por Git y restaura las variables de entorno al terminar; no imprime las credenciales. La carpeta `tmp` no se versiona. La ejecución satisfactoria del scanner nativo no acredita por sí sola la ejecución del contenedor opcional del scanner.

## Alcance y límites

- Código Laravel: aplicación, configuración, rutas y base de datos. React: `src` y servidor estático. También infraestructura. Incluye código histórico de esos directorios.
- Pruebas identificadas aparte: backend, archivos Vitest y Cypress. No se analiza `vendor`, `node_modules`, medios ni documentos como código de aplicación.
- El servicio histórico Python queda fuera de este análisis Laravel/React del Sprint 1; no se declara auditado el monorepo completo.
- No hay informe Clover/LCOV configurado todavía. Pruebas aprobadas **no** significan cobertura medida; la primera línea base deberá declarar esa limitación.
- Community Build: análisis local del proyecto, sin atribuirle decoración/bloqueo automático de PR ni análisis independiente de ramas. La ejecución se hace desde `codex/sprint-01`, pero no configura CI ni realiza push.
- Esta tarea solicita registrar hallazgos, **sin corregirlos**.

## Parada sin borrar datos

```powershell
docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality stop
```

Se conservan los volúmenes y resultados. No usar `down -v` para parar el entorno.

Referencias: [instalación Docker](https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-docker-image/installation-overview), [requisitos del host](https://docs.sonarsource.com/sonarqube-community-build/server-installation/server-host-requirements), [SonarScanner CLI](https://docs.sonarsource.com/sonarqube-community-build/analyzing-source-code/scanners/sonarscanner).
