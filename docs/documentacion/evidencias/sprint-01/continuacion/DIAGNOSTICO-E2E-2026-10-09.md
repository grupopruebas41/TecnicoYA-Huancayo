# Diagnóstico del fallo del arrancador E2E (09-10-2026)

**Síntoma:** `node scripts/run-sprint01-e2e.mjs` terminaba con «El proceso terminó con código 3221225501» (`0xC000001D`, instrucción ilegal) después de `CatalogSeeder`. Se atribuyó a PHP en `Sprint01E2ESeeder` (NEW-01 de `CONTEXTO-COMPLETO-2026-10-09.md`).

## Causa

**No es PHP.** El proceso que muere es **Cypress** (Electron). La causa es que la variable de entorno **`ELECTRON_RUN_AS_NODE=1`** se hereda de la terminal integrada de VS Code, donde corre el agente. Con esa variable, `Cypress.exe` arranca como un Node simple: rechaza sus propias opciones y el proceso cae con instrucción ilegal antes de imprimir nada.

El mensaje engaña: `run()` del arrancador se usa para `migrate`, `db:seed` y también para Cypress, y como Cypress no imprime nada, el último texto visible es el de `CatalogSeeder`.

## Evidencia

| Prueba | Resultado |
|---|---|
| `db:seed --class=Sprint01E2ESeeder` aislado, con el mismo entorno del arrancador (spawnSync, `inherit` y `spawn` asíncrono; con `migrate` previo; salida a tubería y a archivo) | Código 0 en 8 de 8 ejecuciones |
| Copia del arrancador que se detiene tras el seeder (con y sin comprobación de puertos y archivo de bloqueo; raíz con barras invertidas) | `[seed OK]` en 8 de 8 |
| Arrancador original, con `ELECTRON_RUN_AS_NODE=1` heredada | Falla 3 de 3 (código 3221225501) |
| `echo $ELECTRON_RUN_AS_NODE` en la sesión | `1`; no está definida a nivel de Usuario ni de Máquina en Windows |
| `cypress verify` con la variable | «Cypress failed to start… `Cypress.exe: bad option: --smoke-test`» |
| `cypress verify` sin la variable (`env -u ELECTRON_RUN_AS_NODE`) | «Verified Cypress!» |
| `cypress run` con la variable | `Illegal instruction` (bash 132 = SIGILL, equivalente a `0xC000001D`) |
| **Arrancador completo sin la variable** | **11/11 aprobadas** (Cypress 16.1.1, Chrome 156 headless, Node 24.19.0): [sprint01-next-5-cypress.txt](sprint01-next-5-cypress.txt) |

## Descartado

- `php.ini` no cambió desde el 06-10 00:58, antes de la ejecución verde de las 20:21. La diferencia con `php.ini.bak-antes-pcov-2026-10-06` es solo el bloque `[pcov]` con `pcov.enabled=0`.
- OPcache no está cargado (sin `opcache.enable_cli` ni JIT) y no hay archivos `.ini` adicionales.
- No hay eventos de fallo de `php.exe` en el registro Application (Id 1000) de la última hora.
- `password_hash` y `random_bytes` funcionan.
- La RAM libre era baja (0,5 GB), pero no influye.

**Por qué pasó el 06-10:** aquella ejecución se lanzó desde un entorno sin `ELECTRON_RUN_AS_NODE` (otra terminal o agente). [NO VERIFICABLE] con exactitud.

## Corrección propuesta (pendiente de aprobación)

1. **Sin tocar el repositorio:** lanzar el arrancador con la variable eliminada:
   - Git Bash: `env -u ELECTRON_RUN_AS_NODE node scripts/run-sprint01-e2e.mjs`
   - PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE; node scripts/run-sprint01-e2e.mjs`
2. **En el repositorio (recomendado):** que el arrancador quite `ELECTRON_RUN_AS_NODE` del entorno que pasa a Cypress. Es un cambio de una línea en `scripts/run-sprint01-e2e.mjs`, en la rama `feature/pimentel/f-administracion/s00-cypress` con PR. Así funciona desde cualquier terminal, incluidas las de VS Code y los agentes.

No se cambió código ni `php.ini`.
