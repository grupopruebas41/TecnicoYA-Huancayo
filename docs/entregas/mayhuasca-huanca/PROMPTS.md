# Prompts utilizados · Mayhuasca Huanca, Karen Jandre

**Área de responsabilidad:** Backend (Laravel 12, API /api/v1, Pest)  
**Proyecto:** TécnicoYa Huancayo · Pruebas y Calidad de Software 2026-2 · Universidad Continental  
**PR principales del área:** #21 (backend S4: matching, ofertas, SLA, notificaciones), #29 (catálogo público), #31 (registro detallado y recuperación de contraseña). Ramas feature/mayhuasca/...

Los prompts se ejecutaron con agentes de IA (Claude Code y Codex) sobre el repositorio; cada resultado se revisó en el navegador y se integró por pull request. Se agrupan por el área a la que pertenece el trabajo.

Las rutas personales se reemplazaron por `<carpeta-proyecto>`.

## Parte 1 · Prompts de los Sprints 1 a 4 (plan de trabajo)

### Prompt 1.3   CLAUDE CODE   Seguridad del repositorio y deuda del backend

_Carpeta: principal · Rama: feature/pimentel/f-administracion/s00-seguridad · Empieza: integraste el PR de 1.2_

```text
Lee AGENTS.md y docs/documentacion/analisis-estado/CONTEXTO-COMPLETO-2026-10-09.md (sección 9). Corrige la deuda del backend y de la infraestructura. Un commit por defecto.
0. Crea el registro de defectos docs/documentacion/calidad/REGISTRO-DEFECTOS.md y su CSV (ID, fecha, origen, descripción, severidad, acción, estado, commit). Carga los 18 del informe: DEF-01 Auth.jsx importaba auth.css inexistente (Alta, cerrado); DEF-02 SESSION_DRIVER=array perdía la sesión (Media, cerrado); DEF-03 Cypress.env() eliminado en Cypress 16 (Media, cerrado); DEF-04 espera vencida en Electron al recargar el portal del cliente (Media, cerrado); DEF-05 contenedor del scanner con exec format error (Baja, cerrado); DEF-06 GET /api/v1/technicians/{id} respondía 404 (Alta, cerrado); DEF-07 SonarQube con cobertura 0 % (Baja; REABRIR: el único análisis sigue en 0 %); DEF-08 7 botones sin type (Media, abierto); DEF-09 complejidad cognitiva alta (Media, abierto); DEF-10 regex del correo con retroceso superlineal (Media, abierto); DEF-11 3 avisos de composer audit (Alta, abierto); DEF-12 motor de base de datos inconsistente (Alta, abierto); DEF-13 contenedores como root (Media, abierto); DEF-14 firebase/php-jwt sin uso (Baja, abierto); DEF-15 commits sin publicar (Media, cerrado por renombre sin PR); DEF-16 matriz sin los casos de S2 y S3 (Baja, abierto); DEF-17 datos personales publicados en el repositorio (Alta, abierto); DEF-18 7 vulnerabilidades npm (Alta, abierto). Agrega los NEW-01 a NEW-16 del análisis renumerados como DEF-19 en adelante, y el fallo de Cypress (PHP 0xC000001D) si el prompt 1.0 no lo cerró.
1. DEF-17: hay datos personales en tres archivos versionados: docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json (correo, commit d361c63), docs/documentacion/fuentes/proyecto-final.pdf y docs/documentacion/informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx (códigos de alumno). No muestres esos datos. Elimina issues.json del árbol actual; para el PDF y el Word, propón si se retiran del repositorio o se reemplazan por una versión sin códigos (no los edites sin mi confirmación), agrega al .gitignore el patrón de exportes crudos de SonarQube y crea scripts/exportar-sonar-anonimo.mjs, que genere un resumen sin correos ni nombres. Luego PREPARA (no ejecutes) la purga del historial de los tres archivos en docs/documentacion/sprints/PURGA-HISTORIAL.md: respaldo con git clone --mirror, git filter-repo --path … --invert-paths, push forzado coordinado, qué debe hacer cada integrante después, y limitaciones (cachés de GitHub, forks, PR abiertos).
2. Revisa los 5 archivos sin commit de evidencias/sprint-01/continuacion (son la salida del mismo y único análisis SonarQube, no un segundo análisis). Si no tienen datos personales, haz commit; si los tienen, anonimízalos primero.
3. DEF-11: actualiza laravel/framework y league/commonmark a versiones sin avisos, sin composer -W. composer audit debe quedar sin avisos altos o críticos. Ejecuta la suite completa.
4. DEF-14: verifica si firebase/php-jwt se usa. Si no se usa, retíralo; si lo usa la API histórica, dime dónde y déjalo hasta el Sprint 8.
5. DEF-12: unifica MySQL 8.4 como motor del producto: infrastructure/docker-compose.yml, .env.example, el valor por defecto de config/database.php y el Dockerfile de la API (hoy solo instala pdo_pgsql; agrega pdo_mysql). No toques mi .env local; dime qué debo cambiar en él.
6. DEF-13: usuario no root en los Dockerfile de la API y de matching.
7. Ejecuta la suite completa (slot A) y composer audit. Guarda la salida en docs/documentacion/evidencias/sprint-00/.
Push de la rama y PR. Dime qué defectos quedaron cerrados y cuáles no, y por qué.
```

### Prompt S1.1   CLAUDE CODE   Brechas, catálogo de 60 casos o más y contrato de API

_Carpeta: principal · Rama: feature/mayhuasca/f-administracion/s01 (desde main actualizado) · Empieza: terminada la Fase 1_

```text
Lee AGENTS.md, los dos archivos HANDOFF, DECISIONES.md, docs/documentacion/editables/sprints-01-08/CANVAS-Sprint-01.md, REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md, docs/documentacion/editables/plan-pruebas-v2/CATALOGO-TC.md (casos TC-001 a TC-012, TC-137 y los Cypress S01) y el código actual relacionado.
Crea la rama feature/mayhuasca/f-administracion/s01 desde main actualizado. Sprint 1: Base técnica, autenticación, roles y catálogo. Objetivo: Acceso por identidad y permisos reales sobre la API v1 y MySQL, con perfiles mínimos y catálogo inicial reproducible.
Este sprint ya está parcialmente hecho. Estado según el análisis: Backend casi completo (registro, sesión, perfil con control de versión, permisos efectivos, aprovisionamiento de administradores, catálogo). Las pantallas de cuenta, perfil y catálogo ya usan /api/v1. Hay 11 pruebas Cypress y unos 30 IDs Pest del sprint. Avance ≈ 90 %. Reutiliza las pruebas existentes: dales su ID S01-TC-NNN (agregando [TC-0xx]) sin cambiar su lógica, y diseña solo los casos que faltan para llegar a 60.
 
1. Tabla de brechas: historia (HU-S01-01 a HU-S01-06 (RF-28, RF-33, RF-C01, RF-C06)) → endpoint o caso de uso → pantalla → pruebas → existe / parcial / falta.
2. Catálogo del sprint con IDs S01-TC-001 en adelante: mínimo 60 casos EJECUTABLES (36 Pest, 14 Cypress, 10 Vitest como mínimo). Los bloqueados por decisiones pendientes van en una lista aparte y no cuentan. Para cada caso: ID, TC de origen si existe, HU y RF, técnica (partición, valor límite, tabla de decisión por rol, transición de estados, negativa de seguridad, concurrencia o idempotencia, alerta CRUD, accesibilidad), precondición, pasos, resultado esperado, herramienta y prioridad.
   Enfoque obligatorio de este sprint: tabla de decisión rol × ruta (cliente, técnico, administrador, anónimo, cuenta suspendida) para cada ruta v1 del sprint; valores límite de cada campo del registro y del perfil; CSRF y cookie HttpOnly; límite de intentos; mensajes en español; accesibilidad de los formularios.
   No rellenes: cada caso debe comprobar un comportamiento distinto que un defecto real podría romper.
3. Contrato de API del sprint (lo usará Codex para el frontend): endpoint, método, rol o permiso, payload, respuestas 2xx y 4xx con mensajes en español, códigos de error, paginación y eventos en tiempo real si aplica, con un ejemplo JSON por endpoint.
4. Decisiones pendientes que afectan al sprint (P20 (un rol por cuenta), P22 (revisión rechazada), P03 (catálogo de distritos)): dos opciones para cada una y tu recomendación. No las apliques.
 
Muéstrame la tabla de brechas, el resumen del catálogo (conteo por herramienta y por técnica, y la lista de bloqueados) y las decisiones. Espera mi confirmación.
Después de confirmar: guarda docs/documentacion/plan-pruebas-v3/sprint-01/CASOS-S01.md, CASOS-S01.csv, S01-criticos.feature (Gherkin de los 5 casos más críticos) y docs/api/contrato-S01.md; registra mis decisiones en DECISIONES.md; actualiza HANDOFF-claude.md (avisa a Codex que el contrato está listo); commit «docs(s01): catálogo de pruebas y contrato de API» y push de la rama.
```

### Prompt S1.2   CLAUDE CODE   Pruebas Pest en rojo

_Carpeta: principal · Rama: feature/mayhuasca/f-administracion/s01 · Empieza: confirmaste S1.1_

```text
Lee AGENTS.md y docs/documentacion/plan-pruebas-v3/sprint-01/CASOS-S01.md. Implementa en Pest todos los casos Pest del sprint, con el ID al inicio del nombre (it('S01-TC-0xx …')).
- Organízalos en tests/Feature/Sprint01/ y tests/Unit/Sprint01/ (y pruebas Arch si el catálogo las incluye).
- Usa factories y datos sintéticos. Plazos con $this->travel o Carbon::setTestNow; nunca sleep.
- Para concurrencia, usa transacciones y bloqueos reales de MySQL en el slot A.
- Los casos bloqueados quedan con ->skip('Bloqueado por Pxx: …').
- Las pruebas existentes que solo renombras deben seguir pasando; no cambies su lógica.
Ejecuta la suite del sprint y confirma que las nuevas fallan por la razón correcta (falta la funcionalidad), no por errores de sintaxis, de fixtures o de entorno. Separa en el resumen: nuevas en rojo, regresión que pasa y omitidas.
Guarda la salida en docs/documentacion/evidencias/sprint-01/01-rojo.txt (con fecha y hash). Commit «test(s01): agrega N pruebas Pest del Sprint 1 en rojo». Actualiza HANDOFF-claude.md.
```

### Prompt S1.3   CLAUDE CODE   Backend en verde, cobertura, mutación y PR

_Carpeta: principal · Rama: feature/mayhuasca/f-administracion/s01 · Empieza: terminó S1.2_

```text
Lee AGENTS.md. Implementa lo necesario para que pasen las pruebas Pest del Sprint 1, en app/Modules/FAdministration.
Alcance del backend: completar lo que falte de HU-S01-01 a 06; cuenta inactiva o suspendida bloqueada en todas las rutas v1; contraseña con bcrypt que nunca sale en /me, auditoría ni logs; límite de intentos de inicio de sesión; cierre de sesión que invalida la cookie; aprovisionamiento de administradores auditado; catálogo público solo con elementos activos.
- Validación con Form Requests y mensajes en lang/es; casos de uso pequeños (complejidad cognitiva baja, que SonarQube no marque); permisos en el servidor; auditoría de acciones sensibles; transacciones y bloqueos donde haya concurrencia; parámetros de negocio leídos de la tabla versionada, nunca como constantes.
- No modifiques una prueba para que pase. Si crees que una prueba está mal, explícame por qué y espera.
- Cada endpoint debe coincidir con docs/api/contrato-S01.md. Si tienes que cambiar el contrato, actualízalo y avisa a Codex en HANDOFF-claude.md con el detalle del cambio.
Al terminar:
1. Suite completa de todos los sprints (no solo la del sprint).
2. composer test:coverage: cobertura ≥ 70 % en app/Modules/FAdministration.
3. pest --mutate limitado a app/Modules/FAdministration: reporta el porcentaje de mutantes eliminados y agrega pruebas si alguno importante sobrevive.
4. composer audit.
Guarda 02-verde.txt, 03-cobertura.txt, 04-mutacion.txt y 05-audit.txt en docs/documentacion/evidencias/sprint-01/. Commits «feat(s01): …» (uno por historia o caso de uso). Escribe docs/avances/mayhuasca/sprint-01/avance.md según la adenda P10, con el registro de uso de IA (Claude Code, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Push de la rama y PR hacia main con descripción: historias, endpoints, pruebas (aprobadas/omitidas), cobertura, mutación y riesgos. Actualiza HANDOFF-claude.md.
```

### Prompt S2.1   CLAUDE CODE   Brechas, catálogo de 60 casos o más y contrato de API

_Carpeta: principal · Rama: feature/mayhuasca/f-administracion/s02 (desde main actualizado) · Empieza: terminó S1.6_

```text
Lee AGENTS.md, los dos archivos HANDOFF, DECISIONES.md, docs/documentacion/editables/sprints-01-08/CANVAS-Sprint-02.md, REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md, docs/documentacion/editables/plan-pruebas-v2/CATALOGO-TC.md (casos TC-013 a TC-026 y TC-131, TC-132, TC-134, TC-135) y el código actual relacionado.
Crea la rama feature/mayhuasca/f-administracion/s02 desde main actualizado. Sprint 2: Landing, administración de catálogo y perfil del técnico. Objetivo: Hacer visible la oferta del marketplace: landing, catálogo administrable, comunicados por audiencia, verificación de técnicos, perfil y portafolio, disponibilidad, zona, pausa, servicios y tarifas.
Este sprint ya está parcialmente hecho. Estado según el análisis: La API v1 tiene disponibilidad, servicios con versión de tarifa, portafolio, revisión técnica, alta y edición de subcategorías y duplicado de comunicados, con 12 pruebas Pest. No existe ninguna pantalla v1 del sprint: el flujo solo se ve en la demo. Avance ≈ 45 %. Reutiliza las pruebas existentes: dales su ID S02-TC-NNN (agregando [TC-0xx]) sin cambiar su lógica, y diseña solo los casos que faltan para llegar a 60.
 
1. Tabla de brechas: historia (HU-S02-01 a HU-S02-07 (RF-05, RF-07, RF-30, RF-33, RF-C01, RF-C02, RF-C04, RF-C06, RF-C08, RF-C09)) → endpoint o caso de uso → pantalla → pruebas → existe / parcial / falta.
2. Catálogo del sprint con IDs S02-TC-001 en adelante: mínimo 60 casos EJECUTABLES (36 Pest, 14 Cypress, 10 Vitest como mínimo). Los bloqueados por decisiones pendientes van en una lista aparte y no cuentan. Para cada caso: ID, TC de origen si existe, HU y RF, técnica (partición, valor límite, tabla de decisión por rol, transición de estados, negativa de seguridad, concurrencia o idempotencia, alerta CRUD, accesibilidad), precondición, pasos, resultado esperado, herramienta y prioridad.
   Enfoque obligatorio de este sprint: alertas CRUD (éxito, error 422 o 500 sin falso éxito, confirmación antes de borrar) en cada pantalla; transiciones de estado del técnico (Pendiente de verificación → Activo, Rechazado, Suspendido); valores límite de tarifas y franjas; franjas solapadas; un técnico no puede editar lo de otro; archivos del portafolio (tipo y tamaño, P17).
   No rellenes: cada caso debe comprobar un comportamiento distinto que un defecto real podría romper.
3. Contrato de API del sprint (lo usará Codex para el frontend): endpoint, método, rol o permiso, payload, respuestas 2xx y 4xx con mensajes en español, códigos de error, paginación y eventos en tiempo real si aplica, con un ejemplo JSON por endpoint.
4. Decisiones pendientes que afectan al sprint (P03 distritos; P05/P16 duración de franjas y tarifas; P17 límites de archivos; P18 efectos de la suspensión; P19 cambios de catálogo sobre solicitudes; P22 rechazo de verificación): dos opciones para cada una y tu recomendación. No las apliques.
 
Muéstrame la tabla de brechas, el resumen del catálogo (conteo por herramienta y por técnica, y la lista de bloqueados) y las decisiones. Espera mi confirmación.
Después de confirmar: guarda docs/documentacion/plan-pruebas-v3/sprint-02/CASOS-S02.md, CASOS-S02.csv, S02-criticos.feature (Gherkin de los 5 casos más críticos) y docs/api/contrato-S02.md; registra mis decisiones en DECISIONES.md; actualiza HANDOFF-claude.md (avisa a Codex que el contrato está listo); commit «docs(s02): catálogo de pruebas y contrato de API» y push de la rama.
```

### Prompt S2.2   CLAUDE CODE   Pruebas Pest en rojo

_Carpeta: principal · Rama: feature/mayhuasca/f-administracion/s02 · Empieza: confirmaste S2.1_

```text
Lee AGENTS.md y docs/documentacion/plan-pruebas-v3/sprint-02/CASOS-S02.md. Implementa en Pest todos los casos Pest del sprint, con el ID al inicio del nombre (it('S02-TC-0xx …')).
- Organízalos en tests/Feature/Sprint02/ y tests/Unit/Sprint02/ (y pruebas Arch si el catálogo las incluye).
- Usa factories y datos sintéticos. Plazos con $this->travel o Carbon::setTestNow; nunca sleep.
- Para concurrencia, usa transacciones y bloqueos reales de MySQL en el slot A.
- Los casos bloqueados quedan con ->skip('Bloqueado por Pxx: …').
- Las pruebas existentes que solo renombras deben seguir pasando; no cambies su lógica.
Ejecuta la suite del sprint y confirma que las nuevas fallan por la razón correcta (falta la funcionalidad), no por errores de sintaxis, de fixtures o de entorno. Separa en el resumen: nuevas en rojo, regresión que pasa y omitidas.
Guarda la salida en docs/documentacion/evidencias/sprint-02/01-rojo.txt (con fecha y hash). Commit «test(s02): agrega N pruebas Pest del Sprint 2 en rojo». Actualiza HANDOFF-claude.md.
```

### Prompt S2.3   CLAUDE CODE   Backend en verde, cobertura, mutación y PR

_Carpeta: principal · Rama: feature/mayhuasca/f-administracion/s02 · Empieza: terminó S2.2_

```text
Lee AGENTS.md. Implementa lo necesario para que pasen las pruebas Pest del Sprint 2, en app/Modules/FAdministration.
Alcance del backend: verificar y completar los CRUD que falten: especialidades y subcategorías (activar y desactivar sin borrar, foto del carrusel), comunicados completos (crear, editar, eliminar, duplicar, audiencia, vigencia, vista previa), listado y ficha de técnicos para verificación con motivo, pausa temporal y zona o distritos del técnico, endpoint público para el carrusel de la landing.
- Validación con Form Requests y mensajes en lang/es; casos de uso pequeños (complejidad cognitiva baja, que SonarQube no marque); permisos en el servidor; auditoría de acciones sensibles; transacciones y bloqueos donde haya concurrencia; parámetros de negocio leídos de la tabla versionada, nunca como constantes.
- No modifiques una prueba para que pase. Si crees que una prueba está mal, explícame por qué y espera.
- Cada endpoint debe coincidir con docs/api/contrato-S02.md. Si tienes que cambiar el contrato, actualízalo y avisa a Codex en HANDOFF-claude.md con el detalle del cambio.
Al terminar:
1. Suite completa de todos los sprints (no solo la del sprint).
2. composer test:coverage: cobertura ≥ 70 % en app/Modules/FAdministration.
3. pest --mutate limitado a app/Modules/FAdministration: reporta el porcentaje de mutantes eliminados y agrega pruebas si alguno importante sobrevive.
4. composer audit.
Guarda 02-verde.txt, 03-cobertura.txt, 04-mutacion.txt y 05-audit.txt en docs/documentacion/evidencias/sprint-02/. Commits «feat(s02): …» (uno por historia o caso de uso). Escribe docs/avances/mayhuasca/sprint-02/avance.md según la adenda P10, con el registro de uso de IA (Claude Code, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Push de la rama y PR hacia main con descripción: historias, endpoints, pruebas (aprobadas/omitidas), cobertura, mutación y riesgos. Actualiza HANDOFF-claude.md.
```

### Prompt S3.1   CLAUDE CODE   Brechas, catálogo de 60 casos o más y contrato de API

_Carpeta: principal · Rama: feature/mayhuasca/a-solicitudes/s03 (desde main actualizado) · Empieza: terminó S2.6_

```text
Lee AGENTS.md, los dos archivos HANDOFF, DECISIONES.md, docs/documentacion/editables/sprints-01-08/CANVAS-Sprint-03.md, REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md, docs/documentacion/editables/plan-pruebas-v2/CATALOGO-TC.md (casos TC-027 a TC-038 y TC-119 a TC-130) y el código actual relacionado.
Crea la rama feature/mayhuasca/a-solicitudes/s03 desde main actualizado. Sprint 3: Solicitud y búsqueda de técnicos. Objetivo: El cliente describe, revisa y envía su solicitud en cinco pasos de forma segura y busca técnicos por especialidad, distinguiendo la búsqueda automática de la solicitud dirigida.
Este sprint ya está parcialmente hecho. Estado según el análisis: La API v1 de solicitudes está hecha (borrador, evidencias privadas, envío idempotente, solicitud inalterable después del envío) y también el perfil público del técnico, con 15 pruebas Pest. Faltan la búsqueda de técnicos con filtros y todas las pantallas. Avance ≈ 42 %. Reutiliza las pruebas existentes: dales su ID S03-TC-NNN (agregando [TC-0xx]) sin cambiar su lógica, y diseña solo los casos que faltan para llegar a 60.
 
1. Tabla de brechas: historia (HU-S03-01 a HU-S03-06 (RF-01 a RF-04, RF-33, RF-C02, RF-C06)) → endpoint o caso de uso → pantalla → pruebas → existe / parcial / falta.
2. Catálogo del sprint con IDs S03-TC-001 en adelante: mínimo 60 casos EJECUTABLES (36 Pest, 14 Cypress, 10 Vitest como mínimo). Los bloqueados por decisiones pendientes van en una lista aparte y no cuentan. Para cada caso: ID, TC de origen si existe, HU y RF, técnica (partición, valor límite, tabla de decisión por rol, transición de estados, negativa de seguridad, concurrencia o idempotencia, alerta CRUD, accesibilidad), precondición, pasos, resultado esperado, herramienta y prioridad.
   Enfoque obligatorio de este sprint: idempotencia y doble clic en el envío; evidencias privadas (quién puede ver cada foto); la solicitud enviada no se edita; validaciones de cada paso con valores límite; navegar atrás y adelante en el asistente sin perder datos; teclado y foco en el asistente.
   No rellenes: cada caso debe comprobar un comportamiento distinto que un defecto real podría romper.
3. Contrato de API del sprint (lo usará Codex para el frontend): endpoint, método, rol o permiso, payload, respuestas 2xx y 4xx con mensajes en español, códigos de error, paginación y eventos en tiempo real si aplica, con un ejemplo JSON por endpoint.
4. Decisiones pendientes que afectan al sprint (P03 cobertura; P05 franja inmediata; P10 máximo de solicitudes activas; P16; P17 evidencias y longitud de la descripción; P22 Registrada/Enviada): dos opciones para cada una y tu recomendación. No las apliques.
 
Muéstrame la tabla de brechas, el resumen del catálogo (conteo por herramienta y por técnica, y la lista de bloqueados) y las decisiones. Espera mi confirmación.
Después de confirmar: guarda docs/documentacion/plan-pruebas-v3/sprint-03/CASOS-S03.md, CASOS-S03.csv, S03-criticos.feature (Gherkin de los 5 casos más críticos) y docs/api/contrato-S03.md; registra mis decisiones en DECISIONES.md; actualiza HANDOFF-claude.md (avisa a Codex que el contrato está listo); commit «docs(s03): catálogo de pruebas y contrato de API» y push de la rama.
```

### Prompt S3.2   CLAUDE CODE   Pruebas Pest en rojo

_Carpeta: principal · Rama: feature/mayhuasca/a-solicitudes/s03 · Empieza: confirmaste S3.1_

```text
Lee AGENTS.md y docs/documentacion/plan-pruebas-v3/sprint-03/CASOS-S03.md. Implementa en Pest todos los casos Pest del sprint, con el ID al inicio del nombre (it('S03-TC-0xx …')).
- Organízalos en tests/Feature/Sprint03/ y tests/Unit/Sprint03/ (y pruebas Arch si el catálogo las incluye).
- Usa factories y datos sintéticos. Plazos con $this->travel o Carbon::setTestNow; nunca sleep.
- Para concurrencia, usa transacciones y bloqueos reales de MySQL en el slot A.
- Los casos bloqueados quedan con ->skip('Bloqueado por Pxx: …').
- Las pruebas existentes que solo renombras deben seguir pasando; no cambies su lógica.
Ejecuta la suite del sprint y confirma que las nuevas fallan por la razón correcta (falta la funcionalidad), no por errores de sintaxis, de fixtures o de entorno. Separa en el resumen: nuevas en rojo, regresión que pasa y omitidas.
Guarda la salida en docs/documentacion/evidencias/sprint-03/01-rojo.txt (con fecha y hash). Commit «test(s03): agrega N pruebas Pest del Sprint 3 en rojo». Actualiza HANDOFF-claude.md.
```

### Prompt S3.3   CLAUDE CODE   Backend en verde, cobertura, mutación y PR

_Carpeta: principal · Rama: feature/mayhuasca/a-solicitudes/s03 · Empieza: terminó S3.2_

```text
Lee AGENTS.md. Implementa lo necesario para que pasen las pruebas Pest del Sprint 3, en app/Modules/ARequests.
Alcance del backend: búsqueda de técnicos con filtros (especialidad, subcategoría, zona; la calificación mínima queda como estado vacío honesto hasta el Sprint 6) y paginación; solicitud dirigida desde el perfil; Mis solicitudes con filtro por estado; límites de texto y de fotos según P17.
- Validación con Form Requests y mensajes en lang/es; casos de uso pequeños (complejidad cognitiva baja, que SonarQube no marque); permisos en el servidor; auditoría de acciones sensibles; transacciones y bloqueos donde haya concurrencia; parámetros de negocio leídos de la tabla versionada, nunca como constantes.
- No modifiques una prueba para que pase. Si crees que una prueba está mal, explícame por qué y espera.
- Cada endpoint debe coincidir con docs/api/contrato-S03.md. Si tienes que cambiar el contrato, actualízalo y avisa a Codex en HANDOFF-claude.md con el detalle del cambio.
Al terminar:
1. Suite completa de todos los sprints (no solo la del sprint).
2. composer test:coverage: cobertura ≥ 70 % en app/Modules/ARequests.
3. pest --mutate limitado a app/Modules/ARequests: reporta el porcentaje de mutantes eliminados y agrega pruebas si alguno importante sobrevive.
4. composer audit.
Guarda 02-verde.txt, 03-cobertura.txt, 04-mutacion.txt y 05-audit.txt en docs/documentacion/evidencias/sprint-03/. Commits «feat(s03): …» (uno por historia o caso de uso). Escribe docs/avances/mayhuasca/sprint-03/avance.md según la adenda P10, con el registro de uso de IA (Claude Code, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Push de la rama y PR hacia main con descripción: historias, endpoints, pruebas (aprobadas/omitidas), cobertura, mutación y riesgos. Actualiza HANDOFF-claude.md.
```

### Prompt S4.1   CLAUDE CODE   Brechas, catálogo de 60 casos o más y contrato de API

_Carpeta: principal · Rama: feature/mayhuasca/b-matching/s04 (desde main actualizado) · Empieza: terminó S3.6_

```text
Lee AGENTS.md, los dos archivos HANDOFF, DECISIONES.md, docs/documentacion/editables/sprints-01-08/CANVAS-Sprint-04.md, REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md, docs/documentacion/editables/plan-pruebas-v2/CATALOGO-TC.md (casos TC-039 a TC-058 y TC-140) y el código actual relacionado.
Crea la rama feature/mayhuasca/b-matching/s04 desde main actualizado. Sprint 4: Matching, notificación, SLA y reasignación. Objetivo: Convertir una solicitud enviada en ofertas trazables y en una asignación elegida por el cliente, respetando elegibilidad, plazos, concurrencia y recuperación ante fallos.
Este sprint es nuevo. Revisa también qué partes ya existen en el código histórico (app/Services, API /api/*, demo) para no duplicar lógica sin necesidad, pero implementa sobre /api/v1 y el modelo v1.
 
1. Tabla de brechas: historia (HU-S04-01 a HU-S04-10 (RF-06 a RF-18, RF-29, RNF-07)) → endpoint o caso de uso → pantalla → pruebas → existe / parcial / falta.
2. Catálogo del sprint con IDs S04-TC-001 en adelante: mínimo 60 casos EJECUTABLES (36 Pest, 14 Cypress, 10 Vitest como mínimo). Los bloqueados por decisiones pendientes van en una lista aparte y no cuentan. Para cada caso: ID, TC de origen si existe, HU y RF, técnica (partición, valor límite, tabla de decisión por rol, transición de estados, negativa de seguridad, concurrencia o idempotencia, alerta CRUD, accesibilidad), precondición, pasos, resultado esperado, herramienta y prioridad.
   Enfoque obligatorio de este sprint: valores límite de tiempo con reloj controlado (9:59, 10:00 y 10:01 min; 23:59 y 24:00 h); tabla de decisión de elegibilidad; puntuación con datos sintéticos y resultado esperado calculado a mano; concurrencia (dos aceptaciones o dos elecciones simultáneas); idempotencia de los jobs; reintentos; nadie ve ofertas ajenas; matching en 3 s o menos (RNF-01) como prueba de rendimiento básica.
   No rellenes: cada caso debe comprobar un comportamiento distinto que un defecto real podría romper.
3. Contrato de API del sprint (lo usará Codex para el frontend): endpoint, método, rol o permiso, payload, respuestas 2xx y 4xx con mensajes en español, códigos de error, paginación y eventos en tiempo real si aplica, con un ejemplo JSON por endpoint.
4. Decisiones pendientes que afectan al sprint (P05/P16; P11 momento y plazo de la elección; P12 fronteras temporales y avisos; P15 normalización, referencias de distancia y experiencia, empate residual; P19 vigencia de reglas. Además: matching en PHP dentro de Laravel o seguir con el servicio Python): dos opciones para cada una y tu recomendación. No las apliques.
 
Muéstrame la tabla de brechas, el resumen del catálogo (conteo por herramienta y por técnica, y la lista de bloqueados) y las decisiones. Espera mi confirmación.
Después de confirmar: guarda docs/documentacion/plan-pruebas-v3/sprint-04/CASOS-S04.md, CASOS-S04.csv, S04-criticos.feature (Gherkin de los 5 casos más críticos) y docs/api/contrato-S04.md; registra mis decisiones en DECISIONES.md; actualiza HANDOFF-claude.md (avisa a Codex que el contrato está listo); commit «docs(s04): catálogo de pruebas y contrato de API» y push de la rama.
```

### Prompt S4.2   CLAUDE CODE   Pruebas Pest en rojo

_Carpeta: principal · Rama: feature/mayhuasca/b-matching/s04 · Empieza: confirmaste S4.1_

```text
Lee AGENTS.md y docs/documentacion/plan-pruebas-v3/sprint-04/CASOS-S04.md. Implementa en Pest todos los casos Pest del sprint, con el ID al inicio del nombre (it('S04-TC-0xx …')).
- Organízalos en tests/Feature/Sprint04/ y tests/Unit/Sprint04/ (y pruebas Arch si el catálogo las incluye).
- Usa factories y datos sintéticos. Plazos con $this->travel o Carbon::setTestNow; nunca sleep.
- Para concurrencia, usa transacciones y bloqueos reales de MySQL en el slot A.
- Los casos bloqueados quedan con ->skip('Bloqueado por Pxx: …').
- No implementes todavía nada del sprint.
Ejecuta la suite del sprint y confirma que las nuevas fallan por la razón correcta (falta la funcionalidad), no por errores de sintaxis, de fixtures o de entorno. Separa en el resumen: nuevas en rojo, regresión que pasa y omitidas.
Guarda la salida en docs/documentacion/evidencias/sprint-04/01-rojo.txt (con fecha y hash). Commit «test(s04): agrega N pruebas Pest del Sprint 4 en rojo». Actualiza HANDOFF-claude.md.
```

### Prompt S4.3   CLAUDE CODE   Backend en verde, cobertura, mutación y PR

_Carpeta: principal · Rama: feature/mayhuasca/b-matching/s04 · Empieza: terminó S4.2_

```text
Lee AGENTS.md. Implementa lo necesario para que pasen las pruebas Pest del Sprint 4, en app/Modules/BMatching y app/Modules/COffers.
Alcance del backend: módulos BMatching y COffers: tabla versionada de reglas y pesos (cercanía 35 %, tarifa 20 %, historial 30 %, experiencia 15 %; deben sumar 100 %) leída por versión vigente, no desde rules.json; filtro de elegibilidad (especialidad y subcategoría activas, técnico verificado y activo, disponible en la franja, sin pausa); puntuación y desempate por calificación; tratamiento del técnico nuevo; ronda de hasta 3 ofertas; SLA de 10 minutos con colas y scheduler; reasignación automática; Pendiente de disponibilidad por 24 h y expiración; elección del cliente con bloqueo para impedir la doble asignación; eventos en tiempo real con Reverb; reintentos de notificación (máximo 3).
- Validación con Form Requests y mensajes en lang/es; casos de uso pequeños (complejidad cognitiva baja, que SonarQube no marque); permisos en el servidor; auditoría de acciones sensibles; transacciones y bloqueos donde haya concurrencia; parámetros de negocio leídos de la tabla versionada, nunca como constantes.
- No modifiques una prueba para que pase. Si crees que una prueba está mal, explícame por qué y espera.
- Cada endpoint debe coincidir con docs/api/contrato-S04.md. Si tienes que cambiar el contrato, actualízalo y avisa a Codex en HANDOFF-claude.md con el detalle del cambio.
Al terminar:
1. Suite completa de todos los sprints (no solo la del sprint).
2. composer test:coverage: cobertura ≥ 70 % en app/Modules/BMatching y app/Modules/COffers.
3. pest --mutate limitado a app/Modules/BMatching y app/Modules/COffers: reporta el porcentaje de mutantes eliminados y agrega pruebas si alguno importante sobrevive.
4. composer audit.
Guarda 02-verde.txt, 03-cobertura.txt, 04-mutacion.txt y 05-audit.txt en docs/documentacion/evidencias/sprint-04/. Commits «feat(s04): …» (uno por historia o caso de uso). Escribe docs/avances/mayhuasca/sprint-04/avance.md según la adenda P10, con el registro de uso de IA (Claude Code, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Push de la rama y PR hacia main con descripción: historias, endpoints, pruebas (aprobadas/omitidas), cobertura, mutación y riesgos. Actualiza HANDOFF-claude.md.
```

## Parte 2 · Prompts del rediseño y del adelanto del Sprint 7 (octubre 2026)

### 2026-10-21 · Catálogo público: image_url y reference_fee

```text
Tarea corta de backend: completar el catálogo público para la landing nueva (ya integrada en main, PR #24).
Carpeta: Software TecnicoYa-Huancayo (principal). Slot A para pruebas (tecnicoya_testing, API 8001).

Reglas: rama nueva feature/mayhuasca/catalogo/campos-landing desde main actualizado.
No commit/push a main, no push --force. No abras ni imprimas .env, .env.testing ni claves.
Pruebas solo en BD *_testing con el launcher o las variables del slot A (guards DEF-44/45).
No toques frontend/ (es de Codex). No instales dependencias nuevas ni uses composer -W.

1. GET /api/v1/catalog/specialties: agregar "image_url" (string|null) por especialidad.
   - Fuente: la foto revisada/aprobada de la especialidad si existe en el modelo de medios;
     si no hay, la imagen revisada de su primera subcategoría (carousel_media_id); si tampoco, null.
   - URL absoluta pública (Storage::url o asset), nunca rutas internas del disco.
   - Solo medios en estado revisado/aprobado; nada pendiente o rechazado.
2. GET /api/v1/catalog/carousel: agregar "reference_fee" por subcategoría.
   - Usa la tarifa de referencia que ya existe en el catálogo (tabla de tarifas/subcategoría);
     formato numérico con 2 decimales en soles, o null si no hay. No inventes montos.
3. Sin romper el contrato: campos nuevos opcionales, el resto de la respuesta igual.
   Actualiza CONTRATO-API.md (sección catálogo público) con los dos campos y ejemplos.
4. Evita N+1 (eager loading) y mantén el cache/ETag del catálogo si existe.
5. Pruebas Pest (rojo → verde):
   - especialidad con foto revisada devuelve image_url absoluta;
   - fallback a la foto de la primera subcategoría;
   - null cuando no hay medios o están pendientes/rechazados;
   - carousel devuelve reference_fee correcto y null sin tarifa;
   - endpoints siguen siendo públicos y el resto de campos no cambia;
   - consulta sin N+1 (conteo de queries acotado).
6. Ejecuta la suite completa Pest en slot A, Pint y PHPStan si están configurados.
   Guarda evidencias en docs/documentacion/evidencias/ (sin datos personales ni rutas de usuario).
7. Registra en DECISIONES.md y HANDOFF-claude.md. Abre PR a main con descripción
   (cambio, pruebas, conteo Pest) y dame el enlace y el resumen.
```

### 2026-10-26 · Conflicto del PR #27 y rama del catálogo

```text
Tienes razón, los PR seguían abiertos. Estado:
- Acabo de integrar el PR #26 (si al hacer fetch sigue OPEN, resuelve también su conflicto
  como abajo y avísame).
- El PR #27 tiene conflicto con main en docs/documentacion/sprints/HANDOFF-claude.md.

1. Resuelve el conflicto del PR #27: en su rama feature/delgado/landing/pulido-visual haz
   git fetch origin && git merge origin/main (merge, no rebase), conserva el contenido de ambos
   lados en HANDOFF-claude.md sin marcadores, corre Vitest + lint + build y haz push.
   Dime cuando esté listo para que yo lo integre.

2. Rama feature/pimentel/ui/rediseno-visual: opción A.
   - Rama nueva feature/mayhuasca/catalogo/campos-landing desde main actualizado (después de
     integrar #27). Aplica con cherry-pick 045618f y be6708e (S04-TC-133, image_url) y la
     evidencia docs/documentacion/evidencias/ui/ (muévela a docs/documentacion/evidencias/
     sprint-04/ si corresponde).
   - En la misma rama completa la tarea pendiente del catálogo público:
     a) GET /catalog/carousel: "reference_fee" por subcategoría (tarifa existente, 2 decimales,
        null si no hay; no inventar montos);
     b) distritos: la landing muestra "0 distritos" y el mapa "Zonas no disponibles" en mi BD de
        desarrollo. Verifica que el seeder del catálogo cree los distritos activos (El Tambo,
        Huancayo, Chilca como mínimo, de forma idempotente) y que GET /catalog/districts los
        devuelva. Dime el comando exacto que debo correr yo en mi BD de desarrollo para
        cargarlos (sin borrar datos).
     Pest rojo → verde, sin N+1, CONTRATO-API.md actualizado, PR propio.
   - Revisa si 42123bb (--spec del arrancador E2E) sigue sirviendo: si sí, PR aparte pequeño;
     si no, descártalo. Descarta cb47276 (lo reemplazó la landing integrada).
   - Cuando todo esté fuera, me confirmas y recién borras la rama local rediseno-visual.

3. Después de que yo integre #27 y el PR del catálogo: registra D-73 a D-79 debajo de D-72 y
   arranca la Fase 1 desde ese main.
```

### 2026-10-26 · PR #29 catálogo y PR #30 encuadre del inicio de sesión

```text
Ya integré los PR #27 y #28 en main. Corrí DistrictSeeder en mi BD de desarrollo.

1. Sigue con feature/mayhuasca/catalogo/campos-landing como planeaste (cherry-picks, evidencia,
   reference_fee, DatabaseSeeder idempotente, Pest, contrato y PR).

2. En paralelo, PR pequeño de frontend: feature/delgado/auth/encuadre-login.
   La pantalla #cuenta (Iniciar sesión / registro) se ve desordenada en 1366–1920 px:
   - gran espacio vacío arriba entre la cabecera y el contenido;
   - el aviso de error y el botón "Reintentar conexión" quedan sueltos FUERA de la tarjeta,
     a todo el ancho;
   - la tarjeta (formulario + panel "Tu solución empieza aquí") no cabe en la pantalla.
   Corrige:
   - cabecera igual de compacta que la landing (logo + "Volver al inicio" pequeño);
   - tarjeta centrada vertical y horizontalmente en el alto disponible, max-width ~1080px,
     que quepa completa en 1366×768 (formulario a la izquierda, panel de marca a la derecha
     más angosto, ~40 %);
   - el error de conexión y "Reintentar" DENTRO de la tarjeta, sobre el formulario, como aviso
     compacto con ícono;
   - campos y botones de tamaño proporcional al resto del sitio; mismo tratamiento para
     la vista de registro y para el estado "Comprobando tu sesión…";
   - móvil: panel de marca oculto o reducido arriba, formulario a ancho completo.
   Mantén los data-cy que usan las pruebas Cypress S1–S4. Capturas Playwright 1366×768,
   1920×1080 y 390 px (con y sin error de conexión). Vitest + lint + build en verde. PR propio.

3. Cuando yo integre esos dos PR: registra D-73 a D-79 y arranca la Fase 1.
```

### 2026-10-26 · PR #30 deslizamiento del login (Parte A) y PR #31 registro detallado (Parte B)

```text
Ajustes a la pantalla de sesión. Integré el PR #29; el PR #30 aún NO está integrado.

===================== PARTE A – en la rama del PR #30 (feature/delgado/auth/encuadre-login) =====================
Primero: git fetch origin && git merge origin/main (sin rebase), resuelve HANDOFF-claude.md
conservando ambas entradas.

1. Quita el enlace subrayado "Crear una cuenta" que está debajo de "Ingresar", y el enlace
   "Iniciar sesión" debajo de "Registrarme". El cambio de modo queda solo en el botón del
   panel verde ("Crear una cuenta ↗" / "Ya tengo una cuenta ↗").
2. Animación de deslizamiento entre modos:
   - Inicio de sesión: formulario a la izquierda, panel verde a la derecha (como ahora).
   - Al pulsar "Crear una cuenta", el panel verde se desliza hacia la IZQUIERDA (~600 ms,
     cubic-bezier(.65,0,.35,1)) y el formulario de registro aparece a la DERECHA con fundido;
     la curva del panel se invierte para mirar hacia el formulario. "Ya tengo una cuenta" hace
     el recorrido inverso.
   - El texto del panel cambia según el modo (registro: "¿Ya tienes cuenta? / Vuelve a tu
     espacio." con botón "Ya tengo una cuenta").
   - Mantén #cuenta como ruta; el modo se refleja en el estado (y en la URL sin recargar si
     ya se hace así). Foco al primer campo del formulario visible tras la animación.
   - prefers-reduced-motion: cambio sin deslizamiento. Móvil: sin deslizamiento lateral,
     la franja del panel arriba cambia su texto y el formulario cambia con fundido.
3. Botón "Mostrar / Ocultar contraseña" (ícono de ojo, aria-pressed, aria-label) en todos los
   campos de contraseña.
Mantén los data-cy y el orden de Tab que usa S01-TC-075 (si cambia el orden por quitar el
enlace, ajusta la prueba Cypress y dilo). Capturas Playwright 1366 y 390 px de ambos modos y de
un fotograma intermedio de la animación. Vitest + lint + build en verde. Push y avísame.

===================== PARTE B – PR nuevo desde main (después de integrar #30) =====================
Rama: feature/mayhuasca/auth/registro-detallado (backend + frontend).
Objetivo: el registro debe recoger los datos que necesita el matching para recomendar técnicos
cercanos (cercanía 35 % del puntaje, D-63/D-64).

Registro en 2 pasos con indicador de progreso (1 de 2 / 2 de 2):
 Paso 1 – "¿Quién eres?": dos tarjetas grandes seleccionables con ícono:
   "Necesito un técnico" (cliente) y "Soy técnico".
 Paso 2 – "Tus datos":
   Cliente: nombres, apellidos (NOMBRES-01: name se compone como nombre para mostrar),
     correo, teléfono (formato Perú, 9 dígitos que empiezan en 9), distrito principal
     (select desde GET /catalog/districts), tipo (Hogar o MYPE; si es MYPE: razón social
     opcional), dirección de referencia opcional (texto, privada), contraseña con medidor de
     seguridad y confirmación, aceptación de Términos y Privacidad (casilla obligatoria que
     abre el texto actual).
   Técnico: lo mismo (sin tipo de cliente), más distrito base (base_district_id), distritos
     que atiende (multiselección, incluye el base), especialidades que ofrece (multiselección
     desde el catálogo, al menos 1), años de experiencia (0–50), WhatsApp opcional.
     Al terminar: "Tu cuenta quedó pendiente de verificación. Sube tus documentos desde tu panel."
 - Validación en vivo por campo, botones "Atrás" y "Crear cuenta", sin perder lo escrito al
   volver al paso 1.
Backend:
 - Ampliar POST /auth/register (sin romper el contrato: campos nuevos con reglas por tipo de
   cuenta); migración para el distrito principal del cliente (client_profiles.district_id) y
   nombres/apellidos si no existen; técnico: base_district_id, technician_districts y
   especialidades declaradas (sin crear servicios ni tarifas, que siguen en su panel).
 - El distrito del cliente queda como valor por defecto en el asistente de nueva solicitud.
 - Registro de admin sigue prohibido por esta vía (TC-008).
Recuperar contraseña:
 - "¿Olvidaste tu contraseña?" en el inicio de sesión → formulario de correo → respuesta
   siempre neutra ("Si el correo existe, te enviamos un enlace") → enlace firmado de un solo uso
   con vencimiento de 60 min → pantalla para la nueva contraseña (con medidor) → cierra las
   demás sesiones (auth_version). En desarrollo MAIL_MAILER=log: el enlace queda en el log.
   Throttling por IP y por correo. Auditado para cuentas admin (D-44).
Pruebas:
 - Pest rojo → verde: reglas por tipo de cuenta, distrito inválido/inactivo rechazado,
   especialidades obligatorias para técnico, teléfono, términos, idempotencia del correo,
   restablecimiento (respuesta neutra, token vencido, token reutilizado, sesiones cerradas,
   throttling). Vitest: pasos, validaciones, medidor, conservación de datos al volver.
 - Asigna IDs según la convención acordada (propón en el PR a qué sprint corresponden).
 - Actualiza los seeders E2E y las pruebas Cypress S1 que llenan el registro si cambian sus
   campos; no ejecutes Cypress sin avisarme.
 - Capturas Playwright de ambos pasos (cliente y técnico) y del flujo de recuperación.
 - CONTRATO-API.md, DECISIONES.md (registra la decisión de campos de registro) y HANDOFF.
Abre el PR y dame: enlace, migraciones, endpoints, conteos Pest/Vitest y qué probar.

Después de integrar la PARTE B: registra D-73 a D-79 y arranca la Fase 1 del panel admin.
```

### 2026-10-26 · IDs S07 y decisiones en el PR #31

```text
Integré el PR #30.
1. IDs: S07-TC (adelanto del S7 según ORG-02; no modificar el conteo del S1 ya cerrado).
2. Sí: registra D-73 a D-79 dentro del PR de la parte B, antes de la decisión de campos de
   registro.
Empieza la parte B (feature/mayhuasca/auth/registro-detallado) desde main actualizado.
Anota en el HANDOFF que la Cypress S01-TC-075 quedó ajustada sin ejecutar: se corre en la
regresión del cierre S4.6.
```

### 2026-10-26 · PR #31 · Subespecialidades en el registro del técnico

```text
Ajuste al PR #31 (misma rama feature/mayhuasca/auth/registro-detallado), antes de integrarlo.
Revisé el registro en el navegador: está bien. Solo cambia "Especialidades que ofreces":

1. Selección en dos niveles (especialidad → subespecialidades):
   - Cada especialidad es una tarjeta/chip con su check en línea (hoy la casilla queda encima
     del texto y se ve desalineada; corrige también "Distritos que atiendes" igual).
   - Al marcar una especialidad se despliega debajo (animación de altura, ~250 ms) su lista de
     subespecialidades reales (GET /catalog/subcategories?specialty_id=), como chips
     seleccionables con check, agrupados en un panel con:
     · título "Rubros de <Especialidad> en los que trabajas";
     · buscador pequeño para filtrar por nombre (útil con 10 subespecialidades);
     · "Seleccionar todas" / "Quitar todas";
     · contador "3 de 10 seleccionadas".
   - Regla: por cada especialidad marcada, al menos 1 subespecialidad. Error en vivo bajo su
     panel ("Elige al menos un rubro de Electricidad"). Al desmarcar la especialidad se
     limpian sus subespecialidades (con confirmación si ya había elegidas).
   - Resumen bajo la sección: "Ofrecerás 5 rubros en 2 especialidades".
   - Teclado y lector de pantalla: fieldset/legend por especialidad, aria-expanded en el
     disparador, foco al primer chip al desplegar. Móvil: chips en 1–2 columnas.
   - Estados de carga y error del listado de subespecialidades con "Reintentar".
   - No se pierde la selección al volver con "Atrás".

2. Backend:
   - POST /auth/register (técnico): nuevo campo subcategory_ids (array, mín. 1 por cada
     specialty_id enviado; cada subcategoría activa y perteneciente a una especialidad enviada;
     sin duplicados). Rechaza subcategorías de especialidades no declaradas o inactivas.
   - Guárdalas como "subespecialidades declaradas" (tabla technician_declared_subcategories o
     equivalente) SIN crear technician_services ni tarifas (D-80 se mantiene): el técnico no es
     elegible en el matching hasta cargar su tarifa en "Servicios y tarifas".
   - En el panel del técnico, "Servicios y tarifas" muestra esas subespecialidades
     precargadas como pendientes de tarifa (mensaje: "Agrega tu tarifa para empezar a recibir
     solicitudes de este rubro").
   - GET /me (técnico) devuelve las declaradas. Migración aditiva. Actualiza D-80 y
     CONTRATO-API.md.

3. Pruebas (IDs S07-TC siguientes):
   - Pest: subcategoría de otra especialidad rechazada; especialidad sin subcategorías
     rechazada; inactiva rechazada; se guardan declaradas y NO se crean servicios; el técnico
     recién registrado no aparece como candidato en el matching.
   - Vitest: despliegue al marcar, buscador, seleccionar/quitar todas, contador, error por
     especialidad sin rubros, limpieza al desmarcar, conservación al volver.
   - Capturas Playwright 1366 y 390 px con 2 especialidades desplegadas.
   - Pest + Vitest completos, lint y build en verde. Push a la misma rama y dime qué probar
     (incluye si debo correr otra vez artisan migrate).
```
