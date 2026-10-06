# language: es
@sprint_03 @planificado
Característica: Sprint 3 - Solicitud y búsqueda de técnicos
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_027 @HU_S03_01 @automatizar
  Escenario: TC-027 - Recorrido con corrección
    Dado un cliente autenticado y catálogo activo
    Cuando completa los cinco pasos, vuelve a corregir la descripción y confirma
    Entonces se guarda la descripción corregida y se envía una sola solicitud con resumen consistente

  @TC_028 @HU_S03_01 @automatizar
  Escenario: TC-028 - Datos obligatorios ausentes
    Dado el cliente omite la subcategoría o la descripción requerida
    Cuando intenta enviar el resumen
    Entonces el sistema identifica los campos incompletos y no envía una solicitud inválida

  @TC_029 @HU_S03_02 @automatizar
  Escenario: TC-029 - Foto propia vinculada
    Dado una solicitud registrada propia y una imagen válida
    Cuando el cliente adjunta la imagen y consulta el resumen
    Entonces la foto queda vinculada solo a esa solicitud y visible al propietario autorizado

  @TC_030 @HU_S03_02 @automatizar
  Escenario: TC-030 - Referencia de archivo ajeno
    Dado un archivo privado perteneciente a otro cliente
    Cuando se intenta vincular su identificador a una solicitud propia
    Entonces la API deniega la asociación y el archivo sigue privado

  @TC_031 @HU_S03_03 @automatizar
  Escenario: TC-031 - Tarifa referencial visible
    Dado una subcategoría con tarifa referencial de prueba aprobada
    Cuando el cliente selecciona el servicio y revisa el resumen
    Entonces se muestra el monto como referencial y se conserva su procedencia sin tratarlo como pago

  @TC_032 @HU_S03_03 @automatizar
  Escenario: TC-032 - Fuera de cobertura
    Dado un distrito que no pertenece al catálogo activo
    Cuando el cliente intenta confirmar una solicitud para ese distrito
    Entonces se informa fuera de cobertura y no se envía la solicitud

  @TC_033 @HU_S03_04 @automatizar
  Escenario: TC-033 - Filtros combinados
    Dado técnicos de prueba con distintos rubros, zonas y calificaciones
    Cuando el cliente combina especialidad, subcategoría, distrito y calificación mínima
    Entonces recibe únicamente técnicos que cumplen todos los filtros y un estado vacío si no hay coincidencias

  @TC_034 @HU_S03_04 @automatizar
  Escenario: TC-034 - Perfil sin datos privados
    Dado un técnico con bio pública, documentos privados y teléfono de contacto
    Cuando un cliente consulta su perfil antes de asignación
    Entonces recibe bio y portafolio público pero no documentos privados ni WhatsApp

  @TC_035 @HU_S03_05 @automatizar
  Escenario: TC-035 - Origen dirigido preservado
    Dado un cliente abre un técnico que ofrece la subcategoría seleccionada
    Cuando pulsa Solicitar servicio y confirma los cinco pasos
    Entonces la solicitud conserva source=profile y ese técnico objetivo sin generar una asignación automática

  @TC_036 @HU_S03_05 @automatizar
  Escenario: TC-036 - Objetivo incompatible
    Dado el técnico precargado no ofrece la subcategoría enviada
    Cuando se intenta enviar esa combinación manipulada
    Entonces la API rechaza la incompatibilidad sin sustituir silenciosamente al técnico

  @TC_037 @HU_S03_06 @automatizar
  Escenario: TC-037 - Reintento del mismo envío
    Dado una solicitud propia y una clave de idempotencia ya confirmada para su envío
    Cuando se repite el mismo comando tras perder la respuesta
    Entonces se obtiene el mismo resultado y no se duplica solicitud ni evento de envío

  @TC_038 @HU_S03_06 @automatizar
  Escenario: TC-038 - Solicitud ajena
    Dado dos clientes con solicitudes diferentes
    Cuando uno consulta por identificador el detalle de la solicitud del otro
    Entonces se deniega sin descripción privada, dirección ni evidencias
