# Sprint 3 · S3.4 frontend · 2026-10-15

Rama feature/delgado/a-solicitudes/s03, slot B, base af074b5. Fuentes importadas de origin/feature/mayhuasca/a-solicitudes/s03 (402f1a8): contrato v1.0, catálogo 81 casos, DECISIONES con D-55 a D-58. Se leyó su HANDOFF mediante git show, sin importar backend.

## Implementado

- features/requests: asistente en 5 pasos, validación, navegación sin borrar datos, foco, indicador aria-current=step; registro/PATCH versionados; imágenes privadas, límite de 5, confirmación al retirar; resumen referencial; idempotencia de submission y recuperación por GET; Mis solicitudes, continuación de registrada y enviada sin edición.
- features/matching: filtros permitidos, paginación, vacío, perfil sin contacto; solicitud dirigida con subcategorías del técnico y sin sustitución automática.
- Integración en Sprint02Portal para cliente. HTTP común conserva Sanctum/CSRF y acepta cabecera Idempotency-Key; reloj aproximado desde meta.server_time. El servidor sigue siendo autoridad de D-55.
- Bloqueo de controles durante mutaciones/resultados inciertos. Alerta del máximo de activas tomada del servidor, sin N fijo en frontend.
- Solo frontend y documentos autorizados. Sin backend, Docker, Pest ni SonarQube local.

## Pruebas

| Ejecución | Resultado |
|---|---|
| Rojo b916280 | Error de sintaxis en una expresión de prueba; 0 casos ejecutados. Conservado como evidencia, no cuenta como rojo funcional |
| Rojo 85e058e | 13/13 casos fallan por funcionalidad pendiente (S03-TC-069–081) |
| Rojo fce1653 | Falta de alerta explícita al registrar/corregir; se reforzó el complemento S03-TC-074, sin relajar aserciones |
| Verde 4ca269c | 146/146 pruebas, 23 archivos; 13 IDs Vitest S3 distintos más 14 comprobaciones complementarias, sin inflar el conteo |
| Cobertura líneas | Solicitudes 84,67 %; búsqueda 83,92 %; global 83,42 % |
| Build | Salida 0 |
| npm audit | Salida 0; 0 vulnerabilidades |
| Cypress | 17 casos preparados S03-TC-052–068; sintaxis comprobada, NO EJECUTADOS |

Los casos unitarios se agruparon en sprint03.test.jsx y requestFlows.test.jsx; se mantuvieron los IDs exactos. El contrato permite variar nombres de archivos. http.test.js añade una comprobación del transporte real de la cabecera con fetch simulado y CSRF.

Cypress usa usuarios sintéticos nuevos por recorrido, salvo los perfiles limit/mixed del seeder. TC-061 modifica una subcategoría real mediante admin y la restaura también en afterEach; TC-060 procesa el POST real y trunca su respuesta para probar incertidumbre. Solo TC-062 simula 500, como prescribe el catálogo. Las demoras de respuesta simulan latencia para observar estados, no son sleeps ni reintentos de pruebas.

## Límites del contrato / pedidos para integración

1. POST /requests no tiene idempotencia ni búsqueda por clave de creación. Si se pierde su respuesta antes de conocer el ID, el formulario se bloquea y ofrece consultar Mis solicitudes; no repite el POST automáticamente. Confirmar si se ampliará el contrato en un sprint posterior.
2. POST /media no tiene DELETE para un archivo todavía no vinculado. Retirar antes del registro elimina la selección local; no se afirma eliminación física. Solicitar política de limpieza de archivos huérfanos. Los adjuntos vinculados sí se retiran con DELETE y expected_version.
3. Las rutas nuevas requieren integrar PR #14 antes de S3.5. No se acredita integración real ni compatibilidad del navegador con estas pruebas unitarias.
4. Revisión humana, Cypress real y Quality Gate: [PENDIENTE]. No se retira el prototipo (D-26).
