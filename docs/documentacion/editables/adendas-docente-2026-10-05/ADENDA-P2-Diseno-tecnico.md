# CANVAS DE ADENDA · P2 · Diseño técnico

**Fecha:** 5 de octubre de 2026. **Documento afectado:** [CANVAS de diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md). **Naturaleza:** cambios documentales; no acredita implementación ni modifica las reglas del producto.

## Qué se agrega

### 1.3 Derivación del diseño desde el estado del arte

Incorporar después del registro DT-01–DT-09. Las páginas indicadas son las del archivo PDF, contando su primera página como 1. Un antecedente muestra una solución comparable; no demuestra que sea la mejor tecnología ni que TécnicoYa alcance sus resultados.

| Evidencia revisada | Necesidad de TécnicoYa | Decisión que se deriva y límite |
|---|---|---|
| Rathod et al. (2025), *Cappie*, pp. 1–2: cliente-servidor, roles, reservas y retroalimentación. | Separar presentación, procesamiento y datos; atender a los tres actores. | Mantener frontend, API y persistencia diferenciados. Los módulos A–F y sus límites concretos proceden de la Fuente 0: **decisión del equipo**. No adoptar Flutter/Firebase para el MVP. |
| Anasune et al. (2026), *Reparo*, p. 3: presentación, lógica de negocio y persistencia; módulos de autenticación, reservas y notificaciones. | RNF-11 y evolución por funcionalidades sin mezclar permisos y negocio. | Arquitectura por capas y módulos. Su stack Next.js/NestJS/Supabase no se copia; la elección del monolito Laravel es **decisión del equipo**. |
| Aji et al. (2022), *Quick Reacher*, pp. 2–3 y 6: búsqueda por ubicación/reputación, administración y MySQL. | RF-06..10, catálogo y persistencia de usuarios/servicios. | Separar catálogo, elegibilidad, ranking y reputación. No incorporar tienda/inventario. No sustenta los pesos 35/20/30/15. |
| Bejarano Gavilanes (2022), tesis, portada, pp. 56 y 64–68: Laravel/MySQL, modelo relacional y cliente-servidor. | Antecedente de implementación de servicios técnicos. | Referencia complementaria para Laravel/MySQL. Es una **tesis**, no un artículo científico; no demuestra superioridad del stack. |
| Gothankar et al. (2024), *HomeServe*, pp. 1 y 3–4: matching, disponibilidad y propuesta de microservicios/contenedores. | Asignar candidatos y desplegar de forma reproducible. | Mantener matching y ejecución delimitados. No adoptar microservicios en el MVP: **decisión del equipo**, por su alcance y capacidad de operación. Docker Compose concreto tampoco está justificado por este artículo. |

### Ampliación del registro de decisiones de arquitectura

Añadir las columnas «Sustento autor/año», «Qué respalda» y «Parte decidida por el equipo» a §1.1, con estas entradas. Se conservan los identificadores DT existentes.

| ID / decisión vigente | Sustento autor/año y localizador | Qué respalda | Parte decidida por el equipo |
|---|---|---|---|
| DT-01 · Monolito modular Laravel, REST y MySQL | Anasune et al. (2026), p. 3; Aji et al. (2022), p. 6; antecedente complementario Bejarano Gavilanes (2022), pp. 64–68 | Capas/módulos y uso de persistencia relacional; antecedente Laravel/MySQL. | **Decisión del equipo:** monolito, API REST concreta, una base y reparto A–F. |
| DT-02 · React presenta; Laravel decide | Anasune et al. (2026), p. 3 | Separación presentación/lógica/persistencia. | **Decisión del equipo:** React, autoridad exclusiva de Laravel sobre permisos, estados y relojes; contratos específicos. |
| DT-03 · Sanctum, cookie y mismo origen | Sin respaldo específico localizado en los artículos | No atribuir este mecanismo a los trabajos sobre JWT/Firebase. | **Decisión del equipo**, según el diseño de sesión del MVP. |
| DT-04 · Colas/sesiones MySQL y una instancia Reverb | Anasune et al. (2026), pp. 4–5, solo como antecedente de comunicación en tiempo real | Necesidad de avisos y seguimiento. | **Decisión del equipo:** drivers de cola/sesión, Reverb/Echo y número de instancias. |
| DT-05 · UTC en servidor y presentación America/Lima | Sin respaldo específico localizado | — | **Decisión del equipo:** criterio técnico de consistencia temporal. |
| DT-06 · Transacciones, bloqueos, versiones e idempotencia | Anasune et al. (2026), p. 3, menciona creación atómica de reservas | Justifica conceptualmente proteger la reserva como operación indivisible. | **Decisión del equipo:** bloqueos, orden de adquisición, claves de idempotencia y control de versiones. |
| DT-07 · Outbox y publicación posterior al commit | Sin respaldo específico localizado | — | **Decisión del equipo:** fiabilidad de eventos y recuperación. |
| DT-08 · Autorización de API/canales y datos mínimos | Anasune et al. (2026), pp. 4–5, RBAC y seguridad por fila | Necesidad de control de acceso. | **Decisión del equipo:** Policies de Laravel, canales privados de Reverb, minimización y permisos por recurso; no se importa RLS de Supabase. |
| DT-09 · Reglas versionadas y configuración preservada | Sin respaldo específico localizado | — | **Decisión del equipo:** explicabilidad, reproducción y auditoría de cambios. |

También registrar las decisiones de §2–§16 que no tienen un ID DT separado:

| Decisión adicional | Sustento y delimitación |
|---|---|
| A–F, servicios de aplicación, dominio e infraestructura; SOLID e interfaces selectivas | Anasune et al. (2026), p. 3, respalda modularidad y capas. La descomposición exacta, SOLID y los contratos son **decisión del equipo** y requisitos del proyecto. |
| Elegibilidad, ranking, tarifa y reputación | Aji et al. (2022), pp. 2–3, y Gothankar et al. (2024), p. 1, aportan antecedentes funcionales. Fórmula, pesos, normalización, SLA y ventanas son **decisión del equipo conforme a reglas aprobadas**, no resultados científicos de esos artículos. |
| Esquema, claves, índices, precisión decimal, estados, almacenamiento privado, contratos HTTP, auditoría y retención | **Decisión del equipo**, derivada del diccionario, reglas y requisitos de seguridad. No se encontró sustento específico para esas implementaciones. |
| Scheduler/jobs para 10 min, 24 h y 48 h; recuperación por API al reconectar | **Decisión del equipo**; los artículos sobre seguimiento no prescriben estos plazos ni estos mecanismos. |
| Docker/Compose, proxy, entornos, respaldo y recuperación | Gothankar et al. (2024), p. 3, menciona contenedores en una propuesta distinta. Herramientas y topología concretas: **decisión del equipo**. |
| BDD, Pest, Cypress, SonarQube, Quality Gate y política de CI | **Decisión del equipo** y requisitos docentes. Peng et al. (2023), p. 4, aporta un antecedente de comprobación mediante pruebas automatizadas, no prescribe estas herramientas. |
| Límites y mecanismos DevSecOps, cifrado de transporte y protección de secretos | **Decisión del equipo** y requisitos de seguridad del proyecto; citar un artículo con RBAC no prueba cumplimiento de ISO. |

**Control para futuras decisiones:** registrar problema/RF-RNF → evidencia y página → alternativas → decisión y responsable → límite de la inferencia → prueba prevista. Si no existe antecedente específico, escribir «decisión del equipo». No usar la documentación de un fabricante como si fuera un artículo del estado del arte.

### Arquitectura tecnológica a futuro

Añadir después del alcance del MVP. Son candidatas para versiones posteriores, sin sprint, presupuesto, proveedor ni versión aprobados. Las herramientas siguientes no se incorporan al entorno actual mediante esta adenda.

| Capacidad futura | Herramienta candidata | Componente de entrada y colaboración | Sustento / decisión | Condición antes de incorporarla |
|---|---|---|---|---|
| Geolocalización real | Adaptador de geocodificación/mapas; Google Maps API como alternativa citada | Infraestructura de BMatching; ARequests captura ubicación autorizada; FAdministration gobierna acceso/configuración. | Anasune et al. (2026), p. 3, cita Google Maps; Rathod et al. (2025), p. 1, describe GPS. Proveedor y precisión: **decisión del equipo**. | Consentimiento, minimización, costo, cobertura y validación de la nueva medida de cercanía. No activar seguimiento permanente por defecto. |
| Pasarela de pagos | Adaptador de proveedor; Stripe/Razorpay solo como ejemplos del antecedente | Área de pagos de FAdministration, colaborando con DService y procesos de conciliación separados de la atención. | Anasune et al. (2026), pp. 3–4. **Decisión del equipo:** proveedor que resulte compatible con el contexto peruano; no se ha verificado elegibilidad comercial. | Aprobar nuevo alcance financiero, moneda, devoluciones, conciliación, seguridad de webhooks e idempotencia. El MVP sigue simulado. |
| Aplicación móvil | Flutter como candidata, sin selección definitiva | Nueva presentación móvil que consume la API existente y sus permisos; no duplicar reglas del matching en el dispositivo. | Rathod et al. (2025), pp. 1–2, usa Flutter. **Decisión del equipo:** evaluar adopción y estrategia de autenticación móvil. | Pruebas en dispositivos, mantenimiento y revisión del flujo de sesión; la cookie SPA no se traslada automáticamente a una app nativa. |
| Chat entre participantes | Extensión de Laravel Reverb/Echo con almacenamiento de conversaciones | Capacidad de comunicación vinculada a DService y `Shared/Messaging`; FAdministration aplica permisos y soporte. | Anasune et al. (2026), p. 4, describe chat por WebSocket. **Decisión del equipo:** Reverb/Echo y modelo de conversaciones. | Aprobar participantes, retención, moderación y acceso. No confundir eventos de estado con mensajes ni añadir LLM. |
| Monitoreo operativo ampliado | Candidatas: OpenTelemetry, Prometheus y Grafana | Infraestructura transversal: API, workers, scheduler, Reverb y MySQL; panel operativo restringido, independiente del dashboard de negocio F. | **Decisión del equipo:** no se localizó respaldo específico para estas herramientas en los artículos revisados. | Evaluar compatibilidad, costos, retención y redacción de datos. Logs, salud y detección de jobs fallidos permanecen necesarios en el MVP. |

## Qué se modifica

- §1: el razonamiento parte de necesidades y antecedentes antes de justificar la selección tecnológica. Las fuentes del producto siguen gobernando reglas y alcance.
- §1.1: completar el registro DT con las columnas de evidencia anteriores; no cambiar su implementación propuesta por una atribución bibliográfica genérica.
- §14.3 y §16.3: SonarQube con Quality Gate aprobado **en cada sprint**, además de cada PR según P11-B. Sprint 8 conserva regresión y evaluación final acumulada.
- §14: incorporar la comprobación automatizada de mensajes CRUD y validación en ambos extremos, mediante la adenda P11-B.

## Qué se elimina

- De la justificación académica, cualquier equivalencia entre «tecnología citada» y «tecnología demostrada como óptima» o entre resultados ajenos y resultados de TécnicoYa.
- Cualquier interpretación de que geolocalización real, chat, app nativa, cobros reales o monitoreo ampliado son entregables de los ocho sprints.
- Ninguna decisión DT ni capacidad del MVP se elimina. Los archivos originales permanecen íntegros.

## Referencias de la adenda

- Aji, A. K., et al. (2022). *Quick Reacher: An Application for Home Services*. [A23](../../fuentes/articulos/A23.pdf), pp. 2–3, 6.
- Anasune, G., Shaikh, M., Sharma, A., y Singh, N. (2026). *Reparo: A Hyper-Local, On-Demand Home Service Platform*. [A29](../../fuentes/articulos/A29.pdf), pp. 3–5.
- Bejarano Gavilanes, X. P. (2022). *Implementación de una aplicación web para la gestión de servicios técnicos a domicilio y control de inventario…* [Tesis, A30](../../fuentes/articulos/A30.pdf), pp. 56, 64–68.
- Gothankar, A., et al. (2024). *HomeServe: The On-Demand Home Services Platform*. [A25](../../fuentes/articulos/A25.pdf), pp. 1, 3–4.
- Peng, S., Kalliamvakou, E., Cihon, P., y Demirer, M. (2023). *The Impact of AI on Developer Productivity: Evidence from GitHub Copilot*. [A21](../../fuentes/articulos/A21.pdf), pp. 4, 7–8.
- Rathod, M. N., et al. (2025). *Android Application for Home Services: Cappie*. [A27](../../fuentes/articulos/A27.pdf), pp. 1–2.
