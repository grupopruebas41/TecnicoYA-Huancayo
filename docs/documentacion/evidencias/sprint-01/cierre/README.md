# S1.6 · Evidencias del cierre del Sprint 1

- **Rama:** `feature/pimentel/f-administracion/s01-cierre`, desde `main` `8c570e9` (PR #6 y #7 integrados).
- **Fechas:** del 2026-10-09 al 2026-10-10.
- **Slot:** A (`tecnicoya_testing`, API 8001, web 5174).
- **Revisión probada:** `4171f06`. Solo agrega a `main` una prueba reforzada, así que el código de producto es idéntico al de `8c570e9`. El frontend no cambia en la rama, por eso Vitest se ejecutó sobre `8c570e9`.

| Archivo | Qué prueba | Resultado |
|---|---|---|
| [mutacion-catalog.txt](mutacion-catalog.txt) | Mutación solo de `CatalogController` (D-45) | 27/27 eliminados, **100 %** (antes había 9 sobrevivientes y 1 timeout) |
| [pest-cobertura.txt](pest-cobertura.txt) | Suite Pest completa con cobertura PCOV, JUnit y Clover | **102/102** (1047 aserciones); cobertura total 94,6 %; `FAdministration` 95,7 % (443/463) |
| [vitest-cobertura.txt](vitest-cobertura.txt) | Vitest con cobertura V8 | **92/92** (17 archivos); líneas 82,97 %; `features/administration` 96,27 % |
| [cypress-slotA.txt](cypress-slotA.txt) | `node scripts/run-e2e.mjs --sprint 01 --slot A --junit` | **17/17** en 6 specs; Cypress 16.1.1 y Chrome 156 en modo headless |
| [conteo.txt](conteo.txt) | `node scripts/contar-pruebas-sprint.mjs` | S01: **87 IDs** aprobados (Pest 54, Cypress 17, Vitest 24); 0 fallidos y 0 omitidos |
| [junit/](junit/) | Copias de los JUnit que leyó el contador | Pest, Vitest y 6 de Cypress |
| [sonar-scanner.txt](sonar-scanner.txt) | Análisis SonarQube `sprint-01` | **QUALITY GATE STATUS: PASSED** |
| [sonar/](sonar/) | gate, measures, analyses, hotspots e `issues-anonimo.json` | Cobertura de código nuevo 77,8 %; duplicación nueva 0,0 %; ratings A; 0 hotspots |
| [composer-audit.txt](composer-audit.txt) | `composer audit` | Sin avisos |
| [npm-audit.txt](npm-audit.txt) | `npm audit` en `frontend/web` | 0 vulnerabilidades |

**Notas**

- **Vitest cuenta 24 IDs.** El catálogo asigna 16 a Vitest (026 a 033 y 078 a 085). Los otros 8 son complementos unitarios de casos Cypress que el contador también encuentra en Vitest. El total de IDs distintos (87) coincide con el catálogo.
- **Datos anonimizados:** rutas de usuario reemplazadas por `<raiz>` o `<usuario>`. El `sonar/issues.json` crudo está ignorado por Git (`**/sonar*/issues.json`). Las pruebas solo usan correos sintéticos.
- **SonarQube** se arrancó solo para este paso, con el bloqueo `tmp/e2e-cypress.lock` tomado. Después se detuvo con `stop` y el bloqueo se liberó. Cypress corrió antes, sin ninguna corrida de Codex en curso.
- **DEF-38:** la prueba reforzada creaba PNG reales en `backend/api/storage/app/public/media`. Se corrigió en `b0d794b` con `Storage::fake('public')` y se reejecutó sin crear archivos. Los 20 PNG sintéticos ya generados no están versionados y quedan para borrarlos a mano.
