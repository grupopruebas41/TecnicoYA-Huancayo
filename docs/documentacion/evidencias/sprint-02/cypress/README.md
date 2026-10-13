# Evidencias S2.5 · frontend · 2026-10-13

Rama feature/delgado/f-administracion/s02; slot B; base tecnicoya_b_testing. Backend de PR #11 integrado desde origin/main f7c524e mediante merge 6cadc8b, conservando contrato v1.1. PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10.

## Resultado vigente

| Comando | Resultado | Fuente probada |
|---|---|---|
| node scripts/run-e2e.mjs --sprint 02 --slot B --junit | **15/17**, salida 1 del arrancador (2 casos fallidos en Cypress); S02-TC-061 y 071 | 1651099, intento 08 completo |
| node scripts/run-e2e.mjs --sprint 01 --slot B --junit | **17/17**, salida 0 | árbol de 1651099 |
| npm test -- --coverage --maxWorkers=1 (frontend/web) | **116/116**, 21 archivos, salida 0 | 0bb4438 |
| npm run build (frontend/web) | salida 0 | 0bb4438 |
| npm audit (frontend/web) | salida 0; **0 vulnerabilidades** | 719cc2a + trabajo sin confirmar; package-lock sin cambios posteriores |

Cobertura de líneas: administración **86,77 %**, global **82,89 %**. Los 14 IDs Vitest S02-TC-076–089 se conservan; los complementos no aumentan el conteo de IDs. Cypress S2 conserva exactamente S02-TC-059–075; S1 conserva S01-TC-015–025 y 072–077. Los reportes JUnit son de las ejecuciones reales, incluidos los fallos.

## Bloqueos y correcciones

- **DEF-40 abierto:** Portfolio::present no devuelve subcategory_id del portafolio propio. No se puede reconstruir fielmente la selección al editar; falta ajustar contrato/respuesta y prueba Pest por Claude Code. El frontend conserva un id inactivo cuando lo recibe.
- **DEF-41 cerrado, 0bb4438:** la recarga desmontaba RetireButton y su alerta. AnnouncementsAdmin conserva ahora el aviso. Vitest reprodujo el fallo antes de corregirlo; S02-TC-066 pasó en las corridas 7 y 8.
- **DEF-42 abierto:** las subidas de catálogo y portafolio reciben 204 al preparar CSRF, pero el frontend informa resultado incierto y Cypress no observa POST /api/v1/media. Se repite con Buffer y con el PNG físico sintético. **No está demostrado si la causa está en transporte, navegador o servidor**. No se aumentó el timeout de la aplicación ni se fabricó una respuesta exitosa. Solicitud a Claude Code: contrastar preflight/recepción multipart y trazas del servidor. No aprobar S2.5 hasta resolver y repetir los 17 casos.
- Fiabilidad Sonar: rechazo de document.fonts.ready manejado; video decorativo con tabIndex=-1. SonarQube no ejecutado aquí: validación y Quality Gate pendientes de S2.6.

## Historial sin ocultar fallos

| Corrida | Aprobadas | Resultado relevante |
|---|---:|---|
| S2 intento 01 | 15/17 | selector de vista previa y confirmación de retiro |
| S2 intento 02 | 14/17 | publicación sin identificar, clic en título del diálogo y franjas previas |
| S2 intento 03 | 16/17 | franjas: persistían datos cargados después de contar los controles |
| S2 intento 04 | 16/17 | confirmado: no se enviaba la petición de disponibilidad |
| Diagnóstico técnico | 4/5 | validación de solapamiento correcta; prueba leía antes de cargar el editor |
| S2 intento 05 | 16/17 | franjas corregidas; se reforzó observación de guardar/quitar pausa |
| S2 intento 06 | 16/17 | técnico 5/5; aviso de retiro desaparecía al recargar comunicado |
| S2 intento 07 | 16/17 | retiro corregido; un ingreso no llegó al portal en el plazo de la prueba |
| S2 intento 08 | 15/17 | fallos persistentes de subida S02-TC-061 y 071 |
| Diagnóstico de subidas | 7/9 | CSRF 204 seguido de aviso de resultado incierto |
| Diagnóstico con PNG físico | 7/9 | mismo resultado; el cambio de fixture no resolvió el fallo |
| Regresión S1 | 17/17 | ninguna prueba S1 modificada |

Los intentos 01–06 y el primer diagnóstico se ejecutaron sobre 719cc2a con cambios progresivos sin confirmar: se identifican como **719cc2a-wip**, no como una versión idéntica en todos los intentos. Las correcciones se consolidaron en 0bb4438. El intento 07 corresponde a 0bb4438; el 08 y S1 al árbol de 1651099. Los diagnósticos de subida incluyen instrumentación posterior y se marcan **1651099-wip**. Se conserva la salida roja de 719cc2a y la reproducción roja del retiro en cce69aa.

Los diagnósticos limitados usaron CYPRESS_excludeSpecPattern únicamente para omitir otros archivos; **no equivalen a una corrida de 17 casos**. Sin reintentos automáticos ni esperas fijas. Los interceptores observan respuestas reales, salvo la inyección 500 explícitamente requerida por S02-TC-067 en CATALOGO-S02.

## Entorno y privacidad

TECNICOYA_SLOT=B; ejecuciones seriales con el bloqueo global del arrancador. No se levantó MySQL desde el worktree, ni se ejecutó Pest local. RAM libre observada durante la investigación: 303–893 MB; se registra como condición del entorno, no como causa probada. Datos sintéticos; rutas personales sustituidas por [WORKSPACE]/[USERPROFILE]. No se incluyen contraseñas, cookies, claves ni archivos .env. Los medios creados en backend/api/storage no se versionan.

CI automatiza backend, frontend y conteo; estado de la última ejecución publicada: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10/checks. No ejecuta Cypress ni SonarQube. Revisión humana: [PENDIENTE].
