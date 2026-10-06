# Matriz de cobertura RF/RNF → casos de prueba

**Proyecto:** TécnicoYa Huancayo · **Fecha:** 6 de octubre de 2026.  
**Estado:** matriz y casos nuevos TC-136 a TC-140 aprobados por el equipo (Delgado, Mayhuasca y Pimentel) el 6 de octubre de 2026. **NO EJECUTADO.** Ningún caso está implementado ni ejecutado.

Base: [Matriz-Trazabilidad-TC.csv](Matriz-Trazabilidad-TC.csv) (TC-001 a TC-140) y las definiciones de RF/RNF del [análisis del MVP](../CANVAS-Analisis-MVP-TecnicoYa.md). Versión filtrable: [Matriz-RF-RNF-Cobertura.csv](Matriz-RF-RNF-Cobertura.csv).

## 1. «Tiene caso asignado» no es lo mismo que «está cubierto»

Un requerimiento **tiene caso asignado** cuando algún caso lo menciona en su columna RF/RNF. Está **cubierto** cuando al menos un caso comprueba lo que el requerimiento exige. Con TC-001 a TC-135, los 33 RF y los 14 RNF tenían caso asignado, pero en cinco de ellos la asignación era aparente: los casos trazados no verificaban el requerimiento.

| Requerimiento | Casos asignados antes | Por qué no lo cubrían | Caso nuevo |
|---|---|---|---|
| RF-11 · Tiempo estimado | TC-043, TC-044 | Solo se probaba la estimación general del técnico nuevo; no la estimación por experiencia/historial. | TC-140 (bloqueado P15) |
| RNF-03 · Chrome, Edge, Firefox; móvil y escritorio | TC-115, TC-116 | Son estudios humanos (SUS y búsqueda); no ejecutan los flujos en cada navegador ni tamaño de pantalla. | TC-136 (condicionado P21) |
| RNF-08 · Protección de contraseñas | TC-109, TC-110 | Recorrido por roles y revisión de configuración; ninguno verifica el hash bcrypt ni su ausencia en respuestas, auditoría y logs. | TC-137 (ejecutable) |
| RNF-11 · Separación de responsabilidades | TC-111, TC-112 | Prueban el Quality Gate de SonarQube, no las dependencias entre capas. | TC-138 (condicionado: reglas de capas por fijar en el diseño) |
| RNF-14 · Cambios de estructura versionados | TC-117, TC-118 | Restaurar un respaldo y observar disponibilidad no demuestran que las migraciones construyan el esquema. | TC-139 (ejecutable) |

«Cubierto en diseño» tampoco significa «verificado»: solo indica que existe un caso especificado que comprueba el requerimiento. La verificación exige implementar el caso, ejecutarlo y conservar la evidencia. Los casos bloqueados o condicionados no cubren su requerimiento hasta que se resuelve su pendiente.

## 2. Requerimientos funcionales (33)

Los casos se citan por número (por ejemplo, 041 = TC-041). ⚠ marca los requerimientos de la sección 1.

| Req. | Descripción | Módulo | Casos TC-001…135 | Nuevos | Total | Cobertura actual | Pendientes |
|---|---|---|---|---|---:|---|---|
| RF-01 | Registrar especialidad, descripción y ubicación dentro de cobertura; modalidad/horario en el paso 4. | A | 027, 028, 031, 032, 035, 036, 037, 038, 119, 120, 121, 122, 123 | — | 13 | Asignado y cubierto en diseño | P10, P17 |
| RF-02 | Revisar resumen y confirmar envío en el quinto paso. | A | 027, 028, 035, 036, 037, 038, 119, 124, 125, 126 | — | 10 | Asignado y cubierto en diseño | P22 |
| RF-03 | Asociar evidencia fotográfica con control de acceso. | A | 029, 030, 127, 128, 129, 130 | — | 6 | Asignado y cubierto en diseño | P17 |
| RF-04 | Mostrar tarifa referencial, sin compromiso de cobro. | A | 031, 032, 131, 134 | — | 4 | Asignado y cubierto en diseño | P01, P16 |
| RF-05 | Declarar disponibilidad horaria y evitar solapamientos de citas. | A | 023, 024, 025, 026, 131, 132, 133, 134, 135 | — | 9 | Asignado y cubierto en diseño | P05, P16 |
| RF-06 | Matching por cercanía, tarifa, historial y experiencia según pesos. | B | 039, 040, 041, 042 | — | 4 | Asignado y cubierto en diseño | P15 |
| RF-07 | Filtrar prestadores habilitados, activos, disponibles y compatibles. | B | 019, 020, 023, 024, 025, 026, 039, 040, 132 | — | 9 | Asignado y cubierto en diseño | — |
| RF-08 | Ordenar candidatos según la puntuación obtenida. | B | 041, 042 | — | 2 | Asignado y cubierto en diseño | — |
| RF-09 | Desempatar por calificación promedio; empate persistente pendiente. | B | 041, 042 | — | 2 | Asignado y cubierto en diseño | P15 |
| RF-10 | Afinar por subcategoría activa ofrecida por el técnico. | B | 039, 040 | — | 2 | Asignado y cubierto en diseño | — |
| RF-11 ⚠ | Mostrar tiempo estimado según experiencia/historial, o estimación general sin datos suficientes. | B | 043, 044 | 140 | 3 | Cubierto en diseño con TC-140 (bloqueado P15) | P15 |
| RF-12 | Mostrar distancia aproximada por zona. | B | 043, 044 | — | 2 | Asignado y cubierto en diseño | — |
| RF-13 | Limitar ofertas simultáneas a tres, o parámetro vigente. | B | 045, 046 | — | 2 | Asignado y cubierto en diseño | — |
| RF-14 | Mantener Pendiente de disponibilidad y expirar al superar 24 h. | B | 053, 054 | — | 2 | Asignado y cubierto en diseño | P12 |
| RF-15 | Notificar ofertas al técnico autorizado. | C | 045, 046, 047, 048, 057, 058 | — | 6 | Asignado y cubierto en diseño | — |
| RF-16 | Controlar plazo de respuesta y registrar vencimientos. | C | 047, 048, 051, 052 | — | 4 | Asignado y cubierto en diseño | P12 |
| RF-17 | Reasignar según ruta automática o excepción de solicitud directa; registrar incidencias. | C | 051, 052 | — | 2 | Asignado y cubierto en diseño | — |
| RF-18 | Confirmar elección del cliente entre aceptaciones válidas. | C | 049, 050, 133 | — | 3 | Asignado y cubierto en diseño | P11 |
| RF-19 | Consultar estados y trazabilidad, incluida cancelación. | D | 059, 060, 061, 062, 067, 068, 069, 070, 071, 072 | — | 10 | Asignado y cubierto en diseño | P14 |
| RF-20 | Reprogramar por acuerdo y conservar fecha si no se acepta en 24 h. | D | 063, 064, 071, 072 | — | 4 | Asignado y cubierto en diseño | P06, P14 |
| RF-21 | Coordinar principal y un adicional autorizado por cliente. | D | 065, 066 | — | 2 | Asignado y cubierto en diseño | P13 |
| RF-22 | Registrar reporte y finalización; efectuar cierre operativo. | D | 061, 062 | — | 2 | Asignado y cubierto en diseño | — |
| RF-23 | Calificar de 1 a 5 con comentario dentro de 48 h; editar dentro del plazo propio. | E | 073, 074, 075, 076, 079, 080 | — | 6 | Asignado y cubierto en diseño | P23 |
| RF-24 | Cerrar sin calificación al vencer su plazo. | E | 077, 078 | — | 2 | Asignado y cubierto en diseño | P12, P13 |
| RF-25 | Consultar historial de solicitudes, atenciones y calificaciones. | E | 079, 080, 085, 086 | — | 4 | Asignado y cubierto en diseño | P07 |
| RF-26 | Presentar apelaciones y resolverlas con motivo e historial. | E | 081, 082, 083, 084 | — | 4 | Asignado y cubierto en diseño | P07, P17 |
| RF-27 | Mostrar al técnico criterios del matching. | E | 085, 086 | — | 2 | Asignado y cubierto en diseño | — |
| RF-28 | Registro e inicio de sesión por rol, sin alta administrativa pública. | F | 001, 002, 003, 004, 005, 006, 009, 010, 011, 012 | — | 10 | Asignado y cubierto en diseño | — |
| RF-29 | Notificaciones en tiempo real dentro del entorno autorizado de prueba. | Comunicación y simulación económica | 045, 046, 055, 056, 057, 058, 105, 106 | — | 8 | Asignado y cubierto en diseño | P12 |
| RF-30 | Supervisión administrativa de solicitudes, técnicos, estados e incidencias. | F | 019, 020, 087, 088, 089, 090, 091, 092, 093, 094, 095, 096 | — | 12 | Asignado y cubierto en diseño | P18, P19, P21 |
| RF-31 | Reportes de cobertura y desempeño por zona/especialidad. | F | 097, 098 | — | 2 | Asignado y cubierto en diseño | P21 |
| RF-32 | Seleccionar y registrar método de pago sin procesar dinero; detalle pendiente. | Comunicación y simulación económica | 101, 102, 103, 104 | — | 4 | Asignado y cubierto en diseño | P01, P02, P16 |
| RF-33 | Proteger datos y aplicar permisos por rol y relación con el servicio. | F | 003, 004, 007, 008, 009, 010, 011, 012, 019, 020, 021, 022, 029, 030, 037, 038, 067, 068, 083, 084, 089, 090, 091, 092, 099, 100, 109, 110, 125, 126, 127, 129, 134 | 137 | 34 | Asignado y cubierto en diseño | — |

## 3. Requerimientos no funcionales (14)

| Req. | Descripción | Módulo | Casos TC-001…135 | Nuevos | Total | Cobertura actual | Pendientes |
|---|---|---|---|---|---:|---|---|
| RNF-01 | Matching en 3 segundos o menos. | Plataforma | 113, 114 | — | 2 | Asignado y cubierto en diseño | P21 |
| RNF-02 | 200 usuarios concurrentes. | Plataforma | 113, 114 | — | 2 | Asignado y cubierto en diseño | P21 |
| RNF-03 ⚠ | Uso en Chrome, Edge y Firefox; adaptación a móvil/escritorio. | Plataforma | 115, 116 | 136 | 3 | Cubierto en diseño con TC-136 (condicionado) | P21 |
| RNF-04 | SUS de 70 o más. | Plataforma | 115, 116 | — | 2 | Asignado y cubierto en diseño | P09, P21 |
| RNF-05 | Cinco pasos y mediana de 3 minutos o menos para registrar solicitud. | Plataforma | 115, 116 | — | 2 | Asignado y cubierto en diseño | P09, P21 |
| RNF-06 | Disponibilidad del 99 %. | Plataforma | 117, 118 | — | 2 | Asignado y cubierto en diseño | P09, P21 |
| RNF-07 | Hasta tres reintentos de notificación. | Plataforma | 057, 058 | — | 2 | Asignado y cubierto en diseño | P12 |
| RNF-08 ⚠ | Protección de contraseñas almacenadas. | Plataforma | 109, 110 | 137 | 3 | Cubierto en diseño con TC-137 (ejecutable) | — |
| RNF-09 | Control de acceso por rol. | Plataforma | 109, 110 | — | 2 | Asignado y cubierto en diseño | — |
| RNF-10 | Protección de información en tránsito. | Plataforma | 109, 110, 117, 118 | — | 4 | Asignado y cubierto en diseño | — |
| RNF-11 ⚠ | Separación de responsabilidades de la solución. | Plataforma | 111, 112 | 138 | 3 | Cubierto en diseño con TC-138 (condicionado) | Reglas de capas por fijar en el diseño |
| RNF-12 | Cobertura de pruebas de al menos 70 % en matching, notificación y calificación. | Plataforma | 111, 112 | — | 2 | Asignado y cubierto en diseño | P21 |
| RNF-13 | Despliegue reproducible según restricción de F0. | Plataforma | 117, 118 | 139 | 3 | Asignado y cubierto en diseño | — |
| RNF-14 ⚠ | Cambios de estructura de datos versionados. | Plataforma | 117, 118 | 139 | 3 | Cubierto en diseño con TC-139 (ejecutable) | — |

## 4. Requerimientos sin caso

- **Ninguno de los 33 RF ni de los 14 RNF queda sin caso asignado.** Los cinco de la sección 1 ya tienen un caso que los comprueba; de ellos, RF-11, RNF-03 y RNF-11 siguen sujetos a pendientes y no se consideran cubiertos hasta resolverlos.
- **RF-C10** (retención y anonimización al cerrar la cuenta) no tiene ningún caso. No pertenece a los 33 RF y depende por completo de P08; queda sin caso hasta que P08 se resuelva.
- **Empate persistente (RF-09)** y otros comportamientos sujetos a pendientes Pxx no tienen caso propio: escribir un test no convierte un pendiente en regla.

## 5. Casos nuevos TC-136 a TC-140

| ID | Sprint | Req. | Caso | Herramienta | Estado |
|---|---|---|---|---|---|
| TC-136 | 8 | RNF-03 | Flujos críticos y sus alertas en Chrome, Edge y Firefox, escritorio y móvil, con teclado y foco | Cypress | Condicionado P21: versiones y resoluciones pendientes de decisión |
| TC-137 | 1 | RNF-08, RF-33 | Contraseña guardada con bcrypt, distinta del texto original y ausente de respuestas, auditoría y logs | Pest + MySQL | Ejecutable |
| TC-138 | 8 | RNF-11 | Reglas de dependencia entre capas mediante pruebas de arquitectura | Pest (arch) | Condicionado: reglas concretas por fijar en el diseño |
| TC-139 | 8 | RNF-14, RNF-13 | Migraciones aplicadas sobre base vacía y sobre el esquema del release anterior; esquema igual al diccionario y datos conservados | Pest + CI + MySQL | Ejecutable |
| TC-140 | 4 | RF-11 | Estimación por experiencia/historial con al menos 3 servicios finalizados | Pest + MySQL | BLOQUEADO P15: fórmula y duraciones pendientes de decisión |

Detalle Dado/Cuando/Entonces en la [matriz de trazabilidad](Matriz-Trazabilidad-TC.csv) y en el [catálogo](CATALOGO-TC.md).

## 6. Total de casos por módulo

Cada caso se cuenta una sola vez, en el módulo de su primer RF/RNF trazado. Por eso algunos casos quedan en un módulo distinto al de su sprint: TC-019/020 y TC-045/046 cuentan en B (RF-07 y RF-13), y TC-132/133 en A (RF-05).

| Módulo | TC-001…135 | Nuevos | Total |
|---|---:|---:|---:|
| A · Solicitudes (RF-01 a RF-05) | 31 | — | 31 |
| B · Matching (RF-06 a RF-14) | 12 | 1 | 13 |
| C · Ofertas y respuesta (RF-15 a RF-18) | 8 | — | 8 |
| D · Atención (RF-19 a RF-22) | 14 | — | 14 |
| E · Reputación (RF-23 a RF-27) | 14 | — | 14 |
| F · Identidad, gobierno y RF-C (RF-28, 30, 31, 33) | 42 | — | 42 |
| Comunicación y simulación económica (RF-29, RF-32) | 6 | — | 6 |
| Plataforma (RNF) | 8 | 4 | 12 |
| **Total** | **135** | **5** | **140** |

**Meta de ≥72 casos:** cumplida en diseño, con 140 casos especificados. No significa que haya pruebas implementadas, ejecutadas o aprobadas. La meta de ≥60 IDs Pest aprobados sigue sin cumplirse hasta ejecutar.
