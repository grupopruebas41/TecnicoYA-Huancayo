# S2.4 · Frontend · 2026-10-10

- Rama: feature/delgado/f-administracion/s02. Base origin/main 1bfb8f4. Documentos de backend importados desde 2140555: solo sprint-02/CONTRATO-API.md y CATALOGO-S02.csv.
- Rojo 3495ed8: 17 archivos previos aprobados; dos nuevos fallidos (3 pruebas de landing/carrusel fallidas y suite de validadores aún sin implementación). Las 92 regresiones pasan. No se presenta la suite no importable como once pruebas ejecutadas.
- Verde 4a35589: npm test -- --coverage --maxWorkers=1, salida 0, 112/112, 20 archivos. Cobertura de líneas global 82,66 %; administración 86,40 %. npm run build salida 0. npm audit salida 0, cero vulnerabilidades.
- IDs del catálogo: Vitest S02-TC-076–089 (14 distintos); Cypress S02-TC-059–075 (17 preparados). Los seis complementos Vitest no inflan el número de IDs. node --check de los seis archivos Cypress correcto.
- Cypress, Docker, Pest y SonarQube NO ejecutados localmente. No se declara cerrado el sprint ni validada la integración API.
- Las pruebas de sesión S1 conservan aserciones y aíslan Sprint02Portal; sus nuevos flujos tienen pruebas propias. La regresión del carrusel fijo apunta al componente LegacyServiceCarousel conservado sin ampliar (D-26). El nuevo ServiceCarousel solo usa API v1.
- La aserción nueva S02-TC-083 verifica aria-invalid y la descripción accesible del motivo, evitando ambigüedad entre el error de campo y su resumen. No se debilitó la validación.
- S02-TC-067 utiliza la inyección 500 descrita expresamente en el CSV; no representa un servidor real fallando ni una integración aprobada.

## Integración pendiente S2.5

El seeder Sprint02E2ESeeder aún no existía en origin/feature/mayhuasca/f-administracion/s02 (2140555) al consultar esta tarea. Confirmar cuentas e2e-admin/e2e-technician@example.test y E2E_PASSWORD del arrancador. La ficha de aprobación requiere un pendiente completo distinto del de rechazo. El caso de teclado necesita al menos dos imágenes del mismo rubro. Verificar estas precondiciones con la semilla definitiva, sin fabricar éxitos.

Contrato: confirmar límites de reference_fee orientativa y obligatoriedad/límites de subcategory_id y performed_on al crear portafolio (no están completos en §5.5/§7.4). La SPA mantiene los campos de trabajo requeridos y validación de referencia no negativa; el servidor es autoridad. No se modifican reglas del backend desde este PR.
