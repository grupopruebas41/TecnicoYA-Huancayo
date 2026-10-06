# CANVAS · Sprint 4 — Matching, notificación, SLA y reasignación

**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026 · **Estado:** planificación para desarrollo; no acredita implementación ni pruebas ejecutadas.

**Alcance aprobado:** RF-06 a RF-18 y RF-29; parámetros y pesos del matching; algoritmo; notificación a 3 técnicos; SLA de 10 minutos; reasignación automática; Pendiente de disponibilidad de 24 h; Reverb/Echo; solicitudes entrantes con cronómetro.

**Control del plan:** se conservan las ocho iteraciones aprobadas. La Iteración 0 es una precondición y no se renumera. Duración, fechas, capacidad, responsables nominales y estimaciones se fijarán en la planificación; no se inventan en este CANVAS.

## 1. Objetivo y resultado esperado

Transformar una solicitud enviada en ofertas trazables y una asignación elegida por el cliente, respetando elegibilidad, límites temporales, concurrencia y recuperación de fallos.

## 2. Dependencias, límites y condiciones de entrada

Requiere Sprints 1–3 y datos de disponibilidad/tarifas. El historial real llegará en Sprint 6: usar tratamiento de técnico nuevo acordado y fixtures, sin inventar reseñas. La reserva mínima al asignar pertenece a este sprint para impedir dobles asignaciones; el calendario y gestión de citas completos permanecen en Sprint 5. Edición administrativa de reglas y reasignación manual quedan en Sprint 7.

**Decisiones por resolver para las historias afectadas:** P05/P16 franjas y duración; P11 momento y plazo de elección; P12 fronteras temporales, recuperación y avisos; P15 normalización/estimaciones/empate residual; P19 vigencia de reglas. Propuestas: oferta válida mientras now < deadline y reloj 24 h sin reinicio por job. No aprobar esos escenarios condicionados hasta ratificar sus decisiones.

Antes de comprometer una historia: identificar actor, datos y permisos; resolver decisiones que cambien su resultado esperado; preparar fixture y contrato; confirmar capacidad. Se puede trabajar lo independiente, pero una decisión pendiente no se transforma en aprobación por transcurso del sprint.

## 3. Requerimientos funcionales y trazabilidad

| Historia del sprint | HU fuente | RF/RNF relacionados | Comportamiento |
| --- | --- | --- | --- |
| HU-S04-01 | HU-06, HU-07 | RF-06, RF-07, RF-10 | Elegibilidad y subcategoría |
| HU-S04-02 | HU-07 | RF-06, RF-08, RF-09 | Puntuación y desempate |
| HU-S04-03 | HU-08 | RF-11, RF-12 | Estimaciones y técnico nuevo |
| HU-S04-04 | HU-09, HU-20 | RF-13, RF-15, RF-29 | Ronda y notificaciones |
| HU-S04-05 | HU-09 | RF-15, RF-16 | Respuesta y límite del SLA |
| HU-S04-06 | HU-10 | RF-18 | Elección y concurrencia |
| HU-S04-07 | HU-09, HU-10 | RF-16, RF-17 | Reasignación y ruta dirigida |
| HU-S04-08 | HU-11 | RF-14 | Pendiente durante 24 horas |
| HU-S04-09 | HU-20 | RF-29 | Tiempo real y recuperación |
| HU-S04-10 | HU-09, HU-20 | RF-15, RF-29; RNF-07 | Entrega y reintentos controlados |

Los RF-C desglosan funciones ya descritas en los paneles de la Fuente 0. Las HU-S son particiones de planificación, no reemplazan las HU originales. Un RF repetido entre sprints representa preparación, integración o endurecimiento, según el límite indicado.

## 4. Requerimientos técnicos y ubicación del trabajo

| ID local | Requerimiento técnico |
| --- | --- |
| RT-01 | BMatching: elegibilidad, normalización, scorer y ranking con snapshot; COffers: rondas, respuestas y elección. Interfaces Clock y acceso a candidatos permiten pruebas sin esperar plazos reales. |
| RT-02 | Tablas: rule_parameters/versions/values, matching_weights/runs/candidates, offer_rounds/offers, participations, appointments, notifications, outbox_events/deliveries e idempotency_records. |
| RT-03 | Pesos iniciales 35/20/30/15 y suma 100; distancia aproximada por distrito; tiempo estimado según evidencia o referencia de subcategoría. No introducir geolocalización real ni un microservicio Python como dependencia nueva. |
| RT-04 | Contratos: GET /offers y /requests/{id}/candidates; POST /offers/{id}/response, /requests/{id}/selection y /requests/{id}/alternative-searches. Ranking y apertura de rondas son casos de uso internos. |
| RT-05 | Jobs PrepareMatching, OpenOfferRound, ExpireOfferRound, RetryPendingMatching, ExpirePendingRequest, DeliverNotification y PublishOutboxEvent. Worker-domain, worker-delivery y scheduler del diseño; cola inicial MySQL. |
| RT-06 | Bloquear solicitud y técnicos en orden estable; comprobar versión y generación. Auditoría y outbox en transacción; publicar solo después del commit. Reintentos deben tener efecto único aunque el job se ejecute varias veces. |
| RT-07 | Reverb transporta eventos mínimos por canales privados; Echo deduplica evento/versión y consulta API al reconectar. El cronómetro usa expires_at y server_time; nunca autoriza por el reloj del navegador. |
| RT-08 | RNF-01/07/12: medir matching ≤3 s bajo protocolo; hasta 3 reintentos de entrega según fuente, distinguiendo intento inicial de reintento; cobertura ≥70% del alcance definido de matching/notificación. Probar MySQL y Reverb reales además de dobles unitarios. |

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
| T-S04-01 | HU-S04-01 | FE: estados de búsqueda; API/dominio: filtrar categoría, verificación, estado, zona, franja y pausa; datos: snapshot de exclusiones. | TC-039, TC-040 |
| T-S04-02 | HU-S04-02 | Dominio: fórmula y desempate; datos: pesos versionados/factores; pruebas: fixtures numéricos sin incertidumbre de normalización. | TC-041, TC-042 |
| T-S04-03 | HU-S04-03 | FE: rótulos de aproximación/nuevo; dominio: política de datos ausentes; datos: referencia de distrito, duración y procedencia. | TC-043, TC-044 |
| T-S04-04 | HU-S04-04 | FE: bandeja entrante; aplicación: OpenOfferRound/outbox; datos: ofertas/destinatarios únicos y plazos persistidos. | TC-045, TC-046 |
| T-S04-05 | HU-S04-05 | FE: cronómetro/aceptar/rechazar; API: respuesta con versión/reloj; datos: estado de oferta separado de participación. | TC-047, TC-048 |
| T-S04-06 | HU-S04-06 | FE: candidatos aceptados y confirmación; aplicación: AssignTechnician con bloqueo/revalidación; datos: participación/cita única y eventos. | TC-049, TC-050 |
| T-S04-07 | HU-S04-07 | Dominio: ExpireOfferRound y ruta automática/directa; datos: generación/rondas históricas; FE: alternativas requieren autorización en ruta directa. | TC-051, TC-052 |
| T-S04-08 | HU-S04-08 | FE: aviso/fecha límite; dominio: RetryPendingMatching/ExpirePendingRequest; datos: pendienteVenceEn estable y generación. | TC-053, TC-054 |
| T-S04-09 | HU-S04-09 | FE: Echo con event_id/version y recuperación API; API: canales privados; infraestructura: Reverb real y outbox. | TC-055, TC-056 |
| T-S04-10 | HU-S04-10 | Infraestructura: sender sandbox/inyección de fallos; datos: notification_attempts y claves de evento; scheduler recupera sin mover deadlines. | TC-057, TC-058 |

**T-S04-QA:** preparar fixtures y reloj; implementar los casos de este CANVAS y regresión afectada; registrar resultados y defectos. **T-S04-DOC:** actualizar contratos y trazas, presentar incremento al asesor y registrar revisión/retrospectiva.

Asignación y estimación: Developers distribuyen tareas según capacidad; el responsable del backlog aún debe identificarse (P04). El asesor revisa requerimientos y acepta el incremento según las fuentes. No se asignan nombres, horas ni story points ficticios.

## 6. Historias y criterios de aceptación

### HU-S04-01 · Elegibilidad y subcategoría

Como **cliente**, quiero **recibir candidatos habilitados para mi necesidad**, para **evitar propuestas que no puedan atenderla**.

**Fuente:** HU-06, HU-07. **Requerimientos:** RF-06, RF-07, RF-10.

- **AC-S04-01-01 / TC-039: Dado** un técnico verificado activo que ofrece la subcategoría y cubre zona/franja sin pausa, **cuando** se ejecuta el matching de esa solicitud, **entonces** el técnico queda elegible con snapshot y puede ser evaluado por el ranking.
- **AC-S04-01-02 / TC-040: Dado** un técnico suspendido con un puntaje potencial mayor al de los activos, **cuando** se filtran los candidatos, **entonces** se excluye por suspensión y nunca recibe oferta.

### HU-S04-02 · Puntuación y desempate

Como **cliente**, quiero **obtener un orden de candidatos consistente**, para **comparar las mejores alternativas según reglas conocidas**.

**Fuente:** HU-07. **Requerimientos:** RF-06, RF-08, RF-09.

- **AC-S04-02-01 / TC-041: Dado** factores normalizados 1, 0.5, 0.8 y 0.4 con pesos 35, 20, 30 y 15, **cuando** se calcula el puntaje, **entonces** el resultado es 75 sobre 100 y conserva los cuatro aportes.
- **AC-S04-02-02 / TC-042: Dado** dos candidatos elegibles con igual puntaje y promedios reales 4.8 y 4.2, **cuando** se ordena el ranking, **entonces** el candidato con promedio 4.8 precede al de 4.2.

### HU-S04-03 · Estimaciones y técnico nuevo

Como **cliente y técnico**, quiero **distinguir estimaciones de datos reales**, para **interpretar distancia y experiencia sin falsa precisión**.

**Fuente:** HU-08. **Requerimientos:** RF-11, RF-12.

- **AC-S04-03-01 / TC-043: Dado** una matriz sintética aprobada de distancias entre distritos, **cuando** se calcula y muestra una distancia de un candidato, **entonces** se rotula distancia aproximada por zona y no se presenta como geolocalización exacta.
- **AC-S04-03-02 / TC-044: Dado** un técnico elegible sin servicios ni calificaciones y la política de nuevos aprobada, **cuando** se evalúan historial y tiempo estimado, **entonces** se usa factor de historial neutro 0.5 y se muestra Nuevo y estimación general sin publicar una reseña ficticia. **Condicionado a P15.**

### HU-S04-04 · Ronda y notificaciones

Como **técnico**, quiero **recibir una oferta persistida**, para **responder una necesidad dentro del plazo**.

**Fuente:** HU-09, HU-20. **Requerimientos:** RF-13, RF-15, RF-29.

- **AC-S04-04-01 / TC-045: Dado** cinco candidatos elegibles ordenados y una solicitud automática enviada, **cuando** se abre la primera ronda, **entonces** se generan exactamente tres ofertas a los tres primeros y ningún cuarto destinatario.
- **AC-S04-04-02 / TC-046: Dado** una apertura de ronda cuya transacción falla antes del commit, **cuando** el worker de entrega busca mensajes publicables, **entonces** no publica avisos de ofertas que no quedaron confirmadas en la base.

### HU-S04-05 · Respuesta y límite del SLA

Como **técnico destinatario**, quiero **aceptar o rechazar una oferta a tiempo**, para **participar sin decisiones contradictorias**.

**Fuente:** HU-09. **Requerimientos:** RF-15, RF-16.

- **AC-S04-05-01 / TC-047: Dado** una oferta propia pendiente cuyo plazo termina dentro de un minuto, **cuando** el técnico acepta, **entonces** la oferta pasa a aceptada sin asignación ni participación automática.
- **AC-S04-05-02 / TC-048: Dado** una oferta propia pendiente y el reloj del servidor igual a expires_at, **cuando** el técnico intenta aceptar aunque el job no se ejecutó, **entonces** la API responde conflicto por vencimiento y no acepta la oferta. **Condicionado a P12.**

### HU-S04-06 · Elección y concurrencia

Como **cliente**, quiero **elegir una oferta aceptada válida**, para **confirmar un técnico disponible**.

**Fuente:** HU-10. **Requerimientos:** RF-18.

- **AC-S04-06-01 / TC-049: Dado** una oferta aceptada de mi solicitud y un técnico aún disponible, **cuando** confirmo mi elección, **entonces** se crea una participación principal y la reserva aplicable con tarifa notificada y estado Asignada.
- **AC-S04-06-02 / TC-050: Dado** dos clientes eligen simultáneamente al mismo técnico para la misma franja incompatible, **cuando** ambas transacciones intentan confirmar, **entonces** solo una reserva se confirma y la otra informa conflicto sin doble ocupación.

### HU-S04-07 · Reasignación y ruta dirigida

Como **cliente**, quiero **recibir alternativas cuando no hay respuesta**, para **continuar la búsqueda manteniendo mi decisión**.

**Fuente:** HU-09, HU-10. **Requerimientos:** RF-16, RF-17.

- **AC-S04-07-01 / TC-051: Dado** tres ofertas sin aceptación vencidas y otros tres candidatos válidos, **cuando** se ejecuta dos veces el job de expiración, **entonces** se abre una sola nueva ronda de hasta tres ofertas y se conserva el historial.
- **AC-S04-07-02 / TC-052: Dado** una solicitud desde perfil cuyo único técnico no respondió dentro del SLA, **cuando** vence su oferta, **entonces** se ofrecen alternativas al cliente y no se contacta ni asigna a otro técnico sin su autorización.

### HU-S04-08 · Pendiente durante 24 horas

Como **cliente**, quiero **conocer el resultado cuando no hay técnicos disponibles**, para **evitar una espera indefinida**.

**Fuente:** HU-11. **Requerimientos:** RF-14.

- **AC-S04-08-01 / TC-053: Dado** una solicitud sin candidatos elegibles en ninguna ronda restante, **cuando** termina la búsqueda, **entonces** queda Pendiente de disponibilidad con su fecha límite de 24 horas registrada.
- **AC-S04-08-02 / TC-054: Dado** una solicitud aún pendiente que alcanzó su límite de 24 horas, **cuando** se repite el job de expiración, **entonces** se registra una sola transición a Expirada sin renovar el límite ni abrir nuevas rondas. **Condicionado a P12.**

### HU-S04-09 · Tiempo real y recuperación

Como **usuario autorizado**, quiero **recibir cambios sin perder el estado tras desconexión**, para **seguir la solicitud de forma consistente**.

**Fuente:** HU-20. **Requerimientos:** RF-29.

- **AC-S04-09-01 / TC-055: Dado** un cliente autorizado reconecta y recibe dos copias del mismo evento confirmado, **cuando** Echo procesa ambas y consulta el estado actual, **entonces** muestra una sola notificación lógica y la versión vigente.
- **AC-S04-09-02 / TC-056: Dado** un cliente sin relación con una solicitud, **cuando** intenta suscribirse a su canal privado, **entonces** Laravel deniega la autorización y no recibe eventos privados.

### HU-S04-10 · Entrega y reintentos controlados

Como **operador del entorno de prueba**, quiero **recuperar entregas fallidas sin duplicarlas**, para **mantener trazabilidad de las ofertas**.

**Fuente:** HU-09, HU-20. **Requerimientos:** RF-15, RF-29; RNF-07.

- **AC-S04-10-01 / TC-057: Dado** una notificación sandbox cuya entrega falla siempre, **cuando** se ejecuta el intento inicial y hasta tres reintentos configurados, **entonces** se registra fallo definitivo sin un cuarto reintento y sin extender el SLA de la oferta.
- **AC-S04-10-02 / TC-058: Dado** una solicitud cuya generación cambió tras una operación confirmada, **cuando** se ejecuta un job de ronda con generación anterior, **entonces** no altera la generación vigente ni crea ofertas obsoletas.

## 7. Escenarios BDD a automatizar

Archivo editable: [sprint-04.feature](bdd/sprint-04.feature). Cada escenario corresponde a un caso del catálogo y conserva su identificador.

Pest cubrirá dominio/API/integridad; Cypress, recorridos de navegador. Gherkin describe el acuerdo de comportamiento: no se ejecuta por sí solo y esta entrega no instala un adaptador Cucumber. Implementar las pruebas correspondientes con los mismos TC. Los escenarios `@manual` exigen participantes; su registro puede automatizarse, pero no sustituir sus respuestas por datos inventados.

Control del tiempo: reloj inyectado en backend y jobs ejecutados explícitamente en pruebas; el reloj de Cypress no cambia el de PHP/MySQL. Datos y utilidades de test solo en entornos aislados. Probar Reverb real cuando se exige tiempo real; mocks no acreditan esa integración.

```gherkin
# language: es
@sprint_04 @planificado
Característica: Sprint 4 - Matching, notificación, SLA y reasignación
  Especificación BDD prevista; requiere implementación de pruebas y datos controlados.

  @TC_039 @HU_S04_01 @automatizar
  Escenario: TC-039 - Elegible en su servicio
    Dado un técnico verificado activo que ofrece la subcategoría y cubre zona/franja sin pausa
    Cuando se ejecuta el matching de esa solicitud
    Entonces el técnico queda elegible con snapshot y puede ser evaluado por el ranking

  @TC_040 @HU_S04_01 @automatizar
  Escenario: TC-040 - Mejor puntaje pero suspendido
    Dado un técnico suspendido con un puntaje potencial mayor al de los activos
    Cuando se filtran los candidatos
    Entonces se excluye por suspensión y nunca recibe oferta

  @TC_041 @HU_S04_02 @automatizar
  Escenario: TC-041 - Puntuación ponderada
    Dado factores normalizados 1, 0.5, 0.8 y 0.4 con pesos 35, 20, 30 y 15
    Cuando se calcula el puntaje
    Entonces el resultado es 75 sobre 100 y conserva los cuatro aportes

  @TC_042 @HU_S04_02 @automatizar
  Escenario: TC-042 - Desempate por calificación
    Dado dos candidatos elegibles con igual puntaje y promedios reales 4.8 y 4.2
    Cuando se ordena el ranking
    Entonces el candidato con promedio 4.8 precede al de 4.2

  @TC_043 @HU_S04_03 @automatizar
  Escenario: TC-043 - Distancia aproximada por zona
    Dado una matriz sintética aprobada de distancias entre distritos
    Cuando se calcula y muestra una distancia de un candidato
    Entonces se rotula distancia aproximada por zona y no se presenta como geolocalización exacta

  @TC_044 @HU_S04_03 @automatizar @pendiente_P15
  Escenario: TC-044 - Perfil sin historial
    Dado un técnico elegible sin servicios ni calificaciones y la política de nuevos aprobada
    Cuando se evalúan historial y tiempo estimado
    Entonces se usa factor de historial neutro 0.5 y se muestra Nuevo y estimación general sin publicar una reseña ficticia

  @TC_045 @HU_S04_04 @automatizar
  Escenario: TC-045 - Tres ofertas como máximo
    Dado cinco candidatos elegibles ordenados y una solicitud automática enviada
    Cuando se abre la primera ronda
    Entonces se generan exactamente tres ofertas a los tres primeros y ningún cuarto destinatario

  @TC_046 @HU_S04_04 @automatizar
  Escenario: TC-046 - Rollback no notifica éxito
    Dado una apertura de ronda cuya transacción falla antes del commit
    Cuando el worker de entrega busca mensajes publicables
    Entonces no publica avisos de ofertas que no quedaron confirmadas en la base

  @TC_047 @HU_S04_05 @automatizar
  Escenario: TC-047 - Aceptación dentro de plazo
    Dado una oferta propia pendiente cuyo plazo termina dentro de un minuto
    Cuando el técnico acepta
    Entonces la oferta pasa a aceptada sin asignación ni participación automática

  @TC_048 @HU_S04_05 @automatizar @pendiente_P12
  Escenario: TC-048 - Aceptación en el límite exacto
    Dado una oferta propia pendiente y el reloj del servidor igual a expires_at
    Cuando el técnico intenta aceptar aunque el job no se ejecutó
    Entonces la API responde conflicto por vencimiento y no acepta la oferta

  @TC_049 @HU_S04_06 @automatizar
  Escenario: TC-049 - Elección válida
    Dado una oferta aceptada de mi solicitud y un técnico aún disponible
    Cuando confirmo mi elección
    Entonces se crea una participación principal y la reserva aplicable con tarifa notificada y estado Asignada

  @TC_050 @HU_S04_06 @automatizar
  Escenario: TC-050 - Dos reservas incompatibles
    Dado dos clientes eligen simultáneamente al mismo técnico para la misma franja incompatible
    Cuando ambas transacciones intentan confirmar
    Entonces solo una reserva se confirma y la otra informa conflicto sin doble ocupación

  @TC_051 @HU_S04_07 @automatizar
  Escenario: TC-051 - Siguiente ronda única
    Dado tres ofertas sin aceptación vencidas y otros tres candidatos válidos
    Cuando se ejecuta dos veces el job de expiración
    Entonces se abre una sola nueva ronda de hasta tres ofertas y se conserva el historial

  @TC_052 @HU_S04_07 @automatizar
  Escenario: TC-052 - Fallo de solicitud directa
    Dado una solicitud desde perfil cuyo único técnico no respondió dentro del SLA
    Cuando vence su oferta
    Entonces se ofrecen alternativas al cliente y no se contacta ni asigna a otro técnico sin su autorización

  @TC_053 @HU_S04_08 @automatizar
  Escenario: TC-053 - Agotamiento de candidatos
    Dado una solicitud sin candidatos elegibles en ninguna ronda restante
    Cuando termina la búsqueda
    Entonces queda Pendiente de disponibilidad con su fecha límite de 24 horas registrada

  @TC_054 @HU_S04_08 @automatizar @pendiente_P12
  Escenario: TC-054 - Expiración idempotente
    Dado una solicitud aún pendiente que alcanzó su límite de 24 horas
    Cuando se repite el job de expiración
    Entonces se registra una sola transición a Expirada sin renovar el límite ni abrir nuevas rondas

  @TC_055 @HU_S04_09 @automatizar
  Escenario: TC-055 - Evento repetido tras reconexión
    Dado un cliente autorizado reconecta y recibe dos copias del mismo evento confirmado
    Cuando Echo procesa ambas y consulta el estado actual
    Entonces muestra una sola notificación lógica y la versión vigente

  @TC_056 @HU_S04_09 @automatizar
  Escenario: TC-056 - Canal ajeno denegado
    Dado un cliente sin relación con una solicitud
    Cuando intenta suscribirse a su canal privado
    Entonces Laravel deniega la autorización y no recibe eventos privados

  @TC_057 @HU_S04_10 @automatizar
  Escenario: TC-057 - Límite de reintentos
    Dado una notificación sandbox cuya entrega falla siempre
    Cuando se ejecuta el intento inicial y hasta tres reintentos configurados
    Entonces se registra fallo definitivo sin un cuarto reintento y sin extender el SLA de la oferta

  @TC_058 @HU_S04_10 @automatizar
  Escenario: TC-058 - Job antiguo
    Dado una solicitud cuya generación cambió tras una operación confirmada
    Cuando se ejecuta un job de ronda con generación anterior
    Entonces no altera la generación vigente ni crea ofertas obsoletas
```

## 8. Casos de prueba previstos (20)

Los casos siguientes son especificaciones. Ejecutarlos y registrar observaciones reales es parte del desarrollo posterior. Un TC puede tener varias variantes de datos, pero se cuenta una sola vez para la exigencia académica.

### TC-039 · Elegible en su servicio

**Traza:** RF-06, RF-07, RF-10 → HU-06, HU-07 → HU-S04-01 → AC-S04-01-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico verificado activo que ofrece la subcategoría y cubre zona/franja sin pausa.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta el matching de esa solicitud; consultar estado persistido y efectos observables.
- **Resultado esperado:** el técnico queda elegible con snapshot y puede ser evaluado por el ranking.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC039.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-039/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-040 · Mejor puntaje pero suspendido

**Traza:** RF-06, RF-07, RF-10 → HU-06, HU-07 → HU-S04-01 → AC-S04-01-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico suspendido con un puntaje potencial mayor al de los activos.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se filtran los candidatos; consultar estado persistido y efectos observables.
- **Resultado esperado:** se excluye por suspensión y nunca recibe oferta.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC040.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-040/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-041 · Puntuación ponderada

**Traza:** RF-06, RF-08, RF-09 → HU-07 → HU-S04-02 → AC-S04-02-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** factores normalizados 1, 0.5, 0.8 y 0.4 con pesos 35, 20, 30 y 15.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se calcula el puntaje; consultar estado persistido y efectos observables.
- **Resultado esperado:** el resultado es 75 sobre 100 y conserva los cuatro aportes.
- **Nivel/herramienta:** Unidad / Pest.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Unit/Sprint04/TC041.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-041/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-042 · Desempate por calificación

**Traza:** RF-06, RF-08, RF-09 → HU-07 → HU-S04-02 → AC-S04-02-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** dos candidatos elegibles con igual puntaje y promedios reales 4.8 y 4.2.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ordena el ranking; consultar estado persistido y efectos observables.
- **Resultado esperado:** el candidato con promedio 4.8 precede al de 4.2.
- **Nivel/herramienta:** Unidad / Pest.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Unit/Sprint04/TC042.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-042/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-043 · Distancia aproximada por zona

**Traza:** RF-11, RF-12 → HU-08 → HU-S04-03 → AC-S04-03-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una matriz sintética aprobada de distancias entre distritos.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se calcula y muestra una distancia de un candidato; consultar estado persistido y efectos observables.
- **Resultado esperado:** se rotula distancia aproximada por zona y no se presenta como geolocalización exacta.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC043.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-043/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-044 · Perfil sin historial

**Traza:** RF-11, RF-12 → HU-08 → HU-S04-03 → AC-S04-03-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un técnico elegible sin servicios ni calificaciones y la política de nuevos aprobada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se evalúan historial y tiempo estimado; consultar estado persistido y efectos observables.
- **Resultado esperado:** se usa factor de historial neutro 0.5 y se muestra Nuevo y estimación general sin publicar una reseña ficticia.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC044.php (destino propuesto)`.
- **Dependencia de decisión:** P15.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-044/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-045 · Tres ofertas como máximo

**Traza:** RF-13, RF-15, RF-29 → HU-09, HU-20 → HU-S04-04 → AC-S04-04-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** cinco candidatos elegibles ordenados y una solicitud automática enviada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se abre la primera ronda; consultar estado persistido y efectos observables.
- **Resultado esperado:** se generan exactamente tres ofertas a los tres primeros y ningún cuarto destinatario.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC045.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-045/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-046 · Rollback no notifica éxito

**Traza:** RF-13, RF-15, RF-29 → HU-09, HU-20 → HU-S04-04 → AC-S04-04-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una apertura de ronda cuya transacción falla antes del commit.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el worker de entrega busca mensajes publicables; consultar estado persistido y efectos observables.
- **Resultado esperado:** no publica avisos de ofertas que no quedaron confirmadas en la base.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC046.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-046/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-047 · Aceptación dentro de plazo

**Traza:** RF-15, RF-16 → HU-09 → HU-S04-05 → AC-S04-05-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una oferta propia pendiente cuyo plazo termina dentro de un minuto.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el técnico acepta; consultar estado persistido y efectos observables.
- **Resultado esperado:** la oferta pasa a aceptada sin asignación ni participación automática.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC047.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-047/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-048 · Aceptación en el límite exacto

**Traza:** RF-15, RF-16 → HU-09 → HU-S04-05 → AC-S04-05-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una oferta propia pendiente y el reloj del servidor igual a expires_at.
- **Pasos previstos:** preparar la precondición en el entorno aislado; el técnico intenta aceptar aunque el job no se ejecutó; consultar estado persistido y efectos observables.
- **Resultado esperado:** la API responde conflicto por vencimiento y no acepta la oferta.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC048.php (destino propuesto)`.
- **Dependencia de decisión:** P12.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-048/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-049 · Elección válida

**Traza:** RF-18 → HU-10 → HU-S04-06 → AC-S04-06-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una oferta aceptada de mi solicitud y un técnico aún disponible.
- **Pasos previstos:** preparar la precondición en el entorno aislado; confirmo mi elección; consultar estado persistido y efectos observables.
- **Resultado esperado:** se crea una participación principal y la reserva aplicable con tarifa notificada y estado Asignada.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC049.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-049/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-050 · Dos reservas incompatibles

**Traza:** RF-18 → HU-10 → HU-S04-06 → AC-S04-06-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** dos clientes eligen simultáneamente al mismo técnico para la misma franja incompatible.
- **Pasos previstos:** preparar la precondición en el entorno aislado; ambas transacciones intentan confirmar; consultar estado persistido y efectos observables.
- **Resultado esperado:** solo una reserva se confirma y la otra informa conflicto sin doble ocupación.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC050.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-050/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-051 · Siguiente ronda única

**Traza:** RF-16, RF-17 → HU-09, HU-10 → HU-S04-07 → AC-S04-07-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** tres ofertas sin aceptación vencidas y otros tres candidatos válidos.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta dos veces el job de expiración; consultar estado persistido y efectos observables.
- **Resultado esperado:** se abre una sola nueva ronda de hasta tres ofertas y se conserva el historial.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC051.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-051/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-052 · Fallo de solicitud directa

**Traza:** RF-16, RF-17 → HU-09, HU-10 → HU-S04-07 → AC-S04-07-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud desde perfil cuyo único técnico no respondió dentro del SLA.
- **Pasos previstos:** preparar la precondición en el entorno aislado; vence su oferta; consultar estado persistido y efectos observables.
- **Resultado esperado:** se ofrecen alternativas al cliente y no se contacta ni asigna a otro técnico sin su autorización.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC052.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-052/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-053 · Agotamiento de candidatos

**Traza:** RF-14 → HU-11 → HU-S04-08 → AC-S04-08-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud sin candidatos elegibles en ninguna ronda restante.
- **Pasos previstos:** preparar la precondición en el entorno aislado; termina la búsqueda; consultar estado persistido y efectos observables.
- **Resultado esperado:** queda Pendiente de disponibilidad con su fecha límite de 24 horas registrada.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC053.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-053/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-054 · Expiración idempotente

**Traza:** RF-14 → HU-11 → HU-S04-08 → AC-S04-08-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud aún pendiente que alcanzó su límite de 24 horas.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se repite el job de expiración; consultar estado persistido y efectos observables.
- **Resultado esperado:** se registra una sola transición a Expirada sin renovar el límite ni abrir nuevas rondas.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC054.php (destino propuesto)`.
- **Dependencia de decisión:** P12.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-054/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — diseño condicionado. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-055 · Evento repetido tras reconexión

**Traza:** RF-29 → HU-20 → HU-S04-09 → AC-S04-09-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente autorizado reconecta y recibe dos copias del mismo evento confirmado.
- **Pasos previstos:** preparar la precondición en el entorno aislado; Echo procesa ambas y consulta el estado actual; consultar estado persistido y efectos observables.
- **Resultado esperado:** muestra una sola notificación lógica y la versión vigente.
- **Nivel/herramienta:** Integración / Cypress + Reverb real.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `frontend/web/cypress/e2e/sprint-04/tc-055.cy.js (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-055/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-056 · Canal ajeno denegado

**Traza:** RF-29 → HU-20 → HU-S04-09 → AC-S04-09-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** un cliente sin relación con una solicitud.
- **Pasos previstos:** preparar la precondición en el entorno aislado; intenta suscribirse a su canal privado; consultar estado persistido y efectos observables.
- **Resultado esperado:** Laravel deniega la autorización y no recibe eventos privados.
- **Nivel/herramienta:** Integración / Pest + Reverb real.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC056.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-056/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-057 · Límite de reintentos

**Traza:** RF-15, RF-29; RNF-07 → HU-09, HU-20 → HU-S04-10 → AC-S04-10-01. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una notificación sandbox cuya entrega falla siempre.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta el intento inicial y hasta tres reintentos configurados; consultar estado persistido y efectos observables.
- **Resultado esperado:** se registra fallo definitivo sin un cuarto reintento y sin extender el SLA de la oferta.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC057.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-057/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

### TC-058 · Job antiguo

**Traza:** RF-15, RF-29; RNF-07 → HU-09, HU-20 → HU-S04-10 → AC-S04-10-02. **Prioridad:** alta por pertenecer al incremento comprometido.

- **Precondición y datos:** una solicitud cuya generación cambió tras una operación confirmada.
- **Pasos previstos:** preparar la precondición en el entorno aislado; se ejecuta un job de ronda con generación anterior; consultar estado persistido y efectos observables.
- **Resultado esperado:** no altera la generación vigente ni crea ofertas obsoletas.
- **Nivel/herramienta:** API / Pest + MySQL.
- **Automatización:** Automatización prevista; todavía sin implementación. Destino: `backend/api/tests/Feature/Sprint04/TC058.php (destino propuesto)`.
- **Dependencia de decisión:** Ninguna adicional a las condiciones generales de entrada del sprint.
- **Evidencia prevista:** `docs/documentacion/evidencias/sprint-04/TC-058/` con resultado, salida del runner o protocolo, commit, dataset y defecto si existe.
- **Estado actual:** NO EJECUTADO — previsto. Resultado real, responsable de ejecución y fecha: pendientes.

## 9. Controles DevSecOps de la iteración

| Control | Aplicación y evidencia requerida |
| --- | --- |
| SEC-S04-01 | No aceptar pesos, estados, score, identidad del destinatario ni deadlines confiando en React. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S04-02 | Canales privados autorizados por identidad y relación; minimizar payload y revalidar al consultar. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S04-03 | Un técnico solo responde su propia oferta; un cliente solo elige dentro de su propia solicitud. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S04-04 | Caducidad verificada al recibir el comando aun con worker atrasado; generación evita jobs obsoletos. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S04-05 | No transmitir dirección exacta antes de asignación. Notificaciones externas solo en sandbox; reintentos acotados y errores sin secretos. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |
| SEC-S04-06 | Separar trabajadores de entrega para que un transporte caído no bloqueé vencimientos; registrar fallos recuperables. Evidencia: revisión o prueba asociada, commit y resultado; nunca una marca de aprobado anticipada. |

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

- [ ] Ranking reproducible y explicación interna conservan reglas/datos; técnicos no elegibles nunca reciben oferta.
- [ ] Máximo tres ofertas automáticas simultáneas; la ruta dirigida contacta solo al elegido antes de alternativas autorizadas.
- [ ] Aceptación no asigna; elección del titular revalida disponibilidad y evita doble reserva.
- [ ] Plazos 10 min/24 h y reintentos se verifican con reloj de pruebas y condiciones ratificadas.
- [ ] Echo/Reverb real muestran cambios tras commit; reconexión recupera estado y no duplica avisos.
- [ ] Jobs repetidos/atrasados y rollback no crean rondas, asignaciones ni eventos de éxito extra.

Estas casillas expresan condiciones de aceptación y quedan sin marcar. Si una historia no las cumple, se reporta incompleta y se informa al usuario antes de cambiar alcance u orden. No dividir, mover ni agregar sprints por cuenta propia.

## 11. Entregables y evidencia de revisión

- Incremento del Sprint 4 implementado y demostrable cuando se desarrolle; este documento solo lo planifica.
- Contratos/migraciones/catálogos afectados versionados; matriz RF → HU → AC → TC actualizada.
- Reportes de ejecución, defectos y revisión de seguridad con resultados reales.
- Acta prevista en `docs/documentacion/evidencias/sprint-04/revision.md`: commit, historias aceptadas/no aceptadas, observaciones del asesor, decisiones y riesgos restantes.
- Las decisiones Pxx se registran con aprobador, fecha, regla acordada y casos afectados; no reescribir las fuentes sin control de cambios.

## 12. Marcos de trabajo y fuentes

Scrum organiza el incremento y su revisión; BDD expresa comportamiento compartido; SOLID orienta responsabilidades. Como referencias del proyecto: ISO 9001 para control de proceso/documentación, ISO/IEC 25010 para atributos de calidad, ISO/IEC 27001 y 27701 para seguridad y privacidad, ISO/IEC/IEEE 29119-2/3/4 para planificación, especificación y evidencia de pruebas. Se documenta su aplicación prevista, sin afirmar cumplimiento normativo, interpretar cláusulas ni certificar el sistema.

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.
