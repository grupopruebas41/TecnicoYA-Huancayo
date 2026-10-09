# Handoff Codex — frontend S00

Fecha: 2026-10-09. Worktree: TecnicoYa-cx. Rama: codex/s00-frontend, base main d361c63.

## Entregado
- DEF-18: 0 vulnerabilidades npm, sin --force.
- DEF-08: type=submit en los siete botones señalados.
- DEF-10: validación de correo acotada a 254 y 16 pruebas de borde.
- Vitest: JUnit separado de Pest, cobertura V8 texto/LCOV y ruta Sonar; normalización de rutas para análisis desde la raíz.
- Traducción de estados, permisos y errores estándar en v1, 9 pruebas adicionales.
- npm test 63/63; build correcto; npm audit 0; cobertura de líneas 61.82%.

## Evidencia y límites
Ver docs/documentacion/evidencias/sprint-00/frontend/README.md y salidas adyacentes. Seis puntos en commits separados fix(s00). No se tocaron backend, base de datos ni slot A. Fuera de frontend/web solo se escribieron las evidencias, este handoff y la propiedad LCOV solicitada en sonar-project.properties.

AGENTS.md no encontrado. ENTORNO-PARALELO.md leído en carpeta principal. La indicación actual de ejecutar audit fix prevalece sobre su prohibición anterior.

## Para integración
- Usar npm ci con Node compatible (probado 24.19.0).
- Ejecutar npm run test:coverage antes del análisis de SonarQube desde la raíz.
- No mezclar el JUnit frontend con la cuota de TC Pest: el contador actual lee exclusivamente backend/api/test-results/junit.xml.
- Reanalizar Sonar para confirmar el cierre de S9011 y regex; Quality Gate no medido en esta tarea.
- Revisar conjuntamente con el PR backend S00 antes de fusionar; sin merge automático.
## Revalidación solicitada — 2026-10-09

- Código verificado: b1d467b (DEF-13 web). Rama: codex/s00-frontend.
- Se ejecutaron git fetch origin y git merge origin/main: main remoto continúa en d361c63; no hubo cambios ni conflictos. AGENTS.md se leyó íntegro desde la carpeta principal (commit local de reglas deabac5), no desde main remoto. También se leyó la plantilla HANDOFF-codex de esa carpeta; HANDOFF-claude no encontrado allí.
- Se conservaron las specs y configuración Cypress de la rama frontend sin edición. Las nuevas specs de Claude aún no se pueden integrar desde origin/main.
- npm ci: salida 0. npm test: 63/63, salida 0. npm run build: salida 0. npm audit: 0 vulnerabilidades, salida 0.
- E2E slot B: comando solicitado ejecutado, salida 1 por MODULE_NOT_FOUND (scripts/run-e2e.mjs no existe). No se inició Cypress ni se modificó la base. También faltan backend/api/.env.testing y vendor/autoload.php en el worktree B.
- Petición al equipo: integrar/publicar el PR de entorno y reglas en main; preparar manualmente .env.testing del slot B según ENTORNO-PARALELO.md, sin compartir secretos. Después instalar las dependencias backend del worktree y repetir el E2E con el arrancador integrado.
- Evidencias de esta revisión: docs/documentacion/evidencias/sprint-00/frontend/revalidacion-*.txt e integracion-main.txt. Cada archivo identifica fecha y commit; rutas de usuario anonimizadas.
- DEF-13: Dockerfile cambiado a USER node. La comprobación de construcción y HTTP se añadirá al terminar docker-web.txt.
- No se ejecutó SonarQube; no se declara Quality Gate ni compatibilidad E2E aprobada.
Verificacion Docker final (commit 152e145): build aprobado; usuario node, UID 1000; HTTP 200 para HTML y bundle (229191 bytes); HTTP interno 200. Se preservo el fallo inicial ResponseEnded y se verifico sin proxy despues del arranque. Contenedores temporales retirados.
