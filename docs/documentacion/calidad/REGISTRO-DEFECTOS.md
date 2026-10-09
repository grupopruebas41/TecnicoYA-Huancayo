# Registro de defectos · TécnicoYa Huancayo

Fuente de verdad: [REGISTRO-DEFECTOS.csv](REGISTRO-DEFECTOS.csv). Este archivo es su vista legible y debe coincidir con él.

- DEF-01 a DEF-18 vienen del informe Word (capítulo 13).
- DEF-19 a DEF-34 son los NEW-01 a NEW-16 de `analisis-estado/CONTEXTO-COMPLETO-2026-10-09.md`, renumerados en el mismo orden.

Cada defecto se cierra con el commit que lo corrige. Un defecto nuevo se agrega al final con el siguiente número.

**Resumen por estado:** Abierto: 21 · Cerrado: 9 · Duplicado: 3 · Reabierto: 1

| ID | Fecha | Origen | Descripción | Severidad | Acción | Estado | Commit |
|---|---|---|---|---|---|---|---|
| DEF-01 | 2026-10-06 | Informe Word cap. 13 | Auth.jsx importaba auth.css inexistente | Alta | Se creó frontend/web/src/auth.css | Cerrado | — |
| DEF-02 | 2026-10-06 | Informe Word cap. 13 | SESSION_DRIVER=array perdía la sesión entre peticiones | Media | phpunit.xml y el arrancador E2E usan SESSION_DRIVER=database | Cerrado | — |
| DEF-03 | 2026-10-06 | Informe Word cap. 13 | Cypress.env() eliminado en Cypress 16 | Media | Las specs usan cy.env() y Cypress.expose() | Cerrado | — |
| DEF-04 | 2026-10-06 | Informe Word cap. 13 | Espera vencida en Electron al recargar el portal del cliente | Media | E2E en Chrome con tiempos de espera ampliados | Cerrado | — |
| DEF-05 | 2026-10-06 | Informe Word cap. 13 | Contenedor del scanner SonarQube con exec format error | Baja | Scanner CLI nativo 8.1 en Windows | Cerrado | — |
| DEF-06 | 2026-10-06 | Informe Word cap. 13 | GET /api/v1/technicians/{id} respondía 404 | Alta | Perfil público implementado (TC-034) | Cerrado | 7e97432 |
| DEF-07 | 2026-10-06 | Informe Word cap. 13; CONTEXTO-COMPLETO §7.d | SonarQube con cobertura importada 0 %: el único análisis (8997de8) no importó Clover y su Gate no evaluó condiciones | Baja | Reabierto: analizar el commit integrado con test:sonar y Gate con condiciones | Reabierto | — |
| DEF-08 | 2026-10-06 | SonarQube javascript:S9011 | 7 botones dentro de formularios sin type | Media | Pendiente (frontend: Codex) | Abierto | — |
| DEF-09 | 2026-10-06 | SonarQube | Complejidad cognitiva alta | Media | Pendiente | Abierto | — |
| DEF-10 | 2026-10-06 | SonarQube | Regex del correo en forms.jsx:18 con posible retroceso superlineal | Media | Pendiente (frontend: Codex) | Abierto | — |
| DEF-11 | 2026-10-06 | composer audit | 3 avisos: laravel/framework < 12.69 (bajo) y league/commonmark <= 2.10.1 (alto y medio) | Alta | Actualizar sin -W | Abierto | — |
| DEF-12 | 2026-10-06 | Auditoría | Motor de BD inconsistente: pruebas en MySQL 8.4; compose; .env.example; config/database.php y Dockerfile de la API en PostgreSQL | Alta | Unificar MySQL 8.4 | Abierto | — |
| DEF-13 | 2026-10-06 | Auditoría | Contenedores como root (matching y web; la API ya usaba www-data) | Media | Usuario no root en los Dockerfile | Abierto | — |
| DEF-14 | 2026-10-06 | Auditoría | firebase/php-jwt declarado y sin uso | Baja | Retirar la dependencia | Abierto | — |
| DEF-15 | 2026-10-06 | Auditoría | Commits de los Sprints 1 a 3 sin publicar | Media | Se publicaron al renombrar codex/sprint-01 a main (sin PR) | Cerrado | d361c63 |
| DEF-16 | 2026-10-06 | Auditoría | Matriz de trazabilidad sin registrar los casos de S2 y S3 que pasan | Baja | Actualizar Matriz-Trazabilidad-TC.csv | Abierto | — |
| DEF-17 | 2026-10-06 | Auditoría | Datos personales publicados en el repositorio público (correo en sonar/issues.json; códigos de alumno en un PDF y un Word) | Alta | Retirar del árbol; preparar purga del historial | Abierto | — |
| DEF-18 | 2026-10-06 | npm audit | 7 vulnerabilidades npm (2 críticas; 2 altas; 3 moderadas) en herramientas de desarrollo | Alta | Pendiente (frontend: Codex) | Abierto | — |
| DEF-19 | 2026-10-09 | CONTEXTO-COMPLETO NEW-01 | Arrancador E2E terminaba con 0xC000001D; la causa era ELECTRON_RUN_AS_NODE=1 heredada de VS Code (no PHP) | Alta | run-e2e.mjs retira la variable; diagnóstico en DIAGNOSTICO-E2E-2026-10-09.md | Cerrado | fa6de02 |
| DEF-20 | 2026-10-09 | CONTEXTO-COMPLETO NEW-02 | Códigos de alumno en fuentes/proyecto-final.pdf e informe-final/*.docx | Alta | Se trata dentro de DEF-17 | Duplicado de DEF-17 | — |
| DEF-21 | 2026-10-09 | CONTEXTO-COMPLETO NEW-03 | Un solo análisis SonarQube (S1); código de S2 y S3 nunca analizado | Alta | Se trata dentro de DEF-07 | Duplicado de DEF-07 | — |
| DEF-22 | 2026-10-09 | CONTEXTO-COMPLETO NEW-04 | Código histórico activo: /api/* con token; demo; marketplace:tick cada segundo; marketplace:admin sin auditoría | Media | Retiro previsto en el Sprint 8 | Abierto | — |
| DEF-23 | 2026-10-09 | CONTEXTO-COMPLETO NEW-05 | Matriz de trazabilidad desactualizada (27 casos) | Media | Se trata dentro de DEF-16 | Duplicado de DEF-16 | — |
| DEF-24 | 2026-10-09 | CONTEXTO-COMPLETO NEW-06 | Sin pantallas v1 para S2 y S3 | Alta | Cierre de S2 y S3 (Codex) | Abierto | — |
| DEF-25 | 2026-10-09 | CONTEXTO-COMPLETO NEW-07 | 0 pruebas Vitest sobre código v1; las 38 son del prototipo | Media | Cierre de S1 a S3 (Codex) | Abierto | — |
| DEF-26 | 2026-10-09 | CONTEXTO-COMPLETO NEW-08 | rules.json fija valores pendientes de P15 y 5 zonas frente a 3 de P03 | Media | Bloqueado por las decisiones P03 y P15 | Abierto | — |
| DEF-27 | 2026-10-09 | CONTEXTO-COMPLETO NEW-09 | Sin CI efectiva (sin workflows; .gitlab-ci.yml apunta a otro GitLab) | Alta | Pendiente | Abierto | — |
| DEF-28 | 2026-10-09 | CONTEXTO-COMPLETO NEW-10 | Un solo autor; sin PR; sin docs/avances; protección de main no verificada | Alta | En curso: ramas feature y PR desde s00 | Abierto | — |
| DEF-29 | 2026-10-09 | CONTEXTO-COMPLETO NEW-11 | Rutas GET/PUT storage/{path} expuestas por filesystems.local.serve | Baja | Revisar si se usan | Abierto | — |
| DEF-30 | 2026-10-09 | CONTEXTO-COMPLETO NEW-12 | Archivos pesados o duplicados versionados (video en la raíz; A04=A03; A16=A15) | Baja | Pendiente | Abierto | — |
| DEF-31 | 2026-10-09 | CONTEXTO-COMPLETO NEW-13 | Carpeta vacía backend/api/frontend/web/cypress/e2e/sprint-01 | Baja | No está versionada (Git no guarda carpetas vacías); es un resto local | Cerrado | — |
| DEF-32 | 2026-10-09 | CONTEXTO-COMPLETO NEW-14 | docs/documentacion/README.md y sprints/S01..S04 describen el plan obsoleto | Media | Marcar como histórico | Abierto | — |
| DEF-33 | 2026-10-09 | CONTEXTO-COMPLETO NEW-15 | Informe Word sin capítulos 13 y 14 en su versión más reciente | Alta | Completar con los informes de sprint | Abierto | — |
| DEF-34 | 2026-10-09 | CONTEXTO-COMPLETO NEW-16 | contar-casos-tc.php sobrescribe test-results/junit.xml; no hay contador por sprint | Baja | Pendiente (contar-pruebas-sprint.mjs) | Abierto | — |
