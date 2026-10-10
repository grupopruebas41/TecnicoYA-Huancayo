# Informe del Sprint 1 · Base técnica, autenticación, roles y catálogo

- **Proyecto:** TécnicoYa Huancayo · curso Pruebas y Calidad de Software.
- **Módulo:** `f-administracion` (dueño: Pimentel, D-38).
- **Fecha de cierre:** 2026-10-10.
- **Revisión cerrada:** `main` `8c570e9` (PR #6 backend y PR #7 frontend), más la rama de cierre `feature/pimentel/f-administracion/s01-cierre` (pruebas y documentos; sin cambios de producto).
- **Evidencias:** [evidencias/sprint-01/cierre/](../evidencias/sprint-01/cierre/README.md). **Catálogo:** [CATALOGO-S01.csv](../plan-pruebas-v3/sprint-01/CATALOGO-S01.csv). **Contrato:** [CONTRATO-API.md](../plan-pruebas-v3/sprint-01/CONTRATO-API.md).

## 1. Alcance logrado frente al plan

Plan: [CANVAS-Sprint-01.md](../editables/sprints-01-08/CANVAS-Sprint-01.md), con 6 historias, los casos base TC-001 a TC-012 más TC-137 y los requisitos RF-28, RF-33, RF-C01 y RF-C06.

| Historia | Comprometido | Resultado | IDs S01 (herramienta) |
|---|---|---|---|
| HU-S01-01 Registro de cliente | Alta válida y correo duplicado (TC-001 y 002) | ✅ Hecho | 001, 015, 023, 034, 042 y otros de borde (Pest y Cypress) |
| HU-S01-02 Técnico pendiente | Alta pendiente y autoactivación rechazada (TC-003 y 004) | ✅ Hecho | 002, 003, 072 |
| HU-S01-03 Sesión y cierre por rol | Acceso por rol y sesión invalidada (TC-005 y 006) | ✅ Hecho | 004, 016 a 019, 024, 046, 062 y 063 |
| HU-S01-04 Autorización efectiva | Ruta administrativa denegada y alta de administrador pública denegada (TC-007 y 008) | ✅ Hecho, con D-43 (registro con sesión abierta → 403) y D-44 (auditoría de accesos de administradores) | 005, 006, 058 a 061, 086 y 087 |
| HU-S01-05 Perfil propio | Edición y conflicto 409 (TC-009 y 010) | ✅ Hecho | 007, 008, 025, 070 |
| HU-S01-06 Catálogo | Semilla repetible 3/30 y lectura real (TC-011 y 012) | ✅ Hecho | 009, 010, 021, 022, 071, 085 |
| Transversal: contraseña nunca expuesta (TC-137, RNF-08) | — | ✅ Hecho | 011, 025 |
| RT-06: «probar build, migraciones y permisos en CI» | Pipeline de CI | ❌ **No hecho**: no existe el workflow de GitHub Actions (D-39, DEF-27) | — |

**Resumen:**
- Las 6 historias y los 13 casos base del plan están aprobados.
- El catálogo de S1 creció de 13 a 87 casos con técnicas de caja negra: particiones, valores límite, matriz de permisos y seguridad de sesión.
- Solo queda fuera la integración continua.
- Trazabilidad: las 13 filas del Sprint 1 de [Matriz-Trazabilidad-TC.csv](../editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv) están en APROBADO, con sus IDs S01.

## 2. Pruebas por herramienta

| Herramienta | IDs S01 en el catálogo | IDs S01 aprobados (contador) | Meta | Ejecución de cierre | Evidencia |
|---|---|---|---|---|---|
| Pest 3 (API y MySQL 8.4) | 54 | **54** | ≥ 36 ✅ | Suite completa 102/102 (1047 aserciones, 52 s) | [pest-cobertura.txt](../evidencias/sprint-01/cierre/pest-cobertura.txt) |
| Cypress 16.1 (Chrome 156) | 17 | **17** | ≥ 14 ✅ | 17/17 en 6 specs, slot A (1 min 37 s) | [cypress-slotA.txt](../evidencias/sprint-01/cierre/cypress-slotA.txt) |
| Vitest 2.1 | 16 | **24**¹ | ≥ 10 ✅ | 92/92 en 17 archivos | [vitest-cobertura.txt](../evidencias/sprint-01/cierre/vitest-cobertura.txt) |
| **Total (IDs distintos)** | **87** | **87** | ≥ 60 ✅ | 0 fallidos, 0 omitidos | [conteo.txt](../evidencias/sprint-01/cierre/conteo.txt) |

¹ Ocho IDs de casos Cypress (por ejemplo, 072 a 077) tienen además un complemento unitario en Vitest. El contador los encuentra en las dos herramientas, pero el ID distinto se cuenta una sola vez. Según el catálogo, Vitest tiene 16 IDs propios, y la meta se cumple igual.

Fuera de la meta (regresión del prototipo y de S2 y S3): Pest de `MarketplaceTest` y `AnnouncementsTest`, 38 Vitest de la demo, y 12 y 15 IDs de S2 y S3.

## 3. Métricas

| Métrica | Valor | Base de cálculo |
|---|---|---|
| **Tasa de aprobación (cierre)** | **100 %**: 87/87 IDs; 211/211 ejecuciones (102 Pest, 17 Cypress y 92 Vitest) | Corrida de regresión S1.6 |
| Tasa de aprobación en el primer intento | Pest 52/54 en rojo (las 2 fallas eran las esperadas de D-43 y D-44, por TDD); Cypress 16/17 en las 2 primeras corridas de S1.5 (DEF-39) | Evidencias `01-rojo.txt` y `cypress/README.md` |
| **Cobertura del backend** | Total 94,6 %; módulo `FAdministration` **95,7 %** (443/463 sentencias); `app` 97,1 %, `database` 89,0 %, `routes` 95,1 % y `config` 100 % | PCOV y Clover |
| **Cobertura del frontend** | Líneas 82,97 % (sentencias 69,04 %); módulo `features/administration` **96,27 %** en líneas | V8 y LCOV |
| Cobertura en SonarQube | Código nuevo **77,8 %** (umbral 70 %); total 84,7 % | Análisis `sprint-01` |
| **Mutación** | `CatalogController` **100 %** (27/27, antes 9 sobrevivientes). Las 12 clases del S1: **96,06 %** (244/254; los 10 restantes están sin cubrir: rama de rol inactivo de `AuthController::login` y carrera de correo único en `RegisterAccount`) | `pest --mutate` (D-45). La cifra de las 12 clases es un recálculo de la corrida `04-mutacion.txt`, con la clase rehecha |
| **Densidad de defectos** | 4 defectos del sprint / 1,241 KLOC nuevas = **3,2 por KLOC**. Solo de producto (DEF-36): **0,8 por KLOC**. Sobre todo el código analizado (4,454 KLOC): 0,9 por KLOC | Defectos DEF-36 a DEF-39; `new_lines` y `ncloc` de SonarQube |
| **Eficacia de corrección** | Sprint: 4/4 cerrados (**100 %**). Registro acumulado: 23 cerrados de 36 no duplicados (**63,9 %**) | `REGISTRO-DEFECTOS.csv` |
| **Deuda técnica** | 850 min (~14,2 h); rating de mantenibilidad A; 116 code smells (35 críticos), frente a 109 (32 críticos) en S0 | SonarQube |
| Fiabilidad y seguridad | 0 bugs, 0 vulnerabilidades, 0 hotspots; ratings A | SonarQube |
| Duplicación | Código nuevo 0,0 %; total 1,5 % | SonarQube |
| **Quality Gate «TecnicoYa»** | **APROBADO (OK)**: las 5 condiciones en verde. Revisión `4171f06`, cuyo producto es `main` `8c570e9`. Periodo `PREVIOUS_VERSION` desde `sprint-00` | [gate.json](../evidencias/sprint-01/cierre/sonar/gate.json) |
| Dependencias | `composer audit` sin avisos; `npm audit` 0 vulnerabilidades | [composer-audit.txt](../evidencias/sprint-01/cierre/composer-audit.txt), [npm-audit.txt](../evidencias/sprint-01/cierre/npm-audit.txt) |

Los 3 code smells críticos nuevos incluyen `javascript:S3776` (complejidad cognitiva 17 de 15) en `AccountApp.jsx:42`. Hay además 3 avisos `S6819` de accesibilidad (`role="status"` en lugar de `<output>`) en `AccountApp.jsx` y `Catalog.jsx`.

## 4. Defectos

**Defectos del sprint (todos cerrados):**

| ID | Severidad | Resumen | Cierre |
|---|---|---|---|
| DEF-36 | Baja | 4 botones sin `type` en la cuenta v1 | `72872a8`. SonarQube `sprint-01` ya no reporta `javascript:S9011` |
| DEF-37 | Alta | Falsa puntuación de mutación en Windows | Pest se invoca con `vendor\bin\pest` |
| DEF-38 | Baja | S01-TC-010 reforzada escribía PNG en el disco real | `b0d794b` (`Storage::fake`) |
| DEF-39 | Media | S01-TC-075: Enter nativo incompleto en Chromium | `abb2b7b` (CDP, `isTrusted=true`) |

**Abiertos que siguen** (13 en total): DEF-09, 16, 17 (parcial), 22, 24, 25 (parcial: S1 resuelto), 26, 27, 28, 29, 30, 32 y 33. Los que afectan el próximo cierre:

- **DEF-27, sin CI.** Es el único requisito del CANVAS de S1 sin cumplir. Responsable: Claude Code, con la configuración común en `feature/pimentel/…`.
- **DEF-16.** La matriz ya tiene S1, pero faltan S2 y S3.
- **DEF-24 y DEF-25.** Pantallas v1 y Vitest de S2 y S3 (Codex).
- **DEF-33.** Capítulos 13 y 14 del informe; este documento les da los datos (§7).

Registro completo: [REGISTRO-DEFECTOS.csv](../calidad/REGISTRO-DEFECTOS.csv) y [REGISTRO-DEFECTOS.md](../calidad/REGISTRO-DEFECTOS.md).

## 5. Capturas que debes tomar

Ejecuta cada comando desde la raíz del repositorio en PowerShell, salvo que se indique otra cosa. Haz una sola corrida de Cypress a la vez y no la lances con SonarQube arriba.

| # | Captura | Comando exacto | Qué debe verse |
|---|---|---|---|
| 1 | Pest del Sprint 1 | `cd backend/api; C:\xampp\php\php.exe artisan config:clear; C:\xampp\php\php.exe vendor/pestphp/pest/bin/pest tests/Feature/Sprint01` | `Tests: 54 passed` |
| 2 | Cobertura del backend | `cd backend/api; $env:PATH="C:\xampp\php;$env:PATH"; composer test:coverage` | Tabla por clase y `Total: 94.6 %` |
| 3 | Vitest con cobertura | `cd frontend/web; npm run test:coverage` | `Tests 92 passed` y la fila `administration` con 96,27 % de líneas |
| 4 | Cypress del Sprint 1 | `node scripts/run-e2e.mjs --sprint 01 --slot A` | `All specs passed! 17 17` |
| 5 | Conteo por sprint | `node scripts/contar-pruebas-sprint.mjs` | Fila `S01 \| 54 / 0 / 0 \| 17 / 0 / 0 \| 24 / 0 / 0 \| 87 \| Sí` |
| 6 | Mutación de `CatalogController` | `Get-Content docs\documentacion\evidencias\sprint-01\cierre\mutacion-catalog.txt -Tail 35`. Para repetirla, unos 11 min: `cd backend/api; $env:PATH="C:\xampp\php;$env:PATH"; php -d pcov.enabled=1 -d pcov.directory=. -d "pcov.exclude=~(vendor\|storage\|bootstrap/cache)~" 'vendor\bin\pest' tests/Feature/Sprint01 --mutate --everything --clear-cache --path=app/Modules/FAdministration/Http/Controllers/CatalogController.php` | `Mutations: 27 tested`, `Score: 100.00%` |
| 7 | SonarQube: Quality Gate | `wsl -d docker-desktop -u root -- sysctl -w vm.max_map_count=524288`, luego `docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality up -d sonarqube`, y abrir `http://127.0.0.1:9000/dashboard?id=tecnicoya-huancayo` | «Passed», versión `sprint-01`, cobertura nueva 77,8 % |
| 8 | SonarQube: medidas e incidencias | Con SonarQube arriba, `http://127.0.0.1:9000/component_measures?id=tecnicoya-huancayo` y `http://127.0.0.1:9000/project/issues?id=tecnicoya-huancayo&resolved=false`. Al terminar: `docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality stop` | Cobertura 84,7 %, deuda y 116 code smells |
| 9 | Auditoría de dependencias | `cd backend/api; $env:PATH="C:\xampp\php;$env:PATH"; composer audit` y `cd frontend/web; npm audit` | «No security vulnerability advisories found» y «found 0 vulnerabilities» |
| 10 | PR de cierre | `gh pr view feature/pimentel/f-administracion/s01-cierre --web` | Descripción y commits del PR |
| 11 | Registro de defectos | Abrir `docs/documentacion/calidad/REGISTRO-DEFECTOS.md` en VS Code (vista previa con `Ctrl+Shift+V`) | DEF-36 a DEF-39 en Cerrado |

## 6. Retrospectiva

**Qué funcionó**
- Catálogo y contrato antes que el código. Con 87 casos trazables y el contrato de API compartido, backend y frontend trabajaron en paralelo, en slots A y B, sin pisarse.
- TDD real en las decisiones nuevas: D-43 y D-44 entraron primero en rojo y luego en verde.
- La mutación encontró lo que la cobertura no veía: `CatalogController` tenía 100 % de cobertura y 9 mutantes vivos.

**Qué no funcionó**
- Dos falsos verdes de herramientas: la mutación en Windows (DEF-37) y un Enter de Cypress que no era nativo (DEF-39). Se detectaron por la duración anómala y por la verificación de `isTrusted`.
- Una prueba nueva dejaba archivos en el disco real (DEF-38).
- No hay CI. Toda la verificación depende de corridas locales y manuales.

**Qué cambiamos para S2**
- Sospechar de cualquier puntuación «demasiado rápida» y conservar el log crudo.
- Toda prueba que cree medios usa `Storage::fake`.
- Crear el workflow de GitHub Actions al inicio de S2 (D-39), no al cierre.
- Atender los 3 code smells críticos nuevos y los avisos `S6819`.

## 7. Datos para el informe

Los capítulos siguen `informe-final/contenido-editable.md`. El capítulo 14 no existe todavía en ese archivo (DEF-33); se propone usarlo para el balance por sprint. Confirma el título con el equipo.

**Capítulo 8 · Desarrollo del sistema (§8.2, Fase 2: funcionalidades básicas)**
- **API v1 con sesión SPA de Sanctum:** cookie HttpOnly, CSRF y rotación al autenticar. Rutas: `/auth/register`, `/auth/login`, `/auth/logout`, `/me` (GET y PATCH con `expected_version`) y `/catalog/specialties|subcategories`.
- **Roles y permisos:** un rol por cuenta (D-14). El técnico nace `pending_verification` y el administrador se aprovisiona por comando restringido.
- **D-43:** registro con sesión abierta → 403 `SESSION_ACTIVE`.
- **D-44:** auditoría en `audit_entries` de accesos y cierres de sesión de administradores.
- **Catálogo:** semilla idempotente de 3 especialidades y 30 subcategorías (11/9/10).
- **Frontend React:** registro de cliente y de técnico, inicio y cierre de sesión, rutas `#cuenta/{cliente,tecnico,administrador}` resueltas con `/me`, perfil con control de versión (409), avisos 403, 409 y 429 en español, y catálogo con estados de carga, error y vacío.
- **Integración:** PR #6 (backend) y PR #7 (frontend), revisados e integrados por Pimentel el 2026-10-09.

**Capítulo 11 · Estrategia de pruebas**
- **Enfoque:** TDD (rojo y verde por commit) y caja negra sobre el contrato. Técnicas: partición de equivalencia, valores límite, matriz de decisión de permisos y pruebas de seguridad de sesión.
- **Niveles:** unitario y de componente con Vitest; integración de API y base de datos con Pest sobre MySQL 8.4 real; sistema y E2E con Cypress sobre React, Laravel y MySQL.
- **Tipos:** funcionales, de seguridad (CSRF, sesión invalidada, contraseña nunca expuesta, permisos negativos), de accesibilidad (teclado, foco, `type` en botones) y de mutación.
- **Plan de ejecución:**
  1. S1.1, catálogo y contrato;
  2. S1.2, Pest en rojo;
  3. S1.3, backend en verde;
  4. S1.4, frontend con Vitest;
  5. S1.5, Cypress integrado;
  6. S1.6, regresión, mutación, SonarQube y cierre.

**Capítulo 12 · Automatización**
- **Herramientas:** Pest 3.8 con pest-plugin-mutate, Vitest 2.1 con V8, Cypress 16.1.1 con Chrome 156, SonarQube Community Build 26.9 y scanner 8.1, PCOV, `composer audit` y `npm audit`.
- **Entorno:**
  - un contenedor MySQL 8.4 con dos slots (D-06): A con `tecnicoya_testing` y puertos 8001/5174; B con `tecnicoya_b_testing` y puertos 8002/5175;
  - bloqueo global de Cypress;
  - datos sintéticos.
- **Scripts:**
  - `scripts/run-e2e.mjs`: migra y siembra el slot, levanta API y web, ejecuta Cypress y genera JUnit;
  - `scripts/contar-pruebas-sprint.mjs`: cuenta los IDs por sprint y herramienta;
  - `scripts/run-quality.ps1`, `report-quality.mjs` y `exportar-sonar-anonimo.mjs`.
- **Ejecución automática:** local y por script. La CI está pendiente (DEF-27).

**Capítulo 13 · Métricas de calidad**
- **§13.1:** 87/87 IDs y 211/211 ejecuciones (§2 y §3).
- **§13.2:** DEF-36 a DEF-39, todos cerrados. El registro tiene 39 defectos: 23 cerrados, 13 abiertos y 3 duplicados (§4).
- **§13.3:**
  - cobertura de 95,7 % en el backend del módulo y de 96,27 % en el frontend del módulo;
  - mutación de 96,06 % en las 12 clases;
  - densidad de 3,2 defectos por KLOC nueva;
  - eficacia de corrección de 100 % en el sprint.
- **§13.3.1, comparación con SonarQube:**

  | Medida | `sprint-00` (`a2d7129`) | `sprint-01` (`4171f06`) |
  |---|---|---|
  | Gate | OK | OK |
  | Cobertura de código nuevo | 93,8 % | 77,8 % |
  | Cobertura total | 78,3 % | 84,7 % |
  | Code smells | 109 (32 críticos) | 116 (35 críticos) |
  | Bugs, vulnerabilidades y hotspots | 0 | 0 |

- **§13.4:** la calidad se evalúa con la DoD del curso y con las características ISO/IEC 25010 que miden SonarQube y las pruebas: adecuación funcional, seguridad, mantenibilidad y fiabilidad.

**Capítulo 14 (propuesto) · Balance del Sprint 1**
- Alcance cumplido en 6 de 6 historias y en todo el CANVAS, salvo la CI.
- Meta de pruebas superada: 87 IDs frente a 60.
- Gate aprobado.
- Retrospectiva en §6 y pendientes en §8.

## 8. Definición de terminado

| Criterio (AGENTS.md, regla 8) | Estado | Evidencia |
|---|---|---|
| Alertas de éxito y error en cada operación CRUD, con su prueba | ✅ | Registro y perfil: Cypress 015 a 025 y 072 a 077; Vitest 081, 083 y 085 |
| Doble validación | ✅ | `validateAccount` (Vitest) y Form Requests (Pest 034 a 045) |
| Textos en español | ✅ | `assertSpanishValidation` (Pest) y textos verificados en Vitest |
| Confirmación antes de eliminar | N/A | S1 no tiene operaciones de borrado |
| Accesibilidad básica | ✅ con observación | DEF-36 cerrado y S01-TC-075 (teclado). Quedan 3 avisos `S6819` menores |
| Permisos en servidor con prueba negativa | ✅ | S01-TC-005, 006 y 058 a 061 |
| Auditoría de acciones sensibles | ✅ | D-44, S01-TC-087 |
| Cobertura ≥ 70 % en el módulo | ✅ | 95,7 % (backend) y 96,27 % (frontend) |
| Quality Gate aprobado | ✅ | `sprint-01`, OK |
| Sin vulnerabilidades críticas o altas nuevas | ✅ | `composer audit` y `npm audit` limpios |
| Evidencias guardadas | ✅ | `evidencias/sprint-01/` |

**Veredicto:** el Sprint 1 **cumple la definición de terminado**, con estas salvedades:

1. La CI que pide el CANVAS (RT-06) no existe (DEF-27). No es un criterio de la regla 8, pero sí del plan.
2. El Gate se midió sobre `4171f06`, que tiene el mismo producto que `main` `8c570e9`. Tras integrar este PR, `main` tendrá otro hash con el mismo código.
3. La revisión humana de este PR de cierre está [PENDIENTE].
4. Quedan 10 mutantes sin cubrir y 3 code smells críticos nuevos.
