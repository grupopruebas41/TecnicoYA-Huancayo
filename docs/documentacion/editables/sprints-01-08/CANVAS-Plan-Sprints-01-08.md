# CANVAS maestro · Plan de Sprints 1 al 8

**TécnicoYa Huancayo · 5 de octubre de 2026 · Versión 1.0 · Planificación, no ejecución.**

Ocho CANVAS independientes, siguiendo el orden y alcance aprobados por el usuario. La Iteración 0 se mantiene como instalación/estructura previa. No se fijan fechas, duración ni puntos sin estimación del equipo.

## Documentos por sprint

| Sprint | CANVAS | Alcance principal | Casos |
| --- | --- | --- | --- |
| 1 | [Abrir Sprint 1](CANVAS-Sprint-01.md) | Base técnica, autenticación, roles y catálogo | 12 |
| 2 | [Abrir Sprint 2](CANVAS-Sprint-02.md) | Landing, administración de catálogo y perfil del técnico | 14 |
| 3 | [Abrir Sprint 3](CANVAS-Sprint-03.md) | Solicitud y búsqueda de técnicos | 12 |
| 4 | [Abrir Sprint 4](CANVAS-Sprint-04.md) | Matching, notificación, SLA y reasignación | 20 |
| 5 | [Abrir Sprint 5](CANVAS-Sprint-05.md) | Atención, agenda y seguimiento | 14 |
| 6 | [Abrir Sprint 6](CANVAS-Sprint-06.md) | Calificación, historial y apelaciones | 14 |
| 7 | [Abrir Sprint 7](CANVAS-Sprint-07.md) | Panel administrador completo | 14 |
| 8 | [Abrir Sprint 8](CANVAS-Sprint-08.md) | Pagos, notificaciones, endurecimiento y despliegue | 18 |

## Qué contiene cada CANVAS

Objetivo; alcance aprobado; dependencias y pendientes; RF/RNF y requerimientos técnicos; tareas por capa y rutas; historias derivadas de las fuentes; criterios Dado/Cuando/Entonces; Gherkin; casos TC con precondiciones, pasos y resultados esperados; controles DevSecOps; DoD común/específica; entregables y evidencia futura.

**Catálogo nuevo de esta planificación:** 118 casos únicos, TC-001 a TC-118; 59 historias derivadas; ocho archivos Gherkin. Todos están NO EJECUTADOS. Los identificadores pertenecen a esta versión del catálogo; no renumeran ensayos de documentos históricos.

- [Catálogo de casos previstos](Catalogo-TC-Sprints-01-08.csv).
- [Matriz RF/RNF → HU fuente → HU sprint → AC → TC](Trazabilidad-Sprints-01-08.csv).
- [Datos editables estructurados](Plan-Sprints-01-08.json).
- [Escenarios Gherkin](bdd/).

Pest/Cypress todavía deben implementarse. No se ejecutan pruebas de la aplicación ni se acreditan resultados en este trabajo. Los estudios de usabilidad y beneficio tienen escenarios marcados manuales; requieren personas y datos observados. La exigencia final de más de 60 casos ejecutados no se satisface por tenerlos escritos.

## Jerarquía de fuentes y límites

Fuentes: Fuente 0 y respuestas del usuario; [CANVAS de análisis](../CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](../CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario MySQL](../CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [clases del dominio](../CANVAS-Clases-Dominio-TecnicoYa.md) y plan de ocho sprints aprobado en el chat. El backlog técnico v2 de 29/09/2026 se consultó mediante su fuente editable `../v2/contenido.json` (documento 03): sus diez iteraciones, PostgreSQL/Python, tokens históricos y ampliaciones de chat/LLM no prevalecen sobre las decisiones actuales. Las HU de este documento derivan de las HU del análisis vigente, no de la numeración incompatible del backlog histórico.

Últimas decisiones conservadas: React–Laravel–MySQL, sesión SPA propuesta, Reverb/Echo, Docker Compose, Pest/Cypress y SonarQube; ocho sprints exactos; pagos y comprobantes simulados. No se incluyen suscripciones comerciales, chat/LLM, geolocalización real, apps móviles ni procesamiento financiero.

El Sprint 8 incorpora explícitamente historial y ganancias simuladas por la instrucción reciente. P02 sigue abierto solo en detalles de procedencia, fórmula, estados y constancia; no se interpreta como aprobación de cobros reales ni del antiguo flujo de confirmación financiera.

## Dependencias que se deben gestionar

| Origen → destino | Dependencia y tratamiento dentro del plan |
| --- | --- |
| Iteración 0 → S1 | Instalación/estructura listas; S1 conecta y valida los módulos reales sin destruir la implementación histórica. |
| S1 → S2/S7 | Administrador inicial restringido, RBAC y registro básico de auditoría; gestión completa de cuentas y consulta de auditoría en S7. |
| S2 → S3/S4 | Catálogo, habilitación, subcategorías, tarifas, zona y pausas; RF-07 se integra como filtro del matching en S4. |
| S3 → S4 | Solicitud de cinco pasos y origen automático/dirigido; no mostrar asignaciones ficticias antes de integrar el motor. |
| S4 → S5/S7 | Ofertas ≠ asignaciones; reserva mínima al elegir y generaciones/historial desde S4; agenda completa en S5 e intervención manual en S7. |
| S4 ↔ S6 | Tratamiento acordado de técnico nuevo y fixtures antes de reseñas reales; S6 actualiza agregados válidos para futuras evaluaciones. |
| S5 → S6 | Finalización y deadline individuales; como máximo principal y adicional vigentes; aceptar P13 antes del cierre global. |
| S4 → S7 | Reglas versionadas desde el motor; publicación administrativa con historial y vigencia se completa en S7. |
| S7 → S8 | Bandeja y backend de soporte con fixtures en S7; formulario cliente/técnico integrado en S8. |
| S1–S7 → S8 | Pruebas/seguridad acompañan cada historia; S8 concentra regresión total, hardening, Quality Gate y despliegue. |

## Forma de trabajo y control de cambios

1. Refinar los Pxx que bloqueen el resultado esperado antes de comprometer la historia afectada.
2. Estimar capacidad y repartir tareas; el plan no impone una duración ficticia ni cambia la meta académica de semana 12.
3. Implementar comportamiento y pruebas por flujo vertical, con integración continua y permisos desde el inicio.
4. Registrar resultados reales, defectos y trazas por commit; demostrar el incremento y obtener la revisión del asesor.
5. Si la capacidad o una dependencia impide completar el alcance, avisar al usuario y registrar una propuesta; no alterar silenciosamente los ocho sprints.

Las propuestas pendientes no se convierten en requisitos confirmados. Las pruebas con etiqueta pendiente conservan su especificación candidata pero no pueden declararse aprobadas hasta resolver la regla y ejecutar su versión acordada.

## Registro de evidencias previsto

`docs/documentacion/evidencias/sprint-NN/TC-XXX/`: caso, commit, entorno/versiones, dataset, reloj/fecha, resultado esperado/real, logs o protocolo, defecto y responsable. Las carpetas de resultados se crearán al ejecutar; aquí no se generan evidencias ficticias.

Las normas se usan como referencias del proyecto para procesos, calidad, seguridad, privacidad y documentación de pruebas; esta planificación no acredita certificación ni cumplimiento legal.
