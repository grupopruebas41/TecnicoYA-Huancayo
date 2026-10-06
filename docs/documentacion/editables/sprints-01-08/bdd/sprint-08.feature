# language: es
@sprint_08 @planificado
Característica: Sprint 8 - Pagos, notificaciones, endurecimiento y despliegue
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_101 @HU_S08_01 @automatizar @pendiente_P01 @pendiente_P02 @pendiente_P16
  Escenario: TC-101 - Constancia inequívoca
    Dado una participación propia con registro económico sintético permitido
    Cuando el cliente selecciona método y obtiene el comprobante
    Entonces la selección se conserva y el archivo dice simulado y sin validez tributaria sin iniciar un cobro

  @TC_102 @HU_S08_01 @automatizar
  Escenario: TC-102 - Comprobante ajeno
    Dado un comprobante privado de otro cliente
    Cuando se intenta descargar usando su identificador
    Entonces se deniega sin revelar montos ni archivo

  @TC_103 @HU_S08_02 @automatizar @pendiente_P02 @pendiente_P21
  Escenario: TC-103 - Total conforme fórmula
    Dado registros sintéticos propios de 50 y 70 incluidos por la fórmula aprobada y otro de un tercero
    Cuando el técnico consulta su periodo
    Entonces el resumen muestra 120 como ganancia simulada y excluye al tercero

  @TC_104 @HU_S08_02 @automatizar
  Escenario: TC-104 - Tarifa actual no cambia historial
    Dado una atención con importe simulado histórico 50 y tarifa actual actualizada a 80
    Cuando se consulta el historial de la atención
    Entonces se conserva el importe histórico 50 y no se presenta 80 como pago ocurrido

  @TC_105 @HU_S08_03 @automatizar @pendiente_P12
  Escenario: TC-105 - Preferencia opcional respetada
    Dado un usuario desactiva un canal opcional conforme política aprobada
    Cuando se genera una notificación opcional de ese canal
    Entonces no se entrega por el canal desactivado y se conserva el aviso interno aplicable

  @TC_106 @HU_S08_03 @automatizar
  Escenario: TC-106 - Aviso ajeno no editable
    Dado una notificación dirigida a otro usuario
    Cuando se intenta marcarla como leída por identificador
    Entonces la API deniega y su estado no cambia

  @TC_107 @HU_S08_04 @automatizar
  Escenario: TC-107 - Ticket integrado
    Dado un cliente autenticado con una solicitud propia
    Cuando envía un ticket válido y soporte lo resuelve
    Entonces puede consultar su ticket y la resolución registrada en la bandeja administrativa

  @TC_108 @HU_S08_04 @automatizar
  Escenario: TC-108 - Solicitud ajena en soporte
    Dado un usuario conoce el identificador de una solicitud ajena
    Cuando lo adjunta como contexto de un ticket
    Entonces se deniega el vínculo y no se revela información de esa solicitud

  @TC_109 @HU_S08_05 @automatizar
  Escenario: TC-109 - Recorrido completo por roles
    Dado un entorno integrado con cliente, técnico verificado y administrador de prueba
    Cuando se ejecuta solicitud, oferta, elección, atención, calificación y consulta administrativa
    Entonces cada etapa se persiste una sola vez y solo los roles autorizados pueden intervenir

  @TC_110 @HU_S08_05 @automatizar
  Escenario: TC-110 - Configuración expuesta insegura
    Dado el artefacto candidato y la configuración del servidor de demostración
    Cuando se inspeccionan bundle, imagen, puertos, depuración y cookies bajo HTTPS
    Entonces no contienen secretos, MySQL no es público, debug está desactivado y la sesión usa protecciones acordadas

  @TC_111 @HU_S08_06 @automatizar @pendiente_P21
  Escenario: TC-111 - Puerta de calidad válida
    Dado un commit con suites obligatorias aprobadas e informes auténticos
    Cuando SonarQube evalúa los umbrales aprobados y cobertura del núcleo
    Entonces el pipeline solo habilita la entrega si el gate pasa y conserva métricas y alcance

  @TC_112 @HU_S08_06 @automatizar
  Escenario: TC-112 - Gate fallido bloquea entrega
    Dado un análisis cuya puerta de calidad falla
    Cuando el pipeline intenta continuar al despliegue
    Entonces se bloquea la promoción del artefacto y se conserva el motivo del fallo

  @TC_113 @HU_S08_07 @automatizar @pendiente_P21
  Escenario: TC-113 - Matching bajo carga
    Dado un servidor, dataset, mezcla de operaciones y estadístico temporal aprobados
    Cuando se ejecuta el protocolo con 200 usuarios concurrentes y solicitudes de matching
    Entonces se registra la distribución completa y se verifica matching ≤3 s bajo el criterio acordado sin ocultar errores

  @TC_114 @HU_S08_07 @automatizar @pendiente_P16 @pendiente_P21
  Escenario: TC-114 - Carga no duplica reservas
    Dado solicitudes concurrentes que compiten por franjas de técnicos de prueba
    Cuando se ejecuta la carga y se inspeccionan invariantes de MySQL
    Entonces no existen reservas incompatibles dobles ni ofertas activas por encima del límite

  @TC_115 @HU_S08_08 @manual @pendiente_P09 @pendiente_P21
  Escenario: TC-115 - Medición de uso
    Dado participantes y protocolo aprobados, con autorización de evidencias
    Cuando completan la solicitud de cinco pasos y el cuestionario SUS
    Entonces se reportan SUS y tiempos y se verifica SUS ≥70 y mediana ≤3 min incluyendo fallos según protocolo

  @TC_116 @HU_S08_08 @manual @pendiente_P09 @pendiente_P21
  Escenario: TC-116 - Reducción de búsqueda
    Dado tres escenarios por especialidad y participantes aprobados con orden alternado
    Cuando se comparan búsquedas informales y en TécnicoYa hasta técnico confirmado
    Entonces se reportan medianas y limitaciones y se contrasta reducción ≥30% sin declararla alcanzada si falla

  @TC_117 @HU_S08_09 @automatizar
  Escenario: TC-117 - Restauración y humo
    Dado un respaldo de base/archivos de prueba y una imagen identificada compatible
    Cuando se restaura en entorno aislado y se ejecutan smoke de sesión, solicitud, jobs y Reverb
    Entonces los datos y relaciones esperadas se recuperan y el flujo básico funciona sin borrar la base de demostración

  @TC_118 @HU_S08_09 @automatizar @pendiente_P09 @pendiente_P21
  Escenario: TC-118 - Disponibilidad observada
    Dado una ventana y horario de monitoreo ratificados y servidor desplegado
    Cuando se recopilan todas las observaciones de salud y fallos durante esa ventana
    Entonces se calcula disponibilidad con el protocolo acordado y solo se declara RNF cumplido si alcanza 99%
