# Avance · Delgado · Sprint 03

Fecha: 2026-10-14. Módulo F: administración. Rama feature/delgado/f-administracion/s02-sonar.

Tarea de deuda técnica de S2, imputada a S3 por el usuario. RNF: accesibilidad y mantenibilidad; sin nuevas HU/RF ni cambios de contrato. Código únicamente en administration/ y components/, archivos detallados en git diff de 0d282d0.

Commits: 226e04c rojo; 0d282d0 verde. Pruebas previstas/ejecutadas: Vitest con cobertura y build; 119/119 y build aprobado. Evidencia: ../../../documentacion/evidencias/sprint-03/sonar-frontend/. Cobertura de líneas administración 86,75 %. Cypress/Docker/Sonar no ejecutados por coordinación de recursos. SonarQube: [PENDIENTE] análisis oficial. PR: [#12](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/12). [CI del último SHA](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/12/checks), pendiente al publicar el avance.

Revisor: [PENDIENTE]. Pendientes: revisión, CI y confirmación oficial Sonar; integración posterior a S2.6. Decisiones: ../../../documentacion/sprints/DECISIONES.md, D-26.

## Uso de IA

Herramienta: Codex; modelo: no expuesto por el entorno. Fecha: 2026-10-14. Se aplicaron semántica HTML, extracción de helpers, simplificación de ternarios y normalización de errores. Se corrigieron tres expectativas de accesibilidad mediante implementación, sin relajar pruebas ni cambiar IDs. Verificación automatizada y revisión de diferencias realizadas por el agente; revisión humana y aceptación: [PENDIENTE].

## 2026-10-15 · S3.4 · Módulo A (preparación bloqueada)

Rama feature/delgado/a-solicitudes/s03 desde af074b5. Se revisaron las fuentes publicadas. Falta publicar origin/feature/mayhuasca/a-solicitudes/s03, CONTRATO-API.md, CATALOGO-S03.csv y las decisiones específicas de S3. No se modificó producto/backend ni se ejecutaron pruebas, Cypress o Docker. Sin IDs ni contratos inferidos. Continuación y PR de implementación pendientes de las fuentes. Detalle y pedido en HANDOFF-codex.md.

Uso de IA: Codex, modelo no expuesto, 2026-10-15; inspección de Git y documentación, registro del bloqueo. Revisión humana: [PENDIENTE].

## 2026-10-15 · S3.4 · Frontend implementado (bloqueo resuelto)

Integrante: Delgado. Módulos A (solicitudes) y consulta B (búsqueda, sin matching). HU-S03-01 a HU-S03-06; RF-01 a RF-04, RF-C02, RF-C06 y RF-33; RNF-03 accesibilidad. Rama feature/delgado/a-solicitudes/s03. Fuentes: contrato v1.0 y D-55–58 importados de 402f1a8.

Archivos: features/requests, features/matching, integración Sprint02Portal y http; Cypress sprint-03; documentos/evidencias. Commits: 85e058e rojo, 00381c9 verde, 557c913 Cypress, fce1653 y 4ca269c alertas.

Pruebas previstas/ejecutadas: 13 IDs Vitest S3 en rojo/verde y regresión completa 146/146; build aprobado; audit sin vulnerabilidades. Cobertura de líneas: solicitudes 84,67 %, búsqueda 83,92 %. Cypress 17 preparados, no ejecutados. Evidencias: ../../../documentacion/evidencias/sprint-03/frontend/. SonarQube y revisión humana: [PENDIENTE]. PR: [#15](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/15). CI del commit 156be13: backend, frontend y conteo aprobados ([ejecución](https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/38694503334)). Estado de commits posteriores: checks del PR.

Limitaciones: incertidumbre al crear sin clave de creación y archivos privados sin vínculo; pedidos documentados en el relevo. S3.5 pendiente tras integrar backend #14. Decisiones: ../../../documentacion/sprints/DECISIONES.md.

Uso de IA: Codex (modelo no expuesto), 2026-10-15. Se aplicó implementación React, pruebas y documentación; se corrigió un escape de expresión en pruebas, se separaron responsabilidades y se reforzaron alertas CRUD. Se verificaron IDs contra CSV, comandos y diferencias. Aceptación/revisor humano: [PENDIENTE].


## 2026-10-15 · Actualización CI S3.4

Commit comprobado: 7103c44. Ejecución: https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/38734429455. Frontend aprobado (Vitest, build y npm audit); Pest aprobado. Backend falla en composer audit: symfony/http-foundation (PKSA-xmwy-rmx5-m7h4, CVE-2026-108082) y symfony/yaml (PKSA-xz3r-9gp4-4m1z, CVE-2026-109413), según el reporte de CI. Conteo omitido por dependencia fallida. No se modificó backend ni se reintentó para ocultar el fallo. Pedido a Claude Code: revisar y actualizar las dependencias afectadas en su rama, validar Pest/audit y publicar la corrección. La ejecución anterior aprobada no acredita el estado actual. Revisión humana: [PENDIENTE].
