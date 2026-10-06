# language: es
@sprint_01 @planificado
Característica: Sprint 1 - Base técnica, autenticación, roles y catálogo
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_001 @HU_S01_01 @automatizar
  Escenario: TC-001 - Alta válida
    Dado un correo sintético no registrado y datos de cliente válidos
    Cuando el visitante confirma el formulario de registro
    Entonces se crea exactamente un usuario cliente y su perfil, sin permisos administrativos

  @TC_002 @HU_S01_01 @automatizar
  Escenario: TC-002 - Correo duplicado
    Dado una cuenta ya registrada con el mismo correo normalizado
    Cuando se intenta registrar otra cuenta con ese correo
    Entonces la API rechaza el duplicado y no crea usuario ni perfil adicional

  @TC_003 @HU_S01_02 @automatizar
  Escenario: TC-003 - Técnico nuevo
    Dado datos de un técnico sin cuenta previa
    Cuando se completa el registro técnico
    Entonces el perfil queda Pendiente de verificación y permite editar únicamente sus datos básicos

  @TC_004 @HU_S01_02 @automatizar
  Escenario: TC-004 - Autoactivación rechazada
    Dado una cuenta técnica pendiente
    Cuando envía verificación aprobada, estado activo o permisos en la edición de perfil
    Entonces se rechazan los campos privilegiados y el estado persistido no cambia

  @TC_005 @HU_S01_03 @automatizar
  Escenario: TC-005 - Acceso de cada rol
    Dado una cuenta activa de cliente, técnico o administrador aprovisionado
    Cuando inicia sesión con credenciales válidas y consulta /me
    Entonces recibe su identidad y permisos y se abre el panel correspondiente al rol

  @TC_006 @HU_S01_03 @automatizar
  Escenario: TC-006 - Sesión cerrada
    Dado una sesión válida abierta
    Cuando el usuario cierra sesión y reutiliza su cookie para consultar /me
    Entonces la sesión anterior es inválida y la API responde 401

  @TC_007 @HU_S01_04 @automatizar
  Escenario: TC-007 - Ruta administrativa denegada
    Dado un usuario cliente autenticado
    Cuando consulta directamente una ruta administrativa protegida
    Entonces recibe 403 sin datos ni cambios administrativos

  @TC_008 @HU_S01_04 @automatizar
  Escenario: TC-008 - Alta administrativa pública denegada
    Dado un visitante sin sesión privilegiada
    Cuando solicita registro enviando account_type=admin
    Entonces el alta es rechazada y no se crea ninguna cuenta administrativa

  @TC_009 @HU_S01_05 @automatizar
  Escenario: TC-009 - Edición propia
    Dado una cuenta con versión de perfil vigente
    Cuando actualiza nombre y teléfono permitidos
    Entonces se guardan esos campos y se incrementa la versión sin cambiar permisos

  @TC_010 @HU_S01_05 @automatizar
  Escenario: TC-010 - Escritura obsoleta
    Dado el perfil cambió después de cargar el formulario
    Cuando se envía una edición con expected_version anterior
    Entonces la API informa conflicto 409 y conserva la edición más reciente

  @TC_011 @HU_S01_06 @automatizar
  Escenario: TC-011 - Semilla repetible
    Dado una base MySQL de pruebas migrada
    Cuando se ejecuta dos veces la semilla inicial
    Entonces existen tres especialidades y treinta subcategorías sin duplicados y con relaciones válidas

  @TC_012 @HU_S01_06 @automatizar
  Escenario: TC-012 - Lectura real del catálogo
    Dado el entorno React–Laravel–MySQL está disponible
    Cuando el navegador consulta especialidades y subcategorías
    Entonces muestra el catálogo recibido por API y trata un fallo de red sin sustituirlo por datos ficticios silenciosos
