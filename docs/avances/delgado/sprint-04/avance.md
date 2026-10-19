# Avance Delgado · Sprint 04 · 2026-10-16

## Tarea e implementación

Integrante: Delgado. Módulo: infraestructura frontend / RETIRO-01, D-26 y DEP-01. Sin nuevo RF/HU; conserva funcionalidades v1 de S1–S3. Rama feature/delgado/infra/retiro-prototipo.
Commits: 60cc4a7 (dependencias), f23ed61 (rojo), ee4cb8a (implementación verde).
Archivos y resultados: [informe de retiro](../../../documentacion/evidencias/sprint-04/retiro-frontend/README.md).

Vitest previsto y ejecutado con cobertura: 117/117, líneas 82,66 %. Build y audit aprobados, cero vulnerabilidades. Prueba roja conservada. Cypress previsto a cargo de Claude Code; no ejecutado aquí. SonarQube: pendiente del cierre, sin nuevo enlace de análisis.

PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/18. CI iniciada; consultar checks del PR para el último commit. Evidencias confirmadas en 54669f9. Revisión humana: [PENDIENTE]. Pendiente: regresión E2E conjunta e integración por el equipo; respaldo verificado: v0.3-antes-retiro-prototipo (cced99e) en origin. Decisiones: [DECISIONES.md](../../../documentacion/sprints/DECISIONES.md).

## Uso de IA

Herramienta: Codex; modelo no expuesto de forma verificable en esta sesión. Fecha: 2026-10-16. Se incorporaron la limpieza de imports, eliminación del prototipo y prueba del enlace antiguo. Se corrigió la premisa del análisis: comunicados y perfil público ya eran v1; se conservaron CSS compartido y VideoExperience por uso real. Validación automática indicada arriba. Revisor humano: [PENDIENTE].

## S4.4 · 2026-10-16

Rama feature/delgado/b-matching/s04; módulo BMatching/CNotifications frontend. HU-S04-03,05–09, HU-S03-01/02; RF-01,03,09,11,12,14–18,29,33; D-60–71. Commits: 757abe1, b5b8891, e9d7504, dac617f.

Archivos: features/offers, features/realtime, integración en MyRequests/Sprint02Portal; requestsApi/EvidencePicker y distrito base en TechnicianPanel; specs cypress/e2e/sprint-04. [Informe y evidencia](../../../documentacion/evidencias/sprint-04/frontend/README.md).

Pruebas previstas/ejecutadas: 142/142 Vitest (13 IDs S4), cobertura global 84,26 %; build y audit aprobados. Cypress: sin ejecutar, 13 preparados y 5 bloqueados detallados en HANDOFF. No Sonar local; enlace de análisis pendiente de S4.6. PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/20; CI iniciada, estado del último commit en checks. Revisor [PENDIENTE].

Uso de IA: Codex, modelo no identificado de forma verificable, 2026-10-16. Aceptados componentes, pruebas y adaptación D-60/D-61; corregidas recuperación de ofertas vencidas, conservación de claves y aserción histórica contraria a D-60. Verificación automática anterior; revisión humana [PENDIENTE]. No se aceptaron fixtures o tareas de servidor inventadas. [Decisiones](../../../documentacion/sprints/DECISIONES.md).

## S4.5 · 2026-10-17

Frontend BMatching/CNotifications, HU-S04-05/06/09, RF-15/16/18/29, D-60–71. Rama feature/delgado/b-matching/s04; commits f0612cf, 8b5c811, 345bf88; PR #20. Cambios en HTTP, OffersInbox, RequestTracking, Realtime, sus pruebas y configuración/specs Cypress S4.

Vitest final 146/146, cobertura líneas 84,22 %; build aprobado; npm audit 0 vulnerabilidades. Cypress S04 y regresiones S01–03 pendientes por RAM menor a 1 GiB; 17 casos preparados, 094 requiere replay real desde tarea. [Evidencias](../../../documentacion/evidencias/sprint-04/cypress/README.md). SonarQube pendiente del cierre; CI del último push por verificar. Revisor [PENDIENTE].

Uso de IA: Codex, modelo no expuesto de forma verificable; 2026-10-17. Aceptadas adaptaciones de contrato y preparación de pruebas; corregidos canal sin ID, respuesta auth nativa e idempotencia tras 409. Resultados ejecutados diferenciados de casos preparados. Revisión humana [PENDIENTE].

## Corrección aparte de S4.5 · Landing · 2026-10-18

Rama feature/delgado/landing/fix-carrusel; alcance S2 HU-S02-01 y S02-TC-084/085/089. Commits fb1d945 (rojo), dec9aa9 (verde). Cambios: App.jsx, ServiceCarousel.jsx, landing.css y pruebas. Evidencias en docs/documentacion/evidencias/landing: capturas 1440/375 y medidas 1440/1024/768/375. Vitest 121/121, líneas 82,91 %, build aprobado, audit 0; sin Cypress por RAM <1 GiB. Pedido backend image_url público en specialties documentado en HANDOFF. S4.5 permanece en PR #20. SonarQube pendiente de cierre; revisión [PENDIENTE].

IA: Codex, modelo no expuesto verificablemente, 2026-10-18. Aceptadas separación del catálogo y corrección responsive; corregida la hipótesis de CSS borrado: los estilos comparados siguen en main pero no se ajustaban al marcado v1. Sin datos fijos ni retorno de demo. Validación automatizada y visual indicada; revisor humano [PENDIENTE].

PR de la landing: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/22. Evidencias c1fb8bb; CI en checks del último push.
