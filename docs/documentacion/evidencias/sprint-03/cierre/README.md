# S3.6 · Evidencias del cierre del Sprint 3

- **Rama:** `feature/pimentel/a-solicitudes/s03-cierre`, desde `main` `913a538` (PR #14, #15 y #16).
- **Fechas:** del 2026-10-15 al 2026-10-16.
- **Slot:** A (`tecnicoya_testing`, API 8001, web 5174). Codex no ejecutó nada durante el cierre (indicación del usuario).
- **Revisión probada:** `66be473` para Pest, Vitest, pytest y Cypress. SonarQube analizó `2947a4d`, que solo agrega `projectVersion=sprint-03`.

| Archivo | Qué prueba | Resultado |
|---|---|---|
| [01-guarda-seeders-rojo.txt](01-guarda-seeders-rojo.txt) | S03-TC-082 a 085 antes de `E2EDatabaseGuard` (DEF-44) | 3 en rojo (el mensaje no nombraba la base) y 1 en verde (S03-TC-085, regresión) |
| [02-guarda-seeders-verde.txt](02-guarda-seeders-verde.txt) | Las mismas 4 tras la guarda común | **4/4** (14 aserciones) |
| [pest-cobertura.txt](pest-cobertura.txt) | Suite Pest completa con cobertura PCOV, JUnit y Clover | **189/189** (2114 aserciones). Total 96,5 %; `ARequests` **100 %** (189/189 sentencias), `BMatching` **100 %** (69/69), `FAdministration` 97,23 %, `database/seeders` 97,49 % |
| [vitest-cobertura.txt](vitest-cobertura.txt) | Vitest con cobertura V8 | **146/146** (23 archivos). Líneas 83,42 %; `features/requests` **84,67 %**; `features/matching` **83,92 %** |
| [pytest.txt](pytest.txt) | pytest del servicio Python congelado (regresión; no cuenta para la meta) | **4/4** |
| [cypress-s01-slotA.txt](cypress-s01-slotA.txt) | `node scripts/run-e2e.mjs --sprint 01 --slot A --junit` | **17/17** (Cypress 16.1.1, Chrome en modo headless) |
| [cypress-s02-slotA.txt](cypress-s02-slotA.txt) | `node scripts/run-e2e.mjs --sprint 02 --slot A --junit` | **17/17** |
| [cypress-s03-slotA.txt](cypress-s03-slotA.txt) | `node scripts/run-e2e.mjs --sprint 03 --slot A --junit` | **17/17** en 5 specs; la siembra pasó por `E2EDatabaseGuard` |
| [conteo.txt](conteo.txt) | `node scripts/contar-pruebas-sprint.mjs` | S03: **85 IDs** aprobados (Pest 55, Cypress 17, Vitest 13); 0 fallidos y 0 omitidos. S01 87 y S02 90 siguen completos |
| [junit/](junit/) | Copias de los JUnit que leyó el contador | Pest, Vitest y 16 de Cypress (6 de S01, 5 de S02 y 5 de S03) |
| [mutacion-seeders.txt](mutacion-seeders.txt) | Mutación de las clases nuevas o modificadas en el cierre: `E2EDatabaseGuard` y los tres seeders E2E | 350 mutantes: 344 eliminados, **0 sobrevivientes** y 6 sin cubrir. **98,29 %** |
| [sonar-scanner.txt](sonar-scanner.txt) | Análisis SonarQube `sprint-03` | `QUALITY GATE STATUS: PASSED` |
| [sonar/](sonar/) | `gate.json`, `measures.json` e `issues-anonimo.json` | Gate **OK** (5 condiciones); cobertura nueva 86,2 %; duplicación nueva 0,0 %; ratings A; 0 bugs, 0 vulnerabilidades y 0 hotspots |
| [composer-audit.txt](composer-audit.txt) | `composer audit` | Sin avisos |
| [npm-audit.txt](npm-audit.txt) | `npm audit` en `frontend/web` | 0 vulnerabilidades |

**Notas**

- **Guarda de los seeders (DEF-44):** antes del cierre, Sprint02 y Sprint03E2ESeeder ya se negaban fuera del slot, pero solo porque llamaban primero a Sprint01E2ESeeder. Por eso el rojo solo falla en el mensaje: no había un agujero explotable, sino una protección indirecta que se rompía si alguien reordenaba las llamadas.
- **CI del PR #17, primera corrida:** S03-TC-085 falló (188/189) porque la base de la CI es `tecnicoya_ci_testing`, que no es un slot, y la guarda la rechazó tal como exige D-59. El defecto era de la prueba, que suponía que la base del proceso era la del slot.
  - **Corrección** (commit posterior a `e99cfef`): la prueba presenta a la guarda el nombre del slot A sin reconectar. Las escrituras siguen en la base real de pruebas y las revierte `RefreshDatabase`. Además, afirma que la conexión real termina en `_testing`. La guarda no cambió.
  - **Verificación local:** S03 55/55 en el slot A; la prueba 4/4 también en el slot B, donde la base real (`tecnicoya_b_testing`) no coincide con la configurada.
  - Esa corrida en el slot B recreó la base `tecnicoya_b_testing` (`RefreshDatabase`); Codex no estaba ejecutando nada.
- **Mutación:**
  - Los 6 sin cubrir son elementos de arrays constantes (`SLOT_DATABASES` y `FEES`), que PCOV no registra como ejecutables.
  - La corrida reutilizó la caché de cobertura de Pest y duró 11 s.
  - Dos sentencias no tienen prueba propia, porque la base de pruebas siempre cumple esas condiciones:
    - el `throw` de la guarda que exige `APP_ENV=testing`, host y usuario (`E2EDatabaseGuard.php:23`);
    - el de la contraseña corta (`Sprint01E2ESeeder.php:16`). Se dejan anotados en el informe; no se agregaron casos sin pedirlos.
- **pytest:** la máquina no tiene Python 3.12 en el PATH y `.runtime-python` está compilado para cp312. Se usó un intérprete 3.12 local con `PYTHONPATH=../../.runtime-python`; no se instaló nada.
- **SonarQube:**
  - Se levantó solo para este paso y se detuvo al terminar (`docker compose … --profile quality stop`).
  - El token de análisis no tiene permiso para `project_analyses` ni `hotspots/search` (403). Por eso no hay `analyses.json` ni `hotspots.json`: los hotspots salen de la medida `security_hotspots` (0) y el periodo, de `gate.json` (`PREVIOUS_VERSION`, `sprint-02`).
- **RAM libre:** 0,71 GB antes de Cypress S01 y 1,78 GB en S02 y S03. No hubo fallos.
- **Datos anonimizados:** las rutas de usuario se reemplazaron por `<raiz>` o `<usuario>`. El `sonar/issues.json` crudo está ignorado por Git.
