# HANDOFF · Claude Code (backend)

Archivo de relevo de Claude Code (regla 12 de AGENTS.md). La entrada más reciente va primero. Al empezar, leer también [HANDOFF-codex.md](HANDOFF-codex.md).

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
