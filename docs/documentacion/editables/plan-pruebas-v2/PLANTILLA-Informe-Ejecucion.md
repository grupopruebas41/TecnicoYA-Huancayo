# Informe de ejecución y cierre de pruebas · TécnicoYa Huancayo

**Plantilla vinculada a PP-TY-02. No contiene resultados ejecutados.** Duplicar para cada corrida/sprint y completar con evidencia real. Conservar las corridas fallidas y enlazar las repeticiones.

## 1. Identificación y revisión

| Campo | Valor que se completará |
|---|---|
| ID del informe / run | `<RUN-SNN-fecha-secuencia>` |
| Plan de pruebas / versión | `PP-TY-02 / 2.0` o versión aprobada vigente |
| Sprint / objetivo | `<completar>` |
| Tipo de campaña | `<PR / sprint / regresión / carga / aceptación / servidor / restauración>` |
| Fecha/hora inicio y fin / zona | `<UTC y referencia America/Lima>` |
| Ejecutor(es) / integrante | `<completar>` |
| Revisor independiente | `<completar>` |
| Commit / rama / PR | `<completar>` |
| Release / imagen / digest | `<completar>` |
| Entorno y dominio autorizado | `<completar sin credenciales>` |
| Estado global | `NO EJECUTADO` |
| Aprobador y decisión | `PENDIENTE` |

## 2. Alcance real y diferencias respecto del plan

Registrar HU, RF/RNF, riesgos, TC y alertas incluidas; casos excluidos o bloqueados con justificación y decisión; cambios en reglas, datos, código o herramientas; pendientes Pxx resueltos con fuente/aprobador. Adjuntar versión del catálogo utilizado.

| Ítem | Planificado | Ejecutado | Diferencia/motivo | Impacto y decisión |
|---|---|---|---|---|
| `<HU/TC/RNF>` | `<completar>` | `<completar>` | `<completar>` | `<completar>` |

No retirar del denominador casos fallidos o bloqueados para aumentar tasas. No aprobar un escenario cuyo resultado esperado depende de una regla aún no ratificada.

## 3. Entorno y datos de la corrida

| Elemento | Versión/configuración/evidencia |
|---|---|
| PHP / Laravel / Pest / plugin Laravel | `<completar>` |
| MySQL / motor / collation / zona | `<completar>` |
| Node / React / Cypress / navegadores / SO | `<completar>` |
| k6 o JMeter / generador de carga | `<completar o no aplica justificado>` |
| Docker/Compose / recursos CPU-RAM-disco / red | `<completar>` |
| Proxy / HTTPS / WSS / certificados | `<completar sin secretos>` |
| Reverb/Echo / colas / workers / scheduler | `<completar>` |
| SonarQube / scanner / edición / políticas | `<completar>` |
| Dataset / seed / fixtures / versión o hash | `<completar>` |
| Parámetros y pesos de negocio / versión | `<completar>` |
| Reloj real o simulado / instante UTC / procesos alcanzados | `<completar>` |
| Aislamiento, cuentas sintéticas y limpieza | `<completar>` |
| Preparación/restauración anterior | `<completar>` |

No adjuntar `.env` con secretos, cookies, tokens o contraseñas. El manifiesto de entorno identifica valores relevantes sin exponer credenciales.

## 4. Entrada y procedimiento ejecutado

- [ ] Alcance y oráculos aprobados para los casos ejecutados.
- [ ] Entorno aislado y datos identificados; base de pruebas verificada.
- [ ] Build, commit y versiones conocidos.
- [ ] Dependencias y servicios necesarios disponibles.
- [ ] Preparación de tiempo/fixtures consistente entre procesos.
- [ ] Regresión previa requerida aprobada o impedimento documentado.

| Paso | Fecha/hora | Directorio / comando o acción real | Responsable | Exit code / resultado | Log/evidencia |
|---|---|---|---|---|---|
| `<n>` | `<completar>` | `<sin secretos>` | `<completar>` | `<completar>` | `<enlace>` |

Registrar interrupciones, reinicios, cambios de datos/configuración y reanudación. Si se cambia el commit o reglas durante la campaña, separar las corridas; no mezclar resultados como si fueran una ejecución única.

## 5. Resultados por caso

Importar o adjuntar [Plantilla-Resultados-Ejecucion.csv](Plantilla-Resultados-Ejecucion.csv).

| TC / variante | HU / RF-RNF | Herramienta | Esperado | Obtenido | Estado | Duración | Evidencia / defecto |
|---|---|---|---|---|---|---|---|
| `<TC-XXX>` | `<completar>` | `<completar>` | `<del catálogo aprobado>` | `<real>` | `NO EJECUTADO` | `<medida>` | `<enlace>` |

Estados: NO EJECUTADO, EN EJECUCIÓN, APROBADO, FALLIDO, BLOQUEADO y NO APLICA justificado. Diferenciar assertion fallida, error del runner, skip/todo y bloqueo de entorno/regla. No convertir un error del entorno en aprobación del producto.

## 6. Resumen de automatización y cobertura

| Indicador | Resultado real | Fuente |
|---|---|---|
| Casos planificados aplicables | `<completar>` | Catálogo versionado |
| IDs únicos implementados/ejecutados con Pest | `<completar>` | Mapeo test → TC + JUnit |
| IDs únicos Pest aprobados | `<completar; comparar con ≥60 al cierre final>` | Ejecución final identificada |
| Pest fallidos / errores / skips / incompletos | `<completar por separado>` | Runner/JUnit |
| Casos híbridos completos / parcialmente comprobados | `<completar; TC-056 aparte>` | Autorización y transporte |
| Cypress ejecutados/aprobados/fallidos por navegador | `<completar>` | Reportes Cypress |
| Casos de otras herramientas y manuales | `<completar por tipo>` | Informes específicos |
| No ejecutados / bloqueados / no aplica | `<completar por motivo>` | Catálogo y decisiones |
| RF/RNF con evidencia aprobada / aplicables | `<completar>` | Matriz de trazabilidad |
| Riesgos críticos/altos con pruebas aprobadas | `<completar>` | Matriz de riesgos |

Contar IDs distintos, no assertions, variantes del mismo caso ni repeticiones. No mezclar éxitos de commits anteriores con el conteo del incremento final. Adjuntar lista exacta de IDs que acredita el mínimo de Pest.

## 7. CRUD, alertas y validación doble

Adjuntar el [registro de alertas](Plantilla-Registro-Alertas.csv) completado. Una fila por alerta/estado aplicable; identificar navegador y entorno de cada ejecución.

| Recurso / formulario / operación | Éxito visible | Error visible | Confirmación y cancelar | Negativo React | Negativo Laravel / datos intactos | Local / servidor | TC/evidencia |
|---|---|---|---|---|---|---|---|
| `<completar>` | `<resultado>` | `<resultado>` | `<resultado o no aplica justificado>` | `<resultado>` | `<resultado>` | `<identificar>` | `<enlaces>` |

Registrar lenguaje español, foco/errores asociados, resultado persistido tras recarga y tratamiento de red incierta. Confirmar que las eliminaciones se limitaron a operaciones autorizadas. Reportar explícitamente las alertas no activadas y por qué.

## 8. Resultados no funcionales y asíncronos

### Rendimiento y carga

Escenario, duración/rampa, VU/sesiones activas, mezcla de acciones, volumen/dataset, hardware, red y commit: `<completar>`. Protocolo aprobado P21: `<enlace>`.

| Métrica | Resultado | Umbral aprobado / criterio | Cumple | Evidencia |
|---|---|---|---|---|
| Matching p50/p95/p99/máximo y excedencias de 3 s | `<completar>` | RNF-01 / protocolo | `<sí/no/no evaluado>` | `<enlace>` |
| Usuarios concurrentes alcanzados | `<completar>` | 200, RNF-02 | `<completar>` | `<enlace>` |
| Errores inesperados / throughput | `<completar>` | `<política>` | `<completar>` | `<enlace>` |
| Reservas incompatibles / duplicados efectivos | `<completar>` | Ninguna violación de integridad | `<completar>` | `<enlace>` |
| Cola, retraso de jobs y recursos | `<completar>` | `<protocolo>` | `<completar>` | `<enlace>` |

Separar 409 esperados por competencia de errores inesperados. Anotar abortos y no ocultar resultados fuera de umbral.

### Compatibilidad, usabilidad y disponibilidad

| Evaluación | Protocolo / muestra / versión | Resultado real | Criterio | Evidencia |
|---|---|---|---|---|
| Chrome / Edge / Firefox | `<versiones, SO, viewport>` | `<completar>` | Flujos y alertas aplicables | `<enlace>` |
| Dispositivo real / teclado / foco / movimiento reducido | `<completar>` | `<completar>` | Criterios UI aprobados | `<enlace>` |
| SUS | `<muestra y tareas>` | `<completar>` | ≥70 | `<enlace anonimizado>` |
| Solicitud en cinco pasos / mediana | `<muestra, ayuda, abandonos>` | `<completar>` | Cinco pasos y ≤3 min | `<enlace>` |
| Reducción del tiempo de búsqueda/asignación | `<comparación válida>` | `<completar>` | ≥30 % | `<enlace>` |
| Disponibilidad | `<ventana, frecuencia, intervalos perdidos>` | `<completar>` | ≥99 % según protocolo | `<enlace>` |

SLA, pendiente y ventanas de calificación/edición: listar cada reloj, punto antes/exacto/después, versión de regla, autorización del resultado esperado, procesos ejecutados y estado real. No confundir una animación de cronómetro con vencimiento backend.

## 9. SonarQube y seguridad

| Proyecto / componente | Commit | Análisis ID / fecha | Política y versión de Gate | Resultado | Evidencia |
|---|---|---|---|---|---|
| Backend | `<completar>` | `<completar>` | `<completar>` | `NO ANALIZADO` | `<enlace>` |
| Frontend, si separado | `<completar>` | `<completar>` | `<completar>` | `NO ANALIZADO` | `<enlace>` |

| Métrica | Código total | Código nuevo | Umbral/política | Observaciones |
|---|---|---|---|---|
| Cobertura importada | `<completar>` | `<completar>` | `<política>` | `<reporte y ámbito>` |
| Matching / notificación / calificación | `<por componente y agregado>` | `<si aplica>` | ≥70 % en ámbito ratificado | `<P21>` |
| Duplicación | `<completar>` | `<completar>` | `<política>` | `<completar>` |
| Hallazgos de fiabilidad | `<completar>` | `<completar>` | `<política>` | `<severidad/estado>` |
| Hallazgos de seguridad | `<completar>` | `<completar>` | `<política>` | `<severidad/estado>` |
| Mantenibilidad | `<completar>` | `<completar>` | `<política>` | `<completar>` |
| Hotspots revisados / pendientes | `<completar>` | `<completar>` | `<política>` | `<responsable/decisión>` |

Adjuntar detección de secretos/dependencias, pruebas de permisos/CSRF/archivos y configuración TLS/WSS aplicables. Un Gate verde no sustituye esas evidencias. Registrar casos en que una métrica no esté disponible; no escribir cero como sustituto.

## 10. Campaña sobre servidor

| Campaña | Servidor / release | Datos del run | Resultado | Alertas pendientes | Evidencia |
|---|---|---|---|---|---|
| SRV-01 · Preparación/sesión | `<completar>` | `<completar>` | `NO EJECUTADO` | `<completar>` | `<enlace>` |
| SRV-02 · Flujo completo | `<completar>` | `<completar>` | `NO EJECUTADO` | `<completar>` | `<enlace>` |
| SRV-03 · Plazos y alternativas | `<completar>` | `<completar>` | `NO EJECUTADO` | `<completar>` | `<enlace>` |
| SRV-04 · Seguimiento/admin | `<completar>` | `<completar>` | `NO EJECUTADO` | `<completar>` | `<enlace>` |
| SRV-05 · Todas las alertas CRUD | `<completar>` | `<completar>` | `NO EJECUTADO` | `<inventario AL>` | `<enlace>` |
| SRV-06 · Tiempo real | `<completar>` | `<completar>` | `NO EJECUTADO` | `<completar>` | `<enlace>` |
| SRV-07 · Complementos | `<completar>` | `<completar>` | `NO EJECUTADO` | `<completar>` | `<enlace>` |
| SRV-08 · Recuperación/operación | `<completar>` | `<completar>` | `NO EJECUTADO` | `<completar>` | `<enlace>` |

Identificar dónde se indujeron errores: preproducción aislada o servidor de demostración. No presentar un mock local como prueba del servidor. Documentar limpieza específica y comprobación de que no se afectaron datos externos al run.

## 11. Incidentes y repetición

| Defecto | TC/HU | Severidad / prioridad | Pasos y evidencia | Responsable | Corrección / commit | Retest / regresión | Estado |
|---|---|---|---|---|---|---|---|
| `<DEF-...>` | `<completar>` | `<completar>` | `<enlace>` | `<completar>` | `<completar>` | `<run/enlace>` | `<completar>` |

Incluir esperado/obtenido, causa si se conoce, medidas de contención, riesgos residuales, fecha de resolución y revisor. La ausencia de incidencias registradas no significa ausencia de defectos si la campaña no fue ejecutada.

## 12. Decisión de cierre

| Criterio | Evidencia | Resultado / pendiente |
|---|---|---|
| Historias y casos obligatorios cubiertos y aprobados | `<enlaces>` | `PENDIENTE` |
| Meta final de ≥60 IDs Pest aprobados, sin errores | `<lista/JUnit>` | `PENDIENTE` |
| Alertas CRUD y validación doble automatizadas | `<inventario/TC>` | `PENDIENTE` |
| Gate aprobado del sprint y PR, commit final | `<análisis>` | `PENDIENTE` |
| Cero defectos críticos/altos abiertos | `<registro>` | `PENDIENTE` |
| Regresión y campañas remotas exigibles | `<informes>` | `PENDIENTE` |
| RNF obligatorios medidos/aprobados | `<protocolos/resultados>` | `PENDIENTE` |
| Evidencia íntegra y revisión independiente | `<manifiesto/revisión>` | `PENDIENTE` |

**Decisión:** `<no ejecutado / incremento no aceptado / aceptado con criterios cumplidos>`.

**Limitaciones y riesgos residuales:** `<completar>`.

**Próximas acciones, responsable y plazo acordado:** `<completar>`.

**Revisión y aprobación:** `<nombre, función, fecha, decisión y referencia verificable>`. No completar firmas ni aprobaciones por terceros de forma ficticia.

## 13. Índice de evidencias

| Archivo/enlace | Tipo | Commit / run | Integridad/versión | Acceso / responsable |
|---|---|---|---|---|
| `<completar>` | `<JUnit, cobertura, log, captura, análisis, acta…>` | `<completar>` | `<hash o identificador>` | `<completar>` |

Enlazar avances de Delgado, Mayhuasca y Pimentel sin duplicar reportes. Registrar tratamiento de datos sensibles y política de conservación aprobada.
