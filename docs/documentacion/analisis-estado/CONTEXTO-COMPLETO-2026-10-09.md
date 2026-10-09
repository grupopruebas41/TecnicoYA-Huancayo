# Contexto completo del proyecto TécnicoYa Huancayo (9 de octubre de 2026)

**Tipo:** auditoría técnica de solo lectura, preparada para un asistente que **no** tiene acceso a la carpeta.
**Raíz auditada:** `C:\Users\<usuario>\Documents\ChatGPT\Software TecnicoYa-Huancayo` (rama `main`, commit `d361c63`).
**Hora de las mediciones:** 9 de octubre de 2026, entre 01:40 y 02:30 (hora de Lima, UTC−5).

**Etiquetas usadas en todo el informe**

- **[VERIFICADO]**: comprobado hoy con un comando o leyendo el archivo.
- **[DOCUMENTADO]**: lo afirma un documento del proyecto; no se comprobó hoy.
- **[NO VERIFICABLE]**: no se puede comprobar desde este equipo o sin credenciales.
- **[OCULTO]**: dato sensible; se da la ruta y, si se conoce, la línea, nunca el valor.

**Reglas que se respetaron**

- No se modificó, movió ni borró ningún archivo existente. `git status` es idéntico antes y después. Los artefactos `backend/api/.phpunit.result.cache`, `test-results/clover.xml` y `test-results/junit.xml` conservan su fecha anterior.
- No se abrieron `.env`, `.env.testing`, `.env.quality.local` ni `sonar/issues.json`.
- No se instaló nada, no se migró la base de desarrollo y no se tocó el MySQL de XAMPP.
- Para usar el contenedor de pruebas autorizado hubo que **arrancar Docker Desktop**, que estaba detenido. El contenedor `tecnicoya-mysql-test` se levantó y al final se bajó con `down`, que conserva el volumen.
- El arrancador E2E ejecutó `migrate` y `db:seed` sobre la base aislada `tecnicoya_testing`. Es lo que hace ese script sin cambios, y no hubo migraciones pendientes.
- pytest se ejecutó sin caché (`-p no:cacheprovider`, `PYTHONDONTWRITEBYTECODE=1`) y la cobertura de Pest se mostró solo por pantalla, para no sobrescribir archivos.
- Se hizo una única consulta anónima de lectura a la API pública de GitHub para saber si el repositorio es público.
- El único archivo nuevo es este informe. Sin commit ni push.

---

## Índice

1. [Git](#1-git)
2. [Documentos e indicaciones](#2-documentos-e-indicaciones)
   - 2.a [Inventario de documentos](#2a-inventario-de-documentos)
   - 2.b [Indicaciones del docente](#2b-indicaciones-del-docente)
   - 2.c [Decisiones de negocio P01 a P23](#2c-decisiones-de-negocio-p01-a-p23)
3. [Plan de sprints vigente](#3-plan-de-sprints-vigente)
4. [Backend](#4-backend-backendapi)
5. [Frontend](#5-frontend-frontendweb)
6. [Servicio Python y reglas](#6-servicio-python-y-reglas)
7. [Pruebas](#7-pruebas)
8. [Avance real de S1, S2 y S3](#8-avance-real-de-s1-s2-y-s3)
9. [Defectos y deuda](#9-defectos-y-deuda)
10. [Entorno del PC](#10-entorno-del-pc)
11. [Resumen para planificar](#11-resumen-para-planificar)

---

## 1. Git

### 1.1 Ramas, remoto y worktrees [VERIFICADO]

| Elemento | Valor |
|---|---|
| Rama actual | `main` en `d361c63` |
| Ramas locales | solo `main` |
| Ramas remotas | `origin/main` en `d361c63`; `origin/HEAD` apunta a `origin/main` |
| Commits sin subir | 0 (`main` = `origin/main`) |
| Remoto | `origin` → `https://github.com/grupopruebas41/TecnicoYA-Huancayo.git` |
| Visibilidad del repositorio | **Público** (`"visibility": "public"`; último push 2026-10-07 00:47 UTC), según la API pública de GitHub |
| Worktrees | uno solo, la carpeta principal |
| Protección de `main` en GitHub | [NO VERIFICABLE]: `gh` no está instalado y sin credenciales no se puede consultar |
| CI en GitHub | No existe la carpeta `.github/` ni hay workflows |
| CI en GitLab | `.gitlab-ci.yml` solo incluye `root/laboratorio-devops:/gitlab/student-pipeline.yml`; el remoto no es GitLab y no hay evidencia de que se haya ejecutado |
| `AGENTS.md`, `CLAUDE.md` y `docs/avances/` | No encontrados en la raíz ni en `docs/` |

**Historia de la rama [DOCUMENTADO en ESTADO-REAL-2026-10-07 §1.1, a partir del reflog]:** la rama `codex/sprint-01` se **renombró** a `main` el 06-10 a las 19:44 y se publicó en este repositorio. El trabajo de los Sprints 1 a 3 llegó a `main` sin Pull Request ni revisión.

### 1.2 Últimos commits [VERIFICADO]

El repositorio tiene **35 commits**, todos del autor git `James091104`. No hay commits de los otros dos integrantes.

| # | Hash | Fecha | Mensaje |
|---|---|---|---|
| 1 | d361c63 | 2026-10-06 | Primer commit - TecnicoYa-Huancayo *(solo añade `sonar/issues.json`; ver 9.1, DEF-17)* |
| 2 | 7e97432 | 2026-10-06 | feat(sprint03): perfil público del técnico sin datos privados |
| 3 | c3c5303 | 2026-10-06 | test(sprint03): agrega pruebas Pest del lote 2 del Sprint 3 (TC-034, 127, 129) |
| 4 | 82e1ed5 | 2026-10-06 | feat(sprint03): API de solicitudes en cinco pasos con evidencias y envío idempotente |
| 5 | ca48ec7 | 2026-10-06 | feat(sprint03): agrega service_requests, adjuntos, eventos e idempotencia |
| 6 | db9c9bb | 2026-10-06 | test(sprint03): agrega 12 pruebas Pest del lote 1 del Sprint 3 en rojo |
| 7 | 57c30cf | 2026-10-06 | feat(sprint02): disponibilidad, servicios con versión de tarifa, portafolio y revisión técnica |
| 8 | 3eb81a5 | 2026-10-06 | feat(sprint02): catálogo administrativo, comunicados por audiencia y acceso a archivos |
| 9 | c412099 | 2026-10-06 | feat(sprint02): agrega migraciones, modelos y permisos del Sprint 2 |
| 10 | 98fadce | 2026-10-06 | test(sprint02): agrega 12 pruebas Pest del Sprint 2 en rojo |
| 11 | 91242a4 | 2026-10-06 | ci: importa en SonarQube la cobertura de Pest medida con PCOV |
| 12 | 651960e | 2026-10-06 | docs: registra las alertas reales del Sprint 1 (registro, login y perfil) |
| 13 | 70c21ea | 2026-10-06 | docs: registra la ejecución del Sprint 1 en la matriz de trazabilidad |
| 14 | 6d8ba1b | 2026-10-06 | ci: versiona la configuración de calidad SonarQube del Sprint 1 |
| 15 | f636ce5 | 2026-10-06 | test: agrega scripts/contar-casos-tc.php para medir la meta de 60 IDs Pest |
| 16 | 8997de8 | 2026-10-06 | test(sprint01): verifica registros portales catalogo y seguridad con Cypress real |
| 17 | 65aa952 | 2026-10-06 | feat(sprint01): conecta registro login perfil y catalogo con la API Sanctum |
| 18 | 96fb93e | 2026-10-06 | feat(sprint01): agrega aprovisionamiento administrativo auditado por consola |
| 19 | df49da3 | 2026-10-06 | feat(sprint01): completa mensajes en español y registra resultados de pruebas |
| 20 | 6bf6a56 | 2026-10-06 | feat(sprint01): aplica cuenta activa y permisos efectivos con auditoría |
| 21 | 040cbf1 | 2026-10-06 | feat(sprint01): permite edición de perfil propio con control de versión |
| 22 | fb8c87d | 2026-10-06 | feat(sprint01): incorpora Sanctum y autenticación SPA versionada |
| 23 | f7cc011 | 2026-10-06 | feat(sprint01): completa migraciones y semillas de autorización y catálogo |
| 24 | 389643c | 2026-10-06 | docs: corrige §15.2 del plan de pruebas según la matriz CSV |
| 25 | c74b1ef | 2026-10-06 | test: agrega pruebas Pest del Sprint 1 (TC-002 a TC-011 y TC-137) |
| 26 | 1e73beb | 2026-10-06 | test: agrega MySQL 8.4 en Docker para las pruebas |
| 27 | 294fd5b | 2026-10-06 | test: configura entorno de pruebas (Pest, Cypress, base MySQL de pruebas) |
| 28 | 10d6c51 | 2026-10-06 | docs: formaliza reglas de negocio, plan de pruebas v2, Módulo A y matriz de cobertura RF/RNF |
| 29 | 781900b | 2026-10-06 | *(mismo mensaje que el 28)* |
| 30 | 04c3e2d | 2026-10-05 | Agrega fuentes y artículos |
| 31 | ed41073 | 2026-10-05 | Agrega documentación (sin fuentes) |
| 32 | 7d71e05 | 2026-10-05 | Agrega medios del frontend |
| 33 | c4281e7 | 2026-10-05 | Actualiza frontend (src) |
| 34 | bcbaff2 | 2026-10-05 | Actualiza backend, base de datos, dominio y scripts |
| 35 | 86862f5 | 2026-09-22 | Commit inicial del nuevo proyecto |

Las migraciones de los Sprints 2 y 3 se llaman `2026_10_07_*`, pero se confirmaron el 06-10. Es solo el prefijo del nombre; no afecta al funcionamiento.

### 1.3 Archivos sin commit [VERIFICADO]

| Estado | Archivo | Qué contiene |
|---|---|---|
| Modificado | `docs/documentacion/evidencias/sprint-01/continuacion/INFORME.md` (+7 −3) | Registra la fila «Calidad» con gate `PASSED`, Pest 35/312 en la verificación de calidad y un párrafo sobre la evidencia de pipeline GitLab pendiente |
| Nuevo | `docs/documentacion/analisis-estado/` | `ESTADO-REAL-2026-10-07.md` (auditoría anterior, 71,7 kB) y este informe |
| Nuevo | `.../continuacion/sprint01-next-4-pest.txt` | Salida de Pest del 06-10 |
| Nuevo | `.../continuacion/sprint01-next-4-sonar-analysis.txt` | Salida del scanner. **Es idéntica** a `tmp/sprint01-next-4-sonar-analysis.txt` y corresponde al **único** análisis registrado (06-10 15:31, revisión `8997de8`) |
| Nuevo | `.../continuacion/sprint01-next-4-sonar-summary.txt` | Gate y medidas de ese mismo análisis |
| Nuevo | `.../continuacion/sprint01-next-4-vitest.txt` | Salida de Vitest del 06-10 |

**Corrección a la auditoría del 07-10:** aquella hablaba de «dos análisis SonarQube». `sonar/analyses.json` registra **un solo análisis** (`total: 1`, 2026-10-06T20:31:08Z, revisión `8997de8`). Los archivos `next-4-sonar-*` son la salida de ese análisis guardada más tarde, no un análisis posterior [VERIFICADO].

### 1.4 Archivos pesados y datos personales versionados [VERIFICADO]

**Tamaño:** `.git` ocupa 150 MB (paquete 148,55 MiB); hay 1091 archivos versionados.

| Archivo | Tamaño | Observación |
|---|---:|---|
| `public/media/nadiria-background.mp4` | 12,7 MB | Landing estática histórica (`public/`) |
| `habitación typing.mp4` (raíz) | 7,1 MB | Duplicado byte a byte de `frontend/web/public/media/habitacion.mp4`; sin uso documentado en la raíz |
| `frontend/web/public/media/habitacion.mp4` | 7,1 MB | Video del hero |
| `docs/documentacion/fuentes/articulos/A12.pdf` y otros artículos | 2,5–3,9 MB cada uno | 32 PDF; A04 duplica a A03 y A16 duplica a A15 |
| `docs/documentacion/fuentes/proyecto-final.pdf` | 3,3 MB | **Contiene códigos de alumno** [OCULTO] en la portada |
| PNG de subcategorías en `frontend/web/public/media/services/subcategorias/**` | 2,2–2,6 MB cada uno | Sin optimizar |

**Datos personales en archivos versionados de un repositorio público:**

| Ruta | Dato | Valor |
|---|---|---|
| `docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json` (commit `d361c63`) | Correo institucional personal, 114 apariciones [DOCUMENTADO en la auditoría del 07-10; el archivo no se abrió] | [OCULTO] |
| `docs/documentacion/fuentes/proyecto-final.pdf` (portada) | 3 códigos de alumno [VERIFICADO por conteo de patrón] | [OCULTO] |
| `docs/documentacion/informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx` | 3 números de 8–10 dígitos junto a la palabra «CÓDIGO»; casi seguro son códigos de alumno [VERIFICADO por conteo de patrón] | [OCULTO] |
| `backend/api/phpunit.xml:10` | `APP_KEY` de pruebas (sintética) | [OCULTO] |

Fuera de esos archivos no hay correos reales en el código ni en la documentación versionada. Solo aparecen dominios de prueba (`example.test`, `test.pe`), el marcador `tu-dominio.pe` en `REPRODUCIR.md:53` y los correos de autores de paquetes dentro de `composer.lock` y `package-lock.json`, que no son datos del equipo.

---

## 2. Documentos e indicaciones

### 2.a Inventario de documentos

**Regla de vigencia.** Es **vigente** la línea del 04 al 06-10: CANVAS en `editables/`, MySQL 8.4, Sanctum, 8 sprints, catálogo TC-001 a TC-140 y adendas. Es **histórica** la colección v2.0 del 29-09 (PDF 01 a 17) y lo anterior. El propio `CANVAS-Plan-Sprints-01-08.md` dice que «sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen» [VERIFICADO].

#### PDF 01 a 17 (raíz de `docs/documentacion/`, versión 2.0 del 29-09-2026) [VERIFICADO por lectura de las primeras páginas]

Todos llevan la nota «Implementado significa observado en código… Las iteraciones son planes de trabajo, no actas ejecutadas». Describen el **prototipo histórico**: PostgreSQL, token propio, FastAPI y API `/api/*`.

| PDF | Págs. | Contenido | Vigencia |
|---|---:|---|---|
| 01 Análisis del MVP y sustento científico | 19 | Propósito, problema y alcance; fichas de los 30 artículos (A01–A32) con método, hallazgo y limitación | **Histórico en arquitectura**; las fichas bibliográficas siguen siendo útiles |
| 02 Análisis matching y asistencia | 4 | Principio rector del matching y del asistente | Histórico |
| 03 Backlog técnico de implementación | 11 | **10 iteraciones** (I01–I10) como paquetes; I06, I07 e I09 son extensiones condicionadas (asistente, LLM y pagos) | **Histórico**: lo sustituyen los 8 sprints |
| 04 Diccionario de datos físico PostgreSQL | 9 | Describe 3 migraciones del prototipo; «no es un esquema MySQL» | **Histórico**: lo sustituye `CANVAS-Diccionario-Datos-MySQL` |
| 05 Diccionario conceptual y contratos | 4 | Conceptos, propietario y reglas de datos | Parcialmente útil (conceptos) |
| 06 Diseño técnico: React, Laravel, FastAPI, PostgreSQL | 4 | Componentes y límites | **Histórico**: lo sustituye `CANVAS-Diseno-Tecnico-MVP` |
| 07 Diseño técnico: integración, servidor y pruebas | 4 | API `/api/health`, `/api/register`, `/api/login` con Bearer; plan transversal de pruebas | **Histórico** (API v0) |
| 08 Iteración 1: base de datos | 3 | Esquema real e integridad en PostgreSQL | Histórico |
| 09 Iteración 2: autenticación, roles y aislamiento | 3 | Registro, login y revocación con token propio | Histórico |
| 10 Iteración 3: habilitación y condiciones | 3 | Habilitación, disponibilidad, tarifa y cobertura | Histórico |
| 11 Iteración 4: matching, disponibilidad y solicitudes | 3 | Algoritmo y ciclo del prototipo | Histórico |
| 12 Iteración 5: frontend técnico y administrador | 3 | Paneles y anuncios de la demo | Histórico |
| 13 Iteración 6: asistente determinista sin LLM | 3 | Ampliación propuesta, no implementada | **Histórico y fuera de alcance** |
| 14 Iteración 7: LLM opcional | 3 | Experimento propuesto, no aprobado | **Histórico y fuera de alcance** (el plan vigente excluye chat y LLM) |
| 15 Iteración 8: frontend cliente y flujo integral | 3 | E2E del flujo de la demo | Histórico |
| 16 Iteración 9: pagos y operación productiva | 3 | Cobro verificable condicionado | Histórico (el plan vigente solo admite pagos **simulados**, S8) |
| 17 Iteración 10: seguridad, calidad y despliegue | 4 | Carga, PostgreSQL real, restauración | Histórico (sus controles pasan a S8) |

`docs/documentacion/README.md` y `catalogo-pdfs.json` son el índice de esta colección v2.0. El README afirma que «no se migró a MySQL», lo que es falso para la línea vigente.

#### Otras carpetas de `docs/documentacion/`

| Carpeta o archivo | Contenido | Vigencia |
|---|---|---|
| `informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx` | Informe Word con capítulos 1 a 13 (91 063 caracteres; **sin DEF-xx**). Contiene códigos de alumno [OCULTO] | Versión del repositorio; **no es la más reciente** (ver 2.b) |
| `informe-final/contenido-editable.md` y `evidencias-2026-09-30/` | Texto editable y evidencias del 30-09 (`phpunit.xml`, `pytest.xml`, `vitest.json`, `python-coverage.json`, `codigo-sha256.json`) | Histórico (prototipo) |
| `fuentes/articulos/A01–A32.pdf` + `manifest.json` | Corpus de 32 PDF (30 distintos) con SHA-256 | Vigente como bibliografía. **No hay artículo de IA y Scrum** (pendiente de la adenda P8) |
| `fuentes/proyecto-final.pdf` | Proyecto final original (Laravel, React y **MySQL**; RF-01..33). Contiene códigos de alumno [OCULTO] | Fuente vigente del alcance |
| `fuentes/plan-de-pruebas-original.pdf` | Plan de pruebas v1.0 del 07-09 (33 RF, 14 RNF; calendario 07-09 a 27-09) | Histórico |
| `fuentes/estado-del-arte-original.pdf` | Trabajo de investigación original (12 antecedentes) | Vigente como fuente |
| `fuentes/ejemplos-practica.docx` | Ejemplo de organización entregado | Referencia |
| `estado-del-arte/README.md` | Enlaza el original y `trazabilidad/estado-del-arte.csv` | Vigente |
| `diseno-tecnico/README.md` | Apunta a `TECNICOYA.md`, `python/api/app.py` y a PostgreSQL | **Histórico** |
| `plan-de-pruebas/Plan-de-Pruebas-TecnicoYa-v1.1-consolidado.pdf` y `Complemento-Scrum-pruebas-v1.1.pdf` | v1.1 del 22-09; Laravel, **PostgreSQL** y FastAPI | **Histórico**: lo sustituye `editables/PLAN-DE-PRUEBAS-TecnicoYa-v2.md` |
| `sprints/S01..S04/README.md` | Plantillas vacías («propuesto, no ejecutado»; S02 = «Solicitud y matching», S03 = «Ofertas y ejecución», S04 = «Calificación y administración») | **Histórico y contradictorio** con los 8 sprints |
| `trazabilidad/*.csv` | `decisiones.csv` (DP-01..18, otra numeración distinta de Pxx), `requisitos-funcionales.csv`, `requisitos-no-funcionales.csv`, `estado-del-arte.csv`, `v2/articulos.csv` (30 filas) | Histórico, salvo `v2/articulos.csv` |
| `historico/v1-previa-2026-09-29/` | 12 PDF temáticos + S01–S04 informes de sprint (v1) | Histórico declarado |
| `evidencias/v2/I01..I10/README.md` | «PLANIFICADA / NO EJECUTADA» | Histórico |
| `evidencias/sprint-01/`, `sprint-02/`, `sprint-03/` | Salidas reales de Pest (rojo y verde), Cypress, Vitest y SonarQube del 06-10 | **Vigente** (evidencia real) |
| `evidencias/revision-2026-09-22/` | Build y pruebas del frontend del 22-09 | Histórico |
| `analisis-estado/` | Auditoría del 07-10 y este informe | Vigente |

#### `docs/documentacion/editables/` (línea vigente) [VERIFICADO]

| Documento | Fecha | Contenido |
|---|---|---|
| `CANVAS-Analisis-MVP-TecnicoYa.md` | 04-10 | Análisis vigente: actores, estados, relojes, 32 HU (HU-01..HU-32), reglas y **pendientes P01..P23** (§ línea 726) |
| `CANVAS-Resumen-Ejecutivo-MVP-TecnicoYa.md` | 04-10 | Resumen; menciona demostración «hacia la semana 12» |
| `CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md` | 04-10 | Arquitectura objetivo: React, Laravel, MySQL, Sanctum, Reverb/Echo, colas MySQL; módulos A–F |
| `CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md` (+ JSON, SQL de referencia, anexos) | 04-10 | Diccionario MySQL 8.4/InnoDB del modelo v1 |
| `CANVAS-Diagramas-ER`, `CANVAS-Clases-Dominio`, `CANVAS-Casos-Uso-General`, `CANVAS-Secuencia-01`, `CANVAS-Flujo-Negocio`, `CANVAS-Flujo-Tecnico-Aplicativo` (+ `.puml`, `.mmd`, `.svg`) | 04–05-10 | Diagramas UML y E-R propuestos |
| `CANVAS-Estructura-Carpetas-TecnicoYa.md` | 05-10 | Estructura objetivo (`app/Modules/A..F`, `src/features/*`) |
| `CANVAS-Backlog-Tecnico-Implementacion-TecnicoYa.md` + `backlog-tecnico/*.csv/json` | 05-10 | Backlog de 59 HU y tareas (671 puntos, que la adenda manda refinar) |
| `CANVAS-Iteracion-00-Guia-Manual-TecnicoYa.md` + `iteracion-00/` | 05-10 | Guía de I0 y plantillas; `VALIDACION-DE-LA-ENTREGA.md` dice que la instalación **no se ejecutó** en esa validación |
| `GUIA-MANUAL-SPRINT-01-TecnicoYa.md` + `sprint-01-manual/` | 05-10 | Guía manual de S1 |
| `REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md` + `reglas-negocio/` | 05-10 | Reglas RN-xx, semántica temporal, fórmula de matching y pseudocódigo |
| `REGLAS-DE-PROGRAMACION-TecnicoYa.md` | 05-10 | Reglas de código; las amplía la adenda P11-B |
| `PLAN-DE-PRUEBAS-TecnicoYa-v2.md` (PP-TY-02) | 05-10 | Plan vigente: meta «**al menos 60 casos distintos automatizados en Pest, aprobados**» (§1 y §14) |
| `plan-pruebas-v2/` | 05–06-10 | `CATALOGO-TC.md`, `Matriz-Trazabilidad-TC.csv` (**TC-001..TC-140**), `Matriz-RF-RNF-Cobertura`, Módulo A (TC-119..135), plantillas de alertas y resultados |
| `sprints-01-08/` | 05-10 | Plan de 8 sprints (ver Sección 3), `Plan-Sprints-01-08.json`, `Catalogo-TC-Sprints-01-08.csv` (**TC-001..TC-118**), `Trazabilidad-Sprints-01-08.csv`, 8 `.feature` (118 escenarios) |
| `adendas-docente-2026-10-05/` | 05-10 | 13 adendas (ver 2.b) |
| `v2/` | 29-09 | JSON fuente de la colección PDF histórica |

#### Documentos en `docs/` (fuera de `documentacion/`)

`TECNICOYA.md`, `ACCESOS-Y-PERMISOS.md`, `ANUNCIOS.md`, `SUBCATEGORIAS.md`, `SCROLL-SEQUENCE.md`, `CONTEXTO-Y-TRAZABILIDAD.md` y `README.md` documentan el **prototipo histórico**: centro de anuncios de la demo, matching por subcategorías, etc. `docs/legacy/` guarda implementaciones antiguas (SQL, Express y un asistente en Python). **Todo esto es histórico.**

#### Documentos externos relevantes (en `C:\Users\<usuario>\Downloads`) [VERIFICADO]

| Archivo | Fecha | Contenido |
|---|---|---|
| `Prompts_TecnicoYa_ClaudeCode_Codex.docx` | 09-10 01:37 | Documento de prompts del otro asistente, del que sale este encargo. Fija la meta de **60 pruebas o más por sprint (36 Pest, 14 Cypress y 10 Vitest)**, el formato de ID `SNN-TC-NNN`, slots A (3306/8001/5174) y B (3307/8002/5175) y el reparto Claude Code (backend) / Codex (frontend). Cita DEF-08, 10, 11, 12, 13, 14, 17 y 18 |
| `Proyecto_TecnicoYa.docx` | 08-10 22:56 | Informe Word más reciente: capítulos **1 a 12** (el 12 con 12.1–12.4). **No tiene capítulos 13 ni 14** |
| `Proyecto_final_TecnicoYa_Cap1-13.docx` y copias `(1)` y `(2)` | 04-10 | Capítulos 1 a 13. La tabla 54 del capítulo 13.2.2 trae las filas **DEF-01 a DEF-04 vacías** (plantilla `[Descripción]`) |
| `Plantilla Estructura de proyecto final (4) (2).docx` | 05-10 | Plantilla del docente (14 capítulos; ver 2.b) |
| `Proyecto_TecnicoYa_Capitulos_1_al_8.docx` | 06-10 | Versión anterior (PostgreSQL, I0 + S01..S05, TC-01..) |

### 2.b Indicaciones del docente

#### Las 13 adendas (`editables/adendas-docente-2026-10-05/`, 05-10) [VERIFICADO]

Las adendas **no cambian reglas de negocio, HU ni el orden de los 8 sprints**. Sí añaden criterios transversales, tareas y la DoD. Todas las casillas siguen **sin marcar** («NO EJECUTADO»).

**Control común a las 8 adendas de sprint (§10 DoD):**

1. Los CRUD del sprint muestran alertas de éxito y error en español y tienen **prueba automatizada**.
2. Hay confirmación previa donde se permite eliminar; si se cancela, no se envía la petición.
3. Hay **doble validación**: React y Laravel. Si se elude React, Laravel rechaza sin escritura parcial.
4. Ante un resultado de red incierto, se recupera el estado antes de afirmar éxito o fracaso.
5. El **Quality Gate de SonarQube está aprobado sobre el commit integrado del sprint**; un gate de otro commit no cuenta.
6. Las evidencias se enlazan desde `docs/avances/<integrante>/sprint-NN/avance.md` y el acta del sprint.

**Familias de casos nuevas por sprint (P11-B, RP-AD-04):** `TC-AD-SNN-CRUD-01/02/03`, `TC-AD-SNN-VAL-01/02` y `TC-AD-SNN-AUTH-01`, instanciadas por recurso y acción. Cypress verifica lo visible; Pest verifica validación, autorización y persistencia. Un mock **no** acredita la validación real. Rutas de evidencia: `evidencias/sprint-NN/TC-AD-…/` y `evidencias/sprint-NN/calidad/`.

| Adenda | Control específico que exige |
|---|---|
| **P2 Diseño técnico** | Derivar el diseño desde el estado del arte (necesidad → decisión, DT-01..09) y documentar, sin implementar, la arquitectura futura |
| **P7 UML** | Respaldar cada diagrama UML con artículo, autor, año y página. Casos de uso respaldados por A27 (Rathod et al., 2025); componentes, solo si se acepta la tesis A30 (Bejarano Gavilanes, 2022). E-R y flujos no cuentan como UML |
| **P8 Iteraciones Scrum** | Ciclo por historia: refinamiento → planning → BDD → construcción vertical → verificación continua (Pest, Cypress, alertas y Gate) → review → retro. Registrar el uso de IA (herramienta, fecha, qué se aceptó y quién revisó). **Pendiente:** el artículo de IA y Scrum no está en el corpus |
| **P10 Estructura y equipo** | Crear `docs/avances/{delgado,mayhuasca,pimentel}/sprint-NN/avance.md` y ramas `feature/<integrante>/<modulo>` (slugs `a-solicitudes` … `f-administracion`) con PR, revisión cruzada y Gate. **Pendiente:** la asignación de los módulos A–F a cada integrante |
| **P11-B Programación** | RP-AD-01 mensajes obligatorios; RP-AD-02 validación en cliente y servidor; RP-AD-03 SonarQube por sprint y por PR, con la política del Gate versionada antes del primer merge; RP-AD-04 las familias TC-AD |
| **S01** | Registro de cliente y técnico y edición del perfil propio. Ejemplos: correo duplicado rechazado sin perfil parcial; edición de campos privilegiados denegada |
| **S02** | Catálogo, comunicados, verificación, portafolio, disponibilidad, zonas, pausas y tarifas. Ejemplos: cancelar la eliminación de un comunicado no llama a la API; desactivar una subcategoría conserva el historial; tarifa inválida rechazada en React y en Laravel |
| **S03** | Solicitud de 5 pasos, evidencias y envío automático o dirigido (la búsqueda es solo lectura). Ejemplos: un paso incompleto no avanza; un envío válido crea una única solicitud |
| **S04** | Aceptar o rechazar ofertas y confirmar la elección. Ejemplos: oferta vencida rechazada aunque la UI muestre tiempo; dos clientes no obtienen asignaciones incompatibles |
| **S05** | Inicio y fin, reprogramación, técnico adicional, cancelación e incidencias. Cancelar cambia el estado, no borra |
| **S06** | Calificación 1–5, edición en plazo, respuesta, apelación y resolución. Ejemplos: 0 y 6 rechazados; edición fuera de plazo sin nueva versión |
| **S07** | Reasignación manual, bloqueos, soporte, reglas y administradores. Ejemplos: pesos que no suman 100 % rechazados; bloqueo sin permiso denegado. Gate aprobado antes de aceptar el panel |
| **S08** | Pago simulado (mensaje inequívoco de simulación), preferencias y tickets. Gate final y regresión **sobre el commit desplegado** |

#### Plantilla del informe [VERIFICADO leyendo los estilos de título de la plantilla]

`Plantilla Estructura de proyecto final (4) (2).docx` exige portada, contenido general, **14 capítulos**, conclusiones, recomendaciones, referencias y anexos. **Sí pide un capítulo 14.**

1. Información general (resumen ejecutivo, introducción).
2. Contexto organizacional y análisis del problema.
3. Análisis de procesos de negocio (AS-IS, problemas, TO-BE).
4. Análisis de requerimientos (actores, RF, RNF, casos de uso).
5. Planificación y plan de calidad (alcance, herramientas, normas, plan de pruebas, seguridad).
6. Diseño del sistema (arquitectura conceptual, UML, interfaces, base de datos).
7. Arquitectura tecnológica (frontend, backend, BD, infraestructura).
8. Desarrollo del sistema (iteraciones 1, 2, 3 y posteriores).
9. Control de versiones y gestión del repositorio (repositorio, estrategia, ramas, commits relevantes).
10. Dockerización y despliegue de módulos (backend, frontend, Compose).
11. Estrategia de pruebas (enfoque, niveles, tipos, plan de ejecución).
12. Automatización de pruebas (herramientas, entorno, scripts, ejecución automática).
13. Métricas de calidad (ejecución de casos, **registro de defectos**, métricas, evaluación por estándares).
14. **Implementación y monitoreo** (preparación del entorno, implementación, verificación de funcionamiento, monitoreo).

**Estado del informe Word:** el más reciente (`Proyecto_TecnicoYa.docx`, 08-10) llega solo hasta el capítulo 12 y **le faltan los capítulos 13 y 14**. La versión `Cap1-13` del 04-10 trae el 13 con una tabla de defectos vacía (DEF-01..04 como plantilla) y métricas meta: aprobación ≥ 95 %, cobertura ≥ 70 % en matching, notificación y calificación (RNF-12), estabilidad de CI ≥ 90 % con GitHub Actions, y 100 % de críticos y altos corregidos [VERIFICADO].

#### Exigencias de pruebas encontradas

| Fuente | Exigencia | Etiqueta |
|---|---|---|
| `PLAN-DE-PRUEBAS-TecnicoYa-v2.md` §1, §14 y §17 | ≥ 60 casos **distintos** automatizados en **Pest**, aprobados, más las pruebas de interfaz, E2E, compatibilidad, carga, seguridad y aceptación humana. «Proviene de instrucciones explícitas y no queda opcional» | [VERIFICADO] |
| `CANVAS-Plan-Sprints-01-08.md` | «La exigencia final de más de 60 casos ejecutados no se satisface por tenerlos escritos» | [VERIFICADO] |
| Prompts del otro asistente (09-10) | **Meta nueva: ≥ 60 IDs aprobados por sprint**: 36 Pest (Feature, Unit y Arch), 14 Cypress y 10 Vitest. k6 y SUS van aparte; los casos bloqueados no cuentan; cobertura ≥ 70 % del módulo y `pest --mutate` | [VERIFICADO] (es una propuesta del asistente, no del docente) |
| Word Cap. 1–8 (06-10) | «Al menos 72 casos funcionales y 26 no funcionales» (98) | [DOCUMENTADO en la auditoría del 07-10] |
| `fuentes/proyecto-final.pdf` | Cypress (E2E) y PHPUnit; TDD en matching y SLA | [VERIFICADO] |
| Herramientas | Pest, Cypress, Vitest, pytest, SonarQube (Gate por sprint y por PR), k6 o «herramienta por fijar» para carga (TC-113/114), estudio manual SUS (TC-115/116), compatibilidad Chrome, Edge y Firefox (TC-136) | [VERIFICADO] |
| Evidencias | `evidencias/sprint-NN/TC-XXX/` con caso, commit, entorno, dataset, reloj, esperado y real, logs y defecto; `evidencias/sprint-NN/calidad/`; avance por integrante | [VERIFICADO] |

#### Fechas y semanas

- «Demostración/producción **hacia la semana 12**», en el Resumen ejecutivo y en el Plan de pruebas v2 §15.2, «sujeta al calendario ratificado» [VERIFICADO].
- El plan de 8 sprints dice expresamente «No se fijan fechas, duración ni puntos» [VERIFICADO].
- El plan de pruebas v1 tenía un calendario del 07-09 al 27-09, ya superado e histórico.
- El documento de prompts propone duraciones (fases 0 y 1: 2 días; cierre S1–S3: 1 semana; S4: 1,5 semanas; S5–S8: 1 semana cada uno) con las fechas en `[COMPLETAR]`.
- **No se encontró un calendario del curso con fechas de entrega.** Tampoco el archivo `INDICACIONES_FINALES` (buscado en el repositorio y en Descargas).

### 2.c Decisiones de negocio P01 a P23

**Fuentes:**
- `CANVAS-Analisis-MVP-TecnicoYa.md`, tabla de pendientes en las líneas 726–748.
- `REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md` §9.
- Columna «Pendiente» de `Matriz-Trazabilidad-TC.csv`.

**Ninguna decisión Pxx figura como confirmada.** No existe `DECISIONES.md`; solo `trazabilidad/decisiones.csv`, con otra numeración histórica, DP-01..18 [VERIFICADO].

| P | Tema | Estado | Valor propuesto (si existe) | Sprint afectado | TC bloqueados (*) o condicionados |
|---|---|---|---|---|---|
| P01 | Moneda | Propuesta | S/ (soles), sin conversión, marcada [CONFIRMAR] | S8 | TC-101 |
| P02 | Alcance de pagos y comprobante | Propuesta | Método de pago y comprobante **simulados**; sin dinero real | S8 | TC-101, TC-103 |
| P03 | Distritos de cobertura | Propuesta | Huancayo, El Tambo y Chilca. **Contradicción:** `rules.json` usa 5 zonas (agrega Pilcomayo y Huancán) | S1–S4 | Ninguno directo (las pruebas usan distritos sintéticos) |
| P04 | Responsable del backlog | Pendiente | — | Gobierno | — |
| P05 | Margen de atención inmediata | Propuesta | Técnico sin citas en las próximas 2 h | S3, S4 | TC-133 |
| P06 | Máximo de reprogramaciones | Propuesta | 2 por solicitud | S5 | Ninguno marcado (afecta a HU-S05-03) |
| P07 | Apelaciones y promedio real | Propuesta | 5 días hábiles, provisional | S6 (y S3 por TC-033) | TC-079, TC-081, TC-083 (y TC-033) |
| P08 | Privacidad, retención y cierre de cuenta | Propuesta | 12 meses, provisional | S8 | Ninguno (RF-C10 sin caso) |
| P09 | Muestra y ventana de demostración | Propuesta | 10 participantes; 7 días de 07:00 a 22:00 | S8 | TC-115, TC-116, TC-118 |
| P10 | Solicitudes activas por cliente | Pendiente | Sin valor | S3 | **TC-122*** |
| P11 | Elección del cliente y asignación | Pendiente | — | S4, S7 | TC-089 |
| P12 | Relojes, rondas y notificaciones | Propuesta parcial | Intervalo [inicio, vencimiento); el reloj de 24 h no se reinicia por un job | S4, S6, S8 | TC-048, TC-054, TC-077, TC-105 |
| P13 | Reglas de dos técnicos | Pendiente | — | S5, S6 | TC-065, TC-077 |
| P14 | Cancelación y reprogramación | Pendiente (R7 da reglas parciales) | — | S5, S7 | TC-069, TC-071, TC-089 |
| P15 | Normalización del matching, técnico sin historial y empate | Propuesta parcial | Pesos 35/20/30/15; técnico nuevo H = 0,50; umbral de 3 servicios; Dref y Aref **sin valor**. **Contradicción:** `rules.json` ya fija `maxExperienceYears = 10` y `secondaryZoneProximity = 0.5` | S4 (y S3 por TC-033) | **TC-140***, TC-044 (y TC-033) |
| P16 | Tarifas, métodos y franjas | Pendiente | — | S2–S4, S8 | TC-101, TC-114, TC-133 |
| P17 | Política de contenido y archivos | Pendiente | — | S2, S3, S6 | **TC-123***, **TC-130***, TC-022, TC-081 |
| P18 | Sanciones | Pendiente | Sin sanción automática | S2, S7 | TC-091 |
| P19 | Vigencia de cambios administrativos | Propuesta | Congelar la versión de las reglas por solicitud | S4, S7 | TC-095 |
| P20 | Persona con varios roles | Propuesta | **Un rol por cuenta** (el código ya lo aplica con `users.role_id`) | S1 | — |
| P21 | Protocolo de calidad, carga y reportes | Pendiente | — | S7, S8 | TC-087, 097, 103, 111, 113, 114, 115, 116, 118, 136 |
| P22 | Estados iniciales y verificación | Pendiente | El código **ya usa** `registered` → `sent` al enviar | S1–S3 | Ninguno marcado (afecta al nombre del estado en TC-037 y TC-126) |
| P23 | Anclaje de la edición de la calificación | Propuesta | `first_rated_at + 48 h`, sin reinicio | S6 | TC-075 |

**Sin Pxx, pero condicionados:** TC-129 («retiro tras envío sin regla»), TC-138 («reglas de capas por fijar») y los nombres de permiso `announcements.manage` y `technicians.verify` (identificadores propuestos, AuthorizationSeeder).

**Totales [VERIFICADO en la matriz]:** **4 bloqueados** (TC-122, TC-123, TC-130 y TC-140) y **22 condicionados**.

---

## 3. Plan de sprints vigente

**Fuente principal:** `editables/sprints-01-08/` (05-10).
- `CANVAS-Plan-Sprints-01-08.md` y 8 `CANVAS-Sprint-0N.md` de 36 a 53 kB cada uno.
- `Plan-Sprints-01-08.json` con objetivo, alcance, dependencias, pendientes, tareas técnicas (RT-xx), seguridad, DoD e historias.
- La validación documental indica 8 sprints, **59 HU**, **118 casos**, 33 RF y 2 casos manuales: «documentary_checks_passed_not_product_tests» [VERIFICADO].

**Decisiones de base del plan maestro [VERIFICADO]:**
- React, Laravel y MySQL; sesión SPA (Sanctum); Reverb/Echo; Docker Compose; Pest, Cypress y SonarQube.
- **Ocho sprints exactos**, más la Iteración 0 previa.
- Pagos y comprobantes simulados.
- Excluidos: suscripciones, chat y LLM, geolocalización real, apps móviles y procesamiento financiero.
- S4 indica expresamente «**No introducir** un microservicio Python como dependencia nueva».

**Cómo se lee cada CANVAS:**
1. Objetivo y alcance.
2. Dependencias y pendientes.
3. RF/RNF y requerimientos técnicos RT-01..07.
4. Tareas por capa y rutas.
5. Historias HU-SNN-xx.
6. Criterios Dado/Cuando/Entonces.
7. Gherkin.
8. Casos TC con precondiciones.
9. Controles DevSecOps.
10. DoD.
11. Evidencias.

### 3.1 Resumen por sprint

Los casos se cuentan con la matriz `Matriz-Trazabilidad-TC.csv` (TC-001..140). El catálogo de sprints (TC-001..118) coincide **exactamente** en título y sprint para los IDs 001–118 [VERIFICADO].

| Sprint | Objetivo | HU (casos) | RF/RNF | Capas y rutas previstas (RT) | Casos diseñados (Pest/Cypress/otros) | Pendientes Pxx | DoD específica (resumen) |
|---|---|---|---|---|---|---|---|
| **S1** Base técnica, autenticación, roles y catálogo | Acceso por identidad y permisos reales sobre API y MySQL, perfiles mínimos y catálogo reproducible | 6: S01-01 registro de cliente (TC-001/002); 02 técnico pendiente (003/004); 03 sesión y cierre (005/006); 04 autorización (007/008); 05 perfil (009/010); 06 catálogo (011/012); + TC-137 | RF-28, RF-33, RF-C01, RF-C06; RNF-08/09/11/14 | `features/administration` y `app/Modules/FAdministration`; `/sanctum/csrf-cookie`, `/api/v1/auth/register|login|logout`, `/me`, `/catalog/specialties|subcategories`; tablas roles, permissions, users, pivotes, perfiles, specialties, subcategories, sessions, audit_entries; semilla 11/9/10 | 13 (10 / 3 / 0) | P20, P22, P03/P16, P04 | Registro y acceso cliente/técnico; admin aprovisionado; técnico pendiente; API deniega admin a otros roles; semillas idempotentes; **los 3 roles recorren UI → API → MySQL; la demo localStorage no cuenta** |
| **S2** Landing, administración de catálogo y perfil del técnico | Oferta visible; admin y técnicos preparan información verificable | 7: S02-01 landing y carrusel (013/014); 02 catálogo (015/016); 03 comunicados (017/018); 04 verificación (019/020); 05 perfil y portafolio (021/022); 06 disponibilidad, zona y pausa (023/024); 07 servicios y tarifas (025/026); + TC-131, 134, 135 | RF-05, RF-07, RF-30, RF-33, RF-C01, C02, C04, C06, C08, C09 | `/admin/specialties`, `/admin/subcategories`, `/admin/districts`, `/admin/announcements`, `/admin/technicians/{id}/reviews`; `/technicians/me/profile|portfolio|documents|availability|services`; `/media`; tablas de revisión, documentos, portafolio, servicios, versiones de tarifa, distritos, franjas, pausas y audiencias | 17 (13 / 4 / 0) | P03, P05/P16, P17, P18, P19, P22 | **Landing de 10 secciones** con CTA, teclado, móvil y movimiento reducido; admin gestiona catálogo, fotos, comunicados y revisión con auditoría; técnico gestiona solo lo suyo; versiones de tarifa; documentos privados no expuestos |
| **S3** Solicitud y búsqueda de técnicos | Describir, revisar y enviar la necesidad; consultar técnicos | 6: S03-01 cinco pasos (027/028); 02 evidencias (029/030); 03 tarifa y ubicación (031/032); 04 búsqueda y perfil público (033/034); 05 solicitud desde perfil (035/036); 06 mis solicitudes y envío repetido (037/038); + Módulo A TC-119..130 | RF-01..04, RF-33, RF-C02, RF-C06; RNF-03/05 | `features/requests` y `features/matching`; ARequests; `POST /requests`, `POST/DELETE /requests/{id}/attachments`, `POST /requests/{id}/submission`, `GET /requests`, `GET /requests/{id}`, **`GET /technicians`** y `/technicians/{id}`; idempotencia | 24 (18 / 5 / 1 híbrido TC-130) | P03, P05, P10, P16, P17, P22 | Cinco pasos con retroceso sin perder datos; evidencias y tarifa en el resumen; solo solicitudes propias; **búsqueda por rubro, subcategoría, zona y calificación mínima**; dirigida conserva el técnico |
| **S4** Matching, notificación, SLA y reasignación | Solicitud → ofertas trazables y asignación elegida | 10: S04-01 elegibilidad (039/040); 02 puntuación y desempate (041/042); 03 estimaciones y técnico nuevo (043/044); 04 ronda y notificaciones (045/046); 05 respuesta y SLA (047/048); 06 elección y concurrencia (049/050); 07 reasignación y ruta dirigida (051/052); 08 pendiente 24 h (053/054); 09 tiempo real (055/056); 10 entrega y reintentos (057/058); + 132, 133, 140 | RF-06..18, RF-29, RNF-07 | BMatching y COffers; tablas rule_parameters/versions/values, matching_weights/runs/candidates, offer_rounds/offers, participations, appointments, notifications, outbox, idempotency; `GET /offers`, `GET /requests/{id}/candidates`, `POST /offers/{id}/response`, `/requests/{id}/selection`, `/alternative-searches`; jobs PrepareMatching, OpenOfferRound, ExpireOfferRound, RetryPendingMatching, ExpirePendingRequest, DeliverNotification, PublishOutboxEvent; Reverb/Echo; cola MySQL | 23 (22 / 1 / 0; TC-056 híbrido Pest + Reverb) | P05/P16, P11, P12, P15, P19 | Ranking reproducible; máximo 3 ofertas; aceptación ≠ asignación; plazos de 10 min y 24 h con reloj de pruebas; Reverb real; jobs repetidos sin efectos dobles |
| **S5** Atención, agenda y seguimiento | Ejecutar y seguir la atención hasta el reporte | 7: S05-01 agenda (059/060); 02 inicio y fin (061/062); 03 reprogramación (063/064); 04 técnico adicional (065/066); 05 línea de tiempo y contacto (067/068); 06 cancelación (069/070); 07 retiro e incidencia (071/072) | RF-19..22, RF-33 | DService; tablas participations, appointments, reschedules, service_reports, incidents, reassignment_records; `/appointments`, `/requests/{id}/timeline|cancellation`, `/participations/{id}/start|completion|withdrawal`, `/requests/{id}/reschedules`, `/reschedules/{id}/response` | 14 (12 / 2 / 0) | P05/P16, P06, P13, P14 | Solo el técnico asignado inicia y finaliza; `completed_at` del servidor; el cliente no confirma el cierre; UTC en BD y presentación America/Lima |
| **S6** Calificación, historial y apelaciones | Evaluación versionada, revisión e historial | 7: S06-01 calificar (073/074); 02 editar con versiones (075/076); 03 sin calificar (077/078); 04 reseñas y respuestas (079/080); 05 apelar (081/082); 06 resolución (083/084); 07 historial y criterios (085/086) | RF-23..27, RF-33 | Módulo E (ERatings); CloseUnratedParticipation idempotente | 14 (13 / 1 / 0) | P07, P13, P17, P23 | Ventana de 48 h; versiones inmutables; sin borrado de reseñas |
| **S7** Panel administrador completo | Supervisión, parámetros y accesos | 7: S07-01 dashboard (087/088); 02 reasignación manual (089/090); 03 clientes y bloqueos (091/092); 04 soporte (093/094); 05 reglas e historial (095/096); 06 reportes Excel y PDF (097/098); 07 administradores y auditoría (099/100) | RF-30, RF-31, RF-33, RF-C03, C05, C07, C12 | `POST /admin/requests/{id}/reassignments`; tablas reassignment_records, client_blocks, support_tickets, rule_versions, audit_entries, export_files | 14 (14 / 0 / 0) | P18, P19, P21 | Pesos que suman 100; protección del último administrador; Gate antes de aceptar |
| **S8** Pagos simulados, notificaciones, endurecimiento y despliegue | MVP desplegable con simulación económica y controles revisados | 9: S08-01 métodos y comprobante (101/102); 02 historial y ganancias simuladas (103/104); 03 preferencias y avisos (105/106); 04 ayuda y soporte (107/108); 05 regresión y endurecimiento (109/110); 06 Gate y cobertura (111/112); 07 rendimiento (113/114); 08 usabilidad (115/116); 09 despliegue, respaldo y recuperación (117/118); + 136, 138, 139 | RF-29, RF-32, RF-33, RF-C07, C09, C11; RNF-01..14 | `/payment-methods`, `/requests/{id}/payment-method`, `/me/notification-preferences`, `/support-cases`; **Compose de demostración**: gateway HTTPS/WSS, api, mysql interno, worker-domain, worker-delivery, scheduler y reverb | 21 (9 Pest / 3 Cypress / 9 otros: 2 carga, 2 manuales, 3 CI, 1 operación y 1 monitoreo) | P01, P02/P16, P08, P09, P12, P21 | Gate final y regresión sobre el commit desplegado; despliegue en servidor |

**DoD común [VERIFICADO en el JSON y en las adendas]:**
- Pruebas automatizadas aprobadas con evidencia ligada al commit.
- Matriz actualizada.
- Permisos probados en la API, no solo ocultando botones.
- Mensajes en español.
- Gate de SonarQube aprobado en el commit del sprint.
- Sin datos personales ni secretos.
- Revisión humana.

### 3.2 Contradicciones entre planes [VERIFICADO salvo donde se indica]

| # | Tema | Plan vigente (8 sprints) | Otra fuente | Comentario |
|---|---|---|---|---|
| C1 | Número de iteraciones | I0 + 8 sprints | PDF 03 y 08–17: **10 iteraciones** (I06 asistente, I07 LLM, I09 pagos reales); `docs/documentacion/sprints/S01..S04` (4–5 iteraciones); Word Cap. 1–8: I0 + S01..S05 | Hay que declarar histórico todo lo que no sea el plan de 8 sprints |
| C2 | Catálogo de casos | `Catalogo-TC-Sprints-01-08.csv`: **118** (TC-001..118) | `Matriz-Trazabilidad-TC.csv` y `CATALOGO-TC.md`: **140** (añade el Módulo A TC-119..135 y TC-136..140) | Los IDs 001–118 coinciden; la matriz es el superconjunto vigente. El CANVAS maestro todavía dice «118 casos» |
| C3 | Casos por sprint | CANVAS maestro: 12/14/12/20/14/14/14/18 | Matriz: **13/17/24/23/14/14/14/21** | La diferencia son los TC-119..140 |
| C4 | Meta de pruebas | Plan de pruebas v2: ≥ 60 IDs Pest **en total** | Prompts (09-10): ≥ 60 **por sprint** (36 Pest, 14 Cypress y 10 Vitest) = 480; Word: 72 + 26 = 98 | El catálogo actual tiene 140 casos en total; 60 por sprint exige **diseñar unos 340 casos más** |
| C5 | Motor de BD | MySQL 8.4 | PDF 04, 06, 07 y 08: PostgreSQL; `infrastructure/docker-compose.yml`, `.env.example`, `config/database.php` y Dockerfile de la API: pgsql | Ver DEF-12 |
| C6 | Matching | S4: en Laravel (BMatching), **sin** un microservicio Python nuevo | PDF 06 y 11 y el prototipo: FastAPI con fallback en PHP | Hay que decidir si `python/api` se retira o se mantiene como referencia |
| C7 | Autenticación | Sanctum (cookie + CSRF) | PDF 07 y 09 y prototipo: token Bearer propio (`api_tokens`) | Las dos conviven en el código (ver 4.6) |
| C8 | Rutas S2 | `/admin/specialties`, `/admin/districts`, `/admin/announcements` (CRUD), `/technicians/me/profile|documents` | Implementado: solo `/admin/subcategories`, `/admin/announcements/{id}/duplicates`, `/admin/technicians/{id}/reviews`, `/technicians/me/availability|services|portfolio` | Faltan rutas del contrato (ver 8.2) |
| C9 | Módulo de S2 | RT-02 de S2: disponibilidad y oferta profesional en **ARequests** | Código: en **FAdministration** | Diferencia de ubicación, no funcional |
| C10 | Estados de solicitud | Diccionario v1: registered, sent, pending_availability… | Prototipo (`Marketplace.php`): searching, pending, proposed, confirmed… [DOCUMENTADO en la auditoría del 07-10] | Hay dos máquinas de estados en paralelo |
| C11 | Zonas | P03 propone 3 distritos | `rules.json`: 5 zonas | — |
| C12 | Estado de la matriz | — | `Matriz-Trazabilidad-TC.csv` marca los 27 casos de S2 y S3 que pasan en Pest como `NO EJECUTADO` | La matriz está desactualizada |
| C13 | Numeración de RF | Matriz y Formato 09: RF-01..33 y RNF-01..14 | Word Cap. 1–8: RF-01..34 y RNF-01..26 [DOCUMENTADO en la auditoría del 07-10] | Hay que unificarla en el Word |

---

## 4. Backend (`backend/api`)

### 4.1 Versiones y paquetes [VERIFICADO]

| Elemento | Versión |
|---|---|
| Laravel | 12.68.0 |
| PHP CLI | 8.2.12 (XAMPP `C:\xampp\php\php.exe`), con la extensión **pcov** |
| Composer | 2.10.3 |
| Producción | `laravel/framework` ^12.0 (12.68.0), `laravel/sanctum` 4.3.3, `laravel/tinker` 2.11.1, `firebase/php-jwt` 7.1.0 (**sin uso**: ver DEF-14) |
| Desarrollo | `pestphp/pest` 3.8.7, `pest-plugin-laravel` 3.2.0, `phpunit/phpunit` 11.5.56, Faker 1.24.1, Mockery 1.6.15, Pint 1.30.4, Sail 1.67.0, Pail 1.2.7, Collision 8.9.5 |
| Dependencia transitiva con aviso | `league/commonmark` 2.10.0 |
| Scripts de Composer | `test` (`config:clear` + `artisan test`), `test:coverage` (PCOV + `--coverage`), `test:sonar` (genera `test-results/clover.xml` y lo normaliza) |
| Idioma | `locale` y `fallback_locale` = `es`; `lang/es/api.php`, `auth.php` y `validation.php` [DOCUMENTADO en la auditoría del 07-10] |

### 4.2 Estructura de `app/` [VERIFICADO]

**Módulos (`app/Modules`)**: existen 2 de los 6 previstos (A–F). **No existen** BMatching, COffers, DService ni ERatings.

| Módulo | Application (casos de uso) | Domain | Controladores | Form Requests |
|---|---|---|---|---|
| `ARequests` | ManageServiceRequests, RequestTimeline, ServiceRequestView | AttachableEvidence, TargetTechnicianOffers | ServiceRequestController | AttachEvidence, StoreServiceRequest, SubmitServiceRequest, UpdateServiceRequest |
| `FAdministration` | Announcements, ManageSubcategories, OwnTechnicianProfile, Portfolio, ProvisionAdministrator, PublicTechnicianProfile, RegisterAccount, ReviewTechnician, UpdateAvailability (incluye distritos y pausa), UpdateProfile, UpdateServices | ActiveSubcategory, PortfolioImage, ReviewedImage, TechnicianAvailability | AdminCatalog, Announcement, Auth, Catalog, Media, Profile, TechnicianProfile | Account, CreateSubcategory, Login, RegisterAccount, ReviewTechnician, StorePortfolioItem, UpdateAvailability, UpdateProfile, UpdateServices, UpdateSubcategory; Resource `AccountData` |

**Otras piezas:**
- **Compartido (`app/Shared`):** `Audit/AuditTrail`, `Auth/EffectivePermissions`, `Http/ApiResponse`, `Http/ApiExceptionRenderer` (todas las excepciones salen en JSON) y `Http/Idempotency`.
- **Histórico:** `Http/Controllers/AuthController` y `MarketplaceController`; `Services/Marketplace`, `Matching` (llama a Python), `Permissions` y `Announcements`; middleware `ApiToken`.
- **Modelos (10):** User, ClientProfile, TechnicianProfile, TechnicianService, ServiceRateVersion, TechnicianDocument, MediaFile, District, Announcement y ServiceRequest. Muchas tablas v1 se manejan con el Query Builder sin modelo.
- **Middleware (alias en `bootstrap/app.php`):** `token` (ApiToken, histórico), `account.active`, `permission:<código>` y `role:<código>`; `statefulApi()` para Sanctum.
- **Jobs, eventos, listeners y notificaciones:** **no existen** (`app/Jobs`, `app/Events`, `app/Listeners` y `app/Notifications` no encontrados).
- **Colas:** `config/queue.php` usa por defecto `database`. No hay jobs.
- **Scheduler (`routes/console.php`):** `marketplace:tick` **cada segundo**, histórico: vence ofertas y reasigna en el modelo antiguo. El `docker/entrypoint.sh` de la API arranca `schedule:work` y `php artisan serve`.
- **Comandos:**
  - `tecnicoya:provision-admin` (v1, con auditoría y contraseña oculta).
  - `marketplace:admin` (histórico: crea un admin con la columna `role`).
  - `marketplace:tick` (histórico).

### 4.3 Migraciones y tablas [VERIFICADO]

| Migración | Tablas creadas (C) o alteradas (A) | Modelo |
|---|---|---|
| 2026_09_22_000001_create_marketplace | C: users, api_tokens, technicians, requests, offers | Histórico |
| 2026_09_28_000002_add_account_access | C: access_events; A: users | Histórico |
| 2026_09_28_000003_create_announcements | C: announcements | Histórico (ampliado en v1) |
| 2026_10_04_000004_add_subcategories | A: requests, technicians | Histórico |
| 2026_10_06_000005 | C: roles, permissions | v1 (S1) |
| 2026_10_06_000006 | A: users (role_id, phone, version, auth_version…) | v1 (S1) |
| 2026_10_06_000007 | C: role_permissions, user_permissions | v1 (S1) |
| 2026_10_06_000008 | C: client_profiles, technician_profiles | v1 (S1) |
| 2026_10_06_000009 | C: specialties, subcategories | v1 (S1) |
| 2026_10_06_000010 | C: sessions | v1 (S1) |
| 2026_10_06_000011 | C: audit_entries | v1 (S1) |
| 2026_10_07_000012 | C: districts, media_files | v1 (S2) |
| 2026_10_07_000013 | A: specialties, subcategories (medios) | v1 (S2) |
| 2026_10_07_000014 | C: technician_services, service_rate_versions, technician_districts, availability_slots, technician_pauses | v1 (S2) |
| 2026_10_07_000015 | C: technician_documents, technician_reviews, review_documents, portfolio_items, portfolio_images | v1 (S2) |
| 2026_10_07_000016 | C: announcement_audiences; A: announcements | v1 (S2) |
| 2026_10_07_000017 | C: service_requests, request_attachments, request_events, idempotency_records | v1 (S3) |

En total: **17 migraciones, 34 tablas creadas.** No hay migración de datos entre el modelo histórico y el v1.

### 4.4 Seeders, factories, roles y permisos [VERIFICADO]

**Seeders:**
- `AuthorizationSeeder`: roles `client` (Cliente), `technician` (Especialista técnico) y `admin` (Administrador). Permisos **solo para admin**: `catalog.manage`, `announcements.manage` y `technicians.verify` (los dos últimos «propuestos, pendientes de ratificación»). Rellena `role_id` desde la columna histórica `users.role` y audita.
- `CatalogSeeder` + `data/catalog.csv`: 3 especialidades y 30 subcategorías (11/9/10), idempotente.
- `Sprint01E2ESeeder`: crea 3 cuentas sintéticas (`e2e-<rol>@example.test`) **solo** si el entorno es testing, MySQL y `127.0.0.1/tecnicoya_testing`. La contraseña sale de una variable de entorno de al menos 24 caracteres.

**Factories (9):** User, ClientProfile, TechnicianProfile, TechnicianService, TechnicianDocument, MediaFile, District, Announcement y ServiceRequest.

Los roles **cliente y técnico no tienen permisos** en la tabla. Su autorización se hace con `role:client` y `role:technician` y con comprobaciones de propietario en los casos de uso.

### 4.5 Rutas (`php artisan route:list --json`: 35 rutas) [VERIFICADO]

**`/api/v1` (25 rutas, Sanctum):**

| Método | URI | Acción | Middleware (además de `api`) |
|---|---|---|---|
| POST | api/v1/auth/register | FAdministration AuthController@register | throttle:spa-auth |
| POST | api/v1/auth/login | AuthController@login | throttle:spa-auth |
| POST | api/v1/auth/logout | AuthController@logout | auth:sanctum |
| GET | api/v1/me | ProfileController@show | auth:sanctum, account.active |
| PATCH | api/v1/me | ProfileController@update | auth:sanctum, account.active |
| GET | api/v1/catalog/specialties | CatalogController@specialties | público |
| GET | api/v1/catalog/subcategories | CatalogController@subcategories | público |
| GET | api/v1/media/{media} | MediaController@show | público (el controlador exige sesión y relación para archivos privados) |
| GET | api/v1/announcements | AnnouncementController@index | auth:sanctum, account.active |
| POST | api/v1/admin/subcategories | AdminCatalogController@storeSubcategory | + permission:catalog.manage |
| PATCH | api/v1/admin/subcategories/{subcategory} | AdminCatalogController@updateSubcategory | + permission:catalog.manage |
| POST | api/v1/admin/announcements/{announcement}/duplicates | AnnouncementController@duplicate | + permission:announcements.manage |
| POST | api/v1/admin/technicians/{technician}/reviews | TechnicianProfileController@review | + permission:technicians.verify |
| PUT | api/v1/technicians/me/availability | TechnicianProfileController@availability | + role:technician |
| PUT | api/v1/technicians/me/services | TechnicianProfileController@services | + role:technician |
| POST | api/v1/technicians/me/portfolio | TechnicianProfileController@storePortfolio | + role:technician |
| GET | api/v1/technicians/{technician} | TechnicianProfileController@show | auth:sanctum, account.active |
| GET | api/v1/technicians/{technician}/portfolio | TechnicianProfileController@portfolio | público |
| GET | api/v1/requests | ServiceRequestController@index | + role:client |
| POST | api/v1/requests | ServiceRequestController@store | + role:client |
| GET | api/v1/requests/{serviceRequest} | ServiceRequestController@show | auth:sanctum, account.active |
| PATCH | api/v1/requests/{serviceRequest} | ServiceRequestController@update | + role:client |
| POST | api/v1/requests/{serviceRequest}/attachments | ServiceRequestController@attach | + role:client |
| DELETE | api/v1/requests/{serviceRequest}/attachments/{media} | ServiceRequestController@detach | + role:client |
| POST | api/v1/requests/{serviceRequest}/submission | ServiceRequestController@submit | + role:client |

**Rutas `/api` históricas (6, token Bearer propio):**

| Método | URI | Acción | Middleware |
|---|---|---|---|
| GET | api/health | Closure | — (la usa el arrancador E2E) |
| POST | api/register | AuthController@register | throttle:10,1 |
| POST | api/login | AuthController@login | throttle:10,1 |
| POST | api/logout | AuthController@logout | ApiToken, throttle:120,1 |
| GET | api/state | MarketplaceController@state | ApiToken, throttle:120,1 |
| POST | api/actions/{action} | MarketplaceController@action (ofertas, matching, calificación y comunicados del prototipo) | ApiToken, throttle:120,1 |

**Otras (4):**
- `GET /health` (salud nativa de Laravel 12).
- `GET /sanctum/csrf-cookie`.
- `GET` y `PUT storage/{path}`: rutas que Laravel 12 crea porque el disco `local` tiene `'serve' => true` en `config/filesystems.php`. Funcionan con URL firmadas. Conviene revisarlas o desactivarlas si no se usan.

**Rutas del plan que no existen:**
- S2: `/admin/specialties`, `/admin/districts`, CRUD de `/admin/announcements`, `/technicians/me/profile` y `/technicians/me/documents`.
- S3: **`GET /technicians`** (búsqueda).
- S4 a S8: todas.
- No hay `/api/v1/health`.

### 4.6 Los dos modelos de datos y las dos autenticaciones [VERIFICADO]

| | Modelo histórico (prototipo, 22-09 a 04-10) | Modelo v1 (Sprints 1 a 3, 06-10) |
|---|---|---|
| Tablas | users (columna `role`, `is_active`), api_tokens, technicians, requests, offers, access_events, announcements | roles, permissions, pivotes, users (`role_id`, `version`, `auth_version`), perfiles, catálogo, sessions, audit_entries, districts, media_files, servicios y tarifas, revisión, portafolio, service_requests, adjuntos, eventos, idempotencia |
| Autenticación | **Token Bearer propio**: `api_tokens.token_hash` (SHA-256) con caducidad; middleware `ApiToken`. **No usa JWT**: `firebase/php-jwt` no se usa en ninguna parte | **Sanctum SPA**: cookie de sesión (tabla `sessions`), CSRF (`/sanctum/csrf-cookie`), `auth:sanctum`, `account.active`, `role:` y `permission:` |
| Rutas | `/api/register`, `/login`, `/logout`, `/state`, `/actions/{action}` | `/api/v1/*` |
| Código | `Http/Controllers/AuthController`, `MarketplaceController`, `Services/*`, `marketplace:tick`, `marketplace:admin` | `Modules/ARequests`, `Modules/FAdministration`, `Shared/*`, `tecnicoya:provision-admin` |
| Frontend | `#demo` (`Marketplace.jsx` + `marketplace-api.js` en modo «en vivo»; si no, `localStorage`) | `#cuenta`, `#plataforma` y `#catalogo` (`features/administration`) |
| Matching | Sí: `Services/Matching.php` → `POST {PYTHON_URL}/match` (2 s) con fallback en PHP | **No existe** (corresponde a S4) |
| Pruebas | `AnnouncementsTest` (5) y `MarketplaceTest` (16) | `tests/Feature/Sprint01..03` (41) |

La tabla `users` es **compartida**. `AuthorizationSeeder` rellena `role_id` desde `role`. Las dos autenticaciones pueden convivir sobre los mismos usuarios.

### 4.7 Motor de base de datos por entorno [VERIFICADO]

| Entorno o archivo | Motor |
|---|---|
| `phpunit.xml` (Pest) | **MySQL** 127.0.0.1:3306, `tecnicoya_testing`, usuario `tecnicoya_test`; la contraseña está en `.env.testing` (no abierto) |
| `backend/api/docker-compose.testing.yml` | **MySQL 8.4** (`tecnicoya-mysql-test`, `127.0.0.1:3306`, volumen `tecnicoya-mysql-test-data`). Requiere el **puerto 3306 libre**, es decir, XAMPP MySQL detenido |
| `scripts/run-sprint01-e2e.mjs` | MySQL `tecnicoya_testing` + `artisan serve` en 8001 + Vite en 5174 |
| `backend/api/.env.example` | **pgsql** (5432) |
| `.env.example` (raíz) | `DB_CONNECTION=postgresql` |
| `config/database.php` | Valor por defecto **pgsql** (están definidas las conexiones pgsql, mysql y sqlite) |
| `infrastructure/docker-compose.yml` | **PostgreSQL 16** + matching (Python) + api + web (5173) |
| `backend/api/Dockerfile` | Instala **solo `pdo_pgsql`**: la imagen **no puede conectarse a MySQL** |
| `infrastructure/docker-compose.quality.yml` | PostgreSQL 16, solo como base de datos interna de SonarQube (9000) |
| `backend/api/.env` local | SQLite [DOCUMENTADO en la auditoría del 07-10; no se abrió] |
| `.devops/project.yml` | «React, Laravel, FastAPI y PostgreSQL» [DOCUMENTADO en la auditoría del 07-10] |

**Carpeta vacía:** `backend/api/frontend/web/cypress/e2e/sprint-01/` existe y está vacía. Es un resto sin uso.

---

## 5. Frontend (`frontend/web`)

### 5.1 Dependencias y scripts [VERIFICADO]

- **Dependencias:** `react` y `react-dom` ^18.3.1.
- **Desarrollo:** `vite` ^5.4.11, `vitest` ^2.1.9 (versión 2.1.9 ejecutada), `cypress` ^16.1.1, `@vitejs/plugin-react` ^4.3.4, `@testing-library/react` ^16.1.0, `@testing-library/jest-dom` 6.6.3 y `jsdom` ^25.0.1. No hay enrutador (rutas por `hash`) ni librería de estado.
- **Scripts:** `dev` (vite en 127.0.0.1), `build`, `start` (`node server.mjs`), `test` (`vitest run`), `cy:open` y `cy:run`.
- **Cypress:**
  - `cypress.config.js` (baseUrl 5173, `cypress/e2e/**`).
  - `cypress.sprint01.config.js` (baseUrl **5174**, `cypress/e2e/sprint-01/**`; la contraseña E2E llega por variable de entorno).
- **Cobertura de Vitest:** no está configurada (no hay `coverage/`).

### 5.2 Pantallas y rutas de la SPA [VERIFICADO]

`App.jsx` decide la pantalla según `window.location.hash`. Todo va dentro de `VideoExperience` (video del hero).

| Hash | Pantalla | Contrato que usa |
|---|---|---|
| `#inicio` y demás anclas (`#servicios`, `#proceso`, `#tecnicos`) | Landing: `App` + `ServiceCarousel` + `scroll/ScrollServices` + video. En `App.jsx` hay **5 `<section>`** (el CANVAS de S2 pide **10 secciones**) | Estático; lee `domain/rules.json` (p. ej., «10 min») |
| `#cuenta` y `#plataforma` | `features/administration/AccountApp` → `SessionForm` (registro y login; registro como cliente o técnico), `ProfileForm` (PATCH `/me` con versión) y estado del técnico pendiente | **`/api/v1`** con Sanctum: `/sanctum/csrf-cookie`, `/auth/register`, `/auth/login`, `/auth/logout` y `/me` (`features/administration/http.js`: `credentials: 'include'`, cabecera `X-XSRF-TOKEN`, tiempo máximo de 15 s) |
| `#catalogo` | `features/administration/Catalog` | **`/api/v1/catalog/specialties`** y **`/catalog/subcategories?specialty_id=`** |
| `#demo` | `Marketplace` (+ `AccountPanel`, `Announcements`, `TechnicianProfile`, `Auth`) | **Demo en `localStorage`** (`domain/demo.js`, clave `tecnicoya.marketplace.v1`). Con el modo «en vivo» usa la **API histórica `/api`** con Bearer (`marketplace-api.js`) |

**Lo que no tiene pantalla v1:**
- Ninguna pantalla v1 para S2: administración del catálogo, comunicados, revisión técnica, disponibilidad, servicios y tarifas, portafolio.
- Ninguna para S3: solicitud en 5 pasos, mis solicitudes, búsqueda ni perfil público.
- Esos flujos solo existen en la demo y en la API histórica.
- Los códigos de subcategoría de la demo (p. ej., `refrigeracion-vitrinas`) no coinciden con los del catálogo v1 sembrado [DOCUMENTADO en la auditoría del 07-10].

### 5.3 Errores y alertas [VERIFICADO]

**Pantallas v1:**
- Usan `ApiError` (mensaje, estado y errores por campo).
- Los mensajes van en español, también para un fallo de red con resultado incierto: «No pudimos confirmar el resultado… consulta el estado antes de repetir».
- La falta de cookie CSRF tiene un mensaje propio (419).
- Hay regiones `role="status"` y `role="alert"` en `AccountApp`, `Catalog`, `SessionForm` y `forms.jsx`.
- La validación en el cliente está en `forms.jsx`. La regex del correo en `forms.jsx:18` es `^[^\s@]+@[^\s@]+\.[^\s@]+$`; Sonar avisa de posible retroceso superlineal (DEF-10).

**Demo:** tiene sus propios mensajes; está fuera del contrato v1.

### 5.4 Textos en inglés [VERIFICADO]

- **Interfaz visible:** no se encontraron textos en inglés en las pantallas (botones, `aria-label` y mensajes están en español).
- **Nombres de las pruebas:** **los 38 de Vitest están en inglés** (p. ej., «technician can update their coverage and fee without granting verification»). También los 21 Pest históricos (p. ej., «only admin can write announcements»). Las pruebas v1 (Pest S1–S3 y Cypress) están en español.
- **Código:** nombres de comando en inglés (`purpose('Expire offers and reassign pending requests')` en `routes/console.php`).

### 5.5 `npm audit --json` (solo lectura) [VERIFICADO]

**Total: 7** (crítica 2, alta 2, moderada 3, baja 0). La raíz del repositorio tiene 0 [DOCUMENTADO en la auditoría del 07-10].

| Paquete | Severidad | Directo | Rango afectado | Motivo | Corrección |
|---|---|---|---|---|---|
| vitest | crítica | sí | ≤ 4.1.10 | UI server permite leer y ejecutar archivos; @vitest/mocker | vitest 5.0.3 (**mayor**) |
| tinypool | crítica | no | ≤ 2.1.1 | Prototype pollution → RCE | vía vitest 5.0.3 (mayor) |
| vite | alta | sí | ≤ 6.4.2 | Path traversal en `.map` de deps optimizadas; launch-editor NTLMv2 en Windows | vite 8.3.4 (**mayor**) |
| source-map-js | alta | no | 1.0.0–1.2.1 | DoS del event loop | `npm audit fix` (sin cambio mayor) |
| @vitest/mocker | moderada | no | ≤ 4.1.10 | Path traversal | vía vitest 5.0.3 |
| esbuild | moderada | no | ≤ 0.24.2 | El servidor de desarrollo responde a cualquier origen | vía vite 8.3.4 |
| vite-node | moderada | no | ≤ 2.2.0-beta.2 | vía vite | vía vitest 5.0.3 |

Todas afectan a herramientas de **desarrollo y pruebas**, no al bundle de producción (`react` y `react-dom` no tienen avisos). Seis de las siete solo se corrigen con saltos de versión mayor (Vite 5 → 8 y Vitest 2 → 5).

---

## 6. Servicio Python y reglas

### 6.1 `python/api` [VERIFICADO]

- **Qué es:** FastAPI (`app.py`, unas 60 líneas) con `GET /health` (estado y `rulesVersion`) y `POST /match`.
- **Entrada de `/match`:** especialidad, subcategoría, zona, técnicos (≤ 5000) y excluidos.
- **Qué hace:** filtra elegibles (verificado, disponible, activo, subcategoría, especialidad, zona y no excluido) y calcula un puntaje ponderado con `RULES['weights']`.
  - Cercanía: 1 si está en la misma zona; si no, `secondaryZoneProximity`.
  - Precio: normalizado min–max.
  - Calificación: rating/5.
  - Experiencia: años/`maxExperienceYears`.
  - Ordena por puntaje, luego rating y luego id, con redondeo decimal a 6 cifras.
- **Dependencias** (`requirements.txt`): fastapi 0.115.6, uvicorn 0.34.0, httpx 0.28.1, pytest 8.3.4 y pytest-cov 6.0.0. Se ejecuta con **Python 3.14.7** del sistema.
- **Dockerfile:** `python:3.12-slim` **sin `USER`**, por lo que corre como root (DEF-13).
- **Quién lo llama:** solo la **API histórica**, desde `app/Services/Matching.php`, con `Http::timeout(2)` a `config('marketplace.python_url')/match` y fallback en PHP. El frontend de la demo calcula su propio ranking en JS (`domain/matching.js`). **La API v1 no lo usa.**
- El CANVAS de S4 dice que no se debe introducir como dependencia nueva, de modo que su papel en el plan vigente está por decidir.

### 6.2 `rules.json` [VERIFICADO]

Hay **4 copias idénticas** (MD5 `cf1ccc07f01ebea24839cab18f0f4cb4`), sincronizadas con `scripts/sync-rules.py`:
- `domain/rules.json`
- `python/api/rules.json`
- `backend/api/resources/domain/rules.json`
- `frontend/web/src/domain/rules.json`

| Parámetro | Valor en `rules.json` (versión 2) | Estado según las reglas formalizadas |
|---|---|---|
| `weights` | proximity 0,35; price 0,20; rating 0,30; experience 0,15 | **Confirmado** (35/20/30/15, suma 100) |
| `responseMinutes` | 10 | **Confirmado** (SLA 10 min) |
| `maxSimultaneous` | 3 | **Confirmado** (hasta 3 notificados) |
| `pendingHours` | 24 | **Confirmado** (sin reinicio: propuesta P12) |
| `ratingHours` | 48 | **Confirmado** (anclaje: P23 propuesto) |
| `maxExperienceYears` | **10** | **Pendiente P15** (Aref sin valor aprobado) |
| `secondaryZoneProximity` | **0,5** | **Pendiente P15** (Dref sin valor; RN-09 propone distancia entre centros de distrito) |
| `zones` | Huancayo, El Tambo, Chilca, Pilcomayo, Huancán | **P03** propone solo 3 |
| `specialties` / `subcategories` | 3 / 30 con `id` como `refrigeracion-vitrinas` | El catálogo v1 sembrado usa otros códigos (`catalog.csv`) |
| Factor del técnico nuevo (0,50) y umbral de 3 servicios | **No están** en `rules.json` | RN-08: 0,50 y 3 servicios (umbral confirmado; factor propuesto) |

---

## 7. Pruebas

### 7.a Ejecución real de hoy (09-10-2026) [VERIFICADO]

| Suite | Comando | Total | Aprobadas | Fallidas | Resultado |
|---|---|---:|---:|---:|---|
| Pest | `php artisan test` (MySQL 8.4 en Docker) | 62 | **62** | 0 | 714 aserciones, 60,45 s |
| Vitest | `npx vitest run` (frontend/web) | 38 (8 archivos) | **38** | 0 | 7,82 s |
| pytest | `python -m pytest -p no:cacheprovider` (python/api) | 4 | **4** | 0 | 12 avisos de deprecación (FastAPI con Python 3.14) |
| Cypress | `node scripts/run-sprint01-e2e.mjs` sin cambios | 11 previstas | **0** | — | **No se ejecutó: el arrancador falla antes de Cypress** (ver abajo) |

**Resúmenes de salida copiados:**

```
# Pest
  Tests:    62 passed (714 assertions)
  Duration: 60.45s

# Vitest
 Test Files  8 passed (8)
      Tests  38 passed (38)
   Duration  7.82s (transform 3.99s, setup 4.02s, collect 13.85s, tests 3.83s, environment 16.56s, prepare 2.55s)

# pytest
4 passed, 12 warnings in 0.45s

# Cypress (dos intentos, idénticos)
E2E usa exclusivamente tecnicoya_testing. No ejecutar Pest hasta que termine.
   INFO  Nothing to migrate.
   INFO  Seeding database.
  Database\Seeders\AuthorizationSeeder ..... DONE
  Database\Seeders\CatalogSeeder ........... DONE
El proceso terminó con código 3221225501.
```

> **Corrección posterior (09-10, después de esta auditoría):** la causa **no fue PHP**. Era la variable `ELECTRON_RUN_AS_NODE=1`, heredada de la terminal integrada de VS Code: con ella, `Cypress.exe` arranca como Node y muere con `0xC000001D` antes de imprimir nada. El arrancador usa la misma función `run()` para el seeder y para Cypress, por eso el último texto visible era el de `CatalogSeeder`. El seeder aislado termina con código 0. Sin la variable, el E2E pasa 11/11. Ver `evidencias/sprint-01/continuacion/DIAGNOSTICO-E2E-2026-10-09.md`; corregido en `scripts/run-e2e.mjs` (commit `fa6de02`, DEF-19). Los puntos siguientes reflejan lo que se creyó durante la auditoría.

**Por qué no corre Cypress (interpretación original, corregida arriba):**
- El código 3221225501 es `0xC000001D` (STATUS_ILLEGAL_INSTRUCTION). Se atribuyó a una caída de `php.exe` dentro de `db:seed --class=Sprint01E2ESeeder`, justo después de `CatalogSeeder`.
- Ocurre de forma reproducible (2 de 2 intentos).
- No es un fallo de prueba: Cypress nunca llega a arrancar.
- Descartado: `password_hash` bcrypt con coste 4 y 12 y `random_bytes` funcionan sueltos en el mismo PHP.
- No hay evento de fallo en el registro de aplicaciones de Windows.
- Había **0,5 GB de RAM libre de 7,8 GB**.
- La causa no se determinó durante la auditoría. Quedó como defecto nuevo **NEW-01** (ver la corrección arriba).
- La última ejecución verde de Cypress es la del **06-10 a las 20:21**: 11/11 en Chrome 154, en `tmp/sprint01-next-4-cypress.txt` (no versionado) y `evidencias/.../sprint01-next-3-cypress.txt` (versionado, 09:43) [DOCUMENTADO].

### 7.b Inventario de pruebas por archivo [VERIFICADO]

**Pest (`backend/api/tests/Feature`; `tests/Unit` solo tiene `.gitkeep`):**

| Archivo | Pruebas | ID | Sprint según el catálogo |
|---|---:|---|---|
| `AnnouncementsTest.php` | 5 | sin ID (nombres en inglés) | Histórico (prototipo `/api/actions`) |
| `MarketplaceTest.php` | 16 | sin ID (nombres en inglés) | Histórico (prototipo) |
| `Sprint01/ProvisionAdminTest.php` | 3 | `S01-SEC-ADMIN` (no está en el catálogo) | S1 (control de seguridad) |
| `Sprint01/TC002DuplicateEmailTest.php` | 1 | TC-002 | S1 |
| `Sprint01/TC003PendingTechnicianTest.php` | 1 | TC-003 | S1 |
| `Sprint01/TC004SelfActivationRejectedTest.php` | 1 | TC-004 | S1 |
| `Sprint01/TC006LogoutInvalidatesSessionTest.php` | 1 | TC-006 | S1 |
| `Sprint01/TC007AdminRouteDeniedTest.php` | 1 | TC-007 | S1 |
| `Sprint01/TC008PublicAdminSignupDeniedTest.php` | 1 | TC-008 | S1 |
| `Sprint01/TC009OwnProfileEditTest.php` | 1 | TC-009 | S1 |
| `Sprint01/TC010StaleWriteConflictTest.php` | 1 | TC-010 | S1 |
| `Sprint01/TC011RepeatableCatalogSeedTest.php` | 1 | TC-011 | S1 |
| `Sprint01/TC012CatalogApiTest.php` | 1 | TC-012 (en el catálogo es un caso **Cypress**; la prueba Pest es complementaria) | S1 |
| `Sprint01/TC137PasswordNeverExposedTest.php` | 1 | TC-137 | S1 |
| `Sprint02/TC015CreateSubcategoryTest.php` … `TC026NegativeRateTest.php`, `TC134ForeignAvailabilityOrRateTest.php` | 12 | TC-015, 016, 017, 018, 019, 020, 021, 023, 024, 025, 026, 134 | S2 |
| `Sprint03/TC029…TC038`, `TC119`, `TC120`, `TC121`, `TC126`, `TC127`, `TC129` | 15 | TC-029, 030, 031, 032, 034, 035, 036, 037, 038, 119, 120, 121, 126, 127, 129 | S3 |
| **Total** | **62** | 38 IDs TC distintos + 3 S01-SEC + 21 sin ID | — |

Soporte: `tests/Pest.php`, `tests/TestCase.php` y `tests/Support/Sprint01.php`, `Sprint02.php` y `Sprint03.php`. **No hay duplicados de ID ni IDs fuera de la matriz.**

**Cypress (`frontend/web/cypress/e2e/sprint-01/`):** 3 specs y 9 bloques `it`, que dan 11 ejecuciones porque TC-005 se repite para 3 roles.

| Spec | Caso | Sprint |
|---|---|---|
| `catalog.cy.js` | TC-012 muestra el catálogo real; TC-012 informa un fallo realista sin inventar catálogo | S1 |
| `portals.cy.js` | TC-001 registro por formulario; TC-005 login real ×3 roles; TC-006 cookie de sesión cerrada rechazada; S01-SEC-CSRF login sin CSRF rechazado | S1 |
| `validation.cy.js` | TC-001/TC-002 validación de registro y duplicado; TC-005 error de credenciales en español; TC-009/TC-010/TC-137 perfil, guardado y edición concurrente (409) | S1 |

**Vitest (`frontend/web/src`): 38 pruebas en 8 archivos, todas sobre el prototipo histórico, sin ID TC y con nombres en inglés.** Ninguna prueba las pantallas v1 de `features/administration`.

| Archivo | Pruebas | Qué prueba |
|---|---:|---|
| `domain/marketplace.test.js` | 8 | Demo y matching JS (paridad con Python y PHP, plazos de 10 min, 24 h y 48 h) |
| `Announcements.test.jsx` | 8 | Anuncios de la demo |
| `access.test.jsx` | 8 | `AccountPanel`, `Auth`, `marketplace-api` (sesión Bearer) |
| `scroll/scroll.test.jsx` | 5 | Secuencia de scroll de la landing |
| `VideoExperience.test.jsx` | 3 | Video del hero |
| `TechnicianProfile.test.jsx` | 2 | Perfil del técnico en la demo |
| `ServiceCarousel.test.jsx` | 2 | Carrusel de la landing |
| `forms.test.jsx` | 2 | `RequestForm` de `Marketplace.jsx` (demo) |

**pytest (`python/api/test_matching.py`):** `test_shared_fixture`, `test_filters_empty_and_validation`, `test_rating_breaks_score_ties` y `test_subcategory_filters_and_legacy_requests`. Todas son del matching histórico.

**k6 y carga:** **no encontrado** (sin scripts k6 en el repositorio). **Pruebas manuales:** no hay registros de ejecución.

### 7.c Tabla por sprint frente a la meta de 60 por sprint

**Definiciones:**
- «Diseñados» = casos de `Matriz-Trazabilidad-TC.csv` asignados al sprint y su herramienta.
- «Aut.» = pruebas automatizadas que existen.
- «Hoy» = ejecutadas y aprobadas hoy.
- La meta (documento de prompts) es ≥ 36 Pest + ≥ 14 Cypress + ≥ 10 Vitest = **60 por sprint**.
- Cypress se cuenta por bloque `it` distinto, no por repetición.
- Las pruebas históricas sin ID no se asignan a ningún sprint.

| Sprint | Diseñados (Pest / Cypress / otros) | Pest aut. / hoy | Cypress aut. / hoy (último verde) | Vitest aut. / hoy | pytest | k6 | Manual | **Total aprobado hoy** | Faltan Pest | Faltan Cypress | Faltan Vitest | **Faltan en total** |
|---|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| S1 | 13 (10 / 3 / 0) | 14 / 14 (11 TC + 3 S01-SEC) | 9 / **0** (9 el 06-10) | 0 / 0 | — | — | — | 14 (23 con el Cypress del 06-10) | 22 | 5 | 10 | **37** |
| S2 | 17 (13 / 4 / 0) | 12 / 12 | 0 / 0 | 0 / 0 | — | — | — | 12 | 24 | 14 | 10 | **48** |
| S3 | 24 (18 / 5 / 1 híbrido) | 15 / 15 | 0 / 0 | 0 / 0 | — | — | — | 15 | 21 | 14 | 10 | **45** |
| S4 | 23 (22 / 1 / 0) | 0 | 0 | 0 | — | — | — | 0 | 36 | 14 | 10 | **60** |
| S5 | 14 (12 / 2 / 0) | 0 | 0 | 0 | — | — | — | 0 | 36 | 14 | 10 | **60** |
| S6 | 14 (13 / 1 / 0) | 0 | 0 | 0 | — | — | — | 0 | 36 | 14 | 10 | **60** |
| S7 | 14 (14 / 0 / 0) | 0 | 0 | 0 | — | — | — | 0 | 36 | 14 | 10 | **60** |
| S8 | 21 (9 / 3 / 9: 2 carga, 2 manuales, 5 CI y operación) | 0 | 0 | 0 | — | 0 / 2 diseñados | 0 / 2 diseñados | 0 | 36 | 14 | 10 | **60** |
| Sin sprint (histórico) | — | 21 / 21 | — | 38 / 38 | 4 / 4 | — | — | 63 | — | — | — | — |
| **Total** | **140** (111 / 19 / 10) | **62 / 62** | **9 / 0** | **38 / 38** | **4 / 4** | **0** | **0** | **104** | **247** | **103** | **80** | **430** |

**Lectura:**
- Para la meta de 60 por sprint (480 en total) faltan **430 pruebas aprobadas**. Además, el catálogo solo tiene 140 casos diseñados, así que hay que **diseñar unos 340 casos nuevos**: unos 47 por sprint de media, y de 36 a 46 incluso en S2 y S3.
- 26 de los 140 casos están bloqueados o condicionados por decisiones pendientes y no cuentan hasta resolverlas.
- Para la meta del plan v2 (≥ 60 IDs Pest **en total**): hoy hay 37 IDs TC Pest que cuentan (38 menos TC-012, clasificado como Cypress), 62 pruebas Pest aprobadas y 714 aserciones. **Faltan 23** [VERIFICADO con los IDs de 7.b].
- Ninguna prueba usa todavía el formato `SNN-TC-NNN` propuesto. No existe el script `scripts/contar-pruebas-sprint`; solo `scripts/contar-casos-tc.php`, que cuenta IDs Pest y **sobrescribe `test-results/junit.xml`**, por eso no se ejecutó hoy.

### 7.d Cobertura y SonarQube

**Cobertura de Pest con PCOV [VERIFICADO hoy]:** **Total 95,9 %**. Se ejecutó `php -d pcov.enabled=1 vendor/pestphp/pest/bin/pest --coverage`, equivalente a `composer test:coverage` sin el `config:clear`. Clases por debajo del 90 %:

| Clase | % |
|---|---:|
| `Models\TechnicianProfile` | 50,0 |
| `Modules/FAdministration/Http/Controllers\AuthController` | 70,6 |
| `Services\Matching` (histórico; el fallo de Python no se prueba) | 75,0 |
| `Shared/Http\ApiExceptionRenderer` | 78,9 |
| `Modules/FAdministration/Application\RegisterAccount` | 80,0 |
| `Modules/FAdministration/Application\UpdateServices` | 83,3 |
| `Modules/ARequests/Http/Requests\SubmitServiceRequestRequest` | 85,7 |
| `Modules/FAdministration/Http/Controllers\MediaController` | 85,7 |

El último `clover.xml` guardado (06-10 21:35) daba 96,0 % (862/898 líneas) [DOCUMENTADO en la auditoría del 07-10].

**Otras coberturas:**
- **Vitest:** sin configurar.
- **Python:** `app.py` 100 % [DOCUMENTADO en la auditoría del 07-10].
- **Mutación** (`pest --mutate`): nunca ejecutada; no hay evidencia.

**SonarQube [VERIFICADO leyendo `sonar/analyses.json`, `gate.json`, `measures.json` y el log]:**

| Dato | Valor |
|---|---|
| Servidor | SonarQube Community Build 26.9.0.129388 (Docker, perfil `quality`, puerto 9000). Contenedores `tecnicoya-quality-sonarqube-1` y `sonar-db-1` en estado **Exited (255)** hoy |
| Análisis registrados | **1** (`total: 1`): 2026-10-06T20:31:08Z (15:31 de Lima), `projectVersion` sprint-01, **revisión `8997de8`** |
| Quality Gate | `OK` con `conditions: []`: primera línea base, sin condiciones evaluadas |
| Medidas | 2521 ncloc; **cobertura 0,0 %** (sin informe importado); 7 bugs (fiabilidad C), 107 code smells, 0 vulnerabilidades, 0 hotspots, duplicación 0,0 %, deuda 754 min |
| ¿Hay un análisis posterior sin commit? | **No.** Los `sprint01-next-4-sonar-*.txt` sin commit son la salida de ese mismo análisis (el log empieza a las 15:30:50 y es idéntico al de `tmp/`) |
| ¿Se analizó con cobertura después de `91242a4`? | **No hay evidencia.** `sonar-project.properties` ya apunta a `backend/api/test-results/clover.xml`, pero no hay un análisis posterior |
| Código de S2 y S3 en SonarQube | **Nunca analizado** |

---

## 8. Avance real de S1, S2 y S3

**Criterio de porcentaje** (propio y explícito), por HU:

| Componente | Peso |
|---|---:|
| Backend v1 (endpoint y caso de uso) | 40 % |
| Pantalla v1 | 30 % |
| Pruebas del catálogo implementadas y aprobadas (Pest y Cypress) | 20 % |
| Controles de la DoD y las adendas (alertas probadas, Gate del commit, evidencias, matriz) | 10 % |

La demo `localStorage` y la API histórica **no cuentan**, porque el CANVAS de S1 lo excluye expresamente.

### 8.1 Sprint 1: **≈ 88 %**

| HU | Endpoint o caso de uso | Pantalla v1 | Pruebas | Estado |
|---|---|---|---|---|
| S01-01 Registro de cliente | `POST /auth/register` · `RegisterAccount` | `SessionForm` (#cuenta) | Pest TC-002 ✓; Cypress TC-001, TC-001/002 (06-10 ✓, hoy no ejecutable) | Completo |
| S01-02 Alta de técnico pendiente | Igual + `technician_profiles` `pending_verification` | `SessionForm` (opción Técnico) + aviso de pendiente en `AccountApp` | Pest TC-003, TC-004 ✓ | Completo |
| S01-03 Sesión y cierre | `/auth/login`, `/auth/logout`, `GET /me`, `sessions` | `AccountApp` | Pest TC-006 ✓; Cypress TC-005 ×3, TC-006, S01-SEC-CSRF (06-10) | Completo |
| S01-04 Autorización efectiva | `role:`, `permission:`, `account.active`, `EffectivePermissions` | (acceso por rol en `AccountApp`) | Pest TC-007, TC-008 ✓ | Completo |
| S01-05 Perfil propio | `PATCH /me` con `version` (409) | `ProfileForm` | Pest TC-009, TC-010, TC-137 ✓; Cypress TC-009/010/137 (06-10) | Completo |
| S01-06 Catálogo y conexión | `GET /catalog/*` · `CatalogSeeder` | `Catalog` (#catalogo) | Pest TC-011, TC-012 ✓; Cypress TC-012 ×2 (06-10) | Completo |
| (seguridad) Aprovisionamiento del admin | `tecnicoya:provision-admin` | consola | Pest S01-SEC-ADMIN ×3 ✓ | Completo |

**Justificación del 88 %:** backend 40/40; pantallas 30/30; pruebas 20/20 (13/13 casos con prueba aprobada al menos una vez); DoD ≈ 0–4 de 10.

**Lo que falta para cerrar S1:**
1. ~~Arreglar el arrancador E2E (NEW-01)~~ Resuelto el 09-10: Cypress 11/11 (causa: `ELECTRON_RUN_AS_NODE`).
2. Análisis SonarQube con cobertura sobre el commit integrado de S1 y Gate con condiciones; el único Gate es el de `8997de8`, con cobertura 0 %.
3. Instanciar las familias `TC-AD-S01-*` por formulario (registro y perfil) con ID propio.
4. Pruebas Vitest de `features/administration` (hoy 0).
5. Llegar a 60: faltan 22 Pest, 5 Cypress y 10 Vitest.
6. Crear `docs/avances/<integrante>/sprint-01/avance.md` y `evidencias/sprint-01/calidad/`.
7. Corregir DEF-08 (2 botones sin `type` en `ProfileForm.jsx:40` y `SessionForm.jsx:53`) y DEF-10 (regex de correo).
8. Ejecutar la CI al menos una vez.
9. Commit de las evidencias pendientes (`INFORME.md` y `next-4-*`).

### 8.2 Sprint 2: **≈ 45 %**

| HU | Endpoint o caso de uso | Pantalla v1 | Pruebas | Estado |
|---|---|---|---|---|
| S02-01 Landing y carrusel (TC-013, 014 Cypress) | (estático) | Landing **histórica** con 5 `<section>` + carrusel + scroll; el CANVAS pide 10 secciones con CTA hacia el flujo v1 | Cypress 0/2; Vitest histórico (carrusel y scroll) | **Parcial** (≈ 30 %) |
| S02-02 Catálogo administrable (015, 016) | `POST`/`PATCH /admin/subcategories` · `ManageSubcategories`. **Falta** `/admin/specialties` y la foto del carrusel por API | **No** | Pest 015, 016 ✓ | **Parcial** (≈ 55 %) |
| S02-03 Comunicados por audiencia (017, 018) | `GET /announcements`, `POST /admin/announcements/{id}/duplicates`. **Falta** crear, editar y eliminar en v1 (solo en la API histórica) | **No** (la de `Announcements.jsx` es demo) | Pest 017, 018 ✓ | **Parcial** (≈ 45 %) |
| S02-04 Verificación administrativa (019, 020) | `POST /admin/technicians/{id}/reviews`, control de `GET /media/{id}`. **Falta** la subida de documentos (`/technicians/me/documents`) | **No** | Pest 019, 020 ✓ | **Parcial** (≈ 50 %) |
| S02-05 Perfil y portafolio (021, 022*) | `POST /technicians/me/portfolio`, `GET /technicians/{id}/portfolio`. **Falta** `/technicians/me/profile` | **No** | Pest 021 ✓; TC-022 bloqueado (P17) | **Parcial** (≈ 45 %) |
| S02-06 Disponibilidad, zona y pausa (023, 024; 135 Cypress) | `PUT /technicians/me/availability` (franjas, distritos y pausa) | **No** | Pest 023, 024 ✓; Cypress 135 no | **Parcial** (≈ 55 %) |
| S02-07 Servicios y tarifas (025, 026; 131 Cypress; 134) | `PUT /technicians/me/services` con `service_rate_versions` | **No** | Pest 025, 026, 134 ✓; Cypress 131 no | **Parcial** (≈ 55 %) |

**Justificación:** backend ≈ 32/40 (faltan especialidades, distritos, CRUD de comunicados, documentos y perfil); pantallas 0/30 (solo landing histórica); pruebas 12/17 casos ≈ 14/20; DoD ≈ 0/10.

**Lo que falta para cerrar S2:**
1. Pantallas v1 de administración (catálogo, comunicados y revisión) y del técnico (perfil, portafolio, disponibilidad, zona, pausa, servicios y tarifas) con alertas y confirmación.
2. Endpoints que faltan del contrato RT-03.
3. Landing de 10 secciones con CTA hacia el flujo v1.
4. Cypress TC-013, 014, 131 y 135 y las familias TC-AD-S02.
5. Vitest de las nuevas pantallas.
6. Resolver P17 (TC-022), P03 (distritos), P22 (rechazo de verificación) y ratificar los nombres de permisos.
7. Actualizar la matriz: 12 casos que pasan siguen en `NO EJECUTADO`.
8. Análisis SonarQube del commit de S2.
9. Llegar a 60: faltan 24 Pest, 14 Cypress y 10 Vitest.

### 8.3 Sprint 3: **≈ 40 %**

| HU | Endpoint o caso de uso | Pantalla v1 | Pruebas | Estado |
|---|---|---|---|---|
| S03-01 Solicitud en cinco pasos (027, 028 Cypress; 119, 120, 121, 124, 125) | `POST /requests` (borrador `registered`), `PATCH /requests/{id}` con versión · `ManageServiceRequests` | **No** (el `RequestForm` de la demo no es v1) | Pest 119, 120, 121 ✓; Cypress 027, 028, 124, 125 no | **Parcial** (≈ 45 %) |
| S03-02 Evidencias privadas (029, 030; 127, 128, 129, 130*) | `POST`/`DELETE /requests/{id}/attachments`, `AttachableEvidence` | **No** | Pest 029, 030, 127, 129 ✓; Cypress 128 no; TC-130 bloqueado (P17) | **Parcial** (≈ 50 %) |
| S03-03 Tarifa y ubicación (031, 032) | Tarifa referencial y cobertura en `store`/`show` | **No** | Pest 031, 032 ✓ | **Parcial** (≈ 55 %) |
| S03-04 Búsqueda y perfil público (033, 034) | `GET /technicians/{id}` (sin datos privados) ✓; **`GET /technicians` (búsqueda con filtros) no existe** | **No** | Pest 034 ✓; TC-033 sin prueba (depende de calificaciones de S6, P07 y P15) | **Parcial** (≈ 30 %) |
| S03-05 Solicitud desde el perfil (035, 036) | `source=profile`, `target_technician_id`, `TargetTechnicianOffers` | **No** | Pest 035, 036 ✓ | **Parcial** (≈ 55 %) |
| S03-06 Mis solicitudes y envío repetido (037, 038; 122*, 123*, 126) | `GET /requests`, `GET /requests/{id}`, `POST /requests/{id}/submission` idempotente (`registered` → `sent`) | **No** | Pest 037, 038, 126 ✓; TC-122 (P10) y TC-123 (P17) bloqueados | **Parcial** (≈ 55 %) |

**Justificación:** backend ≈ 33/40 (falta la búsqueda); pantallas 0/30; pruebas 15 de 24 casos ≈ 12/20 (3 bloqueados); DoD ≈ 0/10. Los tiempos de RNF-05 (mediana ≤ 3 min) no se han medido.

**Lo que falta para cerrar S3:**
1. `GET /api/v1/technicians` con filtros de rubro, subcategoría, zona y calificación mínima, mostrando la ausencia de reseñas.
2. Pantallas v1:
   - asistente de 5 pasos con retroceso sin pérdida;
   - subida y retiro de fotos con confirmación;
   - resumen con tarifa;
   - mis solicitudes;
   - detalle;
   - búsqueda;
   - perfil público con «Solicitar».
3. Cypress TC-027, 028, 124, 125 y 128 y las familias TC-AD-S03.
4. Vitest de los pasos y validaciones.
5. Resolver P10, P17 y P22 (los bloqueados TC-122, 123 y 130).
6. Actualizar la matriz: 15 casos que pasan siguen en `NO EJECUTADO`.
7. Análisis SonarQube.
8. Llegar a 60: faltan 21 Pest, 14 Cypress y 10 Vitest.

---

## 9. Defectos y deuda

### 9.0 Origen de la numeración DEF-01 a DEF-18

**No se encontró ningún registro completo DEF-01..DEF-18.** Se buscó en el repositorio (`.md`, `.csv`, `.txt`, `.json` y el Word de `informe-final`) y en todos los `.docx` y `.md` de `C:\Users\<usuario>`, excepto `AppData`.

- Solo aparecen referencias sueltas en `Downloads\Prompts_TecnicoYa_ClaudeCode_Codex.docx`: DEF-08, 10, 11, 12, 13, 14, 17 y 18.
- La tabla vacía DEF-01..04 de la plantilla está en `Proyecto_final_TecnicoYa_Cap1-13.docx`.
- El otro asistente debió de numerarlos en un informe que no está en este equipo.

Abajo se verifican los ocho conocidos y se añaden los defectos que esta auditoría comprueba. **Actualización:** la lista completa DEF-01..18 apareció después en otro documento; está verificada en 9.3.

### 9.1 DEF conocidos, verificados hoy

| ID | Descripción (según los prompts) | Verificación de hoy | Severidad sugerida |
|---|---|---|---|
| DEF-08 | 7 botones dentro de formularios sin `type` (Sonar `javascript:S9011`) | [VERIFICADO en `HALLAZGOS-SONAR.md`]: `ProfileForm.jsx:40`, `SessionForm.jsx:53` (v1), `AccountPanel.jsx:11`, `Announcements.jsx:38`, `Auth.jsx:5` y `Marketplace.jsx:53, 70` (histórico) | Baja |
| DEF-10 | Regex de correo con posible retroceso superlineal | [VERIFICADO] `features/administration/forms.jsx:18`: `^[^\s@]+@[^\s@]+\.[^\s@]+$`, sin límite de longitud | Baja/Media |
| DEF-11 | 3 avisos de `composer audit` | [VERIFICADO]: `laravel/framework` 12.68.0 **baja** (CVE-2026-102279, XSS en la página de depuración, corregido en ≥ 12.69.0); `league/commonmark` 2.10.0 **alta** (DoS cuadrático en tablas GFM, ≤ 2.10.1) y **media** (bypass de DisallowedRawHtml, ≤ 2.10.1). Sin paquetes abandonados | Alta (por commonmark) |
| DEF-12 | Motor de BD inconsistente | [VERIFICADO] (ver 4.7): pruebas en MySQL 8.4; `.env.example`, `config/database.php`, `infrastructure/docker-compose.yml` y **el Dockerfile de la API (solo `pdo_pgsql`)** en PostgreSQL; `.env` local en SQLite [DOCUMENTADO] | Alta |
| DEF-13 | Contenedores como root | [VERIFICADO] **Parcialmente cierto**: la API ya usa `USER www-data`; **matching (`python:3.12-slim`) y web (`node:22-alpine`) no tienen `USER`** y corren como root. Además, la API arranca con `php artisan serve` (servidor de desarrollo) en el contenedor | Media |
| DEF-14 | `firebase/php-jwt` posiblemente sin uso | [VERIFICADO]: **ninguna referencia** en `app/`, `config/`, `routes/`, `database/` ni `tests/`. El token histórico usa SHA-256 propio. Se puede retirar | Baja |
| DEF-17 | Correo personal publicado en `sonar/issues.json` (commit `d361c63`) | [VERIFICADO] que el commit `d361c63` existe, está en `origin/main` y que **el repositorio es público**. El contenido no se abrió (114 apariciones según la auditoría del 07-10) [OCULTO] | **Crítica (privacidad)** |
| DEF-18 | 7 vulnerabilidades npm (2 críticas, 2 altas, 3 moderadas) | [VERIFICADO] (ver 5.5). Seis requieren subir Vite a 8 y Vitest a 5 (versiones mayores) | Alta (solo en desarrollo) |

### 9.2 Defectos y deuda nuevos o no numerados [VERIFICADO salvo indicación]

| ID propuesto | Hallazgo | Evidencia | Severidad sugerida |
|---|---|---|---|
| **NEW-01** | El arrancador E2E terminaba con `0xC000001D`. **Corregido el 09-10:** la causa era `ELECTRON_RUN_AS_NODE=1`, heredada de VS Code, no PHP (DIAGNOSTICO-E2E-2026-10-09.md; `fa6de02`; DEF-19) | 3 de 3 intentos con la variable; 11/11 sin ella | Cerrado |
| NEW-02 | **Códigos de alumno** en archivos versionados de un repositorio **público** | `fuentes/proyecto-final.pdf` (portada) e `informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx` [OCULTO] | **Alta (privacidad)** |
| NEW-03 | SonarQube: único análisis sobre `8997de8` (S1), cobertura importada 0 %, Gate sin condiciones; S2 y S3 nunca analizados; contenedores de Sonar detenidos | `sonar/analyses.json` (total 1) | Alta (incumple RP-AD-03 en S1–S3) |
| NEW-04 | Código histórico activo en paralelo: modelo `requests`/`technicians`/`offers`, token `/api/*`, `MarketplaceController`, demo `#demo`, scheduler `marketplace:tick` **cada segundo**, comando `marketplace:admin` (crea un admin sin auditoría) | `routes/console.php`, `routes/api.php` y `docker/entrypoint.sh` | Media (riesgo de confusión y superficie de ataque) |
| NEW-05 | Matriz de trazabilidad desactualizada: 27 casos de S2 y S3 que pasan siguen en `NO EJECUTADO` | `Matriz-Trazabilidad-TC.csv` | Media |
| NEW-06 | Pantallas v1 de S2 y S3 inexistentes; esos flujos solo están en la demo | Sección 5.2 | Alta (para el cierre de S2 y S3) |
| NEW-07 | 0 pruebas Vitest sobre código v1; las 38 son del prototipo y tienen nombres en inglés | Sección 7.b | Media |
| NEW-08 | `rules.json` fija valores pendientes de P15 (`maxExperienceYears` 10 y `secondaryZoneProximity` 0,5) y 5 zonas frente a las 3 de P03 | Sección 6.2 | Media |
| NEW-09 | Sin CI efectiva: no hay `.github/workflows`; `.gitlab-ci.yml` apunta a un GitLab que no es el remoto; sin evidencia de ejecución | Sección 1.1 | Alta (la adenda P11-B exige Gate por PR) |
| NEW-10 | Proceso: un solo autor, una sola rama, sin PR, `docs/avances/` inexistente; protección de `main` [NO VERIFICABLE] | Sección 1 | Alta (incumple la adenda P10) |
| NEW-11 | Rutas `GET`/`PUT storage/{path}` expuestas por `filesystems.local.serve = true` | `route:list` | Baja (requieren firma; revisar si se usan) |
| NEW-12 | Archivos pesados o duplicados versionados: `habitación typing.mp4` (7,1 MB, duplicado en la raíz); PDF A04 = A03 y A16 = A15; PNG de 2–2,6 MB | Sección 1.4 | Baja |
| NEW-13 | Carpeta vacía `backend/api/frontend/web/cypress/e2e/sprint-01/` | Sección 4.7 | Baja |
| NEW-14 | `docs/documentacion/README.md` y la carpeta `sprints/S01..S04` describen un plan obsoleto (PostgreSQL, 4–5 iteraciones) y pueden confundir a los agentes | Sección 2.a | Media (documental) |
| NEW-15 | Informe Word sin capítulos 13 (DEF real) y 14 (Implementación y monitoreo) en su versión más reciente | Sección 2.b | Alta (entregable académico) |
| NEW-16 | `contar-casos-tc.php` sobrescribe `test-results/junit.xml`; no hay contador por sprint y herramienta | Sección 7.c | Baja |

### 9.3 Lista completa DEF-01 a DEF-18 (añadido al terminar la auditoría)

Después de redactar 9.0 apareció `Downloads\Prompts_TecnicoYa_ClaudeCode_Codex_v2.docx` (09-10 02:15, posterior a este informe). Su prompt 1.3 enumera los 18 DEF «del informe Word». Esa lista es la fuente: **[DOCUMENTADO]**. La columna «Verificación de hoy» es propia.

| ID | Descripción (según el documento) | Sev. / estado declarado | Verificación de hoy |
|---|---|---|---|
| DEF-01 | `Auth.jsx` importaba `auth.css` inexistente | Alta / cerrado | [VERIFICADO] cerrado: existe `frontend/web/src/auth.css` y `Auth.jsx:4` lo importa |
| DEF-02 | `SESSION_DRIVER=array` perdía la sesión | Media / cerrado | [VERIFICADO] cerrado: `phpunit.xml:19` y el arrancador E2E usan `database` |
| DEF-03 | `Cypress.env()` eliminado en Cypress 16 | Media / cerrado | [VERIFICADO] cerrado: no hay `Cypress.env` en `cypress/` |
| DEF-04 | Espera vencida en Electron al recargar el portal del cliente | Media / cerrado | [NO VERIFICABLE] durante la auditoría porque Cypress no corría (NEW-01, ya resuelto: 11/11) |
| DEF-05 | Contenedor del scanner con `exec format error` | Baja / cerrado | [DOCUMENTADO] en `continuacion/INFORME.md:32`; el análisis del 06-10 terminó bien |
| DEF-06 | `GET /api/v1/technicians/{id}` respondía 404 | Alta / cerrado | [VERIFICADO] cerrado: la ruta existe y TC-034 pasa |
| DEF-07 | SonarQube con cobertura 0 % | Baja / **reabrir** | [VERIFICADO] **sigue abierto**: el único análisis tiene cobertura 0,0 % (= NEW-03) |
| DEF-08 | 7 botones sin `type` | Media / abierto | [VERIFICADO] abierto (ver 9.1) |
| DEF-09 | Complejidad cognitiva alta | Media / abierto | [DOCUMENTADO]; no se abrió `issues.json` para comprobarlo |
| DEF-10 | Regex del correo con retroceso superlineal | Media / abierto | [VERIFICADO] abierto (`forms.jsx:18`) |
| DEF-11 | 3 avisos de `composer audit` | Alta / abierto | [VERIFICADO] abierto (1 alto, 1 medio, 1 bajo) |
| DEF-12 | Motor de base de datos inconsistente | Alta / abierto | [VERIFICADO] abierto; además, el Dockerfile de la API solo tiene `pdo_pgsql` |
| DEF-13 | Contenedores como root | Media / abierto | [VERIFICADO] **parcial**: la API ya usa `www-data`; matching y web siguen como root |
| DEF-14 | `firebase/php-jwt` sin uso | Baja / abierto | [VERIFICADO] abierto: no se usa en ninguna parte |
| DEF-15 | Commits sin publicar | Media / cerrado por renombre sin PR | [VERIFICADO] `main` = `origin/main`; sin PR |
| DEF-16 | Matriz sin los casos de S2 y S3 | Baja / abierto | [VERIFICADO] abierto: 27 casos que pasan siguen en `NO EJECUTADO` (= NEW-05) |
| DEF-17 | Datos personales publicados en el repositorio | Alta / abierto | [VERIFICADO] abierto, y **el repositorio es público**; incluye NEW-02 |
| DEF-18 | 7 vulnerabilidades npm | Alta / abierto | [VERIFICADO] abierto (2 críticas, 2 altas, 3 moderadas) |

**Duplicados al renumerar los NEW como DEF-19 en adelante:** NEW-03 = DEF-07, NEW-05 = DEF-16 y NEW-02 queda dentro de DEF-17.

---

## 10. Entorno del PC

[VERIFICADO el 09-10 a las 02:10]

| Herramienta | Versión o estado |
|---|---|
| Windows | 11 Home Single Language 10.0.26200 |
| PHP | 8.2.12 (XAMPP, `C:\xampp\php\php.exe`), con pcov |
| Composer | 2.10.3 |
| Node | v24.19.0 |
| npm | 11.17.0 |
| Python | 3.14.7 |
| Docker | 29.8.0 (Docker Desktop en `%LOCALAPPDATA%\Programs\DockerDesktop`). **Estaba detenido**; se arrancó para esta auditoría y **sigue en marcha** |
| Git | 2.55.0.windows.5 |
| gh (GitHub CLI) | **No instalado** (no está en PATH), así que no se puede comprobar si está autenticado |
| Chrome | 156.0.8078.12 (la última evidencia de Cypress usó Chrome 154) |
| Edge | 154.0.4258.62 |
| Firefox | **No encontrado**. TC-136 exige Chrome, Edge y Firefox |
| RAM | **0,5 GB libres de 7,8 GB**. SonarQube necesita unos 4 GB; dos slots de prueba en paralelo serán difíciles |
| Disco C: | **51,3 GB libres** (185 GB usados) |

**Contenedores y volúmenes Docker:**
- `tecnicoya-mysql-test`: se levantó y se bajó con `down`; el volumen se conserva.
- `tecnicoya-quality-sonarqube-1` y `tecnicoya-quality-sonar-db-1`: Exited (255).
- Volúmenes: `tecnicoya-mysql-test-data` y `tecnicoya-quality_*` (5), más uno anónimo.

**Puertos** (`netstat` en escucha):

| Puerto | Al empezar | Al terminar |
|---|---|---|
| 3000 | libre | libre |
| 3306 | libre (XAMPP MySQL **no** estaba en marcha) | libre |
| 3307 | libre | libre |
| 5173 | libre | libre |
| 5174 | libre | libre |
| 5175 | libre | libre |
| 8001 | libre | libre |
| 8002 | libre | libre |

Durante las pruebas, el 3306 lo ocupó el contenedor de pruebas. El slot B propuesto (3307/8002/5175) **no tiene archivo Compose**: `docker-compose.testing.yml` solo publica el 3306.

---

## 11. Resumen para planificar

**Avance real (09-10)**

| Sprint | Avance | Situación |
|---|---:|---|
| S1 | ≈ 88 % | Completo en API, pantallas y pruebas; Cypress 11/11 tras corregir NEW-01 |
| S2 | ≈ 45 % | API parcial y Pest 12/12; sin pantallas v1 |
| S3 | ≈ 40 % | API parcial (sin búsqueda) y Pest 15/15; sin pantallas v1 |
| S4–S8 | 0 % | Sin código v1 |

**Pruebas reales de hoy:**
- Pest 62/62 (714 aserciones; cobertura 95,9 %), Vitest 38/38 y pytest 4/4.
- Cypress 0: el arrancador se cae. La última ejecución verde fue 11/11 el 06-10.
- Las 38 Vitest, las 4 pytest y 21 de las 62 Pest son del prototipo histórico.

**Brechas frente a la meta de 60 por sprint (36 Pest, 14 Cypress y 10 Vitest)**

| Sprint | Pest | Cypress | Vitest | Total |
|---|---:|---:|---:|---:|
| S1 | 22 | 5 | 10 | 37 |
| S2 | 24 | 14 | 10 | 48 |
| S3 | 21 | 14 | 10 | 45 |
| S4–S8 | 36 cada uno | 14 cada uno | 10 cada uno | 60 cada uno |
| **Total** | **247** | **103** | **80** | **430** |

El catálogo tiene 140 casos (13/17/24/23/14/14/14/21) y 26 están bloqueados o condicionados: hay que **diseñar unos 340 casos más** con ID propio. Hoy no existe el contador por sprint y herramienta.

**Riesgos principales**

1. **Privacidad en un repositorio público:** un correo personal (`issues.json`, `d361c63`) y códigos de alumno (PDF y DOCX versionados). Borrarlos del árbol no los saca del historial.
2. ~~**Cypress no ejecutable**~~ Resuelto el 09-10: la caída se debía a `ELECTRON_RUN_AS_NODE` heredada de VS Code, no a PHP (NEW-01/DEF-19). Sigue el riesgo de memoria (0,5 GB libres) para dos slots en paralelo.
3. **Volumen de la meta:** 430 pruebas aprobadas por hacer y unos 340 casos por diseñar, sin rellenar. S2 y S3 además necesitan todas sus pantallas v1.
4. **Calidad no acreditada:** un solo análisis SonarQube (S1, cobertura 0 %); sin CI; sin PR; un único autor; sin `docs/avances`. Las adendas P10 y P11-B lo exigen por sprint.
5. **Doble sistema:** modelo y autenticación históricos activos (scheduler cada segundo, `/api/*` con Bearer, demo); motor de BD inconsistente (la imagen Docker de la API solo trae `pdo_pgsql`); 7 avisos npm (2 críticos) y 3 de Composer (1 alto).
6. **Informe:** el Word más reciente no tiene los capítulos 13 (defectos reales) ni 14 (Implementación y monitoreo, que exige despliegue en servidor en S8).

**Decisiones que debes tomar**

1. **DEF-17 y NEW-02:** hacer el repositorio privado ya, y decidir si se purga el historial (irreversible; obliga a todos a volver a clonar).
2. **Meta de pruebas:** confirmar que es «60 por sprint» (480) y no «60 Pest en total» (plan v2). Confirmar también si las pruebas históricas y las de seguridad sin TC cuentan.
3. **Código histórico:** retirar o archivar `/api/*`, la demo, `marketplace:tick`, `marketplace:admin` y `python/api`, o mantenerlos hasta S8. Decidir también si el matching de S4 se hace en Laravel (como dice el CANVAS) o en Python.
4. **Motor de BD único:** MySQL 8.4 en todos los entornos, ajustando Compose, `.env.example`, `config/database.php` y el Dockerfile.
5. **Pxx prioritarias para S3 y S4:** P10, P17 y P22 (desbloquean TC-122, 123 y 130) y P15, P12, P11 y P05/P16 (desbloquean S4). Ratificar también P03 (zonas) y los permisos `announcements.manage` y `technicians.verify`.
6. **Equipo:** asignar los módulos A–F a cada integrante, decidir la rama de integración y la protección de `main`, y elegir la plataforma de CI (GitHub Actions o el GitLab del laboratorio).
7. **Calendario:** fijar las fechas reales hasta la semana 12. Ningún documento las tiene.
8. **Entorno:** liberar RAM o aceptar un solo slot de pruebas; instalar Firefox (TC-136) y `gh` si se va a trabajar con PR.
