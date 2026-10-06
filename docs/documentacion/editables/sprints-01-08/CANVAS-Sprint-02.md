# CANVAS · Sprint 2 — Landing, administración de catálogo y perfil del técnico

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** Landing de 10 secciones; administración de categorías/subcategorías y foto de carrusel, comunicados y verificación de técnicos; perfil y portafolio técnico, disponibilidad, zona, servicios ofrecidos, tarifas y pausa temporal (RF-05, RF-07).

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Hacer visible la oferta del marketplace y permitir que el administrador y los técnicos preparen información verificable que alimentará la búsqueda y el matching.

## 2. Dependencias, límites y condiciones de entrada

Depende de identidad, RBAC y catálogo del Sprint 1. RF-07 se prepara aquí mediante datos de habilitación; su filtro integrado se valida en Sprint 4. No se incorpora todavía el motor de matching ni la búsqueda completa del Sprint 3.

**Decisiones por resolver para las historias afectadas:** P03 distritos; P05/P16 duración y compatibilidad de franjas; P17 límites y formatos de archivos; P18 efectos de suspensión; P19 cambios de catálogo sobre solicitudes futuras/activas; P22 rechazo de verificación. Resolver la política aplicable antes de aceptar cada historia afectada.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S02-01 | HU-31 | RF-C08 | Landing y carrusel |
| HU-S02-02 | HU-25 | RF-C01, RF-C02 | Catálogo administrable |
| HU-S02-03 | HU-27 | RF-C04, RF-C09 | Comunicados por audiencia |
| HU-S02-04 | HU-02 | RF-07, RF-30, RF-33 | Verificación administrativa |
| HU-S02-05 | HU-29 | RF-C06, RF-33 | Perfil y portafolio |
| HU-S02-06 | HU-06 | RF-05, RF-07 | Disponibilidad, zona y pausa |
| HU-S02-07 | HU-05, HU-06 | RF-05, RF-07, RF-C06 | Servicios y tarifas |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | Frontend: conservar paleta y carruseles existentes; features/administration para gestión y perfiles; src/components para campos, galería y estados reutilizables. |
| RT-02 | Laravel: FAdministration para catálogo, revisión y comunicados; ARequests para disponibilidad/oferta profesional, con Policies en los controladores y reglas en casos de uso. |
| RT-03 | Contratos de referencia: /admin/specialties, /admin/subcategories, /admin/districts, /admin/announcements, /admin/technicians/{id}/reviews; /technicians/me/profile\|portfolio\|documents\|availability\|services y /media. |
| RT-04 | Tablas foco: technician_reviews, technician_documents, review_documents, media_files, portfolio_items/images, technician_services, service_rate_versions, technician_districts, availability_slots, technician_pauses, announcements/audiences. |
| RT-05 | Diferenciar archivos privados de imágenes públicas aprobadas. Eliminar del CRUD de catálogo significa desactivar, conservando referencias; comunicado eliminado se retira con auditoría. |
| RT-06 | RNF-03 y accesibilidad: móvil sin desbordamiento, teclado y foco visible, movimiento reducido y pausa de animaciones fuera de pantalla. Carrusel conserva intervalo aprobado de 2,5 s cuando la reproducción está habilitada. |

| Área | Ruta relativa a la raíz del proyecto | Uso |
| --- | --- | --- |
| Frontend | frontend/web/src/features/{requests,matching,offers,service,ratings,administration} | Destino modular orientativo del diseño; adaptar componentes existentes sin sustituir el proyecto completo. |
| Backend | backend/api/app/Modules/{ARequests,BMatching,COffers,DService,ERatings,FAdministration} | Separar HTTP, Application, Domain e Infrastructure cuando existan responsabilidades concretas; no crear capas vacías por formalidad. |
| Persistencia | backend/api/database/migrations y seeders; database/ | Migraciones MySQL versionadas como fuente ejecutable; database conserva documentación/referencia, no un segundo esquema contradictorio. |
| Pruebas PHP | backend/api/tests/Unit y tests/Feature | Rutas de destino propuestas para Pest, API y MySQL; introducir carpetas por módulo al implementar. |
| Pruebas navegador | frontend/web/cypress/e2e/sprint-NN | Ruta prevista para recorridos Cypress; los .feature entregados son especificaciones, no pruebas Cypress implementadas. |
| Entorno | infrastructure/ y .devops/ | Conservar las raíces existentes para Compose, despliegue y automatización; fijar un solo pipeline activo al implementar. |
| Evidencia | docs/documentacion/evidencias/sprint-NN/ | Ruta propuesta para informes, resultados, defectos y acta. Esta entrega no crea resultados ficticios. |
| Documentación | docs/documentacion/editables/sprints-01-08/ | CANVAS, escenarios y catálogo de pruebas previstos en esta entrega. |

Raíz: `C:/Users/James/Documents/ChatGPT/Software TecnicoYa-Huancayo`. Las rutas modulares y de pruebas son destinos del diseño, no afirmaciones sobre implementación existente. La carpeta histórica `python/` se conserva, pero el diseño actual concentra matching en Laravel; no se migra ni elimina código en esta entrega documental.

## 5. Tareas de la iteración

Orden de trabajo: refinamiento y contrato → migración/modelo → dominio/caso de uso/API → interfaz → integración y pruebas → revisión y evidencia. Validar un flujo completo antes de extender al siguiente. No delegar permisos ni estados al navegador.

| Tarea | Historia | Trabajo por capa y entregable | Pruebas previstas |
| --- | --- | --- | --- |
| T-S02-01 | HU-S02-01 | FE: Header, Hero, Especialidades, Cómo funciona, Confianza, Testimonios, CTA técnicos, FAQ, CTA final y Footer; API: catálogo público; datos: solo contenido sintético rotulado. | TC-013, TC-014 |
| T-S02-02 | HU-S02-02 | FE: tablas/formularios/foto; API: altas y cambios autorizados; datos: relación rubro-subcategoría, imagen y activación lógica, distritos aprobados. | TC-015, TC-016 |
| T-S02-03 | HU-S02-03 | FE: editor con vista previa, duplicar y retirar; API: validar audiencia/fechas/enlace; datos: announcements y audiencias sin publicación automática de duplicados. | TC-017, TC-018 |
| T-S02-04 | HU-S02-04 | FE: bandeja pendiente/ficha/decisión/motivo; API: ReviewTechnician con versión y permiso; datos: revisión y vínculos documentales auditados. | TC-019, TC-020 |
| T-S02-05 | HU-S02-05 | FE: bio y galería con estados; API: pertenencia y validación de archivos; datos: media privada/pública y portafolio separado de documentos. | TC-021, TC-022 |
| T-S02-06 | HU-S02-06 | FE: editor de franjas/distritos/pausa; API: intervalos válidos y versión; datos: slots, cobertura y pausas, diferenciados del estado de verificación. | TC-023, TC-024 |
| T-S02-07 | HU-S02-07 | FE: selector por rubro y tarifa por servicio; API: categorías activas y ámbito verificado; datos: technician_services y service_rate_versions. | TC-025, TC-026 |

**T-S02-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S02-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S02-01 · Landing y carrusel

Como **visitante**, quiero **entender el servicio y navegar hacia registro o búsqueda**, para **identificar la especialidad que necesito**.

**Fuente:** HU-31. **Requerimientos:** RF-C08.

- **AC-S02-01-01 / TC-013: Dado** un visitante abre la landing en móvil y escritorio, **cuando** recorre sus diez secciones y usa los CTA de acceso, **entonces** lee los títulos completos, llega a la cuenta correcta y no encuentra paneles privados dentro de la landing.
- **AC-S02-01-02 / TC-014: Dado** el carrusel está visible y el usuario ha solicitado movimiento reducido, **cuando** se carga la sección y navega con teclado, **entonces** la reproducción automática permanece pausada y los controles permiten cambiar de tarjeta con foco visible.

### HU-S02-02 · Catálogo administrable

Como **administrador de catálogo**, quiero **gestionar subcategorías y fotos**, para **mantener una oferta clara sin perder referencias**.

**Fuente:** HU-25. **Requerimientos:** RF-C01, RF-C02.

- **AC-S02-02-01 / TC-015: Dado** un administrador autorizado y una especialidad activa, **cuando** crea una subcategoría con imagen validada, **entonces** la subcategoría aparece en su especialidad y la foto aprobada se ofrece al carrusel.
- **AC-S02-02-02 / TC-016: Dado** una subcategoría referenciada por un servicio de prueba, **cuando** el administrador la desactiva, **entonces** deja de ofrecerse para nuevos registros pero conserva su identidad y referencias anteriores.

### HU-S02-03 · Comunicados por audiencia

Como **administrador de comunicaciones**, quiero **publicar avisos con audiencia y vigencia**, para **informar solo a los usuarios correspondientes**.

**Fuente:** HU-27. **Requerimientos:** RF-C04, RF-C09.

- **AC-S02-03-01 / TC-017: Dado** un comunicado vigente dirigido solo a técnicos, **cuando** un cliente y un técnico consultan sus comunicados, **entonces** solo el técnico recibe ese comunicado.
- **AC-S02-03-02 / TC-018: Dado** un comunicado publicado, **cuando** el administrador lo duplica, **entonces** se crea una copia en borrador que no aparece aún en ningún panel.

### HU-S02-04 · Verificación administrativa

Como **administrador verificador**, quiero **revisar los datos y evidencias del técnico**, para **habilitar solo perfiles revisados**.

**Fuente:** HU-02. **Requerimientos:** RF-07, RF-30, RF-33.

- **AC-S02-04-01 / TC-019: Dado** un perfil pendiente con los datos y evidencias exigidos por la política aprobada, **cuando** el administrador autorizado aprueba la revisión, **entonces** se registra la decisión, su autor y fecha y el perfil adquiere la habilitación prevista.
- **AC-S02-04-02 / TC-020: Dado** un técnico intenta consultar el documento privado de otro técnico, **cuando** solicita su URL por identificador, **entonces** se deniega la descarga sin revelar el contenido.

### HU-S02-05 · Perfil y portafolio

Como **técnico**, quiero **publicar mi experiencia y trabajos autorizados**, para **presentar mi especialización a futuros clientes**.

**Fuente:** HU-29. **Requerimientos:** RF-C06, RF-33.

- **AC-S02-05-01 / TC-021: Dado** un técnico propietario de una imagen permitida para portafolio, **cuando** publica un trabajo con título y descripción, **entonces** el trabajo aparece en su galería pública sin incluir documentos de verificación.
- **AC-S02-05-02 / TC-022: Dado** un archivo cuyo contenido no cumple la política de imágenes aprobada, **cuando** se intenta subir como foto de portafolio, **entonces** se rechaza y no queda disponible para descarga pública. **Condicionado a P17.**

### HU-S02-06 · Disponibilidad, zona y pausa

Como **técnico**, quiero **configurar franjas y cobertura y pausar temporalmente mi oferta**, para **controlar cuándo puedo recibir solicitudes**.

**Fuente:** HU-06. **Requerimientos:** RF-05, RF-07.

- **AC-S02-06-01 / TC-023: Dado** un técnico habilitado y distritos de prueba aprobados, **cuando** guarda horarios y activa una pausa temporal válida, **entonces** se conservan horarios y zona y la pausa queda disponible para el filtro de elegibilidad.
- **AC-S02-06-02 / TC-024: Dado** un técnico con horario previamente guardado, **cuando** envía una franja cuyo fin es anterior al inicio, **entonces** recibe validación de error y el horario anterior no se altera.

### HU-S02-07 · Servicios y tarifas

Como **técnico**, quiero **seleccionar las subcategorías que ofrezco y sus tarifas referenciales**, para **mostrar condiciones consistentes**.

**Fuente:** HU-05, HU-06. **Requerimientos:** RF-05, RF-07, RF-C06.

- **AC-S02-07-01 / TC-025: Dado** un servicio técnico con tarifa referencial de prueba 50 y versión 1, **cuando** su propietario cambia la referencia a 60, **entonces** se crea versión 2 y la versión 1 conserva el valor 50 sin sobrescritura.
- **AC-S02-07-02 / TC-026: Dado** un técnico editando su propio servicio, **cuando** envía una tarifa referencial negativa, **entonces** la API rechaza el valor y no crea una versión de tarifa.

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-02.feature](bdd/sprint-02.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
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
```

## 8. Casos de prueba previstos (14)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-013 · Diez secciones navegables

**Traza:** RF-C08 → HU-31 → HU-S02-01 → AC-S02-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un visitante abre la landing en móvil y escritorio.
- **Pasos previstos:** preparar la precondición en el entorno aislado; recorre sus diez secciones y usa los CTA de acceso; consultar estado persistido y efectos observables.
- **Resultado esperado:** lee los títulos completos, llega a la cuenta correcta y no encuentra paneles privados dentro de la landing.
- **Nivel/herramienta:** E2E / Cypress.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-02/tc-013.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-013/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-014 · Carrusel accesible

**Traza:** RF-C08 → HU-31 → HU-S02-01 → AC-S02-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** el carrusel está visible y el usuario ha solicitado movimiento reducido.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se carga la sección y navega con teclado; consultar estado persistido y efectos observables.
- **Resultado esperado:** la reproducción automática permanece pausada y los controles permiten cambiar de tarjeta con foco visible.
- **Nivel/herramienta:** E2E / Cypress.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-02/tc-014.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-014/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-015 · Alta de subcategoría

**Traza:** RF-C01, RF-C02 → HU-25 → HU-S02-02 → AC-S02-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un administrador autorizado y una especialidad activa.
- **Pasos previstos:** preparar la precondición en el entorno aislado; crea una subcategoría con imagen validada; consultar estado persistido y efectos observables.
- **Resultado esperado:** la subcategoría aparece en su especialidad y la foto aprobada se ofrece al carrusel.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC015.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-015/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-016 · Desactivar conserva historial

**Traza:** RF-C01, RF-C02 → HU-25 → HU-S02-02 → AC-S02-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una subcategoría referenciada por un servicio de prueba.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el administrador la desactiva; consultar estado persistido y efectos observables.
- **Resultado esperado:** deja de ofrecerse para nuevos registros pero conserva su identidad y referencias anteriores.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC016.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-016/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-017 · Audiencia vigente

**Traza:** RF-C04, RF-C09 → HU-27 → HU-S02-03 → AC-S02-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un comunicado vigente dirigido solo a técnicos.
- **Pasos previstos:** preparar la precondición en el entorno aislado; un cliente y un técnico consultan sus comunicados; consultar estado persistido y efectos observables.
- **Resultado esperado:** solo el técnico recibe ese comunicado.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC017.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-017/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-018 · Duplicado en borrador

**Traza:** RF-C04, RF-C09 → HU-27 → HU-S02-03 → AC-S02-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un comunicado publicado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el administrador lo duplica; consultar estado persistido y efectos observables.
- **Resultado esperado:** se crea una copia en borrador que no aparece aún en ningún panel.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC018.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-018/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-019 · Aprobación documentada

**Traza:** RF-07, RF-30, RF-33 → HU-02 → HU-S02-04 → AC-S02-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un perfil pendiente con los datos y evidencias exigidos por la política aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el administrador autorizado aprueba la revisión; consultar estado persistido y efectos observables.
- **Resultado esperado:** se registra la decisión, su autor y fecha y el perfil adquiere la habilitación prevista.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC019.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-019/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-020 · Documento ajeno denegado

**Traza:** RF-07, RF-30, RF-33 → HU-02 → HU-S02-04 → AC-S02-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico intenta consultar el documento privado de otro técnico.
- **Pasos previstos:** preparar la precondición en el entorno aislado; solicita su URL por identificador; consultar estado persistido y efectos observables.
- **Resultado esperado:** se deniega la descarga sin revelar el contenido.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC020.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-020/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-021 · Trabajo publicado

**Traza:** RF-C06, RF-33 → HU-29 → HU-S02-05 → AC-S02-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico propietario de una imagen permitida para portafolio.
- **Pasos previstos:** preparar la precondición en el entorno aislado; publica un trabajo con título y descripción; consultar estado persistido y efectos observables.
- **Resultado esperado:** el trabajo aparece en su galería pública sin incluir documentos de verificación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC021.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-021/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-022 · Archivo no permitido

**Traza:** RF-C06, RF-33 → HU-29 → HU-S02-05 → AC-S02-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un archivo cuyo contenido no cumple la política de imágenes aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta subir como foto de portafolio; consultar estado persistido y efectos observables.
- **Resultado esperado:** se rechaza y no queda disponible para descarga pública.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC022.php (destino propuesto)`.
- **Dependencia de decisión:** P17.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-022/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-023 · Configuración válida

**Traza:** RF-05, RF-07 → HU-06 → HU-S02-06 → AC-S02-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico habilitado y distritos de prueba aprobados.
- **Pasos previstos:** preparar la precondición en el entorno aislado; guarda horarios y activa una pausa temporal válida; consultar estado persistido y efectos observables.
- **Resultado esperado:** se conservan horarios y zona y la pausa queda disponible para el filtro de elegibilidad.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC023.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-023/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-024 · Intervalo inválido

**Traza:** RF-05, RF-07 → HU-06 → HU-S02-06 → AC-S02-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico con horario previamente guardado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; envía una franja cuyo fin es anterior al inicio; consultar estado persistido y efectos observables.
- **Resultado esperado:** recibe validación de error y el horario anterior no se altera.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC024.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-024/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-025 · Nueva versión de tarifa

**Traza:** RF-05, RF-07, RF-C06 → HU-05, HU-06 → HU-S02-07 → AC-S02-07-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un servicio técnico con tarifa referencial de prueba 50 y versión 1.
- **Pasos previstos:** preparar la precondición en el entorno aislado; su propietario cambia la referencia a 60; consultar estado persistido y efectos observables.
- **Resultado esperado:** se crea versión 2 y la versión 1 conserva el valor 50 sin sobrescritura.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC025.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-025/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-026 · Tarifa negativa

**Traza:** RF-05, RF-07, RF-C06 → HU-05, HU-06 → HU-S02-07 → AC-S02-07-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico editando su propio servicio.
- **Pasos previstos:** preparar la precondición en el entorno aislado; envía una tarifa referencial negativa; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API rechaza el valor y no crea una versión de tarifa.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint02/TC026.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-02/TC-026/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S02-01 | Autorizar propiedad en toda edición técnica y permiso específico en verificación/catálogo; un técnico no se habilita a sí mismo. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S02-02 | Validar contenido real, tamaño y finalidad del archivo según política acordada; impedir ejecución, rutas de disco arbitrarias y descarga de documentos privados. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S02-03 | Escapar texto de bio/comunicados y permitir solo enlaces con esquemas aceptados; no interpretar HTML aportado como código. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S02-04 | Auditar revisión, cambios de estado y tarifas. Una suspensión no borra trabajos ni evidencia. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S02-05 | Marcar cifras y testimonios sintéticos como ejemplos académicos; no presentar reseñas o resultados ficticios como evidencia real. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

Transversal: detectar secretos y dependencias vulnerables, revisar entradas y permisos, usar datos sintéticos y conservar auditoría desde la primera acción sensible. La instrumentación se introduce junto al flujo; la interfaz completa y el endurecimiento permanecen en los sprints previstos.

## 10. Definition of Done

### DoD común del incremento

- [ ] Las historias comprometidas cumplen sus criterios positivos, alternativos y de autorización; las decisiones pendientes que condicionan su aceptación están resueltas y registradas. Un caso condicionado no se cuenta como aprobado por omisión.
- [ ] Código revisado y responsabilidades separadas conforme diseño modular/SOLID; contratos, migraciones, diccionario y trazabilidad actualizados para el incremento real, sin afirmar que todo el proyecto está terminado.
- [ ] Build y pruebas aplicables ejecutados en entorno aislado con versiones identificadas. Casos de servidor usan MySQL cuando se evalúa integridad/concurrencia; Cypress no sustituye la prueba de transacción.
- [ ] Sin secretos en el repositorio o artefactos. Autorización por rol/propiedad, validación y privacidad del nuevo flujo probadas; sin defectos bloqueantes de seguridad/integridad. Umbrales de defectos restantes se acuerdan en P21.
- [ ] Regresión de comportamientos afectados de sprints anteriores realizada; fallos y excepciones documentados con responsable y resolución. No marcar aprobado un escenario omitido ni un test deshabilitado.
- [ ] Evidencias vinculadas a TC, HU, RF/RNF, commit, entorno/versiones, dataset, resultado, fecha y defecto. Los informes del runner son evidencia; una captura aislada no demuestra integridad.
- [ ] Incremento integrado y demostrable en el entorno acordado; revisión con el asesor, observaciones y aceptación registradas. Retrospectiva identifica mejoras sin cambiar silenciosamente los ocho alcances.

### DoD específica de este sprint

- [ ] Las diez secciones de landing existen y sus CTA llevan al flujo disponible con teclado/móvil y movimiento reducido.
- [ ] Administrador gestiona catálogo, fotos, comunicados y revisión técnica con permisos y trazabilidad.
- [ ] Técnico gestiona únicamente su portafolio, disponibilidad, cobertura, servicios, tarifas y pausa.
- [ ] Tarifas conservan versiones; documentos privados no se exponen en el perfil público.
- [ ] Datos de elegibilidad quedan preparados para Sprint 4 sin afirmar matching implementado.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 2 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-02/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
