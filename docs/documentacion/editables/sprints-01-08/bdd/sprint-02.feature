# language: es
@sprint_02 @planificado
Característica: Sprint 2 - Landing, administración de catálogo y perfil del técnico
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_013 @HU_S02_01 @automatizar
  Escenario: TC-013 - Diez secciones navegables
    Dado un visitante abre la landing en móvil y escritorio
    Cuando recorre sus diez secciones y usa los CTA de acceso
    Entonces lee los títulos completos, llega a la cuenta correcta y no encuentra paneles privados dentro de la landing

  @TC_014 @HU_S02_01 @automatizar
  Escenario: TC-014 - Carrusel accesible
    Dado el carrusel está visible y el usuario ha solicitado movimiento reducido
    Cuando se carga la sección y navega con teclado
    Entonces la reproducción automática permanece pausada y los controles permiten cambiar de tarjeta con foco visible

  @TC_015 @HU_S02_02 @automatizar
  Escenario: TC-015 - Alta de subcategoría
    Dado un administrador autorizado y una especialidad activa
    Cuando crea una subcategoría con imagen validada
    Entonces la subcategoría aparece en su especialidad y la foto aprobada se ofrece al carrusel

  @TC_016 @HU_S02_02 @automatizar
  Escenario: TC-016 - Desactivar conserva historial
    Dado una subcategoría referenciada por un servicio de prueba
    Cuando el administrador la desactiva
    Entonces deja de ofrecerse para nuevos registros pero conserva su identidad y referencias anteriores

  @TC_017 @HU_S02_03 @automatizar
  Escenario: TC-017 - Audiencia vigente
    Dado un comunicado vigente dirigido solo a técnicos
    Cuando un cliente y un técnico consultan sus comunicados
    Entonces solo el técnico recibe ese comunicado

  @TC_018 @HU_S02_03 @automatizar
  Escenario: TC-018 - Duplicado en borrador
    Dado un comunicado publicado
    Cuando el administrador lo duplica
    Entonces se crea una copia en borrador que no aparece aún en ningún panel

  @TC_019 @HU_S02_04 @automatizar
  Escenario: TC-019 - Aprobación documentada
    Dado un perfil pendiente con los datos y evidencias exigidos por la política aprobada
    Cuando el administrador autorizado aprueba la revisión
    Entonces se registra la decisión, su autor y fecha y el perfil adquiere la habilitación prevista

  @TC_020 @HU_S02_04 @automatizar
  Escenario: TC-020 - Documento ajeno denegado
    Dado un técnico intenta consultar el documento privado de otro técnico
    Cuando solicita su URL por identificador
    Entonces se deniega la descarga sin revelar el contenido

  @TC_021 @HU_S02_05 @automatizar
  Escenario: TC-021 - Trabajo publicado
    Dado un técnico propietario de una imagen permitida para portafolio
    Cuando publica un trabajo con título y descripción
    Entonces el trabajo aparece en su galería pública sin incluir documentos de verificación

  @TC_022 @HU_S02_05 @automatizar @pendiente_P17
  Escenario: TC-022 - Archivo no permitido
    Dado un archivo cuyo contenido no cumple la política de imágenes aprobada
    Cuando se intenta subir como foto de portafolio
    Entonces se rechaza y no queda disponible para descarga pública

  @TC_023 @HU_S02_06 @automatizar
  Escenario: TC-023 - Configuración válida
    Dado un técnico habilitado y distritos de prueba aprobados
    Cuando guarda horarios y activa una pausa temporal válida
    Entonces se conservan horarios y zona y la pausa queda disponible para el filtro de elegibilidad

  @TC_024 @HU_S02_06 @automatizar
  Escenario: TC-024 - Intervalo inválido
    Dado un técnico con horario previamente guardado
    Cuando envía una franja cuyo fin es anterior al inicio
    Entonces recibe validación de error y el horario anterior no se altera

  @TC_025 @HU_S02_07 @automatizar
  Escenario: TC-025 - Nueva versión de tarifa
    Dado un servicio técnico con tarifa referencial de prueba 50 y versión 1
    Cuando su propietario cambia la referencia a 60
    Entonces se crea versión 2 y la versión 1 conserva el valor 50 sin sobrescritura

  @TC_026 @HU_S02_07 @automatizar
  Escenario: TC-026 - Tarifa negativa
    Dado un técnico editando su propio servicio
    Cuando envía una tarifa referencial negativa
    Entonces la API rechaza el valor y no crea una versión de tarifa
