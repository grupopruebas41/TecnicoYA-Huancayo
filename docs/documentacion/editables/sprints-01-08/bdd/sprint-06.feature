# language: es
@sprint_06 @planificado
Característica: Sprint 6 - Calificación, historial y apelaciones
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_073 @HU_S06_01 @automatizar
  Escenario: TC-073 - Envío en ventana válida
    Dado mi participación finalizó hace 24 horas y no tiene calificación
    Cuando envío puntaje 4 y comentario válido
    Entonces se registra una calificación con su primera versión y se marca la participación como calificada

  @TC_074 @HU_S06_01 @automatizar
  Escenario: TC-074 - Nota fuera de rango
    Dado una participación propia dentro de la ventana
    Cuando envío puntaje 6
    Entonces la API rechaza el valor sin crear calificación

  @TC_075 @HU_S06_02 @automatizar @pendiente_P23
  Escenario: TC-075 - Edición no renueva plazo
    Dado una calificación creada hace 12 horas y política P23 ratificada
    Cuando su autor edita nota y comentario
    Entonces se agrega una versión y el límite sigue a 48 horas de la primera calificación

  @TC_076 @HU_S06_02 @automatizar
  Escenario: TC-076 - Edición vencida
    Dado una calificación cuya ventana de edición ya terminó
    Cuando su autor intenta editar
    Entonces se rechaza sin nueva versión ni cambio del promedio

  @TC_077 @HU_S06_03 @automatizar @pendiente_P12 @pendiente_P13
  Escenario: TC-077 - Vencimiento individual
    Dado una participación finalizada sin nota que alcanzó su plazo de 48 horas
    Cuando se ejecuta dos veces el job de cierre
    Entonces queda Sin calificar una sola vez sin crear una nota automática ni afectar otra participación

  @TC_078 @HU_S06_03 @automatizar
  Escenario: TC-078 - Ya fue calificada
    Dado una participación calificada válidamente antes del vencimiento
    Cuando se ejecuta después un job atrasado de cierre sin calificar
    Entonces se conserva la calificación y no cambia a Sin calificar

  @TC_079 @HU_S06_04 @automatizar @pendiente_P07
  Escenario: TC-079 - Promedio real
    Dado un técnico tiene dos calificaciones activas de 4 y 5 y una anulada de 1
    Cuando se consulta el promedio bajo política aprobada de excluir anuladas
    Entonces se muestra 4.5 calculado solo de las dos notas activas

  @TC_080 @HU_S06_04 @automatizar
  Escenario: TC-080 - Texto no ejecutable
    Dado una respuesta de reseña contiene etiquetas de script
    Cuando se muestra la respuesta en el perfil público
    Entonces el contenido no se ejecuta como código en el navegador

  @TC_081 @HU_S06_05 @automatizar @pendiente_P07 @pendiente_P17
  Escenario: TC-081 - Apelación admitida
    Dado una reseña propia dentro del plazo de apelación ratificado
    Cuando el técnico presenta motivo y evidencia permitidos
    Entonces se crea una apelación vinculada a la versión de la reseña sin modificar su nota

  @TC_082 @HU_S06_05 @automatizar
  Escenario: TC-082 - Apelación ajena
    Dado un técnico intenta apelar la reseña de otro prestador
    Cuando envía el identificador de esa calificación
    Entonces la API deniega y no crea apelación

  @TC_083 @HU_S06_06 @automatizar @pendiente_P07
  Escenario: TC-083 - Resolución válida
    Dado una apelación abierta y la versión vigente revisada por un administrador autorizado
    Cuando resuelve mantener, ajustar o anular con motivo obligatorio
    Entonces se conserva la decisión y las versiones correspondientes con auditoría y se actualizan agregados según política aprobada

  @TC_084 @HU_S06_06 @automatizar
  Escenario: TC-084 - Reseña cambió al resolver
    Dado el administrador cargó una versión que el cliente editó después
    Cuando intenta resolver usando la versión anterior
    Entonces recibe conflicto y debe revisar la versión vigente sin sobrescribirla

  @TC_085 @HU_S06_07 @automatizar
  Escenario: TC-085 - Historial propio filtrado
    Dado un usuario con participaciones de distintos estados y periodos
    Cuando consulta su historial con filtros
    Entonces recibe únicamente sus registros coincidentes y sus calificaciones vinculadas

  @TC_086 @HU_S06_07 @automatizar
  Escenario: TC-086 - Criterios sin datos de competidores
    Dado un técnico autenticado consulta criterios de matching
    Cuando se devuelve la explicación
    Entonces ve pesos, elegibilidad y tratamiento sin historial sin direcciones, documentos ni puntajes privados de otros técnicos
