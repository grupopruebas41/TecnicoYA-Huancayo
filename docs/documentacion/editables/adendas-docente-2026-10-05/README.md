# CANVAS · Índice de adendas del docente

**TécnicoYa Huancayo · 5 de octubre de 2026.** Entrega incremental: 13 CANVAS de adenda. Cada uno identifica qué agregar, modificar y eliminar de la presentación/documento correspondiente. Los documentos originales y el código se conservan; no se regeneran PDFs ni diagramas.

## Adendas por documento

| Documento afectado | Adenda | Resultado |
|---|---|---|
| P2 · Diseño técnico | [Abrir adenda](ADENDA-P2-Diseno-tecnico.md) | Estado del arte → necesidad → decisión; DT-01 a DT-09, decisiones adicionales y arquitectura futura. |
| P7 · UML | [Abrir adenda](ADENDA-P7-UML.md) | Evidencia por autor/año/página y selección de diagramas; distingue artículos, tesis y notaciones no UML. |
| P8 · Iteraciones Scrum | [Abrir adenda](ADENDA-P8-Iteraciones-Scrum.md) | Ajustes docentes y ciclo propuesto por sprint; adaptación bibliográfica exacta pendiente del artículo IA + Scrum. |
| P10 · Estructura de carpetas | [Abrir adenda](ADENDA-P10-Estructura-y-equipo.md) | `docs/avances/<integrante>/`, ramas `feature/<integrante>/<modulo>` y evidencia trazable. |
| P11-B · Programación | [Abrir adenda](ADENDA-P11-B-Reglas-programacion.md) | Alertas, confirmación de eliminación permitida, doble validación, español y Quality Gate por sprint/PR. |
| Sprint 1 · Base técnica, autenticación, roles y catálogo | [Abrir adenda S01](ADENDA-Sprint-01.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |
| Sprint 2 · Landing, catálogo y perfil del técnico | [Abrir adenda S02](ADENDA-Sprint-02.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |
| Sprint 3 · Solicitud y búsqueda de técnicos | [Abrir adenda S03](ADENDA-Sprint-03.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |
| Sprint 4 · Matching, notificación, SLA y reasignación | [Abrir adenda S04](ADENDA-Sprint-04.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |
| Sprint 5 · Atención, agenda y seguimiento | [Abrir adenda S05](ADENDA-Sprint-05.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |
| Sprint 6 · Calificación, historial y apelaciones | [Abrir adenda S06](ADENDA-Sprint-06.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |
| Sprint 7 · Panel administrador completo | [Abrir adenda S07](ADENDA-Sprint-07.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |
| Sprint 8 · Pagos simulados, notificaciones, endurecimiento y despliegue | [Abrir adenda S08](ADENDA-Sprint-08.md) | Criterios, casos adicionales, DoD y evidencias del incremento. |

## Impacto final de los cambios

| Elemento | ¿Cambia? | Delimitación |
|---|---|---|
| Reglas de negocio | **No** | Se conservan SLA 10 min, hasta 3 notificados, ventanas 24/48 h, pesos y suma 100 %, estados, permisos y reglas de asignación. Los pendientes del análisis siguen pendientes. |
| Historias de usuario | **Sí, sus criterios de aceptación transversales** | Añadir resultados visibles, validación, confirmación cuando proceda, pruebas y evidencia. No se renumeran las 59 HU ni se crean funcionalidades comerciales nuevas. |
| Backlog funcional y orden de ocho sprints | **No se reordena** | Se conservan objetivos y dependencias. No se trasladan geolocalización real, pagos reales, chat o app móvil al MVP. |
| Tareas técnicas y estimación del backlog | **Sí** | Ampliar mensajes/validación/pruebas y evidencia; asegurar CI/Gate desde S1 y cada sprint. Refinar esfuerzo/capacidad sin duplicar controles existentes ni mantener 671 puntos como total recalculado. |
| Reglas de programación y DoD | **Sí** | Controles docentes obligatorios por sprint; el Gate por PR ya existente se mantiene. No hay cumplimiento acreditado hasta ejecutar y conservar evidencia. |
| Selección UML de P7 | **Sí** | Mantener casos de uso con respaldo de artículo; omitir tipos sin respaldo localizado. Componentes tiene referencia en tesis y requiere aceptación de esa clase de fuente para P7. E-R/flujos se conservan en sus apartados, fuera de UML. |
| Arquitectura futura | **Se documenta, no se implementa** | Herramientas candidatas mapeadas a componentes con decisiones y condiciones de incorporación. |

La regla de alertas CRUD **no autoriza borrar el catálogo**, versiones de calificaciones, solicitudes o auditoría: rige solo sobre operaciones permitidas. Los cambios de estado existentes mantienen sus reglas.

## Pendientes expresos

1. **Artículo de IA y Scrum:** no identificado entre los 32 PDF registrados (30 distintos). Peng et al. (2023) estudia asistencia IA y pruebas, pero no define Scrum. P8 separa lo comprobado de la propuesta del equipo; no afirma completar una adaptación al artículo faltante.
2. **Asignación de módulos:** los nombres del equipo están documentados, pero no se localizó una distribución A–F por integrante. P10 define el esquema y deja la asignación pendiente, sin inventarla.
3. **UML y tipo de fuente:** si el docente admite tesis como respaldo de P7, se podrá reincorporar componentes con Bejarano Gavilanes (2022). No se etiqueta esa tesis como artículo para cumplir artificialmente el criterio.

## Fuentes y revisión

Se contrastaron Fuente 0, análisis, diseño, programación, backlog, estructura y ocho CANVAS de sprint. Los artículos se identifican con sus códigos del [manifiesto existente](../../fuentes/articulos/manifest.json). Se revisó texto del corpus y figuras relevantes de solución; cada conclusión bibliográfica principal tiene página y enlace en P2/P7/P8. La búsqueda textual tiene limitaciones de extracción en algunos archivos; no se transforma «no localizado» en una afirmación absoluta de ausencia.

No se consultaron fuentes externas para inventar el artículo faltante ni se presentaron las normas ISO como certificación. [Registro de comprobación documental](VERIFICACION.md).
