# CANVAS DE ADENDA · Sprint 7 · Definición y DoD

**Fecha:** 5 de octubre de 2026. **Documento afectado:** [CANVAS Sprint 7 — Panel administrador completo](../sprints-01-08/CANVAS-Sprint-07.md). **Estado:** requisitos de aceptación añadidos; NO EJECUTADO. No sustituye el CANVAS completo.

## Qué se agrega

### A las tareas y criterios de aceptación del incremento

**Historias afectadas:** HU-S07-02, HU-S07-03, HU-S07-04, HU-S07-05 y HU-S07-07. **Traza de requisitos:** RF-30/31/33 y RF de la operación intervenida; RNF-03/04/09. Se conservan sus identificadores; los criterios añadidos son transversales de calidad/seguridad, no historias comerciales nuevas.

**Operaciones a cubrir:** Reasignación manual, bloqueo/desbloqueo, soporte, reglas y cuentas administrativas. Reportes/dashboard son consultas. Auditoría y versiones de reglas no son recursos eliminables ordinarios.

**Trabajo adicional:** Exigir mensajes en todos los comandos sensibles y probar validación, motivo, permisos y auditoría. Aprobar Gate antes de aceptar el panel.

Aplicar el ciclo de trabajo y control de asistencia IA de [P8](ADENDA-P8-Iteraciones-Scrum.md), con su atribución pendiente claramente identificada. Registrar avance por integrante según [P10](ADENDA-P10-Estructura-y-equipo.md). Las obligaciones de CRUD/Gate provienen de la instrucción docente; no dependen de que se identifique el artículo faltante.

### Criterios añadidos a cada HU que modifica información

- **Dado** un usuario autorizado y datos válidos, **cuando** el servidor confirma una creación o edición permitida, **entonces** se muestra éxito en español y la vista refleja el dato persistido.
- **Dado** un formulario con datos inválidos, **cuando** se intenta guardar, **entonces** React señala los errores en español; si se elude React, Laravel vuelve a validar y no guarda datos inválidos ni cambios parciales.
- **Dado** un recurso cuya eliminación está permitida, **cuando** se solicita eliminarlo, **entonces** se pide confirmación previa; cancelar no envía la petición, y confirmar requiere autorización y resultado visible del servidor.
- **Dado** un error de operación, **cuando** se informa al usuario, **entonces** el mensaje es español, accesible y no expone detalles sensibles ni muestra un éxito falso. Un fallo de red de resultado incierto exige recuperar el estado antes de afirmar éxito o fracaso definitivo.

La cláusula de eliminación solo se instancia donde la HU ya la autoriza; no crea permisos ni cambia desactivación, cancelación, suspensión o anulación en borrado.

### Casos automatizados adicionales previstos

Instanciar las familias `TC-AD-S07-CRUD-01/02/03`, `TC-AD-S07-VAL-01/02` y `TC-AD-S07-AUTH-01` con sufijo de recurso/acción según [P11-B](ADENDA-P11-B-Reglas-programacion.md). Mantener los TC existentes. Cada formulario y operación aplicable debe tener caso trazable; no basta una prueba genérica del componente de alertas.

**Ejemplos concretos de este sprint:** Pesos que no suman 100 %: rechazo español y versión vigente intacta. Bloqueo sin permiso: denegación y ausencia de cambio. Reasignación válida: confirmación y registro auditable.

**Automatización:** Cypress para éxito/error/confirmación y validación de cliente; Pest para validación del servidor, permisos y persistencia, utilizando MySQL en los casos dependientes de integridad. Los resultados de presentación con mocks no sustituyen integración real.

### A §10 · Definition of Done

- [ ] **Los CRUD del sprint muestran sus alertas y tienen prueba automatizada.** Éxito y error en español; confirmación previa donde eliminar esté autorizado; cancelación de confirmación sin petición destructiva; validación de todos los formularios en cliente y servidor; trazabilidad por recurso/HU/TC/commit. Los «no aplica» tienen motivo y referencia al alcance.
- [ ] **El análisis de SonarQube del sprint está aprobado.** Quality Gate aprobado sobre el commit integrado del incremento; análisis aplicables de frontend/backend identificados; política, fecha e informe verificables. Un Gate de otro commit, pendiente o fallido no cuenta.
- [ ] Las evidencias se enlazan desde el avance del integrante y el acta del sprint. Se mantienen revisión humana, pruebas de seguridad y todas las condiciones previas de DoD y Gate por PR.

### A §11 · Evidencias añadidas

| Evidencia prevista | Contenido requerido |
|---|---|
| `docs/documentacion/evidencias/sprint-07/TC-AD-S07-<familia>-<recurso>-<accion>/` | HU/RF/RNF, caso, esperado/obtenido, comando/runner, resultado, commit, entorno, fecha y defecto. |
| `docs/documentacion/evidencias/sprint-07/calidad/` | Identificador/enlace del análisis SonarQube, política de Gate, estado, commit y fecha; análisis por componente si corresponde. |
| `docs/avances/<integrante>/sprint-07/avance.md` | Módulo asignado, tareas, commit/PR, revisor y enlaces a evidencia canónica; sin duplicar reportes. |

Los directorios son destinos de evidencia futura, no resultados fabricados. Esta adenda no marca ninguna casilla como aprobada.

## Qué se modifica

- Secciones de tareas y pruebas: incorporar los controles anteriores dentro de las HU afectadas, estimar el esfuerzo y reutilizar habilitadores existentes.
- §10: la finalización exige alertas/validación probadas y Gate aprobado del sprint, además de la DoD vigente.
- §11: aceptación documentada con evidencia individual y de calidad sobre el mismo incremento integrado.
- Se mantiene objetivo, funcionalidades y posición del Sprint 7. El ajuste exacto de fases según el artículo IA + Scrum sigue pendiente en P8; no se atribuye a una fuente no identificada.

## Qué se elimina

- La posibilidad de declarar terminado este incremento con guardados silenciosos, eliminación sin confirmación cuando aplique, formularios sin doble validación o Gate pendiente/fallido.
- Ninguna historia, regla, prueba existente ni funcionalidad. No se introduce eliminación de recursos protegidos ni se sustituyen pruebas previas por capturas.
