# Evidencia de continuación del Sprint 1

Fecha: 6 de octubre de 2026. Rama: `codex/sprint-01`. Trabajo sin push.

## Incrementos implementados

| Tarea | Commit | Resultado comprobado |
|---|---|---|
| Aprovisionamiento administrativo | `96fb93e` | Comando por consola, `secret()`, auditoría atómica y 3 pruebas nuevas Pest |
| Frontend con Sanctum | `65aa952` | Registro, login, perfil con versión y catálogo de la API real; mensajes en español |
| Cypress del Sprint 1 | `8997de8` | 11 pruebas aprobadas; TC-001, TC-005 y TC-012, más variantes de validación y seguridad |
| Calidad | Pendiente de cierre | Configuración Compose `quality` y scripts locales; resultado del análisis en preparación |

## Ejecuciones

| Momento | Pest | Cypress | Otras verificaciones |
|---|---|---|---|
| Tras tarea 1 | 34 aprobadas, 301 aserciones | No ejecutó casos: no había servidor en 5173 | Salidas conservadas |
| Tras tarea 2 | 34 aprobadas, 301 aserciones | No ejecutó casos: aún faltaba arrancador E2E | Build y 38 pruebas Vitest aprobados |
| Tras tarea 3 | 35 aprobadas, 312 aserciones | 11/11 aprobadas en Chrome 154 | API real, MySQL y cookies Sanctum; sin ejecución simultánea con Pest |
| Verificación de calidad | Pendiente de registro final | Pendiente de registro final | Build y 38 pruebas Vitest aprobados tras recuperar el entorno |

Las **21 pruebas históricas** y las **10 pruebas originales de Sprint 1** están incluidas y aprobadas en las ejecuciones Pest de las tareas 1 a 3. No se modificaron sus archivos. Se añadieron 3 pruebas para el comando administrativo y 1 para el catálogo público. No se regeneró el catálogo TC-001 a TC-140 ni se alteró el Módulo A.

Los archivos `sprint01-next-*-pest.txt` y `sprint01-next-*-cypress.txt` contienen la salida de consola. Los resultados son de la base aislada `tecnicoya_testing`, no de una base de desarrollo ni de producción.

## Incidencias de ejecución

- La plantilla documental Cypress utiliza `Cypress.env()`, eliminado en Cypress 16. Las nuevas pruebas ejecutables se adaptaron a `cy.env()`; no se cambiaron las plantillas ni las pruebas previas.
- En Electron hubo una espera vencida tras recargar el portal cliente, ligada a la intro del video. La ejecución definitiva fue en Chrome con preferencia de movimiento reducido, sin modificar la intro ni ocultar fallos con retries.
- Windows reinició durante la preparación de SonarQube. Docker dejó de iniciar por sockets temporales inaccesibles. Se conservó el directorio temporal inicial como `C:/Users/James/AppData/Local/Docker/run-recovery-20261006-100310`. La eliminación de otro socket fue rechazada por la revisión automática; no se sorteó ese rechazo. Después de la intervención del usuario, Docker volvió a responder y MySQL de pruebas conservó su volumen.
- El scanner presentó `exec format error`: el archivo de entrada de la imagen local contenía bytes nulos tras la interrupción. Se eliminó únicamente esa imagen descargable y se repitió su descarga por el mismo digest; no se borraron volúmenes.
- El host Linux de Docker tenía `vm.max_map_count=262144`; se ajustó temporalmente a `524288`, mínimo publicado por SonarQube. No se deshabilitaron comprobaciones de Elasticsearch.

## Alcance de la validación

Se verificó el incremento de autenticación y perfil del Sprint 1. Los portales muestran identidad, perfil básico y permisos efectivos; no se declara terminado el trabajo de sprints posteriores. La demo histórica permanece separada.

No se migró la base de desarrollo ni se sobrescribieron sus usuarios; por tanto no se necesitó restaurar ni crear un respaldo para una migración de desarrollo. No se usó `migrate:fresh` fuera de pruebas.

SonarQube no equivale a una certificación de seguridad. La cobertura requiere informes medidos, aún no configurados en esta primera línea base. Los hallazgos del primer análisis se registrarán sin corregirlos, según la instrucción del usuario.
