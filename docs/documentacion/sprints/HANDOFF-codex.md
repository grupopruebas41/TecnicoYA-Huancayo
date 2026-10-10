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

## 2026-10-10 · Sprint 02 · S2.4 frontend

- Rama feature/delgado/f-administracion/s02, slot B, base origin/main 1bfb8f4. Solo docs del sprint importados desde rama Mayhuasca 2140555; backend intacto.
- Commits: 3495ed8 pruebas Vitest en rojo; 4a35589 implementación verde. PR #10: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10
- Landing con 10 secciones, catálogo/carrusel v1 sin datos demo; panel admin de catálogo, comunicados y verificación; panel técnico con perfil/documentos/portafolio, disponibilidad, zonas, pausa y tarifas; comunicados al inicio de roles. Confirmaciones, versiones, errores y lectura tras resultado incierto.
- Vitest: 112/112, salida 0; 14 IDs S02-TC-076–089 exactos, seis complementos sin inflar IDs. Líneas administración 86,40 %, global 82,66 %. Build salida 0. npm audit salida 0, 0 vulnerabilidades.
- Cypress: 17 casos S02-TC-059–075 preparados, node --check correcto. NO EJECUTADO, como Docker/Pest/SonarQube. S02-TC-067 usa 500 simulado porque el CSV lo prescribe. No se acredita integración ni cierre del sprint.
- Evidencias: docs/documentacion/evidencias/sprint-02/frontend/. Avance: docs/avances/delgado/sprint-02/avance.md. Revisor [PENDIENTE].
- Ajustes de pruebas: S1 conserva aserciones y aísla el componente nuevo del portal; carrusel legado conservado para regresión D-26; S02-TC-083 comprueba descripción accesible para evitar selector ambiguo de errores.
- Pendiente S2.5: integrar backend S2.3, merge sin rebase, ejecutar Cypress con bloqueo global y slot B. No se ejecutó todavía ni se modificó el arrancador.
- Pedidos a Claude Code: completar/confirmar Sprint02E2ESeeder (no existía en 2140555), cuentas sintéticas y contraseña vía arrancador; pendiente completo para aprobación, otro para rechazo, al menos dos subcategorías con foto del mismo rubro para teclado. Confirmar límites de tarifa orientativa y reglas completas de subcategory_id/performed_on del portafolio: contrato §5.5/§7.4 incompleto. D-46 a D-52 leídas en la rama backend y aplicadas según contrato, sin copiar DECISIONES por fuera del alcance autorizado.
- Bloqueo de cierre: integración real/API y revisión humana pendientes, no de la compilación frontend.


## 2026-10-10 · Sprint 02 · CI GitHub Actions (D-39)

- Rama feature/pimentel/f-administracion/s02-ci desde origin/main 30f130e; solo configuración común y documentación.
- Workflow PHP 8.2/PCOV/MySQL 8.4 + Node 24, Pest/Vitest, build, auditorías, artefactos y conteo informativo de JUnit frescos.
- Cypress y SonarQube permanecen locales en el cierre; CI verde no sustituye la DoD.
- Commits: 3d28cd7 (workflow/documentación), 352288b (dotenv efímero y fallo ante advertencias). PR #9: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/9
- Validación remota: https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/38028328415, tres jobs aprobados. Pest 102/102 (1047 aserciones), Vitest 92/92, build aprobado, ambas auditorías sin vulnerabilidades. Conteo S01 78 IDs CI, sin Cypress; no acredita cierre completo.
- Evidencias: docs/documentacion/evidencias/sprint-02/ci/2026-10-10-352288b-resultado.md. Advertencias iniciales dotenv resueltas sin tocar pruebas. No se ejecutaron suites ni Docker locales.
- Pendiente: revisión/integración por el equipo. Cypress y Quality Gate siguen locales; sin bloqueos.
- Revisión humana: [PENDIENTE].

## 2026-10-09 · Sprint 01 · S1.5 completado

- Rama feature/delgado/f-administracion/s01, slot B. origin/main a04b677 (PR #6 integrado); merge 9b0714a, sin rebase.
- Cuatro conflictos de títulos resueltos solo en frontend con IDs del catálogo y aserciones intactas. Backend coincide con origin/main.
- Vitest sobre merge: 92/92 (17 archivos), salida 0. Build: salida 0.
- Cypress: 16/17 en 9b0714a y ab71db2; fallo único S01-TC-075. Sincronizar render no bastó. abb2b7b completa Enter por CDP en Chromium, comprueba isTrusted=true y conserva recorrido por teclado/POST real.
- **Final abb2b7b: 17/17, salida 0**, seis specs; IDs S01-TC-015–025 y 072–077 cotejados con CSV. Sin omitidos/reintentos automáticos/respuestas de servidor fabricadas. Producto no cambió después del merge.
- MySQL ya healthy; no se levantó/recreó. Bloqueo global respetado, global y B liberados al final. No se ejecutó Pest ni SonarQube.
- Evidencias: docs/documentacion/evidencias/sprint-01/cypress/README.md (tres logs, tres conjuntos JUnit, diagnóstico); avance de Delgado actualizado. PR #7: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/7
- Pendiente: revisión humana [PENDIENTE], S1.6 y Quality Gate/cierre de sprint. Sin bloqueos de S1.5.


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
