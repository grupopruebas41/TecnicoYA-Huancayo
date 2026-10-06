# Reglas de negocio formalizadas · TécnicoYa Huancayo

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026  
**Alcance:** matching, ofertas, vencimientos, calificaciones, sanciones y configuración versionada.  
**Estado:** especificación documental; no modifica código, parámetros vigentes ni decisiones pendientes.

## 1. Fuentes, identificadores y grado de definición

Se leyeron Fuente 0, las respuestas del usuario, el [CANVAS de análisis](CANVAS-Analisis-MVP-TecnicoYa.md), el [diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), el [diccionario MySQL](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md) y las [reglas de programación](REGLAS-DE-PROGRAMACION-TecnicoYa.md). Las instrucciones posteriores del usuario prevalecen sobre las fuentes anteriores.

**Se conservan los identificadores RN existentes.** `RN-06.1`, por ejemplo, desglosa RN-06 sin reemplazarla. RN-31 y RN-32 son nuevas entradas de trazabilidad para comportamientos ya descritos —cierre sin calificar y bloqueo de clientes—, no nuevas funciones. Las RN del análisis que no aparecen aquí siguen vigentes.

- **Confirmado:** comportamiento o valor expresamente indicado en las fuentes.
- **Propuesta:** precisión necesaria para calcular o implementar, todavía sujeta a aprobación.
- **Pendiente:** no existe una regla suficiente para resolver el caso; no se sustituye por un valor inventado.

La normalización exacta, el empate persistente y los datos faltantes conservan P15; los relojes/rondas conservan P12; los efectos de sanciones, P18; la vigencia sobre servicios abiertos, P19; el anclaje preciso de edición, P23. Esta formalización propone soluciones donde es posible, pero no marca esos pendientes como resueltos.

## 2. Tabla de reglas

Versión reutilizable: [Tabla-Reglas-Negocio.csv](reglas-negocio/Tabla-Reglas-Negocio.csv), con las mismas siete columnas y 22 entradas/desgloses.

**Convención:** “Administrador con `rules.manage`” significa cuenta habilitada y permiso específico. No todos los administradores pueden editar parámetros. “No editable” impide cambiar la regla desde una pantalla de configuración; no impide gestionar sus datos mediante las operaciones autorizadas.

| ID | Regla | Parámetro editable | Valor por defecto | Validación | Requerimiento relacionado | Rol que puede modificarla |
|---|---|---|---|---|---|---|
| RN-05 | Solo participan candidatos con rubro/subcategoría activos, cuenta habilitada, técnico activo y verificado, servicio ofrecido, zona y horario compatibles, sin pausa ni conflicto de agenda. | No se desactivan estos filtros por parámetro. Disponibilidad, servicios y catálogo son datos administrables. | Todos los filtros obligatorios. | Se cumplen conjuntamente antes del ranking y se revalidan al aceptar/asignar. No sustituir un filtro por un peso bajo. | RF-05, RF-07, RF-10, RF-33 | Técnico: sus datos permitidos. Administrador autorizado: catálogo/verificación. Ninguno puede omitir los filtros. |
| RN-06.1 | Peso de cercanía en el matching. | Sí: `matching_weights.proximity_pct`. | 35.00 % | Decimal entre 0 y 100; suma conjunta exactamente 100.00. | RF-06, RF-08, RF-27; RF-C03 | Administrador con `rules.manage`. |
| RN-06.2 | Peso de tarifa en el matching. | Sí: `matching_weights.price_pct`. | 20.00 % | Igual validación conjunta; tarifa de la subcategoría y moneda comparable. | RF-06, RF-08, RF-27; RF-C03 | Administrador con `rules.manage`. |
| RN-06.3 | Peso de historial/calificación. | Sí: `matching_weights.rating_pct`. | 30.00 % | Igual validación conjunta; origen de reseñas definido y versionado. | RF-06, RF-08, RF-27; RF-C03 | Administrador con `rules.manage`. |
| RN-06.4 | Peso de experiencia. | Sí: `matching_weights.experience_pct`. | 15.00 % | Igual validación conjunta; experiencia no negativa. | RF-06, RF-08, RF-27; RF-C03 | Administrador con `rules.manage`. |
| RN-07 | Ante igual puntaje, priorizar mayor calificación promedio real. | No editable como selector de desempate. | Promedio descendente. | Comparar el puntaje calculado, no el redondeado para pantalla. Si también empatan o falta promedio, P15: no ordenar por ID, azar o antigüedad sin decisión. | RF-08, RF-09 | Ningún rol mediante parámetros; requiere cambio de regla aprobado. |
| RN-08 | Técnico nuevo: factor de historial neutro y etiqueta de información insuficiente. | Valores persistidos, inicialmente no editables: `new_technician_history_factor`, `history_real_after_completed_services`. | 0.50; 3 servicios finalizados. | Factor dentro de [0,1]; umbral entero positivo. Al llegar al umbral sin reseñas, no inventar promedio: P15. | RF-06, RF-27 | Cambio de estos valores requiere aprobación de negocio; no habilitado por defecto a `rules.manage`. |
| RN-09 | Distancia aproximada entre centros de distrito; no geolocalización real. | Referencias administrables; `proximity_reference_km` para normalización, propuesto. | Valor numérico de referencia pendiente P15. | Distancia finita ≥0, referencia >0 y datos de origen documentados. No usar 0 para “desconocido”. | RF-12, RF-06 | Administrador autorizado, tras aprobar referencia/metodología. |
| RN-10.1 | Cada oferta concede un plazo de respuesta al técnico. | Sí: `offer_sla_minutes`. | 10 minutos. | Entero >0. Persistir `available_at` y `expires_at`; validar reloj del servidor. Inicio ante fallo de entrega y frontera exacta: propuesta de sección 3, P12. | RF-15, RF-16; RF-C03 | Administrador con `rules.manage`. |
| RN-10.2 | En ruta automática se notifica a los mejores candidatos de cada ronda hasta el límite configurado. | Sí: `max_simultaneous_offers`. | 3 técnicos. | Entero ≥1; nunca más ofertas pendientes que el límite vigente de la solicitud. Usar menos si hay menos elegibles. No confundir con reintentos de entrega. | RF-13, RF-15 | Administrador con `rules.manage`; sistema aplica el límite. |
| RN-10.3 | Una aceptación técnica no es una asignación; el cliente elige entre aceptaciones válidas. | No editable. | Elección explícita del cliente. | Revalidar elegibilidad, disponibilidad y versión al confirmar. No asignar al primero que responda ni al vencer el cronómetro. | RF-18, RF-33 | Cliente titular confirma; ningún rol modifica esta regla desde parámetros. |
| RN-11.1 | Si una ronda automática termina sin aceptación válida, iniciar la siguiente con candidatos restantes. | Sin interruptor para desactivar la regla; utiliza SLA y límite vigentes. | Reasignación automática de ofertas por rondas. | No reemplazar un rechazo individual mientras otras ofertas de la ronda sigan pendientes. No crear nueva ronda si hay aceptación válida. Política de renotificación: P12. | RF-17, RF-13, RF-16 | Sistema ejecuta. Administrador puede intervenir por el flujo manual autorizado, no saltar consentimiento. |
| RN-11.2 | Sin candidatos, la solicitud pasa a Pendiente de disponibilidad y tiene un plazo máximo. | Sí: `pending_hours`. | 24 horas. | Entero >0; guardar `pending_since` y `pending_expires_at`. No reiniciar por polling o reintento técnico. Continuidad entre episodios/rondas: P12. | RF-14, RF-19 | Administrador con `rules.manage`; sistema realiza transición. |
| RN-11.3 | Una solicitud aún pendiente al vencer su plazo pasa a Expirada. | Usa `pending_hours`; sin otro plazo independiente. | Expiración al vencimiento de 24 h. | Releer estado, generación y deadline bajo bloqueo. No expirar una solicitud asignada, cancelada o ya atendida por un job antiguo. Frontera exacta propuesta. | RF-14, RF-19, RF-25 | Sistema; ningún usuario cambia el estado mediante edición genérica. |
| RN-12 | Solicitud desde perfil: primero solo el técnico elegido; rechazo/silencio muestra alternativas y espera decisión del cliente. | No editable; comparte `offer_sla_minutes`. | 1 destinatario inicial; sin reasignación automática inicial. | No iniciar una ronda automática por timeout de esta oferta sin acción autorizada del cliente. No trasladar esta excepción a otros casos sin P14. | RF-17, RF-18; RF-C06 | Cliente titular decide continuar; sistema aplica la excepción. |
| RN-18 | Finalización con reporte abre la ventana de primera calificación por participación. | Sí: `rating_hours`. | 48 horas desde `completed_at`. | Entero >0. Finalización válida, autor cliente titular y participación evaluable. Guardar `rating_due_at`; no esperar una segunda confirmación de cierre del cliente. | RF-22, RF-23 | Administrador con `rules.manage`; técnico autorizado finaliza su atención. |
| RN-19.1 | La calificación contiene entero de 1 a 5 y comentario; una por participación. | Rango no editable; límites de comentario pendientes P17. | Mínimo 1, máximo 5; sin nota automática. | Rechazar 0, 6, fracciones y duplicados. No completar comentarios ni notas en nombre del cliente. | RF-23, RF-25 | Cliente titular crea su calificación; la escala no se altera desde parámetros. |
| RN-19.2 | El cliente puede editar su calificación durante su propia ventana, conservando versiones. | `rating_edit_hours`, persistido; editabilidad administrativa propuesta por confirmar. | 48 horas desde que calificó. | Solo autor. Propuesta P23: `first_rated_at + 48 h`, sin reinicio al editar. Tratamiento tras resolución de apelación sigue pendiente. | RF-23, RF-25, RF-26 | Cliente edita contenido. Cambio del plazo por administrador requiere confirmar su editabilidad; no confundir ambas facultades. |
| RN-25 | Suspensión de técnico por decisión administrativa motivada; deja de ser candidato habilitado. | No hay umbral automático aprobado. Estado, motivo y duración si procede son datos de intervención. | Sin suspensión automática por conteo de quejas/SLA. | Causal documentada, permiso, motivo e historial/auditoría. Efectos sobre ofertas, sesiones y atenciones vigentes: P18. | RF-07, RF-30, RF-33 | Administrador con permiso específico de gestión de técnicos; código de permiso a registrar en matriz. |
| RN-28 | Parámetros/pesos se publican por versión y cada cambio queda trazado. | Solo definiciones marcadas `editable`; no permite editar código, tipos o permisos. | Semilla inicial aprobada; posteriores versiones. | Validar conjunto completo, autor, motivo, vigencia y auditoría. No reescribir versiones publicadas. Efecto en solicitudes abiertas: P19. | RF-C03, RF-C05; RF-27, RF-33 | Administrador con `rules.manage`; lectura de auditoría con `audit.read`. |
| RN-31 | Si vence el plazo inicial sin calificación, cerrar la evaluación como Sin calificar. | Usa `rating_hours`; sin parámetro de nota sustitutiva. | Sin calificar; no crea un cero ni una reseña. | Participación finalizada, deadline vencido y ausencia de calificación. Operación idempotente; coordinar estado global de dos técnicos según P13. | RF-24, RF-19, RF-25 | Sistema ejecuta; administrador no inventa una nota. |
| RN-32 | Bloqueo/desbloqueo de cliente mediante decisión administrativa trazable. | No existe regla de bloqueo automático ni duración predeterminada aprobada. | Sin bloqueo automático. | Identidad/permiso, motivo e historial. Causales y efectos sobre acceso, solicitudes y atenciones: P18; no inferir cancelación automática. | RF-C12, RF-30, RF-33 | Administrador con permiso específico de gestión de clientes; código a registrar en matriz. |

**Límites administrativos:** no se han fijado máximos numéricos para aumentar los plazos o la cantidad de ofertas. El panel debe usar rangos aprobados y publicados en la definición; no inventar un máximo de 10, 100 o 1000. “3” es el valor inicial del parámetro editable según Fuente 0; el sistema jamás supera el valor aplicado a la solicitud.

Los filtros personales de búsqueda —por ejemplo calificación mínima— no eliminan requisitos de elegibilidad ni cambian los pesos globales. La pausa temporal y la franja son declaradas por el técnico, pero su interpretación se valida en backend.

## 3. Semántica temporal propuesta

Para eliminar ambigüedad técnica se propone un intervalo **[inicio, vencimiento)**: válido antes del deadline, vencido exactamente al alcanzarlo. Esta precisión conserva P12/P23 hasta aprobación. Los valores 10 min, 24 h y 48 h sí están definidos.

| Reloj | Inicio propuesto/confirmado | Deadline persistido |
|---|---|---|
| Respuesta técnica | Propuesta: oferta disponible durablemente en el sistema, `available_at` | `available_at + offer_sla_minutes` |
| Pendiente | Entrada a Pendiente, `pending_since`; continuidad/reingreso pendiente P12 | `pending_since + pending_hours` según política aprobada |
| Primera calificación | Finalización válida y reporte de la participación, `completed_at` | `completed_at + rating_hours` |
| Edición | Propuesta: primer envío válido, `first_rated_at` | `first_rated_at + rating_edit_hours`, inmutable al editar |

- Tiempo UTC del servidor/base; almacenar `DATETIME(6)`. El cronómetro de React no autoriza acciones.
- **Propuesta de punto de decisión:** leer hora autorizada después de adquirir el bloqueo de la operación. “Respuesta a 9:59” en los tests significa validación en ese instante; no la hora declarada por el teléfono ni un clic anterior que llegó tarde.
- El worker puede ejecutar tarde. Eso no prolonga la ventana: el endpoint verifica el deadline aunque todavía figure un estado pendiente en la base.
- El fallo de correo/push no reiniciaría el reloj si la oferta ya es accesible en la bandeja, bajo la propuesta indicada; su aprobación sigue P12. No confundir SLA de respuesta con tiempo de entrega de una notificación externa.
- Una aceptación dentro del plazo no vence por agotarse el SLA de respuesta. La elección del cliente tiene una política distinta pendiente P11; no se le asigna por defecto otro plazo de diez minutos.
- Para P12 se propone conservar el primer deadline al volver a Pendiente; deben definirse explícitamente el presupuesto entre episodios y su relación con rondas abiertas. El pseudocódigo delega este caso a esa política y no crea un reinicio implícito.
- Cerrar la solicitud al recibir una calificación no debe anular automáticamente su ventana de edición. Calificar a las 47:59 desde la atención puede dejar una ventana de edición casi hasta las 96 horas desde esa atención.
- **Propuesta P19:** nuevas solicitudes usan la versión vigente y las abiertas conservan su versión y deadlines. Si se aprueba otra política, requiere un procedimiento explícito, auditado y probado de transición; nunca recalcular plazos simplemente al leer una fila.

## 4. Fórmula del matching

### 4.1 Suma ponderada

Para un candidato elegible `i`, se definen factores `Cᵢ` (cercanía), `Tᵢ` (tarifa), `Hᵢ` (historial) y `Eᵢ` (experiencia), todos en `[0,1]`:

```text
wC + wT + wH + wE = 100
Pᵢ = wC·Cᵢ + wT·Tᵢ + wH·Hᵢ + wE·Eᵢ
0 ≤ Pᵢ ≤ 100

Con la semilla inicial:
Pᵢ = 35·Cᵢ + 20·Tᵢ + 30·Hᵢ + 15·Eᵢ
   = 100·(0.35·Cᵢ + 0.20·Tᵢ + 0.30·Hᵢ + 0.15·Eᵢ)
```

Los coeficientes se leen de `matching_weights` de la versión seleccionada. No se escriben como constantes del algoritmo. Los pesos pueden ser cero individualmente, pero el conjunto siempre suma 100.

### 4.2 Normalización propuesta, sujeta a P15

Definición matemática: `clamp(x) = min(1, max(0, x))`. Las constantes 0 y 1 son límites matemáticos, no valores comerciales configurables.

| Criterio | Normalización | Datos y casos límite |
|---|---|---|
| Cercanía | `Cᵢ = clamp(1 − dᵢ / Dref)` | `dᵢ`: km aproximados entre centros de distrito. `Dref`: referencia positiva configurable y documentada. A distancia 0, factor 1; desde Dref, factor 0. Esto no excluye por sí solo a un técnico que cubra una zona válida. |
| Tarifa | Si `pmax > pmin`: `Tᵢ = (pmax − pᵢ)/(pmax − pmin)`. Si son iguales: `Tᵢ = 0.50` para todos. | Comparar tarifa declarada para la misma subcategoría, moneda y unidad de servicio dentro de la fotografía de candidatos elegibles. Una tarifa 0 no divide por cero en esta fórmula; permitirla comercialmente requiere política de tarifa acordada. |
| Historial | Técnico con historial suficiente: `Hᵢ = qᵢ/5`. Nuevo: `Hᵢ = 0.50`. | `qᵢ` es promedio real válido en [1,5]. Esta fórmula, ya propuesta en diseño, produce [0.2,1], contenido en [0,1]; no convierte una estrella en factor 0. Fuente de reseñas, denominador, anulaciones y caso de tres servicios sin reseñas: P07/P15. |
| Experiencia | `Eᵢ = clamp(aᵢ / Aref)` | `aᵢ`: años declarados no negativos. `Aref`: referencia positiva configurable. Cero años produce 0; desde Aref produce 1. No se inventa un tope de años como valor aprobado. |

`Dref` y `Aref` **no tienen valor por defecto confirmado**. Deben calibrarse y aprobarse antes de publicar una versión ejecutable. El factor 0.50 cuando todas las tarifas coinciden es una propuesta de normalización; se guarda en la configuración como `equal_price_factor`. El 0.50 del historial nuevo sí está confirmado en las respuestas del usuario.

El umbral confirmado es tres servicios finalizados para pasar a historial real. Bajo la interpretación propuesta, se mantiene neutral antes de ese umbral. Si hay tres o más servicios pero ninguna reseña válida, el algoritmo no asigna silenciosamente 0, 0.50 o 5 estrellas: falta resolver P15.

**Datos incompletos:** ni una distancia ausente equivale a 0 km ni una tarifa ausente a servicio gratuito. Si un factor necesario no puede calcularse y no existe política aprobada, la evaluación retorna un diagnóstico de datos/regla pendiente; no publica un ranking aparentemente completo excluyendo silenciosamente al candidato.

**Comparabilidad:** los extremos de tarifa pertenecen al conjunto elegible completo de esa ejecución, antes de separar candidatos ya notificados. Se conservan con la fotografía de entrada. Si los datos cambian y se recalcula, se crea otro `matching_run`; no se alteran evaluaciones históricas ni se comparan puntajes de conjuntos diferentes como si fueran idénticos.

### 4.3 Desempate y ejemplo

Ordenar por puntaje descendente y, solo si coincide, promedio real descendente. Utilizar aritmética decimal y precisión de cálculo documentada; no decidir empates usando el valor redondeado de la interfaz. La precisión exacta forma parte de la política de normalización pendiente P15.

Si el empate persiste o uno de los promedios no existe, devolver el grupo empatado como resultado no resuelto. Si afecta la selección del corte de la ronda, no escoger un candidato por ID o azar. Si todo el grupo cabe en la misma ronda, se puede mostrar empate sin fingir un orden entre ellos; el comportamiento definitivo de cortes sigue P15.

Ejemplo **sintético**, no propuesta de referencias de mercado: `C=0.80`, `T=0.50`, `H=0.90`, `E=0.60`:

```text
P = 35·0.80 + 20·0.50 + 30·0.90 + 15·0.60
  = 28 + 10 + 27 + 9
  = 74 puntos sobre 100
```

## 5. Pseudocódigo

Las operaciones siguientes requieren las políticas P11/P12/P15/P18/P19 pertinentes aprobadas. Un error de configuración es un diagnóstico técnico, no un nuevo estado de solicitud. Las acciones de usuario siempre autentican, autorizan y validan entrada antes de modificar datos.

### 5.1 Evaluación de matching

```text
EVALUAR_MATCHING(solicitud, version_reglas):
    exigir que version_reglas haya sido publicada y sea aplicable según P19
    permitir versión retirada solo para referencias históricas autorizadas; nunca borradores
    cargar parámetros, pesos y versión de normalización
    validar pesos decimales: cada uno en [0,100] y suma = 100
    validar referencias Dref > 0, Aref > 0 y políticas de datos ausentes

    candidatos = consultar fotografía consistente por subcategoría y zona
    elegibles = []
    para cada técnico en candidatos:
        si no cumple TODOS los filtros RN-05:
            registrar motivo de exclusión sin exponer datos privados
            continuar
        elegibles.agregar(técnico)

    si elegibles está vacío:
        guardar matching_run sin candidatos y devolver SIN_CANDIDATOS

    comprobar que las tarifas son comparables y los datos necesarios existen
    si falta dato o política necesaria:
        devolver DIAGNÓSTICO sin abrir ofertas

    pmin, pmax = extremos de tarifa de todos los elegibles de esta fotografía
    resultados = []
    para cada técnico en elegibles:
        C = normalizar_distancia(técnico.distancia, Dref)
        T = normalizar_tarifa(técnico.tarifa, pmin, pmax, equal_price_factor)
        H = normalizar_historial(técnico, umbral_servicios, factor_neutro, política_P15)
        E = normalizar_experiencia(técnico.años, Aref)
        exigir factores finitos dentro de [0,1]
        P = wC*C + wT*T + wH*H + wE*E
        resultados.agregar(técnico, factores, P, promedio_real_o_ausente)

    ordenar por P descendente; resolver empates solo con promedio real
    conservar grupos todavía empatados, sin desempate ficticio
    guardar matching_run y candidatos, entradas, referencias y rule_version_id
    devolver resultados y grupos no resueltos
```

### 5.2 Apertura de ronda automática

```text
ABRIR_SIGUIENTE_RONDA(request_id, generación_esperada):
    calcular EVALUAR_MATCHING con la versión aplicable
    iniciar transacción
        bloquear solicitud y releer estado, generación y reloj
        si generación cambió, hay asignación o solicitud terminó: salir sin efectos
        si existe ronda principal abierta o awaiting_choice: salir sin duplicar
        si está Pendiente y su deadline venció:
            expirar bajo RN-11.3 y registrar evento; confirmar y salir

        tomar candidatos no notificados/excluidos según política P12
        si empate sin resolver afecta el corte: no publicar selección arbitraria
        revalidar elegibilidad bajo bloqueos consistentes por técnico
        si cambió la fotografía: invalidar evaluación y recalcular de forma acotada

        si no hay candidatos restantes:
            entrar a Pendiente según política P12
            persistir inicio/deadline, conservando el anterior cuando así lo exija
            registrar evento e insertar outbox
        en otro caso:
            elegir hasta max_simultaneous_offers (3 inicialmente)
            crear una ronda y ofertas con available_at y expires_at persistidos
            guardar fotografía de tarifa y generación
            pasar solicitud a Enviada cuando su transición lo permita
            insertar notificaciones/outbox y trabajo de vencimiento durable
    confirmar transacción
    publicar avisos después del commit; reintentos de entrega no crean otras ofertas
```

El proceso de solicitud directa abre una ronda `direct` de un destinatario y no invoca automáticamente esta operación al fallar. Reasignar ofertas no equivale a asignar el servicio.

### 5.3 Vencimiento del SLA

```text
PROCESAR_VENCIMIENTO_SLA(round_id, generación_esperada):
    iniciar transacción
        localizar solicitud de la ronda
        bloquear solicitud -> ronda -> ofertas (orden estable)
        releer ahora desde reloj autorizado
        si ronda/generación ya no corresponden: salir sin efectos
        si solicitud asignada, cancelada, expirada o terminada: salir sin efectos
        si ronda no está open: salir sin efectos

        para cada oferta pending de la ronda:
            si ahora >= oferta.expires_at:
                marcar expired una sola vez; registrar vencimiento

        si quedan ofertas pending no vencidas:
            conservar ronda y asegurar revisión en próximo deadline; salir

        aceptaciones = ofertas accepted con respuesta válida dentro de su SLA
        si hay aceptaciones:
            ronda.status = awaiting_choice
            notificar al cliente que puede elegir
            NO asignar, NO crear otra ronda, NO expirar aceptaciones válidas
        si no hay aceptaciones y ronda.kind = direct:
            cerrar ronda; registrar resultado
            preparar alternativas y notificar al cliente
            NO abrir ronda automática sin decisión del cliente
        si no hay aceptaciones y ronda.kind = automatic:
            cerrar ronda; registrar resultado
            insertar comando durable e idempotente ABRIR_SIGUIENTE_RONDA
        si ronda.kind es manual o additional:
            aplicar política específica aprobada P11/P13/P14; no heredar otra por omisión
    confirmar transacción
    procesar outbox después del commit
```

Al rechazar una oferta se aplica la misma evaluación de ronda: si aún hay otras pendientes, se espera; si todas están resueltas y ninguna fue aceptada, se puede cerrar sin esperar un job de vencimiento. La secuencia de persistencia es la misma, sin dos caminos que creen rondas duplicadas.

### 5.4 Respuesta concurrente con el job

```text
RESPONDER_OFERTA(usuario, oferta, decisión):
    autenticar y comprobar destinatario
    iniciar transacción
        bloquear solicitud -> ronda -> oferta en el mismo orden que el job
        validar generación, estado pending y decisión permitida
        ahora = reloj autorizado leído bajo bloqueo
        si ahora >= expires_at: rechazar como vencida
        si aceptación: revalidar elegibilidad y registrar accepted/responded_at
        si rechazo: registrar rejected/responded_at
        insertar evento/outbox
    confirmar
```

Si el técnico acepta a 9:59 y confirma primero, el worker posterior ve `accepted` y no lo convierte en `expired`. Si se valida a 10:01, la oferta se rechaza aunque el worker todavía no haya cambiado su estado. Los reintentos de jobs no repiten efectos porque comprueban estado/generación y existen restricciones de unicidad.

### 5.5 Pendientes y cierre sin calificar

```text
EXPIRAR_PENDIENTE(request_id, generación):
    bloquear solicitud en transacción
    si generación vigente y status = pending_availability
       y ahora >= pending_expires_at:
        pasar a expired; registrar historial/outbox una sola vez

CERRAR_SIN_CALIFICAR(participation_id):
    bloquear solicitud y participación en transacción
    si participación finalizada y ventana de calificación abierta
       y ahora >= rating_due_at y NO existe calificación:
        rating_status = unrated
        registrar cierre de evaluación e historial/outbox
        actualizar proyección global solo según política de participantes P13
```

Crear/editar calificación usa el mismo bloqueo pertinente y verifica su propio deadline. No se crea una fila `ratings` con cero al cerrar sin calificar. Las evaluaciones del principal y adicional son independientes; un cierre no elimina la ventana del otro.

## 6. Escenarios Gherkin de frontera

El archivo complementario [reglas-negocio-limites.feature](reglas-negocio/reglas-negocio-limites.feature) contiene las especificaciones. Sus identificadores `RN-LIM-*` amplían pruebas sin renumerar TC-001 a TC-118 del plan.

| Ámbito | Dentro | Límite exacto propuesto | Fuera |
|---|---|---|---|
| SLA, mm:ss | 09:59 acepta | 10:00 rechaza | 10:01 rechaza |
| Pendiente, hh:mm | 23:59 no expira | 24:00 expira | 24:01 expira |
| Primera calificación, hh:mm desde finalización | 47:59 acepta | 48:00 rechaza | 48:01 rechaza |
| Edición, hh:mm desde primer envío | 47:59 acepta | 48:00 rechaza | 48:01 rechaza |

Los escenarios dependientes de precisiones nuevas se etiquetan `@propuesta_P12`, `@propuesta_P15`, `@propuesta_P19` o `@propuesta_P23`. Pueden usarse para discutir y desarrollar pruebas candidatas; no se cuentan como aceptación de una regla aprobada hasta resolver su pendiente. Los ensayos usan un reloj controlado; no esperan diez minutos o cuarenta y ocho horas reales.

## 7. Parámetros y datos iniciales

**Persistido no significa editable.** Los valores de negocio se cargan de la base; las decisiones que no tienen edición administrativa aprobada permanecen con `editable=0`. No sustituir valores faltantes por constantes en el código o `.env`.

| Código | Tipo / unidad | Valor inicial | Editabilidad / condición |
|---|---|---|---|
| `offer_sla_minutes` | integer / minutos | 10 | Sí; >0 |
| `max_simultaneous_offers` | integer / técnicos | 3 | Sí; ≥1, rango superior por acordar |
| `pending_hours` | integer / horas | 24 | Sí; >0 |
| `rating_hours` | integer / horas | 48 | Sí; >0 |
| `rating_edit_hours` | integer / horas | 48 | No por defecto; confirmar facultad de edición del plazo |
| `new_technician_history_factor` | decimal / factor | 0.50 | No por defecto; valor confirmado por el usuario |
| `history_real_after_completed_services` | integer / servicios | 3 | No por defecto; caso sin reseñas sigue pendiente |
| `proximity_reference_km` | decimal / km | Sin valor aprobado | Definición propuesta; publicación bloqueada si el cálculo la requiere |
| `experience_reference_years` | decimal / años | Sin valor aprobado | Definición propuesta; publicación bloqueada si el cálculo la requiere |
| `equal_price_factor` | decimal / factor | 0.50 propuesto | Validar P15; no marcar como semilla aprobada |
| `normalization_policy_code` | string / identificador de política | `matching_v1` propuesto | No editable libremente; identifica una implementación probada, no código ejecutable en BD |

Los pesos 35/20/30/15 se guardan exclusivamente en `matching_weights`; no se duplican como filas en `rule_values`. El SLA de diez minutos es distinto del máximo de tres reintentos de notificación de RNF-07.

## 8. Diseño de parámetros e historial, compatible con el diccionario

Se conserva el modelo existente: **definición → versión → valores y pesos → auditoría**. No se añade una tabla paralela que compita con esta fuente de verdad. Los nombres y tipos siguientes corresponden a T26–T29 y T67; restricciones adicionales de publicación se especifican en la aplicación.

### 8.1 `rule_parameters` — independiente

| Campo | Tipo / nulabilidad | Clave o validación |
|---|---|---|
| `id` | BIGINT UNSIGNED, no nulo | PK autoincremental |
| `code` | VARCHAR(80), no nulo | UNIQUE, código estable |
| `value_type` | VARCHAR(32), no nulo | CHECK integer/decimal/boolean/string |
| `unit` | VARCHAR(30), no nulo | Unidad definida, no intercambiable sin nueva definición |
| `description` | TEXT, no nulo | Significado y alcance |
| `min_value`, `max_value` | DECIMAL(14,4), nulos permitidos | CHECK mínimo ≤ máximo cuando ambos existen |
| `required` | TINYINT UNSIGNED, no nulo, 1 | CHECK 0/1 |
| `editable` | TINYINT UNSIGNED, no nulo, 1 | CHECK 0/1; semilla explícita a 0 en parámetros no editables |
| `created_at`, `updated_at` | DATETIME(6), no nulos | UTC |

`value_type`, unidad y reglas semánticas no se cambian retroactivamente sobre un código ya publicado. Una nueva semántica requiere nueva definición/versionado controlado. El límite técnico y el límite comercial se distinguen; no se permite que el mismo editor amplíe su propio rango sin control de cambios.

No hay `current_value` ni `default_value` mutable en esta tabla. El valor por defecto del producto es el valor de la **versión inicial sembrada**, preservada históricamente.

### 8.2 `rule_versions` — dependiente

| Campo | Tipo / nulabilidad | Clave o validación |
|---|---|---|
| `id` | BIGINT UNSIGNED, no nulo | PK |
| `version_no` | INT UNSIGNED, no nulo | UNIQUE, secuencia global |
| `status` | VARCHAR(32), no nulo | draft/published/retired |
| `created_by` | BIGINT UNSIGNED, no nulo | FK users.id, RESTRICT |
| `published_by` | BIGINT UNSIGNED, nullable | FK users.id, RESTRICT |
| `change_reason` | TEXT, no nulo | Motivo obligatorio |
| `effective_at`, `published_at` | DATETIME(6), nullable en borrador | Obligatorios al publicar; UTC |
| `content_hash` | CHAR(64), nullable en borrador | Hash de representación canónica del contenido publicado |
| `created_at`, `updated_at` | DATETIME(6), no nulos | UTC |

Índices: UNIQUE `version_no`; `(status,effective_at)`; índices de las dos FK. Publicación serializada con verificación de versión base para evitar actualizaciones perdidas; no usar `MAX(version_no)+1` sin coordinación. Se admite cambiar el estado documental para retirar una versión, con auditoría; sus valores y pesos publicados no cambian.

La resolución de vigencia selecciona una versión publicada con `effective_at <= ahora`, con orden determinista. Una versión retirada puede seguir referenciada por solicitudes antiguas si así lo exige P19; retirarla no borra su contenido ni autoriza cambiarles el deadline.

### 8.3 `rule_values` — pivot definición/versión

| Campo | Tipo | Clave o validación |
|---|---|---|
| `rule_version_id` | BIGINT UNSIGNED NOT NULL | PK compuesta; FK rule_versions.id, RESTRICT |
| `parameter_id` | BIGINT UNSIGNED NOT NULL | PK compuesta; FK rule_parameters.id, RESTRICT |
| `value_json` | JSON NOT NULL | Un escalar del tipo declarado, no arreglo/objeto arbitrario |
| `created_at` | DATETIME(6) NOT NULL | UTC |

PK `(rule_version_id,parameter_id)` e índice por `parameter_id`. Validar tipo exacto: `10` es entero, `"10"` es texto; un decimal no se convierte silenciosamente en entero. Aunque la columna SQL sea NOT NULL, rechazar también un literal JSON `null` cuando el parámetro es obligatorio. Para decimales se usa evaluación decimal exacta, no comparación por FLOAT.

El rango depende de la definición, por lo que se comprueba en el servicio de publicación dentro de la transacción. Cada versión publicada contiene una fotografía completa de valores requeridos, no únicamente las filas que cambiaron.

### 8.4 `matching_weights` — dependiente, una fila por versión

| Campo | Tipo | Restricción |
|---|---|---|
| `rule_version_id` | BIGINT UNSIGNED | PK y FK rule_versions.id, RESTRICT |
| `proximity_pct` | DECIMAL(5,2) NOT NULL | 0 ≤ valor ≤ 100 |
| `price_pct` | DECIMAL(5,2) NOT NULL | 0 ≤ valor ≤ 100 |
| `rating_pct` | DECIMAL(5,2) NOT NULL | 0 ≤ valor ≤ 100 |
| `experience_pct` | DECIMAL(5,2) NOT NULL | 0 ≤ valor ≤ 100 |
| `created_at` | DATETIME(6) NOT NULL | UTC |

Además de la validación de API, conservar en MySQL el CHECK de la suma de las cuatro columnas:

```sql
CHECK (proximity_pct + price_pct + rating_pct + experience_pct = 100.00)
```

Actualizar los cuatro pesos como conjunto en un borrador, no publicar cambios parciales que atraviesen una suma inválida. Una versión publicada debe tener exactamente una fila de pesos.

### 8.5 Historial de cambios — versiones inmutables más `audit_entries`

El historial de valores se obtiene de `rule_versions + rule_values + matching_weights`. La tabla física **`audit_entries`**, ya prevista, registra quién cambió qué y por qué. No se necesita crear otra `parameter_history` con valores actuales duplicados.

| Campo de auditoría | Tipo / clave | Uso para cambios de parámetros |
|---|---|---|
| `id` | BIGINT UNSIGNED PK | Identificador del evento |
| `actor_id` | BIGINT UNSIGNED nullable, FK users.id RESTRICT | Administrador responsable; no se elimina al desactivar cuenta |
| `actor_kind` | VARCHAR(32), CHECK user/system | Publicación administrativa: user |
| `action` | VARCHAR(100) | Código de crear borrador, editarlo, publicar o retirar versión |
| `permission_used` | VARCHAR(100), nullable | `rules.manage` para cambios autorizados |
| `subject_type` | VARCHAR(60) | Alias permitido `rule_version` |
| `subject_id` | BIGINT UNSIGNED nullable | Versión afectada; obligatorio si existe la versión |
| `reason` | TEXT NOT NULL | Motivo de negocio |
| `before_values`, `after_values` | JSON nullable | Versión base/destino y mapa de códigos/valores cambiados, sin secretos |
| `correlation_id` | VARCHAR(64) NOT NULL | Vínculo con petición/job y control de repetición |
| `occurred_at` | DATETIME(6) NOT NULL | Fecha UTC del evento |
| `source_code` | VARCHAR(100), nullable | Componente originador |

Índices existentes: `(subject_type,subject_id,occurred_at)`, `(actor_id,occurred_at)`, `(action,occurred_at)` y `correlation_id`. La relación de sujeto es polimórfica y no tiene FK física; la aplicación valida el alias y la existencia de la versión. Los valores completos siguen siendo los de las tablas versionadas, no el JSON de auditoría.

La vista administrativa del historial mostrará parámetro, valor anterior/nuevo, versión, autor, motivo, publicación y vigencia. Conserva eventos del borrador y de publicación diferenciados: editar un borrador no cambia lo aplicado al matching.

No habilitar UPDATE/DELETE de auditoría a la cuenta ordinaria de aplicación. La escritura del cambio, versión y auditoría ocurre en la misma transacción; si falla, rollback. Esto protege del flujo normal de aplicación, no equivale a inmutabilidad absoluta frente a un administrador de base de datos.

### 8.6 Publicación y aplicación

1. Autenticar administrador y comprobar `rules.manage`.
2. Crear borrador a partir de una versión base identificada; registrar cambios solicitados.
3. Validar parámetros obligatorios, tipo/unidad/rangos, cuatro pesos y suma, normalización y políticas pendientes necesarias.
4. Serializar publicaciones y comprobar que la versión base no quedó obsoleta; un conflicto requiere recargar.
5. Guardar fotografía completa, hash, motivo, autor, fecha efectiva y auditoría de publicación en transacción.
6. Confirmar y actualizar caché por ID de versión. La caché nunca cambia la historia ni es fuente de verdad.
7. Al enviar una solicitud/evaluar matching, persistir la versión aplicada; los jobs usan los deadlines y generación guardados, no el valor actual del panel.

Para registrar valores iniciales todavía no calculables, usar un borrador: no publicar una “configuración completa” con Dref/Aref inventados. La versión de normalización identifica código revisado y probado, no permite introducir fórmulas arbitrarias ejecutables desde un campo de texto.

## 9. Decisiones que faltan para convertir la especificación en código definitivo

| Pendiente | Resolución necesaria |
|---|---|
| P12 | Aprobar inicio del SLA, límite exclusivo, continuidad de 24 h, reintento/renotificación y comportamiento ante entrega fallida. |
| P15 | Aprobar Dref/Aref, fórmula propuesta, precisión, promedio usado, datos ausentes y empate persistente. |
| P23 | Confirmar edición desde primer envío sin reinicio; definir interacción con resolución administrativa. |
| P18 | Causales/umbrales de bloqueo y efectos por estado de servicio de clientes y técnicos. No hay sanción automática aprobada. |
| P19 | Aprobar congelamiento por solicitud o definir transición expresa para cambios en curso. |
| P11/P13/P14/P07 | Elección del cliente, efectos globales con dos técnicos, cancelación/reasignación y reseñas anuladas que afecten reputación. |

Esta lista no impide formalizar los valores confirmados ni diseñar pruebas candidatas. Impide declarar que los casos ambiguos ya tienen aprobación o que un algoritmo con constantes inventadas implementa las fuentes.
