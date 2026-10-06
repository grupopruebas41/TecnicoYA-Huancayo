# CANVAS · Sprint 8 — Pagos, notificaciones, endurecimiento y despliegue

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** RF-32; método de pago y comprobante simulado sin dinero real, historial y ganancias del técnico, preferencias de notificación, ayuda y soporte; endurecimiento; regresión y pruebas no funcionales; SonarQube con Quality Gate; despliegue en servidor.

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Integrar los recorridos finales y demostrar un MVP desplegable y verificable, con simulación económica inequívoca, controles de seguridad revisados y evidencias reales de calidad.

## 2. Dependencias, límites y condiciones de entrada

Integra Sprints 1–7: participaciones/tarifas históricas, notificaciones desde Sprint 4 y soporte administrativo desde Sprint 7. No posponer aquí la seguridad básica: se endurecen controles ya construidos. Servidor de demostración académica, no operación comercial ni cobros reales.

**Decisiones por resolver para las historias afectadas:** P01 moneda; P02/P16 cálculo y procedencia de montos para ganancias simuladas y métodos; P08 retención/anonimización; P09 muestra/ventana de observación; P12 avisos obligatorios; P21 protocolo de carga, métricas de cobertura, defectos y fórmulas. El plan actual confirma historial/ganancias/comprobante simulados; no reactiva confirmación financiera ni validez tributaria de propuestas anteriores.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S08-01 | HU-23 | RF-32, RF-C11 | Métodos y comprobante simulado |
| HU-S08-02 | HU-23, HU-18 | RF-32, RF-C11 | Historial y ganancias simuladas |
| HU-S08-03 | HU-20 | RF-C09, RF-29 | Preferencias y bandeja de avisos |
| HU-S08-04 | HU-30 | RF-C07 | Ayuda y soporte de usuarios |
| HU-S08-05 | HU-24, HU-28, HU-32 | RF-33; RNF-08, RNF-09, RNF-10 | Regresión y endurecimiento |
| HU-S08-06 | HU-32 | RNF-11, RNF-12 | Quality Gate y cobertura |
| HU-S08-07 | HU-32 | RNF-01, RNF-02 | Rendimiento y concurrencia |
| HU-S08-08 | HU-31, HU-32 | RNF-03, RNF-04, RNF-05 | Usabilidad y beneficio académico |
| HU-S08-09 | HU-32 | RNF-06, RNF-10, RNF-13, RNF-14 | Despliegue, respaldo y recuperación |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | FAdministration para métodos, registros simulados, preferencias y soporte; React paneles cliente/técnico. Documentar contratos faltantes de comprobante e historial simulado antes de implementarlos, sin atribuirlos al contrato anterior si no están allí. |
| RT-02 | Tablas: payment_methods, user_payment_methods, request_payment_methods, simulated_payments/events/receipts, notification_preferences y support_tickets/updates/attachments. No guardar PAN/CVV ni activar una pasarela. |
| RT-03 | Contratos existentes: /payment-methods, /requests/{id}/payment-method, /me/notification-preferences y /support-cases; completar consultas/descargas simuladas con Policies y trazabilidad. |
| RT-04 | Compose de demostración: gateway HTTPS/WSS, api, mysql interno, worker-domain, worker-delivery, scheduler y reverb; imágenes identificadas y configuración del servidor separada de frontend-dev y test-runner. |
| RT-05 | SonarQube en entorno de calidad restringido con almacenamiento compatible independiente. Quality Gate usa reportes reales de pruebas; no sustituye Pest, Cypress, pruebas de carga ni revisión de seguridad. |
| RT-06 | RNF-01..14: protocolo P21 con hardware/dataset/carga y estadístico antes de medir; matching ≤3 s, 200 concurrentes, SUS ≥70, cinco pasos y mediana ≤3 min, disponibilidad 99% en ventana acordada y cobertura ≥70% en matching/notificación/calificación. |
| RT-07 | Pipeline: revisión, detección de secretos/dependencias, build, Pest/MySQL, Cypress, informes y Quality Gate, artefactos identificados; no publicar un artefacto que falle controles obligatorios. |
| RT-08 | Despliegue: copia recuperable, migración controlada, salud y humo por roles, jobs/vencimientos/Reverb, observación y reversión. No usar migrate:fresh en datos persistentes ni asumir que bajar esquema es una reversión segura. |

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
| T-S08-01 | HU-S08-01 | FE: selección/aviso/descarga; API: propietario e idempotencia; datos: método por solicitud, registro y comprobante simulado por participación. | TC-101, TC-102 |
| T-S08-02 | HU-S08-02 | FE: totales/historial/exportación propia; API: fórmula y estados aprobados; datos: registros simulados sin mezclar tarifas actuales con importes históricos. | TC-103, TC-104 |
| T-S08-03 | HU-S08-03 | FE: preferencias/bandeja/marcar leída; API: dueño y avisos obligatorios; datos: preferencias y entregas sandbox. | TC-105, TC-106 |
| T-S08-04 | HU-S08-04 | FE: FAQ, contacto institucional y formulario; API: /support-cases con propiedad de solicitud; datos: tickets vinculados a la bandeja de Sprint 7. | TC-107, TC-108 |
| T-S08-05 | HU-S08-05 | QA: suite acumulada, matriz de abuso y archivos; infraestructura: configuración de seguridad; datos: sintéticos y evidencias por commit. | TC-109, TC-110 |
| T-S08-06 | HU-S08-06 | CI: reportes Pest/Cypress y cobertura real, scanner y gate; datos: commit, configuración del gate y resultados archivados. | TC-111, TC-112 |
| T-S08-07 | HU-S08-07 | QA: herramienta de carga a seleccionar/documentar, dataset fijo y perfil de 200 usuarios; API: métricas separadas de duración de matching y transporte. | TC-113, TC-114 |
| T-S08-08 | HU-S08-08 | QA: recorridos en Chrome/Edge/Firefox y tamaños acordados; evaluación con participantes aprobados, SUS, cronometraje y comparación informal/plataforma. | TC-115, TC-116 |
| T-S08-09 | HU-S08-09 | Infraestructura: Compose/healthchecks/TLS, copia, migración y smoke; QA: restauración aislada y monitoreo en ventana aprobada; datos: manifiesto y bitácora. | TC-117, TC-118 |

**T-S08-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S08-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S08-01 · Métodos y comprobante simulado

Como **cliente**, quiero **registrar un método y consultar una constancia simulada**, para **conservar el registro sin efectuar un pago real**.

**Fuente:** HU-23. **Requerimientos:** RF-32, RF-C11.

- **AC-S08-01-01 / TC-101: Dado** una participación propia con registro económico sintético permitido, **cuando** el cliente selecciona método y obtiene el comprobante, **entonces** la selección se conserva y el archivo dice simulado y sin validez tributaria sin iniciar un cobro. **Condicionado a P01, P02, P16.**
- **AC-S08-01-02 / TC-102: Dado** un comprobante privado de otro cliente, **cuando** se intenta descargar usando su identificador, **entonces** se deniega sin revelar montos ni archivo.

### HU-S08-02 · Historial y ganancias simuladas

Como **técnico**, quiero **consultar el resumen económico simulado por periodo**, para **demostrar la trazabilidad de mis atenciones**.

**Fuente:** HU-23, HU-18. **Requerimientos:** RF-32, RF-C11.

- **AC-S08-02-01 / TC-103: Dado** registros sintéticos propios de 50 y 70 incluidos por la fórmula aprobada y otro de un tercero, **cuando** el técnico consulta su periodo, **entonces** el resumen muestra 120 como ganancia simulada y excluye al tercero. **Condicionado a P02, P21.**
- **AC-S08-02-02 / TC-104: Dado** una atención con importe simulado histórico 50 y tarifa actual actualizada a 80, **cuando** se consulta el historial de la atención, **entonces** se conserva el importe histórico 50 y no se presenta 80 como pago ocurrido.

### HU-S08-03 · Preferencias y bandeja de avisos

Como **usuario**, quiero **elegir preferencias y revisar mis avisos**, para **recibir información según las opciones permitidas**.

**Fuente:** HU-20. **Requerimientos:** RF-C09, RF-29.

- **AC-S08-03-01 / TC-105: Dado** un usuario desactiva un canal opcional conforme política aprobada, **cuando** se genera una notificación opcional de ese canal, **entonces** no se entrega por el canal desactivado y se conserva el aviso interno aplicable. **Condicionado a P12.**
- **AC-S08-03-02 / TC-106: Dado** una notificación dirigida a otro usuario, **cuando** se intenta marcarla como leída por identificador, **entonces** la API deniega y su estado no cambia.

### HU-S08-04 · Ayuda y soporte de usuarios

Como **cliente o técnico**, quiero **consultar ayuda y enviar un ticket propio**, para **recibir soporte sin un chat adicional**.

**Fuente:** HU-30. **Requerimientos:** RF-C07.

- **AC-S08-04-01 / TC-107: Dado** un cliente autenticado con una solicitud propia, **cuando** envía un ticket válido y soporte lo resuelve, **entonces** puede consultar su ticket y la resolución registrada en la bandeja administrativa.
- **AC-S08-04-02 / TC-108: Dado** un usuario conoce el identificador de una solicitud ajena, **cuando** lo adjunta como contexto de un ticket, **entonces** se deniega el vínculo y no se revela información de esa solicitud.

### HU-S08-05 · Regresión y endurecimiento

Como **equipo**, quiero **verificar el sistema integrado y sus límites de acceso**, para **entregar un incremento sin regresiones conocidas críticas**.

**Fuente:** HU-24, HU-28, HU-32. **Requerimientos:** RF-33; RNF-08, RNF-09, RNF-10.

- **AC-S08-05-01 / TC-109: Dado** un entorno integrado con cliente, técnico verificado y administrador de prueba, **cuando** se ejecuta solicitud, oferta, elección, atención, calificación y consulta administrativa, **entonces** cada etapa se persiste una sola vez y solo los roles autorizados pueden intervenir.
- **AC-S08-05-02 / TC-110: Dado** el artefacto candidato y la configuración del servidor de demostración, **cuando** se inspeccionan bundle, imagen, puertos, depuración y cookies bajo HTTPS, **entonces** no contienen secretos, MySQL no es público, debug está desactivado y la sesión usa protecciones acordadas.

### HU-S08-06 · Quality Gate y cobertura

Como **equipo**, quiero **evaluar el código y las pruebas con una puerta de calidad**, para **impedir la entrega de una versión que incumpla controles acordados**.

**Fuente:** HU-32. **Requerimientos:** RNF-11, RNF-12.

- **AC-S08-06-01 / TC-111: Dado** un commit con suites obligatorias aprobadas e informes auténticos, **cuando** SonarQube evalúa los umbrales aprobados y cobertura del núcleo, **entonces** el pipeline solo habilita la entrega si el gate pasa y conserva métricas y alcance. **Condicionado a P21.**
- **AC-S08-06-02 / TC-112: Dado** un análisis cuya puerta de calidad falla, **cuando** el pipeline intenta continuar al despliegue, **entonces** se bloquea la promoción del artefacto y se conserva el motivo del fallo.

### HU-S08-07 · Rendimiento y concurrencia

Como **equipo**, quiero **medir tiempos bajo carga representativa**, para **contrastar los objetivos con datos reproducibles**.

**Fuente:** HU-32. **Requerimientos:** RNF-01, RNF-02.

- **AC-S08-07-01 / TC-113: Dado** un servidor, dataset, mezcla de operaciones y estadístico temporal aprobados, **cuando** se ejecuta el protocolo con 200 usuarios concurrentes y solicitudes de matching, **entonces** se registra la distribución completa y se verifica matching ≤3 s bajo el criterio acordado sin ocultar errores. **Condicionado a P21.**
- **AC-S08-07-02 / TC-114: Dado** solicitudes concurrentes que compiten por franjas de técnicos de prueba, **cuando** se ejecuta la carga y se inspeccionan invariantes de MySQL, **entonces** no existen reservas incompatibles dobles ni ofertas activas por encima del límite. **Condicionado a P16, P21.**

### HU-S08-08 · Usabilidad y beneficio académico

Como **asesor y equipo**, quiero **evaluar experiencia y tiempo de búsqueda**, para **contrastar los objetivos sin inventar resultados**.

**Fuente:** HU-31, HU-32. **Requerimientos:** RNF-03, RNF-04, RNF-05.

- **AC-S08-08-01 / TC-115: Dado** participantes y protocolo aprobados, con autorización de evidencias, **cuando** completan la solicitud de cinco pasos y el cuestionario SUS, **entonces** se reportan SUS y tiempos y se verifica SUS ≥70 y mediana ≤3 min incluyendo fallos según protocolo. **Condicionado a P09, P21.**
- **AC-S08-08-02 / TC-116: Dado** tres escenarios por especialidad y participantes aprobados con orden alternado, **cuando** se comparan búsquedas informales y en TécnicoYa hasta técnico confirmado, **entonces** se reportan medianas y limitaciones y se contrasta reducción ≥30% sin declararla alcanzada si falla. **Condicionado a P09, P21.**

### HU-S08-09 · Despliegue, respaldo y recuperación

Como **operador del entorno académico**, quiero **desplegar y recuperar una versión identificable**, para **mantener una demostración controlada y verificable**.

**Fuente:** HU-32. **Requerimientos:** RNF-06, RNF-10, RNF-13, RNF-14.

- **AC-S08-09-01 / TC-117: Dado** un respaldo de base/archivos de prueba y una imagen identificada compatible, **cuando** se restaura en entorno aislado y se ejecutan smoke de sesión, solicitud, jobs y Reverb, **entonces** los datos y relaciones esperadas se recuperan y el flujo básico funciona sin borrar la base de demostración.
- **AC-S08-09-02 / TC-118: Dado** una ventana y horario de monitoreo ratificados y servidor desplegado, **cuando** se recopilan todas las observaciones de salud y fallos durante esa ventana, **entonces** se calcula disponibilidad con el protocolo acordado y solo se declara RNF cumplido si alcanza 99%. **Condicionado a P09, P21.**

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-08.feature](bdd/sprint-08.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
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
```

## 8. Casos de prueba previstos (18)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-101 · Constancia inequívoca

**Traza:** RF-32, RF-C11 → HU-23 → HU-S08-01 → AC-S08-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una participación propia con registro económico sintético permitido.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el cliente selecciona método y obtiene el comprobante; consultar estado persistido y efectos observables.
- **Resultado esperado:** la selección se conserva y el archivo dice simulado y sin validez tributaria sin iniciar un cobro.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint08/TC101.php (destino propuesto)`.
- **Dependencia de decisión:** P01, P02, P16.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-101/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-102 · Comprobante ajeno

**Traza:** RF-32, RF-C11 → HU-23 → HU-S08-01 → AC-S08-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un comprobante privado de otro cliente.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta descargar usando su identificador; consultar estado persistido y efectos observables.
- **Resultado esperado:** se deniega sin revelar montos ni archivo.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint08/TC102.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-102/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-103 · Total conforme fórmula

**Traza:** RF-32, RF-C11 → HU-23, HU-18 → HU-S08-02 → AC-S08-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** registros sintéticos propios de 50 y 70 incluidos por la fórmula aprobada y otro de un tercero.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el técnico consulta su periodo; consultar estado persistido y efectos observables.
- **Resultado esperado:** el resumen muestra 120 como ganancia simulada y excluye al tercero.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint08/TC103.php (destino propuesto)`.
- **Dependencia de decisión:** P02, P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-103/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-104 · Tarifa actual no cambia historial

**Traza:** RF-32, RF-C11 → HU-23, HU-18 → HU-S08-02 → AC-S08-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una atención con importe simulado histórico 50 y tarifa actual actualizada a 80.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se consulta el historial de la atención; consultar estado persistido y efectos observables.
- **Resultado esperado:** se conserva el importe histórico 50 y no se presenta 80 como pago ocurrido.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint08/TC104.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-104/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-105 · Preferencia opcional respetada

**Traza:** RF-C09, RF-29 → HU-20 → HU-S08-03 → AC-S08-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un usuario desactiva un canal opcional conforme política aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se genera una notificación opcional de ese canal; consultar estado persistido y efectos observables.
- **Resultado esperado:** no se entrega por el canal desactivado y se conserva el aviso interno aplicable.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint08/TC105.php (destino propuesto)`.
- **Dependencia de decisión:** P12.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-105/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-106 · Aviso ajeno no editable

**Traza:** RF-C09, RF-29 → HU-20 → HU-S08-03 → AC-S08-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una notificación dirigida a otro usuario.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se intenta marcarla como leída por identificador; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API deniega y su estado no cambia.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint08/TC106.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-106/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-107 · Ticket integrado

**Traza:** RF-C07 → HU-30 → HU-S08-04 → AC-S08-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente autenticado con una solicitud propia.
- **Pasos previstos:** preparar la precondición en el entorno aislado; envía un ticket válido y soporte lo resuelve; consultar estado persistido y efectos observables.
- **Resultado esperado:** puede consultar su ticket y la resolución registrada en la bandeja administrativa.
- **Nivel/herramienta:** E2E / Cypress + API.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-08/tc-107.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-107/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-108 · Solicitud ajena en soporte

**Traza:** RF-C07 → HU-30 → HU-S08-04 → AC-S08-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un usuario conoce el identificador de una solicitud ajena.
- **Pasos previstos:** preparar la precondición en el entorno aislado; lo adjunta como contexto de un ticket; consultar estado persistido y efectos observables.
- **Resultado esperado:** se deniega el vínculo y no se revela información de esa solicitud.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint08/TC108.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-108/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-109 · Recorrido completo por roles

**Traza:** RF-33; RNF-08, RNF-09, RNF-10 → HU-24, HU-28, HU-32 → HU-S08-05 → AC-S08-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un entorno integrado con cliente, técnico verificado y administrador de prueba.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta solicitud, oferta, elección, atención, calificación y consulta administrativa; consultar estado persistido y efectos observables.
- **Resultado esperado:** cada etapa se persiste una sola vez y solo los roles autorizados pueden intervenir.
- **Nivel/herramienta:** E2E / Cypress + API + Reverb.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-08/tc-109.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-109/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-110 · Configuración expuesta insegura

**Traza:** RF-33; RNF-08, RNF-09, RNF-10 → HU-24, HU-28, HU-32 → HU-S08-05 → AC-S08-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** el artefacto candidato y la configuración del servidor de demostración.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se inspeccionan bundle, imagen, puertos, depuración y cookies bajo HTTPS; consultar estado persistido y efectos observables.
- **Resultado esperado:** no contienen secretos, MySQL no es público, debug está desactivado y la sesión usa protecciones acordadas.
- **Nivel/herramienta:** Automatización de seguridad / CI.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `Planificar script/protocolo en .devops/ o infrastructure/; evidencia: docs/documentacion/evidencias/sprint-08/TC-110/`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-110/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-111 · Puerta de calidad válida

**Traza:** RNF-11, RNF-12 → HU-32 → HU-S08-06 → AC-S08-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un commit con suites obligatorias aprobadas e informes auténticos.
- **Pasos previstos:** preparar la precondición en el entorno aislado; SonarQube evalúa los umbrales aprobados y cobertura del núcleo; consultar estado persistido y efectos observables.
- **Resultado esperado:** el pipeline solo habilita la entrega si el gate pasa y conserva métricas y alcance.
- **Nivel/herramienta:** Automatización de calidad / CI.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `Planificar script/protocolo en .devops/ o infrastructure/; evidencia: docs/documentacion/evidencias/sprint-08/TC-111/`.
- **Dependencia de decisión:** P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-111/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-112 · Gate fallido bloquea entrega

**Traza:** RNF-11, RNF-12 → HU-32 → HU-S08-06 → AC-S08-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un análisis cuya puerta de calidad falla.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el pipeline intenta continuar al despliegue; consultar estado persistido y efectos observables.
- **Resultado esperado:** se bloquea la promoción del artefacto y se conserva el motivo del fallo.
- **Nivel/herramienta:** Automatización de calidad / CI.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `Planificar script/protocolo en .devops/ o infrastructure/; evidencia: docs/documentacion/evidencias/sprint-08/TC-112/`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-112/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-113 · Matching bajo carga

**Traza:** RNF-01, RNF-02 → HU-32 → HU-S08-07 → AC-S08-07-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un servidor, dataset, mezcla de operaciones y estadístico temporal aprobados.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta el protocolo con 200 usuarios concurrentes y solicitudes de matching; consultar estado persistido y efectos observables.
- **Resultado esperado:** se registra la distribución completa y se verifica matching ≤3 s bajo el criterio acordado sin ocultar errores.
- **Nivel/herramienta:** Carga automatizada / herramienta por fijar.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `Planificar script/protocolo en .devops/ o infrastructure/; evidencia: docs/documentacion/evidencias/sprint-08/TC-113/`.
- **Dependencia de decisión:** P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-113/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-114 · Carga no duplica reservas

**Traza:** RNF-01, RNF-02 → HU-32 → HU-S08-07 → AC-S08-07-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** solicitudes concurrentes que compiten por franjas de técnicos de prueba.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta la carga y se inspeccionan invariantes de MySQL; consultar estado persistido y efectos observables.
- **Resultado esperado:** no existen reservas incompatibles dobles ni ofertas activas por encima del límite.
- **Nivel/herramienta:** Carga automatizada / herramienta por fijar.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `Planificar script/protocolo en .devops/ o infrastructure/; evidencia: docs/documentacion/evidencias/sprint-08/TC-114/`.
- **Dependencia de decisión:** P16, P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-114/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-115 · Medición de uso

**Traza:** RNF-03, RNF-04, RNF-05 → HU-31, HU-32 → HU-S08-08 → AC-S08-08-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** participantes y protocolo aprobados, con autorización de evidencias.
- **Pasos previstos:** preparar la precondición en el entorno aislado; completan la solicitud de cinco pasos y el cuestionario SUS; consultar estado persistido y efectos observables.
- **Resultado esperado:** se reportan SUS y tiempos y se verifica SUS ≥70 y mediana ≤3 min incluyendo fallos según protocolo.
- **Nivel/herramienta:** Manual / estudio con participantes.
- **Automatización:** Protocolo manual; no automatizar la participación humana. Destino: `Protocolo con participantes y hoja de medición en docs/documentacion/evidencias/sprint-08/TC-115/`.
- **Dependencia de decisión:** P09, P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-115/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-116 · Reducción de búsqueda

**Traza:** RNF-03, RNF-04, RNF-05 → HU-31, HU-32 → HU-S08-08 → AC-S08-08-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** tres escenarios por especialidad y participantes aprobados con orden alternado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se comparan búsquedas informales y en TécnicoYa hasta técnico confirmado; consultar estado persistido y efectos observables.
- **Resultado esperado:** se reportan medianas y limitaciones y se contrasta reducción ≥30% sin declararla alcanzada si falla.
- **Nivel/herramienta:** Manual / estudio con participantes.
- **Automatización:** Protocolo manual; no automatizar la participación humana. Destino: `Protocolo con participantes y hoja de medición en docs/documentacion/evidencias/sprint-08/TC-116/`.
- **Dependencia de decisión:** P09, P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-116/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-117 · Restauración y humo

**Traza:** RNF-06, RNF-10, RNF-13, RNF-14 → HU-32 → HU-S08-09 → AC-S08-09-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un respaldo de base/archivos de prueba y una imagen identificada compatible.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se restaura en entorno aislado y se ejecutan smoke de sesión, solicitud, jobs y Reverb; consultar estado persistido y efectos observables.
- **Resultado esperado:** los datos y relaciones esperadas se recuperan y el flujo básico funciona sin borrar la base de demostración.
- **Nivel/herramienta:** Integración operativa / scripts + revisión.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `Planificar script/protocolo en .devops/ o infrastructure/; evidencia: docs/documentacion/evidencias/sprint-08/TC-117/`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-117/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-118 · Disponibilidad observada

**Traza:** RNF-06, RNF-10, RNF-13, RNF-14 → HU-32 → HU-S08-09 → AC-S08-09-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una ventana y horario de monitoreo ratificados y servidor desplegado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se recopilan todas las observaciones de salud y fallos durante esa ventana; consultar estado persistido y efectos observables.
- **Resultado esperado:** se calcula disponibilidad con el protocolo acordado y solo se declara RNF cumplido si alcanza 99%.
- **Nivel/herramienta:** Monitoreo automatizado / ventana real.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `Planificar script/protocolo en .devops/ o infrastructure/; evidencia: docs/documentacion/evidencias/sprint-08/TC-118/`.
- **Dependencia de decisión:** P09, P21.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-08/TC-118/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S08-01 | TLS/WSS, sesión segura y CSRF, CORS/orígenes explícitos, depuración desactivada y errores sin trazas internas. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S08-02 | Secretos solo de servidor, sin inclusión en bundle React ni imágenes; MySQL no expuesto públicamente y usuario de ejecución con privilegios mínimos. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S08-03 | Comprobantes privados rotulados SIMULADO y SIN VALIDEZ TRIBUTARIA; ganancias rotuladas simuladas, no ingresos verificados. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S08-04 | Preferencias no desactivan avisos obligatorios sin la política P12; proveedores externos limitados a sandbox. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S08-05 | Regresión de acceso por rol/propiedad, archivos, XSS, escalamiento, concurrencia e idempotencia; revisar dependencias, imágenes y hallazgos de seguridad. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S08-06 | Respaldos y restauración probados, auditoría preservada, plan de incidente y observabilidad de colas, fallos, SLA y disponibilidad. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S08-07 | Retención/anonimización y grabaciones solo conforme decisiones aprobadas; citar normas como referencias de trabajo, sin afirmar certificación ni cumplimiento legal validado. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

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

- [ ] Métodos, comprobantes e historial/ganancias simulados tienen trazabilidad por participación y rótulos inequívocos; no se procesa dinero.
- [ ] Preferencias y soporte de cliente/técnico se integran con backend real y bandeja administrativa.
- [ ] Regresión completa de casos aceptados de Sprints 1–8, resultados y defectos registrados; se cumple la exigencia de más de 60 casos ejecutados distintos, no solo redactados.
- [ ] Quality Gate configurado y aprobado para el commit candidato; cobertura y hallazgos reportados con alcance y límites.
- [ ] Pruebas RNF y evaluación de uso ejecutadas según protocolo aprobado; objetivos no alcanzados se reportan, no se marcan cumplidos por un build correcto.
- [ ] Servidor académico con HTTPS/WSS, datos sintéticos, salud, recuperación, smoke por roles y evidencia de reversión. Ventana de disponibilidad observada antes de declarar su RNF cerrado.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 8 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-08/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
