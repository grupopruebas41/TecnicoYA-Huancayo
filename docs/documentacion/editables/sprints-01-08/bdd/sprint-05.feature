# language: es
@sprint_05 @planificado
Característica: Sprint 5 - Atención, agenda y seguimiento
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_059 @HU_S05_01 @automatizar
  Escenario: TC-059 - Citas propias
    Dado dos técnicos con citas diferentes en un mismo día
    Cuando uno consulta su agenda en lista y calendario
    Entonces ambas vistas muestran solo sus citas y los mismos horarios locales

  @TC_060 @HU_S05_01 @automatizar
  Escenario: TC-060 - Agenda ajena
    Dado un técnico sin permiso sobre otra cuenta
    Cuando manipula el filtro para obtener citas del otro técnico
    Entonces la API no devuelve ninguna cita privada ajena

  @TC_061 @HU_S05_02 @automatizar
  Escenario: TC-061 - Atención finalizada
    Dado una participación asignada al técnico autenticado
    Cuando inicia la atención y después finaliza con reporte válido
    Entonces queda finalizada con reporte y plazo de calificación a 48 horas del cierre individual, sin confirmación adicional del cliente

  @TC_062 @HU_S05_02 @automatizar
  Escenario: TC-062 - Finalización repetida
    Dado una participación ya finalizada con reporte y fecha de cierre
    Cuando se repite el mismo comando de finalización
    Entonces no se duplica el reporte ni se renueva el plazo de calificación

  @TC_063 @HU_S05_03 @automatizar
  Escenario: TC-063 - Aceptación por contraparte
    Dado una cita vigente y una propuesta de nueva franja libre
    Cuando la contraparte acepta dentro del plazo
    Entonces se libera la reserva anterior y se confirma la nueva en la misma transacción

  @TC_064 @HU_S05_03 @automatizar
  Escenario: TC-064 - Propuesta sin respuesta
    Dado una propuesta pendiente durante 24 horas y una cita original futura
    Cuando el scheduler vence la propuesta
    Entonces la propuesta queda vencida y se mantiene la cita original sin nueva reserva

  @TC_065 @HU_S05_04 @automatizar @pendiente_P13
  Escenario: TC-065 - Finalizaciones independientes
    Dado una solicitud con principal y adicional autorizados y en atención
    Cuando el principal registra su finalización
    Entonces solo su participación finaliza y abre su plazo; el adicional continúa en atención

  @TC_066 @HU_S05_04 @automatizar
  Escenario: TC-066 - Tercer participante vigente
    Dado una solicitud con principal y adicional vigentes
    Cuando se propone incorporar un tercer técnico simultáneo
    Entonces el sistema rechaza la incorporación y conserva las dos participaciones existentes

  @TC_067 @HU_S05_05 @automatizar
  Escenario: TC-067 - Contacto tras asignación
    Dado un cliente titular de una solicitud recién asignada
    Cuando abre su detalle
    Entonces ve la línea de tiempo autorizada y el WhatsApp del técnico asignado

  @TC_068 @HU_S05_05 @automatizar
  Escenario: TC-068 - Contacto antes de asignación
    Dado una oferta aceptada pero aún no elegida por el cliente
    Cuando se consulta el detalle permitido
    Entonces no se revela todavía el WhatsApp ni la dirección exacta al técnico

  @TC_069 @HU_S05_06 @automatizar @pendiente_P14
  Escenario: TC-069 - Cancelación antes de atender
    Dado una solicitud Asignada cuya atención no ha empezado
    Cuando el titular confirma cancelar con motivo
    Entonces queda Cancelada, se liberan las reservas aplicables y se conserva el historial

  @TC_070 @HU_S05_06 @automatizar
  Escenario: TC-070 - Cancelación durante atención
    Dado una solicitud con atención ya iniciada
    Cuando el cliente usa la cancelación ordinaria previa a atención
    Entonces la API informa conflicto y no marca la solicitud como cancelada

  @TC_071 @HU_S05_07 @automatizar @pendiente_P14
  Escenario: TC-071 - Retiro del técnico asignado
    Dado un técnico asignado antes de atención y una política de retiro aprobada
    Cuando registra su retiro con motivo
    Entonces se conserva la incidencia y se inicia la reasignación aplicable sin perder la participación anterior

  @TC_072 @HU_S05_07 @automatizar
  Escenario: TC-072 - Reporte de inasistencia
    Dado un cliente reporta que el técnico no asistió
    Cuando se registra el reporte
    Entonces queda una incidencia para revisión y no se suspende ni reemplaza automáticamente por la sola denuncia
