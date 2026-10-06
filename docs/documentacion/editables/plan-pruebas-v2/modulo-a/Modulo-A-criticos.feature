# language: es
@modulo_A @planificado
Característica: Solicitudes válidas, privadas e inalterables tras el envío
  El servidor aplica las reglas del Módulo A aunque se omita la interfaz.
  Estos escenarios son especificaciones aprobadas el 06/10/2026; no acreditan pruebas ejecutadas.
  Los códigos de error que dependen del contrato se fijan antes de automatizar.

  @TC_127 @RF_03 @RF_33 @RN_22 @critico @pest
  Escenario: TC-127 - Ocultar las fotos de una solicitud a un técnico no notificado
    Dado una solicitud R1 del cliente C1 con la evidencia privada E1
    Y un técnico T2 habilitado en la misma especialidad
    Y T2 no tiene oferta ni asignación sobre R1
    Y T2 está autenticado y conoce los identificadores de R1 y de E1
    Cuando T2 solicita el detalle de R1
    Y T2 solicita la descarga de E1
    Entonces ambas peticiones se deniegan con el código que fije el contrato
    Y la respuesta no contiene bytes ni metadatos de E1
    Y la respuesta no revela la descripción privada ni la dirección de R1
    Y E1 sigue vinculada solo a R1 y sin cambios

  @TC_119 @RF_01 @RF_02 @critico @pest
  Esquema del escenario: TC-119 - Rechazar en la API una solicitud con datos obligatorios inválidos
    Dado un cliente C1 autenticado con sesión y token CSRF válidos
    Y un catálogo activo y un distrito de prueba habilitado
    Y se conocen los conteos iniciales de solicitudes, eventos de envío y trabajos de matching de C1
    Cuando C1 envía directamente a la API, sin usar React, un registro con <anomalía> y los demás datos válidos
    Entonces la API responde con estado 422
    Y devuelve un mensaje de validación en español asociado a <campo>
    Y la respuesta no contiene detalles técnicos internos
    Y no se crea una solicitud, un evento de envío ni un trabajo de matching

    Ejemplos:
      | anomalía                              | campo          |
      | la subcategoría ausente               | subcategoría   |
      | la descripción ausente                | descripción    |
      | la descripción vacía                  | descripción    |
      | la descripción con solo espacios      | descripción    |
      | el distrito ausente                   | distrito       |
      | un texto en lugar del identificador   | subcategoría   |

  @TC_126 @RF_02 @RF_33 @critico @pest
  Escenario: TC-126 - Impedir que se modifique o elimine una solicitud ya enviada
    Dado una solicitud R1 del cliente C1 ya enviada, con la evidencia E1
    Y se toma una instantánea de R1, de E1 y de sus eventos
    Y C1 está autenticado como titular de R1
    Cuando C1 intenta cambiar por la API la descripción, la subcategoría o el distrito de R1
    Y C1 intenta eliminar R1 por la API
    Entonces cada operación se rechaza con el código que fije el contrato
    Y R1, E1 y sus eventos coinciden con la instantánea
    Y no se registra ningún evento de modificación ni de eliminación
