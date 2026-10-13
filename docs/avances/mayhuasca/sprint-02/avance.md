# Avance · Mayhuasca · Sprint 02

- **Integrante:** Mayhuasca (capa backend). Dueño del módulo `f-administracion` según D-38: Pimentel, que revisa.
- **Sprint / módulo:** 02 / `f-administracion`
- **HU / RF / tarea:** HU-S02-01 a HU-S02-07 · RF-05, RF-07, RF-30, RF-33, RF-C01, RF-C02, RF-C04, RF-C06, RF-C08, RF-C09 · pasos S2.1 (brechas, catálogo, contrato y decisiones), S2.2 (Pest en rojo) y S2.3 (backend en verde)
- **Objetivo:** cerrar el backend del Sprint 2 con 60 o más casos trazables y aplicar D-46 a D-52.
- **Cambios y archivos:**
  - Catálogo y contrato: `docs/documentacion/plan-pruebas-v3/sprint-02/CATALOGO-S02.csv` (89 casos: 58 Pest, 17 Cypress y 14 Vitest) y `CONTRATO-API.md`.
  - Decisiones D-46 a D-52 en `docs/documentacion/sprints/DECISIONES.md`.
  - Renombrado a `S02-TC-NNN` de las 12 Pest existentes, sin cambiar su lógica.
  - Pruebas Pest nuevas en `backend/api/tests/Feature/Sprint02/`:
    - `SpecialtyCatalogTest`, `DistrictsTest`, `CarouselTest`, `AnnouncementAdminTest` y `TechnicianVerificationTest`;
    - `MediaUploadTest`, `PortfolioAndProfileTest`, `AvailabilityBoundariesTest` y `RateBoundariesTest`;
    - ayudas en `tests/Support/Sprint02.php` y fixtures sintéticos en `tests/fixtures/sprint02`.
  - Backend en `app/Modules/FAdministration`:
    - `POST /media` con `ImageSanitizer` (EXIF fuera, en PHP puro);
    - catálogo admin (especialidades y distritos), carrusel y distritos públicos;
    - comunicados (alta, edición de borrador, publicación y retiro);
    - verificación (bandeja, ficha, rechazo, suspensión, reactivación y nueva solicitud);
    - perfil propio y documentos del técnico, edición y retiro de trabajos;
    - reglas de franjas (D-49) y tarifas (D-48) y auditoría de tarifa.
  - Migración `2026_10_10_000018_add_purpose_to_media_files`; `DistrictSeeder` (D-15) y `Sprint02E2ESeeder`.
- **Rama / commits / PR:** `feature/mayhuasca/f-administracion/s02`
  - `500187b` test(s02): renombra las pruebas existentes a S02-TC-NNN
  - `fee8f84` docs(s02): catálogo de 89 casos, contrato de API y decisiones D-46 a D-52
  - `93f448c` test(s02): 46 casos Pest nuevos (S02-TC-013 a 058) en rojo
  - `ad89d4d` docs(s02): evidencia del rojo de S2.2
  - `f501a95` feat(s02): backend del Sprint 2 en verde
  - `522862b` fix(s02): precisiones de Codex al contrato v1.1
  - PR: ver HANDOFF-claude.md
- **Pruebas previstas:** S02-TC-001 a 089 (CATALOGO-S02.csv). A cargo de Claude Code: Pest 001 a 058.
- **Pruebas ejecutadas:**
  - Rojo (`93f448c`): Pest Sprint02 22/58.
    - Pasaron los 12 renombrados y, por código existente, 016, 017, 029, 033, 047, 050, 052, 056 y 057.
    - S02-TC-043 pasó en falso: la ruta aún no existía y devolvía el 404 esperado.
    - Las 36 restantes fallaron.
    - [01-rojo.txt](../../../documentacion/evidencias/sprint-02/pest/01-rojo.txt)
  - Verde (`f501a95`): suite Pest completa 148/148 (1535 aserciones); Sprint02 58/58. [02-verde.txt](../../../documentacion/evidencias/sprint-02/pest/02-verde.txt)
  - Cobertura: total 92,7 %; `app/Modules/FAdministration` 96,74 % (951/983); clases nuevas o modificadas en S2: 97,14 % (712/733). [03-cobertura.txt](../../../documentacion/evidencias/sprint-02/pest/03-cobertura.txt)
  - Mutación, solo de las 37 clases nuevas o modificadas: 1574 mutantes, 1295 eliminados, 176 sobrevivientes, 93 sin cubrir y 10 timeout; puntuación **82,91 %**. `ImageSanitizer` no tiene sobrevivientes. Los sobrevivientes se concentran en campos de respuesta y de auditoría sin aserción (`ManageAnnouncements` 39, `UpdateTechnicianProfileRequest` 18, `TechnicianDirectory` 18 y `Portfolio` 17). [04-mutacion.txt](../../../documentacion/evidencias/sprint-02/pest/04-mutacion.txt)
  - Precisiones de Codex (`522862b`): suite Pest 148/148 (1547 aserciones). Las aserciones nuevas de S02-TC-017 y 042 fallaron sin las reglas y pasaron con ellas.
  - `composer audit`: sin avisos. [05-audit.txt](../../../documentacion/evidencias/sprint-02/pest/05-audit.txt)
  - `Sprint02E2ESeeder`: dos corridas seguidas en el slot A con los mismos conteos (idempotente).
  - Cypress (059 a 075) y Vitest (076 a 089): a cargo de Codex (S2.4 y S2.5).
- **SonarQube:** no se ejecuta en este paso (regla 12b); se analiza en el cierre S2.6 sobre el commit integrado.
- **Revisor:** [PENDIENTE]
- **Fecha:** 2026-10-10
- **Pendientes y bloqueos:**
  - Codex: pantallas v1, landing de 10 secciones, Vitest 076 a 089 y Cypress 059 a 075 con `Sprint02E2ESeeder`.
  - Reforzar las aserciones de las clases con sobrevivientes y repetir la mutación solo de esas clases.
  - Cierre S2.6: regresión completa, conteo ≥ 60, SonarQube con Gate, `npm audit` e informe del sprint.
- **Decisiones relacionadas:** [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md) D-13, D-15, D-16, D-21, D-25, D-32 y D-46 a D-52.

## Uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| Claude Code · Claude Opus 5.5 (`claude-opus-5-5`) | 2026-10-10 | Tabla de brechas, catálogo de 89 casos, contrato de API, propuesta de 7 decisiones (el equipo eligió la opción A de todas), 46 pruebas Pest y la implementación del backend | 050 y 051 se reformularon antes del rojo para no duplicar aserciones de S02-TC-008. S02-TC-058 pasó a comparar sin orden (`toEqual`) porque MySQL reordena las claves JSON; el valor esperado no cambió. Un commit incluyó por error 20 PNG sin versionar de `storage/` (DEF-38); se quitaron antes de publicarlo. Al revisar `ApiExceptionRenderer` se vio que habría convertido una `HttpResponseException` en 500; se ajustó antes de ejecutar las pruebas, para conservar el código `ANNOUNCEMENT_NOT_EDITABLE` | [PENDIENTE] |
