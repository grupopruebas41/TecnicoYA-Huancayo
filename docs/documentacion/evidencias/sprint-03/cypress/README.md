# Evidencias S3.5 · slot B

## 2026-10-15 · S3.5 · Integración frontend y regresiones aprobadas

- Rama feature/delgado/a-solicitudes/s03, slot B; merge e91e6bb de origin/main c1918f4 (PR #14 y #16), sin conflictos ni rebase. Dependencias locales sincronizadas con composer install; no se editaron archivos backend. MySQL compartido ya estaba healthy; no se levantó Compose desde el worktree.
- Pausa previa con 0,82 GiB registrada. El usuario indicó iniciar después; se notificaron avisos de RAM (675/624/833 MB en distintas corridas). Cypress siempre secuencial y con bloqueo global. Sin Pest ni SonarQube locales.
- Cypress finales: S03 **17/17** (a900605, S03-TC-052–068); S01 **17/17** (5da90c3); S02 **17/17** (7fcbb9d). JUnit y comprobación de IDs en evidencias/sprint-03/cypress/.
- Correcciones de pruebas, sin cambiar aserciones esperadas: 32d7609 cabeceras SPA y teclado; b8bf770 ruta /admin/specialties; 868e0f3 sincronización del foco; a900605 Enter y Espacio nativos CDP en Chrome; 5da90c3 output con rol implícito; 7fcbb9d dialog nativo. No quedan it.only ni reintentos configurados.
- Corridas fallidas conservadas: S03 15/17, 15/17, 16/17 y 16/17, más diagnóstico aislado TC-063; S01 16/17 por selector [role=status]; S02 15/17 por [role=dialog]. No se atribuyeron a backend: corregidos los helpers y selectores, las respuestas reales aprobaron. No hay nuevo defecto backend para REGISTRO-DEFECTOS.
- Vitest con cobertura: primera ejecución forks incompleta (139 aprobadas; 2 workers no arrancaron a tiempo). Con --maxWorkers=1 --pool=threads, aislamiento por archivo conservado: **146/146, 23 archivos, salida 0**. No se relajaron tiempos/aserciones ni se agregaron reintentos. Líneas: global 83,42 %, requests 84,67 %, matching 83,92 %.
- npm run build: salida 0. npm audit: salida 0, sin vulnerabilidades. Código validado 7fcbb9d. Evidencias anonimizadas, JUnit, LCOV y resumen de IDs en docs/documentacion/evidencias/sprint-03/cypress/.
- PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/15 . CI del push de esta entrega: comprobar checks del PR; resultado se comunica al usuario al finalizar.
- Pendiente: revisión humana [PENDIENTE], integración y cierre S3.6/SonarQube por el equipo. Se conservan los pedidos previos sobre creación incierta y limpieza de medios sin vínculo; no bloquean los 17 recorridos del contrato.

### Comandos

```powershell
git fetch origin
git merge origin/main
# En backend/api: dependencias del lock integrado, sin actualizarlo
composer install --no-interaction --prefer-dist --no-progress
# Desde la raíz; siempre una ejecución a la vez
node scripts/run-e2e.mjs --sprint 03 --slot B --junit
node scripts/run-e2e.mjs --sprint 01 --slot B --junit
node scripts/run-e2e.mjs --sprint 02 --slot B --junit
npm --prefix frontend/web test -- --coverage --maxWorkers=1 --pool=threads
npm --prefix frontend/web run build
npm --prefix frontend/web audit
```

Los nombres final identifican los JUnit aprobados; primera/segunda/tercera/cuarta conservan fallos. Los diagnósticos aislados no se suman a los 17 casos. El diagnóstico utilizó temporalmente un único caso y se restauraron todos antes del commit y de la corrida final. Los archivos de fallo se sanearon para retirar cabeceras de sesión; las rutas personales se sustituyeron por marcadores. La prueba 062 simula un 500 por exigencia del catálogo; 060 deja procesar el envío real y trunca su respuesta para probar recuperación. No se inventan respuestas de éxito.
