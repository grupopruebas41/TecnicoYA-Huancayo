# language: es
# Especificación documental: no ejecutada. Las etiquetas propuesta_* conservan decisiones pendientes.
@reglas_negocio
Característica: Reglas y valores límite de TécnicoYa
  El servidor valida permisos, estado y plazos con reloj controlado.
  Los valores de las pruebas son datos sintéticos y no modifican la configuración del producto.

  @RN_LIM_01 @RN_10_1 @propuesta_P12
  Esquema del escenario: Respuesta técnica antes, en y después del vencimiento
    Dado una oferta pendiente disponible desde las 12:00:00 UTC
    Y su versión configura un SLA de 10 minutos
    Y el técnico destinatario sigue siendo elegible
    Cuando la aceptación se valida bajo bloqueo a las <hora> UTC
    Entonces la respuesta es <resultado>
    Y la decisión no utiliza la hora del navegador
    Ejemplos:
      | hora     | resultado                 |
      | 12:09:59 | aceptada                  |
      | 12:10:00 | rechazada por vencimiento |
      | 12:10:01 | rechazada por vencimiento |

  @RN_LIM_02 @RN_10_1 @propuesta_P12
  Escenario: Worker atrasado no extiende el plazo
    Dado una oferta con deadline 12:10:00 UTC que aún figura pendiente
    Y el worker de expiración está retrasado
    Cuando el técnico responde a las 12:10:01 UTC según el servidor
    Entonces se rechaza la respuesta por vencimiento
    Y no se crea aceptación ni asignación

  @RN_LIM_03 @RN_10_1 @propuesta_P12
  Escenario: Aceptación anterior gana frente al vencimiento posterior
    Dado una aceptación confirmada a las 12:09:59 UTC
    Y el SLA vence a las 12:10:00 UTC
    Cuando el job de vencimiento procesa la ronda después del deadline
    Entonces conserva la oferta aceptada
    Y no la transforma en expirada
    Y no asigna el servicio sin elección del cliente

  @RN_LIM_04 @RN_11_3 @propuesta_P12
  Esquema del escenario: Expiración de solicitud pendiente
    Dado una solicitud en Pendiente de disponibilidad
    Y su deadline persistido corresponde a 24 horas desde el inicio acordado
    Cuando el servidor evalúa el estado tras <horas> horas y <minutos> minutos
    Entonces el estado es <estado>
    Ejemplos:
      | horas | minutos | estado                      |
      | 23    | 59      | Pendiente de disponibilidad |
      | 24    | 0       | Expirada                    |
      | 24    | 1       | Expirada                    |

  @RN_LIM_05 @RN_11_3
  Escenario: Un job obsoleto no expira una solicitud ya asignada
    Dado una solicitud que ya tiene una asignación confirmada
    Cuando llega un job antiguo de vencimiento de su estado pendiente
    Entonces la solicitud permanece asignada
    Y no se crea otro cierre ni otra asignación

  @RN_LIM_06 @RN_18 @propuesta_P12
  Esquema del escenario: Primera calificación en la frontera de 48 horas
    Dado una participación finalizada con reporte y sin calificación
    Y su versión configura 48 horas para calificar desde completed_at
    Y el cliente titular envía una nota válida y comentario
    Cuando la creación se valida tras <horas> horas y <minutos> minutos desde completed_at
    Entonces el resultado es <resultado>
    Ejemplos:
      | horas | minutos | resultado                         |
      | 47    | 59      | calificación creada               |
      | 48    | 0       | calificación rechazada por plazo  |
      | 48    | 1       | calificación rechazada por plazo  |

  @RN_LIM_07 @RN_19_2 @propuesta_P23
  Esquema del escenario: Ventana propia de edición de una calificación
    Dado una calificación con first_rated_at y editable_until persistidos
    Y la política aprobada cuenta 48 horas desde el primer envío
    Cuando su autor intenta editar tras <horas> horas y <minutos> minutos desde first_rated_at
    Entonces el resultado es <resultado>
    Ejemplos:
      | horas | minutos | resultado                         |
      | 47    | 59      | nueva versión conservando historia |
      | 48    | 0       | edición rechazada por plazo         |
      | 48    | 1       | edición rechazada por plazo         |

  @RN_LIM_08 @RN_19_2 @propuesta_P23
  Escenario: Editar no reinicia las 48 horas
    Dado una calificación creada en el instante T
    Y una edición válida realizada en T más 47 horas
    Cuando su autor intenta otra edición en T más 48 horas y 1 minuto
    Entonces se rechaza la edición por plazo
    Y el deadline sigue siendo T más 48 horas
    Y se conservan las versiones previas

  @RN_LIM_09 @RN_18 @RN_19_2 @propuesta_P23
  Escenario: No confundir el plazo de creación con el de edición
    Dado una primera calificación creada 47 horas y 59 minutos después de finalizar la atención
    Cuando el cliente la edita una hora después de crearla
    Entonces la edición está dentro de su ventana propia
    Y no se rechaza solo porque transcurrieron 48 horas desde la atención

  @RN_LIM_10 @RN_19_1
  Esquema del escenario: Escala de calificación
    Dado un cliente titular dentro del plazo permitido y un comentario válido
    Cuando envía el puntaje <puntaje>
    Entonces el resultado de validación es <resultado>
    Ejemplos:
      | puntaje | resultado |
      | 0       | inválido  |
      | 1       | válido    |
      | 5       | válido    |
      | 6       | inválido  |
      | 2.5     | inválido  |

  @RN_LIM_11 @RN_31 @propuesta_P12
  Escenario: Cierre sin calificar idempotente
    Dado una participación finalizada cuyo plazo de calificación acaba de vencer
    Y no existe calificación para esa participación
    Cuando el job de cierre se ejecuta dos veces
    Entonces la evaluación queda Sin calificar una sola vez
    Y no se crea una nota cero ni una reseña automática
    Y no se cierra la ventana de otro técnico participante

  @RN_LIM_12 @RN_31
  Escenario: Una calificación existente impide el cierre sin calificar
    Dado una calificación creada válidamente antes de su deadline
    Cuando se ejecuta el job de cierre de esa ventana
    Entonces conserva la calificación y su historial
    Y no cambia la evaluación a Sin calificar

  @RN_LIM_13 @RN_06
  Esquema del escenario: Validación conjunta de pesos
    Dado un administrador con rules.manage y un borrador de configuración
    Cuando propone cercanía <c> tarifa <t> historial <h> y experiencia <e>
    Entonces la validación del conjunto es <resultado>
    Y un conjunto inválido no modifica la versión aplicada
    Ejemplos:
      | c     | t     | h     | e     | resultado |
      | 35.00 | 20.00 | 30.00 | 15.00 | válido    |
      | 35.00 | 20.00 | 30.00 | 14.99 | inválido  |
      | 35.00 | 20.00 | 30.00 | 15.01 | inválido  |
      | 0.00  | 0.00  | 0.00  | 0.00  | inválido  |
      | -1.00 | 21.00 | 30.00 | 50.00 | inválido  |
      | 0.00  | 20.00 | 30.00 | 50.00 | válido    |

  @RN_LIM_14 @RN_10_2
  Esquema del escenario: Cantidad de destinatarios de una ronda
    Dado un límite configurado de 3 técnicos
    Y existen <elegibles> candidatos ordenados sin empate pendiente
    Cuando se abre una ronda automática
    Entonces se crean <ofertas> ofertas
    Ejemplos:
      | elegibles | ofertas |
      | 1         | 1       |
      | 2         | 2       |
      | 3         | 3       |
      | 4         | 3       |

  @RN_LIM_15 @RN_10_2
  Escenario: Dos workers no duplican una ronda
    Dado una solicitud automática con generación vigente y candidatos elegibles
    Cuando dos workers intentan abrir su siguiente ronda al mismo tiempo
    Entonces se confirma una sola ronda principal activa
    Y no hay más de 3 ofertas pendientes bajo la configuración inicial

  @RN_LIM_16 @RN_11_1
  Escenario: Un rechazo no elimina las otras oportunidades de la ronda
    Dado una ronda con tres ofertas y ninguna aceptación
    Cuando un técnico rechaza y los otros dos todavía pueden responder
    Entonces no se abre una nueva ronda
    Y se conservan las otras dos ofertas hasta su respuesta o vencimiento

  @RN_LIM_17 @RN_11_1
  Escenario: Sin aceptaciones válidas se prepara la siguiente ronda automática
    Dado una ronda automática con todas sus ofertas rechazadas o vencidas
    Y existen candidatos restantes elegibles
    Cuando se evalúa el cierre de la ronda
    Entonces se registra su resultado y se abre la siguiente ronda una sola vez
    Y no se asigna el servicio antes de la aceptación y elección necesarias

  @RN_LIM_18 @RN_12
  Escenario: La solicitud directa exige decisión del cliente para alternativas
    Dado una solicitud iniciada desde el perfil de un técnico
    Cuando ese técnico rechaza o no responde dentro del SLA
    Entonces se ofrecen alternativas al cliente
    Y no se notifica automáticamente a otros técnicos sin su decisión

  @RN_LIM_19 @RN_05
  Esquema del escenario: Los filtros son obligatorios antes de calcular puntajes
    Dado un técnico que cumple todos los requisitos excepto <incumplimiento>
    Cuando se evalúa su elegibilidad
    Entonces queda excluido con motivo trazable
    Y no puede compensar ese incumplimiento con un puntaje alto
    Ejemplos:
      | incumplimiento                 |
      | especialidad inactiva           |
      | subcategoría inactiva           |
      | cuenta no habilitada           |
      | verificación pendiente         |
      | técnico suspendido             |
      | subcategoría no ofrecida        |
      | distrito no cubierto           |
      | horario incompatible           |
      | pausa temporal vigente         |
      | conflicto de agenda            |

  @RN_LIM_20 @RN_07
  Escenario: Desempate por promedio real
    Dado dos candidatos con puntaje de matching igual a 74
    Y sus promedios reales son 4.8 y 4.6
    Cuando se ordena el ranking
    Entonces el candidato con promedio 4.8 aparece primero

  @RN_LIM_21 @RN_07 @propuesta_P15
  Escenario: Empate persistente en el corte no se resuelve por ID
    Dado candidatos con igual puntaje y promedio en el corte de la ronda
    Y no existe una política aprobada de segundo desempate
    Cuando se intenta seleccionar solo parte de ese grupo
    Entonces se informa la decisión de negocio pendiente
    Y no se elige por ID ni por azar

  @RN_LIM_22 @RN_06 @propuesta_P15
  Escenario: Todas las tarifas iguales reciben el mismo factor
    Dado candidatos comparables cuyas tarifas son todas iguales
    Cuando se normaliza la tarifa con la propuesta matching_v1
    Entonces cada factor de tarifa es 0.50
    Y no se divide entre cero

  @RN_LIM_23 @RN_06 @propuesta_P15
  Escenario: Puntaje ponderado de ejemplo
    Dado pesos 35 20 30 y 15 por ciento
    Y factores de cercanía 0.80 tarifa 0.50 historial 0.90 y experiencia 0.60
    Cuando se calcula el puntaje
    Entonces el resultado es 74 sobre 100

  @RN_LIM_24 @RN_08 @propuesta_P15
  Escenario: Umbral de historial sin reseñas no produce una nota inventada
    Dado un técnico con tres servicios finalizados y ninguna reseña válida
    Y no se ha resuelto la política P15 de datos ausentes
    Cuando se intenta calcular su factor de historial
    Entonces se informa que falta la política
    Y no se utiliza cero ni una calificación inventada

  @RN_LIM_25 @RN_28 @propuesta_P19
  Escenario: El cambio de SLA no altera una oferta abierta bajo versión congelada
    Dado una oferta creada a las 12:00 UTC con SLA de 10 minutos en la versión 1
    Y se aprueba la política de conservar la versión de solicitudes abiertas
    Cuando un administrador publica la versión 2 con SLA de 15 minutos
    Entonces el deadline de esa oferta sigue siendo las 12:10 UTC
    Y una solicitud nueva usa la versión vigente que corresponda
    Y ambas decisiones conservan trazabilidad de versión

  @RN_LIM_26 @RN_28
  Escenario: Un cambio sin permiso no publica parámetros
    Dado un usuario sin rules.manage
    Cuando intenta publicar nuevos pesos o plazos
    Entonces se deniega la operación
    Y no cambia la configuración vigente

  @RN_LIM_27 @RN_25
  Escenario: Suspensión administrativa motivada excluye nuevos candidatos
    Dado un administrador con permiso de gestión de técnicos
    Cuando registra una suspensión con motivo válido
    Entonces la suspensión y su auditoría se confirman juntas
    Y el técnico no aparece como elegible en nuevas evaluaciones
    Y no se inventa una cancelación automática de sus servicios en curso

  @RN_LIM_28 @RN_32
  Escenario: Bloqueo de cliente con historial y efectos definidos
    Dado un administrador con permiso de gestión de clientes
    Y existe una política aprobada P18 para la operación solicitada
    Cuando registra un bloqueo con motivo
    Entonces se conserva la intervención y la auditoría
    Y solo se aplican los efectos sobre acceso y servicios definidos por esa política

  @RN_LIM_29 @RN_28
  Escenario: La auditoría es parte de la publicación
    Dado un borrador de parámetros válido y un administrador autorizado
    Cuando falla la escritura de auditoría durante la publicación
    Entonces se revierte la publicación
    Y ninguna solicitud nueva utiliza la versión no confirmada
