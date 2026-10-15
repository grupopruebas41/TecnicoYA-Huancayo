# S2.6 · Evidencias del cierre del Sprint 2

- **Rama:** `feature/pimentel/f-administracion/s02-cierre`, desde `main` `f7c524e` (PR #11), con `main` `0a5977f` (PR #10) fusionado en `8730a13`.
- **Fechas:** del 2026-10-13 al 2026-10-15.
- **Slot:** A (`tecnicoya_testing`, API 8001, web 5174).
- **Revisión probada:** `8730a13` para Pest, Vitest y Cypress. SonarQube analizó `e176a6b`, que solo agrega `projectVersion=sprint-02`.

| Archivo | Qué prueba | Resultado |
|---|---|---|
| [mutacion-4-clases.txt](mutacion-4-clases.txt) | Mutación solo de ManageAnnouncements, UpdateTechnicianProfileRequest, TechnicianDirectory y Portfolio, tras reforzar sus aserciones | 311 mutantes: 284 eliminados, 7 sobrevivientes y 20 sin cubrir. **91,32 %**. En S2.3 estas 4 clases tenían 92 sobrevivientes |
| [pest-cobertura.txt](pest-cobertura.txt) | Suite Pest completa con cobertura PCOV, JUnit y Clover | **149/149** (1685 aserciones). Cobertura total 92,8 %; `FAdministration` **97,22 %** (945/972) |
| [vitest-cobertura.txt](vitest-cobertura.txt) | Vitest con cobertura V8 | **116/116** (21 archivos). Líneas 82,89 %; `features/administration` **86,77 %** |
| [cypress-s01-slotA.txt](cypress-s01-slotA.txt) | `node scripts/run-e2e.mjs --sprint 01 --slot A --junit` | **17/17** (Cypress 16.1.1, Chrome 156 en modo headless) |
| [cypress-s02-slotA.txt](cypress-s02-slotA.txt) | `node scripts/run-e2e.mjs --sprint 02 --slot A --junit` | **17/17** en 5 specs |
| [conteo.txt](conteo.txt) | `node scripts/contar-pruebas-sprint.mjs` | S02: **90 IDs** aprobados (Pest 59, Cypress 17, Vitest 14); 0 fallidos y 0 omitidos |
| [junit/](junit/) | Copias de los JUnit que leyó el contador | Pest, Vitest y 11 de Cypress (6 de S01 y 5 de S02) |
| [sonar-scanner.txt](sonar-scanner.txt) | Análisis SonarQube `sprint-02` | El scanner terminó con el Gate FAILED por `php:S5693`. Tras revisar esa incidencia, el Gate quedó **OK** |
| [sonar/](sonar/) | gate, measures, analyses, hotspots e `issues-anonimo.json` | Cobertura de código nuevo 82,5 %; duplicación nueva 0,0 %; ratings A; 0 bugs, 0 vulnerabilidades y 0 hotspots |
| [composer-audit.txt](composer-audit.txt) | `composer audit` | Sin avisos |
| [npm-audit.txt](npm-audit.txt) | `npm audit` en `frontend/web` | 0 vulnerabilidades |

**Notas**

- **`php:S5693` (StoreMediaRequest:33).** En SonarQube 26.9 la regla sale como incidencia de seguridad, no como hotspot. Por eso no existe la opción «Safe».
  - Se marcó **False Positive** con un comentario: el archivo ya está limitado a 5 MB (D-46) y lo prueban S02-TC-040 y 041.
  - Era la única incidencia de seguridad. Después, `new_security_rating` pasó de C a A y el Gate a OK.
  - Se eligió False Positive y no Accept porque no hay ningún riesgo que aceptar: el límite es explícito.
- **Mutación:**
  - Los 20 sin cubrir son líneas de constantes (`FIELDS`, `EDITABLE`, `FILTERS`), que PCOV no registra como ejecutables.
  - De los 7 sobrevivientes, 3 son equivalentes: el cast `(int)` de `expected_version` y los `sometimes` de bio y experiencia.
  - Los otros 4 cambian claves que ninguna prueba distingue: los parámetros del mensaje de `ends_at` y un campo de `update` y de `publish`.
  - Duró unos 50 minutos con poca RAM libre.
- **Cypress:** cada sprint corrió por separado, con el bloqueo global. Según el usuario, Codex solo ejecutaría Vitest en su carpeta durante el cierre; no hubo bloqueos de E2E ajenos. DEF-42 no se repitió (ver [../cypress/2026-10-14-DEF-42-diagnostico.md](../cypress/2026-10-14-DEF-42-diagnostico.md)).
- **SonarQube** estaba arriba al empezar, porque lo levantó el usuario para su captura. Se analizó con el bloqueo `tmp/e2e-cypress.lock` tomado y luego se detuvo con `docker compose … --profile quality stop`.
- **Datos anonimizados:** las rutas de usuario se reemplazaron por `<raiz>` o `<usuario>`. El `sonar/issues.json` crudo está ignorado por Git (`**/sonar*/issues.json`).
