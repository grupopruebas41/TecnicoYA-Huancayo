# Avance · Mayhuasca · Sprint 01

- **Integrante:** Mayhuasca (capa backend). Dueño del módulo `f-administracion` según D-38: Pimentel, que revisa.
- **Sprint / módulo:** 01 / `f-administracion`
- **HU / RF / tarea:** HU-S01-01 a HU-S01-06 · RF-28, RF-33, RF-C01, RF-C06; RNF-08, RNF-09, RNF-11 · pasos S1.1 (catálogo y contrato), S1.2 (Pest en rojo) y S1.3 (backend en verde)
- **Objetivo:** cerrar el backend del Sprint 1 con 60 o más casos trazables y aplicar las decisiones D-43 y D-44.
- **Cambios y archivos:**
  - Catálogo y contrato: `docs/documentacion/plan-pruebas-v3/sprint-01/CATALOGO-S01.csv` (87 casos: 54 Pest, 17 Cypress y 16 Vitest) y `CONTRATO-API.md`.
  - Decisiones D-43 y D-44 en `docs/documentacion/sprints/DECISIONES.md`; DEF-36 en `docs/documentacion/calidad/REGISTRO-DEFECTOS.csv`.
  - Renombrado a `S01-TC-NNN` de las 33 pruebas existentes (Pest, Cypress y Vitest), sin cambiar su lógica.
  - Pruebas Pest nuevas en `backend/api/tests/Feature/Sprint01/`: `RegistrationBoundariesTest`, `SessionSecurityTest`, `AuthorizationMatrixTest`, `ProfileBoundariesTest`, `RegisterWithSessionTest` y `AdminAccessAuditTest`; ayudas en `tests/Support/Sprint01.php`.
  - D-43: `app/Http/Middleware/RejectActiveSession.php` (alias `session.none` en `bootstrap/app.php`, aplicado en `routes/api.php`) y el mensaje `session_active` en `lang/es/api.php`.
  - D-44: `app/Modules/FAdministration/Application/AuditAdminAccess.php`, conectado en `AuthController`; `AuditTrail` admite actor nulo.
- **Rama / commits / PR:** `feature/mayhuasca/f-administracion/s01`
  - `768fa75` test(s01): renombra las pruebas existentes a S01-TC-NNN
  - `66da984` docs(s01): catálogo de 87 casos, contrato de API y decisiones D-43 y D-44
  - `93a11ff` test(s01): 38 casos Pest nuevos y casos de D-43 y D-44 en rojo
  - `10986ab` docs(s01): evidencia del rojo
  - `2e5b3d0` feat(s01): registro sin sesión (D-43) y auditoría de accesos de administradores (D-44)
  - PR: ver HANDOFF-claude.md
- **Pruebas previstas:** S01-TC-001 a 087 (CATALOGO-S01.csv). A cargo de Claude Code: Pest 001 a 014, 034 a 071, 086 y 087.
- **Pruebas ejecutadas:**
  - Rojo (`93a11ff`): Pest Sprint01 52/54. Los 38 nuevos de 034 a 071 pasaron desde el inicio porque prueban código existente (regresión); fallaron 086 (D-43) y 087 (D-44); 0 omitidos. [01-rojo.txt](../../../documentacion/evidencias/sprint-01/01-rojo.txt)
  - Verde (`2e5b3d0`): suite Pest completa 102/102 (1038 aserciones). [02-verde.txt](../../../documentacion/evidencias/sprint-01/02-verde.txt)
  - Cobertura: total 94,6 %; `app/Modules/FAdministration` 95,7 % (443/463 sentencias). [03-cobertura.txt](../../../documentacion/evidencias/sprint-01/03-cobertura.txt)
  - Mutación sobre las 12 clases del Sprint 1 en FAdministration: 254 mutantes, 234 eliminados, 1 timeout, 9 sobrevivientes (campos y orden de la respuesta de `CatalogController`) y 10 sin cubrir (rama de rol inactivo en `AuthController::login` y carrera de correo único en `RegisterAccount`). Puntuación **92,52 %**. El módulo completo (848 mutantes, unas 2,8 h) queda para S1.6. [04-mutacion.txt](../../../documentacion/evidencias/sprint-01/04-mutacion.txt)
  - DEF-37: la primera corrida de `pest --mutate` dio un 95,05 % falso porque en Windows los procesos de mutante no arrancaban y contaban como eliminados. Se descartó y se repitió invocando `vendor\bin\pest`.
  - `composer audit`: sin avisos. [05-audit.txt](../../../documentacion/evidencias/sprint-01/05-audit.txt)
  - Cypress y Vitest nuevos (072 a 085): a cargo de Codex (N.4 y N.5).
- **SonarQube:** no se ejecuta en este paso (regla 12b); se analiza en el cierre S1.6 sobre el commit integrado. Quality Gate: APROBADO en el cierre S1.6 (análisis `sprint-01`, 2026-10-10; ver [INFORME-SPRINT-01.md](../../../documentacion/sprints/INFORME-SPRINT-01.md)).
- **Revisor:** Pimentel (revisó e integró el PR #6 el 2026-10-09)
- **Fecha:** 2026-10-09
- **Pendientes y bloqueos:**
  - Codex: Vitest 078 a 085 (incluido 084, que falla hasta corregir DEF-36) y Cypress 072 a 077.
  - Matar los 9 mutantes sobrevivientes de `CatalogController` (afirmar `id`, `description`, `image_url` y el orden) y cubrir las ramas sin cubrir; mutación del módulo completo.
  - Cierre S1.6: regresión completa, conteo ≥ 60, SonarQube con Gate, `npm audit` e informe del sprint.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md) D-14, D-32, D-43 y D-44.

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | 2026-10-09 | Tabla de brechas, catálogo de 87 casos, contrato de API, propuesta de las decisiones S01-A y S01-B (el equipo eligió la opción A de ambas), 40 pruebas Pest y la implementación de D-43 y D-44 | S01-TC-063 falló en el primer intento por un error de la propia prueba (faltaban `granted_by` y `granted_at` al insertar la concesión individual); se corrigió antes del commit de rojo. El ejemplo de teléfono del catálogo tenía 19 caracteres y se ajustó a 20. La primera puntuación de mutación (95,05 %) era falsa (DEF-37); Claude Code la detectó por su duración (806 mutantes en 53 s), la comprobó con Symfony Process y repitió la ejecución | Pimentel (PR #6, 2026-10-09) |
