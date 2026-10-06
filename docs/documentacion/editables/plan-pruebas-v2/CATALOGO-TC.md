# Catálogo de pruebas y trazabilidad · PP-TY-02

**Estado:** planificación, 5 de octubre de 2026. Derivado de `Plan-Sprints-01-08.json`; conserva los 118 identificadores existentes. **Actualización 6 de octubre de 2026:** se añaden TC-119 a TC-135 (Módulo A) y TC-136 a TC-140 (cobertura RF/RNF); total 140 casos. No afirma implementación ni ejecución. [Plan principal](../PLAN-DE-PRUEBAS-TecnicoYa-v2.md) · [CSV con precondiciones y resultados esperados](Matriz-Trazabilidad-TC.csv).

## Resumen de clasificación

| Clasificación | Número | Interpretación |
|---|---:|---|
| Candidatos backend Pest | 111 (95 + 12 del Módulo A + 4 de cobertura RF/RNF) | Implementar y verificar cada caso; la presencia en esta lista no lo cuenta como aprobado. |
| Híbrido TC-056 | 1 | Pest verifica autorización; transporte/subscripción requiere Reverb real y cliente compatible. No se incluye en la cuota de candidatos Pest. |
| Otras herramientas / evaluación | 28 (22 + 5 del Módulo A + 1 de cobertura RF/RNF) | Cypress, carga, CI/SonarQube, operación o evaluación humana. |
| **Total** | **140** | TC-001 a TC-118 de la línea base, TC-119 a TC-135 del Módulo A y TC-136 a TC-140 de cobertura RF/RNF. |

La meta mínima es 60 IDs Pest distintos aprobados sin errores, además de cubrir todos los casos comprometidos y riesgos obligatorios. Un caso condicionado no puede contarse como aprobado hasta resolver su pendiente. Los títulos conservan formulaciones breves originales: el CSV y el CANVAS del sprint determinan el resultado esperado completo, no una interpretación libre del título.

## Casos por sprint

### Sprint 1 · Base técnica, autenticación, roles y catálogo

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-01.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-001 | Alta válida | HU-S01-01 | RF-28 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-002 | Correo duplicado | HU-S01-01 | RF-28 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-003 | Técnico nuevo | HU-S01-02 | RF-28, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-004 | Autoactivación rechazada | HU-S01-02 | RF-28, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-005 | Acceso de cada rol | HU-S01-03 | RF-28 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-006 | Sesión cerrada | HU-S01-03 | RF-28 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-007 | Ruta administrativa denegada | HU-S01-04 | RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-008 | Alta administrativa pública denegada | HU-S01-04 | RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-009 | Edición propia | HU-S01-05 | RF-28, RF-33, RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-010 | Escritura obsoleta | HU-S01-05 | RF-28, RF-33, RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-011 | Semilla repetible | HU-S01-06 | RF-C01, RF-28, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-012 | Lectura real del catálogo | HU-S01-06 | RF-C01, RF-28, RF-33 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |

### Sprint 2 · Landing, administración de catálogo y perfil del técnico

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-02.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-013 | Diez secciones navegables | HU-S02-01 | RF-C08 | E2E / Cypress | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-014 | Carrusel accesible | HU-S02-01 | RF-C08 | E2E / Cypress | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-015 | Alta de subcategoría | HU-S02-02 | RF-C01, RF-C02 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-016 | Desactivar conserva historial | HU-S02-02 | RF-C01, RF-C02 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-017 | Audiencia vigente | HU-S02-03 | RF-C04, RF-C09 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-018 | Duplicado en borrador | HU-S02-03 | RF-C04, RF-C09 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-019 | Aprobación documentada | HU-S02-04 | RF-07, RF-30, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-020 | Documento ajeno denegado | HU-S02-04 | RF-07, RF-30, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-021 | Trabajo publicado | HU-S02-05 | RF-C06, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-022 | Archivo no permitido | HU-S02-05 | RF-C06, RF-33 | API / Pest + MySQL | P17 |
| TC-023 | Configuración válida | HU-S02-06 | RF-05, RF-07 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-024 | Intervalo inválido | HU-S02-06 | RF-05, RF-07 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-025 | Nueva versión de tarifa | HU-S02-07 | RF-05, RF-07, RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-026 | Tarifa negativa | HU-S02-07 | RF-05, RF-07, RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |

### Sprint 3 · Solicitud y búsqueda de técnicos

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-03.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-027 | Recorrido con corrección | HU-S03-01 | RF-01, RF-02 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-028 | Datos obligatorios ausentes | HU-S03-01 | RF-01, RF-02 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-029 | Foto propia vinculada | HU-S03-02 | RF-03, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-030 | Referencia de archivo ajeno | HU-S03-02 | RF-03, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-031 | Tarifa referencial visible | HU-S03-03 | RF-01, RF-04, RF-C02 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-032 | Fuera de cobertura | HU-S03-03 | RF-01, RF-04, RF-C02 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-033 | Filtros combinados | HU-S03-04 | RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-034 | Perfil sin datos privados | HU-S03-04 | RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-035 | Origen dirigido preservado | HU-S03-05 | RF-01, RF-02, RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-036 | Objetivo incompatible | HU-S03-05 | RF-01, RF-02, RF-C06 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-037 | Reintento del mismo envío | HU-S03-06 | RF-01, RF-02, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-038 | Solicitud ajena | HU-S03-06 | RF-01, RF-02, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |

### Sprint 4 · Matching, notificación, SLA y reasignación

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-04.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-039 | Elegible en su servicio | HU-S04-01 | RF-06, RF-07, RF-10 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-040 | Mejor puntaje pero suspendido | HU-S04-01 | RF-06, RF-07, RF-10 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-041 | Puntuación ponderada | HU-S04-02 | RF-06, RF-08, RF-09 | Unidad / Pest | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-042 | Desempate por calificación | HU-S04-02 | RF-06, RF-08, RF-09 | Unidad / Pest | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-043 | Distancia aproximada por zona | HU-S04-03 | RF-11, RF-12 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-044 | Perfil sin historial | HU-S04-03 | RF-11, RF-12 | API / Pest + MySQL | P15 |
| TC-045 | Tres ofertas como máximo | HU-S04-04 | RF-13, RF-15, RF-29 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-046 | Rollback no notifica éxito | HU-S04-04 | RF-13, RF-15, RF-29 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-047 | Aceptación dentro de plazo | HU-S04-05 | RF-15, RF-16 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-048 | Aceptación en el límite exacto | HU-S04-05 | RF-15, RF-16 | API / Pest + MySQL | P12 |
| TC-049 | Elección válida | HU-S04-06 | RF-18 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-050 | Dos reservas incompatibles | HU-S04-06 | RF-18 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-051 | Siguiente ronda única | HU-S04-07 | RF-16, RF-17 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-052 | Fallo de solicitud directa | HU-S04-07 | RF-16, RF-17 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-053 | Agotamiento de candidatos | HU-S04-08 | RF-14 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-054 | Expiración idempotente | HU-S04-08 | RF-14 | API / Pest + MySQL | P12 |
| TC-055 | Evento repetido tras reconexión | HU-S04-09 | RF-29 | Integración / Cypress + Reverb real | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-056 | Canal ajeno denegado | HU-S04-09 | RF-29 | Pest autorización + Reverb/cliente real | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-057 | Límite de reintentos | HU-S04-10 | RF-15, RF-29; RNF-07 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-058 | Job antiguo | HU-S04-10 | RF-15, RF-29; RNF-07 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |

### Sprint 5 · Atención, agenda y seguimiento

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-05.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-059 | Citas propias | HU-S05-01 | RF-19 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-060 | Agenda ajena | HU-S05-01 | RF-19 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-061 | Atención finalizada | HU-S05-02 | RF-19, RF-22 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-062 | Finalización repetida | HU-S05-02 | RF-19, RF-22 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-063 | Aceptación por contraparte | HU-S05-03 | RF-20 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-064 | Propuesta sin respuesta | HU-S05-03 | RF-20 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-065 | Finalizaciones independientes | HU-S05-04 | RF-21 | API / Pest + MySQL | P13 |
| TC-066 | Tercer participante vigente | HU-S05-04 | RF-21 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-067 | Contacto tras asignación | HU-S05-05 | RF-19, RF-33 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-068 | Contacto antes de asignación | HU-S05-05 | RF-19, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-069 | Cancelación antes de atender | HU-S05-06 | RF-19 | API / Pest + MySQL | P14 |
| TC-070 | Cancelación durante atención | HU-S05-06 | RF-19 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-071 | Retiro del técnico asignado | HU-S05-07 | RF-19, RF-20 | API / Pest + MySQL | P14 |
| TC-072 | Reporte de inasistencia | HU-S05-07 | RF-19, RF-20 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |

### Sprint 6 · Calificación, historial y apelaciones

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-06.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-073 | Envío en ventana válida | HU-S06-01 | RF-23 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-074 | Nota fuera de rango | HU-S06-01 | RF-23 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-075 | Edición no renueva plazo | HU-S06-02 | RF-23 | API / Pest + MySQL | P23 |
| TC-076 | Edición vencida | HU-S06-02 | RF-23 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-077 | Vencimiento individual | HU-S06-03 | RF-24 | API / Pest + MySQL | P12, P13 |
| TC-078 | Ya fue calificada | HU-S06-03 | RF-24 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-079 | Promedio real | HU-S06-04 | RF-23, RF-25 | API / Pest + MySQL | P07 |
| TC-080 | Texto no ejecutable | HU-S06-04 | RF-23, RF-25 | E2E / Cypress | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-081 | Apelación admitida | HU-S06-05 | RF-26 | API / Pest + MySQL | P07, P17 |
| TC-082 | Apelación ajena | HU-S06-05 | RF-26 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-083 | Resolución válida | HU-S06-06 | RF-26, RF-33 | API / Pest + MySQL | P07 |
| TC-084 | Reseña cambió al resolver | HU-S06-06 | RF-26, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-085 | Historial propio filtrado | HU-S06-07 | RF-25, RF-27 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-086 | Criterios sin datos de competidores | HU-S06-07 | RF-25, RF-27 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |

### Sprint 7 · Panel administrador completo

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-07.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-087 | Métricas reproducibles | HU-S07-01 | RF-30 | API / Pest + MySQL | P21 |
| TC-088 | Pendiente mayor de 20 horas | HU-S07-01 | RF-30 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-089 | Intervención válida | HU-S07-02 | RF-30, RF-33 | API / Pest + MySQL | P11, P14 |
| TC-090 | Sin permiso de reasignación | HU-S07-02 | RF-30, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-091 | Bloqueo conforme política | HU-S07-03 | RF-30, RF-33, RF-C12 | API / Pest + MySQL | P18 |
| TC-092 | Bloqueo sin motivo | HU-S07-03 | RF-30, RF-33, RF-C12 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-093 | Resolución de ticket | HU-S07-04 | RF-30, RF-C07 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-094 | Resolución no autorizada | HU-S07-04 | RF-30, RF-C07 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-095 | Publicación de versión válida | HU-S07-05 | RF-C03, RF-30 | API / Pest + MySQL | P19 |
| TC-096 | Pesos que suman 95 | HU-S07-05 | RF-C03, RF-30 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-097 | Exportaciones equivalentes | HU-S07-06 | RF-31 | API / Pest + MySQL | P21 |
| TC-098 | Descarga ajena | HU-S07-06 | RF-31 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-099 | Alta por responsable | HU-S07-07 | RF-C05, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-100 | Fallo de auditoría | HU-S07-07 | RF-C05, RF-33 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |

### Sprint 8 · Pagos, notificaciones, endurecimiento y despliegue

[Fuente de criterios y casos](../sprints-01-08/CANVAS-Sprint-08.md).

| ID | Caso | HU | RF/RNF | Herramienta prevista | Pendiente de regla |
|---|---|---|---|---|---|
| TC-101 | Constancia inequívoca | HU-S08-01 | RF-32, RF-C11 | API / Pest + MySQL | P01, P02, P16 |
| TC-102 | Comprobante ajeno | HU-S08-01 | RF-32, RF-C11 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-103 | Total conforme fórmula | HU-S08-02 | RF-32, RF-C11 | API / Pest + MySQL | P02, P21 |
| TC-104 | Tarifa actual no cambia historial | HU-S08-02 | RF-32, RF-C11 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-105 | Preferencia opcional respetada | HU-S08-03 | RF-C09, RF-29 | API / Pest + MySQL | P12 |
| TC-106 | Aviso ajeno no editable | HU-S08-03 | RF-C09, RF-29 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-107 | Ticket integrado | HU-S08-04 | RF-C07 | E2E / Cypress + API | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-108 | Solicitud ajena en soporte | HU-S08-04 | RF-C07 | API / Pest + MySQL | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-109 | Recorrido completo por roles | HU-S08-05 | RF-33; RNF-08, RNF-09, RNF-10 | E2E / Cypress + API + Reverb | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-110 | Configuración expuesta insegura | HU-S08-05 | RF-33; RNF-08, RNF-09, RNF-10 | Automatización de seguridad / CI | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-111 | Puerta de calidad válida | HU-S08-06 | RNF-11, RNF-12 | Automatización de calidad / CI | P21 |
| TC-112 | Gate fallido bloquea entrega | HU-S08-06 | RNF-11, RNF-12 | Automatización de calidad / CI | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-113 | Matching bajo carga | HU-S08-07 | RNF-01, RNF-02 | Carga: k6 propuesto (JMeter alternativo) | P21 |
| TC-114 | Carga no duplica reservas | HU-S08-07 | RNF-01, RNF-02 | Carga: k6 propuesto (JMeter alternativo) | P16, P21 |
| TC-115 | Medición de uso | HU-S08-08 | RNF-03, RNF-04, RNF-05 | Manual / estudio con participantes | P09, P21 |
| TC-116 | Reducción de búsqueda | HU-S08-08 | RNF-03, RNF-04, RNF-05 | Manual / estudio con participantes | P09, P21 |
| TC-117 | Restauración y humo | HU-S08-09 | RNF-06, RNF-10, RNF-13, RNF-14 | Integración operativa / scripts + revisión | Sin pendiente adicional indicado en el caso; revisar entrada del sprint |
| TC-118 | Disponibilidad observada | HU-S08-09 | RNF-06, RNF-10, RNF-13, RNF-14 | Monitoreo automatizado / ventana real | P09, P21 |

### Ampliación · Módulo A, gestión de la solicitud (RF-01 a RF-05)

[Casos completos, matriz de cobertura y pendientes](modulo-a/CASOS-Modulo-A-Gestion-Solicitud.md). Aprobados el 6 de octubre de 2026; cubren solo los vacíos de TC-001…TC-118 para RF-01 a RF-05. Se agrupan por módulo pero conservan el sprint de su HU. TC-122, TC-123 y TC-130 están bloqueados; TC-133 está condicionado.

| ID | Sprint | Caso | HU | RF/RNF | Herramienta prevista | Pendiente / estado |
|---|---|---|---|---|---|---|
| TC-119 | 3 | Datos obligatorios rechazados por la API | HU-S03-01 | RF-01, RF-02 | Pest + MySQL | Sin pendiente |
| TC-120 | 3 | Subcategoría inactiva o ajena a la especialidad | HU-S03-01 | RF-01 | Pest + MySQL | Sin pendiente |
| TC-121 | 3 | Modalidad programada sin fecha u hora | HU-S03-03 | RF-01 | Pest + MySQL | Sin pendiente |
| TC-122 | 3 | Máximo de solicitudes activas por cliente | HU-S03-06 | RF-01 | Pest + MySQL | P10 · **BLOQUEADO** |
| TC-123 | 3 | Longitud de la descripción | HU-S03-01 | RF-01 | Pest + MySQL | P17 · **BLOQUEADO** |
| TC-124 | 3 | Alertas de éxito y error en el envío | HU-S03-01 | RF-02 | Cypress + API | Sin pendiente |
| TC-125 | 3 | Resultado incierto tras perder la respuesta | HU-S03-06 | RF-02, RF-33 | Cypress + API | Sin pendiente |
| TC-126 | 3 | Solicitud enviada no modificable ni eliminable | HU-S03-06 | RF-02, RF-33 | Pest + MySQL | Sin pendiente |
| TC-127 | 3 | Fotos ocultas para técnico no notificado | HU-S03-02 | RF-03, RF-33 | Pest + MySQL | Sin pendiente |
| TC-128 | 3 | Retirar foto con confirmación | HU-S03-02 | RF-03 | Cypress + API | Sin pendiente |
| TC-129 | 3 | Retiro de foto por la API | HU-S03-02 | RF-03, RF-33 | Pest + MySQL | Variante de retiro tras envío sin regla |
| TC-130 | 3 | Archivo fuera de la política de fotos | HU-S03-02 | RF-03 | Pest + MySQL; Cypress | P17 · **BLOQUEADO** |
| TC-131 | 2 | Validación y alertas del formulario de tarifa | HU-S02-07 | RF-04, RF-05 | Cypress + API | Sin pendiente |
| TC-132 | 4 | Técnico en pausa excluido | HU-S04-01 | RF-05, RF-07 | Pest + MySQL | Sin pendiente |
| TC-133 | 4 | Franja con cita confirmada no disponible | HU-S04-06 | RF-05, RF-18 | Pest + MySQL | P05, P16 · **CONDICIONADO** |
| TC-134 | 2 | Disponibilidad o tarifa ajena | HU-S02-06, HU-S02-07 | RF-04, RF-05, RF-33 | Pest + MySQL | Sin pendiente |
| TC-135 | 2 | Validación y alertas del editor de disponibilidad | HU-S02-06 | RF-05 | Cypress + API | Sin pendiente |

### Ampliación · Cobertura RF/RNF (TC-136 a TC-140)

[Matriz de cobertura de los 33 RF y 14 RNF](Matriz-RF-RNF-Cobertura.md). Aprobados por Pimentel el 6 de octubre de 2026. Cubren cinco requerimientos que tenían caso asignado pero no cubierto: RF-11, RNF-03, RNF-08, RNF-11 y RNF-14. TC-140 está bloqueado; TC-136 y TC-138 están condicionados.

| ID | Sprint | Caso | HU | RF/RNF | Herramienta prevista | Pendiente / estado |
|---|---|---|---|---|---|---|
| TC-136 | 8 | Compatibilidad por navegador y tamaño de pantalla | HU-S08-08 | RNF-03 | Cypress (Chrome, Edge, Firefox) | P21 · **CONDICIONADO** |
| TC-137 | 1 | Contraseña almacenada con bcrypt y nunca expuesta | HU-S01-01 | RNF-08, RF-33 | Pest + MySQL | Sin pendiente |
| TC-138 | 8 | Reglas de dependencia entre capas | HU-S08-06 | RNF-11 | Pest (arch) | Reglas de capas por fijar en el diseño · **CONDICIONADO** |
| TC-139 | 8 | Migraciones reproducibles y versionadas | HU-S08-09 | RNF-14, RNF-13 | Pest + CI + MySQL | Sin pendiente |
| TC-140 | 4 | Estimación con historial suficiente | HU-S04-03 | RF-11 | Pest + MySQL | P15 · **BLOQUEADO** |

## Diseño mínimo de cada automatización

Conservar ID y enlazar fuente/versión; preparar datos sintéticos; ejecutar acción; comparar estado HTTP/contrato, datos persistidos, efectos de cola/eventos y auditoría donde corresponda. Los tests de UI además comprueban mensaje/foco/estado visible. No asumir que un `200` o una captura satisface todas las aserciones.

El CSV conserva Dado/Cuando/Entonces originales y deja vacíos ejecución, commit y resultado real. Los pasos más detallados se encuentran en el CANVAS del sprint enlazado. Si un oráculo cambia por resolución de Pxx, actualizar su versión con decisión y mantener historia; no reescribir silenciosamente lo esperado para hacer pasar código existente.

## Ampliaciones exigidas por las adendas

- Familias CRUD/validación/autorización de P11-B: instanciar por recurso/formulario y operación permitida, con sufijos API/UI cuando sean casos distintos.
- Familias temporales de §10 del plan: fijar un ID único por reloj/límite, incluyendo antes/exacto/después y jobs obsoletos. Los TC previos se amplían o enlazan; no duplicar un mismo criterio solo para inflar el mínimo de 60.
- Ampliar integración/seguridad/carga según el riesgo. Los 118 casos no representan un techo ni una cobertura automática de cada formulario que se implemente.
- Registrar toda alerta real en la [plantilla de alertas](Plantilla-Registro-Alertas.csv); una fila por combinación de recurso/acción/resultado y ejecución por navegador/entorno cuando corresponda.

## Casos de ejemplo adicionales especificados (sin ejecutar)

| ID nuevo | Precondición y acción | Resultado esperado | Herramienta / relación |
|---|---|---|---|
| TC-AD-S02-CRUD-03-comunicado-UI | Administrador autorizado, comunicado sintético eliminable; pulsar eliminar y cancelar confirmación. | Confirmación identificable; no petición de eliminación; registro intacto tras recargar. | Cypress; HU-S02-03. |
| TC-AD-S02-VAL-02-tarifa-API | Técnico autorizado envía directamente tarifa negativa para servicio propio. | 422 con mensajes españoles, sin nueva versión ni cambio en tarifa vigente. | Pest/MySQL; TC-026, HU-S02-07. |
| TC-AD-S02-VAL-01-tarifa-UI | Introducir tarifa negativa en formulario. | Error de campo español y ninguna petición de guardado. | Cypress; complementa TC-026, HU-S02-07. |
| TC-AD-S07-CRUD-02-reglas-UI | Administrador autorizado intenta publicar pesos cuya suma es 95 %. | Mensaje comprensible, sin falso éxito; la versión vigente permanece. | Cypress + API real; TC-096, HU-S07-05. |
| TC-AD-S03-NET-01-solicitud-UI | Se pierde la respuesta después del envío; el servidor pudo confirmar. | Aviso de resultado incierto; recuperación por API/idempotencia; exactamente una solicitud. | Cypress + integración; TC-037, HU-S03-06. |
| TC-TIME-SLA-1001-API | Oferta durable con plazo de 10 min; validar a 10:01. | Rechazo por vencimiento aunque el job aún no haya cambiado el estado; no aceptación. | Pest, reloj inyectado; HU-S04-05, completar anclaje P12. |
| TC-TIME-RATE-4801-API | Participación finalizada sin nota; primer envío a 48:01 h. | Calificación rechazada; estado/evento de cierre según proceso, sin nota creada. | Pest; HU-S06-01/03. |

**Actualización 6 de octubre de 2026:** TC-125 formaliza TC-AD-S03-NET-01-solicitud-UI y TC-131 formaliza TC-AD-S02-VAL-01-tarifa-UI. TC-AD-S02-VAL-02-tarifa-API no se numera porque comprueba lo mismo que TC-026.

Estos ejemplos son especificaciones candidatas; no se han creado archivos PHP/JS ni corrido tests. Los dos casos vinculados a TC-026 no cuentan como dos nuevos comportamientos backend para la cuota: mantener deduplicación de criterios.
