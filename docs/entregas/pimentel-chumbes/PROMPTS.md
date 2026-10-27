# Prompts utilizados · Pimentel Chumbes, James

**Área de responsabilidad:** Base de datos, Docker, integración, calidad y panel del administrador  
**Proyecto:** TécnicoYa Huancayo · Pruebas y Calidad de Software 2026-2 · Universidad Continental  
**PR principales del área:** #13 (cierre S2), #16 (seguridad Symfony), #17 (cierre S3), #18-#19 (retiro del prototipo), #26 (D-72), #28 (arrancador E2E), #32 (panel base), #33 (comunicados), #34 (usuarios y estadísticas), #35 (reconfirmar admin), #36 (cierre S4). Ramas feature/pimentel/...

Los prompts se ejecutaron con agentes de IA (Claude Code y Codex) sobre el repositorio; cada resultado se revisó en el navegador y se integró por pull request. Se agrupan por el área a la que pertenece el trabajo.

Las rutas personales se reemplazaron por `<carpeta-proyecto>`.

## Parte 1 · Prompts de los Sprints 1 a 4 (plan de trabajo)

### Prompt 0.1   CLAUDE CODE   Análisis integral de solo lectura

_Carpeta: Software TecnicoYa-Huancayo · Rama: main · Empieza: ahora · Resultado: CONTEXTO-COMPLETO-2026-10-09.md_

```text
Actúa como auditor técnico de solo lectura del proyecto TécnicoYa Huancayo. Carpeta raíz: <carpeta-proyecto>\Software TecnicoYa-Huancayo.
Necesito un informe completo y verificable del estado real para entregárselo a otro asistente que NO tiene acceso a esta carpeta. Con él va a reorganizar los 8 sprints (con 60 pruebas o más por sprint) y a escribir los prompts de trabajo para ti y para Codex. Todo lo que no escribas en el informe, ese asistente no lo sabrá.
 
REGLAS
- No modifiques, muevas ni borres ningún archivo existente. El único archivo nuevo es el informe. Sin commit ni push.
- No abras .env, .env.testing, .env.quality.local ni archivos con claves. Si aparece un dato sensible (clave, token, correo personal, código de alumno), escribe [OCULTO] con ruta y línea, nunca el valor. No abras docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json.
- Marca cada dato como [VERIFICADO] (comprobado con un comando o leyendo el archivo), [DOCUMENTADO] (lo afirma un documento) o [NO VERIFICABLE].
- Puedes iniciar el contenedor de pruebas (docker compose -f backend/api/docker-compose.testing.yml --env-file .env.testing up -d --wait, desde backend/api) para ejecutar las pruebas. No instales paquetes, no ejecutes migraciones contra la base de desarrollo y no toques el MySQL de XAMPP.
- No inventes. Si algo no existe, escribe «no encontrado» y dónde lo buscaste.
 
QUÉ ANALIZAR
1. Git: rama actual, remoto, ramas y worktrees, últimos 40 commits (hash, fecha, autor, mensaje), archivos sin commit, archivos pesados o con datos personales versionados.
2. Documentos e indicaciones:
   a) Lista todos los PDF y documentos de docs/documentacion (01 a 17, informe-final, fuentes, estado-del-arte, plan-de-pruebas, sprints, trazabilidad, editables) con 2 a 4 líneas sobre su contenido y si está vigente o es histórico (por ejemplo, el backlog de 10 iteraciones con PostgreSQL, Python y LLM).
   b) Indicaciones del docente: las 13 adendas de adendas-docente-2026-10-05 con el control que exige cada una por sprint; plantilla del informe y capítulos exigidos (indica si pide un capítulo 14); exigencias de pruebas (cantidad, herramientas, evidencias); fechas o semanas de entrega que aparezcan.
   c) Decisiones de negocio P01 a P23 de REGLAS-DE-NEGOCIO-FORMALIZADAS y del CANVAS de análisis: tabla con estado (confirmada, propuesta, pendiente), valor propuesto y qué sprint y casos bloquea cada una.
3. Plan de sprints vigente: resume CANVAS-Plan-Sprints-01-08 y cada CANVAS-Sprint-01 a 08 (objetivo, historias HU-S, RF/RNF, tareas por capa, rutas, casos TC asignados, decisiones pendientes, DoD). Señala contradicciones con otros planes (PDF de iteraciones, plan de pruebas v2, catálogo TC-001 a TC-140).
4. Backend (backend/api): versiones, paquetes, módulos de app/Modules, modelos, migraciones y tablas, seeders y factories, rutas con php artisan route:list --json (separa /api/v1 y /api histórico), middleware, roles y permisos sembrados, comandos, jobs, colas, scheduler y eventos (si existen), motor de base de datos por entorno (phpunit.xml, .env.example, config/database.php, docker-compose). Explica los dos modelos de datos y las dos autenticaciones y qué código usa cada uno.
5. Frontend (frontend/web): pantallas y rutas de la SPA; cuáles usan /api/v1, cuáles la demo localStorage y cuáles la API histórica; manejo de errores y alertas; textos que sigan en inglés; dependencias; resumen de npm audit --json (solo lectura).
6. Servicio Python y reglas: qué hace, quién lo llama, copias de rules.json, valores fijados frente a decisiones pendientes.
7. Pruebas (lo más importante):
   a) Ejecuta y reporta el resultado real de Pest (php artisan test), Vitest (npm test) y pytest. Cypress solo si node scripts/run-sprint01-e2e.mjs funciona sin cambios; si no, explica por qué. Copia los resúmenes de salida.
   b) Inventario de pruebas por archivo con su ID (TC-xxx u otro) y el sprint al que pertenece según el catálogo.
   c) Tabla por sprint S1 a S8: casos diseñados en el catálogo, automatizados, ejecutados y aprobados, por herramienta (Pest, Cypress, Vitest, pytest, k6, manual). Meta nueva: 60 o más pruebas automatizadas y aprobadas POR CADA sprint (36 Pest, 14 Cypress y 10 Vitest como mínimo). Calcula cuántas faltan por sprint y herramienta.
   d) Cobertura (composer test:coverage, si funciona) y estado de SonarQube: último análisis registrado y si hay un análisis posterior sin commit.
8. Avance real de S1, S2 y S3: tabla HU → endpoint o caso de uso → pantalla → pruebas → estado (completo, parcial, no iniciado), con porcentaje estimado y su justificación. Lista exacta de lo que falta para cerrar cada sprint.
9. Defectos y deuda: DEF-01 a DEF-18 del informe (composer audit, npm audit, SonarQube, contenedores como root, motor de base de datos, datos personales, código histórico) y cualquier defecto nuevo.
10. Entorno del PC: versiones de PHP, Composer, Node, npm, Docker, Git, gh (y si está autenticado), Chrome, Edge y Firefox; puertos ocupados entre 3000, 3306, 3307, 5173, 5174, 5175, 8001 y 8002; espacio libre en C:.
 
SALIDA
- Un único archivo: docs/documentacion/analisis-estado/CONTEXTO-COMPLETO-2026-10-09.md, con índice y las secciones 1 a 10 en ese orden.
- Sección final «11. Resumen para planificar», de una página como máximo: avance real, brechas por sprint, riesgos principales y decisiones que debo tomar.
- Al terminar, dime solo la ruta del archivo, su tamaño y los 5 hallazgos más importantes.
```

### Prompt 0.2   CODEX   Verificación cruzada del análisis (opcional)

_Carpeta: Software TecnicoYa-Huancayo · Rama: main · Empieza: cuando termine 0.1 · Resultado: VERIFICACION-CODEX-2026-10-09.md_

```text
Lee docs/documentacion/analisis-estado/CONTEXTO-COMPLETO-2026-10-09.md, escrito por otro agente. Tu trabajo es comprobar si es correcto, sin modificar nada del proyecto.
1. Elige 20 afirmaciones marcadas como [VERIFICADO] que sean importantes para planificar (conteos de pruebas, rutas, pantallas, migraciones, avance por sprint, defectos) y compruébalas tú con comandos o leyendo los archivos.
2. Revisa en especial la tabla de pruebas por sprint y la lista de lo que falta para cerrar S1, S2 y S3.
3. Reglas: no abras .env ni archivos con claves; no instales nada; no hagas commit.
Escribe el resultado en docs/documentacion/analisis-estado/VERIFICACION-CODEX-2026-10-09.md: tabla afirmación → resultado (correcta, incorrecta, imprecisa) → evidencia → corrección. Al final dime cuántas afirmaciones fallaron y cuáles cambian la planificación.
```

### Prompt 1.0   CLAUDE CODE   Reparar el arrancador de Cypress (PHP 0xC000001D)

_Carpeta: principal · Rama: main (solo diagnóstico) · Empieza: ahora, antes de 1.1_

```text
No abras .env, .env.testing ni claves; no hagas commit en main. El arrancador node scripts/run-sprint01-e2e.mjs falla 2 de 2 veces: PHP (C:\xampp\php\php.exe) termina con el código 3221225501 (0xC000001D, instrucción ilegal) en Sprint01E2ESeeder, después de CatalogSeeder y antes de abrir Cypress. El 06/10 a las 20:21 pasó 11/11, y Pest pasa 62/62 con el mismo PHP.
Diagnostica sin cambiar código ni php.ini hasta mostrarme la causa:
1. Levanta la base de pruebas desde backend/api: docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait. El contenedor se eliminó con down en el análisis anterior; el volumen se conserva.
2. Reproduce el seeder aislado con el mismo entorno que usa el arrancador (APP_ENV=testing y las variables del script), sin Cypress: php artisan db:seed --class=Sprint01E2ESeeder. Ubica la línea exacta donde muere el proceso.
3. Compara php -v, php -m y php --ini; si opcache.enable_cli o el JIT están activos; si el bloque [pcov] está activado; y qué extensiones carga el proceso lanzado por Node frente al de Pest. Prueba con -d opcache.enable_cli=0, con -d opcache.jit=off y con -n más solo las extensiones necesarias.
4. Revisa la memoria libre y el Visor de eventos de Windows (Application, Id 1000 y 1001) para ver qué módulo falló (php8ts.dll u otra extensión).
5. Revisa qué cambió desde el 06/10 20:21: php.ini frente al respaldo php.ini.bak-antes-pcov-2026-10-06, actualizaciones de Windows, XAMPP.
Dime la causa con su evidencia y la corrección propuesta. Si es un cambio de php.ini, guarda antes un respaldo con fecha y espera mi «sí». Al final ejecuta el arrancador completo y muéstrame el resumen de Cypress (debe volver a 11/11). Guarda el resultado en docs/documentacion/evidencias/sprint-01/continuacion/. Si el arreglo toca archivos del repositorio, hazlo en la rama feature/pimentel/f-administracion/s00-cypress y abre un PR.
```

### Prompt 1.1   CLAUDE CODE   Reglas comunes, plan maestro v3 y conteo por sprint

_Carpeta: principal · Rama: feature/pimentel/f-administracion/s00 · Empieza: terminó 1.0 · Resultado: AGENTS.md, CLAUDE.md, PLAN-MAESTRO-v3.md, script de conteo_

```text
Trabaja en una rama nueva feature/pimentel/f-administracion/s00 creada desde main actualizado (git switch main; git pull; git switch -c feature/pimentel/f-administracion/s00).
Vamos a desarrollar el resto del proyecto con dos agentes en paralelo: tú (Claude Code) para el backend y Codex para el frontend. Crea las reglas comunes y el plan maestro.
 
A) Crea AGENTS.md en la raíz con este contenido. Ajústalo solo si algo contradice el código actual y dime qué cambiaste:
# AGENTS.md · Reglas del proyecto TécnicoYa Huancayo
1. Proyecto: marketplace web que conecta clientes (MYPES y hogares de Huancayo) con técnicos de cómputo, refrigeración comercial y electricidad. Curso Pruebas y Calidad de Software, Universidad Continental. Equipo: Delgado (frontend), Mayhuasca (backend), Pimentel (base de datos, Docker e integración).
2. Stack vigente: React 18 + Vite (frontend/web); Laravel 12 con API /api/v1 y sesión Sanctum (backend/api); MySQL 8.4; Pest 3, Vitest, Cypress 16; SonarQube. Congelado (no se amplía; solo se mantienen sus pruebas hasta retirarlo en el Sprint 8): API /api/* con token, demo localStorage (#demo), servicio Python, PostgreSQL y el plan histórico de 10 iteraciones de los PDF 08 a 17.
3. Fuentes por prioridad: (1) docs/documentacion/sprints/DECISIONES.md; (2) REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md; (3) CANVAS-Sprint-0N.md; (4) docs/documentacion/plan-pruebas-v3; (5) el resto. Si dos fuentes se contradicen, detente y pregunta.
4. Reparto: Claude Code = backend (migraciones, modelos, casos de uso, API, permisos, colas, eventos) y pruebas Pest, catálogo de casos, contrato de API, integración, SonarQube y cierre de sprint. Codex = frontend (pantallas, estado, validaciones de cliente, alertas, accesibilidad) y pruebas Vitest y Cypress. No edites la carpeta del otro (backend/ o frontend/) salvo que el prompt lo indique; pide lo que necesites en tu archivo HANDOFF.
5. Ramas y carpetas (adenda P10): ramas feature/<integrante>/<módulo>/sNN, con integrante en minúsculas y sin tildes (delgado, mayhuasca, pimentel) y módulo a-solicitudes, b-matching, c-notificaciones, d-atencion, e-calificaciones o f-administracion; nunca se crea la rama sin /sNN. Claude Code trabaja en la carpeta principal con ramas de backend (feature/mayhuasca/…); Codex en ..\TecnicoYa-cx con ramas de frontend (feature/delgado/…); la configuración común usa feature/pimentel/…. Nunca commit ni push a main: main solo cambia por Pull Request integrado por el equipo. Push solo de tu rama feature y solo cuando el prompt lo pida. Prohibido push --force, reescribir historial publicado y git reset --hard sobre trabajo ajeno.
6. Commits: Conventional Commits con ámbito del sprint (feat(s04): …, test(s04): …, fix, docs, ci, refactor, chore). Un cambio lógico por commit. TDD: primero el commit de pruebas en rojo, luego el de implementación en verde.
7. Pruebas: cada prueba empieza su nombre con su ID SNN-TC-NNN (ejemplo: it('S04-TC-017 rechaza la aceptación después del SLA')); si deriva del catálogo base, agrega [TC-0xx]. Meta: 60 o más IDs distintos ejecutados y aprobados por sprint (mínimo 36 Pest, 14 Cypress, 10 Vitest). Los casos bloqueados por una decisión pendiente se marcan skip con motivo y no cuentan. Un dataset cuenta como varios casos solo si cada fila tiene su propio ID y resultado esperado distinto. Prohibido: pruebas sin aserción relevante, duplicadas o que siempre pasan; sleep; reintentos que oculten fallos; cambiar una prueba para que pase sin explicarlo. Plazos con reloj controlado (travel o Carbon::setTestNow, cy.clock, vi.useFakeTimers). Solo datos sintéticos. Las pruebas del prototipo histórico (Vitest de la demo, pytest y las Pest de MarketplaceTest y AnnouncementsTest) se mantienen como regresión pero no cuentan para la meta.
8. Definición de terminado (adendas del docente): alertas de éxito y de error en cada operación CRUD, con su prueba automatizada; doble validación (cliente y servidor); textos y mensajes en español; confirmación antes de eliminar; accesibilidad básica (labels, teclado, foco visible, botones con type); permisos verificados en el servidor con prueba negativa; auditoría de acciones sensibles; cobertura de 70 % o más en el módulo del sprint; Quality Gate de SonarQube aprobado; sin vulnerabilidades críticas o altas nuevas (composer audit, npm audit); evidencias guardadas.
9. Seguridad y privacidad: no abras ni imprimas .env, .env.testing, .env.quality.local ni claves; no versiones secretos; no pongas correos, nombres reales, códigos de alumno ni datos personales en evidencias (anonimiza los exportes de SonarQube); para pruebas usa solo bases que terminen en _testing; no toques el MySQL/MariaDB de XAMPP; no actualices dependencias con composer -W ni npm audit fix --force sin permiso.
10. Decisiones pendientes (P01 a P23): no inventes valores. Propón dos opciones con tu recomendación, espera la decisión y regístrala en DECISIONES.md con fecha y quién decidió.
11. Evidencias: docs/documentacion/evidencias/sprint-NN/ (rojo, verde, cobertura, mutación, vitest, cypress, calidad, audit), cada archivo con fecha y hash del commit. Avance individual (adenda P10): docs/avances/<integrante>/sprint-NN/avance.md con integrante, sprint, módulo, HU/RF y tarea, cambios y archivos, rama, commit/PR, pruebas previstas y ejecutadas, enlace a SonarQube, revisor, fecha, pendientes y enlace a decisiones. Registro de uso de IA en ese avance: herramienta y modelo, fecha, qué se aceptó, qué se corrigió y quién lo revisó. No rellenes revisores ni aprobaciones: deja [PENDIENTE] para que el integrante lo complete.
12. Relevo: al terminar cada tarea, o si te vas a quedar sin límite de uso, actualiza tu archivo docs/documentacion/sprints/HANDOFF-claude.md o HANDOFF-codex.md con fecha, rama, commits, pruebas (aprobadas y fallidas), qué falta, bloqueos y pedidos al otro agente. Al empezar, lee los dos.
12b. Memoria del PC: solo una corrida de Cypress a la vez (respeta el archivo de bloqueo del arrancador E2E); SonarQube solo en el cierre del sprint.
13. Comandos: backend desde backend/api con C:\xampp\php\php.exe; base de pruebas con docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait; frontend desde frontend/web con npm test y npm run build; E2E con node scripts/run-e2e.mjs --sprint NN (cuando exista).
14. Comunicación: responde en español y breve. Al terminar, di qué archivos cambiaste, qué comandos ejecutaste con su resultado real y qué debo hacer yo.
 
B) Crea CLAUDE.md con una sola línea @AGENTS.md (y una nota de que tú eres el agente de backend) para que leas las mismas reglas.
C) Crea docs/documentacion/sprints/ con HANDOFF-claude.md, HANDOFF-codex.md (plantilla vacía) y DECISIONES.md (tabla: ID, decisión, opción elegida, fecha, quién decidió; carga como «pendiente» las P01 a P23 y la asignación de módulos por integrante de la adenda P10). Crea también docs/avances/README.md con la convención de la adenda P10 (sin carpetas de sprint vacías).
D) Crea docs/documentacion/plan-pruebas-v3/PLAN-MAESTRO-v3.md: los 8 sprints con su objetivo e historias (de los CANVAS vigentes), estado real de S1 a S3, meta de 60 pruebas por sprint con el reparto por herramienta, esquema de IDs SNN-TC-NNN y su relación con TC-001 a TC-140, reparto Claude Code / Codex, flujo de un sprint (N.1 a N.6) y calendario con fechas [COMPLETAR]. Marca los PDF 08 a 17 como plan histórico que no prevalece.
E) Crea scripts/contar-pruebas-sprint.mjs: lee los reportes JUnit de Pest (--log-junit), Vitest (--reporter=junit) y Cypress (reporter junit), extrae los IDs SNN-TC-NNN y muestra por sprint y herramienta: IDs aprobados, fallidos y omitidos, y si el sprint llega a 60. Añade los scripts necesarios en composer.json y package.json para generar esos reportes. Pruébalo con las pruebas actuales (hoy usan TC-xxx: el script debe aceptar también ese formato y mapearlo al sprint con el catálogo).
 
Muéstrame primero el borrador de AGENTS.md (solo los cambios respecto al texto dado) y el índice de PLAN-MAESTRO-v3. Espera mi confirmación. Después escribe todo, haz commit «chore(s00): reglas comunes de agentes, plan maestro v3 y conteo por sprint» y push de la rama. Abre el PR hacia main con gh; si gh no está autenticado, dame el título y la descripción del PR.
```

### Prompt 1.2   CLAUDE CODE   Dos entornos de prueba en paralelo y carpeta de Codex

_Carpeta: principal · Rama: feature/pimentel/f-administracion/s00-entornos (desde main con 1.1 integrado) · Empieza: integraste el PR de 1.1_

```text
Lee AGENTS.md. Necesito que Claude Code y Codex puedan ejecutar pruebas al mismo tiempo sin compartir base de datos ni puertos. Hoy hay una sola base (tecnicoya_testing en 127.0.0.1:3306) y el arrancador E2E usa los puertos 8001 y 5174 fijos.
1. Haz que el entorno de pruebas admita dos slots seleccionados por una variable TECNICOYA_SLOT (A por defecto, B para Codex):
   - Slot A: contenedor tecnicoya-mysql-test, puerto 3306, base tecnicoya_testing, API E2E 8001, web E2E 5174.
   - Slot B: mismo contenedor y puerto, base tecnicoya_b_testing, API E2E 8002, web E2E 5175. Un solo contenedor MySQL para ahorrar memoria (el PC tiene 7,8 GB).
   Crea la segunda base con un script de inicialización versionado (docker-entrypoint-initdb.d) que dé permisos al mismo usuario sobre las dos bases. Como el volumen ya existe y esos scripts solo corren al crearlo, recrea el volumen de pruebas (sus datos son desechables) y avísame antes de hacerlo.
   Usa variables en phpunit.xml y en el arrancador sin forzar valores que impidan sobrescribirlos desde el entorno. La protección de TestCase (base terminada en _testing) debe seguir funcionando.
2. Generaliza scripts/run-sprint01-e2e.mjs a scripts/run-e2e.mjs con --sprint NN y el slot (puertos, base y seeders por sprint). El seeder E2E hoy exige exactamente la base tecnicoya_testing: acéptalo también para tecnicoya_b_testing, manteniendo la protección de bases que terminan en _testing. Agrega un bloqueo global en tmp/ para que nunca corran dos Cypress a la vez, aunque sean de slots distintos. Conserva el script anterior como envoltura para no romper la evidencia del Sprint 1.
3. Crea la carpeta de Codex como worktree hermano: git worktree add ..\TecnicoYa-cx main. No copies archivos .env.
4. Escribe docs/documentacion/sprints/ENTORNO-PARALELO.md con los pasos que debo hacer yo: copiar a mano backend/api/.env.testing a la carpeta de Codex y ajustar sus valores para el slot B (dime qué claves cambiar, sin mostrarme valores), composer install y npm ci en la carpeta de Codex, y cómo arrancar cada slot.
5. Verifica con el slot A: la suite Pest completa y el E2E del Sprint 1 siguen pasando. Para el slot B, deja los comandos listos; lo verificaremos después de que copie su .env.testing.
Commit «ci(s00): entornos de prueba en paralelo por slot», push de la rama y PR. Dime qué tengo que hacer a mano.
```

### Prompt 1.3-B   CLAUDE CODE   Ejecutar la purga del historial (solo si lo decides)

_Carpeta: principal · Rama: main · Empieza: cuando todos los PR estén integrados y nadie tenga trabajo sin subir_

```text
Lee docs/documentacion/sprints/PURGA-HISTORIAL.md. Confirmo que quiero purgar del historial los archivos con datos personales listados en el plan. Los integrantes no tienen trabajo sin subir y la protección de main está desactivada temporalmente.
1. Haz el respaldo con git clone --mirror en una carpeta fuera del proyecto y dime su ruta.
2. Ejecuta la purga del plan sobre esos archivos únicamente. Verifica con git log --all -- <ruta> que ya no aparece y que el resto del historial conserva los mismos mensajes.
3. Muéstrame el resumen (commits reescritos, hashes nuevos de los commits de evidencia) y espera mi «sí» antes del push forzado.
4. Después del push, actualiza en el repositorio los documentos que citen hashes antiguos (evidencias, informes) con una tabla hash antiguo → hash nuevo, y dime qué capítulos del informe Word tengo que actualizar.
```

### Prompt 1.5   MANUAL   Tareas manuales del equipo

_Quién: James (y los integrantes) · Empieza: durante la Fase 1_

```text
0. HOY: GitHub → Settings → General → Danger Zone → Change visibility → Private. El repositorio es público y expone un correo y códigos de alumno. Si el docente necesita verlo, agrégalo como colaborador.
1. GitHub → Settings → Branches: protege main (Pull Request obligatorio, una aprobación, sin push directo).
2. Agrega a Delgado y Mayhuasca como colaboradores. Cada uno configura su identidad: git config user.name y user.email en su equipo.
3. Integra los PR de 1.0 a 1.7 después de revisarlos (puedes pedir la revisión cruzada R.3 y R.4).
4. Copia backend/api/.env.testing a la carpeta TecnicoYa-cx y ajústalo para el slot B, siguiendo ENTORNO-PARALELO.md.
5. Purga del historial (DEF-17): lee PURGA-HISTORIAL.md. Es irreversible y obliga a todos a volver a clonar. Si decides hacerla, usa el prompt 1.3-B; si no, como mínimo deja el repositorio privado mientras dure el curso.
6. Responde la hoja de decisiones del prompt 1.6 (P01 a P23 y asignación de módulos por integrante). Mínimo, antes del cierre de S1 a S3: P03, P10, P17, P20 y P22.
7. Crea %USERPROFILE%\.wslconfig con [wsl2] y memory=3GB y ejecuta wsl --shutdown antes de abrir Docker Desktop.
8. Instala Firefox (lo exige TC-136) y GitHub CLI (winget install GitHub.cli, luego gh auth login) para que los agentes puedan abrir los PR.
```

### Prompt 1.6   CLAUDE CODE   Hoja de decisiones P01 a P23

_Carpeta: principal · Rama: feature/pimentel/f-administracion/s00-decisiones · Empieza: en paralelo con 1.2 a 1.4_

```text
Lee AGENTS.md, DECISIONES.md, REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md, el CANVAS de análisis y la sección de decisiones de CONTEXTO-COMPLETO-2026-10-09.md.
Prepara docs/documentacion/sprints/HOJA-DE-DECISIONES.md para que el equipo decida todo en una sola reunión:
1. Una fila por decisión P01 a P23: pregunta en lenguaje simple, valor propuesto si existe, 2 o 3 opciones con su efecto, tu recomendación con una línea de justificación, sprint y casos que desbloquea, y una columna «Decisión del equipo» vacía.
2. Ordénalas por urgencia: primero las que bloquean el cierre de S1 a S3, después las del Sprint 4 y luego el resto.
3. Agrega tres decisiones más: asignación de los módulos A a F por integrante (adenda P10), matching en PHP dentro de Laravel o en el servicio Python, y qué hacer con el prototipo histórico (/api/*, demo y pytest) y cuándo retirarlo.
4. No inventes valores de mercado (tarifas, distancias, montos) ni los presentes como confirmados.
Commit «docs(s00): hoja de decisiones», push y PR. Cuando te pase las respuestas del equipo, regístralas en DECISIONES.md con fecha y «decidido por el equipo (Delgado, Mayhuasca y Pimentel)», actualiza REGLAS-DE-NEGOCIO-FORMALIZADAS y quita el bloqueo de los casos afectados.
```

### Prompt 1.7   CLAUDE CODE   Quality Gate real en SonarQube

_Carpeta: principal · Rama: feature/pimentel/f-administracion/s00-calidad · Empieza: integraste 1.3 y 1.4_

```text
Lee AGENTS.md. SonarQube tiene un solo análisis (commit 8997de8) con cobertura importada de 0 % y un Quality Gate que no evaluó ninguna condición (DEF-07 reabierto).
1. Arranca el perfil de calidad (infrastructure/docker-compose.quality.yml) y verifica la versión de SonarQube.
2. Crea un Quality Gate «TecnicoYa» asignado al proyecto, sobre código nuevo: cobertura ≥ 70 %, líneas duplicadas < 3 %, calificación A en confiabilidad, seguridad y mantenibilidad, y 100 % de security hotspots revisados. Documenta cómo lo creaste en docs/documentacion/calidad/QUALITY-GATE.md, sin tokens.
3. Define el periodo de código nuevo (por ejemplo, desde la versión del Sprint 3) y explica la elección.
4. Importa la cobertura real del backend (composer test:sonar con el Clover normalizado) y la del frontend (lcov de Vitest, del prompt 1.4). Verifica en el análisis que la cobertura ya no es 0 %.
5. Analiza main, exporta el resultado con scripts/exportar-sonar-anonimo.mjs a docs/documentacion/evidencias/sprint-00/calidad/ y detén los contenedores de SonarQube al terminar.
Dime el estado del Gate con cada condición y su valor. Commit, push y PR. Cierra DEF-07 en el registro solo si la cobertura importada es correcta.
```

```text
Elemento
Detalle
Objetivo
Acceso por identidad y permisos reales sobre la API v1 y MySQL, con perfiles mínimos y catálogo inicial reproducible.
Estado actual
Backend casi completo (registro, sesión, perfil con control de versión, permisos efectivos, aprovisionamiento de administradores, catálogo). Las pantallas de cuenta, perfil y catálogo ya usan /api/v1. Hay 11 pruebas Cypress y unos 30 IDs Pest del sprint. Avance ≈ 90 %.
Historias
HU-S01-01 a HU-S01-06 (RF-28, RF-33, RF-C01, RF-C06)
Casos del catálogo base
TC-001 a TC-012, TC-137 y los Cypress S01
Backend (Claude Code)
completar lo que falte de HU-S01-01 a 06; cuenta inactiva o suspendida bloqueada en todas las rutas v1; contraseña con bcrypt que nunca sale en /me, auditoría ni logs; límite de intentos de inicio de sesión; cierre de sesión que invalida la cookie; aprovisionamiento de administradores auditado; catálogo público solo con elementos activos.
Frontend (Codex)
registro de cliente y de técnico (queda Pendiente de verificación), inicio y cierre de sesión con redirección por rol, rutas protegidas por rol, perfil propio con aviso de conflicto 409, catálogo público, mensajes en español.
Enfoque de pruebas
tabla de decisión rol × ruta (cliente, técnico, administrador, anónimo, cuenta suspendida) para cada ruta v1 del sprint; valores límite de cada campo del registro y del perfil; CSRF y cookie HttpOnly; límite de intentos; mensajes en español; accesibilidad de los formularios.
Decisiones que debes tomar
P20 (un rol por cuenta), P22 (revisión rechazada), P03 (catálogo de distritos)
Meta de pruebas
≥ 60 IDs S01-TC aprobados: ≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest
```

### Prompt S1.6   CLAUDE CODE   Integración, conteo, SonarQube y cierre del sprint

_Carpeta: principal · Rama: feature/pimentel/f-administracion/s01-cierre (desde main) · Empieza: integraste los PR de S1.4 y S1.5_

```text
Lee AGENTS.md y los HANDOFF. Los PR del Sprint 1 ya están en main. Crea la rama feature/pimentel/f-administracion/s01-cierre desde main actualizado.
0. Inicia SonarQube solo para este paso y detenlo al terminar; no corras Cypress mientras Codex esté corriendo el suyo.
1. Regresión completa en el slot A: Pest, Vitest, pytest (mientras siga vigente) y Cypress de todos los sprints.
2. node scripts/contar-pruebas-sprint.mjs: el Sprint 1 debe tener 60 o más IDs S01-TC aprobados (con los mínimos por herramienta). Si no llega, dime cuántos faltan y de qué herramienta; no inventes casos.
3. Cobertura del backend y del frontend; SonarQube con scripts/run-quality.ps1 y su Quality Gate; composer audit y npm audit. Exporta el resultado de SonarQube con scripts/exportar-sonar-anonimo.mjs (sin correos ni nombres).
4. Si algo falla, no lo corrijas en esta rama: dime qué falla y en qué rama y por qué agente se corrige.
5. Actualiza: matriz de trazabilidad (historia → caso → resultado → commit), docs/documentacion/calidad/REGISTRO-DEFECTOS.md (DEF-xx nuevos con severidad, origen y estado), DECISIONES.md y docs/avances/pimentel/sprint-01/avance.md (integración y calidad).
6. Escribe docs/documentacion/sprints/INFORME-SPRINT-01.md con: alcance logrado frente al plan, tabla de pruebas por herramienta, métricas (tasa de aprobación, cobertura, mutación, densidad de defectos por KLOC, eficacia de corrección, deuda y Quality Gate de SonarQube), defectos abiertos, lista de capturas que debo tomar con el comando exacto para cada una, retrospectiva breve y un apartado «Datos para el informe» con lo que corresponde a los capítulos 8 y 11 a 14.
Commit «docs(s01): cierre del Sprint 1», push y PR. Dime el resultado de cada comando y si el sprint cumple la definición de terminado.
```

```text
Elemento
Detalle
Objetivo
Hacer visible la oferta del marketplace: landing, catálogo administrable, comunicados por audiencia, verificación de técnicos, perfil y portafolio, disponibilidad, zona, pausa, servicios y tarifas.
Estado actual
La API v1 tiene disponibilidad, servicios con versión de tarifa, portafolio, revisión técnica, alta y edición de subcategorías y duplicado de comunicados, con 12 pruebas Pest. No existe ninguna pantalla v1 del sprint: el flujo solo se ve en la demo. Avance ≈ 45 %.
Historias
HU-S02-01 a HU-S02-07 (RF-05, RF-07, RF-30, RF-33, RF-C01, RF-C02, RF-C04, RF-C06, RF-C08, RF-C09)
Casos del catálogo base
TC-013 a TC-026 y TC-131, TC-132, TC-134, TC-135
Backend (Claude Code)
verificar y completar los CRUD que falten: especialidades y subcategorías (activar y desactivar sin borrar, foto del carrusel), comunicados completos (crear, editar, eliminar, duplicar, audiencia, vigencia, vista previa), listado y ficha de técnicos para verificación con motivo, pausa temporal y zona o distritos del técnico, endpoint público para el carrusel de la landing.
Frontend (Codex)
landing conectada al catálogo v1 (carrusel por subcategoría, sin datos de la demo y con los códigos del catálogo sembrado); panel administrador: categorías y subcategorías, comunicados, verificación de técnicos; panel técnico: mi perfil y portafolio, disponibilidad y zona, servicios y tarifas, pausa; carrusel de comunicados en el inicio de cada rol.
Enfoque de pruebas
alertas CRUD (éxito, error 422 o 500 sin falso éxito, confirmación antes de borrar) en cada pantalla; transiciones de estado del técnico (Pendiente de verificación → Activo, Rechazado, Suspendido); valores límite de tarifas y franjas; franjas solapadas; un técnico no puede editar lo de otro; archivos del portafolio (tipo y tamaño, P17).
Decisiones que debes tomar
P03 distritos; P05/P16 duración de franjas y tarifas; P17 límites de archivos; P18 efectos de la suspensión; P19 cambios de catálogo sobre solicitudes; P22 rechazo de verificación
Meta de pruebas
≥ 60 IDs S02-TC aprobados: ≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest
```

### Prompt S2.6   CLAUDE CODE   Integración, conteo, SonarQube y cierre del sprint

_Carpeta: principal · Rama: feature/pimentel/f-administracion/s02-cierre (desde main) · Empieza: integraste los PR de S2.4 y S2.5_

```text
Lee AGENTS.md y los HANDOFF. Los PR del Sprint 2 ya están en main. Crea la rama feature/pimentel/f-administracion/s02-cierre desde main actualizado.
0. Inicia SonarQube solo para este paso y detenlo al terminar; no corras Cypress mientras Codex esté corriendo el suyo.
1. Regresión completa en el slot A: Pest, Vitest, pytest (mientras siga vigente) y Cypress de todos los sprints.
2. node scripts/contar-pruebas-sprint.mjs: el Sprint 2 debe tener 60 o más IDs S02-TC aprobados (con los mínimos por herramienta). Si no llega, dime cuántos faltan y de qué herramienta; no inventes casos.
3. Cobertura del backend y del frontend; SonarQube con scripts/run-quality.ps1 y su Quality Gate; composer audit y npm audit. Exporta el resultado de SonarQube con scripts/exportar-sonar-anonimo.mjs (sin correos ni nombres).
4. Si algo falla, no lo corrijas en esta rama: dime qué falla y en qué rama y por qué agente se corrige.
5. Actualiza: matriz de trazabilidad (historia → caso → resultado → commit), docs/documentacion/calidad/REGISTRO-DEFECTOS.md (DEF-xx nuevos con severidad, origen y estado), DECISIONES.md y docs/avances/pimentel/sprint-02/avance.md (integración y calidad).
6. Escribe docs/documentacion/sprints/INFORME-SPRINT-02.md con: alcance logrado frente al plan, tabla de pruebas por herramienta, métricas (tasa de aprobación, cobertura, mutación, densidad de defectos por KLOC, eficacia de corrección, deuda y Quality Gate de SonarQube), defectos abiertos, lista de capturas que debo tomar con el comando exacto para cada una, retrospectiva breve y un apartado «Datos para el informe» con lo que corresponde a los capítulos 8 y 11 a 14.
Commit «docs(s02): cierre del Sprint 2», push y PR. Dime el resultado de cada comando y si el sprint cumple la definición de terminado.
```

```text
Elemento
Detalle
Objetivo
El cliente describe, revisa y envía su solicitud en cinco pasos de forma segura y busca técnicos por especialidad, distinguiendo la búsqueda automática de la solicitud dirigida.
Estado actual
La API v1 de solicitudes está hecha (borrador, evidencias privadas, envío idempotente, solicitud inalterable después del envío) y también el perfil público del técnico, con 15 pruebas Pest. Faltan la búsqueda de técnicos con filtros y todas las pantallas. Avance ≈ 42 %.
Historias
HU-S03-01 a HU-S03-06 (RF-01 a RF-04, RF-33, RF-C02, RF-C06)
Casos del catálogo base
TC-027 a TC-038 y TC-119 a TC-130
Backend (Claude Code)
búsqueda de técnicos con filtros (especialidad, subcategoría, zona; la calificación mínima queda como estado vacío honesto hasta el Sprint 6) y paginación; solicitud dirigida desde el perfil; Mis solicitudes con filtro por estado; límites de texto y de fotos según P17.
Frontend (Codex)
asistente Nueva solicitud en 5 pasos (especialidad, subcategoría, descripción y fotos, ubicación, resumen y envío) con pantalla de espera honesta, sin asignaciones ficticias; aviso de resultado incierto si se pierde la respuesta (TC-125); Buscar técnicos con filtros; perfil público con portafolio; Solicitar servicio con el técnico precargado; Mis solicitudes con pestañas.
Enfoque de pruebas
idempotencia y doble clic en el envío; evidencias privadas (quién puede ver cada foto); la solicitud enviada no se edita; validaciones de cada paso con valores límite; navegar atrás y adelante en el asistente sin perder datos; teclado y foco en el asistente.
Decisiones que debes tomar
P03 cobertura; P05 franja inmediata; P10 máximo de solicitudes activas; P16; P17 evidencias y longitud de la descripción; P22 Registrada/Enviada
Meta de pruebas
≥ 60 IDs S03-TC aprobados: ≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest
```

### Prompt S3.6   CLAUDE CODE   Integración, conteo, SonarQube y cierre del sprint

_Carpeta: principal · Rama: feature/pimentel/a-solicitudes/s03-cierre (desde main) · Empieza: integraste los PR de S3.4 y S3.5_

```text
Lee AGENTS.md y los HANDOFF. Los PR del Sprint 3 ya están en main. Crea la rama feature/pimentel/a-solicitudes/s03-cierre desde main actualizado.
0. Inicia SonarQube solo para este paso y detenlo al terminar; no corras Cypress mientras Codex esté corriendo el suyo.
1. Regresión completa en el slot A: Pest, Vitest, pytest (mientras siga vigente) y Cypress de todos los sprints.
2. node scripts/contar-pruebas-sprint.mjs: el Sprint 3 debe tener 60 o más IDs S03-TC aprobados (con los mínimos por herramienta). Si no llega, dime cuántos faltan y de qué herramienta; no inventes casos.
3. Cobertura del backend y del frontend; SonarQube con scripts/run-quality.ps1 y su Quality Gate; composer audit y npm audit. Exporta el resultado de SonarQube con scripts/exportar-sonar-anonimo.mjs (sin correos ni nombres).
4. Si algo falla, no lo corrijas en esta rama: dime qué falla y en qué rama y por qué agente se corrige.
5. Actualiza: matriz de trazabilidad (historia → caso → resultado → commit), docs/documentacion/calidad/REGISTRO-DEFECTOS.md (DEF-xx nuevos con severidad, origen y estado), DECISIONES.md y docs/avances/pimentel/sprint-03/avance.md (integración y calidad).
6. Escribe docs/documentacion/sprints/INFORME-SPRINT-03.md con: alcance logrado frente al plan, tabla de pruebas por herramienta, métricas (tasa de aprobación, cobertura, mutación, densidad de defectos por KLOC, eficacia de corrección, deuda y Quality Gate de SonarQube), defectos abiertos, lista de capturas que debo tomar con el comando exacto para cada una, retrospectiva breve y un apartado «Datos para el informe» con lo que corresponde a los capítulos 8 y 11 a 14.
Commit «docs(s03): cierre del Sprint 3», push y PR. Dime el resultado de cada comando y si el sprint cumple la definición de terminado.
```

```text
Elemento
Detalle
Objetivo
Convertir una solicitud enviada en ofertas trazables y en una asignación elegida por el cliente, respetando elegibilidad, plazos, concurrencia y recuperación ante fallos.
Historias
HU-S04-01 a HU-S04-10 (RF-06 a RF-18, RF-29, RNF-07)
Casos del catálogo base
TC-039 a TC-058 y TC-140
Backend (Claude Code)
módulos BMatching y COffers: tabla versionada de reglas y pesos (cercanía 35 %, tarifa 20 %, historial 30 %, experiencia 15 %; deben sumar 100 %) leída por versión vigente, no desde rules.json; filtro de elegibilidad (especialidad y subcategoría activas, técnico verificado y activo, disponible en la franja, sin pausa); puntuación y desempate por calificación; tratamiento del técnico nuevo; ronda de hasta 3 ofertas; SLA de 10 minutos con colas y scheduler; reasignación automática; Pendiente de disponibilidad por 24 h y expiración; elección del cliente con bloqueo para impedir la doble asignación; eventos en tiempo real con Reverb; reintentos de notificación (máximo 3).
Frontend (Codex)
técnico: solicitudes entrantes con cronómetro del SLA, aceptar y rechazar; cliente: espera, ofertas recibidas, elegir técnico, aviso de Pendiente de disponibilidad; actualización en tiempo real con Laravel Echo y recuperación del estado al reconectar.
Enfoque de pruebas
valores límite de tiempo con reloj controlado (9:59, 10:00 y 10:01 min; 23:59 y 24:00 h); tabla de decisión de elegibilidad; puntuación con datos sintéticos y resultado esperado calculado a mano; concurrencia (dos aceptaciones o dos elecciones simultáneas); idempotencia de los jobs; reintentos; nadie ve ofertas ajenas; matching en 3 s o menos (RNF-01) como prueba de rendimiento básica.
Decisiones que debes tomar
P05/P16; P11 momento y plazo de la elección; P12 fronteras temporales y avisos; P15 normalización, referencias de distancia y experiencia, empate residual; P19 vigencia de reglas. Además: matching en PHP dentro de Laravel o seguir con el servicio Python
Meta de pruebas
≥ 60 IDs S04-TC aprobados: ≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest
```

### Prompt S4.6   CLAUDE CODE   Integración, conteo, SonarQube y cierre del sprint

_Carpeta: principal · Rama: feature/pimentel/b-matching/s04-cierre (desde main) · Empieza: integraste los PR de S4.4 y S4.5_

```text
Lee AGENTS.md y los HANDOFF. Los PR del Sprint 4 ya están en main. Crea la rama feature/pimentel/b-matching/s04-cierre desde main actualizado.
0. Inicia SonarQube solo para este paso y detenlo al terminar; no corras Cypress mientras Codex esté corriendo el suyo.
1. Regresión completa en el slot A: Pest, Vitest, pytest (mientras siga vigente) y Cypress de todos los sprints.
2. node scripts/contar-pruebas-sprint.mjs: el Sprint 4 debe tener 60 o más IDs S04-TC aprobados (con los mínimos por herramienta). Si no llega, dime cuántos faltan y de qué herramienta; no inventes casos.
3. Cobertura del backend y del frontend; SonarQube con scripts/run-quality.ps1 y su Quality Gate; composer audit y npm audit. Exporta el resultado de SonarQube con scripts/exportar-sonar-anonimo.mjs (sin correos ni nombres).
4. Si algo falla, no lo corrijas en esta rama: dime qué falla y en qué rama y por qué agente se corrige.
5. Actualiza: matriz de trazabilidad (historia → caso → resultado → commit), docs/documentacion/calidad/REGISTRO-DEFECTOS.md (DEF-xx nuevos con severidad, origen y estado), DECISIONES.md y docs/avances/pimentel/sprint-04/avance.md (integración y calidad).
6. Escribe docs/documentacion/sprints/INFORME-SPRINT-04.md con: alcance logrado frente al plan, tabla de pruebas por herramienta, métricas (tasa de aprobación, cobertura, mutación, densidad de defectos por KLOC, eficacia de corrección, deuda y Quality Gate de SonarQube), defectos abiertos, lista de capturas que debo tomar con el comando exacto para cada una, retrospectiva breve y un apartado «Datos para el informe» con lo que corresponde a los capítulos 8 y 11 a 14.
Commit «docs(s04): cierre del Sprint 4», push y PR. Dime el resultado de cada comando y si el sprint cumple la definición de terminado.
```

```text
Elemento
Detalle
Objetivo
Ejecutar y seguir cada atención desde la asignación hasta el reporte final, respetando los acuerdos de horario y la privacidad.
Historias
HU-S05-01 a HU-S05-07 (RF-19 a RF-22, RF-33)
Casos del catálogo base
TC-059 a TC-072
Backend (Claude Code)
módulo DService: agenda del técnico; iniciar atención y finalizar con reporte (completed_at y rating_due_at); reprogramación por acuerdo con 24 h; técnico adicional autorizado (bloqueado hasta P13); línea de tiempo con eventos; WhatsApp del técnico visible solo después de la asignación; cancelación del cliente; retiro e incidencia; reasignación automática reutilizando el Sprint 4.
Frontend (Codex)
técnico: Mis citas / Agenda en calendario y lista, Iniciar atención, Finalizar servicio con reporte; cliente: detalle de la solicitud con línea de tiempo, datos del técnico y enlace a WhatsApp después de la asignación, reprogramar y cancelar con confirmación.
Enfoque de pruebas
transiciones de estado completas (Asignada → En atención → Finalizada; Cancelada) y rechazo de transiciones inválidas; plazos de reprogramación con reloj controlado; privacidad del teléfono antes y después de asignar; solapamiento en la agenda; auditoría de cancelaciones.
Decisiones que debes tomar
P05/P16 franjas; P06 máximo de reprogramaciones; P13 coordinación de dos técnicos; P14 cancelación en casos límite
Meta de pruebas
≥ 60 IDs S05-TC aprobados: ≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest
```

### Prompt R.1   CLAUDE CODE   Retomar el trabajo (relevo del mismo agente)

_Úsalo al abrir una sesión nueva o después de quedarte sin límite. Para Codex usa el mismo texto cambiando HANDOFF-claude por HANDOFF-codex._

```text
Retomo el trabajo. Lee AGENTS.md, docs/documentacion/sprints/HANDOFF-claude.md, HANDOFF-codex.md y DECISIONES.md; revisa git status, la rama actual y git log -15.
Dime en 5 líneas: en qué prompt del plan estamos, qué quedó a medias, si hay cambios sin commit y qué harás a continuación. No cambies nada hasta que confirme.
```

### Prompt R.2   CLAUDE CODE   Continuar el trabajo del otro agente (relevo cruzado)

_Úsalo cuando Codex se quedó sin límite a mitad de un paso. Funciona igual al revés (Codex continúa lo de Claude Code), cambiando carpeta y HANDOFF._

```text
Codex se quedó sin límite en medio del prompt [S?.?]. Vas a continuar su trabajo en su carpeta ..\TecnicoYa-cx, rama [feature/delgado/<módulo>/sNN], respetando las reglas del frontend de AGENTS.md.
Lee HANDOFF-codex.md, git status y git log -10 en esa carpeta. Dime qué hizo, qué falta y qué cambios sin commit encontraste. No descartes cambios ajenos. Espera mi confirmación, continúa hasta terminar ese prompt y actualiza HANDOFF-codex.md indicando que lo continuaste tú.
```

### Prompt R.3   CODEX   Revisión cruzada del PR del backend

_Carpeta: ..\TecnicoYa-cx · Empieza: Claude Code abrió el PR de S?.3_

```text
Revisa el PR [número o rama feature/mayhuasca/<módulo>/sNN] sin cambiar código. Lee AGENTS.md, el contrato docs/api/contrato-SNN.md y CASOS-SNN.md.
Busca: endpoints que no coinciden con el contrato; permisos que solo se validan en el cliente; validaciones faltantes; mensajes en inglés; datos privados en respuestas; consultas N+1; pruebas que no comprueban lo que dice su nombre; casos del catálogo sin implementar.
Publica tu revisión con gh pr review (comentarios por archivo y línea) o, si gh no está disponible, dame la lista ordenada por gravedad.
```

### Prompt R.4   CLAUDE CODE   Revisión cruzada del PR del frontend

_Carpeta: principal · Empieza: Codex abrió el PR de S?.4 o S?.5_

```text
Revisa el PR [número o rama feature/delgado/<módulo>/sNN] sin cambiar código. Lee AGENTS.md, el contrato y CASOS-SNN.md.
Busca: llamadas que no coinciden con el contrato; falsos éxitos ante errores; datos ficticios o de la demo; validaciones del cliente distintas de las del servidor; textos en inglés; problemas de accesibilidad; pruebas Cypress que simulan al servidor sin necesidad; casos del catálogo sin implementar.
Publica la revisión con gh pr review o dame la lista ordenada por gravedad.
```

### Prompt R.5   CLAUDE CODE   Fallo del entorno

_Úsalo cuando las pruebas fallan de golpe (Docker apagado, puerto ocupado, base caída)._

```text
Las pruebas fallan con este error: [PEGA EL ERROR]. Diagnostica sin cambiar código ni dependencias: estado de Docker Desktop y del contenedor del slot, puertos en uso, que exista .env.testing (sin abrirlo), migraciones de la base de pruebas y espacio en disco.
Dime la causa, la solución y si necesitas que yo haga algo. No apliques soluciones que borren volúmenes o datos sin preguntarme.
```

### Prompt R.6   CLAUDE CODE   Conflicto al integrar ramas

_Úsalo si GitHub indica conflictos en un PR._

```text
El PR [número] tiene conflictos con main. Actualiza la rama con git merge origin/main (sin rebase sobre ramas publicadas). Resuelve solo los conflictos de tu carpeta; si hay conflictos en frontend/, detente y dime cuáles. Ejecuta la suite afectada, haz commit del merge y push. Dime cómo resolviste cada archivo.
```

```text
Prompt
Herramienta
Qué hace
0.1
Claude Code
Análisis integral de solo lectura
0.2
Codex
Verificación cruzada del análisis (opcional)
1.0
Claude Code
Reparar el arrancador de Cypress (PHP 0xC000001D)
1.1
Claude Code
Reglas comunes, plan maestro v3 y conteo por sprint
1.2
Claude Code
Dos entornos de prueba en paralelo y carpeta de Codex
1.3
Claude Code
Seguridad del repositorio y deuda del backend
1.4
Codex
Deuda del frontend
1.5
Manual
Tareas manuales del equipo
1.3-B
Claude Code
Ejecutar la purga del historial (solo si lo decides)
1.6
Claude Code
Hoja de decisiones P01 a P23
1.7
Claude Code
Quality Gate real en SonarQube
S1.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S1.2
Claude Code
Pruebas Pest en rojo
S1.3
Claude Code
Backend en verde, cobertura, mutación y PR
S1.4
Codex
Pantallas del sprint y pruebas Vitest
S1.5
Codex
Pruebas Cypress contra el backend real
S1.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
S2.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S2.2
Claude Code
Pruebas Pest en rojo
S2.3
Claude Code
Backend en verde, cobertura, mutación y PR
S2.4
Codex
Pantallas del sprint y pruebas Vitest
S2.5
Codex
Pruebas Cypress contra el backend real
S2.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
S3.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S3.2
Claude Code
Pruebas Pest en rojo
S3.3
Claude Code
Backend en verde, cobertura, mutación y PR
S3.4
Codex
Pantallas del sprint y pruebas Vitest
S3.5
Codex
Pruebas Cypress contra el backend real
S3.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
S4.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S4.2
Claude Code
Pruebas Pest en rojo
S4.3
Claude Code
Backend en verde, cobertura, mutación y PR
S4.4
Codex
Pantallas del sprint y pruebas Vitest
S4.5
Codex
Pruebas Cypress contra el backend real
S4.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
S5.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S5.2
Claude Code
Pruebas Pest en rojo
S5.3
Claude Code
Backend en verde, cobertura, mutación y PR
S5.4
Codex
Pantallas del sprint y pruebas Vitest
S5.5
Codex
Pruebas Cypress contra el backend real
S5.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
S6.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S6.2
Claude Code
Pruebas Pest en rojo
S6.3
Claude Code
Backend en verde, cobertura, mutación y PR
S6.4
Codex
Pantallas del sprint y pruebas Vitest
S6.5
Codex
Pruebas Cypress contra el backend real
S6.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
S7.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S7.2
Claude Code
Pruebas Pest en rojo
S7.3
Claude Code
Backend en verde, cobertura, mutación y PR
S7.4
Codex
Pantallas del sprint y pruebas Vitest
S7.5
Codex
Pruebas Cypress contra el backend real
S7.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
S8.1
Claude Code
Brechas, catálogo de 60 casos o más y contrato de API
S8.2
Claude Code
Pruebas Pest en rojo
S8.3
Claude Code
Backend en verde, cobertura, mutación y PR
S8.4
Codex
Pantallas del sprint y pruebas Vitest
S8.5
Codex
Pruebas Cypress contra el backend real
S8.6
Claude Code
Integración, conteo, SonarQube y cierre del sprint
R.1
Claude Code
Retomar el trabajo (relevo del mismo agente)
R.2
Claude Code
Continuar el trabajo del otro agente (relevo cruzado)
R.3
Codex
Revisión cruzada del PR del backend
R.4
Claude Code
Revisión cruzada del PR del frontend
R.5
Claude Code
Fallo del entorno
R.6
Claude Code
Conflicto al integrar ramas
```

## Parte 2 · Prompts del rediseño y del adelanto del Sprint 7 (octubre 2026)

### 2026-10-26 · Reasignación: Claude Code asume el frontend (con tarea de escala)

```text
Cambio de organización: Codex no está disponible hasta el 19-nov. Desde ahora tú asumes también
el FRONTEND (frontend/web), además del backend. Trabaja SOLO en la carpeta principal
(Software TecnicoYa-Huancayo); no edites TecnicoYa-cx.

Primero:
- Lee docs/documentacion/sprints/HANDOFF-codex.md y docs/avances/delgado/landing/ para entender
  la landing actual (PR #24 y #25 ya integrados en main).
- Registra en DECISIONES.md la decisión: "Claude Code asume frontend mientras Codex no está
  disponible; las ramas de frontend siguen el prefijo feature/delgado/...". Actualiza
  HANDOFF-claude.md.

Reglas de siempre: rama nueva desde main actualizado, nunca commit/push a main, sin push --force
ni rebase de historia publicada. No abras ni imprimas .env/.env.testing/.env.quality.local ni claves.
Pruebas de BD solo en *_testing (slot A o launcher, guards DEF-44/45). No instales dependencias
nuevas sin preguntar. No ejecutes Cypress salvo que te lo pida (poca RAM).

TAREA: rama feature/delgado/landing/escala-encuadre

Problema 1 – En escritorio (1366–1920 px, zoom 100 %) todo se ve "con demasiado zoom":
títulos, imágenes, tarjetas y cabecera muy grandes; al bajar, las secciones no caben en pantalla.
Reduce la escala global ~15–20 % en la landing y en Nosotros, sin cambiar colores ni estilo:
- Cabecera: altura ~72px; logo circular ~44px; "TécnicoYa" ~1.25rem; enlaces del menú ~0.95rem;
  botón "Iniciar sesión" ~0.95rem con padding ~0.7rem 1.5rem. Submenú de Nosotros ~0.88rem.
- Contenedor principal max-width ~1200px, padding lateral clamp(16px, 4vw, 48px).
- h2 de secciones clamp(2rem, 3.6vw, 3.25rem); kickers ~0.78rem; párrafos ~1–1.05rem.
  "Recibe trabajos cerca de ti." no debe dejar "ti." solo en una línea.
- Hero: título clamp(2.75rem, 6.5vw, 6.25rem), 2 líneas en escritorio. Mantén la intro del video,
  el fondo fijo con pausa y la navegación sin hash.
- Padding vertical de secciones clamp(56px, 8vh, 96px).
- Foto de "¿Eres técnico?" máx. ~520px de ancho; testimonios: tarjeta central máx. ~560px y
  laterales más pequeñas, para que tarjeta + controles quepan en 1366×768. Tarjetas de Equipo
  más compactas (avatar ~64px). El abanico de subespecialidades conserva su diseño, solo escala.
- Meta: en 1366×768 cada sección principal (Especialidades, Cómo funciona, Para técnicos,
  Testimonios, Equipo, Preguntas) se ve COMPLETA bajo la cabecera.

Problema 2 – Al hacer clic en el menú la sección no queda encuadrada ("Para técnicos" queda
cortada; en Nosotros, "Equipo" queda debajo del submenú).
- El desplazamiento descuenta la altura REAL de la cabecera fija y, en Nosotros, la del submenú
  (getBoundingClientRect, no valores fijos).
- Si la sección cabe en el alto disponible, céntrala verticalmente; si no, alinéala justo
  debajo de cabecera/submenú con ~16px de margen.
- Espacio inferior suficiente para que las últimas secciones lleguen a su posición.
- Recalcular en resize y tras cargar imágenes/fuentes. Enlace activo coherente con la sección.
- Sin hash en la URL, smooth (auto con reduced-motion), foco en el encabezado.

Problema 3 – En Nosotros, al hacer scroll, detrás de la píldora del submenú se ve una franja
recortada de la foto de fondo. Elimínala (sin fondo rectangular detrás de la píldora).

Verificación:
- Capturas con Playwright (Chromium ya instalado en /opt o el del equipo; no instales
  navegadores) a 1366×768 y 1920×1080 tras hacer clic en cada enlace del menú, más una a 390 px.
  Si Playwright no está disponible sin instalar nada, dímelo y yo reviso manualmente.
- Vitest: cálculo de desplazamiento (descuenta cabecera + submenú, centra cuando cabe).
- npm run test, npm run lint y npm run build deben pasar.
- Evidencias en docs/documentacion/evidencias/landing/.
Abre PR a main y dame: enlace, archivos cambiados, conteo Vitest y qué debo revisar en el navegador.
```

### 2026-10-26 · Reasignación: Claude Code asume el frontend (D-72)

```text
Cambio de organización: Codex no está disponible hasta el 19-nov. Desde ahora asumes también
el FRONTEND (frontend/web), además del backend. Trabaja SOLO en la carpeta principal
(Software TecnicoYa-Huancayo); no edites la carpeta TecnicoYa-cx.

1. git checkout main && git pull (PR #24 y #25 ya integrados).
2. Lee docs/documentacion/sprints/HANDOFF-codex.md, docs/avances/delgado/landing/ y
   frontend/web/src/landing/ para entender la landing actual (hero con intro de video, fondo
   fijo con pausa, vitrina con abanico 3D, Nosotros, navegación sin hash con encuadre medido).
3. Registra en DECISIONES.md: "Claude Code asume frontend mientras Codex no está disponible;
   ramas de frontend con prefijo feature/delgado/...". Actualiza HANDOFF-claude.md.
   Hazlo en una rama docs/pimentel/reasignacion-frontend con su PR.

Reglas de siempre: rama nueva desde main, nunca commit/push a main, sin push --force ni rebase de
historia publicada. No abras ni imprimas .env/.env.testing/.env.quality.local ni claves.
Pruebas de BD solo en *_testing (slot A o launcher, guards DEF-44/45). No instales dependencias
nuevas sin preguntar. No ejecutes Cypress salvo que te lo pida.
Para cambios de frontend: Vitest + lint + build en verde; si cambias algo visual, toma capturas
con Playwright usando el Chromium ya instalado (sin instalar navegadores) y guárdalas en
docs/documentacion/evidencias/landing/.

Confírmame que entendiste la estructura y espera mi siguiente tarea.
```

### 2026-10-26 · Plan del panel del administrador (Fase 0)

```text
NUEVA ÉPICA: Panel del administrador (y base común de paneles por rol).
Carpeta principal. Reglas de siempre: rama nueva desde main, sin push a main, sin --force,
sin abrir .env, BD solo *_testing (slot A / launcher, guards DEF-44/45), sin dependencias nuevas
sin preguntar, sin Cypress salvo que lo pida. Reutiliza tokens.css y el estilo de la landing.

==================== FASE 0 – INVENTARIO Y PLAN (no programes aún) ====================
1. git checkout main && git pull.
2. Revisa qué existe hoy para admin en backend (Modules/FAdministration, rutas /api/v1/admin/*,
   permisos catalog.manage, announcements.manage, technicians.verify, audit_entries) y en
   frontend (features/administration, CatalogAdmin, Announcements, revisión de técnicos,
   paneles actuales de cliente/técnico/admin).
3. Escribe docs/documentacion/sprints/PLAN-PANEL-ADMIN.md con:
   - tabla "módulo → qué existe (API/UI/pruebas) → qué falta";
   - el alcance por fases (abajo) con endpoints nuevos, tablas/migraciones nuevas, pantallas
     y casos de prueba estimados (Pest/Vitest) por fase;
   - qué partes corresponden a sprints ya cerrados (no romper sus pruebas) y cuáles al S7.
4. Muéstrame el resumen del plan y ESPERA mi confirmación antes de la Fase 1.

Alcance acordado:
- Base común de paneles (cliente, técnico, admin): barra lateral izquierda contraíble con íconos
  y sección activa; barra superior con campana de notificaciones y avatar (menú: Mi perfil,
  Tema claro/oscuro, Cerrar sesión); tema claro y oscuro con tokens ([data-theme]) guardado
  por usuario (preferencia en API si existe /me, si no localStorage con try/catch);
  animaciones suaves con prefers-reduced-motion; responsive (barra lateral → cajón en móvil).
- FASE 1: base común + menú admin + Inicio (KPIs reales desde la API: solicitudes por estado,
  técnicos pendientes de verificación, usuarios nuevos 7/30 días, promedio de calificaciones;
  sin datos inventados, estados vacíos honestos) + integrar en el panel lo que ya existe
  (catálogo: especialidades, subespecialidades, distritos, fotos, tarifas; verificación de
  técnicos: cola, documentos privados, aprobar/rechazar con motivo, suspender) + Mi perfil
  (nombre, avatar, cambio de contraseña pidiendo la actual).
- FASE 2: Usuarios: listado con búsqueda y filtros (rol, estado, distrito), crear usuario
  (cliente/técnico/admin) con sus campos (nombres, apellidos, correo, teléfono, distrito,
  dirección de referencia; técnico: especialidades, zona, tarifa base), editar, bloquear/
  desbloquear con motivo, protección del último administrador. El admin NO fija contraseñas:
  se genera enlace de activación/definición de contraseña (en dev MAIL_MAILER=log). Todo auditado.
- FASE 3: Comunicados: CRUD con imagen (subida a /media con revisión), título, descripción,
  tipo (promoción, sorteo, actualización, aviso), audiencia (clientes/técnicos/todos), vigencia
  desde/hasta, orden y estado; vista previa; duplicar (ya existe). Carrusel de comunicados
  vigentes en el Inicio de los paneles de cliente y técnico. Sin pagos ni cupones reales.
- FASE 4: Cambio de correo con verificación por enlace firmado (el correo cambia solo al
  confirmar; aviso al correo anterior) y verificación de correo en el registro si no existe.
- S7 (NO ahora): reglas/pesos del matching con historial, reasignación manual, soporte,
  reportes Excel/PDF, pantalla de auditoría.

==================== FASE 1 – (solo tras mi confirmación) ====================
Rama: feature/pimentel/admin/panel-base (backend + frontend en la misma rama si los endpoints
son pocos; si no, separa backend en feature/mayhuasca/admin/... y frontend en
feature/delgado/admin/...).
- Endpoints nuevos con permiso de admin y Pest (rojo → verde): KPIs del inicio y lo que falte
  de catálogo/verificación según el inventario.
- Frontend con Vitest: layout común, menú admin, tema claro/oscuro, Inicio, Mi perfil, módulos
  de catálogo y verificación integrados.
- Accesibilidad: navegación por teclado, foco visible, aria-current en el menú, contraste AA en
  ambos temas.
- Capturas Playwright (Chromium ya instalado) del panel en tema claro y oscuro, 1366 y 390 px.
- Suites completas Pest y Vitest + lint + build en verde. Actualiza DECISIONES.md,
  HANDOFF-claude.md, CONTRATO-API.md y el catálogo de casos de prueba.
- Abre PR y dame: enlace, endpoints nuevos, conteos Pest/Vitest y qué revisar en el navegador.
```

### 2026-10-26 · Decisiones D-73 a D-79

```text
Decisiones: "recomendadas" para las 7 (ORG-02 adelanto del S7 con IDs S07-TC y filtros/alertas
del dashboard quedan para S7; PERM-01; NOMBRES-01; TEMA-01; AVATAR-01; VERIF-01; BASE-01).
Regístralas en DECISIONES.md con fecha y responsable "Pimentel".

Ya integré los PR #26 y #27 en main. Entonces:
1. git checkout main && git pull.
2. Recrea la rama de la Fase 1 desde ese main (la rama del plan no está publicada: puedes
   crearla de nuevo y aplicar el commit 36eefef con cherry-pick; no reescribas nada publicado).
3. Revisa qué es la carpeta sin seguimiento docs/documentacion/evidencias/ui/: si son
   evidencias válidas de un PR ya integrado, inclúyelas en un commit aparte con su descripción;
   si son restos temporales, dime qué contiene antes de borrar nada.
4. Empieza la Fase 1 según el plan. Al terminar, abre el PR y dame: enlace, endpoints nuevos,
   migraciones, conteos Pest/Vitest (con IDs S07-TC) y qué revisar en el navegador con la
   cuenta admin.
```

### 2026-10-26 · PR #32 · Fase 1 del panel del administrador

```text
Integré el PR #31. Arranca la FASE 1 del panel del administrador según
docs/documentacion/sprints/PLAN-PANEL-ADMIN.md, con las decisiones D-73 a D-79.

- git checkout main && git pull; rama feature/pimentel/admin/panel-base (o separa backend/
  frontend si los endpoints lo justifican, como dice el plan).
- Alcance Fase 1: base común de paneles (barra lateral contraíble, barra superior con campana
  conectada a GET /notifications y avatar con menú Mi perfil / Tema / Cerrar sesión), tema
  claro y oscuro guardado en /me, menú del admin, Inicio con KPIs reales (GET /admin/dashboard;
  calificaciones como "no disponible hasta el Sprint 6"), Catálogo y Verificación integrados en
  el panel (con la pantalla de suspender/reactivar que hoy no existe), Mi perfil (nombres,
  apellidos, teléfono, avatar revisado con iniciales de respaldo, cambio de contraseña pidiendo
  la actual).
- Los paneles de cliente y técnico usan la misma base, pero conservando por ahora sus
  contenidos actuales (su rediseño completo va en fases posteriores).
- Permisos dashboard.view y users.manage (PERM-01) en AuthorizationSeeder, idempotente.
- Pest y Vitest rojo → verde con IDs S07-TC; conserva los data-cy de Cypress S1–S4.
- Capturas Playwright con datos reales de tu BD de pruebas: tema claro y oscuro, 1366 y 390 px.
- Suites completas, lint, build y audits en verde. DECISIONES, HANDOFF, CONTRATO-API.
- Abre el PR y dame: enlace, endpoints, migraciones, conteos y qué revisar con la cuenta
  admin (dime si debo correr migrate o db:seed en mi BD de desarrollo).
```

### 2026-10-26 · PR #32 bloque A + bloques B y C (versión inicial)

```text
Revisé el PR #32 (Fase 1) en el navegador. Corrí migrate y AuthorizationSeeder en mi BD de
desarrollo. Tres bloques; cada uno en su PR.

===================== BLOQUE A – correcciones en el PR #32 (misma rama) =====================
A1. Foto de perfil: al subirla sale "No pudimos completar la operación… Referencia:
    79a1eb0f-7dbf-4262-a9fc-800cc6ab4c2c". Busca esa referencia en storage/logs/laravel.log
    de mi entorno de desarrollo (solo esa entrada; no copies datos personales al repo),
    encuentra la causa (migración, extensión GD/Imagick de XAMPP, disco, finalidad avatar,
    permisos) y corrígela. Si depende de mi PHP (por ejemplo, habilitar extension=gd en
    php.ini), dímelo con el paso exacto. Prueba Pest de regresión.
A2. Catálogo › Subcategorías: hoy son tarjetas grandes sin foto ni precio, y parecen inactivas
    frente a las especialidades. Cambia a lista/tabla compacta: miniatura (carousel_media_id o
    marcador), nombre, especialidad, "Desde S/ X" o "Sin tarifa", etiqueta de estado de color
    (Activo verde / Inactivo gris), interruptor activar/desactivar con confirmación, botón
    Editar con ícono. Filtro por especialidad y buscador. Especialidades y Distritos con el
    mismo estilo de lista (especialidades conservan su foto).
A3. Tema claro – paleta nueva (no me gusta el beige):
    - fondo de contenido #F4F7F6, tarjetas #FFFFFF con borde #DDE5E3 y sombra suave;
    - barra lateral OSCURA también en tema claro: #0F2A2E con texto #E8EFEE y ítem activo
      #1C4A4F con borde izquierdo dorado #C9A35A;
    - barra superior #FFFFFF con borde inferior #DDE5E3;
    - texto #13222A, secundario #5A6B70; acento principal #1F6F6B (botones primarios),
      acento dorado #B8893B solo para detalles; éxito #2E7D5B, alerta #B7791F, error #B42318.
    Contraste AA en todo. El tema oscuro no cambia.
A4. Comunicados: en la vista previa actual el texto es ilegible (verde sobre verde). Se
    reemplaza en el bloque B, pero deja la vista previa legible aquí.
Capturas Playwright tema claro y oscuro 1366/390. Suites, lint, build en verde. Push.

===================== BLOQUE B – Fase 3 adelantada: Comunicados tipo carrusel (PR nuevo) =====================
Rama feature/pimentel/admin/comunicados-carrusel, desde main después de integrar #32.
Referencia: el banner rotativo del Aula Virtual (Genially): imagen ancha que rota sola.
Admin:
- Crear/editar comunicado: imagen principal OBLIGATORIA (subida a /media, revisada, sin EXIF),
  imagen móvil opcional, título interno, texto alternativo obligatorio (la imagen contiene el
  texto del anuncio), tipo (Promoción, Sorteo, Novedad, Aviso), audiencia con 3 opciones
  claras: Solo clientes / Solo técnicos / Ambos, enlace opcional con etiqueta del botón,
  vigencia desde/hasta, estado (borrador/publicado).
- Junto al selector de imagen, la guía visible: "Recomendado 1920 × 640 px (3:1), WebP o JPG
  hasta 600 KB. Mínimo 1440 × 480. Deja el texto importante en el 80 % central. Versión móvil
  opcional 1080 × 720." Al elegir la imagen: muestra sus medidas, avisa si no es 3:1 (recorte
  con encuadre ajustable) y rechaza las menores al mínimo.
- Vista previa en vivo exactamente como se verá en el panel del cliente/técnico (escritorio y
  móvil), con la zona segura marcada.
- Listado con miniatura, audiencia como etiquetas (Clientes / Técnicos), vigencia, estado y
  ORDEN por arrastrar y soltar (también con teclado). Duplicar, despublicar, retirar.
Paneles de cliente y técnico (Inicio):
- Carrusel ancho a todo el contenido, alto ~380 px en escritorio (proporción 3:1), esquinas
  redondeadas, rotación automática cada 6 s con transición deslizante/fundido, barra de
  progreso, controles abajo a la izquierda: pausa/reproducir, anterior/siguiente, contador
  "2 / 7"; botón de pantalla completa abajo a la derecha. Swipe en móvil, pausa en hover,
  foco y pestaña oculta; teclado; prefers-reduced-motion sin autoplay.
- Solo comunicados publicados, vigentes y de su audiencia. Clic en la imagen abre el enlace
  si existe. Sin comunicados: el carrusel no se muestra.
Backend: ampliar announcements (tipo, imagen principal y móvil revisadas, alt_text, orden) sin
romper S02-TC-017/018; endpoint de reordenamiento; validación de medidas en servidor.
Pest + Vitest (S07-TC), capturas, contrato, decisiones. PR propio.

===================== BLOQUE C – Fase 2: Usuarios y más opciones del menú (PR nuevo) =====================
Rama feature/pimentel/admin/usuarios, después del bloque B. Según PLAN-PANEL-ADMIN.md Fase 2, más:
- Menú admin: Inicio · Usuarios · Verificación · Solicitudes · Catálogo · Comunicados ·
  Mi perfil. (Reglas del matching, Reportes, Soporte y Auditoría siguen en S7: no los muestres
  como enlaces vacíos.)
- Usuarios: tabla con búsqueda y filtros (rol, estado, distrito, fecha de alta), detalle con
  datos, historial de solicitudes y auditoría de la cuenta. Acciones con motivo obligatorio
  y confirmación:
  · Crear (cliente/técnico/admin) con enlace de activación (el admin no fija contraseñas);
  · Editar datos;
  · Bloquear / Desbloquear (D-32: cierra sesiones, no permite nuevas solicitudes, las
    atenciones en curso siguen);
  · Restablecer acceso (envía enlace de nueva contraseña);
  · Cerrar todas las sesiones;
  · Eliminar cuenta = ANONIMIZAR (anonymized_at): se borran datos personales, se conservan
    solicitudes y auditoría; requiere escribir "ELIMINAR" para confirmar; nunca el último
    administrador ni la propia cuenta.
- Solicitudes (solo lectura en esta fase): listado con filtros por estado, especialidad,
  distrito y fechas, y detalle con línea de tiempo (request_events). Sin reasignación
  manual (S7).
Pest + Vitest (S07-TC), capturas, contrato, decisiones. PR propio.
```

### 2026-10-26 · Bloques B (comunicados tipo carrusel) y C (usuarios, menú y estadísticas)

```text
Integré el PR #32. Ajustes al plan antes de empezar:

===================== BLOQUE B (actualizado) – Comunicados tipo carrusel =====================
Rama feature/pimentel/admin/comunicados-carrusel desde main. Todo lo del bloque B anterior, más:
1. Origen del comunicado (selector con dos tarjetas):
   a) "Imagen": subida a /media (revisada, sin EXIF), imagen móvil opcional, con la guía de
      tamaño 1920×640 (3:1), mín. 1440×480, ≤600 KB, zona segura 80 %.
   b) "Genially": campo "Enlace de Genially" que SOLO acepta https://view.genially.com/<id>
      (validación en servidor y cliente; se normaliza el enlace; se rechaza cualquier otro
      dominio o http). Se muestra en un iframe 3:1 con sandbox mínimo necesario
      (allow-scripts allow-same-origin allow-popups), allowfullscreen, loading="lazy",
      referrerpolicy="no-referrer", title = texto alternativo. Añade el dominio a la CSP
      (frame-src) si existe. Imagen de portada opcional para cuando el iframe no cargue.
2. Rediseño del editor (hoy es un formulario plano y largo):
   - Diálogo/página en dos columnas: izquierda el formulario por secciones plegables
     (1 Contenido · 2 Audiencia · 3 Vigencia y orden · 4 Enlace), derecha la VISTA PREVIA en
     vivo del carrusel tal como lo verá el cliente/técnico, con conmutador Escritorio/Móvil.
   - Audiencia como tres tarjetas seleccionables: Solo clientes · Solo técnicos · Ambos
     (no casillas sueltas).
   - Vigencia con selector de fecha y atajos (1 semana, 2 semanas, 1 mes); tipo como chips
     (Promoción, Sorteo, Novedad, Aviso).
   - Botones fijos abajo: "Guardar borrador" y "Publicar".
3. Listado (hoy tarjetas grandes con botones apilados): vista en cuadrícula de miniaturas 3:1
   con etiquetas de audiencia y tipo, estado de color (Borrador, Programado, Vigente, Vencido),
   rango de fechas y menú "⋯" (Editar, Duplicar, Despublicar, Retirar). Filtros por audiencia
   y estado; pestaña "Orden del carrusel" con arrastrar y soltar por audiencia.
4. Carrusel en Inicio de cliente y técnico como en el video del Aula Virtual: imagen o
   Genially a todo el ancho del contenido, 3:1, rotación cada 6 s (para Genially, 12 s o
   botón siguiente), controles pausa/anterior/siguiente/contador "2 / 7" y pantalla completa.

===================== BLOQUE C (actualizado) – Usuarios, menú y Estadísticas =====================
Lo del bloque C anterior, más:
1. Menú agrupado por secciones con título pequeño: GENERAL (Inicio, Estadísticas) ·
   GESTIÓN (Usuarios, Verificación, Solicitudes) · CONTENIDO (Catálogo, Comunicados) ·
   CUENTA (Mi perfil). Contadores: técnicos pendientes en Verificación, comunicados vigentes.
   Con el menú contraído: solo íconos con tooltip. Íconos coherentes de una misma familia
   (SVG en línea, sin dependencias nuevas).
2. Estadísticas (nueva página, permiso dashboard.view), solo datos reales:
   solicitudes por día (30 días), por especialidad y por distrito; embudo enviadas → con
   ofertas → asignadas → completadas; tasa de aceptación de ofertas y tiempo medio de
   respuesta; técnicos por estado; usuarios nuevos por rol; comunicados activos por audiencia.
   Selector de rango (7/30/90 días). Gráficos en SVG propio o CSS (sin librerías nuevas sin
   preguntar), con tabla accesible equivalente y estados vacíos honestos. Endpoint
   GET /admin/statistics con agregaciones en SQL y prueba de consultas acotadas.
   Las alertas y filtros por especialidad/zona del dashboard (TC-087/088) siguen en S7.
3. Inicio: además de los KPIs, accesos rápidos (Verificar técnicos, Crear comunicado, Crear
   usuario) y los 5 últimos eventos relevantes.
Pest + Vitest (S07-TC), capturas claro/oscuro 1366/390, contrato y decisiones. PR por bloque.
```

### 2026-10-26 · Imágenes de comunicados · estilo base (ChatGPT)

```text
Banner horizontal 1920x640 px (3:1) para la plataforma "TécnicoYa Huancayo" (servicios
técnicos a domicilio en Huancayo, Perú). Estilo fotográfico realista y cálido, iluminación
natural, personas peruanas andinas reales en contexto local. Paleta: verde petróleo #0F2A2E,
verde azulado #1F6F6B, dorado #C9A35A y crema #F5EDDF. Fotografía a la derecha (55 %), bloque de
texto a la izquierda sobre fondo verde petróleo con un degradado suave. Tipografía sans serif
moderna en negrita para el título y una serif itálica dorada para la palabra destacada.
Todo el texto dentro del 80 % central. Sin logotipos de otras marcas, sin códigos QR, sin
números de teléfono ni precios inventados. Texto en español sin faltas.
```

### 2026-10-26 · Imagen 1 · Bienvenida (ChatGPT)

```text
Imagen 1 – Bienvenida. Con el estilo base. Fotografía: una familia huancaína en su sala
luminosa mientras un técnico con uniforme verde petróleo revisa un tomacorriente; ambiente
cálido y confiable. Texto: título "Tu técnico de confianza," y en serif itálica dorada
"cerca de ti." Subtítulo: "Técnicos independientes verificados en Huancayo, El Tambo y Chilca."
Botón crema con texto oscuro: "Pedir un técnico".
```

### 2026-10-26 · Imagen 3 · Mantenimiento (ChatGPT)

```text
Imagen 3 – Mantenimiento preventivo. Con el estilo base. Fotografía: dueña de una bodega en
Huancayo junto a una congeladora comercial abierta, un técnico de refrigeración midiendo con
un manómetro. Texto: título "Evita sorpresas:" y en dorado itálica "revisa tus equipos".
Subtítulo: "Mantenimiento de refrigeración comercial para tu negocio." Botón: "Ver servicios".
```

### 2026-10-26 · Imagen 4 · Seguridad (ChatGPT)

```text
Imagen 4 – Seguridad. Con el estilo base. Fotografía: técnico sonriente en la puerta de una
casa mostrando su credencial a una señora; luz de tarde. Texto: título "Técnicos" y en dorado
itálica "verificados". Tres viñetas con ícono de check dorado: "Perfiles revisados",
"Tu dirección protegida", "Contacto solo tras la asignación". Botón: "Conoce cómo verificamos".
```

### 2026-10-26 · Imagen 8 · Responde a tiempo (ChatGPT)

```text
Imagen 8 – Responde a tiempo. Con el estilo base. Fotografía: técnico junto a su caja de
herramientas mirando una notificación en su celular; un pequeño cronómetro dorado como
elemento gráfico. Texto: título "Acepta en" y en dorado itálica "10 minutos". Subtítulo:
"Las solicitudes llegan a tu panel; responde antes de que venza la oferta." Botón:
"Ver mis solicitudes".
```

### 2026-10-27 · Retomar capturas del bloque B

```text
Te quedaste esperando la corrida de capturas en segundo plano del bloque B. Continúa:
1. Revisa si esa corrida terminó (archivos de capturas y su salida). Si no terminó o falló,
   vuelve a ejecutarla en primer plano.
2. Revisa las capturas, corrige lo que veas mal y completa el avance y las evidencias.
3. Corre las suites completas (Pest, Vitest), lint, build y audits.
4. Haz push y abre el PR del bloque B. Dame: enlace, migración, endpoints, conteos y qué
   debo probar (incluye si debo correr migrate).
```

### 2026-10-27 · Capturas colgadas: ejecutar en primer plano

```text
Ya pasó bastante tiempo. Revisa la salida de la corrida de capturas (begssvwet / b51rk3y76).
- Si terminó: sigue con Pest completo en primer plano, commit, push y PR.
- Si sigue colgada (sin avanzar): detenla, revisa si el Vite o la API del slot A se cayeron,
  y vuelve a ejecutar las capturas en primer plano. Luego Pest, push y PR.
No dejes procesos en segundo plano esperando aviso: ejecuta en primer plano.
```

### 2026-10-27 · PR #33 integrado y D-83

```text
Integré el PR #33. D-83: mínimo de la imagen móvil 810 × 540 y tolerancia de proporción 1 %
(tus recomendaciones); regístralo. Empieza el BLOQUE C (usuarios, menú agrupado por secciones,
estadísticas, solicitudes en solo lectura e Inicio con accesos rápidos) en
feature/pimentel/admin/usuarios. Ejecuta las capturas y Pest en primer plano, no en segundo
plano: el PC tiene poca RAM.
```

### 2026-10-27 · PR #33 · Editar, restaurar y eliminar comunicados

```text
Probé el PR #33: está bien. Un solo ajuste en la misma rama (feature/pimentel/admin/comunicados-carrusel):

1. EDITAR en cualquier estado (hoy no se puede corregir un error después de publicar o retirar):
   - Menú "⋯" con "Editar" para Borrador, Programado, Vigente, Vencido y Retirado; también clic
     en la tarjeta abre el editor.
   - Se puede cambiar todo: título, texto alternativo, tipo, audiencia, vigencia, enlace,
     origen y REEMPLAZAR la imagen (principal o móvil) o el enlace de Genially.
   - Si está Vigente: aviso "Los cambios se verán de inmediato en los paneles" y guarda con
     control de versión (409 si otro admin lo cambió) y auditoría con valores antes/después.
   - Si está Retirado: al editar se puede "Restaurar como borrador" (vuelve a borrador,
     auditado) para corregirlo y publicarlo de nuevo.

2. ELIMINAR definitivamente:
   - Opción "Eliminar" en el menú "⋯" para Borrador, Vencido y Retirado.
     Un comunicado Vigente o Programado primero debe despublicarse (la opción aparece
     deshabilitada con el motivo).
   - Diálogo de confirmación que muestra la miniatura y el título y pide escribir ELIMINAR.
   - Backend: DELETE definitivo del comunicado y sus audiencias/posiciones; las imágenes
     asociadas se retiran (retired_at) si ningún otro comunicado las usa; se conserva una
     entrada en audit_entries con la foto previa (título, audiencia, origen, fechas) para
     trazabilidad. Reordena las posiciones del carrusel que quedaron.
   - El filtro de estado sigue mostrando Retirados aparte; por defecto el listado oculta los
     Retirados (opción "Mostrar retirados").
   - Mantén "Retirar" como está (S02-TC-017/018 y sus pruebas no deben romperse); "Eliminar"
     es la acción nueva.

3. Pruebas (IDs S07-TC siguientes):
   - Pest: editar vigente con versión correcta y con versión vieja (409); reemplazar imagen;
     restaurar retirado a borrador; eliminar borrador/retirado/vencido (200, imagen retirada,
     auditoría con snapshot, posiciones reordenadas); eliminar vigente o programado → 409/422;
     sin permiso → 403.
   - Vitest: menú por estado (Editar siempre; Eliminar solo donde corresponde), diálogo que
     exige escribir ELIMINAR, aviso de cambios inmediatos al editar vigente, restaurar.
   - Capturas Playwright del menú, el editor de un vigente y el diálogo de eliminar
     (en primer plano, el PC tiene poca RAM).
   - Pest + Vitest completos, lint y build en verde. Actualiza contrato, D-83 y avance.
     Push a la misma rama y dime qué probar.
```

### 2026-10-27 · PR #35 reconfirmar admin y cierre del Sprint 4 (S4.6)

```text
Integré el PR #34. D-85: acepto tus 4 recomendaciones, con un cambio: crear un administrador
desde el panel exige reingresar la contraseña del admin que lo crea (Pest + Vitest, PR pequeño
feature/pimentel/admin/reconfirmar-admin).

Luego, CIERRE DEL SPRINT 4 (S4.6), rama feature/pimentel/cierre/s04, desde main:
1. Regresión Cypress S1, S2, S3 y S4 con scripts/run-e2e.mjs --slot A --junit, UN sprint a la vez,
   en primer plano y sin otros procesos pesados (revisa RAM libre antes; si hay < 1,5 GB, avísame
   y no lo corras). Incluye las Cypress ajustadas y nunca ejecutadas (S01-TC-075, registro,
   portales, catálogo S02-TC-063/065–068) y los 17 casos S4.5 pendientes. Registra defectos.
2. Caso 094 bloqueado: implementa en backend lo que falta para desbloquearlo y su prueba.
3. DIST-02: aplica la opción A (C = 0 para técnico sin distrito base) como decisión definitiva.
4. DEF-46: mutación reproducible (contenedor Linux o job de CI), rehaz la mutación del S3 y corrige
   INFORME-SPRINT-03 con el valor real; refuerza los mutantes sobrevivientes del S4.
5. DemoSeeder solo para desarrollo: idempotente, cuentas @example.test, contraseña por variable de
   entorno, usa las imágenes de subcategorías y algunos comunicados de ejemplo.
6. README: instrucciones de desarrollo (backend en :3000, frontend :5173, migrate, db:seed).
7. CI: no correr backend/frontend cuando el PR solo cambia docs/** (ahorrar minutos).
8. Mueve las evidencias que quedaron en frontend/web/evidencias/ y frontend/web/HANDOFF-PR24.md a
   docs/documentacion/.
9. Revisores "Pimentel Chumbes James" donde diga [PENDIENTE] en los avances.
10. Conteo final del S4 (≥ 60: ≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest), Quality Gate de SonarQube
    (avísame antes de levantarlo, por la RAM) e INFORME-SPRINT-04.
Abre el PR y dame el resumen con el conteo final.
```
