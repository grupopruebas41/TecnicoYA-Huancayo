# CANVAS DE ADENDA · P8 · Iteraciones Scrum

**Fecha:** 5 de octubre de 2026. **Documento afectado:** [plan de ocho sprints](../sprints-01-08/CANVAS-Plan-Sprints-01-08.md), §«Forma de trabajo y control de cambios», dependencias y definición de sus incrementos. Las adendas individuales S01–S08 complementan las secciones de tareas, pruebas, DoD y evidencias.

**Estado de la atribución bibliográfica:** pendiente de identificar el artículo específico sobre desarrollo con IA y Scrum mencionado por el usuario. No se encontró un estudio con ese enfoque conjunto en el corpus disponible. No se reemplaza por otro artículo sin advertirlo. Los cambios docentes de alertas/validación/Gate son aplicables; el ciclo de asistencia IA descrito aquí es una **propuesta del equipo**, no una metodología atribuida al artículo faltante.

## Qué se agrega

### Evidencia disponible y límite de su uso

| Fuente | Hallazgo verificable | Qué se toma | Qué no se puede atribuir |
|---|---|---|---|
| Peng, Kalliamvakou, Cihon y Demirer (2023), *The Impact of AI on Developer Productivity: Evidence from GitHub Copilot*, [A21](../../fuentes/articulos/A21.pdf), pp. 3–4 | Experimento sobre una tarea de servidor HTTP en JavaScript; repositorio individual y doce comprobaciones automatizadas. | Antecedente para evaluar asistencia IA con resultados ejecutables y registrar tiempo, revisión y pruebas. | No define Scrum, eventos, ocho sprints, reparto de módulos ni un ciclo integral de desarrollo. |
| Peng et al. (2023), pp. 7–8 | Reconoce límites de generalización y no evalúa calidad de código. | Evaluar calidad y seguridad por separado; no aceptar sugerencias de IA sin revisión y pruebas. Esta política concreta es **decisión del equipo**. | No prometer reducción de tiempo del 55,8 % en TécnicoYa ni disminuir puntos/capacidad con ese porcentaje. |
| Navarro Rossel y Tang Gómez (2019), [A31](../../fuentes/articulos/A31.pdf), p. 81 | Menciona experiencia como Product Owner en Scrum en un perfil laboral. | Ninguna fase de desarrollo se deriva de esa mención. | No constituye el artículo IA + Scrum solicitado. |

**Pendiente AD-P8-01:** recibir nombre/ruta del artículo; registrar autores, año, método, fases y páginas; contrastar cada fase con esta propuesta. Si prescribe cambios de alcance u orden, presentar el delta antes de mover historias. Hasta entonces no declarar «plan adaptado según ese artículo».

### Ciclo de trabajo propuesto dentro de cada sprint

Estas actividades se repiten por historia y admiten retroalimentación. No son ocho fases secuenciales distribuidas en ocho sprints; cada sprint mantiene un incremento integrado.

| Momento | Actividad añadida o precisada | Uso de IA permitido y control humano | Evidencia de salida |
|---|---|---|---|
| Refinamiento previo y durante el sprint | Resolver Pxx bloqueantes; concretar RF/HU, límites y datos. | IA puede señalar ambigüedades; el responsable del requisito valida. No inventar reglas. | HU y decisiones trazadas a las fuentes. |
| Sprint Planning | Fijar objetivo, capacidad y tareas por módulo/integrante; reservar esfuerzo de pruebas, correcciones y Gate. | Estimación y compromiso del equipo; no asumir productividad de IA. | Sprint Backlog, responsables y dependencias. |
| Diseño y BDD de cada historia | Datos/contrato mínimo y escenarios antes del código. | IA propone alternativas y casos; una persona valida los resultados esperados con la regla real. | Gherkin, TC y decisión técnica con artículo o «decisión del equipo». |
| Construcción vertical | Migración necesaria → servicio/API → React conectado → integración. | Registrar herramienta/modelo/fecha si se usa IA, qué se aceptó/corrigió y quién revisó. No subir secretos, credenciales ni datos personales reales. | Commit/PR con cambios revisables y explicación del integrante. |
| Verificación continua | Ejecutar Pest/Cypress, pruebas negativas, permisos, alertas CRUD y Gate. Corregir antes de integrar. | No aceptar un test solo porque coincide con el código generado; comprobar el oráculo contra el requisito. | Resultados ligados al commit, defectos y análisis SonarQube. |
| Inspección diaria | Revisar bloqueos, progreso hacia el objetivo y necesidades de colaboración. | La IA puede resumir registros; los integrantes verifican exactitud. | Ajustes de tareas dentro del alcance, sin reuniones ficticias ni actas inventadas. |
| Sprint Review | Demostrar recorrido integrado y revisar criterios/DoD. | La demostración y aceptación son humanas; una respuesta de IA no acredita funcionamiento. | Acta con aceptado, no terminado y observaciones. |
| Retrospectiva | Analizar retrabajo, defectos, revisión y utilidad/riesgos de la asistencia IA. | No usar volumen de código generado como medida de calidad o productividad. | Mejora concreta para la siguiente iteración. |

Los eventos Scrum se conservan; BDD y verificación se ejecutan continuamente. Las políticas de IA anteriores son propuestas de trabajo del equipo y requieren contrastarse con el artículo pendiente; no agregan IA al producto.

## Qué se modifica

### Delta respecto de la definición actual de los ocho sprints

| Sprint / alcance conservado | Cambio concreto en ejecución y aceptación | Dependencia / diferencia respecto del plan actual |
|---|---|---|
| 1 · Base, autenticación, roles y catálogo | Establecer patrón de mensajes/validación, pruebas negativas y Gate verificable del incremento; registro de evidencia individual. | Calidad operativa desde el primer incremento. Mantener lo que P11-B ya exige por PR; no posponerlo hasta S8. |
| 2 · Landing, catálogo y perfil técnico | Aplicar patrón a catálogo, comunicados, portafolio, disponibilidad y tarifas; probar confirmación de eliminación solo donde esté autorizada. | Reutiliza S1. El catálogo se activa/desactiva; no se crea eliminación física. |
| 3 · Solicitud y búsqueda | Probar validación en los cinco pasos y API, mensajes de guardado/envío y ausencia de duplicados. | Contratos y catálogo S1–S2. No agregar edición/eliminación de solicitudes si el estado no las autoriza. |
| 4 · Matching, notificación, SLA y reasignación | Revisar manualmente propuestas de IA sobre plazos/concurrencia; pruebas deterministas y Gate del incremento, además de mensajes de decisiones de usuario. | Mantiene ranking, reloj real de servidor y rondas en S4. No adelantar el editor administrativo completo de reglas de S7. |
| 5 · Atención, agenda y seguimiento | Verificar mensajes y conflictos de reprogramación, inicio/finalización y cancelación; integrar regresión de reservas. | Reutiliza asignación mínima S4. Cancelar un servicio es una transición de negocio, no borrar historial. |
| 6 · Calificación, historial y apelaciones | Pruebas de alta/edición, ventanas, mensajes y conservación de versiones; revisión de respuestas y resoluciones. | Depende del cierre individual S5; no permitir borrar calificaciones para satisfacer un checklist CRUD. |
| 7 · Administración completa | Aplicar validación, mensajes y auditoría a cambios de reglas, bloqueos, comunicados y cuentas según permisos. | Auditoría continúa desde las primeras acciones sensibles; S7 completa consulta y operación administrativa. |
| 8 · Simulación económica, notificaciones, endurecimiento y despliegue | Gate final acumulado y regresión transversal de alertas/validación, además de nuevos formularios del sprint. | S8 deja de ser el único lugar donde aparece explícitamente el Gate del sprint. Conservar despliegue final; no añadir cobros reales. |

Las adendas [S01](ADENDA-Sprint-01.md) a [S08](ADENDA-Sprint-08.md) contienen los criterios añadidos por documento. No se cambian los números de sprint, las 59 HU de la línea base ni los 118 TC preexistentes. Se agregan casos con un espacio de identificadores distinto.

### Cambios al trabajo del backlog, sin sustituir su documento

- Incorporar o ampliar el habilitador de CI/calidad y el patrón común de mensajes/validación en S1; preparación de herramientas permanece en I0. Son tareas **Must** para integrar, no nuevas funciones comerciales.
- Añadir en cada HU afectada tareas de mensajes, pruebas, corrección de hallazgos y evidencia individual. No duplicar tareas de CI/validación ya previstas.
- En S8, precisar HU-S08-06 como evaluación acumulada final, manteniendo los Gates anteriores y por PR.
- Refinar estimaciones y capacidad: el total histórico de 671 puntos no puede considerarse actualizado después de estas adiciones. No asignar puntos nuevos ni prometer fechas sin estimación del equipo.

## Qué se elimina

- La interpretación de que alertas, validación, seguridad, integración o SonarQube se dejan exclusivamente para S8.
- La posibilidad de aceptar código de IA sin comprensión, revisión ni pruebas.
- Cualquier atribución de fases Scrum a Peng et al. (2023) o a la mención laboral de Scrum de A31.
- Ningún sprint, RF, regla de negocio ni historia funcional se elimina. La adaptación exacta al artículo IA + Scrum queda expresamente pendiente, no simulada.
