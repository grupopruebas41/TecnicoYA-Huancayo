# CANVAS DE ADENDA · P11-B · Reglas de programación

**Fecha:** 5 de octubre de 2026. **Documento afectado:** [reglas de programación](../REGLAS-DE-PROGRAMACION-TecnicoYa.md), §7 (validación de API), §§12–14 y §§16–17. Se mantienen las restricciones de parámetros y privacidad de §§6 y 8. Las reglas siguientes complementan las existentes.

## Qué se agrega

### RP-AD-01 · Mensajes obligatorios en operaciones de creación, edición y eliminación

Toda operación de crear, editar o eliminar permitida por el alcance muestra un resultado comprensible en español: éxito confirmado por el servidor o error tratable. Antes de eliminar se solicita confirmación explícita, identificando el elemento y la consecuencia. Cancelar la confirmación no envía la petición de eliminación ni modifica datos. No mostrar éxito hasta confirmar el resultado persistido.

Las acciones de activar/desactivar, cancelar, suspender o anular no son automáticamente eliminación. Conservan sus permisos, motivo, auditoría y reglas propias; también informan su resultado. El catálogo **se activa/desactiva sin eliminar**, y las calificaciones y auditoría conservan su historial. Esta regla no autoriza nuevas acciones destructivas.

| Situación | Comportamiento exigido / ejemplo adaptable |
|---|---|
| Alta confirmada | «Registro creado correctamente». Actualizar el recurso visible con la respuesta real. |
| Edición confirmada | «Cambios guardados correctamente». Reflejar versión persistida. |
| Antes de eliminar un recurso eliminable | «¿Quieres eliminar este elemento?»; identificarlo; botones «Cancelar» y «Eliminar». No usar una confirmación genérica si la acción real es desactivar. |
| Eliminación confirmada | «Elemento eliminado correctamente». Actualizar la lista después de confirmación del servidor. |
| Entrada inválida | Mensajes junto a los campos y resumen accesible: «Revisa los campos indicados». |
| Falta de permiso | «No tienes permiso para realizar esta acción». Sin datos de otras cuentas. |
| Conflicto de versión/estado | «La información cambió. Actualiza y vuelve a intentarlo». No sobrescribir datos silenciosamente. |
| Sesión vencida | «Tu sesión venció. Inicia sesión nuevamente». No informar un guardado exitoso. |
| Fallo de red con resultado desconocido | «No pudimos confirmar el resultado. Revisa el estado antes de volver a intentarlo». Consultar el estado autorizado y aplicar idempotencia; no afirmar que el servidor hizo rollback si no se sabe. |

Mensajes accesibles mediante región de estado/alerta apropiada, foco visible y asociación de errores al campo. Una notificación automática de tiempo real no sustituye la respuesta de la operación. No exponer excepciones, SQL, rutas internas o secretos; conservar un identificador de correlación cuando proceda.

### RP-AD-02 · Validación en cliente y servidor

Ningún formulario persiste información sin validar en React **y** en Laravel. React brinda retroalimentación inmediata; Laravel vuelve a validar siempre, incluso si se elude la interfaz. Validar tipos, longitud, obligatoriedad, rangos, relaciones, reglas del estado y archivos aplicables. Mantener los valores editables de negocio en los parámetros del servidor, sin duplicarlos como constantes arbitrarias en React.

Los errores visibles y los mensajes de validación de la API serán en español; los códigos de error para máquinas pueden conservar identificadores estables. Una entrada inválida devuelve el error de validación previsto por el contrato —por ejemplo 422— y no produce escrituras parciales ni éxito visual. Autenticación y autorización siguen siendo comprobaciones independientes.

### RP-AD-03 · SonarQube por sprint y por PR

El código debe pasar SonarQube con **Quality Gate aprobado en cada sprint**. Se mantiene, además, la exigencia vigente de Gate aprobado para cada PR sobre su revisión final. El análisis de cierre debe corresponder al commit integrado que se demuestra; no reutilizar la aprobación de otro commit.

Guardar identificador/enlace de análisis, proyecto, commit, fecha, política del Gate y resultado. Si frontend y backend se analizan por separado, ambos análisis aplicables deben estar aprobados y trazados al mismo incremento. Un análisis pendiente, fallido o no ejecutado no satisface la DoD. Revisar la edición/capacidad de SonarQube según P11-B §14; esta adenda no afirma que el entorno esté configurado.

No inventar umbrales, cambiar exclusiones para ocultar código ni atribuir porcentajes a ISO. La política medible del Gate se define y versiona antes del primer merge. Las pruebas de comportamiento y seguridad siguen siendo obligatorias aunque el Gate apruebe.

### RP-AD-04 · Pruebas automatizadas de las alertas y validaciones

Para cada operación/formulario del sprint, mantener trazabilidad RF/RNF → HU → criterio → TC → prueba → commit → resultado. Cypress comprueba el comportamiento visible; Pest comprueba validación, autorización y persistencia. Un mock de la API puede cubrir presentación, pero no acredita validación real en Laravel/MySQL.

| Familia de caso nueva | Comprobación mínima |
|---|---|
| `TC-AD-SNN-CRUD-01-<recurso>-<accion>` | Éxito de crear/editar/eliminar donde exista: mensaje español y estado persistido correcto. |
| `TC-AD-SNN-CRUD-02-<recurso>-<accion>` | Error de la operación: mensaje visible, sin falso éxito y estado coherente; resultado de red desconocido tratado separadamente. |
| `TC-AD-SNN-CRUD-03-<recurso>` | Eliminación: confirmación previa, cancelar no emite petición y aceptar ejecuta solo la operación autorizada. |
| `TC-AD-SNN-VAL-01-<formulario>` | Cliente rechaza datos inválidos con mensajes de campo; ninguna petición de guardado. |
| `TC-AD-SNN-VAL-02-<formulario>` | Petición directa eludiendo React: Laravel rechaza, mensajes españoles, ninguna escritura parcial. |
| `TC-AD-SNN-AUTH-01-<operacion>` | Rol/propietario no autorizado: rechazo en servidor, sin modificación y sin exposición. |

Son **familias de casos previstos**, no pruebas ya implementadas ni un único test genérico que sustituye cada formulario. Instanciar identificadores únicos por recurso/acción. Mantener los TC-001…TC-118 existentes sin renumeración. Si el sprint no autoriza eliminaciones, registrar «no aplica a eliminación» con la referencia de alcance, sin quitar las pruebas de creación, edición y validación aplicables.

Ejemplos de criterios BDD que se incorporan a las HU afectadas:

```gherkin
# language: es
Característica: Operaciones con validación y resultado visible
  Escenario: Guardado confirmado
    Dado un usuario autorizado con un formulario válido
    Cuando el servidor confirma el guardado
    Entonces se muestra un mensaje de éxito en español
    Y la vista refleja los datos persistidos

  Escenario: Validación del servidor aunque se omita el cliente
    Dado un usuario autorizado que envía datos inválidos directamente a la API
    Cuando Laravel valida la solicitud
    Entonces rechaza los datos con mensajes de validación en español
    Y no persiste cambios parciales

  Escenario: Cancelar una eliminación permitida
    Dado un elemento cuya eliminación está permitida por el alcance
    Cuando el usuario solicita eliminarlo y cancela la confirmación
    Entonces no se envía una petición de eliminación
    Y el elemento permanece intacto

  Escenario: Error del servidor durante una edición
    Dado un usuario autorizado y una operación que el servidor rechaza sin guardar
    Cuando se recibe el error
    Entonces se muestra un mensaje de error en español
    Y no se muestra un mensaje de éxito
    Y los datos persistidos conservan su valor anterior
```

## Qué se modifica

- §12: los estados de éxito/error ya previstos se vuelven obligaciones por operación; añadir confirmación previa a eliminación y mensajes españoles.
- §§13–14: incorporar familias de pruebas y Gate del cierre de sprint además del Gate por PR existente.
- §16: añadir «Los CRUD del sprint muestran sus alertas y tienen prueba automatizada» y «El análisis de SonarQube del sprint está aprobado», con evidencia real y casillas inicialmente sin marcar.
- §17: patrón común de mensajes, validación y CI/Gate disponible desde S1; no aplazarlo a S8.

## Qué se elimina

- Guardado silencioso, validación únicamente visual, errores técnicos sin tratar y mensajes de éxito anticipados.
- Eliminación ejecutada antes de confirmar y aprobación del incremento con Gate pendiente/fallido.
- No se elimina ninguna regla previa; no se agregan permisos de eliminación ni se cambian plazos, pesos o estados.
