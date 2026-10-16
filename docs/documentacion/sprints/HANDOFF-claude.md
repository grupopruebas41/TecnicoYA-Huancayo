# HANDOFF · Claude Code (backend)

Archivo de relevo de Claude Code (regla 12 de AGENTS.md). La entrada más reciente va primero. Al empezar, leer también [HANDOFF-codex.md](HANDOFF-codex.md).

## 2026-10-16 · Retiro del prototipo: regresión, DEF-45 y PR

- **Rama:** `feature/pimentel/infra/retiro-prototipo`, con `main` `4e85669` fusionado (PR #18 de Codex y etiqueta `v0.3-antes-retiro-prototipo` sobre `cced99e`). Merge sin conflictos.
- **DEF-45** (segundo artisan manual contra `tecnicoya`):
  - `DestructiveCommandGuard` rechaza `migrate:fresh`, `migrate:refresh`, `migrate:reset`, `db:wipe` y `db:seed` con `APP_ENV=testing` si la base, o la de `--database`, no termina en `_testing`.
  - Va en `AppServiceProvider`, leyendo `argv`. **Laravel no emite `CommandStarting` con `APP_ENV=testing`** (`runningUnitTests`), así que un listener de eventos no sirve.
  - Commits: `017d786` y `0ac7ce8` (rojo; las pruebas pasan a un proceso aparte, explicado en el commit) y `20cf695` (verde, con S04-TC-127 dentro del proceso).
- **Regla nueva** (AGENTS §13 y memoria): artisan a mano solo con las variables del slot o con el arrancador.
- **Regresión** (slot A):

  | Prueba | Resultado |
  |---|---|
  | Pest | 176/176 |
  | Mutación de la guarda | 21/21 |
  | Vitest | 117/117 (82,66 % de líneas) y build |
  | Cypress S01, S02 y S03 | 17/17 cada uno |
  | `composer audit` y `npm audit` | Limpios |

  Evidencias en `evidencias/sprint-04/retiro/`. Avance en `docs/avances/pimentel/sprint-04/avance.md`.
- **Para la rama del S4:** al fusionar `main`, agregar S04-TC-120 a 127 a `CATALOGO-S04.csv` y resolver el conflicto del HANDOFF (las dos ramas añaden entradas arriba).

**Qué falta:** que se integre este PR; después, merge de `main` en `feature/mayhuasca/b-matching/s04`, S4.2 y S4.3.

## 2026-10-16 · Retiro del prototipo, parte backend, Python e infraestructura (D-26, D-62)

- **Rama:** `feature/pimentel/infra/retiro-prototipo`, desde `main` `cced99e`. **Sin publicar:** se publica tras la regresión.
- **Commits:**
  - `07e15aa` refactor: API con token, backend del prototipo y migración 000020;
  - `ae11118` chore: Python, `domain/`, `sync-rules.py`, Compose, VS Code y `project.yml`;
  - `f5f8100` docs: AGENTS §2 (Vite 8 y Vitest 5), README, PLAN-MAESTRO, D-26 y DEF-22/26 cerrados.
- **Pruebas** (slot A):
  - Pest **168/168** (1940 aserciones). Antes eran 189; salen las 21 del prototipo.
  - `route:list`: fuera de `/api/v1` solo queda `GET /api/health`.
  - Migración 000020 comprobada con `migrate:fresh`, `rollback` y `migrate`, desde una prueba temporal de Pest ya borrada.
- **Aviso:** un `artisan migrate:fresh --env=testing` a mano apuntó a la base de desarrollo `tecnicoya` y MySQL rechazó el acceso, sin cambios (mismo patrón que DEF-44). Para pruebas manuales de base, usar Pest o las variables del arrancador.
- **Pendiente para Pimentel:** la etiqueta previa al retiro todavía no existía en origin al empezar (`git ls-remote --tags` vacío).
- **Referencias:** D-62 y D-63 se citan aquí, pero sus filas están en la rama del S4 (`96a055a`) y llegan a `main` con ese PR.
- **Sin cambiar:** `users.role` (lo usan `AuthorizationSeeder` y una prueba de S1) y los generadores históricos `scripts/generar-*.py` y `documentar-calidad.py`, que describen el plan antiguo.

**Qué falta:**
1. Que se integre el PR de frontend de Codex.
2. Merge de `main` en esta rama y regresión completa en el slot A: Pest, Vitest, Cypress S01, S02 y S03 (uno a la vez), `composer audit` y `npm audit`.
3. Push, PR con `gh` y CI.

**Para Codex:** tu parte es la lista F de ANALISIS-S04 §5. Además retira la copia `frontend/web/src/domain/rules.json` (DEF-26).

## 2026-10-16 · Sprint 3 · cierre S3.6 completado

- **Rama:** `feature/pimentel/a-solicitudes/s03-cierre`, desde `main` `913a538` (PR #14, #15 y #16).
- **Commits:**
  - `e7d4878` test(s03): S03-TC-082 a 085 (3 en rojo);
  - `66be473` fix(s03): `E2EDatabaseGuard` (DEF-44);
  - `2947a4d` ci(s03): `projectVersion=sprint-03`;
  - `e99cfef` docs(s03): cierre del Sprint 3;
  - test(s03): S03-TC-085 no depende del nombre de la base. En la primera CI falló porque la base es `tecnicoya_ci_testing` y la guarda la rechaza con razón.
  - **PR #17:** https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/17
- **Aviso:** para comprobar esa corrección, la prueba de la guarda corrió también en el slot B, lo que recreó `tecnicoya_b_testing` (`RefreshDatabase`). Codex no estaba ejecutando nada.
- **Resultados** (slot A; Codex no corrió nada):

  | Prueba | Resultado |
  |---|---|
  | Pest | 189/189 (2114 aserciones); total 96,5 %; `ARequests` y `BMatching` 100 % |
  | Vitest | 146/146; líneas 83,42 %; `requests` 84,67 % y `matching` 83,92 % |
  | pytest | 4/4, con Python 3.12 local y `PYTHONPATH=.runtime-python` |
  | Cypress | S01, S02 y S03 17/17 cada uno |
  | Conteo S03 | **85 IDs** (Pest 55, Cypress 17, Vitest 13) |
  | Mutación de las 4 clases del cierre | 98,29 % (0 sobrevivientes) |
  | SonarQube `sprint-03` (`2947a4d`) | Gate **OK** a la primera; cobertura nueva 86,2 % |
  | Auditorías | `composer audit` y `npm audit` limpios |

  SonarQube se detuvo al terminar.
- **DEF-44:** la guarda de base aislada solo vivía en `Sprint01E2ESeeder`. Ahora `E2EDatabaseGuard::ensureIsolated()` va al inicio de los tres seeders E2E y nombra la base rechazada (D-59).
- **Registro:**
  - DEF-44 nuevo y cerrado;
  - DEF-16, 24 y 25 cerrados;
  - resumen: 32 cerrados, 9 abiertos y 3 duplicados.
- **Matriz y catálogo:** 24 de 24 filas de S3 en APROBADO; S03-TC-052 a 081 pasan a Implementado.
- **Decisiones pendientes nuevas:** IDEM-01 (`POST /requests` no es idempotente) y MEDIA-02 (no se puede borrar una evidencia no vinculada). Recomendación: A en ambas (INFORME-SPRINT-03 §4.2). **No implementar sin la decisión.**
- **Avance de Mayhuasca S3:** revisor «Pimentel Chumbes James», indicado por el usuario.
- **SonarQube, incidencias nuevas** (8, ninguna bloquea el Gate):
  - para Claude Code: `php:S112` ×2 en `RuleBook.php:19` y `27`;
  - para Codex: el resto (ver «Para Codex»).

**Qué falta:**
- Revisión humana e integración del PR de cierre.
- Decidir IDEM-01 y MEDIA-02.
- Programar el retiro del prototipo (DEF-22): la condición de D-26 ya se cumple.

**Para Codex:**
1. Incidencias nuevas de SonarQube en tu código:
   - `S2004` (crítica) en `useWizardFlow.js:26`;
   - `S6772` ×3 en `TechnicianSearch.jsx:88`, `EvidencePicker.jsx:158` y `RequestSummary.jsx:135`;
   - `S7776` en `searchQuery.js:1`;
   - `S6749` en `RequestWizard.jsx:149`.
2. Cuando se decidan IDEM-01 y MEDIA-02, habrá contrato v1.1 antes de tocar el asistente.

**Bloqueos:** ninguno.

## 2026-10-15 · Sprint 3 · DEF-43: composer audit (PR #16)

- **Rama:** `feature/pimentel/infra/s03-composer-audit`, desde `main` `5814a5d` (con el PR #14).
- **PR #16:** https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/16. CI con backend, frontend y conteo en verde.
- **Causa:** la CI del PR #15 (Codex) fallaba en `composer audit` por dos avisos, CVE-2026-108082 y CVE-2026-109413. También afectaba a `main`.
- **Cambio:** `composer update symfony/http-foundation symfony/yaml --with-dependencies`, sin `-W`.
  - `symfony/http-foundation` y `symfony/yaml`: 7.4.17 → 7.4.21.
  - `symfony/polyfill-mbstring`, `polyfill-php80` y `polyfill-php83`: → 1.43.0.
  - Solo cambia `composer.lock`.
- **Verificación:** `composer audit` limpio; Pest 185/185 en el slot A. DEF-43 registrado y cerrado (`b69b637`).

**Para Codex:** cuando se integre el PR #16, fusionar `main` en la rama del PR #15 para que su CI pase.

## 2026-10-15 · Sprint 3 · S3.3 completado (backend en verde y PR)

- **Rama:** `feature/mayhuasca/a-solicitudes/s03`, publicada. Commit `20dcc34` feat(s03) y `5f10884` docs. **PR #14:** https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/14
- **Implementado:**
  - `POST /media` con `purpose=evidence` (solo clientes, privada);
  - límites de descripción, dirección e inicio programado (D-12, D-55, D-56);
  - máximo de 5 fotos;
  - `SubmissionPolicy`: revalida al enviar y aplica el máximo de 3 activas con `rule_version_id` (D-11, D-24, D-58);
  - tablas `rule_*` y `RuleBook`;
  - `GET /technicians` en `BMatching` (D-18, D-57);
  - `Sprint03E2ESeeder`.
- **Resultados** (slot A):

  | Prueba | Resultado |
  |---|---|
  | Pest | **185/185** (2100 aserciones); Sprint03 51/51 |
  | Cobertura | Total 90,5 %; clases del sprint al 100 % |
  | Mutación de las 10 clases | **93,05 %**: 375/403, 0 sobrevivientes y 28 constantes sin cubrir. Corrió con `tmp/e2e-cypress.lock` tomado, que se liberó al terminar |
  | `composer audit` | Limpio |
  | Seeder E2E | Idempotente |

- **Evidencias:** `evidencias/sprint-03/01` (rojo), `02` (verde), `04` (mutación) y `05` (audit). Avance en `docs/avances/mayhuasca/sprint-03/avance.md`.
- **Aviso:**
  - una primera prueba del seeder sin las variables del slot apuntó a la base `tecnicoya`; MySQL rechazó el acceso y no cambió nada;
  - para sembrar a mano, usar las variables del arrancador (`DB_DATABASE=tecnicoya_testing`, `DB_USERNAME=tecnicoya_test`, `APP_ENV=testing`).

**Para Codex (S3.4 y S3.5):**
- El backend del contrato ya responde en esta rama.
- Para Cypress, esperar a que el PR esté en `main`. `node scripts/run-e2e.mjs --sprint 03 --slot B` usará `Sprint03E2ESeeder`, con cuentas `e2e-client-limit`, `e2e-client-mixed`, `e2e-technician-frio` y `e2e-technician-paused` (`@example.test`).

**Qué falta:** revisión e integración del PR; S3.4 y S3.5 de Codex; cierre S3.6.

## 2026-10-15 · Sprint 3 · S3.2 completado (Pest en rojo)

- **Rama:** `feature/mayhuasca/a-solicitudes/s03`. Commit `acebacc`: test(s03) S03-TC-016 a 051.
- **Resultado:** Pest Sprint03 con **21 en rojo y 30 en verde** (431 aserciones), slot A. Detalle y motivo de cada fallo en `evidencias/sprint-03/01-rojo-antes-de-implementar.txt`.
- **Ya pasan con el código existente**, sin tocar el producto, y se conservan como regresión:
  - 001 a 015 (las 15 renombradas);
  - 023 a 026 y 031 a 041.
  - La 020 se endureció: exige un único error en `file`, para que no pase solo porque `purpose=evidence` aún no existe.
- **Qué falta:** S3.3 (backend en verde).

## 2026-10-15 · Sprint 3 · S3.1 completado: CONTRATO LISTO PARA CODEX

- **Rama:** `feature/mayhuasca/a-solicitudes/s03`, publicada en origin.
- **Contrato:** `docs/documentacion/plan-pruebas-v3/sprint-03/CONTRATO-API.md` v1.0, con un ejemplo JSON por endpoint, la tabla rol × ruta, los 5 pasos y la idempotencia del envío.
- **Catálogo:** `docs/documentacion/plan-pruebas-v3/sprint-03/CATALOGO-S03.csv`, 81 casos ejecutables.
  - **Pest (51):** 001 a 051; del 001 al 015 ya existen.
  - **Cypress (17):** 052 a 068.
  - **Vitest (13):** 069 a 081.
- **Decisiones:**
  - El usuario confirmó que se aplican D-11, D-12, D-13, D-15, D-23 y D-25.
  - Nuevas, de Pimentel (2026-10-15):
    - D-55: inicio programado ≥ hora del servidor;
    - D-56: dirección de 5 a 255;
    - D-57: técnico en pausa fuera de la búsqueda;
    - D-58: tablas `rule_*` con la versión 1 y N=3.

**Para Codex (S3.4):**
- Pantallas en `features/requests` (asistente, resumen y Mis solicitudes) y `features/matching` (búsqueda y perfil), con Vitest S03-TC-069 a 081, según el contrato.
- Los nombres de archivo del catálogo son propuestos: puedes cambiarlos si mantienes los IDs.
- Cypress 052 a 068 después de que se integre el PR de S3.3 (seeder E2E en §7 del contrato).

## 2026-10-15 · Sprint 3 · S3.1 en curso (en espera de confirmación)

- **Rama:** `feature/mayhuasca/a-solicitudes/s03`, creada desde `main` `af074b5` (con los PR #12 y #13). Solo local: sin push.
- **Commits:**
  - `40c615a` docs(s02): D-53, `php:S5693` como falso positivo; D-54, TC-131 → S02-TC-074 y TC-135 → S02-TC-073 en `Matriz-Trazabilidad-TC.csv`.
  - `15a5df8` test(s03): las 15 Pest del S3 pasan a `S03-TC-001..015 … [TC-0xx]`, solo renombradas; 15/15 en el slot A (254 aserciones).
- **Presentado al usuario, sin escribir todavía:**
  - tabla de brechas;
  - resumen del catálogo (S03-TC-016 en adelante);
  - decisiones.
- **Conflicto de fuentes pendiente:** el prompt pide opciones para P03, P05, P10, P16, P17 y P22, pero `DECISIONES.md` ya las decidió (D-15, D-23, D-11, D-25, D-12 y D-13). Hay que esperar la respuesta del usuario.
- **Brechas clave halladas:**
  - `POST /media` no admite evidencias de solicitud (`purpose` solo `portfolio`, `catalog` y `document`).
  - Faltan en el servidor:
    - la descripción de 20 a 1000 caracteres (D-12);
    - el máximo de 5 fotos por solicitud;
    - el límite de 3 activas (D-11);
    - la revalidación de subcategoría, distrito y técnico al enviar.
  - `address` es `text` y no tiene límite.
  - No existe `GET /technicians`.
  - No hay tablas de reglas (`rule_*`) ni de calificaciones.
- **Qué falta:** con la confirmación, escribir `plan-pruebas-v3/sprint-03/CATALOGO-S03.csv` y `CONTRATO-API.md` y registrar las decisiones nuevas.

## 2026-10-15 · Sprint 2 · cierre S2.6 completado

- **Rama:** `feature/pimentel/f-administracion/s02-cierre`. `origin/main` `0a5977f` (PR #10) se fusionó en `8730a13`, sin rebase. El conflicto de `REGISTRO-DEFECTOS.csv` se resolvió conservando DEF-40 a 42 cerradas.
- **Commits del cierre:**
  - `e176a6b` ci(s02): `projectVersion=sprint-02`;
  - el commit «docs(s02): cierre del Sprint 2» (evidencias, informe, matriz, catálogo, registro, avances y este relevo).
  - PR: ver abajo.
- **Resultados** (slot A, revisión `8730a13`):

  | Prueba | Resultado |
  |---|---|
  | Pest | 149/149 (1685 aserciones); cobertura total 92,8 %, `FAdministration` 97,22 % |
  | Vitest | 116/116; líneas 82,89 %, `features/administration` 86,77 % |
  | Cypress | S01 17/17 y S02 17/17 (Chrome 156) |
  | Conteo S02 | 90 IDs (Pest 59, Cypress 17, Vitest 14) |
  | Mutación de las 4 clases | 91,32 % (284/311; 7 sobrevivientes y 20 sin cubrir) |
  | SonarQube `sprint-02` (`e176a6b`) | Gate OK |
  | Auditorías | `composer audit` y `npm audit` limpios |

  En SonarQube, `php:S5693` es una incidencia, no un hotspot. Se marcó False Positive (D-46); con eso el Gate pasó de FAILED a OK. SonarQube se detuvo al terminar.
- **Registro:**
  - DEF-27 cerrado (CI del PR #9);
  - DEF-16, 24 y 25 parciales (S2 hecho);
  - resumen: 27 cerrados, 12 abiertos y 3 duplicados.
- **Matriz:** 15 de las 17 filas de S2 en APROBADO. TC-131 y TC-135 no tienen caso S02 que las cite; el equipo decide si se vinculan a S02-TC-074 y 073.
- **Avances:**
  - Pimentel S2 con la sección del cierre;
  - Mayhuasca S2 con revisor «Pimentel Chumbes James», indicado por el usuario el 2026-10-13.

**Qué falta:**
- Revisión humana e integración del PR de cierre.
- Que el equipo confirme el falso positivo `php:S5693` y decida sobre TC-131 y TC-135.

**Para Codex:**
1. Atender los 13 `S6819` y los 20 `S3358` del frontend (lista en la entrada del 2026-10-13).
2. Hacer `git pull` de `main` cuando se integre este PR (trae `run-e2e.mjs` con log de la API y aviso de RAM).

**Bloqueos:** ninguno.

## 2026-10-14 · Sprint 2 · cierre S2.6: DEF-42 (en espera de la integración del PR #10)

- **Rama:** `feature/pimentel/f-administracion/s02-cierre`. Solo local: sin push ni PR.
- **Contexto:** Codex se quedó sin uso. El usuario pidió diagnosticar DEF-42 en el slot A sobre la rama del PR #10 (`b3302c1`, checkout separado) y volver a esta rama.
- **Resultado:** **Cypress S2 17/17 tres veces en Chrome (slot A)**, sin cambios en producto ni pruebas. Cypress S1 17/17. El producto no tiene el defecto:
  - la API sin navegador responde 201 en menos de 1 s;
  - Chrome sin Cypress (CDP) también responde 201.
  - El fallo solo se vio en Cypress + Chrome en el estado del equipo del 2026-10-13, con poca RAM y todo más lento. La causa exacta no quedó aislada. Detalle en `evidencias/sprint-02/cypress/2026-10-14-DEF-42-diagnostico.md`.
- **CI del PR #10:** backend, frontend y conteo en verde; OPEN y MERGEABLE.
- **Commits:**
  - `9e1c272` ci(s02): `run-e2e.mjs` guarda la salida de la API en `tmp/e2e-api-<slot>.log` e informa la RAM libre, con aviso por debajo de 1 GB.
  - commit de evidencias, registro y este relevo.
- **Registro de defectos:**
  - DEF-41 copiado tal cual de la rama de Codex (Cerrado, `0bb4438`);
  - DEF-42 Cerrado (`9e1c272`);
  - DEF-40 sigue Cerrado (`86a65aa`).
  - Al fusionar `main` con el PR #10 habrá conflicto en las últimas filas de `REGISTRO-DEFECTOS.csv`: conservar las de esta rama.
- **No se tocó** la rama de Codex: no hubo arreglo de frontend ni de pruebas, así que no hubo commit ni push allí.
- **Limpieza:**
  - se restauraron los specs que se apartaron para el diagnóstico y `run-e2e.mjs` en el checkout separado;
  - se quitaron dos bloqueos huérfanos (`tmp/e2e-cypress.lock` y `tmp/e2e-slot-A.lock`, PID 15180, de la corrida interrumpida);
  - no quedan puertos 8001, 5174 ni 9333 en uso.

**Para Codex:** DEF-42 no exige cambios en `frontend/`. Si vuelve a aparecer en el slot B, revisar `tmp/e2e-api-B.log` (disponible cuando esta rama esté en `main`).

**Qué falta:** tras el aviso del usuario de que el PR #10 está en `main`, la parte pesada del cierre (ver la entrada siguiente).

## 2026-10-13 · Sprint 2 · cierre S2.6: DEF-40 e incidencias de SonarQube (en espera del aviso)

- **Rama:** `feature/pimentel/f-administracion/s02-cierre`. Solo local: sin push ni PR.
- **Commits:**
  - `989761e` test(s02): S02-TC-090 en rojo («null is identical to 1» en la respuesta del PATCH) y su fila en `CATALOGO-S02.csv`, que pasa a 90 casos (59 Pest).
  - `86a65aa` fix(s02): `Portfolio::present` devuelve `subcategory_id`, también si la subcategoría está inactiva o es null. La galería pública y el 201 del POST no cambian.
  - `3b9e6d8` docs(s02): `CONTRATO-API.md` v1.2 (§5.1 y §5.6) y DEF-40 cerrado en `REGISTRO-DEFECTOS.csv` y `.md`.
  - `1c58b45` refactor(s02): incidencias seguras de SonarQube (ver abajo).
  - commit de este relevo.
- **Pruebas** (solo los archivos tocados, slot A):
  - PortfolioAndProfileTest y TC021PublishedPortfolioWorkTest: 6/6 (198 aserciones);
  - ProvisionAdminTest, TC011 y TC012: 5/5 (44 aserciones);
  - `php -l` sin errores.
  - Pint pasa en los archivos tocados, con LF. En la copia de trabajo (CRLF por `core.autocrlf=true`) Pint marca `line_ending` en archivos que nadie tocó. Siguen fallando, desde antes, la migración `add_account_access` (prototipo compacto) y `Sprint01E2ESeeder` (`not_operator_with_successor_space`).
- **No se ejecutó:** suite completa, mutación ni análisis nuevo de SonarQube.

**SonarQube: incidencias abiertas de Reliability y Maintainability, consultadas por la API**
- Son las del último análisis guardado. El token no deja leer `project_analyses`, así que no se sabe de qué commit es; incluye `features/administration`.
- En total hay 116: 55 de `backend/api` y 61 de `frontend/`.
- **Corregidas en backend (7):**
  - php:S112 ×5: `SeedingRefused` y `AdministratorProvisioningRefused`, subclases de `RuntimeException` con los mismos mensajes;
  - php:S1186: `AppServiceProvider::register`;
  - php:S113: la migración `add_account_access`.
- **No corregidas en backend (48), con su motivo:**
  - **Prototipo congelado (AGENTS §2, D-26), se retira y no se toca (41):**
    - `app/Http/Controllers/AuthController.php` (4) y `MarketplaceController.php` (6);
    - `app/Services/Marketplace.php` (14), `Matching.php` (12) y `Announcements.php` (4, servicio histórico);
    - migración `create_marketplace` (1).
    - Las S2681 («solo la primera sentencia es condicional») de estos archivos son las de más riesgo y deben revisarse al retirar el prototipo, no antes.
  - **php:S107**, 8 parámetros, en `AuditTrail::record` y `RequestTimeline`: cambiar la firma afecta a todas las llamadas; no es pequeño.
  - **php:S1142**, más de 3 `return`, en `MediaController`, `ApiExceptionRenderer` y el comando `ProvisionAdmin`: es un refactor de flujo y no aporta seguridad.
  - **php:S1172**, `$attribute` sin usar en `RegisterAccountRequest`: Laravel pasa los argumentos de la regla closure por posición, así que el parámetro es obligatorio.
  - **php:S1192** en `config/logging.php`: es la configuración estándar de Laravel; se deja como viene para facilitar las actualizaciones.
- **Frontend (61), para Codex; no se tocaron:**
  - S2681 ×14, sentencias de una línea sin llaves: `Marketplace.jsx` 5, `domain/demo.js` 3, `Announcements.jsx` 2, `App.jsx` 2, `ServiceCarousel.jsx` 1 y `marketplace-api.js` 1.
  - S3358 ×11, ternarios anidados: `ServiceCarousel` 3, `Marketplace` 3, `AccountPanel`, `Announcements`, `App`, `Auth` y `SessionForm`.
  - S6819 ×12, `role="group"` en lugar de `<fieldset>`/`<details>`: `Marketplace` 3, `Catalog` 2, `AccountApp`, `forms.jsx`, `SessionForm`, `AccountPanel`, `Announcements`, `Auth` y `TechnicianProfile`.
  - S7718 ×9, el parámetro de `catch` debe llamarse `error_`: `AccountApp` 3, `ProfileForm` 3, `Catalog` 2 y `SessionForm`.
  - S3776 ×5, complejidad cognitiva de 16 a 17: `AccountApp`, `ProfileForm`, `forms.jsx`, `Marketplace` y `demo.js`.
  - S7723 ×6, `new Error()`: `demo.js` 3, `marketplace-api.js` 2 y `Marketplace`.
  - S6479 ×2, índice como `key`: `App` y `Marketplace`.
  - S6825 ×1, `aria-hidden` en un elemento enfocable: `VideoExperience`.
  - S1788 ×1, parámetro por defecto que no va al final: `features/administration/http.js`.
  - `Marketplace.jsx`, `demo.js` y `marketplace-api.js` son de la demo congelada.

**Pedidos a Codex:**
1. DEF-40 está cerrado en esta rama (`86a65aa`). En tu `REGISTRO-DEFECTOS.csv` local, DEF-40 sigue «Abierto». Al integrar habrá conflicto en las últimas filas: conserva la fila DEF-40 cerrada de esta rama y tu DEF-41. Ya puedes precargar `subcategory_id` desde `GET /technicians/me/profile` (contrato v1.2 §5.1).
2. Revisa las incidencias de frontend de arriba que no sean de la demo congelada; S6819 y S6825 afectan a la accesibilidad (DoD).

**Qué falta:** lo mismo de la entrada siguiente (mutación de las 4 clases, regresión, conteo, SonarQube y PR), tras el aviso del usuario.

## 2026-10-13 · Sprint 2 · cierre S2.6, parte liviana (en espera del PR #10 y de S2.5)

- **Rama:** `feature/pimentel/f-administracion/s02-cierre`, creada desde `origin/main` `f7c524e`. Solo local: sin push ni PR, como pidió el usuario.
- **Estado de `main`:** contiene solo el PR #11 (backend). El PR #10 de Codex (frontend S2.4) sigue **abierto** y no hay Cypress de S2.5. Por eso el usuario pidió hacer ahora solo lo liviano y esperar su aviso.
- **Commits:**
  - `9896b40` chore(s02): `.gitignore` estándar de Laravel en `backend/api/storage/` (app, app/private, app/public, framework y sus subcarpetas, logs). Se quitaron de la raíz `storage/logs/*` y `storage/framework/*`, que los tapaban. Los 20 PNG de DEF-38 y los logs quedan ignorados.
  - `670a1cb` test(s02): refuerzo de aserciones, sin cambiar IDs ni resultados esperados:
    - ManageAnnouncements: S02-TC-026, 027 y 028;
    - Portfolio: S02-TC-007 y 042 (S02-TC-007 ahora siembra `CatalogSeeder`);
    - TechnicianDirectory: S02-TC-032 y 034;
    - UpdateTechnicianProfileRequest: S02-TC-045.
  - `439aac3` refactor(s02): nueva `CatalogEntries` con el alta y la edición versionada comunes a `ManageDistricts`, `ManageSpecialties` y `ManageSubcategories`. La API y las acciones auditadas no cambian.
  - commit de este relevo.
- **Pruebas** (solo los archivos tocados, slot A):
  - las 4 de Sprint02 reforzadas: 19/19 (380 aserciones);
  - las de las rutas del catálogo administrativo: 21/21 (202 aserciones);
  - Pint: sin cambios.
  - Comprobación manual: se inyectó un mutante por clase (filtro `published`, versión +2 al retirar, `bio` fuera de la ficha, sin `min:0`). Los cuatro hicieron fallar su prueba y luego se revirtieron con `git checkout`.
- **No se ejecutó**, por pedido del usuario, para no coincidir con el Cypress S2.5 de Codex en el slot B: mutación, suite completa, Vitest, Cypress, conteo, cobertura, SonarQube ni auditorías.

**Qué falta (tras el aviso del usuario de que #10 y S2.5 están en `main`):**
1. Fusionar `origin/main` en esta rama, sin rebase.
2. Mutación **solo** de ManageAnnouncements, UpdateTechnicianProfileRequest, TechnicianDirectory y Portfolio.
   - Las líneas de constantes (`FIELDS`, `EDITABLE`, `FILTERS`) salen UNCOVERED porque PCOV no las registra: no se pueden matar.
   - Los `RemoveIntegerCast` sobre versiones que ya llegan como `int` son equivalentes.
3. Regresión en el slot A: Pest, Vitest, pytest y Cypress de todos los sprints, con el bloqueo global.
4. Conteo, cobertura, `scripts/run-quality.ps1` y Quality Gate. Marcar como Safe el hotspot php:S5693 de `StoreMediaRequest` L33 (D-46, 5 MB). Exportar con `exportar-sonar-anonimo.mjs`. `composer audit` y `npm audit`.
5. Trazabilidad, REGISTRO-DEFECTOS, DECISIONES, avance de Pimentel (revisor del avance S2 de Mayhuasca: Pimentel Chumbes James, indicado por el usuario), `INFORME-SPRINT-02.md`, commit «docs(s02): cierre del Sprint 2», push y PR.

**Bloqueos:** PR #10 y S2.5 de Codex.

**Notas:**
- `CatalogEntries` es una clase nueva. Entra en la mutación de cierre solo si el usuario lo pide.
- El contenedor `tecnicoya-quality-sonar-db-1` ya estaba arriba al empezar; no lo toqué.

## 2026-10-10 · Sprint 2 · paso S2.3: backend en verde y precisiones de Codex

- **Rama:** `feature/mayhuasca/f-administracion/s02`. **PR:** ver abajo (pedido del usuario; revisión humana [PENDIENTE]).
- **Commits:**
  - `f501a95` feat(s02): backend en verde.
  - `522862b` fix(s02): precisiones de Codex (contrato v1.1).
  - commit de evidencias, avance y este relevo.
- **Pruebas:**
  - Pest 148/148 (1547 aserciones); Sprint02 58/58.
  - Cobertura: FAdministration 96,74 %; clases de S2 97,14 %.
  - `composer audit` limpio.
  - Mutación de las 37 clases de S2: **82,91 %** (176 sobrevivientes, sobre todo campos de respuesta y de auditoría sin aserción). Detalle en `evidencias/sprint-02/pest/04-mutacion.txt`.
- **Respuesta a las precisiones de Codex (HANDOFF-codex S2.4):**
  1. **`Sprint02E2ESeeder`.** Existe desde `f501a95` (no estaba en `2140555`) y se amplió en `522862b`. Ver contrato §10.
     - Cuentas, todas con `TECNICOYA_E2E_PASSWORD`, la contraseña que genera el arrancador:
       - `e2e-admin@`, `e2e-client@` y `e2e-technician@` (pendiente e incompleto, de S1);
       - `e2e-technician-ready@`, pendiente y completo, para aprobar (S02-TC-069);
       - `e2e-technician-reject@`, pendiente y completo, para rechazar (S02-TC-070);
       - `e2e-technician-active@`, activo, con servicio, franja, zona y un trabajo publicado.
     - Carrusel: dos subcategorías de Cómputo con foto (`computo-hardware` y `computo-mantenimiento`).
     - Comunicados: uno publicado y uno en borrador.
     - Es idempotente; se probó dos veces en el slot A.
  2. **Límites de la tarifa orientativa (`subcategories.reference_fee`).** **Se corrigió el backend:** ahora exige 2 decimales como máximo; antes MySQL redondeaba sin avisar. Lo prueba S02-TC-017. El rango sigue de 0 a 100 000: no es la tarifa del técnico, así que no aplican los límites de D-48. Ver contrato §7.4.
  3. **`subcategory_id` del portafolio.** **Solo se aclaró el contrato:** el backend ya exigía una subcategoría existente, aunque esté inactiva. Ver §5.5.
  4. **`performed_on` del portafolio.** **Se corrigió el backend:** ya no acepta fechas posteriores a hoy (reloj UTC del servidor) y responde «La fecha del trabajo no puede ser futura.». Lo prueba S02-TC-042. La validación del cliente debe imitarla.

**Qué falta:**
- Revisión e integración del PR.
- Codex: S2.5 (Cypress 059–075 en el slot B tras integrar).
- Reforzar las aserciones de las clases con sobrevivientes y repetir su mutación.
- Cierre S2.6: SonarQube, conteo e informe.

**Bloqueos:** ninguno.

**Notas:**
- La mutación tardó unas 4,5 h de reloj y ocupó el slot A.
- `backend/api/storage/` sigue sin `.gitignore`: los 20 PNG de DEF-38 siguen en el disco, sin versionar.

## 2026-10-10 · Sprint 2 · paso S2.2: Pest en rojo

- **Rama:** `feature/mayhuasca/f-administracion/s02`.
- **Commits:**
  - `93f448c` test(s02): 46 casos nuevos (013–058); 8 archivos en `tests/Feature/Sprint02/`, helpers en `tests/Support/Sprint02.php` y fixtures en `tests/fixtures/sprint02`.
  - el siguiente commit marca los fixtures como binarios (`backend/api/.gitattributes`).
  - `ad89d4d` evidencia `evidencias/sprint-02/pest/01-rojo.txt`.
- **Rojo:** 36 fallan y 22 pasan.
  - Pasan los 12 renombrados y, por código existente: 016, 017, 029, 033, 047, 050, 052, 056 y 057.
  - **S02-TC-043 pasa en falso:** la ruta no existe y devuelve el 404 esperado. Hay que revisarla tras S2.3.
- **Catálogo:** 050 y 051 se reformularon para no duplicar aserciones de S02-TC-008.

**Qué falta:** S2.3 (verde). Orden previsto:
1. migración `media_files.purpose` y `POST /media` con `ImageSanitizer` en PHP puro;
2. `DistrictSeeder` y `/catalog/districts`;
3. carrusel;
4. especialidades y distritos admin;
5. comunicados;
6. verificación (bandeja, ficha, reject, suspensión y reactivación, verification-request);
7. perfil propio, documentos y PATCH/DELETE de portafolio;
8. reglas de D-49 y D-48 y auditoría de tarifa;
9. `Sprint02E2ESeeder`.

## 2026-10-10 · Sprint 2 · paso S2.1: brechas, catálogo, contrato y decisiones

- **Rama:** `feature/mayhuasca/f-administracion/s02`, base `main` `1bfb8f4` (PR #9 integrado), publicada en origin.
- **Commits:**
  - `500187b` test(s02): renombra las 12 Pest a S02-TC-001…012 con su `[TC-0xx]` (solo descripciones).
  - `fee8f84` docs(s02): `plan-pruebas-v3/sprint-02/CATALOGO-S02.csv` (89 casos: 58 Pest, 17 Cypress y 14 Vitest), `CONTRATO-API.md` y D-46 a D-52.
- **Pruebas:** Pest Sprint02 12/12 (148 aserciones) tras el renombrado.
- **Decisiones (Pimentel, 2026-10-10):**
  - D-46 (P17-S2): archivos JPG, PNG o WebP de hasta 5 MB y 5 por trabajo; documentos PDF, JPG o PNG, 5 vigentes.
  - D-47 (MEDIA-01): revisión automática y sin EXIF.
  - D-48 (TARIFA-01): tarifa de S/ 1 a S/ 5000, con 2 decimales.
  - D-49 (FRANJA-01): sin solapes, contiguas permitidas, ≥ 30 min.
  - D-50 (VERIF-01): rechazo → `rejected` y nueva solicitud; suspensión solo en backend en S2.
  - D-51 (COM-01): solo se editan borradores.
  - D-52 (CAT-01): `reference_fee` orientativa.
- **Brechas principales:**
  - no hay `POST /media`;
  - falta el CRUD de especialidades, distritos y comunicados;
  - faltan la bandeja, la ficha, el rechazo y la suspensión;
  - faltan los distritos semilla (D-15) y el perfil propio del técnico;
  - no hay ninguna pantalla v1;
  - la landing tiene 3 de 10 secciones.
- **Observación técnica:** el PHP de XAMPP no tiene GD (`php_gd.dll` existe pero no está cargado), y la CI instala solo `pdo_mysql`. El EXIF se quitará en PHP puro, sin depender de GD.

**Qué falta:** S2.2 (Pest 013–058 en rojo) y S2.3 (backend en verde, empezando por `POST /media`).

**Bloqueos:** ninguno.

**Pedidos a Codex:** S2.4 con el contrato (§11). La landing tiene 10 secciones (S02-TC-089). No hay pantalla de suspensión en S2.

## 2026-10-10 · Sprint 1 · paso S1.6: cierre del sprint

- **Rama:** `feature/pimentel/f-administracion/s01-cierre`, base `main` `8c570e9` (PR #6 y #7 integrados). **PR:** [#8](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/8), abierto.
- **Commits:**
  - `4171f06` test(s01): refuerza S01-TC-010 (mata los 9 sobrevivientes de `CatalogController`)
  - `b0d794b` fix(s01): DEF-38 (`Storage::fake('public')`)
  - `61076a9` ci(s01): `projectVersion` `sprint-01`
  - `52ed276` docs(s01): cierre (evidencias, informe, D-45, defectos, matriz, catálogo y avances)
  - este relevo
- **Pruebas (slot A), todas aprobadas:**
  - Pest 102/102.
  - Cypress S01 17/17. No había Cypress de Codex en curso y el bloqueo estaba libre.
  - Vitest 92/92.
  - Conteo S01: **87 IDs** (54/17/24).
  - Mutación de `CatalogController`: 27/27. Las 12 clases, recalculadas: 96,06 %.
  - `composer audit` y `npm audit` limpios.
- **SonarQube `sprint-01`** (revisión `4171f06`; el producto es `main` `8c570e9`): **Gate OK**, con cobertura nueva de 77,8 %, 116 code smells (35 críticos) y 850 min de deuda. Exporte anonimizado en `evidencias/sprint-01/cierre/sonar/`. Lo arranqué solo para este paso con el bloqueo de Cypress tomado; quedó detenido con `stop` y el bloqueo, liberado.
- **Defectos:**
  - Cerrados: DEF-36 (sin S9011) y DEF-34.
  - DEF-25 queda parcial.
  - Nuevos y cerrados: DEF-38 y DEF-39.
  - `REGISTRO-DEFECTOS.md` se regeneró desde el CSV (le faltaban DEF-36 y DEF-37).
- **Informe:** `docs/documentacion/sprints/INFORME-SPRINT-01.md`. Veredicto: cumple la DoD con salvedades (sin CI; revisión de PR #8 pendiente).
- **Herramienta:** el bloqueo se tomó con un proceso vivo (`tail -f /dev/null`) cuyo PID de Windows se escribió en `tmp/e2e-cypress.lock`; el arrancador descarta los bloqueos con PID muerto.

**Qué falta:**
1. Revisión humana e integración del PR #8.
2. Borrar a mano los 20 PNG sintéticos sin versionar de `backend/api/storage/app/public/media` (DEF-38). No los borré porque la acción fue denegada.
3. Workflow de GitHub Actions (D-39, DEF-27), al inicio de S2.
4. Cubrir la rama de rol inactivo de `AuthController::login` y la carrera de `RegisterAccount` (10 mutantes sin cubrir).
5. DEF-16: matriz de S2 y S3.

**Bloqueos:** ninguno.

**Pedidos a Codex:**
- `AccountApp.jsx:42` tiene complejidad cognitiva 17 de 15 (`javascript:S3776`, crítico nuevo).
- 3 avisos `S6819` (`role="status"` frente a `<output>`) en `AccountApp.jsx` y `Catalog.jsx`.

## 2026-10-09 · Sprint 1 · pasos S1.1 a S1.3 (catálogo, contrato, Pest y D-43/D-44)

- **Rama:** `feature/mayhuasca/f-administracion/s01`, base `main` `6dfec52` (PR #5 integrado por squash). **PR:** [#6](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/6), abierto.
- **Commits:**
  - `768fa75` test(s01): renombra las pruebas existentes a S01-TC-NNN (Pest, Cypress y Vitest; solo descripciones)
  - `66da984` docs(s01): catálogo de 87 casos, contrato de API y decisiones D-43 y D-44
  - `93a11ff` test(s01): 38 casos Pest nuevos y casos de D-43 y D-44 en rojo
  - `10986ab` docs(s01): evidencia del rojo
  - `2e5b3d0` feat(s01): registro sin sesión (D-43) y auditoría de accesos de administradores (D-44)
  - `faa9046` docs(s01): evidencias 02 a 05, avance de Mayhuasca y DEF-37
  - este relevo
- **Documentos:** `plan-pruebas-v3/sprint-01/CATALOGO-S01.csv` (87 casos: 54 Pest, 17 Cypress y 16 Vitest) y `CONTRATO-API.md`.
- **Decisiones:** D-43 (registro con sesión abierta → 403 `SESSION_ACTIVE`) y D-44 (auditoría de accesos de administradores), decididas por Pimentel.
- **Defectos:** DEF-36 abierto (4 botones sin `type`, Codex) y DEF-37 cerrado (falsa puntuación de mutación en Windows).
- **Pruebas:**
  - Rojo: Pest Sprint01 52/54. Los 38 nuevos de 034 a 071 pasaron desde el inicio (regresión de código existente); fallaron 086 y 087; 0 omitidos.
  - Verde: suite completa 102/102 (1038 aserciones).
  - Cobertura: total 94,6 %; FAdministration 95,7 %.
  - Mutación: 12 clases del S1, 254 mutantes, **92,52 %** (9 sobrevivientes en `CatalogController` y 10 sin cubrir).
  - `composer audit` limpio. Vitest de administración 25/25 tras el renombrado.
  - Cypress no se ejecutó en esta tarea (los specs solo cambian de nombre; `node --check` correcto).
- **Mutación en Windows (DEF-37):** invocar `'vendor\bin\pest'` con `C:\xampp\php` en el PATH y `--clear-cache`. Con `vendor/bin/pest` los procesos de mutante no arrancan y todos cuentan como eliminados. `--covered-only` genera 0 mutantes (las rutas de cobertura no casan); usar `--everything --path=…`.

**Qué falta:**
1. S1.6: mutación del módulo completo (848 mutantes, unas 2,8 h, con la base del slot A ocupada); matar los 9 sobrevivientes de `CatalogController`; cubrir la rama de rol inactivo de `AuthController::login` y la carrera de `RegisterAccount`.
2. S1.6: regresión completa con Cypress, conteo con `contar-pruebas-sprint.mjs`, SonarQube con Gate sobre el commit integrado, `npm audit` e `INFORME-SPRINT-01.md`.
3. Crear el workflow de GitHub Actions (D-39).

**Bloqueos:** ninguno.

**Pedidos a Codex** (detalle en `CONTRATO-API.md` §4):
- Vitest S01-TC-078 a 085 y Cypress S01-TC-072 a 077 según el catálogo.
- DEF-36: `type="button"` en 3 botones de `AccountApp.jsx` y 1 de `Catalog.jsx`.
- D-43: no ofrecer «Crear una cuenta» con sesión abierta y mostrar `error.message` ante `SESSION_ACTIVE`.
- Mostrar el 429 en español y reactivar el botón.
- En `portals.cy.js`, el bucle de TC-005 ahora asigna un ID por rol (016 a 018); no volver al formato anterior.

## 2026-10-09 · Sprint 0 · COV-01 aplicada: Quality Gate en verde

- **Rama:** `feature/pimentel/f-administracion/s00-calidad`. El [PR #5](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/5) se actualiza con este push.
- **Commits:**
  - `4aaebe0` docs(s00): registra COV-01 (D-42)
  - `5ab67a6` ci(s00): cobertura PHPUnit de database, routes y config
  - `a2d7129` ci(s00): PCOV instrumenta todo backend/api salvo vendor, storage y caché
  - docs(s00): reanálisis con D-42 y cierre de DEF-35
  - este relevo
- **D-42:** COV-01 opción A, decidida por Pimentel el 2026-10-09.
- **Hallazgo:** ampliar `<source>` no bastaba. PCOV solo instrumenta `pcov.directory`, que por defecto es `app/`, así que el primer reanálisis (`5ab67a6`) siguió en rojo con 58,8 %. Su evidencia se conservó como `*-d42-intento1.txt`. Con `-d pcov.directory=.` en `composer test:sonar` y `test:coverage` quedó resuelto.
- **Reanálisis de `a2d7129`:** las fuentes de producto son iguales a `main` `0f2d1cd`; la versión sigue siendo `sprint-00` y la línea base, `8997de8`.
  - **Gate APROBADO (OK).**
  - Cobertura de código nuevo **93,8 %** ✅.
  - Duplicación 1,89 % ✅.
  - Confiabilidad A ✅, seguridad A ✅ y mantenibilidad A ✅.
  - Hotspots: 0, así que la condición no se evalúa.
  - Cobertura total 78,3 % (`app` 96,3 %, `database` 89,2 %, `routes` 95 %, `config` 100 %, `frontend/web/src` 56,3 %).
- **Pruebas:**
  - Pest 62/62 (714 aserciones), slot A.
  - Vitest 63/63.
  - Cypress no se ejecutó; el bloqueo estuvo tomado mientras SonarQube estaba arriba.
- **Registro:** DEF-35 cerrado.
- **Entorno:** SonarQube detenido con `stop` y bloqueo de Cypress liberado.
- **Evidencias:** `evidencias/sprint-00/calidad/sonar-d42/` y `2026-10-09-*-d42*.txt`. `calidad/QUALITY-GATE.md` tiene una §6 nueva.
- **Incidente (DEF-17):**
  - `88f4775` versionó y subió `sonar-d42/issues.json`, el exporte crudo con los correos de los autores. La regla `**/sonar/issues.json` no cubría la carpeta `sonar-d42`.
  - Lo retiré del árbol en `33b299d` y amplié la regla a `**/sonar*/`.
  - El archivo **sigue en el historial de la rama** y del PR #5. No reescribí historial (regla 5): purgarlo es decisión del equipo.

**Qué falta:**
1. La cobertura total del frontend (56,3 %) está por debajo del 70 % de la DoD. El Gate no la ve porque es código anterior a la línea base. Es un pedido a Codex para el cierre de S2 y S3.
2. Los 32 code smells críticos se revisan en el cierre de cada sprint.
3. TC-122, TC-123 y TC-130 se escriben en los pasos S3.1 y S3.2.
4. Crear el workflow de GitHub Actions (D-39).

**Bloqueos:** ninguno.

## 2026-10-09 · Sprint 0 · paso 1.7: Quality Gate real en SonarQube

- **Rama:** `feature/pimentel/f-administracion/s00-calidad`, base `main` `0f2d1cd` (PR #4 integrado).
- **SonarQube:** Community Build 26.9.0.129388.
  - Quality Gate «TecnicoYa» creado y asignado, con 6 condiciones sobre código nuevo.
  - Periodo de código nuevo `PREVIOUS_VERSION`: la línea base es el análisis `8997de8` (versión `sprint-01`), así que el código nuevo es S2, S3 y S0.
  - Se configura con `node scripts/configurar-quality-gate.mjs`, y está documentado en `calidad/QUALITY-GATE.md`.
- **Análisis de main `0f2d1cd` (versión `sprint-00`): el Gate FALLA.**
  - Cobertura de código nuevo **66,1 %**, por debajo del 70 % ❌.
  - Duplicación 1,89 % ✅.
  - Confiabilidad A ✅, seguridad A ✅ y mantenibilidad A ✅.
  - Hotspots: 0, así que la condición no se evalúa.
  - Medidas globales: cobertura total 58,8 % (antes 0 %), 0 bugs, 0 vulnerabilidades y 109 code smells (32 críticos).
- **Causa del rojo (DEF-35):** `phpunit.xml` solo instrumenta `app/`, que tiene 97,8 % de cobertura nueva. `database/` (302 líneas), `routes/` y `config/` entran con 0 %. El frontend nuevo tiene 74,8 %. Queda la decisión **COV-01** en `DECISIONES.md`:
  - A, recomendada: ampliar `<source>` de `phpunit.xml`.
  - B: excluir esos directorios en Sonar.
- **Pruebas:**
  - `composer test:sonar` (slot A): Pest 62/62, 714 aserciones; Clover con 71 archivos.
  - `npm run test:coverage`: Vitest 63/63; líneas al 61,82 %.
  - `npm audit`: 0 vulnerabilidades.
  - Cypress no se ejecutó: el bloqueo `tmp/e2e-cypress.lock` estuvo tomado mientras SonarQube estaba arriba.
- **Registro de defectos:**
  - Cerrados: DEF-07, DEF-08 (S9011 = 0), DEF-10 (sin regex en `forms.jsx`), DEF-13 (web con la evidencia de Codex; SonarQube no analiza los Dockerfile) y DEF-18.
  - Abierto: DEF-35.
- **Evidencias:** `docs/documentacion/evidencias/sprint-00/calidad/`. Incluyen `sonar/` con gate, measures, hotspots sin autores, analyses e `issues-anonimo.json`. El `issues.json` crudo está ignorado por Git.
- **Entorno:**
  - `vm.max_map_count` subió a 524288 (WSL, temporal) y SonarQube quedó detenido con `stop`.
  - El MySQL de pruebas sigue arriba.
  - Aviso del scanner: busca un `tsconfig` de `examples/backend/jsts-AdonisJS` fuera de `sonar.sources`; no afecta al análisis.

**Qué falta:**
1. **Decidir COV-01**, aplicarlo y repetir el análisis para dejar el Gate en verde. Si se reanaliza con la versión `sprint-00`, la línea base no se mueve.
2. Los 32 code smells críticos se atienden en el cierre de cada sprint.
3. TC-122, TC-123 y TC-130 se escriben en los pasos S3.1 y S3.2.
4. Crear el workflow de GitHub Actions (D-39).

**Bloqueos:** COV-01 bloqueaba el Gate en verde; quedó resuelto en la entrada de arriba.

**Pedidos a Codex:**
- La cobertura de `frontend/web/src` en código nuevo ya pasa el 70 %, pero la total es 56,3 %. Conviene subirla en las pantallas v1 de S2 y S3.
- No lanzar Cypress mientras exista `tmp/e2e-cypress.lock`.

## 2026-10-09 · Sprint 0 · decisiones D-38 a D-41 (complemento del PR #4)

- **Rama:** `feature/pimentel/f-administracion/s00-decisiones-registro`.
- **PR:** [#4](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/4), abierto; este push lo actualiza.
- **Commits:**
  - docs(s00): registra MOD-01, CI-01, P04 y P07 (D-38 a D-41)
  - este relevo
- **Decisiones registradas:**
  - **D-38, MOD-01:** Mayhuasca `a-solicitudes` y `b-matching`; Pimentel `c-notificaciones` y `f-administracion`; Delgado `d-atencion` y `e-calificaciones`. El dueño responde y otro integrante revisa. Las ramas siguen la capa (regla 5).
  - **D-39, CI-01:** opción A (GitHub Actions); cambia a C si el docente exige su GitLab.
  - **D-40, P04:** el responsable del backlog es Pimentel.
  - **D-41, P07:** una sola apelación por reseña.
- **Archivos:**
  - `DECISIONES.md`: las cuatro filas nuevas; D-17 y D-31 remiten a D-40 y D-41.
  - Reglas de negocio §9 y §10.
  - AGENTS.md, regla 10.
  - `docs/avances/README.md`, con la tabla del reparto.
- **Única pendiente:** P17-S6, los límites de contenido de S6.
- **Pruebas:** no se ejecutaron porque el cambio es solo documental.

**Qué falta:**
1. **TC-122, TC-123 y TC-130:** se escriben en los pasos S3.1 y S3.2 del plan, junto con el catálogo de 60 casos de S3, por decisión del usuario del 2026-10-09. No se adelantan.
2. **Cierre de S1 a S3:** paso N.1 de S1, con el catálogo de 60 casos y el contrato de API.
3. **Paso 1.7:** su contenido sigue sin identificar en el repositorio.
4. **CI:** crear el workflow de GitHub Actions (D-39). Pertenece al módulo común; falta acordar en qué sprint.

**Bloqueos:** ninguno de decisión para S1 a S4.

## 2026-10-09 · Sprint 0 · registro de las decisiones del equipo

- **Rama:** `feature/pimentel/f-administracion/s00-decisiones-registro`, base `main` `93388b7` (PR #3 ya integrado).
- **Commits:**
  - `788351f` docs(s00): registra las decisiones D-10 a D-37 del equipo
  - `bd8fa0e` docs(s00): alinea AGENTS, README y avances con las decisiones
  - este relevo
- **Entregado:**
  - `DECISIONES.md`: D-10 a D-37, «decidido por el equipo (Delgado, Mayhuasca y Pimentel)», con fecha 2026-10-09.
  - Reglas de negocio 1.1, con una §10 nueva y la §7 actualizada: `max_active_requests_per_client = 3`; `Dref` y `Aref` relativos.
  - AGENTS.md (reglas 2 y 10), `README.md` y `docs/avances/README.md`.
- **Valores aplicados:** P10 N = 3; P17 descripción de 20 a 1000 caracteres y fotos JPG, PNG o WebP de hasta 5 MB, con un máximo de 5; P21 con RNF-01 (≤ 3 s) y RNF-02 (200 concurrentes); PROTO-01 B, retiro cuando las pantallas v1 de S2 y S3 pasen Cypress.
- **No registrado** (el pedido traía marcadores sin rellenar):
  - CI-01 `[A o C, según lo que diga el docente]`;
  - MOD-01 `[el reparto que acordaron]`.

  Quedan en «Decisiones pendientes» junto con el nombre del responsable del backlog (P04-N), el número de apelaciones (P07-N) y los límites de contenido de S6 (P17-S6).
- **Pruebas:** no se ejecutaron porque el cambio es solo documental. Se pidió quitar el `skip` de TC-122, TC-123 y TC-130, pero **esas pruebas no existen** (no hay ningún `skip` en `backend/api/tests`): hay que escribirlas.

**Qué falta:**
1. **TC-122, TC-123 y TC-130 en Pest** (reprogramado para S3.1 y S3.2, ver la entrada de arriba), con ciclo TDD en una rama de backend (`feature/mayhuasca/a-solicitudes/s03`):
   - `test(s03)` en rojo y después `feat(s03)` en verde;
   - el límite de 3 solicitudes activas al enviar;
   - la validación de la descripción y de las fotos.
2. **Pedido a Codex:** la validación de cliente de P17 y del límite de P10 (doble validación) y la parte Cypress de TC-130.
3. **Paso 1.7:** sigue pendiente; su contenido está sin identificar en el repositorio.
4. **MOD-01 y CI-01:** transcribir el reparto y la respuesta del docente.

**Bloqueos:**
- Ninguno de negocio para S3.
- MOD-01 sigue pendiente para nombrar las ramas por dueño.

## 2026-10-09 · Sprint 0 · hoja de decisiones

- **Rama:** `feature/pimentel/f-administracion/s00-decisiones`, base `main` `9c64fb6`.
- **Integrado en `main`:** el PR #2 (`feature/pimentel/f-administracion/s00`, entrada de abajo) y el PR #1 de Codex (`codex/s00-frontend`). El pedido 1 a Codex está cumplido: su relevo ya está en `docs/documentacion/sprints/HANDOFF-codex.md`.
- **PR:** [#3](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/3), integrado el 2026-10-09.
- **Commits:**
  - `42be842` docs(s00): hoja de decisiones
  - este relevo
- **Entregado:** `docs/documentacion/sprints/HOJA-DE-DECISIONES.md`, con 29 filas: P01 a P23 (P07 en dos partes) más MOD-01, META-01, PERM-01, CI-01, MATCH-01 y PROTO-01. Tiene tres bloques: cierre de S1 a S3, Sprint 4 y el resto. Cada fila trae opciones, recomendación y la columna «Decisión del equipo» vacía. No registra decisiones ni fija valores de mercado; los límites de ejemplo están marcados «sin fuente».
- **Pruebas:** no se ejecutaron porque el cambio es solo documental y no toca código.

**Qué falta:**
1. **Paso 1.7:** pendiente, según el equipo.
2. **Decisiones:** la reunión del equipo con la hoja. Después, Claude Code pasa cada fila decidida a «Decisiones tomadas» de `DECISIONES.md`, con la fecha y quién decidió. Las más urgentes son MOD-01, META-01, P17, P10 y P22.
3. Siguen pendientes los puntos 1, 2, 4 y 5 de la entrada de abajo. El 3 (DEF-13 web) lo entregó Codex en el PR #1, pero falta cerrarlo en `REGISTRO-DEFECTOS.csv`.

**Bloqueos:**
- MOD-01, que define las ramas por módulo para S1 a S3.
- P10, P17 y P22, que bloquean TC-122, TC-123 y TC-130.
- Calendario sin fechas.

**Pedidos a Codex:** ninguno nuevo.

## 2026-10-09 · Sprint 0 · puesta en orden (reglas, entorno paralelo, deuda y plan v3)

- **Rama:** `feature/pimentel/f-administracion/s00` (configuración común), base `main` `d361c63`. PR pendiente de crear: `gh` no está instalado.
- **Commits** (orden cronológico):
  - `fa6de02` ci(s00): entornos de prueba en paralelo por slot
  - `6f0fad9` docs(s00): registro de defectos DEF-01 a DEF-34
  - `3b52cff` fix(s00): retira el exporte crudo de SonarQube con datos personales (DEF-17)
  - `6e454f4` docs(s01): salida del único análisis SonarQube del Sprint 1
  - `08db8e3` fix(s00): Laravel 12.69.3 y league/commonmark 2.10.3 (DEF-11)
  - `985f971` fix(s00): retira firebase/php-jwt (DEF-14)
  - `508eb4b` fix(s00): MySQL 8.4 como motor del producto (DEF-12)
  - `a8c886d` fix(s00): matching sin root (DEF-13)
  - `b3edf5a` docs(s00): evidencias de sprint-00 y registro actualizado
  - `deabac5` AGENTS.md · `4634204` CLAUDE.md · `5ef25f8` HANDOFF-codex.md · `34d5d2a` DECISIONES.md · `5b41b5c` docs/avances/README.md · `3754494` PLAN-MAESTRO-v3.md
  - `2ee5815` test(s00): conteo de pruebas por sprint y herramienta desde JUnit
  - `d5601f6` docs(s00): análisis de estado versionados y causa de NEW-01 corregida
  - `acd932a` fix(s00): retira el Word con códigos de alumno (DEF-17)
- **Pruebas** (09-10, slot A, después de recrear el volumen):
  - Pest 62/62 (714 aserciones).
  - Prueba de humo en el slot B: 1/1 contra `tecnicoya_b_testing`.
  - Cypress Sprint 1: 11/11 con `--junit`.
  - Vitest en `main`: 38/38.
  - `composer audit`: sin avisos.
  - Fallidas: ninguna.
- **Conteo** (`node scripts/contar-pruebas-sprint.mjs`, IDs heredados TC-NNN): S01 13 (Pest 11, Cypress 8), S02 12 y S03 15. Ningún sprint llega a 60. No hay todavía IDs `SNN-TC-NNN`.
- **Entorno:** el volumen de pruebas se recreó (`down -v` y `up -d --wait`). Existen `tecnicoya_testing` y `tecnicoya_b_testing`, con permisos del usuario de pruebas sobre las dos.
- **Evidencias:** `docs/documentacion/evidencias/sprint-00/` (Pest, composer audit, Docker) y `evidencias/sprint-01/continuacion/DIAGNOSTICO-E2E-2026-10-09.md`.

**Qué falta:**
1. DEF-17: reemplazar `fuentes/proyecto-final.pdf` cuando el equipo entregue la versión sin códigos (D-08). La purga no se ejecuta (D-09).
2. DEF-07: análisis SonarQube con cobertura (`composer test:sonar`) sobre el commit integrado, en el cierre del sprint.
3. DEF-13: contenedor web sin root (pedido a Codex, abajo).
4. Cierre de S1 a S3:
   - catálogo de 60 casos por sprint y contrato de API (paso N.1 del plan v3);
   - renombrar los IDs a `SNN-TC-NNN`;
   - `GET /api/v1/technicians`;
   - endpoints de S2 que faltan.
5. DEF-16: actualizar `Matriz-Trazabilidad-TC.csv` con los casos de S2 y S3 que pasan.

**Bloqueos:**
- Decisiones P10, P17 y P22 (bloquean TC-122, 123 y 130 de S3) y MOD-01 (asignación de módulos).
- Calendario sin fechas.

**Pedidos a Codex:**
1. Al integrar el PR #1, mover `/HANDOFF-codex.md` de la raíz a `docs/documentacion/sprints/HANDOFF-codex.md` (regla 12).
2. DEF-13: añadir un usuario no root a `frontend/web/Dockerfile`.
3. Las specs de `cypress/e2e/sprint-01/` ya no tienen puertos ni cookie fijos: leen `Cypress.expose('apiUrl')`, `Cypress.expose('sessionCookie')` y `Cypress.config('baseUrl')` (commit `fa6de02`). Las specs nuevas deben seguir ese patrón y lanzarse con `node scripts/run-e2e.mjs --sprint NN --slot B --junit`.
4. Al cerrar S1 a S3, renombrar las pruebas Vitest y Cypress a `SNN-TC-NNN [TC-0xx]` para que cuenten.
5. Tras integrar el PR #1, Claude Code cerrará en el registro DEF-08, DEF-10 y DEF-18 cuando el nuevo análisis SonarQube y `npm audit` lo confirmen.

**Integración:** el PR #1 (`codex/s00-frontend`) y esta rama **no comparten archivos**; se pueden integrar en cualquier orden.
