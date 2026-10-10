# Integración continua · GitHub Actions

Decisión D-39. Workflow: .github/workflows/ci.yml. Se ejecuta en cada pull request hacia main y cada push a main, sin despliegue automático.

## Trabajos y evidencias

- **backend:** Ubuntu 24.04, PHP 8.2, pdo_mysql y PCOV; MySQL 8.4 efímero con tecnicoya_ci_testing. Composer instala el lock; Pest ejecuta todas las suites, incluidas las regresiones, con JUnit, Clover y cobertura en texto. Composer audit comprueba dependencias.
- **frontend:** Node 24, npm ci, npm test -- --coverage (JUnit, texto y LCOV), npm run build y npm audit. No se descarga el binario de Cypress.
- **conteo:** espera a ambos trabajos aprobados, descarga sus reportes y ejecuta scripts/contar-pruebas-sprint.mjs. Verifica que existan ambos JUnit. Publica texto y JSON, sin reutilizar evidencias locales.

Los artefactos backend-reportes, frontend-reportes y conteo-reportes se descargan desde Actions → CI → ejecución → Artifacts. Se conservan 14 días; archivar las evidencias del cierre con fecha y hash antes de su vencimiento. Los reportes disponibles se suben incluso cuando falla una prueba o auditoría. Un fallo conserva su código de salida; no hay reintentos ni continue-on-error.

## Alcance de la comprobación

Cypress y SonarQube quedan fuera de esta CI por ahora, por indicación del equipo: se ejecutan localmente al cierre de cada sprint, respetando el bloqueo global. La CI verde no acredita recorridos E2E, cobertura mínima del módulo ni Quality Gate de SonarQube.

El conteo es informativo y no usa --estricto: la cuota del proyecto incluye Cypress, ausente deliberadamente en este entorno. Un cero Cypress significa no ejecutado aquí, no aprobado. El cierre local debe comprobar la meta completa y el Quality Gate con sus evidencias. No se modifica el catálogo ni sus IDs.

## Seguridad y aislamiento

Permiso de GitHub limitado a contents: read; acciones fijadas por SHA. No se usa pull_request_target ni secretos de despliegue. Las contraseñas visibles de MySQL solo sirven al contenedor efímero del job y no se reutilizan fuera de CI. APP_KEY se genera en cada ejecución, no se versiona. La base termina en _testing y las pruebas mantienen su protección contra bases de desarrollo. No se leen archivos .env locales ni se conecta a XAMPP o a los slots del equipo.

Las auditorías bloquean el trabajo si encuentran vulnerabilidades; corregir dependencias mediante un PR revisado. La configuración de protección de main y la revisión humana son tareas administrativas separadas: este workflow no cambia permisos del repositorio.
