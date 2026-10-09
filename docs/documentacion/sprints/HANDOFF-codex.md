# HANDOFF · Codex (frontend)

Archivo de relevo de Codex (regla 12 de AGENTS.md). Se actualiza al terminar cada tarea o antes de quedarse sin límite de uso. Al empezar, leer también [HANDOFF-claude.md](HANDOFF-claude.md).

> Relevo de la raíz incorporado aquí el 2026-10-09, según la regla 12 y el pedido de Claude Code.

## Plantilla de entrada (copiar arriba, la más reciente primero)

```markdown
## AAAA-MM-DD HH:MM · Sprint NN · <tarea>

- **Rama:** feature/delgado/<módulo>/sNN · **Base:** <commit>
- **Commits:** <hash> <mensaje> (uno por línea)
- **Pruebas:** Vitest <aprobadas>/<total> · Cypress <aprobadas>/<total> (slot B) · fallidas: <lista o «ninguna»>
- **IDs SNN-TC-NNN cubiertos:** <lista o rango>
- **Evidencias:** docs/documentacion/evidencias/sprint-NN/<archivo>
- **Qué falta:** <lista>
- **Bloqueos:** <lista o «ninguno»>
- **Pedidos a Claude Code:** <contrato de API, seeders E2E, datos, correcciones>
```

## Entradas

## 2026-10-09 · Sprint 01 · S1.5 pendiente de PR #6

- Rama feature/delgado/f-administracion/s01; código probado da68664, slot B.
- Fetch aprobado. Merge origin/main: Already up to date; main sigue en 6dfec52e. Sin conflictos.
- GitHub confirma PR #6 abierto, merged=false (head 5b9126b). Se pidió al usuario aviso tras integrarlo; no se fusiona por cuenta propia.
- npm test: 92/92 (17 archivos); npm run build: salida 0. MySQL healthy, bloqueos global/slot B libres; no se modificaron.
- Cypress NO EJECUTADO: faltó la precondición de backend integrado. Los 17 casos S01-TC-015–025 y 072–077 siguen pendientes.
- Evidencia: docs/documentacion/evidencias/sprint-01/cypress/. Avance actualizado. No se editaron frontend/backend ni pruebas en este paso.
- Continuar con fetch/merge cuando PR #6 esté integrado; volver a verificar Vitest/build, MySQL y bloqueo, ejecutar node scripts/run-e2e.mjs --sprint 01 --slot B --junit.


## 2026-10-09 · Sprint 01 · S1.4 frontend

- **Rama:** feature/delgado/f-administracion/s01. **Base:** origin/main 6dfec52e. Worktree TecnicoYa-cx, slot B.
- **Commits:** 9e184da (tests en rojo); 72872a8 (implementación verde y Cypress preparado); evidencia/relevo en commit documental posterior.
- **PR:** https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/7
- **Fuentes:** AGENTS, ambos handoffs, DECISIONES, contrato y catálogo S1 leídos. Solo los dos documentos S1 se importaron desde Mayhuasca 5b9126b; nada de backend.
- **Pruebas:** rojo 75/92; verde **92/92**, 17 archivos. Módulo administración 96,27 % líneas; global frontend 82,97 %. Build salida 0; npm audit 0 vulnerabilidades. Un trabajador Vitest, sin concurrencia de suites.
- **IDs planificados Vitest:** S01-TC-026–033 y 078–085 (16 únicos). Hay complementos unitarios de IDs Cypress que NO acreditan E2E ni se suman a esos 16.
- **Cypress:** S01-TC-072–077 preparados, más los 11 anteriores con nombres alineados al CSV. **NO EJECUTADO**, solo node --check. Docker, Pest y SonarQube NO ejecutados.
- **Entrega:** registro cliente/técnico, pending visible, login/logout, rutas #cuenta/{cliente,tecnico,administrador} resueltas con /me, perfil versionado/409, recuperación de resultado incierto, CSRF, 429 español, rechazo D-43 y catálogo honesto. DEF-36 corregido; no se modificó registro central de defectos.
- **Evidencias:** docs/documentacion/evidencias/sprint-01/frontend/README.md; logs, JUnit y LCOV anonimizados. Avance: docs/avances/delgado/sprint-01/avance.md; revisor [PENDIENTE].
- **Qué falta:** S1.5 tras integrar backend en main: actualizar rama y ejecutar node scripts/run-e2e.mjs --sprint 01 --slot B. Sonar/Quality Gate y revisión humana en cierre. No se declara cerrado S1.
- **Pedidos a Claude Code:** integrar contrato/implementación backend, registrar D-43/D-44 desde su rama y reanalizar DEF-36 en Sonar. Mantener backend separado de este PR. Los títulos antiguos seguían en main: se alinearon al catálogo sin cambiar las aserciones de las pruebas anteriores.
- **Bloqueos:** ninguno para S1.4; integración E2E pendiente por orden explícita del usuario.


## 2026-10-09 · Sprint 00 · integración, Cypress slot B y DEF-13 web

- Rama: codex/s00-frontend. Main integrado: 1660d8b. Merge: b188cb0, sin conflictos.
- Commits de código: b1d467b (USER node, COPY --chown); 152e145 (no descargar binario Cypress en build de producción).
- Se leyeron AGENTS.md, ENTORNO-PARALELO.md y ambos handoffs. Specs y configuración de Cypress idénticas a origin/main, comprobado con git diff.
- Validación después del merge: npm ci salida 0; npm test 63/63 (10 archivos), salida 0; npm run build salida 0; npm audit 0 vulnerabilidades, salida 0.
- E2E: node scripts/run-e2e.mjs --sprint 01 --slot B --junit, salida 0, Cypress 16.1.1 / Chrome 156, 11/11: catálogo 2, portales 6, validación 3. Base tecnicoya_b_testing, API 8002, web 5175. Sin Pest concurrente ni cambios en slot A.
- DEF-13 web: imagen tecnicoya-web-s00:frontend construida; USER node, UID efectivo 1000; HTML y bundle JS HTTP 200 (229191 bytes), HTTP interno 200. Contenedores temporales retirados. La imagen probada usa el código 152e145; los inputs de runtime no cambiaron en b188cb0 (diff comprobado).
- Incidencias preservadas: E2E previo al merge no arrancó por script ausente; primer build detenido tras descarga para aplicar omisión del binario Cypress; primer sondeo HTTP falló (ResponseEnded), diagnóstico posterior sin proxy e instancia arrancada aprobado. No se borraron esas evidencias ni se cambiaron pruebas para pasarlas.
- Evidencias: docs/documentacion/evidencias/sprint-00/frontend/postmerge-*.txt y XML; docker-web-final.txt y docker-web-runtime.txt. No contienen secretos.
- IDs: pruebas de regresión existentes, sin crear ni renumerar IDs SNN-TC-NNN; 63 y 11 son pruebas ejecutadas, no cuotas acreditadas del plan v3.
- PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/1
- Pendiente: revisión humana e integración del PR; SonarQube y cierre formal del registro por Claude Code. No se afirma Quality Gate aprobado ni sprint terminado.
- Bloqueos de esta tarea: resueltos. Pedidos a Claude Code: confirmar cierre de DEF-13 web en el registro con estas evidencias; reanalizar DEF-08 y DEF-10 y registrar DEF-18.


## Historial importado de la raíz (Fase 1 y comprobaciones previas al merge)

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
