# language: es
@sprint_07 @planificado
Característica: Sprint 7 - Panel administrador completo
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_087 @HU_S07_01 @automatizar @pendiente_P21
  Escenario: TC-087 - Métricas reproducibles
    Dado un dataset sintético con conteos esperados y definición de cumplimiento de SLA aprobada
    Cuando el administrador aplica filtros de fecha y especialidad
    Entonces tarjetas y gráficos coinciden con los resultados esperados del mismo conjunto

  @TC_088 @HU_S07_01 @automatizar
  Escenario: TC-088 - Pendiente mayor de 20 horas
    Dado una solicitud pendiente de 21 horas y otra de 19 horas
    Cuando se consulta el panel de alertas
    Entonces solo la primera aparece en la alerta de pendientes de más de 20 horas

  @TC_089 @HU_S07_02 @automatizar @pendiente_P11 @pendiente_P14
  Escenario: TC-089 - Intervención válida
    Dado una solicitud reasignable, un reemplazo elegible y política de respuesta aprobada
    Cuando el administrador autorizado solicita reasignación con motivo y versión vigente
    Entonces se registra la intervención y nueva generación con ofertas autorizadas, sin forzar asignación ni borrar al técnico anterior

  @TC_090 @HU_S07_02 @automatizar
  Escenario: TC-090 - Sin permiso de reasignación
    Dado un administrador que no tiene requests.reassign
    Cuando invoca la operación manual
    Entonces recibe 403 y no cambian solicitud, ofertas ni participantes

  @TC_091 @HU_S07_03 @automatizar @pendiente_P18
  Escenario: TC-091 - Bloqueo conforme política
    Dado un cliente y una política de bloqueo/sesión ratificada
    Cuando el administrador autorizado registra un bloqueo con motivo
    Entonces se impiden las acciones definidas por esa política y se conserva historial de servicio y auditoría

  @TC_092 @HU_S07_03 @automatizar
  Escenario: TC-092 - Bloqueo sin motivo
    Dado un administrador autorizado selecciona un cliente
    Cuando solicita bloquearlo sin motivo
    Entonces se rechaza la operación sin cambiar acceso ni crear un bloqueo activo

  @TC_093 @HU_S07_04 @automatizar
  Escenario: TC-093 - Resolución de ticket
    Dado un ticket sintético abierto y un administrador con permiso de soporte
    Cuando registra una resolución válida
    Entonces el ticket queda resuelto con autor, fecha y actualización de historial

  @TC_094 @HU_S07_04 @automatizar
  Escenario: TC-094 - Resolución no autorizada
    Dado un usuario sin permiso de soporte administrativo
    Cuando intenta resolver un ticket
    Entonces la API deniega y el ticket permanece intacto

  @TC_095 @HU_S07_05 @automatizar @pendiente_P19
  Escenario: TC-095 - Publicación de versión válida
    Dado pesos 35, 20, 30 y 15 y plazos válidos con motivo
    Cuando el administrador publica una nueva versión bajo la política de vigencia acordada
    Entonces queda disponible la versión nueva y los rankings previos conservan la versión anterior

  @TC_096 @HU_S07_05 @automatizar
  Escenario: TC-096 - Pesos que suman 95
    Dado una configuración vigente correcta
    Cuando se intenta publicar pesos cuya suma es 95
    Entonces la API rechaza y mantiene intacta la configuración vigente

  @TC_097 @HU_S07_06 @automatizar @pendiente_P21
  Escenario: TC-097 - Exportaciones equivalentes
    Dado un reporte con filtros y resultados esperados aprobados
    Cuando se generan sus exportaciones XLSX y PDF
    Entonces ambas contienen el mismo periodo, filtros y cifras que la consulta y quedan vinculadas a su operación

  @TC_098 @HU_S07_06 @automatizar
  Escenario: TC-098 - Descarga ajena
    Dado una exportación privada completada para un administrador
    Cuando otro usuario sin permiso intenta descargarla por identificador
    Entonces se deniega sin exponer el archivo ni una URL pública

  @TC_099 @HU_S07_07 @automatizar
  Escenario: TC-099 - Alta por responsable
    Dado un administrador con admins.manage y datos de una cuenta nueva
    Cuando crea otro administrador con permisos explícitos
    Entonces se crea la cuenta con esas concesiones y se registra quién autorizó el alta sin exponer su contraseña

  @TC_100 @HU_S07_07 @automatizar
  Escenario: TC-100 - Fallo de auditoría
    Dado una acción administrativa sensible cuya escritura de auditoría falla
    Cuando se intenta confirmar su transacción
    Entonces se revierte todo el cambio de negocio y no se emite un evento de éxito
