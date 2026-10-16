# Informe del Sprint 3 · Solicitud de servicio, evidencias y búsqueda de técnicos

- **Proyecto:** TécnicoYa Huancayo · curso Pruebas y Calidad de Software.
- **Módulos:** `a-solicitudes` (`ARequests`) y la consulta de técnicos de `b-matching` (`BMatching`).
- **Fecha de cierre:** 2026-10-16.
- **Revisión cerrada:**
  - `main` `913a538`: PR #14 (backend, catálogo y contrato), PR #16 (DEF-43, `composer audit`) y PR #15 (frontend);
  - la rama de cierre `feature/pimentel/a-solicitudes/s03-cierre`, con DEF-44 (guarda de los seeders E2E), la versión de SonarQube y los documentos.
- **Evidencias:** [evidencias/sprint-03/cierre/](../evidencias/sprint-03/cierre/README.md).
- **Catálogo:** [CATALOGO-S03.csv](../plan-pruebas-v3/sprint-03/CATALOGO-S03.csv), con 85 casos.
- **Contrato:** [CONTRATO-API.md](../plan-pruebas-v3/sprint-03/CONTRATO-API.md) v1.0.

## 1. Alcance logrado frente al plan

Plan: [CANVAS-Sprint-03.md](../editables/sprints-01-08/CANVAS-Sprint-03.md). Comprende 6 historias, los casos base TC-027 a TC-038 y TC-119 a TC-130, y las decisiones D-11, D-12, D-13, D-15, D-23, D-24 y D-25 más las nuevas D-55 a D-58 (2026-10-15).

| Historia | Comprometido | Resultado | IDs S03 (Pest · Cypress · Vitest) |
|---|---|---|---|
| HU-S03-01 Solicitud en cinco pasos | Recorrido con corrección y datos obligatorios (TC-027, 028, 119, 120, 123 y 124) | ✅ Hecho, con D-12 (descripción de 20 a 1000) | 010, 011, 016, 017, 026, 027, 035, 040 · 052 a 055, 061 a 063 · 069 a 071, 074, 081 |
| HU-S03-02 Evidencias privadas | Foto propia vinculada, archivo ajeno, retiro y política de fotos (TC-029, 030, 127 a 130) | ✅ Hecho: `POST /media` con `purpose=evidence` (privada) y máximo de 5 fotos | 001, 002, 014, 015, 018 a 025 · 056 a 058 · 072 |
| HU-S03-03 Tarifa y ubicación | Tarifa referencial y fuera de cobertura (TC-031, 032 y 121) | ✅ Hecho, con D-55 (inicio ≥ hora del servidor) y D-56 (dirección de 5 a 255) | 003, 004, 012, 028, 049, 050 · — · 073, 075 |
| HU-S03-04 Búsqueda y perfil público | Filtros combinados y perfil sin datos privados (TC-033 y 034) | ✅ Hecho: `GET /technicians` en `BMatching`; con D-57 el técnico en pausa no aparece | 005, 042 a 048, 051 · 064, 065 · 078, 079 |
| HU-S03-05 Solicitud desde perfil | Origen dirigido y objetivo incompatible (TC-035 y 036) | ✅ Hecho | 006, 007, 029, 038 · 066 · — |
| HU-S03-06 Mis solicitudes y envío repetido | Idempotencia del envío, solicitud ajena, inmutable tras enviar y máximo de activas (TC-037, 038, 122, 125 y 126) | ✅ Hecho, con D-11 y D-58 (N = 3 en `rule_*`, versión guardada al enviar) | 008, 009, 013, 030 a 034, 036, 037, 039, 041 · 059, 060, 067, 068 · 076, 077, 080 |
| Transversal (DEF-44) | No planificado: guarda de los seeders E2E, pedida por el usuario en el cierre | ✅ Hecho | 082 a 085 · — · — |
| RT-06 (envío idempotente) | Persistir el envío con su clave para no duplicar | ✅ Hecho en el envío (`POST …/submission`). La **creación** (`POST /requests`) no es idempotente: ver §4.2 | 008, 031 a 034, 037 · 059 · 076 |

**Resumen:**
- Las 6 historias están hechas y los 24 casos base del plan (TC-027 a 038 y TC-119 a 130) están aprobados.
- El catálogo de S3 pasó de 15 casos heredados a 85 con técnicas de caja negra:
  - valores límite de D-12, D-55 y D-56 y de la sexta foto;
  - tabla de decisión de la revalidación al enviar;
  - transición de estado (registrada → enviada; pausa);
  - pruebas negativas de privacidad y permisos.
- Trazabilidad: las 24 filas del Sprint 3 de [Matriz-Trazabilidad-TC.csv](../editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv) están en APROBADO con sus IDs S03, la revisión `2947a4d` y el Run_ID `S03-CIERRE-2026-10-15`.
- TC-122, TC-123 y TC-130 estaban BLOQUEADOS por P10 y P17. Se desbloquearon con D-11 y D-12.
- **Fuera de alcance, como estaba previsto:** el matching real y la notificación a técnicos (S4). La búsqueda de S3 es solo consulta (RT-02).

## 2. Pruebas por herramienta

| Herramienta | IDs S03 en el catálogo | IDs S03 aprobados (contador) | Meta | Ejecución de cierre | Evidencia |
|---|---|---|---|---|---|
| Pest 3 (API y MySQL 8.4) | 55 | **55** | ≥ 36 ✅ | Suite completa 189/189 (2114 aserciones); `tests/Feature/Sprint03` 55/55 | [pest-cobertura.txt](../evidencias/sprint-03/cierre/pest-cobertura.txt) |
| Cypress 16.1.1 (Chrome) | 17 | **17** | ≥ 14 ✅ | S03 17/17 en 5 specs; regresión S01 17/17 y S02 17/17 (slot A) | [cypress-s03-slotA.txt](../evidencias/sprint-03/cierre/cypress-s03-slotA.txt) |
| Vitest | 13 | **13** | ≥ 10 ✅ | 146/146 en 23 archivos | [vitest-cobertura.txt](../evidencias/sprint-03/cierre/vitest-cobertura.txt) |
| pytest (prototipo congelado) | — | — | No cuenta | 4/4 como regresión | [pytest.txt](../evidencias/sprint-03/cierre/pytest.txt) |
| **Total (IDs distintos)** | **85** | **85** | ≥ 60 ✅ | 0 fallidos y 0 omitidos | [conteo.txt](../evidencias/sprint-03/cierre/conteo.txt) |

- La regresión de los sprints anteriores sigue completa: S01 con 87 IDs y S02 con 90.
- Fuera de la meta: 21 Pest y 38 Vitest sin ID (prototipo histórico) y las 4 de pytest.
- S03-TC-082 a 085 son nuevos en el cierre: son las pruebas de DEF-44.

## 3. Métricas

| Métrica | Valor | Base de cálculo |
|---|---|---|
| **Tasa de aprobación (cierre)** | **100 %**: 85/85 IDs S03; 390/390 ejecuciones (189 Pest, 51 Cypress, 146 Vitest y 4 pytest) | Regresión S3.6 en el slot A |
| Tasa de aprobación en el primer intento | Pest 30/51 en el rojo de S3.2: las 21 fallas eran las esperadas por TDD. Guarda de seeders 1/4 en rojo. Cypress S3.5 (Codex): 15/17, 15/17, 16/17 y 16/17 antes del 17/17; fallaban helpers de teclado, foco y diálogo, no el producto | `01-rojo-antes-de-implementar.txt`, `cierre/01-guarda-seeders-rojo.txt` y `cypress/` |
| **Cobertura del backend** | Total 96,5 % (2856/2959 sentencias); módulos del sprint `ARequests` **100 %** (189/189) y `BMatching` **100 %** (69/69) | PCOV y Clover |
| **Cobertura del frontend** | Líneas 83,42 % (sentencias 75,05 %); `features/requests` **84,67 %** y `features/matching` **83,92 %** en líneas | V8 y LCOV |
| Cobertura en SonarQube | Código nuevo **86,2 %** (umbral 70 %); total 86,1 % | Análisis `sprint-03` |
| **Mutación** | Clases nuevas o modificadas en el cierre (`E2EDatabaseGuard` y los 3 seeders E2E): **98,29 %**, con 344/350 eliminados, 0 sobrevivientes y 6 sin cubrir (constantes). Las 10 clases de S3.3: **93,05 %**, con 375/403 eliminados y 0 sobrevivientes | `pest --mutate`: [mutacion-seeders.txt](../evidencias/sprint-03/cierre/mutacion-seeders.txt) y `04-mutacion.txt` |
| **Densidad de defectos** | 2 defectos del sprint / 4,168 KLOC nuevas = **0,48 por KLOC**. Del código de producto: **0** (DEF-43 viene de dependencias externas y DEF-44 de los datos de prueba). Sobre todo el código analizado (9,857 KLOC): 0,20 por KLOC | DEF-43 y 44; `new_lines` y `ncloc` de SonarQube |
| **Eficacia de corrección** | Sprint: 2/2 cerrados (**100 %**). Registro acumulado: 32 cerrados de 41 no duplicados (**78,0 %**; en S2 era 69,2 %) | `REGISTRO-DEFECTOS.csv` |
| **Deuda técnica** | 861 min (~14,4 h) frente a 952 en S2; 85 min en código nuevo. Rating de mantenibilidad A. 120 code smells (32 críticos) frente a 143 (34 críticos) | SonarQube |
| Fiabilidad y seguridad | 0 bugs, 0 vulnerabilidades y 0 hotspots; ratings A | SonarQube |
| Duplicación | Código nuevo 0,0 %; total 0,8 % (0,9 % en S2) | SonarQube |
| **Quality Gate «TecnicoYa»** | **APROBADO (OK)** a la primera: las 5 condiciones en verde, sin reclasificar incidencias. Revisión `2947a4d`; periodo `PREVIOUS_VERSION` desde `sprint-02` | [gate.json](../evidencias/sprint-03/cierre/sonar/gate.json) |
| Dependencias | `composer audit` sin avisos (tras DEF-43); `npm audit` 0 vulnerabilidades | [composer-audit.txt](../evidencias/sprint-03/cierre/composer-audit.txt) y [npm-audit.txt](../evidencias/sprint-03/cierre/npm-audit.txt) |

**Code smells:**
- Los 120 se reparten en 66 de JavaScript y 54 de PHP.
- **Bajaron 23** respecto de S2, sobre todo por el PR #12 de Codex (`S6819`: de 13 a 7; `S3358`: de 20 a 11).
- **En código nuevo hay 8**, todos menores o medios:

  | Regla | Archivo | Responsable |
  |---|---|---|
  | `javascript:S6772` ×3, espacio ambiguo en JSX | `TechnicianSearch.jsx:88`, `EvidencePicker.jsx:158` y `RequestSummary.jsx:135` | Codex |
  | `javascript:S7776` | `searchQuery.js:1` (`allowed` debería ser un `Set`) | Codex |
  | `javascript:S6749` | `RequestWizard.jsx:149` (fragmento con un solo hijo) | Codex |
  | `javascript:S2004`, crítico | `useWizardFlow.js:26` (funciones anidadas más de 5 niveles) | Codex |
  | `php:S112` ×2 | `RuleBook.php:19` y `27` (excepción genérica) | Claude Code |

- **Lo más frecuente en el total:** `php:S121` (25, `if` sin llaves, casi todo en el prototipo congelado), `javascript:S2681` (12) y `javascript:S3358` (11).

## 4. Defectos

### 4.1 Registro

**Defectos del sprint (todos cerrados):**

| ID | Severidad | Origen | Resumen | Cierre |
|---|---|---|---|---|
| DEF-43 | Alta | CI del PR #15; afectaba a `main` | `composer audit` fallaba por CVE-2026-108082 (`symfony/http-foundation`) y CVE-2026-109413 (`symfony/yaml`) | `b69b637` (PR #16): parche dentro de 7.4 sin `-W` |
| DEF-44 | Media | S3.3, siembra E2E manual | Una siembra sin las variables del slot apuntó a la base de desarrollo `tecnicoya`; MySQL rechazó el acceso y no cambió nada. La guarda solo existía en `Sprint01E2ESeeder` y los otros dos seeders dependían de que se llamara primero | `66be473`: `E2EDatabaseGuard` al inicio de cada seeder; S03-TC-082 a 085 en rojo (`e7d4878`) y verde |

**Cerrados en el cierre:** DEF-16 (matriz de S2 y S3), DEF-24 (pantallas v1 de S3) y DEF-25 (Vitest v1 de S3).

**Siguen abiertos** (9): DEF-09, 17 (parcial), 22, 26, 28, 29, 30, 32 y 33. Los que afectan el próximo cierre:

- **DEF-22.** Código histórico activo: D-26 permite retirarlo cuando las pantallas v1 de S2 y S3 pasen Cypress, y **eso ya se cumple** (S02 y S03 17/17). Falta que el equipo programe el retiro.
- **DEF-33.** Capítulos 13 y 14 del informe; este documento les da los datos (§7).
- **DEF-26.** `rules.json` del prototipo; deja de importar al retirarlo (DEF-22).

Registro completo: [REGISTRO-DEFECTOS.csv](../calidad/REGISTRO-DEFECTOS.csv) y [REGISTRO-DEFECTOS.md](../calidad/REGISTRO-DEFECTOS.md).

### 4.2 Límites de contrato anotados por Codex (decisiones pendientes)

Codex los dejó en `HANDOFF-codex.md` (S3.5). No son defectos: el contrato v1.0 no los promete. Están registrados como pendientes en [DECISIONES.md](DECISIONES.md) y **no se implementó nada**.

**IDEM-01 · `POST /requests` no es idempotente.** Si se pierde la respuesta de la creación, la SPA no sabe si la solicitud existe. Hoy lo resuelve mandando a revisar «Mis solicitudes», sin reenviar. Un reintento manual puede dejar dos borradores `registered`, que no cuentan para el máximo de 3 activas (D-11).

| Opción | Qué cambia | Ventajas | Costes |
|---|---|---|---|
| **A (recomendada)** | `POST /requests` acepta `Idempotency-Key`, reutilizando `App\Shared\Http\Idempotency` del envío: la misma clave con el mismo cuerpo devuelve el mismo 201 y la misma clave con otro cuerpo, 409 `STALE_VERSION`. La cabecera es **opcional** en la API (compatible con v1.0) y la SPA la manda siempre | Elimina el duplicado en origen; usa el mismo mecanismo ya probado (S03-TC-008 y 031 a 037); la SPA puede reintentar sola | Contrato v1.1; unos 4 casos Pest y 1 Vitest; Codex ajusta el asistente |
| B | Sin cambios en el servidor: la SPA, tras un resultado incierto, consulta `GET /requests` y ofrece **retomar** el borrador más reciente creado en el último minuto con la misma subcategoría y descripción | No toca el backend | Heurística frágil: dos borradores iguales y legítimos no se distinguen; el duplicado sigue siendo posible por la API |

**MEDIA-02 · Foto de evidencia subida y no vinculada sin ruta para borrarla.** `DELETE /requests/{id}/attachments/{media}` solo **desvincula**: no hay `DELETE /media/{id}`. Una foto subida en el paso 3 y nunca adjuntada, o desvinculada, queda privada y solo visible para su titular, pero ocupa espacio y no se elimina nunca.

| Opción | Qué cambia | Ventajas | Costes |
|---|---|---|---|
| **A (recomendada)** | `DELETE /media/{id}` para el titular, solo si `purpose=evidence` y no está vinculada a ninguna solicitud (vinculada: 409). Marca `retired_at`, borra el archivo y registra la auditoría; 204. La SPA lo llama al quitar una foto aún no adjuntada, con confirmación (CRUD-03) | El usuario controla sus datos; es comprobable con Pest (titular, ajeno, vinculada, ya retirada) y Cypress | Endpoint nuevo en el contrato v1.1; unos 4 casos Pest y 1 Cypress |
| B | Limpieza automática: un comando programado (`media:purge-unlinked`) borra las evidencias sin vínculo con más de 24 h, sin endpoint nuevo | La SPA no cambia; también limpia lo que deja un navegador cerrado a mitad | Requiere el programador de tareas en cada entorno; el usuario no puede borrar al momento; los plazos se prueban con reloj controlado |

Se recomienda **A en los dos casos para S4**, y dejar la opción B de MEDIA-02 como complemento posible en S7 (administración y parámetros).

## 5. Capturas que debes tomar

Ejecuta cada comando desde la raíz del repositorio en PowerShell, salvo que se indique otra cosa. Haz una sola corrida de Cypress a la vez y nunca con SonarQube arriba. El arrancador informa la RAM libre.

| # | Captura | Comando exacto | Qué debe verse |
|---|---|---|---|
| 1 | Pest del Sprint 3 | `cd backend/api; $env:TECNICOYA_SLOT='A'; C:\xampp\php\php.exe artisan config:clear; C:\xampp\php\php.exe vendor/pestphp/pest/bin/pest tests/Feature/Sprint03` | `Tests: 55 passed` |
| 2 | Guarda de los seeders (DEF-44) | `cd backend/api; $env:TECNICOYA_SLOT='A'; C:\xampp\php\php.exe vendor/pestphp/pest/bin/pest tests/Feature/Sprint03/E2ESeederGuardTest.php` | S03-TC-082 a 085 en verde, `4 passed` |
| 3 | Cobertura del backend | `cd backend/api; $env:PATH="C:\xampp\php;$env:PATH"; $env:TECNICOYA_SLOT='A'; composer test:coverage` | Tabla por clase y `Total: 96.5 %`; filas `ARequests` y `BMatching` al 100 % |
| 4 | Vitest con cobertura | `cd frontend/web; npm run test:coverage` | `Tests 146 passed`; filas `features/requests` (84,67 %) y `features/matching` (83,92 %) |
| 5 | Cypress del Sprint 3 | `node scripts/run-e2e.mjs --sprint 03 --slot A` | `RAM libre: …` al inicio y `All specs passed! 17 17` |
| 6 | Cypress S01 y S02 (regresión) | `node scripts/run-e2e.mjs --sprint 01 --slot A` y luego `node scripts/run-e2e.mjs --sprint 02 --slot A` | `All specs passed! 17 17` en cada una |
| 7 | Conteo por sprint | `node scripts/contar-pruebas-sprint.mjs` | Fila `S03 \| 55 / 0 / 0 \| 17 / 0 / 0 \| 13 / 0 / 0 \| 85 \| Sí` |
| 8 | Mutación del cierre | `Get-Content docs\documentacion\evidencias\sprint-03\cierre\mutacion-seeders.txt -Tail 5`. Para repetirla: `cd backend/api; $env:TECNICOYA_SLOT='A'; C:\xampp\php\php.exe -d pcov.enabled=1 -d pcov.directory=. -d "pcov.exclude=~(vendor\|storage\|bootstrap/cache)~" vendor/pestphp/pest/bin/pest tests/Feature/Sprint03/E2ESeederGuardTest.php --mutate --everything --clear-cache --path=database/seeders/E2EDatabaseGuard.php,database/seeders/Sprint01E2ESeeder.php,database/seeders/Sprint02E2ESeeder.php,database/seeders/Sprint03E2ESeeder.php` | `Mutations: 6 uncovered, 344 tested` y `Score: 98.29%` |
| 9 | pytest (regresión) | `cd python/api; $env:PYTHONPATH='..\..\.runtime-python'; <python 3.12> -m pytest -q -p no:cacheprovider` | `4 passed` |
| 10 | SonarQube: Quality Gate | `wsl -d docker-desktop -u root -- sysctl -w vm.max_map_count=524288`, luego `docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality up -d sonarqube`, y abrir `http://127.0.0.1:9000/dashboard?id=tecnicoya-huancayo` | «Passed», versión `sprint-03`, cobertura nueva 86,2 % |
| 11 | SonarQube: medidas e incidencias nuevas | `http://127.0.0.1:9000/component_measures?id=tecnicoya-huancayo` y `http://127.0.0.1:9000/project/issues?id=tecnicoya-huancayo&resolved=false&inNewCodePeriod=true`. Al terminar: `docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality stop` | Cobertura 86,1 %, deuda de 861 min, 120 code smells; 8 incidencias en código nuevo |
| 12 | Auditoría de dependencias | `cd backend/api; $env:PATH="C:\xampp\php;$env:PATH"; composer audit` y `cd frontend/web; npm audit` | «No security vulnerability advisories found» y «found 0 vulnerabilities» |
| 13 | CI del PR de cierre | `gh pr checks feature/pimentel/a-solicitudes/s03-cierre` y `gh pr view feature/pimentel/a-solicitudes/s03-cierre --web` | backend, frontend y conteo en `pass` |
| 14 | Registro de defectos | Abrir `docs/documentacion/calidad/REGISTRO-DEFECTOS.md` en VS Code (vista previa con `Ctrl+Shift+V`) | DEF-43 y DEF-44 en Cerrado y el resumen 32 / 9 / 3 |
| 15 | Trazabilidad | Abrir `docs/documentacion/editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv` con filtro `Sprint = 3` | 24 filas en APROBADO con `S03-CIERRE-2026-10-15` |

## 6. Retrospectiva

**Qué funcionó**
- Contrato v1.0 y catálogo antes que el código, otra vez. Codex construyó las pantallas sin pedir cambios de contrato, y los dos límites que encontró los anotó en vez de inventar endpoints.
- Revalidar al enviar y la idempotencia del envío quedaron cubiertas por tablas de decisión y por pruebas de concurrencia (doble clic y la misma clave con otro cuerpo).
- La mutación de S3.3 dejó 0 sobrevivientes en las 10 clases sin necesidad de un refuerzo posterior: las aserciones de campos de respuesta y de eventos se escribieron desde el principio, como se acordó en S2.
- El Gate pasó a la primera, sin reclasificar incidencias, y los code smells bajaron de 143 a 120.

**Qué no funcionó**
- **Cypress S3.5** necesitó seis commits de ajuste de pruebas (teclado nativo por CDP, foco, `output`, `dialog`) antes del 17/17. Ninguno cambió aserciones esperadas, pero consumió tiempo.
- **DEF-43** llegó de fuera (dos CVE de Symfony) y bloqueó la CI de `main` y del PR #15 hasta el PR #16.
- **DEF-44:** una siembra manual sin las variables del slot apuntó a la base de desarrollo. No pasó nada, pero la protección dependía del orden de las llamadas entre seeders.
- **Herramientas del entorno:** el token de análisis de SonarQube no puede leer `project_analyses` ni `hotspots`, y la máquina no tiene Python 3.12 en el PATH para pytest.

**Qué cambiamos para S4**
- Decidir IDEM-01 y MEDIA-02 (§4.2) antes de escribir el contrato S4.
- Reutilizar en las specs de S4 los helpers de teclado nativo y de diálogo de S3.5, en vez de escribir otros.
- Codex corrige las 6 incidencias nuevas del frontend, en especial `S2004` en `useWizardFlow.js`. Claude Code corrige los 2 `php:S112` de `RuleBook`, con una excepción dedicada.
- Programar el retiro del prototipo (DEF-22, D-26): la condición ya se cumple.
- Sembrar siempre con `node scripts/run-e2e.mjs`. Para hacerlo a mano, usar las variables del arrancador; la guarda ahora nombra la base rechazada.

## 7. Datos para el informe

Los capítulos siguen `informe-final/contenido-editable.md`. El capítulo 14 sigue sin existir en ese archivo (DEF-33); se propone, como en S1 y S2, usarlo para el balance por sprint.

**Capítulo 8 · Desarrollo del sistema (§8.2, funcionalidades del Sprint 3)**
- **Solicitud en cinco pasos (RT-05):**
  1. especialidad;
  2. subcategoría;
  3. descripción y fotos;
  4. ubicación, modalidad y franja;
  5. resumen y envío.

  Registro (`POST /requests`), corrección con `expected_version` (`PATCH`) y envío separado (`POST …/submission`).
- **Validación en cliente y servidor:**
  - descripción de 20 a 1000 caracteres (D-12);
  - dirección de 5 a 255 (D-56);
  - inicio programado igual o posterior a la hora del servidor (D-55);
  - subcategoría activa y de la especialidad;
  - distrito con cobertura.
- **Evidencias:** `POST /media` con `purpose=evidence` para clientes, privadas, JPG, PNG o WebP de hasta 5 MB, y como máximo 5 por solicitud. Solo las descarga su titular; el técnico no notificado recibe 404 (TC-127). Retiro con confirmación antes del envío.
- **Envío:**
  - revalida subcategoría, distrito y técnico objetivo (D-24);
  - aplica el máximo de 3 activas, leído de `rule_*` versión 1 (D-11 y D-58);
  - guarda `rule_version_id`;
  - es idempotente con `Idempotency-Key` (RT-06).

  Una vez enviada, la solicitud no se modifica (TC-126). Cada cambio deja un evento en `request_events`, con actor, estados y versión.
- **Búsqueda y perfil (`BMatching`, solo consulta):** `GET /technicians` con filtros combinables y proyección pública sin WhatsApp ni documentos; el técnico en pausa queda fuera (D-57). `GET /technicians/{id}` muestra el perfil público. «Solicitar servicio» precarga `source=profile` y el técnico objetivo.
- **Frontend v1 (Codex):** `features/requests` (asistente, evidencias, resumen y Mis solicitudes) y `features/matching` (búsqueda y perfil), con alertas de éxito, error y resultado incierto.
- **Integración:** PR #14 (backend), PR #15 (frontend) y PR #16 (DEF-43).

**Capítulo 11 · Estrategia de pruebas**
- **Enfoque:** TDD y caja negra sobre el contrato v1.0.
- **Técnicas:**
  - valores límite: descripción de 19/20 y 1000/1001; dirección de 4/5 y 255/256; quinta y sexta foto; 5 MB; inicio en la hora del servidor;
  - partición de equivalencia;
  - tabla de decisión (revalidación al enviar y filtros de búsqueda);
  - transición de estados (`registered` → `sent`, pausa vigente y terminada);
  - concurrencia (doble clic, la misma clave con otro cuerpo, la misma clave en dos clientes);
  - pruebas negativas de privacidad y de permisos.
- **Niveles:**
  - Vitest: validadores del asistente y componentes;
  - Pest: API con MySQL 8.4;
  - Cypress: E2E del asistente, evidencias, búsqueda y Mis solicitudes.
- **Tipos:** funcionales, de seguridad (evidencias privadas, solicitud ajena, campos manipulados), de accesibilidad (asistente solo con teclado, S03-TC-063; indicador de pasos, 081), de regresión (S01, S02 y prototipo) y de mutación.
- **Plan de ejecución:**
  1. S3.1, catálogo, contrato y D-55 a D-58;
  2. S3.2, Pest en rojo;
  3. S3.3, backend en verde y mutación;
  4. S3.4, frontend con Vitest;
  5. S3.5, Cypress integrado;
  6. S3.6, regresión, DEF-44, SonarQube y cierre.

**Capítulo 12 · Automatización**
- **Herramientas:** Pest 3 con pest-plugin-mutate y PCOV, Vitest con V8, Cypress 16.1.1 con Chrome, pytest (regresión), SonarQube 26.9 con scanner 8.1, `composer audit` y `npm audit`.
- **CI:** GitHub Actions (D-39) en cada PR. Detectó DEF-43 antes de que llegara a una entrega.
- **Entorno:** un contenedor MySQL 8.4 con dos slots (A y B), bloqueo global de Cypress y datos sintéticos.
- **`Sprint03E2ESeeder`:** clientes con 3 enviadas y con estados mixtos, técnico de refrigeración y técnico en pausa. Desde el cierre, los tres seeders E2E pasan por `E2EDatabaseGuard` (DEF-44, D-59).

**Capítulo 13 · Métricas de calidad**
- **§13.1:** 85/85 IDs y 390/390 ejecuciones (§2 y §3).
- **§13.2:** DEF-43 y DEF-44, cerrados. El registro tiene 44 defectos: 32 cerrados, 9 abiertos y 3 duplicados (§4).
- **§13.3:**
  - cobertura del 100 % en `ARequests` y `BMatching` y de 84,67 % y 83,92 % en `features/requests` y `features/matching`;
  - mutación de 93,05 % (S3.3) y 98,29 % (cierre), con 0 sobrevivientes;
  - densidad de 0,48 defectos por KLOC nueva (0 de producto);
  - eficacia de corrección de 100 % en el sprint.
- **§13.3.1, comparación con SonarQube:**

  | Medida | `sprint-01` (`4171f06`) | `sprint-02` (`e176a6b`) | `sprint-03` (`2947a4d`) |
  |---|---|---|---|
  | Gate | OK | OK (tras revisar `php:S5693`) | OK a la primera |
  | Cobertura de código nuevo | 77,8 % | 82,5 % | 86,2 % |
  | Cobertura total | 84,7 % | 84,2 % | 86,1 % |
  | Duplicación total | 1,5 % | 0,9 % | 0,8 % |
  | Code smells | 116 (35 críticos) | 143 (34 críticos) | 120 (32 críticos) |
  | Deuda | 850 min | 952 min | 861 min |
  | Bugs, vulnerabilidades y hotspots | 0 | 0 | 0 |

- **§13.4, características ISO/IEC 25010:**
  - adecuación funcional: 6 de 6 historias;
  - seguridad: evidencias privadas, permisos por titular, idempotencia y guarda de datos de prueba;
  - mantenibilidad: rating A, con deuda y duplicación a la baja;
  - fiabilidad: 0 bugs;
  - usabilidad y accesibilidad: S03-TC-063 y 081, con 7 avisos `S6819` y 3 `S6772` pendientes.

**Capítulo 14 (propuesto) · Balance del Sprint 3**
- Alcance cumplido en 6 de 6 historias y en los 24 casos base del CANVAS.
- Meta de pruebas superada: 85 IDs frente a 60.
- Gate aprobado a la primera.
- Defectos del sprint externos al código de producto.
- Pendientes: dos decisiones de contrato (IDEM-01 y MEDIA-02) y el retiro del prototipo (DEF-22).
- Retrospectiva en §6 y DoD en §8.

## 8. Definición de terminado

| Criterio (AGENTS.md, regla 8) | Estado | Evidencia |
|---|---|---|
| Alertas de éxito y error en cada operación CRUD, con su prueba | ✅ | Cypress 056 (retiro de foto), 061 y 062 (422 y 500 al enviar), 060 (resultado incierto) y 068 (cuarta activa); Vitest 077 y 080 |
| Doble validación | ✅ | Vitest 069, 071 a 073 (validadores de pasos, descripción, evidencias y paso 4); Pest 010, 016, 017, 018 a 021, 049 y 050 |
| Textos en español | ✅ | `assertSpanishText` y `assertSpanishValidation` en Pest; textos verificados en Vitest y Cypress |
| Confirmación antes de eliminar | ✅ | S03-TC-056: cancelar no envía el `DELETE` de la foto |
| Accesibilidad básica | ✅ con observación | S03-TC-063 (asistente solo con teclado) y 081 (indicador de pasos con `aria-current`). Quedan 7 `S6819` y 3 `S6772` nuevos |
| Permisos en servidor con prueba negativa | ✅ | S03-TC-002, 009, 014, 015, 023, 036 y 040 |
| Auditoría de acciones sensibles | ✅ | `request_events` con actor, estados y versión (S03-TC-041); evento único de envío (008 y 032); sin evento ante una operación rechazada (024) |
| Cobertura ≥ 70 % en el módulo | ✅ | 100 % (backend de `ARequests` y `BMatching`); 84,67 % y 83,92 % (frontend) |
| Quality Gate aprobado | ✅ | `sprint-03`, OK sin reclasificaciones |
| Sin vulnerabilidades críticas o altas nuevas | ✅ | `composer audit` y `npm audit` limpios; 0 vulnerabilidades en SonarQube |
| Evidencias guardadas | ✅ | `evidencias/sprint-03/` |

**Veredicto:** el Sprint 3 **cumple la definición de terminado**, con estas salvedades:

1. IDEM-01 y MEDIA-02 quedan como decisiones pendientes. No son incumplimientos del contrato v1.0, pero limitan la experiencia ante una creación incierta y dejan fotos sin vincular.
2. Hay 8 incidencias nuevas de mantenibilidad (6 del frontend y 2 del backend), ninguna bloqueante para el Gate.
3. Dos sentencias defensivas de la guarda de seeders no tienen prueba propia (ver el README de evidencias).
4. La revisión humana de este PR de cierre está [PENDIENTE].
