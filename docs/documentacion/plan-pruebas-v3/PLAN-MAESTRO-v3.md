# Plan maestro v3 · TécnicoYa Huancayo

**Versión:** 3.0 · **Fecha:** 9 de octubre de 2026 · **Estado:** vigente para el trabajo con dos agentes (Claude Code y Codex).
Sustituye como guía de ejecución al plan de pruebas v2 (`editables/PLAN-DE-PRUEBAS-TecnicoYa-v2.md`), que sigue siendo la referencia de estrategia, riesgos y técnicas. **No** reemplaza los CANVAS de sprint, que siguen siendo la especificación de cada incremento.

## Índice

0. [Control del documento, fuentes y jerarquía](#0-control-del-documento-fuentes-y-jerarquía)
1. [Alcance del MVP y stack](#1-alcance-del-mvp-y-stack)
2. [Los 8 sprints](#2-los-8-sprints)
3. [Estado real de S1 a S3](#3-estado-real-de-s1-a-s3-09-10-2026)
4. [Meta de pruebas por sprint](#4-meta-de-pruebas-por-sprint)
5. [Esquema de IDs SNN-TC-NNN](#5-esquema-de-ids-snn-tc-nnn)
6. [Reparto Claude Code / Codex / equipo](#6-reparto-claude-code--codex--equipo)
7. [Flujo de un sprint (N.1 a N.6)](#7-flujo-de-un-sprint-n1-a-n6)
8. [Definición de terminado y evidencias](#8-definición-de-terminado-y-evidencias)
9. [Conteo y control](#9-conteo-y-control)
10. [Riesgos y decisiones pendientes](#10-riesgos-y-decisiones-pendientes)
11. [Calendario](#11-calendario)

---

## 0. Control del documento, fuentes y jerarquía

**Jerarquía de fuentes** (regla 3 de AGENTS.md):
1. [`sprints/DECISIONES.md`](../sprints/DECISIONES.md)
2. [`editables/REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md`](../editables/REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md)
3. [`editables/sprints-01-08/CANVAS-Sprint-0N.md`](../editables/sprints-01-08/)
4. Este documento (`plan-pruebas-v3/`)
5. El resto

Si dos fuentes se contradicen, el agente se detiene y pregunta.

**Plan histórico que NO prevalece** (decisión D-01):
- Los PDF **08 a 17** de `docs/documentacion/` (Iteraciones 1 a 10) y el PDF 03 (backlog de 10 iteraciones): PostgreSQL, FastAPI como motor, token propio, asistente con LLM (I06 e I07) y pagos reales (I09).
- Los PDF 04, 06 y 07, diseñados sobre PostgreSQL y el prototipo.
- Las carpetas `docs/documentacion/sprints/S01..S04/` (plan de 4–5 iteraciones).
- El Word «Capítulos 1 al 8», en su Tabla 5.4 (I0 + S01..S05).

Se conservan solo como historia. **Ningún agente los sigue.**

**Insumos de esta versión:**
- `analisis-estado/CONTEXTO-COMPLETO-2026-10-09.md`: estado real y mediciones del 09-10.
- `calidad/REGISTRO-DEFECTOS.csv`
- `sprints/ENTORNO-PARALELO.md`
- `editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv`: catálogo TC-001..TC-140.

## 1. Alcance del MVP y stack

**Producto:** marketplace web que conecta clientes (MYPES y hogares de Huancayo) con técnicos de cómputo, refrigeración comercial y electricidad.

**Incluye:**
- solicitud en 5 pasos;
- matching ponderado con hasta 3 ofertas;
- SLA de 10 min;
- pendiente de 24 h;
- atención y agenda;
- calificación con ventana de 48 h y apelaciones;
- panel administrador;
- pagos y comprobantes **simulados**.

**Excluye:** suscripciones, chat y LLM, geolocalización real, apps móviles y procesamiento financiero.

| Vigente | Congelado (solo regresión; se retira en S8) |
|---|---|
| React 18 + Vite 5 (`frontend/web`, `features/*`) | Demo `localStorage` (`#demo`) |
| Laravel 12, API `/api/v1`, Sanctum (cookie + CSRF), módulos `app/Modules/A..F` | API `/api/*` con token (salvo `GET /api/health`) |
| MySQL 8.4 (producto y pruebas) | PostgreSQL; servicio Python `python/api` (matching del prototipo) |
| Pest 3, Vitest 2.1, Cypress 16.1, SonarQube | Pruebas `MarketplaceTest`, `AnnouncementsTest`, Vitest de la demo y pytest |
| Reverb/Echo y colas MySQL (desde S4) | — |

## 2. Los 8 sprints

Fuente: `editables/sprints-01-08/CANVAS-Sprint-0N.md` y `Plan-Sprints-01-08.json`. Casos según `Matriz-Trazabilidad-TC.csv`, con la herramienta prevista (Pest / Cypress / otros). **(B)** = bloqueado y **(C)** = condicionado por decisión pendiente.

| Sprint | Objetivo | Historias (casos del catálogo) | RF / RNF | Casos base | Decisiones que lo afectan |
|---|---|---|---|---|---|
| **S1** Base técnica, autenticación, roles y catálogo | Acceso por identidad y permisos reales sobre API y MySQL, perfiles mínimos y catálogo reproducible | HU-S01-01 registro de cliente (TC-001/002) · 02 técnico pendiente (003/004) · 03 sesión y cierre (005/006) · 04 autorización (007/008) · 05 perfil propio (009/010) · 06 catálogo (011/012) · TC-137 | RF-28, 33, C01, C06; RNF-08/09/11/14 | 13 (10/3/0) | P20, P22, P03/P16, P04 |
| **S2** Landing, administración de catálogo y perfil del técnico | Oferta visible; admin y técnicos preparan información verificable | HU-S02-01 landing de 10 secciones (013/014) · 02 catálogo (015/016) · 03 comunicados (017/018) · 04 verificación (019/020) · 05 perfil y portafolio (021/022C) · 06 disponibilidad, zona y pausa (023/024) · 07 servicios y tarifas (025/026) · TC-131, 134, 135 | RF-05, 07, 30, 33, C01, C02, C04, C06, C08, C09 | 17 (13/4/0) | P03, P05/P16, P17, P18, P19, P22, PERM-01 |
| **S3** Solicitud y búsqueda de técnicos | Describir, revisar y enviar la necesidad; consultar técnicos | HU-S03-01 cinco pasos (027/028) · 02 evidencias (029/030) · 03 tarifa y ubicación (031/032) · 04 búsqueda y perfil público (033C/034) · 05 solicitud desde perfil (035/036) · 06 mis solicitudes (037/038) · Módulo A TC-119..130 (122B, 123B, 130B) | RF-01..04, 33, C02, C06; RNF-03/05 | 24 (18/5/1) | P03, P05, P10, P16, P17, P22 |
| **S4** Matching, notificación, SLA y reasignación | Solicitud → ofertas trazables y asignación elegida | HU-S04-01 elegibilidad (039/040) · 02 puntuación (041/042) · 03 estimaciones (043/044C) · 04 ronda (045/046) · 05 SLA (047/048C) · 06 elección (049/050) · 07 reasignación (051/052) · 08 pendiente 24 h (053/054C) · 09 tiempo real (055/056) · 10 reintentos (057/058) · TC-132, 133C, 140B | RF-06..18, 29; RNF-07 | 23 (22/1/0) | P05/P16, P11, P12, P15, P19 |
| **S5** Atención, agenda y seguimiento | Ejecutar y seguir la atención hasta el reporte | HU-S05-01 agenda (059/060) · 02 inicio y fin (061/062) · 03 reprogramación (063/064) · 04 técnico adicional (065C/066) · 05 línea de tiempo (067/068) · 06 cancelación (069C/070) · 07 retiro e incidencia (071C/072) | RF-19..22, 33 | 14 (12/2/0) | P05/P16, P06, P13, P14 |
| **S6** Calificación, historial y apelaciones | Evaluación versionada, revisión e historial | HU-S06-01 calificar (073/074) · 02 editar con versiones (075C/076) · 03 sin calificar (077C/078) · 04 reseñas (079C/080) · 05 apelar (081C/082) · 06 resolución (083C/084) · 07 historial (085/086) | RF-23..27, 33 | 14 (13/1/0) | P07, P13, P17, P23 |
| **S7** Panel administrador completo | Supervisión, parámetros y accesos | HU-S07-01 dashboard (087C/088) · 02 reasignación manual (089C/090) · 03 bloqueos (091C/092) · 04 soporte (093/094) · 05 reglas (095C/096) · 06 reportes (097C/098) · 07 administradores y auditoría (099/100) | RF-30, 31, 33, C03, C05, C07, C12 | 14 (14/0/0) | P18, P19, P21 |
| **S8** Pagos simulados, notificaciones, endurecimiento y despliegue | MVP desplegable con controles revisados | HU-S08-01 métodos y comprobante (101C/102) · 02 historial y ganancias simuladas (103C/104) · 03 preferencias (105C/106) · 04 ayuda (107/108) · 05 regresión (109/110) · 06 Gate y cobertura (111C/112) · 07 rendimiento (113C/114C) · 08 usabilidad (115C/116C) · 09 despliegue (117/118C) · TC-136C, 138C, 139 | RF-29, 32, 33, C07, C09, C11; RNF-01..14 | 21 (9/3/9) | P01, P02/P16, P08, P09, P12, P21 |

Detalle de tareas por capa, rutas, Gherkin y DoD específica: ver cada CANVAS.

**Dependencias:**
- I0 → S1 → S2 → S3 → S4.
- S4 → S5 y S7; S4 ↔ S6; S5 → S6; S7 → S8.
- S1 a S7 → S8 (regresión total, endurecimiento y despliegue).

## 3. Estado real de S1 a S3 (09-10-2026)

Detalle y justificación de los porcentajes en `CONTEXTO-COMPLETO-2026-10-09.md` §8. Criterio: backend 40 %, pantalla v1 30 %, pruebas del catálogo 20 % y DoD 10 %. La demo no cuenta.

| Sprint | Avance | Hecho | Falta para cerrar |
|---|---:|---|---|
| S1 | ≈ 88 % | API v1 (auth, `/me`, catálogo) y pantallas de cuenta, perfil y catálogo; Pest 14 (11 TC + 3 S01-SEC); Cypress 11/11 (09-10, tras corregir DEF-19) | Gate de SonarQube con cobertura en el commit integrado (DEF-07); familias TC-AD-S01; Vitest v1 con ID; renombrar a `S01-TC-NNN`; llegar a 36/14/10; `docs/avances` |
| S2 | ≈ 45 % | API de catálogo administrativo, comunicados (lectura y duplicado), revisión técnica, disponibilidad, zona y pausa, servicios y tarifas versionadas y portafolio; Pest 12 | **Pantallas v1** de administración y del técnico; `/admin/specialties`, `/admin/districts`, CRUD de comunicados, `/technicians/me/profile` y `/documents`; landing de 10 secciones; Cypress TC-013, 014, 131, 135; P17, P03 y P22 |
| S3 | ≈ 40 % | API de solicitud en 5 pasos (borrador, corrección con versión, adjuntos, envío idempotente), perfil público y solicitud dirigida; Pest 15 | **`GET /api/v1/technicians`** (búsqueda); **pantallas v1** (asistente de 5 pasos, mis solicitudes, búsqueda, perfil público); Cypress TC-027, 028, 124, 125, 128; P10, P17 y P22 |

**Mediciones del 09-10:**
- Pest 62/62 (714 aserciones, cobertura 95,9 %).
- Vitest 38/38 en `main`; 63/63 en el PR #1 de Codex.
- pytest 4/4.
- Cypress 11/11.
- `composer audit` y `npm audit` (PR #1) sin avisos.

## 4. Meta de pruebas por sprint

**Meta (D-03): 60 o más IDs distintos ejecutados y aprobados por sprint.** Mínimo por herramienta:

| Herramienta | Mínimo por sprint | Qué prueba |
|---|---:|---|
| Pest (Feature, Unit y Arch) | 36 | Validación del servidor, autorización y propiedad, persistencia, transiciones, reloj controlado, concurrencia e idempotencia, auditoría |
| Cypress (E2E contra el backend real) | 14 | Recorridos visibles, alertas, validación de cliente, confirmaciones, errores de red y accesibilidad básica |
| Vitest (componentes y validaciones) | 10 | Estados de los componentes, validación de formularios, mensajes y formato |

**Qué cuenta:** IDs distintos con resultado aprobado en la ejecución de cierre del sprint, sobre el commit integrado.

**Qué no cuenta:**
- casos `skip` por decisión pendiente;
- duplicados;
- pruebas sin aserción relevante;
- filas de un dataset sin ID propio;
- pruebas del prototipo histórico;
- k6 y pruebas manuales (SUS), que se registran aparte.

**Técnicas para llegar a 60 sin relleno:**
- partición de equivalencia y valores límite;
- tabla de decisión por rol (cliente, técnico, administrador, anónimo, cuenta suspendida);
- transición de estados;
- pruebas negativas de seguridad (datos ajenos, rol incorrecto, CSRF, IDOR);
- concurrencia e idempotencia;
- familias CRUD, VAL y AUTH de la adenda P11-B;
- mensajes en español;
- accesibilidad.

**Brecha al 09-10** (IDs que ya cuentan: hoy son 0 en formato `SNN-TC-NNN`; la tabla usa los IDs TC heredados para estimar):

| Sprint | Pest hoy | Cypress hoy | Vitest hoy | Faltan Pest | Faltan Cypress | Faltan Vitest | Faltan en total |
|---|---:|---:|---:|---:|---:|---:|---:|
| S1 | 14 | 9 | 0 | 22 | 5 | 10 | 37 |
| S2 | 12 | 0 | 0 | 24 | 14 | 10 | 48 |
| S3 | 15 | 0 | 0 | 21 | 14 | 10 | 45 |
| S4–S8 | 0 | 0 | 0 | 36 c/u | 14 c/u | 10 c/u | 60 c/u |
| **Total** | 41 | 9 | 0 | **247** | **103** | **80** | **430** |

El catálogo base tiene 140 casos, con 26 bloqueados o condicionados. Para cumplir la meta hay que **diseñar unos 340 casos nuevos** en el paso N.1 de cada sprint.

## 5. Esquema de IDs SNN-TC-NNN

- **Formato:** `S04-TC-017`, con sprint de dos dígitos y número de tres, correlativo dentro del sprint y **único en todas las herramientas**. Un ID pertenece a una sola prueba.
- **Ubicación:** al **inicio de la descripción** de la prueba.
  - Pest: `it('S04-TC-017 rechaza la aceptación después del SLA [TC-047]')`
  - Vitest: `test('S04-TC-052 …')`
  - Cypress: `it('S04-TC-061 …')`
- **Relación con el catálogo base TC-001..TC-140:** si la prueba implementa un caso del catálogo, se agrega `[TC-0xx]` al final. Varias pruebas `SNN-TC` pueden derivar del mismo TC (p. ej., Pest y Cypress de TC-012), cada una con su ID propio. Los casos nuevos no llevan corchete.
- **Familias de la adenda P11-B** (`TC-AD-SNN-CRUD-01/02/03`, `VAL-01/02`, `AUTH-01`): se implementan como `SNN-TC-NNN` y se anota la familia en la descripción, p. ej. `S02-TC-031 VAL-02 tarifa negativa rechazada por la API`.
- **Migración de los IDs actuales:**
  - `TC-002: …` pasa a `S01-TC-0NN … [TC-002]`.
  - `S01-SEC-ADMIN` y `S01-SEC-CSRF` pasan a `S01-TC-0NN`.
  - Se hace en el paso N.1 del cierre de S1 a S3, en un commit `test(sNN)` que solo renombra.
- **Catálogo del sprint:** `docs/documentacion/plan-pruebas-v3/sprint-NN/CATALOGO-SNN.csv`, creado en N.1 con:
  - ID, título, HU, RF/RNF, técnica, herramienta, `[TC-0xx]` de origen, decisión que lo condiciona y resultado esperado.

## 6. Reparto Claude Code / Codex / equipo

| | Claude Code | Codex | Equipo |
|---|---|---|---|
| Responsable de | Backend Laravel, Pest, catálogo de casos, contrato de API, seeders E2E, integración, SonarQube y cierre del sprint | Frontend React, Vitest y Cypress, alertas, accesibilidad | Decisiones P01–P23 y MOD-01, revisión e integración de PR, capturas, informe Word |
| Carpeta | Principal | `..\TecnicoYa-cx` (worktree) | — |
| Rama | `feature/mayhuasca/<módulo>/sNN` | `feature/delgado/<módulo>/sNN` (excepción S0: `codex/s00-frontend`, PR #1) | `feature/pimentel/<módulo>/sNN` para configuración común |
| Slot de pruebas | A: `tecnicoya_testing`, 8001/5174 | B: `tecnicoya_b_testing`, 8002/5175 | — |
| Relevo | `sprints/HANDOFF-claude.md` | `sprints/HANDOFF-codex.md` | `sprints/DECISIONES.md` |

**Paralelismo:** Claude Code publica el **contrato de API** del sprint en N.1. Con él, Codex construye pantallas y Vitest sin esperar al backend, y deja Cypress para cuando el backend del sprint esté integrado.

## 7. Flujo de un sprint (N.1 a N.6)

| Paso | Quién | Qué | Empieza cuando | En paralelo con |
|---|---|---|---|---|
| N.1 | Claude Code | Brechas del sprint; catálogo de ≥ 60 casos (`CATALOGO-SNN.csv`); contrato de API (`plan-pruebas-v3/sprint-NN/CONTRATO-API.md`); decisiones Pxx que bloquean, con dos opciones y recomendación | Terminó (N−1).6 | Codex: (N−1).5 |
| N.2 | Claude Code | Pruebas Pest en **rojo** (commit `test(sNN)`) y evidencia del rojo | Confirmaste N.1 y las decisiones | Codex: N.4 |
| N.3 | Claude Code | Backend en **verde** (commit `feat(sNN)`), cobertura ≥ 70 % del módulo, `pest --mutate` y PR | Terminó N.2 | Codex: N.4 |
| N.4 | Codex | Pantallas y Vitest (rojo → verde), alertas y accesibilidad; PR | Existe el contrato de N.1 | Claude Code: N.2 y N.3 |
| N.5 | Codex | Cypress contra el backend real (slot B) y PR | Integraste el PR de N.3 | Claude Code: (N+1).1 |
| N.6 | Claude Code | Regresión completa (slot A), conteo ≥ 60, SonarQube con Gate, `composer audit` y `npm audit`, evidencias, registro de defectos, `INFORME-SPRINT-NN.md` | Integraste los PR de N.4 y N.5 | — |

## 8. Definición de terminado y evidencias

**DoD** (regla 8 de AGENTS.md y adendas S01–S08):
- alertas de éxito y error en cada CRUD, con prueba automatizada;
- doble validación;
- textos en español;
- confirmación antes de eliminar;
- accesibilidad básica;
- permisos en el servidor, con prueba negativa;
- auditoría de acciones sensibles;
- cobertura ≥ 70 % en el módulo;
- Quality Gate aprobado **sobre el commit integrado**;
- sin vulnerabilidades críticas o altas nuevas;
- evidencias guardadas.

**Evidencias:**

| Qué | Dónde |
|---|---|
| Rojo, verde, cobertura, mutación, Vitest, Cypress, audit | `docs/documentacion/evidencias/sprint-NN/`, cada archivo con fecha y hash |
| Calidad (análisis, Gate, commit) | `docs/documentacion/evidencias/sprint-NN/calidad/`, con el exporte anonimizado por `scripts/exportar-sonar-anonimo.mjs` |
| Defectos | `docs/documentacion/calidad/REGISTRO-DEFECTOS.csv` |
| Avance individual y uso de IA | `docs/avances/<integrante>/sprint-NN/avance.md` (revisor `[PENDIENTE]`) |
| Informe del sprint | `docs/documentacion/sprints/INFORME-SPRINT-NN.md`, con datos para los capítulos 8 y 11 a 14 del Word |

## 9. Conteo y control

**Contador:** `node scripts/contar-pruebas-sprint.mjs` lee los reportes JUnit y muestra, por sprint y herramienta, los IDs aprobados, fallidos y omitidos, y si se llega a 60 (36/14/10).
- Acepta `SNN-TC-NNN` y, durante la transición, `TC-NNN`, cuyo sprint deduce de `Matriz-Trazabilidad-TC.csv`.

**Reportes JUnit:**

| Herramienta | Comando | Reporte |
|---|---|---|
| Pest | `cd backend/api && composer test:junit` | `backend/api/test-results/junit.xml` |
| Vitest | `cd frontend/web && npm test` (reporter JUnit configurado en `vite.config.js` por el PR #1) | `frontend/web/test-results/junit.xml` |
| Cypress | `node scripts/run-e2e.mjs --sprint NN --junit` | `frontend/web/test-results/cypress/*.xml` |

**Control:**
- cobertura ≥ 70 % del módulo (`composer test:coverage`, `npm run test:coverage`);
- `pest --mutate` sobre el módulo del sprint;
- SonarQube en N.6 con `composer test:sonar` (importa Clover; DEF-07).

## 10. Riesgos y decisiones pendientes

| Riesgo | Mitigación |
|---|---|
| Volumen de la meta: 430 pruebas por aprobar y ~340 casos por diseñar | Catálogo de 60 en N.1 con las técnicas del §4; revisar en N.1 que cada caso tenga oráculo distinto |
| Decisiones Pxx sin tomar (26 casos bloqueados o condicionados) | Proponerlas en N.1 con dos opciones; prioridad para S3–S4: P10, P17, P22, P15, P12, P11, P05/P16 |
| Memoria del PC (7,8 GB) | Un contenedor MySQL; un solo Cypress a la vez (bloqueo global); SonarQube solo en N.6 |
| Datos personales en un repositorio que fue público (DEF-17) | `issues.json` retirado; Word retirado; PDF por reemplazar; purga preparada sin ejecutar (D-09) |
| Código histórico activo (DEF-22) | Congelado; retiro en S8 |
| Sin CI (DEF-27) | Definir la plataforma (GitHub Actions o el GitLab del laboratorio) antes de S4 |
| Informe Word sin capítulos 13 y 14 (DEF-33) | `INFORME-SPRINT-NN.md` alimenta los capítulos; el 14 sale del despliegue de S8 |

Decisiones pendientes y propuestas vigentes: [`DECISIONES.md`](../sprints/DECISIONES.md).

## 11. Calendario

Meta académica: **producción y demostración hacia la semana 12** del curso. Las fechas dependen del calendario oficial, que no está en el repositorio.

| Etapa | Duración propuesta | Inicio | Fin |
|---|---|---|---|
| Fase 0 y Fase 1: análisis y puesta en orden (S0) | 2 días | [COMPLETAR] | [COMPLETAR] |
| Cierre de los Sprints 1, 2 y 3 | 1 semana | [COMPLETAR] | [COMPLETAR] |
| Sprint 4 · Matching, notificación, SLA y reasignación | 1,5 semanas | [COMPLETAR] | [COMPLETAR] |
| Sprint 5 · Atención, agenda y seguimiento | 1 semana | [COMPLETAR] | [COMPLETAR] |
| Sprint 6 · Calificación, historial y apelaciones | 1 semana | [COMPLETAR] | [COMPLETAR] |
| Sprint 7 · Panel administrador completo | 1 semana | [COMPLETAR] | [COMPLETAR] |
| Sprint 8 · Pagos simulados, endurecimiento y despliegue | 1 semana | [COMPLETAR] | [COMPLETAR] |
