# Avance individual · Delgado · Sprint 02

- Fecha: 2026-10-10. Módulo F, tarea S2.4 frontend. HU-S02-01 a 07; RF-C08, RF-C01/02/04/06/09, RF-05/07/30/33; RNF-03.
- Rama feature/delgado/f-administracion/s02. Base 1bfb8f4; commits 3495ed8 (rojo), 4a35589 (verde); PR https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10.
- Fuentes: AGENTS, ambos HANDOFF, DECISIONES (incluidas D-46–52 en la rama backend), contrato y catálogo 89 casos. Solo documentación S2 importada; backend sin cambios.
- Archivos: frontend/web/src/App.jsx y ServiceCarousel.jsx, components/ConfirmDialog.jsx, features/administration (paneles/validación/transporte), cypress/e2e/sprint-02; pruebas, evidencia y relevo.
- Implementado: diez secciones, carrusel v1, catálogo administrativo/fotos/distritos, comunicados con vista previa literal/publicación/duplicación/retiro, verificación, perfil y portafolio técnico, documentos privados, disponibilidad/zonas/pausa/tarifas. Alertas y validación sin falso éxito, confirmaciones cancelables, estado/versiones del servidor.
- Previsto y ejecutado: 14 IDs Vitest S02-TC-076–089; suite total 112/112, seis complementos. npm test con cobertura salida 0; administración 86,40 % líneas y global 82,66 %. npm run build salida 0. npm audit 0 vulnerabilidades.
- Cypress S02-TC-059–075 preparado (17); sintaxis comprobada, ejecución pendiente S2.5. Sin Docker ni Pest local. SonarQube no ejecutado: cierre del sprint.
- Evidencias: ../../../documentacion/evidencias/sprint-02/frontend/README.md. Decisiones: ../../../documentacion/sprints/DECISIONES.md.
- Pendientes: integración S2.3, seeder/credenciales/precondiciones E2E, precisiones de contrato anotadas en HANDOFF y revisión del PR. Revisor: [PENDIENTE].

## Registro de uso de IA

Codex (modelo no expuesto por la sesión), 2026-10-10. Se incorporaron pruebas antes de código, paneles y documentación generados con asistencia. Se corrigieron errores de JSX, consultas de subcategorías sin especialidad, aislamiento de pruebas de sesión, preservación de alertas y manejo de conflictos. Se verificaron 112 pruebas y build; no se atribuyen ejecuciones Cypress o aprobación humana inexistentes. Revisión: [PENDIENTE].

## 2026-10-13 · S2.5 · Integración y regresión (slot B)

- Integrante: Delgado. Módulo F; HU-S02-01 a 07, RF-C01/02/04/06/08/09, RF-05/07/30/33 y RNF-03. Contrato v1.1, decisiones D-46–52.
- Rama: feature/delgado/f-administracion/s02. PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10.
- Commits: 6cadc8b merge de origin/main f7c524e (PR #11); 719cc2a límites v1.1 en rojo; cce69aa reproducción roja del aviso de retiro; 0bb4438 implementación verde; 1651099 observación del login y lectura de identidad reales.
- Archivos: validación y paneles de catálogo/técnico/comunicados, RetireButton, ScrollServices, VideoExperience; Vitest y especificaciones Cypress S2; registro de defectos, evidencias y HANDOFF.
- Cambios: referencia orientativa con máximo 2 decimales y rango 0–100000; fecha opcional no futura UTC; subcategoría opcional/inactiva; promesa de fuentes manejada y video decorativo fuera de tabulación; alerta de retiro conservada después de la recarga (DEF-41).
- Verificación: Vitest 116/116 (21 archivos), líneas de administración 86,77 %, global 82,89 %; build salida 0; npm audit salida 0, sin vulnerabilidades; Cypress S1 17/17, salida 0, sin cambios en sus casos. Cypress S2: **15/17**, salida 1 en intento 08; fallan S02-TC-061 y 071. Diagnósticos de subidas 7/9, incluidos PNG físico y observación de CSRF 204. **DEF-42 abierto**, causa de transporte/navegador/API aún sin atribuir; no se aprueba S2.5.
- Solo una corrida Cypress a la vez, bloqueo global del arrancador, TECNICOYA_SLOT=B y tecnicoya_b_testing. No se levantó MySQL desde este worktree, no se ejecutó Pest local ni SonarQube.
- DEF-40 para Claude Code: falta subcategory_id en respuesta del portafolio propio; contrato y prueba Pest de ida/vuelta pendientes. Backend sin modificaciones propias; almacenamiento sintético generado por el runner sin versionar.
- Evidencias: ../../../documentacion/evidencias/sprint-02/cypress/README.md. Decisiones: ../../../documentacion/sprints/DECISIONES.md.
- SonarQube: [PENDIENTE], corresponde a S2.6. Revisor: [PENDIENTE]. CI y push: pendientes de registrar tras publicar evidencias.

### Uso de IA en S2.5

Codex (variante de modelo no expuesta por la sesión), 2026-10-13. Se aceptaron validaciones alineadas al contrato, pruebas y manejo persistente del aviso de retiro. Se corrigieron selectores ambiguos, datos de precondición del seeder, lectura de horarios antes de cargar el perfil y sincronización con respuestas HTTP; el retiro se reprodujo en Vitest antes de corregirlo. Los intentos fallidos se conservan y no se acreditan como aprobados. No se modificó backend ni se inventaron respuestas exitosas. Revisión humana: [PENDIENTE].

Pendiente adicional: Claude Code debe contrastar recepción multipart/preflight de /media (DEF-42); la instrumentación y el PNG físico solo facilitan reproducción y no solucionan ese defecto. Todos los intentos fallidos están preservados.
