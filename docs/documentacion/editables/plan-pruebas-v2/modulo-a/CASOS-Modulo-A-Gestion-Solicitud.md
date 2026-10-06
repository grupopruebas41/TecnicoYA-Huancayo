# Casos de prueba · Módulo A: Gestión de la solicitud

**Proyecto:** TécnicoYa Huancayo · **Fecha:** 6 de octubre de 2026 · **Versión:** 2, sustituye la propuesta provisional del 5 de octubre.  
**Estado:** matriz y casos aprobados por el equipo (Delgado, Mayhuasca y Pimentel) el 6 de octubre de 2026. **NO EJECUTADO.** No se ha implementado ni corrido ninguna prueba.

## 1. Alcance y criterio de esta versión

El Módulo A comprende RF-01 (registro de la solicitud), RF-02 (resumen y confirmación), RF-03 (fotos), RF-04 (tarifa referencial) y RF-05 (disponibilidad y no solapamiento). RF-33 se aplica como control transversal de autorización.

La propuesta anterior (24 casos, TC-119 a TC-142) queda **descartada**: duplicaba comportamientos ya cubiertos por TC-001…TC-118. Esta versión parte de los casos existentes, identifica los vacíos y crea casos **solo para ellos**: 17 casos, TC-119 a TC-135. Los IDs TC-136 a TC-142 dejan de existir.

Fuentes: [catálogo](../CATALOGO-TC.md), [matriz](../Matriz-Trazabilidad-TC.csv), [análisis](../../CANVAS-Analisis-MVP-TecnicoYa.md) (HU-03 a HU-06, RN y pendientes Pxx), [Sprint 2](../../sprints-01-08/CANVAS-Sprint-02.md), [Sprint 3](../../sprints-01-08/CANVAS-Sprint-03.md), [plan de pruebas](../../PLAN-DE-PRUEBAS-TecnicoYa-v2.md) y [adenda del Sprint 3](../../adendas-docente-2026-10-05/ADENDA-Sprint-03.md).

## 2. Matriz de cobertura: requerimiento → casos

| RF | Qué exige | Casos existentes | Cobertura previa | Casos nuevos |
|---|---|---|---|---|
| **RF-01** | Especialidad, descripción y ubicación dentro de cobertura; modalidad/horario en el paso 4 (HU-03; RN-03, RN-04, RN-27, RN-30) | TC-027, TC-028, TC-031, TC-032, TC-035, TC-036, TC-037, TC-038 | Parcial | TC-119, TC-120, TC-121, TC-122, TC-123 |
| **RF-02** | Resumen y confirmación en el paso 5 (HU-03; alertas de la adenda S03) | TC-027, TC-028, TC-035, TC-036, TC-037, TC-038 | Parcial: sin alertas ni ruta de error en la interfaz | TC-124, TC-125, TC-126 |
| **RF-03** | Fotos con control de acceso (HU-04; RN-22; P17) | TC-029, TC-030 | Parcial | TC-127, TC-128, TC-129, TC-130 |
| **RF-04** | Tarifa referencial sin compromiso de cobro (HU-05; RN-29) | TC-031, TC-025, TC-026; indirectos TC-012, TC-016 | Casi completa: sin validación en la interfaz | TC-131, TC-134 |
| **RF-05** | Disponibilidad y evitar solapamientos (HU-06; RN-13) | TC-023, TC-024, TC-039, TC-050, TC-063 | Parcial | TC-132, TC-133, TC-134, TC-135 |

### 2.1 Vacíos y caso que los cubre

| Vacío detectado | Regla / origen | Caso |
|---|---|---|
| TC-028 valida solo en React; falta la validación del servidor cuando se elude la interfaz | Adenda VAL-02 | TC-119 |
| Envío con subcategoría inactiva o ajena a la especialidad (TC-016 no prueba el envío) | AC-03.2, RN-27 | TC-120 |
| Modalidad programada sin fecha u hora en el paso 4 | RN-04 | TC-121 |
| Máximo de solicitudes activas simultáneas | RN-30 | TC-122 (bloqueado P10) |
| Límite de longitud de la descripción | P17 | TC-123 (bloqueado P17) |
| Alertas de éxito y error del paso 5 | Adenda CRUD-01/02 | TC-124 |
| Resultado incierto por pérdida de la respuesta, en la interfaz | Adenda NET-01 | TC-125 |
| Modificación o eliminación de una solicitud ya enviada | Plan §9.2 | TC-126 |
| Técnico no notificado accede a las fotos (TC-038 solo cubre a otro cliente) | AC-04.2, RN-22 | TC-127 |
| Retiro de foto con confirmación (operación de eliminación del módulo) | Adenda CRUD-03, T-S03-02 | TC-128, TC-129 |
| Tipo, tamaño y cantidad de fotos | AC-04.1 | TC-130 (bloqueado P17) |
| Validación y alertas del formulario de tarifa en la interfaz | VAL-01, CRUD-01 | TC-131 |
| Exclusión del técnico en pausa (TC-039 solo prueba el caso sin pausa) | AC-06.1 | TC-132 |
| Franja con cita confirmada, sin concurrencia (TC-050 cubre la carrera) | AC-06.2, RN-13 | TC-133 (condicionado P05/P16) |
| Modificación de disponibilidad o tarifa de otro técnico | AUTH-01 | TC-134 |
| Validación y alertas del editor de disponibilidad (TC-024 solo cubre la API) | VAL-01, CRUD-01/02 | TC-135 |

### 2.2 Reglas sin caso, a propósito

No se crea caso mientras no exista la decisión; escribir un test no convierte un pendiente en regla.

- **P01:** moneda (S/ propuesta, sin confirmar).
- **P16:** relación entre tarifa de catálogo y tarifa del técnico; si la tarifa 0 está permitida.
- **P22:** existencia de un borrador antes de Registrada y nombre del estado tras el envío.
- **Retiro de fotos después del envío:** sin regla; queda como variante pendiente de TC-129.
- **Eliminar franjas o distritos de cobertura:** ninguna HU lo autoriza; «no aplica» justificado por el alcance.
- **TC-AD-S02-VAL-02-tarifa-API:** no se numera, porque comprueba lo mismo que TC-026. TC-125 y TC-131 formalizan los ejemplos TC-AD-S03-NET-01-solicitud-UI y TC-AD-S02-VAL-01-tarifa-UI del catálogo.

## 3. Datos base y precondiciones

**B0:** entorno aislado con API Laravel y MySQL de pruebas; datos sintéticos; cuentas sin datos reales; reloj UTC cuando hay horario; notificaciones sin destinatarios reales. En cada variante, todos los datos ajenos a su objetivo son válidos, y se ejecuta con fixture limpio o aislamiento equivalente. Sesión y CSRF válidos salvo que sean objeto del caso; una prueba HTTP interna no acredita CSRF si el middleware está desactivado.

| Símbolo | Dato de prueba |
|---|---|
| C1 / C2 | Clientes distintos, sin permisos administrativos. |
| T1 / T2 | Técnicos habilitados distintos, con un solo rol cada uno. |
| ESP1 / SUB1 / SUB2 / SUB-INA | Especialidad activa; subcategoría activa de ESP1; subcategoría de otra especialidad; subcategoría desactivada por el flujo administrativo. |
| R1 / E1 | Solicitud de C1 y su evidencia privada. |
| K1 | Clave de idempotencia válida; no es una credencial. |

Códigos de error: cuando el resultado esperado dice «el código que fije el contrato», ese código se define antes de automatizar. No se aprueba un test porque «devolvió cualquier 4xx».

## 4. Valores pendientes de decisión

No se inventan límites. Los casos que dependen de ellos están especificados, pero no pueden ejecutarse ni aprobarse hasta que se resuelva su pendiente.

| Valor | Pendiente | Casos afectados | Estado |
|---|---|---|---|
| Máximo de solicitudes activas simultáneas por cliente y estados que cuentan | P10 | TC-122 | BLOQUEADO |
| Longitud mínima y máxima de la descripción, y unidad de medida | P17 (incorporado el 06/10/2026) | TC-123 | BLOQUEADO |
| Tipos, tamaño máximo, cantidad máxima y obligatoriedad de fotos | P17 | TC-130 | BLOQUEADO |
| Duración de la franja y margen de atención inmediata | P05, P16 | TC-133 | Condicionado: diseñable, sin aprobación hasta resolver |
| Retiro de fotos tras el envío | Sin regla | Variante de TC-129 | La variante no cuenta para aprobar el caso |

## 5. Tabla de casos de prueba

Prioridad **Crítica**: privacidad, autorización, archivos o validación eludida. **Alta**: funcionalidad y límites esenciales. Un caso con varias variantes es un solo ID y solo se aprueba cuando pasan todas sus variantes aplicables.

| ID | Requerimiento | Nivel o tipo | Precondiciones | Datos de entrada | Pasos | Resultado esperado | Prioridad | Herramienta | Estado |
|---|---|---|---|---|---|---|---|---|---|
| **TC-119** Datos obligatorios rechazados por la API | RF-01, RF-02 | API/integración; CE inválidas; elusión de React | B0; C1 autenticado con sesión/CSRF válidos; catálogo semilla activo; conteos iniciales de solicitudes, eventos y trabajos conocidos. | Una anomalía por variante, resto válido: subcategoría ausente; descripción ausente, vacía o solo espacios; distrito ausente; tipo incorrecto (texto donde se espera identificador). | 1. Registrar conteos. 2. Enviar cada variante directamente a la API, sin React. 3. Revisar respuesta. 4. Comparar conteos y restablecer fixture entre variantes. | 422 con error en español asociado al campo de cada variante; sin solicitud parcial, evento de envío ni trabajo de matching; conteos intactos; sin detalles técnicos internos en la respuesta. | Crítica | Pest + MySQL | NO EJECUTADO |
| **TC-120** Subcategoría inactiva o ajena a la especialidad | RF-01 | API/integración; CE de catálogo | B0; C1 autenticado; SUB-INA desactivada mediante el flujo administrativo; SUB2 pertenece a otra especialidad. | Variantes: SUB-INA; identificador de subcategoría inexistente; ESP1 con SUB2 (solo si el contrato transporta ambos valores). Control: ESP1/SUB1 activas. | 1. Consultar subcategorías ofrecidas en el paso 2. 2. Enviar el registro con cada variante. 3. Revisar respuesta y base de datos. | El listado del paso 2 excluye SUB-INA. Cada variante inválida: 422 que identifica la subcategoría como dato a corregir, sin guardar. El control se registra con especialidad derivada coherente. | Alta | Pest + MySQL | NO EJECUTADO |
| **TC-121** Modalidad programada sin fecha u hora | RF-01 | API; tabla de decisión modalidad × fecha/hora | B0; C1 autenticado; resto de datos válidos. | Programada sin fecha; programada sin hora; programada sin ambas. Control: programada con fecha y hora futuras de prueba. | 1. Enviar cada variante del paso 4. 2. Revisar respuesta y base de datos. | Variantes incompletas: 422 en español sobre fecha/hora, sin guardar. Control aceptado. No se prueban aquí fechas pasadas, duración ni margen inmediato (P05/P16). | Alta | Pest + MySQL | NO EJECUTADO |
| **TC-122** Máximo de solicitudes activas por cliente | RF-01 | API; AVL | B0; C1 autenticado; máximo K y estados que cuentan como activos aprobados en P10. | C1 con K−1 solicitudes activas; C1 con K solicitudes activas. K: PENDIENTE DE DECISIÓN (P10). | 1. Preparar C1 con K−1 activas y registrar otra. 2. Preparar C1 con K activas y registrar otra. | Con K−1: se crea (total K). Con K: rechazo en español con el código que fije el contrato, sin crear. No se asume 1 ni ilimitado. | Alta | Pest + MySQL | BLOQUEADO |
| **TC-123** Longitud de la descripción | RF-01 | API; AVL | B0; C1 autenticado; Dmin, Dmax y unidad de longitud aprobados en P17. | Descripciones de longitud Dmin−1, Dmin, Dmax y Dmax+1. Dmin/Dmax: PENDIENTES DE DECISIÓN (P17). | 1. Generar textos con la unidad aprobada, sin relleno que el validador recorte. 2. Enviar cada uno con fixture limpio. 3. Comparar respuesta y texto persistido. | Dentro de [Dmin, Dmax]: se guarda íntegro. Fuera: 422 en español, sin guardar ni truncar. No se deduce un máximo del tipo de columna. | Alta | Pest + MySQL | BLOQUEADO |
| **TC-124** Alertas de éxito y error en el envío | RF-02 | E2E; alertas de interfaz | B0; C1 autenticado; React y API reales sobre MySQL de pruebas. | Variantes: (a) envío válido; (b) subcategoría desactivada entre el paso 2 y el 5, para obtener un 422 real del servidor; (c) 500 controlado en entorno aislado, solo como prueba de presentación. | 1. Completar los cinco pasos. 2. Confirmar en el paso 5. 3. Observar mensaje, foco y estado. 4. Recargar y consultar la API. | (a) Éxito en español solo tras la respuesta confirmada; la solicitud aparece al recargar. (b) Mensaje en español que señala el dato a corregir, sin éxito y con el asistente conservando los datos. (c) Mensaje genérico en español, sin detalles técnicos ni éxito falso. | Alta | Cypress + API | NO EJECUTADO |
| **TC-125** Resultado incierto tras perder la respuesta | RF-02, RF-33 | E2E + integración; fallo de red | B0; C1 autenticado; inyección controlada que descarta la respuesta después de que el servidor confirma. | Solicitud válida con clave de idempotencia K1. | 1. Confirmar el envío. 2. Perder la respuesta. 3. Observar el aviso. 4. Recuperar el estado o reintentar desde la interfaz. | Aviso en español de resultado incierto, sin afirmar éxito ni fracaso; la interfaz consulta el estado o reintenta con K1; al final hay exactamente una solicitud y se muestra su estado real. | Alta | Cypress + API | NO EJECUTADO |
| **TC-126** Solicitud enviada no modificable ni eliminable | RF-02, RF-33 | API/integración; transición prohibida | B0; R1 de C1 en el estado posterior al envío (nombre según P22) con evidencia E1; contrato de error definido antes de automatizar. | C1 intenta cambiar descripción, subcategoría o distrito de R1; C1 intenta eliminar R1. | 1. Tomar instantánea de R1, E1 y eventos. 2. Enviar cada operación directamente a la API. 3. Comparar con la instantánea. | Rechazo con el código que fije el contrato (no se acepta cualquier 4xx); R1, E1 y eventos idénticos; sin evento de modificación. La cancelación (RN-15, TC-069) es otra operación y no se prueba aquí. | Crítica | Pest + MySQL | NO EJECUTADO |
| **TC-127** Fotos ocultas para técnico no notificado | RF-03, RF-33 | API/integración; autorización | B0; R1 de C1 con evidencia E1; T2 técnico habilitado de la misma especialidad, sin oferta ni asignación sobre R1. Desde el Sprint 4 se añade el control T1 notificado. | T2 consulta el detalle de R1 por identificador y la descarga de E1 por identificador o URL. | 1. Autenticar a T2. 2. Pedir detalle de R1. 3. Pedir E1. 4. Verificar que E1 no cambió. | Denegado con el código que fije el contrato; sin bytes ni metadatos de E1, descripción privada ni dirección. Control S4: T1 notificado ve zona, descripción y fotos, pero no contacto ni dirección exacta. | Crítica | Pest + MySQL | NO EJECUTADO |
| **TC-128** Retirar foto con confirmación | RF-03 | E2E; confirmación de eliminación | B0; C1 con una solicitud aún no enviada y dos fotos adjuntas. | Variantes: cancelar la confirmación; confirmar; confirmar con error controlado del servidor. | 1. Pulsar retirar. 2. Cancelar y observar peticiones de red. 3. Repetir y confirmar. 4. Recargar. | Diálogo de confirmación identificable. Cancelar no envía la petición y la foto sigue. Confirmar retira la foto, muestra éxito en español y persiste al recargar. Con error, mensaje en español sin éxito y la foto sigue. | Alta | Cypress + API | NO EJECUTADO |
| **TC-129** Retiro de foto por la API | RF-03, RF-33 | API/integración; autorización y propiedad | B0; R1 de C1 no enviada con E1; C2 autenticado. | Variantes: C1 retira E1; C2 retira E1. Variante pendiente: C1 retira una foto de una solicitud ya enviada. | 1. Ejecutar cada variante directamente en la API. 2. Revisar vínculo y acceso al archivo. | C1: vínculo eliminado y E1 ya no accesible desde R1. C2: denegado, E1 intacta. Retiro tras el envío: PENDIENTE DE DECISIÓN (sin regla); esa variante no cuenta para aprobar el caso. | Alta | Pest + MySQL | NO EJECUTADO |
| **TC-130** Archivo fuera de la política de fotos | RF-03 | API + E2E; CE y AVL | B0; C1 con solicitud no enviada; tipos, tamaño máximo Bmax, cantidad máxima Nmax y obligatoriedad aprobados en P17. | Contenido no permitido; tamaño Bmax y Bmax+1; cantidad Nmax y Nmax+1. Valores: PENDIENTES DE DECISIÓN (P17). | 1. Subir cada variante por la API. 2. Repetir desde la interfaz. 3. Revisar almacenamiento. | Bmax y Nmax aceptados. Resto: 422 en español, sin archivo almacenado ni vinculado; en la interfaz, error de campo sin éxito. | Crítica | Pest + MySQL; Cypress | BLOQUEADO |
| **TC-131** Validación y alertas del formulario de tarifa | RF-04, RF-05 | E2E; validación de cliente y alertas | B0; T1 habilitado con un servicio propio y tarifa vigente. | Tarifa negativa; tarifa vacía; tarifa válida nueva. La tarifa 0 no se prueba (P16) y la moneda sigue P01. | 1. Introducir cada valor. 2. Intentar guardar y observar peticiones de red. 3. Recargar tras el guardado válido. | Negativa o vacía: error de campo en español, foco en el control y ninguna petición de guardado. Válida: éxito en español y la nueva tarifa visible tras recargar. | Alta | Cypress + API | NO EJECUTADO |
| **TC-132** Técnico en pausa excluido | RF-05, RF-07 | API/integración; filtro de elegibilidad | B0; T1 y T2 cumplen todos los filtros de RN-05; T1 tiene una pausa activa que cubre el momento solicitado. | Solicitud compatible con ambos técnicos. Variante: misma solicitud cuando la pausa de T1 ya terminó. | 1. Ejecutar la evaluación de elegibilidad. 2. Revisar candidatos y motivos de exclusión. 3. Repetir tras terminar la pausa. | Con pausa: T1 excluido con motivo registrado sin datos privados; T2 elegible. Sin pausa: ambos elegibles. La pausa no se sustituye por un peso bajo. | Alta | Pest + MySQL | NO EJECUTADO |
| **TC-133** Franja con cita confirmada no disponible | RF-05, RF-18 | API/integración; disponibilidad secuencial | B0; T1 con una cita confirmada en la franja F; duración de franja y margen de atención inmediata aprobados en P05/P16. | Nueva solicitud programada en franja solapada con F; en franja distinta. Adyacencia, duración y margen: PENDIENTES DE DECISIÓN (P05/P16). | 1. Consultar disponibilidad o elegibilidad de T1 para cada franja. 2. Intentar la reserva. | Franja solapada: no se ofrece ni se reserva. Franja distinta: disponible. Sin concurrencia: la carrera simultánea es TC-050. | Crítica | Pest + MySQL | NO EJECUTADO (condicionado P05/P16) |
| **TC-134** Disponibilidad o tarifa ajena | RF-04, RF-05, RF-33 | API/integración; autorización y propiedad | B0; T1 con horario y tarifa vigentes; T2 y C1 autenticados. | T2 modifica el horario de T1; T2 modifica la tarifa de T1; C1 intenta ambas operaciones. | 1. Tomar instantánea de horario y versiones de tarifa de T1. 2. Ejecutar cada operación por la API. 3. Comparar. | Denegado con el código que fije el contrato; horario sin cambios; sin nueva versión de tarifa; sin exponer datos privados de T1. | Crítica | Pest + MySQL | NO EJECUTADO |
| **TC-135** Validación y alertas del editor de disponibilidad | RF-05 | E2E; validación de cliente y alertas | B0; T1 habilitado con horario guardado. | Franja con fin anterior al inicio; franja válida; activación de pausa válida; 422 real del servidor ante un dato que solo valida la API. | 1. Introducir cada variante. 2. Intentar guardar y observar peticiones de red. 3. Recargar. | Franja inválida: error de campo en español y ninguna petición. Válida y pausa: éxito en español y persistencia tras recargar. 422: mensaje en español sin éxito y horario anterior visible. | Alta | Cypress + API | NO EJECUTADO |

## 6. Clasificación y conteo

| Clasificación | Casos | Número |
|---|---|---:|
| Backend Pest | TC-119, 120, 121, 122, 123, 126, 127, 129, 130, 132, 133, 134 | 12 |
| Cypress + API | TC-124, 125, 128, 131, 135 | 5 |
| **Total del módulo** | | **17** |

De los 12 Pest, TC-122, TC-123 y TC-130 están bloqueados y TC-133 está condicionado: no cuentan para la meta de ≥60 Pest aprobados hasta resolver su pendiente y ejecutarse. TC-130 tiene además una parte Cypress que no se cuenta como caso aparte.

**Total del catálogo:** 118 + 17 = **135 casos** (TC-001 a TC-135). Desde el 6 de octubre de 2026 la meta de ≥72 casos queda cumplida en diseño; no implica que ninguna prueba esté implementada o aprobada.

## 7. Escenarios Gherkin críticos

Los tres escenarios aprobados (TC-127, TC-119 y TC-126) están en [Modulo-A-criticos.feature](Modulo-A-criticos.feature). Se eligieron por riesgo: TC-127 corresponde a R-PP-01 (acceso a datos ajenos), TC-119 a R-PP-04 (guardados inválidos) y TC-126 a la integridad del estado enviado.

Archivos complementarios: [CSV de los casos](Casos-Modulo-A-TC-119-a-TC-135.csv) · [Gherkin](Modulo-A-criticos.feature).
