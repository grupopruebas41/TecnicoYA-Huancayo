# Evidencias S1.4 · Frontend · Slot B

Fecha: 2026-10-09. Código verificado: `72872a8918cf63fe7189bd0ebfba3009fea1b43f`.
Rama: `feature/delgado/f-administracion/s01`. Base: `6dfec52e`.
PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/7

## Resultados

| Comando (desde frontend/web salvo indicación) | Resultado | Evidencia |
|---|---|---|
| npm test -- --maxWorkers=1 --no-file-parallelism (rojo 9e184da) | Salida 1: 75 aprobadas, 17 fallidas, 92 pruebas | vitest-red-final.txt |
| npm test -- --coverage --maxWorkers=1 --no-file-parallelism | Salida 0: 92/92, 17 archivos | vitest-green.txt; vitest-junit.xml |
| npm run build | Salida 0, Vite 8.3.4 | build.txt |
| npm audit | Salida 0, 0 vulnerabilidades | audit.txt |
| node --check para las seis specs Cypress y su helper | Sintaxis válida; NO ejecución E2E | cypress-static.txt |
| node frontend/web/scripts/normalize-lcov.mjs (raíz) | LCOV con rutas relativas al repositorio | lcov.info |

Un trabajador Vitest y ejecución secuencial por la memoria disponible. No se ejecutaron Docker, Cypress, Pest ni SonarQube. No se leyó ningún archivo .env ni se accedió a bases de datos.

Cobertura del módulo `src/features/administration`: **181/188 líneas, 96,27 %**; sentencias 89,56 %, ramas 84,42 %, funciones 91,07 %. Global del frontend: líneas 82,97 %, sentencias 69,04 %. No se cambiaron exclusiones para elevar cobertura. SonarQube/Quality Gate pendiente del cierre, sin atribuir a estos porcentajes un análisis Sonar aprobado.

## Trazabilidad y conteo

- Catálogo original: 87 filas; importado sin modificar desde `origin/feature/mayhuasca/f-administracion/s01`, revisión `5b9126b`. Solo CONTRATO-API.md y CATALOGO-S01.csv; no código backend.
- Vitest planificados: **16 IDs** S01-TC-026–033 y S01-TC-078–085. Los ocho últimos son los nuevos del paso S1.4. Los datasets 1/2/100/101 y 72/73/74 bytes mantienen su ID, sin inflar el conteo.
- Las pruebas unitarias complementarias de S01-TC-016, 017, 018, 025, 072, 074, 076 y 077 verifican componentes con transporte simulado. **No acreditan esos ocho casos Cypress ni se suman a los 16 IDs Vitest planificados.** Las 92 ejecuciones tampoco significan 92 casos distintos de sprint.
- Cypress planificados: 17 IDs (S01-TC-015–025 y S01-TC-072–077), todos **pendientes de ejecución en S1.5**. Los seis últimos están preparados en esta entrega.
- Main aún tenía títulos TC-xxx/DEF-10 en las specs y tests anteriores. Solo se alinearon sus nombres al CSV; sus aserciones y la configuración Cypress se conservaron.

| ID nuevo | Implementación de prueba | Estado |
|---|---|---|
| S01-TC-078 | validateAccount.test.js: límites de nombre | Vitest aprobado |
| S01-TC-079 | validateAccount.test.js: bytes UTF-8 de contraseña | Vitest aprobado |
| S01-TC-080 | validateAccount.test.js: client_type por tipo de cuenta | Vitest aprobado |
| S01-TC-081 | ProfileForm.test.jsx: teléfono inválido no envía PATCH | Vitest aprobado |
| S01-TC-082 | http.test.js: CSRF antes de mutación y cookie ausente | Vitest aprobado |
| S01-TC-083 | SessionForm.test.jsx: 429 español y formulario rehabilitado | Vitest aprobado |
| S01-TC-084 | accessibility.test.jsx: los cuatro botones DEF-36 | Vitest aprobado |
| S01-TC-085 | Catalog.test.jsx: fallo y reintento con datos de API | Vitest aprobado |
| S01-TC-072 | technician-signup.cy.js | Preparado, no ejecutado |
| S01-TC-073 / 074 / 077 | profile.cy.js | Preparados, no ejecutados |
| S01-TC-075 | accessibility.cy.js | Preparado, no ejecutado |
| S01-TC-076 | portals.cy.js | Preparado, no ejecutado |

## Cambios y límites

- Registro sin sesión automática; técnico pendiente visible; D-43 conserva el formulario y muestra el rechazo 403 sin éxito falso.
- Portal determinado por GET /me: `#cuenta/cliente`, `#cuenta/tecnico`, `#cuenta/administrador`. Anónimo vuelve a `#cuenta`; el servidor sigue siendo la autoridad de permisos.
- PATCH versionado: 409 ofrece recarga explícita. Red incierta vuelve a leer GET /me sin repetir PATCH; si también falla la lectura, el guardado se bloquea hasta recargar.
- Inicio/cierre con sesión Sanctum y CSRF. Sin persistencia de credenciales en storage. Cuenta rechazada por 403 permite cerrar su sesión.
- Catálogo público con estados vacíos y reintento, sin datos ficticios. Labels separados de mensajes de error para preservar nombres accesibles; foco visible y botones explícitos.
- DEF-36 corregido y comprobado en Vitest; confirmación por Sonar pendiente. No se modificó el registro central de defectos, propiedad de la integración.
- `vitest-red.txt` y `vitest-green-attempt-01.txt` son corridas intermedias preservadas; la última validación es `vitest-green.txt`.

## Siguiente paso

Integrar primero el backend S1 en main, actualizar esta rama y ejecutar desde la raíz `node scripts/run-e2e.mjs --sprint 01 --slot B` (S1.5), con el bloqueo global y sin otra corrida Cypress. Revisor humano: **[PENDIENTE]**. No se declara cumplida la DoD completa ni cerrado el sprint.
