# language: es
@sprint_04 @planificado
Característica: Sprint 4 - Matching, notificación, SLA y reasignación
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_039 @HU_S04_01 @automatizar
  Escenario: TC-039 - Elegible en su servicio
    Dado un técnico verificado activo que ofrece la subcategoría y cubre zona/franja sin pausa
    Cuando se ejecuta el matching de esa solicitud
    Entonces el técnico queda elegible con snapshot y puede ser evaluado por el ranking

  @TC_040 @HU_S04_01 @automatizar
  Escenario: TC-040 - Mejor puntaje pero suspendido
    Dado un técnico suspendido con un puntaje potencial mayor al de los activos
    Cuando se filtran los candidatos
    Entonces se excluye por suspensión y nunca recibe oferta

  @TC_041 @HU_S04_02 @automatizar
  Escenario: TC-041 - Puntuación ponderada
    Dado factores normalizados 1, 0.5, 0.8 y 0.4 con pesos 35, 20, 30 y 15
    Cuando se calcula el puntaje
    Entonces el resultado es 75 sobre 100 y conserva los cuatro aportes

  @TC_042 @HU_S04_02 @automatizar
  Escenario: TC-042 - Desempate por calificación
    Dado dos candidatos elegibles con igual puntaje y promedios reales 4.8 y 4.2
    Cuando se ordena el ranking
    Entonces el candidato con promedio 4.8 precede al de 4.2

  @TC_043 @HU_S04_03 @automatizar
  Escenario: TC-043 - Distancia aproximada por zona
    Dado una matriz sintética aprobada de distancias entre distritos
    Cuando se calcula y muestra una distancia de un candidato
    Entonces se rotula distancia aproximada por zona y no se presenta como geolocalización exacta

  @TC_044 @HU_S04_03 @automatizar @pendiente_P15
  Escenario: TC-044 - Perfil sin historial
    Dado un técnico elegible sin servicios ni calificaciones y la política de nuevos aprobada
    Cuando se evalúan historial y tiempo estimado
    Entonces se usa factor de historial neutro 0.5 y se muestra Nuevo y estimación general sin publicar una reseña ficticia

  @TC_045 @HU_S04_04 @automatizar
  Escenario: TC-045 - Tres ofertas como máximo
    Dado cinco candidatos elegibles ordenados y una solicitud automática enviada
    Cuando se abre la primera ronda
    Entonces se generan exactamente tres ofertas a los tres primeros y ningún cuarto destinatario

  @TC_046 @HU_S04_04 @automatizar
  Escenario: TC-046 - Rollback no notifica éxito
    Dado una apertura de ronda cuya transacción falla antes del commit
    Cuando el worker de entrega busca mensajes publicables
    Entonces no publica avisos de ofertas que no quedaron confirmadas en la base

  @TC_047 @HU_S04_05 @automatizar
  Escenario: TC-047 - Aceptación dentro de plazo
    Dado una oferta propia pendiente cuyo plazo termina dentro de un minuto
    Cuando el técnico acepta
    Entonces la oferta pasa a aceptada sin asignación ni participación automática

  @TC_048 @HU_S04_05 @automatizar @pendiente_P12
  Escenario: TC-048 - Aceptación en el límite exacto
    Dado una oferta propia pendiente y el reloj del servidor igual a expires_at
    Cuando el técnico intenta aceptar aunque el job no se ejecutó
    Entonces la API responde conflicto por vencimiento y no acepta la oferta

  @TC_049 @HU_S04_06 @automatizar
  Escenario: TC-049 - Elección válida
    Dado una oferta aceptada de mi solicitud y un técnico aún disponible
    Cuando confirmo mi elección
    Entonces se crea una participación principal y la reserva aplicable con tarifa notificada y estado Asignada

  @TC_050 @HU_S04_06 @automatizar
  Escenario: TC-050 - Dos reservas incompatibles
    Dado dos clientes eligen simultáneamente al mismo técnico para la misma franja incompatible
    Cuando ambas transacciones intentan confirmar
    Entonces solo una reserva se confirma y la otra informa conflicto sin doble ocupación

  @TC_051 @HU_S04_07 @automatizar
  Escenario: TC-051 - Siguiente ronda única
    Dado tres ofertas sin aceptación vencidas y otros tres candidatos válidos
    Cuando se ejecuta dos veces el job de expiración
    Entonces se abre una sola nueva ronda de hasta tres ofertas y se conserva el historial

  @TC_052 @HU_S04_07 @automatizar
  Escenario: TC-052 - Fallo de solicitud directa
    Dado una solicitud desde perfil cuyo único técnico no respondió dentro del SLA
    Cuando vence su oferta
    Entonces se ofrecen alternativas al cliente y no se contacta ni asigna a otro técnico sin su autorización

  @TC_053 @HU_S04_08 @automatizar
  Escenario: TC-053 - Agotamiento de candidatos
    Dado una solicitud sin candidatos elegibles en ninguna ronda restante
    Cuando termina la búsqueda
    Entonces queda Pendiente de disponibilidad con su fecha límite de 24 horas registrada

  @TC_054 @HU_S04_08 @automatizar @pendiente_P12
  Escenario: TC-054 - Expiración idempotente
    Dado una solicitud aún pendiente que alcanzó su límite de 24 horas
    Cuando se repite el job de expiración
    Entonces se registra una sola transición a Expirada sin renovar el límite ni abrir nuevas rondas

  @TC_055 @HU_S04_09 @automatizar
  Escenario: TC-055 - Evento repetido tras reconexión
    Dado un cliente autorizado reconecta y recibe dos copias del mismo evento confirmado
    Cuando Echo procesa ambas y consulta el estado actual
    Entonces muestra una sola notificación lógica y la versión vigente

  @TC_056 @HU_S04_09 @automatizar
  Escenario: TC-056 - Canal ajeno denegado
    Dado un cliente sin relación con una solicitud
    Cuando intenta suscribirse a su canal privado
    Entonces Laravel deniega la autorización y no recibe eventos privados

  @TC_057 @HU_S04_10 @automatizar
  Escenario: TC-057 - Límite de reintentos
    Dado una notificación sandbox cuya entrega falla siempre
    Cuando se ejecuta el intento inicial y hasta tres reintentos configurados
    Entonces se registra fallo definitivo sin un cuarto reintento y sin extender el SLA de la oferta

  @TC_058 @HU_S04_10 @automatizar
  Escenario: TC-058 - Job antiguo
    Dado una solicitud cuya generación cambió tras una operación confirmada
    Cuando se ejecuta un job de ronda con generación anterior
    Entonces no altera la generación vigente ni crea ofertas obsoletas
