# Plan de Pruebas · TécnicoYa Huancayo

**Identificador:** PP-TY-02 · **Versión:** 2.0, propuesta para revisión · **Fecha:** 5 de octubre de 2026.  
**Producto:** MVP web de conexión de clientes y técnicos de cómputo, refrigeración comercial y electricidad.  
**Horizonte:** Iteración 0 y Sprints 1–8, sin cambiar su orden funcional.  
**Estado:** planificación. No acredita pruebas aprobadas, despliegue completado ni conformidad certificada.

## 1. Propósito, fuentes y control del documento

Definir cómo se comprobarán los requisitos, cómo se priorizarán los riesgos y qué evidencias permitirán aceptar cada incremento. La meta final incluye **al menos 60 casos distintos automatizados en Pest, aprobados sin errores**, además de las pruebas de interfaz, E2E, compatibilidad, carga, seguridad operativa y aceptación humana. Cumplir el mínimo no permite omitir otros casos obligatorios ni aceptar defectos críticos.

La fuente del comportamiento esperado es Fuente 0 y sus aclaraciones, el [análisis del MVP](CANVAS-Analisis-MVP-TecnicoYa.md), [diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md), [diccionario](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md), [reglas formalizadas](REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md), [backlog](CANVAS-Backlog-Tecnico-Implementacion-TecnicoYa.md), [sprints](sprints-01-08/CANVAS-Plan-Sprints-01-08.md), [reglas de programación](REGLAS-DE-PROGRAMACION-TecnicoYa.md) y [adendas del docente](adendas-docente-2026-10-05/README.md). Ante discrepancias se aplica la decisión explícita más reciente; los pendientes Pxx no se convierten en reglas por escribir un test.

Esta versión propuesta actualiza el enfoque de pruebas a React–Laravel–MySQL, Pest, Cypress y ocho sprints. Los PDF históricos del plan se conservan como antecedentes; no prevalecen sus tecnologías ni calendarios incompatibles. La aprobación de esta versión debe registrarse en el control documental.

La referencia de procesos es [ISO/IEC/IEEE 29119-2:2021](https://www.iso.org/standard/79428.html), y la referencia de documentación es [ISO/IEC/IEEE 29119-3:2021](https://www.iso.org/standard/79429.html). Se utiliza una adaptación al proyecto; las fichas oficiales públicas permiten verificar su objeto y edición. No se declara cumplimiento integral de cláusulas ni se reproduce una plantilla normativa licenciada que no se ha proporcionado.

**Aprobación prevista:** equipo propone y revisa; asesor/responsable académico acepta según el gobierno del proyecto. Estado actual de aprobación: pendiente. Todo cambio de alcance, criterio o exclusión registra versión, motivo, autor, fecha, aprobador e impacto en HU/TC. La omisión de diagramas de P7 no elimina pruebas de estados, componentes o contratos.

## 2. Organización de los procesos y entregables

| Proceso de trabajo | Aplicación en TécnicoYa | Registro/entregable |
|---|---|---|
| Planificar | Fijar alcance, riesgos, recursos, herramientas, entradas/salidas y estrategia por sprint. | Este plan, calendario, inventario y decisiones pendientes. |
| Supervisar y controlar | Comparar ejecución con plan, analizar defectos y bloqueos, ajustar tareas con autorización cuando cambie alcance. | Informe de estado por sprint, métricas y registro de incidencias. |
| Diseñar y especificar | Derivar condiciones, datos, resultados esperados y procedimientos desde RF/RNF/HU y BDD. | Catálogo TC, matriz de trazabilidad, escenarios Gherkin y datos sintéticos. |
| Preparar entorno | Comprobar versiones, aislamiento, MySQL, workers, Reverb, fixtures y observabilidad. | Ficha y lista de preparación del entorno. |
| Ejecutar y comparar | Ejecutar sobre un commit identificado; conservar resultado real y diferencias con el esperado. | JUnit, logs, capturas pertinentes, reportes de carga/calidad y registro de ejecución. |
| Gestionar incidentes y cerrar | Clasificar, corregir, repetir y revisar regresión; evaluar riesgos residuales y criterios de salida. | Defectos, informe de finalización, decisión de aceptación y archivo de evidencia. |

Esta organización sigue la distinción entre procesos y documentación de 29119-2/3; los formatos y criterios concretos de las tablas son decisiones del proyecto. No se necesita un documento separado por cada fila: el catálogo y la [plantilla de informe](plan-pruebas-v2/PLANTILLA-Informe-Ejecucion.md) contienen campos reutilizables.

## 3. Objeto, alcance y exclusiones

### 3.1 Componentes y funciones dentro del alcance

| Área | Qué se prueba | Requisitos / sprint |
|---|---|---|
| Identidad y administración transversal F | Registro, sesión, perfiles, RBAC, propiedad, verificación, catálogo y documentos privados. | RF-28/33, RF-C; S1–S2 y ampliaciones S7. |
| A · Solicitudes | Cinco pasos, evidencias, tarifa referencial, cobertura y datos del técnico. | RF-01..05; S2–S3. |
| B · Matching | Elegibilidad, subcategoría, normalización aprobada, pesos, orden, empate y disponibilidad. | RF-06..14; S4, integración con S6. |
| C · Ofertas y respuesta | Hasta tres ofertas, SLA, aceptación distinta de asignación, elección, rondas y ruta dirigida. | RF-15..18; S4. |
| D · Atención | Agenda, estados, reprogramación, técnico adicional, cancelación, contacto tras asignación y cierre. | RF-19..22; S5. |
| E · Reputación | Calificación, edición, cierre sin calificar, versiones, reseñas, respuestas, apelaciones e historial. | RF-23..27; S6. |
| F · Gobierno y servicios complementarios | Supervisión, reasignación manual, bloqueos, reglas/versiones, reportes, comunicados, soporte, cuentas y auditoría. | RF-30/31/33, RF-C; S2/S7. |
| Comunicación y simulación económica | Eventos privados, preferencias, método/comprobante simulado e historial permitido. | RF-29/32; S4/S8. |
| Plataforma | API, MySQL, archivos, colas, scheduler, Reverb/Echo, proxy y despliegue; calidad de código. | RNF-01..14; controles desde S1, verificación acumulada S8. |
| Interfaz pública y portales | Landing de diez secciones, carruseles, cliente, técnico y administrador; alertas y validaciones. | HU-S02-01 y HU de cada portal; S1–S8. |

Probar datos, contratos, transacciones, trabajos automáticos y efectos visibles; no limitarse a que el servidor devuelva 200. El catálogo se activa/desactiva sin eliminación física; cancelación, suspensión y anulación son operaciones de negocio distintas de borrar registros.

### 3.2 Fuera del alcance

Pagos/cobros/devoluciones reales, geolocalización real, aplicación móvil nativa, chat integrado/LLM, prestación física del servicio, notificaciones productivas a personas reales y operación comercial 24×7. La arquitectura futura de P2 no convierte esas capacidades en pruebas obligatorias del MVP. La aplicación demo de `localStorage` no acredita integración real Laravel–MySQL.

La evaluación de disponibilidad y carga corresponde a la demostración y condiciones acordadas; no demuestra capacidad comercial ilimitada. El plan no certifica ISO ni sustituye una revisión especializada de cumplimiento legal.

## 4. Estrategia basada en riesgos

Evaluación inicial propuesta: probabilidad P e impacto I de 1 a 5; exposición P×I. Crítico: 16–25; alto: 10–15; medio: 5–9; bajo: 1–4. El equipo recalibra con defectos y cambios reales. La prioridad de ejecución sigue el riesgo; no altera el orden de los sprints.

| Riesgo | P×I | Prevención y pruebas prioritarias | TC de referencia / responsable propuesto |
|---|---|---|---|
| R-PP-01 · Acceso a datos/acciones ajenos | 4×5=20 | RBAC, propiedad, archivos, API y canales privados; ataques directos sin interfaz. | TC-004/007/008/020/030/038/056/082/090/098; Delgado. |
| R-PP-02 · Asignaciones o reservas incompatibles | 4×5=20 | Transacciones y contención real con dos conexiones/procesos MySQL; idempotencia y auditoría. | TC-037/049/050/051/058/089/100/114; Delgado + Pimentel. |
| R-PP-03 · SLA/ventanas incorrectos | 4×5=20 | Fronteras, reloj servidor, worker tardío, reintentos y generaciones antiguas. | TC-047/048/054/058/075..078 y familias temporales; Delgado. |
| R-PP-04 · Guardados inválidos o falsos éxitos | 4×4=16 | Doble validación, rollback, mensajes de campo, error de red y eliminación confirmada. | TC-002/010/024/026/046/074/096; familias CRUD; Mayhuasca + Delgado. |
| R-PP-05 · Ranking incorrecto o no explicable | 3×4=12 | Oráculos independientes, elegibilidad, pesos suman 100, empate y versión de reglas. | TC-039..044/095/096; Delgado. |
| R-PP-06 · Pérdida de avisos/estado al reconectar | 3×4=12 | Outbox, fallo de entrega, deduplicación, recuperación API y Reverb real. | TC-046/055..058/105/106; Pimentel + Mayhuasca. |
| R-PP-07 · Alteración de reseñas/historial | 3×4=12 | Versiones, plazo propio de edición, apelación autorizada y conflicto al resolver. | TC-073..086; Delgado + Mayhuasca. |
| R-PP-08 · Demostración insegura o irrecuperable | 3×5=15 | Configuración HTTPS/WSS, secretos, respaldo/restauración, build y rollback de entrega. | TC-110/117/118; Pimentel. |
| R-PP-09 · Lentitud o agotamiento bajo carga | 3×4=12 | Perfil con 200 sesiones activas, medición del matching, integridad y cola. | TC-113/114; Pimentel. |
| R-PP-10 · Clientes no comprenden el flujo | 3×3=9 | Compatibilidad, teclado, foco, textos españoles, SUS y cinco pasos. | TC-013/014/027/028/059/067/080/115; Mayhuasca. |

Riesgos del propio ensayo: datos contaminados, falsos positivos por mocks, pruebas inestables, herramienta no instalada, decisiones Pxx sin resolver o falta de revisor. Mitigar con datasets versionados, pruebas reales de integración, revisión cruzada y estado BLOQUEADO. El uso de IA no sustituye la especificación ni el criterio humano; cualquier ayuda generada se revisa y registra conforme a P8.

## 5. Niveles y tipos de prueba

### 5.1 Niveles

| Nivel | Objetivo y frontera | Herramienta/evidencia |
|---|---|---|
| Unitarias | Reglas puras, puntuación, filtros, estados y cálculo temporal sin depender de infraestructura. | Pest; ID TC en nombre; aserciones de resultados conocidos. |
| Integración | Laravel–MySQL, Policies, archivos, transacciones, auditoría, outbox, jobs y autorización de broadcast. | Pest + MySQL real; workers/Reverb reales cuando se prueba transporte. |
| Funcionales de API | Contratos, estados HTTP, JSON, mensajes de validación y persistencia por caso de uso. | Pest, invocando la API sin confiar en React. |
| Sistema / E2E | Usuario → React → API → MySQL → eventos; recorridos completos y alertas visibles. | Cypress sobre servicios reales; capturas/logs solo como complemento al resultado. |
| Aceptación | Requisitos del incremento, usabilidad, utilidad y aceptación académica por actores. | Cypress para recorridos repetibles; revisión del asesor y sesiones humanas para comprensión/SUS. |

Una prueba de API puede ser funcional y de integración; no se cuenta dos veces por esas etiquetas. Una prueba unitaria aprobada no acredita una transacción, navegador o servidor desplegado.

Las pruebas de CSRF deben comprobar la protección efectiva con middleware habilitado y mediante navegador/HTTP real cuando corresponda. El entorno de tests de Laravel puede omitir esa protección: una petición interna aprobada bajo ese modo no demuestra que CSRF funcione en la sesión desplegada.

### 5.2 Tipos y técnicas

| Tipo solicitado | Aplicación concreta |
|---|---|
| Funcionalidad | Flujo normal y alternativos, permisos, estados válidos/prohibidos y efectos persistidos. |
| Validación de datos | Obligatorios, longitudes, tipos, formato, correo duplicado, rango, FK, pertenencia de archivo, pesos y entrada directa manipulada. |
| Valores límite | Puntajes 0/1/5/6, pesos negativos/cero/100/suma inválida, límite 3 ofertas, intervalo temporal antes/exacto/después y tamaños de archivos según política aprobada. |
| Interfaz y usabilidad | Éxito/error/confirmación, foco, etiquetas, teclado, lectura fluida, contraste observable, cinco pasos, móvil y movimiento reducido. Evaluación humana complementa automatización. |
| Seguridad | Autenticación/CSRF efectivo, RBAC/propiedad, sesión revocada, exposición de secretos, carga de archivos, XSS y auditoría de cambios sensibles. |
| Rendimiento | Tiempo de matching, mezcla de consultas/escrituras, 200 usuarios concurrentes, colas y concurrencia de reservas. |
| Compatibilidad | Chrome, Edge y Firefox en versiones registradas; resoluciones de escritorio/móvil y teclado. Dispositivos reales seleccionados para verificación manual. |
| Regresión | Repetir riesgos/funciones afectados en cada PR y sprint; conjunto acumulado antes de entrega y humo tras despliegue. |

BDD: historia → escenarios Dado/Cuando/Entonces → datos/oráculo → TC → automatización. Usar particiones de equivalencia, análisis de límites, tablas de decisión, transiciones y exploración dirigida por riesgos. No exigir cubrir combinaciones infinitas; documentar selección y riesgos residuales.

## 6. Inventario, trazabilidad y meta de Pest

El [catálogo de 140 casos](plan-pruebas-v2/CATALOGO-TC.md) conserva TC-001…TC-118 y, desde el 6 de octubre de 2026, añade TC-119…TC-135 del [Módulo A](plan-pruebas-v2/modulo-a/CASOS-Modulo-A-Gestion-Solicitud.md) y TC-136…TC-140 de la [cobertura RF/RNF](plan-pruebas-v2/Matriz-RF-RNF-Cobertura.md), con sus HU, RF/RNF, criterios, datos, resultados esperados y pendientes. La [matriz CSV](plan-pruebas-v2/Matriz-Trazabilidad-TC.csv) permite filtrar por sprint/herramienta. Clasificación de planificación, **no de resultados obtenidos**:

- **111 casos de backend candidatos a Pest** (95 de la línea base + 12 del Módulo A + 4 de cobertura RF/RNF), incluidos unitarios e integración/API. TC-122, TC-123, TC-130 y TC-140 están bloqueados por P10/P17/P15; TC-133 está condicionado por P05/P16 y TC-138 por las reglas de capas del diseño.
- **1 caso híbrido, TC-056:** autorización de canal con Pest más conexión/subscripción real; no sumarlo a la cuota de backend hasta especificar y ejecutar la cobertura completa requerida. El intento de suscripción debe fallar realmente, no solo devolver un 403 simulado.
- **28 casos con otras herramientas** (22 + 5 del Módulo A + 1 de cobertura RF/RNF; TC-136 condicionado por P21), detallados en el catálogo y §7.
- Las familias CRUD, temporales y pruebas adicionales de riesgos se agregan con identificadores nuevos, sin renumerar la línea base.

La meta mínima se calcula como **número de IDs únicos implementados en Pest y aprobados en la ejecución del incremento final**. No contar assertions, datasets del mismo ID, reruns, casos omitidos, vacíos, `todo`, tests que únicamente comprueban `true` ni pruebas Cypress como pruebas Pest. Una suite PHPUnit existente no satisface automáticamente la exigencia de Pest: registrar implementación real y runner.

**Regla final:** mínimo 60 IDs Pest distintos aprobados; cero fallos, errores, pruebas incompletas o skips en los casos comprometidos; casos de alto riesgo y todos los requisitos obligatorios cubiertos/aprobados. Los 111 candidatos no autorizan escoger solo los 60 fáciles: el resto comprometido sigue exigible. Los casos condicionados se resuelven antes de aceptación; no eliminar el pendiente para obtener una cifra verde.

Nombre previsto: `test('TC-002 — rechaza correo duplicado sin crear otro usuario', ...)`. TC-002 es el identificador vigente equivalente al formato ilustrativo TC-02 solicitado; no se crea otro caso por cambiar ceros. Cada test conserva Dado/Cuando/Entonces como preparación/acción/aserciones. Una misma HU puede tener casos Pest y Cypress diferentes, enlazados por criterio.

## 7. Herramientas, ejecución y límites de automatización

| Herramienta | Uso y límites |
|---|---|
| Pest + Laravel | Unitarias, API e integración backend. Aserciones de validación, mensajes JSON, DB, permisos, jobs y auditoría. No acredita por sí solo que React muestre el mensaje o gestione el foco. |
| Cypress | E2E, interacción, confirmación, mensajes DOM, navegación, errores/reconexión y compatibilidad Chrome/Edge/Firefox. Requiere los navegadores instalados y versiones registradas. |
| k6, opción propuesta del plan | Carga HTTP y escenarios concurrentes con estado; checks de integridad y thresholds explícitos. JMeter puede reemplazarlo si se acuerda antes de medir, preservando escenario y métricas; no es obligatorio duplicar suites. |
| SonarQube | Análisis de código y Gate por PR/sprint; consume cobertura producida por pruebas. No ejecuta el flujo de negocio ni demuestra usabilidad o seguridad completa. |
| Revisión humana / scripts operativos | SUS, percepción, accesibilidad exploratoria, auditoría de evidencias, TLS, restauración, despliegue y observación de disponibilidad. |

Las referencias oficiales confirman ejecución Laravel mediante [Artisan](https://laravel.com/docs/12.x/testing), nombres/descripciones de [Pest](https://pestphp.com/docs/writing-tests) y uso de varios navegadores con [Cypress](https://docs.cypress.io/app/guides/cross-browser-testing). La asignación a herramientas es una decisión del proyecto; no afirma que no existan extensiones de navegador para Pest.

### 7.1 Qué no se verifica con Pest de backend

| Casos / objetivo | Herramienta que completa la prueba |
|---|---|
| TC-001/005/012/013/014/027/028/059/067/080/107/109; texto visible, confirmaciones, validación React y foco de todas las familias CRUD | Cypress. Pest puede verificar API/DB, pero no sustituye la interacción ni el resultado visual. |
| TC-055 y parte de TC-056; conexión WSS, suscripción privada y reconexión Echo | Cypress/cliente de WebSocket con Reverb y proxy reales; Pest complementa la autorización HTTP. No fingir transporte real usando solo `Event::fake`. |
| TC-113/114; 200 usuarios y tiempos bajo carga | k6 o JMeter. Ejecutar Pest en paralelo acelera tests aislados, no reproduce automáticamente usuarios concurrentes sobre el mismo servidor. |
| TC-110; TLS, puertos, secretos y configuración efectiva desplegada | Scripts/inspección de seguridad y CI sobre el entorno; Pest cubre permisos/validación de aplicación. |
| TC-111/112; Gate y bloqueo de integración | SonarQube + CI; verificar estado del análisis y que un Gate fallido impida entrega. |
| TC-115/116; SUS, tiempo de uso humano y reducción de búsqueda | Estudio con participantes y protocolo aprobado; Cypress no produce una percepción humana válida ni demuestra beneficio local. |
| TC-117; recuperación y humo tras restauración | Scripts de operación + Cypress sobre base restaurada y revisión de integridad. |
| TC-118; disponibilidad observada | Sonda programada durante una ventana real; no sustituir por reloj simulado ni un test rápido. |
| Diseño visual de PDF/Excel de TC-097/101, legibilidad y dispositivos reales | API/Pest comprueba estructura/contenido/permiso; revisión visual complementaria y Cypress para descarga. |

### 7.2 Comandos previstos para el ejecutor

Son procedimientos para cuando estén instaladas las dependencias y configurado el entorno de pruebas. En los manifiestos actuales revisados aparecen PHPUnit/Vitest; no se observó Pest/Cypress declarados como dependencias directas. Debe completarse esa preparación antes de ejecutar este plan; esta entrega no instala herramientas ni ejecuta tests.

Desde `backend/api`, después de comprobar conexión a una base exclusiva de pruebas y credenciales restringidas:

```powershell
php artisan test --env=testing
php artisan test --env=testing --filter=TC-002
New-Item -ItemType Directory -Force -Path test-results
php artisan test --env=testing --log-junit=test-results/pest.xml --coverage-clover=test-results/clover.xml
```

La primera orden ejecuta la suite; la segunda selecciona el caso; la tercera prepara la salida y la cuarta captura evidencia. La cobertura requiere driver compatible (Xdebug/PCOV). No aplicar un `--min=70` global si el umbral aprobado solo corresponde a matching/notificación/calificación. Conservar exit code y salida; un fallo del generador de reportes no convierte el test en aprobado.

Desde `frontend/web`, con la `baseUrl` local de pruebas configurada:

```powershell
npx cypress run --browser chrome
npx cypress run --browser edge
npx cypress run --browser firefox
```

Para el perfil remoto, reemplazar explícitamente el dominio ilustrativo por el servidor académico de pruebas autorizado y preparar datos exclusivos:

```powershell
npx cypress run --browser chrome --config baseUrl=https://pruebas.tecnicoya.example
```

No añadir rutas de test públicas para resetear datos o alterar tiempo. Scripts k6, configuración de CI y scanner SonarQube se versionarán cuando se implementen; su ruta y argumentos quedarán en el informe. No se presentan aquí comandos que supongan archivos de carga o configuración inexistentes.

## 8. Entornos, configuración y datos sintéticos

| Entorno | Composición / propósito | Control requerido |
|---|---|---|
| Local/CI de pruebas | React, API Laravel, MySQL de versión objetivo, almacenamiento temporal; drivers controlados y reloj inyectable. | `.env.testing` y conexiones aisladas; verificación que impida apuntar a DB de demostración/producción. |
| Integración | MySQL, cola persistente, workers de dominio/entrega, scheduler y Reverb/Echo reales. | No sustituir por cola síncrona cuando se verifica entrega/reintento/concurrencia. |
| Servidor de preproducción/demostración académica | Imágenes Docker Compose, React compilado, proxy HTTPS/WSS y servicios reales. | Registrar commit, digest, versiones, recursos, región/red y configuración sin secretos. Misma versión funcional que la entrega. |
| Carga | Despliegue aislado y equivalente al objetivo; generador de carga separado. | Presupuesto de CPU/RAM/disco/conexiones documentado; sin carga contra usuarios reales. |

Los servicios se basan en P2: gateway, API, MySQL, worker-domain, worker-delivery, scheduler y Reverb. SonarQube usa su entorno compatible propio; no asumir que su base interna es MySQL. Fijar matriz de versiones, lockfiles, zona UTC y presentación America/Lima. Configuración del reloj, políticas y reglas cargadas se registra por ejecución.

Datasets versionados: cliente A/B, técnico pendiente/activo/inactivo/suspendido, administrador autorizado/restringido, tres especialidades y catálogo semilla; técnicos elegibles/no elegibles por cada filtro, tarifas controladas, reseñas conocidas, solapamientos y solicitudes en todos los estados. Correos `example.test`, nombres ficticios, documentos y fotos sintéticos sin personas identificables; notificaciones a sandbox, nunca a teléfonos reales.

Fijar seed de Faker, versión del dataset y archivos; no versionar contraseñas/token. Tarifas e importes son ficticios, en la moneda que se ratifique. Para carga crear al menos 200 cuentas/sesiones distintas y suficientes técnicos/solicitudes según el escenario, sin que el agotamiento accidental de fixtures falsee el resultado.

Antes de cada prueba comprobar precondición; después limpiar solo recursos del run. Las pruebas de carrera requieren filas compartidas, commits reales y al menos dos conexiones/procesos sincronizados: no encerrar todo en una transacción aislada por proceso y llamarlo prueba de competencia. SQLite no reemplaza MySQL para FK, precisión, bloqueos o transacciones.

## 9. CRUD: alertas, validaciones y persistencia

### 9.1 Matriz mínima para cada operación permitida

| Familia | Entrada/acción | Comprobación obligatoria | Herramienta |
|---|---|---|---|
| CRUD-01 | Crear/editar/eliminar autorizado y válido | Resultado persistido correcto, mensaje español visible, lista/detalle consistente tras recargar, sin duplicados. | Pest para persistencia + Cypress para interfaz. |
| CRUD-02 | Operación rechazada, 403/409/422/500 controlado | Mensaje tratable y ningún éxito falso; datos intactos cuando el servidor rechazó sin commit. | Pest + Cypress. |
| CRUD-03 | Eliminar recurso eliminable | Confirmación antes de la petición; cancelar no emite eliminación; confirmar respeta permisos y muestra resultado. | Cypress; API/Pest comprueba autorización/integridad. |
| VAL-01 | Formulario incompleto/incorrecto | Errores de campo en español, foco/etiqueta accesible y ausencia de petición de guardado. | Cypress. |
| VAL-02 | API directa eludiendo React | Laravel rechaza datos inválidos, mensaje de validación español y ausencia de escrituras parciales. | Pest + MySQL. |
| AUTH-01 | Rol o propietario no permitido | Denegación efectiva, sin cambio ni filtración de datos. | Pest; Cypress verifica mensaje/recuperación. |
| NET-01 | Red cae después de enviar, resultado incierto | No afirmar fracaso/rollback sin comprobar: informar incertidumbre, consultar estado y reintentar con la misma idempotencia cuando aplique. | Cypress + API real/inyección controlada. |

Además: fallo del almacenamiento de evidencias, CSRF/sesión vencida, duplicado de envío, versión obsoleta, archivo inválido, longitud y límites de parámetros. Los mensajes técnicos internos no se muestran al cliente. No se borra información para satisfacer el término CRUD: el recurso debe permitir esa operación según el alcance aprobado.

### 9.2 Inventario de formularios/recursos por sprint

| Sprint | Formularios y comandos a inventariar | Restricción / pruebas |
|---|---|---|
| 1 | Registro cliente/técnico, login/logout, perfil propio | Alta/edición, duplicados, estado pendiente y errores de sesión. Sin registro público admin ni eliminación arbitraria de cuenta. |
| 2 | Categorías/subcategorías/foto, comunicados/audiencia/vigencia, revisión técnica/documentos, perfil/portafolio, disponibilidad/zonas/pausa, servicios/tarifas | Catálogo: alta/edición/activación/desactivación conservando historial. Comunicados: eliminación confirmada según contrato. Otras eliminaciones solo si la HU lo autoriza; documentar el no aplica. |
| 3 | Solicitud en cinco pasos, evidencia, ubicación, envío automático/desde perfil | Validación por paso y final, cobertura, propiedad de foto y envío idempotente. No crear una edición/eliminación de solicitud enviada fuera de regla. |
| 4 | Aceptar/rechazar oferta, elegir técnico | Alertas de SLA, oferta vencida, conflicto y conexión. Ranking/jobs son procesos; sus fallos deben notificarse sin fingir un CRUD de usuario. |
| 5 | Inicio/fin de atención, reprogramación, técnico adicional, cancelación/incidencia | Cambios de estado, validación y motivo; cancelar no borra historial. |
| 6 | Calificar/editar, responder, apelar y resolver | Puntaje, texto, plazo y versión. Anular no destruye historial. |
| 7 | Reasignación manual, clientes/bloqueos, tickets, parámetros/pesos, cuentas admin y filtros de reportes | Motivos, permiso específico, auditoría, suma 100 y versión. No existe CRUD ordinario de auditoría. |
| 8 | Método/registro simulado, preferencias, tickets de ayuda | Sin procesamiento financiero real; sin pago/comprobante ajeno ni silenciamiento de alertas obligatorias. |

Crear antes de automatizar un registro de **todas las alertas implementadas**, no solo ejemplos: ID `AL-SNN-recurso-accion-resultado`, actor, HU, disparador, mensaje, persistencia esperada, TC/API/UI, ejecución local y en servidor. El [CSV de plantilla](plan-pruebas-v2/Plantilla-Registro-Alertas.csv) se completa con el inventario real. La cobertura de alertas exige probar todos sus estados aplicables, no únicamente mostrar un toast de éxito.

Los IDs nuevos siguen la adenda: `TC-AD-SNN-CRUD-01-<recurso>-<accion>`, `TC-AD-SNN-VAL-02-<formulario>`, etc. Si se separa la prueba visible de la API, añadir sufijo `-UI`/`-API` y enlazar ambas. Eliminar no aplicable se justifica con la regla, no con una prueba vacía.

## 10. Relojes, valores límite y procesos asíncronos

Los valores 10 minutos, 24 horas y 48 horas están definidos. P12/P23 mantienen pendiente la frontera exacta y ciertos anclajes. La formalización propone validez en **[inicio, vencimiento)**: aceptar antes y rechazar exactamente al llegar. Los casos exactos se diseñan con esa propuesta, pero permanecen condicionados hasta su aprobación; no se presenta como regla nueva aprobada.

| Familia temporal nueva / casos existentes | Valores de ensayo | Oráculo |
|---|---|---|
| TC-TIME-SLA; TC-047/048 | 09:59, 10:00, 10:01; además deadline−1 μs, deadline y deadline+1 μs cuando la precisión lo permita | Antes válido, después rechazado; exacto condicionado P12. Hora de validación del servidor, no la del clic del usuario. |
| TC-TIME-PEND; TC-053/054 | 23:59 h, 24:00 h, 24:01 h | Antes permanece pendiente si no hay candidato; después expira solo si sigue pendiente y la generación corresponde; exacto P12. |
| TC-TIME-RATE; TC-073/077/078 | 47:59 h, 48:00 h, 48:01 h desde finalización de la participación | Antes permite primera calificación, después rechaza y el proceso cierra sin calificar si procede. Exacto condicionado. |
| TC-TIME-EDIT; TC-075/076 | 47:59 h, 48:00 h, 48:01 h desde primera calificación | Edición independiente de la ventana inicial; antes permite, después rechaza; exacto/no renovación sujeto a P23. |
| TC-TIME-STALE; TC-058/062/084 | Job antiguo, evento repetido, dos ejecuciones y worker retrasado | No modifica nueva generación/versión, no duplica asignación/cierre ni amplía plazo. |
| TC-TIME-PARAM | Parámetros sintéticos alternativos válidos y nueva versión | Se usan valores persistidos; efecto sobre solicitudes abiertas condicionado P19. No hardcodear 10/24/48 en la lógica. |

Las expresiones 23:59 y 47:59 significan horas:minutos; SLA 09:59 significa minutos:segundos. Definir precisión y zona en fixtures; no mezclar límites por truncamiento visual.

**Pest:** inyectar `Clock` de prueba y congelar UTC; crear la entidad mediante su flujo, avanzar el reloj al punto elegido, invocar caso de uso/job y verificar estado/eventos/deadline en MySQL. Las utilidades [de tiempo de Laravel](https://laravel.com/docs/12.x/mocking#interacting-with-time) facilitan ensayos del proceso PHP, pero no cambian por sí solas el reloj de MySQL ni de otros workers. Restaurar el reloj al finalizar. Evitar `sleep` de 10 minutos/24/48 horas.

**Integración:** los procesos separados usan el mismo proveedor de tiempo controlado o fixtures con fechas de origen coherentes. Probar el scheduler/worker real con registros sintéticos ya vencidos; medir retraso de procesamiento por separado del plazo de negocio. Aunque el worker llegue tarde, la API debe impedir una aceptación tardía.

**Cypress:** [`cy.clock()`/`cy.tick()`](https://docs.cypress.io/api/commands/clock) comprueban cronómetro y presentación. No vencen automáticamente una oferta en el backend. Preparar el estado por utilidades privadas del entorno aislado y recuperar estado real por API. Probar navegador con reloj incorrecto y reconexión sin reinicio del plazo.

No manipular el reloj global del servidor desplegado ni habilitar endpoints públicos de viaje temporal. Para pruebas remotas usar fixtures privados con timestamps calculados y el scheduler real; complementar con una oferta de 10 minutos de duración real para comprobar la integración temporal. La disponibilidad de siete días no se acelera mediante estas técnicas.

## 11. Rendimiento, compatibilidad, usabilidad y calidad de código

### 11.1 Protocolo de carga propuesto

k6 será la primera opción de implementación, sujeto a revisión del equipo. Escenario preliminar: calentamiento, rampa de 0 a 200 usuarios virtuales en 2 minutos, meseta de 10 minutos, recuperación de 2 minutos. Mezcla propuesta: 50 % consulta/listado, 25 % creación/envío, 15 % respuesta/estado y 10 % otras acciones autorizadas; introducir pausas de usuario y cuentas por rol. Duración, mezcla, volumen de candidatos y recursos del servidor deben ratificarse en P21 antes de declarar cumplimiento.

Probar aparte TC-114 con solicitudes que compiten de forma intencionada por la misma franja/técnico. Los 409 esperados por una competencia válida no son errores de disponibilidad; se etiquetan y se comprueba que no exista doble reserva. Un 500 inesperado no se reclasifica como éxito.

Registrar latencia de extremo a extremo del matching y tiempo interno, p50/p95/p99/máximo, throughput, errores, CPU/RAM, conexiones/locks MySQL, profundidad de cola y retraso de jobs. RNF-01 conserva **3 s o menos** y RNF-02 **200 usuarios concurrentes**: reportar excedencias individuales y el máximo observado; no declarar cumplimiento únicamente por un promedio o p95 favorable. El estadístico/protocolo definitivo sigue pendiente P21.

Configurar checks de contenido/estado e integridad y thresholds de aceptación aprobados; un check fallido no hace fallar automáticamente una corrida k6 sin el control correspondiente. [Referencia oficial de thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/). Abortar carga si se detecta corrupción, agotamiento crítico o impacto fuera del entorno autorizado; conservar el resultado fallido y diagnosticar.

### 11.2 Compatibilidad y usabilidad

Chrome, Edge y Firefox: registrar versiones instaladas y SO; repetir flujos críticos y alertas por navegador. Resoluciones propuestas para revisión: 360×800, 768×1024 y 1366×768. La emulación de viewport no acredita un teléfono real: complementar con dispositivo disponible, teclado, foco, lectura de errores, zoom y movimiento reducido.

Usabilidad: TC-115 mide cinco pasos y mediana ≤3 minutos, además de SUS ≥70, con protocolo y participantes ratificados P09/P21. Registrar tareas, ayuda permitida, abandonos y resultados individuales anonimizados. TC-116 contrasta búsqueda/asignación con el procedimiento de comparación acordado; la reducción objetivo del 30 % no se infiere de la velocidad de la API.

### 11.3 SonarQube y controles DevSecOps

Cada PR y cada sprint necesita Gate aprobado sobre su commit final. Registrar proyecto/análisis, política, definición de código nuevo, fecha, commit, cobertura, duplicación, hallazgos de fiabilidad/seguridad/mantenibilidad y hotspots revisados/pendientes. Los nombres y métricas disponibles se documentan según la edición instalada; no se presuponen capacidades comerciales.

La cobertura RNF-12 ≥70 % del núcleo matching/notificación/calificación sigue vigente; unidad de medida y agregación se ratifican en P21. Propuesta de implementación: reportar líneas ejecutables cubiertas por cada módulo y agregado; no mezclar cobertura de requisitos con cobertura de código ni imponer 80 % global sin aprobación. Todos los umbrales del Gate se versionan antes del primer merge, sin rebajarlos para aprobar una entrega fallida.

SonarQube recibe los reportes de cobertura; el Gate evalúa su política y no sustituye las pruebas funcionales. [Quality Gates](https://docs.sonarsource.com/sonarqube-server/2026.1/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates) y [definición de métricas](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition). Si hay proyectos separados de frontend/backend, ambos deben corresponder al incremento y aprobar. Conservar también revisión de secretos/dependencias y autorización; Gate verde no significa ausencia total de vulnerabilidades.

## 12. Repetición sobre el servidor desplegado

Se repite después de cada despliegue de incremento, corrección relevante y restauración. En S8 se exige la campaña completa sobre el artefacto final, con cuentas/datos sintéticos y servicios reales. Distinguir **humo remoto**, **aceptación remota** y **fallos inducidos en preproducción aislada**.

| Campaña | Recorrido y alertas que deben activarse |
|---|---|
| SRV-01 · Preparación y sesión | Salud, HTTPS/WSS, build/commit, roles, login inválido/sesión vencida, permisos, navegación y datos de otra cuenta denegados. |
| SRV-02 · Flujo completo | Técnico registrado → pendiente → verificación admin → oferta/disponibilidad/tarifa → cliente registrado → solicitud cinco pasos → matching → ofertas → aceptación técnica → elección cliente → asignación → atención → finalización → calificación/historial; comprobar cada confirmación visible. |
| SRV-03 · Alternativas temporales | Rechazo/silencio, SLA vencido, siguiente ronda, ausencia de candidatos, pendiente/expirada; calificación y edición fuera de ventana, cierre sin calificar. Usar fixtures privados y scheduler real según §10. |
| SRV-04 · Seguimiento y supervisión | Reprogramación, conflictos, cancelación permitida, técnico adicional, contacto tras asignación, apelación/resolución, reasignación manual, bloqueo y auditoría. |
| SRV-05 · CRUD y validación exhaustiva | Recorrer todos los IDs AL del registro: éxito, validación cliente/servidor, errores, confirmación de eliminación, cancelar confirmación y conflictos aplicables. Conciliar inventario con resultado por alerta. |
| SRV-06 · Tiempo real | Dos sesiones independientes, evento privado autorizado, canal ajeno denegado, reconexión, duplicado y estado recuperado por API; no reiniciar SLA. |
| SRV-07 · Complementos | Comunicados por audiencia/vigencia, soporte, preferencias, exportaciones y constancia inequívocamente simulada; descargas privadas protegidas. |
| SRV-08 · Operación | Restauración de copia sintética en entorno separado, migraciones previstas, humo del flujo, jobs y archivos; disponibilidad según ventana real aprobada. |

Las alertas de fallo de almacenamiento, entrega, auditoría o caída de servicios se inducen **en preproducción aislada del mismo release**, nunca provocando indisponibilidad a usuarios reales. Documentar el entorno concreto: no afirmar que se probaron en el servidor final si solo se ejecutaron con mocks locales. Los cambios destructivos se limitan a registros identificados del run, cuando la operación esté autorizada.

Cypress puede alternar identidades de cliente/técnico/admin en el recorrido. La prueba de sesiones realmente concurrentes/Reverb requiere clientes independientes o procesos coordinados; un único navegador secuencial no demuestra concurrencia.

No ejecutar `migrate:fresh`, resets de DB ni la suite con `RefreshDatabase` contra la base del servidor de demostración. El humo remoto usa HTTP/UI y limpieza específica; Pest destructivo permanece en base desechable. Si una campaña falla: registrar defecto, detener promoción, conservar evidencia y aplicar recuperación acordada; no sobrescribir el resultado con una captura posterior exitosa.

## 13. Criterios de entrada, salida, suspensión y reanudación

**Entrada por historia/sprint:** HU y TC trazados; decisiones Pxx que condicionan su resultado resueltas; Gherkin previo al código; build instalable con commit conocido; dependencias/fixtures/entorno listos; permisos y aislamiento comprobados; contrato y migraciones versionados; pruebas previas críticas aprobadas. Un caso puede diseñarse con un pendiente, pero no aceptarse como comportamiento correcto mientras no se cierre.

**Salida por sprint:** todos los casos comprometidos ejecutados y aprobados; requisitos/riesgos afectados cubiertos; sin fallos bloqueantes de seguridad/integridad ni defectos críticos/altos abiertos; defectos menores documentados y decisión registrada; regresión afectada aprobada; evidencias completas; revisión cruzada y aceptación del incremento. Se añaden literalmente los controles docentes:

- Los CRUD del sprint muestran sus alertas y tienen prueba automatizada.
- El análisis de SonarQube del sprint está aprobado.

**Salida final S8:** al menos 60 IDs Pest aprobados sin errores en el commit final, junto al resto de casos obligatorios del plan; campaña remota completa; todas las alertas aplicables con ejecución identificada; compatibilidad aprobada; carga, usabilidad y disponibilidad evaluadas según protocolos ratificados; recuperación demostrada; Gates finales aprobados y riesgos residuales aceptados. Si falta una medición obligatoria, se informa entrega incompleta y no se declara RNF cumplido.

**Suspender:** riesgo de modificar datos no sintéticos, fuga de secretos, corrupción, entorno no fiable, fallo de autenticación/base que impide el resto, reloj incoherente, defecto bloqueante o pérdida de trazabilidad. No continuar acumulando falsos fallos derivados de un entorno roto.

**Reanudar:** causa corregida y revisada, entorno/datos restablecidos, nuevo commit identificado y humo aprobado; repetir casos afectados y regresión dependiente. Conservar ejecuciones previas. Las excepciones requieren registro; no omitir la meta de Pest, las alertas o el Gate sin una instrucción explícita que cambie el requisito.

## 14. Defectos, comunicación y métricas

Severidad propuesta: crítica = exposición grave/corrupción/escalamiento; alta = flujo esencial imposible o regla clave incorrecta; media = función afectada con alternativa; baja = defecto menor sin pérdida de integridad. Prioridad de corrección se decide con impacto/riesgo y sprint. Un defecto debe incluir TC/HU, entorno/commit, pasos/datos, esperado/real, evidencia sanitizada, severidad, asignado, causa/corrección y retest/regresión.

Comunicación: actualizar estado diariamente durante el sprint; comunicar inmediatamente bloqueos y riesgos críticos al equipo/asesor por el canal acordado; revisar métricas en Review y causas en Retrospective. Se utiliza repositorio/PR y evidencias; no se presupone que una notificación haya sido enviada.

| Métrica | Cálculo / criterio | Estado en esta entrega |
|---|---|---|
| Pest aprobado | IDs distintos con resultado aprobado en ejecución final; meta ≥60, sin fallos/errores en suite comprometida. | NO EJECUTADO. |
| Avance de ejecución | (Aprobados + fallidos) / planificados aplicables; mostrar bloqueados y no ejecutados aparte. | Por medir. |
| Tasa de aprobación | Aprobados / ejecutados, por herramienta/sprint/riesgo; no ocultar skips. | Por medir. |
| Cobertura de requisitos | RF/RNF obligatorios con casos aprobados / obligatorios aplicables; criterio final: todos cubiertos por evidencia apropiada. | Por medir. |
| Cobertura de alertas | Pares alerta/estado aplicables probados y aprobados / inventario aplicable; objetivo final 100 %. | Inventario por completar. |
| Doble validación | Formularios persistentes con negativo cliente y servidor aprobados / formularios persistentes aplicables; objetivo 100 %. | Por medir. |
| Defectos | Abiertos/cerrados/reabiertos por severidad, antigüedad y regresiones; cero críticos/altos para salida. | No inferir cero defectos por no ejecutar. |
| SonarQube | Estado Gate, commit, cobertura general/nueva, duplicación, hallazgos y revisión de hotspots, política/versiones. | NO ANALIZADO; sin porcentajes inventados. |
| Cobertura de núcleo | Líneas/ramas según definición P21; meta ≥70 % en ámbito acordado. | No calculada. |
| Matching/carga | Latencias p50/p95/p99/máximo, excedencias de 3 s, concurrencia 200, errores inesperados, throughput e integridad. | Protocolo P21 por ratificar. |
| Usabilidad | SUS ≥70; cinco pasos y mediana ≤3 min; registrar muestra/protocolo. | NO EVALUADO. |
| Beneficio | (Tiempo base − tiempo con TécnicoYa) / tiempo base ×100; objetivo ≥30 % con medición comparable. | NO EVALUADO. |
| Disponibilidad | Tiempo disponible / tiempo observado válido ×100, objetivo ≥99 %. Ventana/muestreo/mantenimiento según P09/P21. | NO OBSERVADA; huecos de sonda no cuentan como disponible. |
| Fiabilidad asíncrona | Retraso de jobs, duplicados efectivos, pérdida de avisos y reintentos; cero duplicaciones incompatibles. | Por medir; tolerancia operativa por acordar. |

## 15. Responsables y calendario por sprint

### 15.1 Responsabilidades propuestas de pruebas

La distribución de módulos A–F aún no está confirmada en P10. La tabla siguiente es una **propuesta de responsabilidades de pruebas**, no una asignación definitiva de desarrollo. Cada integrante implementa pruebas de sus módulos cuando se acuerden y revisa el trabajo de otro; no aprueba su propia evidencia sin revisión cruzada.

| Integrante | Responsabilidad propuesta | Colaboración / revisión |
|---|---|---|
| Jesus Oscar Delgado Janampa | Coordinar catálogo/riesgos y pruebas Pest de backend, integridad y reglas. | Mayhuasca revisa criterios de usuario; Pimentel revisa integración/entorno. |
| Karen Jandre Mayhuasca Huanca | Coordinar Cypress, inventario de alertas, compatibilidad y sesiones de usabilidad. | Delgado contrasta persistencia/permisos; Pimentel acompaña ejecución remota. |
| James Pimentel Chumbes | Coordinar entornos/CI, SonarQube, carga, despliegue, recuperación y consolidación de evidencias. | Delgado/Mayhuasca revisan resultados y correspondencia con commit/criterios. |
| Asesor / responsable académico | Revisar alcance, pendientes y aceptación de incrementos según gobierno del proyecto. | No sustituye al ejecutor ni convierte un test fallido en aprobado. |

### 15.2 Calendario relativo

Fechas y duración no están aprobadas: se expresan por sprint y momento, sin inventar semanas. La meta académica de demostración hacia semana 12 sigue sujeta al calendario ratificado. BDD/diseño al refinar; unitarias/API/UI durante desarrollo; integración y Gate en cada PR; regresión y revisión antes de terminar el sprint.

| Iteración | Foco de pruebas / dependencia | Candidatos Pest nuevo / acumulado | Ejecutables nuevo / acumulado | Otras pruebas y salida |
|---|---|---|---|---|
| 0 | Instalación compatible, aislamiento, health y preparación de reportes. | 0 / 0 | 0 / 0 | Verificación del entorno; no contar salud de instalación como 60 casos de negocio. |
| 1 | Registro, roles, perfiles, catálogo semilla; patrón de validación/alertas. | 10 / 10 | 10 / 10 | 3 E2E base; Gate S1 y primer inventario AL. |
| 2 | Catálogo/comunicados, verificación, portafolio, disponibilidad y tarifas. | 13 / 23 | 12 / 22 | 2 E2E base más matriz CRUD; Gate S2. |
| 3 | Cinco pasos, archivos, cobertura y búsqueda. | 19 / 42 | 16 / 38 | 2 E2E base más negativos de formularios; Gate S3. |
| 4 | Matching, SLA, rondas, pendientes, concurrencia y eventos. | 21 / 63 | 16 / 54 | TC-055 y TC-056 híbrido; límites/reconexión; Gate S4. |
| 5 | Agenda, atención, reprogramación y cierre. | 12 / 75 | 9 / 63 | 2 E2E base, integración con S4 y alertas; Gate S5. |
| 6 | Calificación, edición, historial y apelaciones. | 13 / 88 | 8 / 71 | TC-080 y resto de UI aplicable; Gate S6. |
| 7 | Reasignación manual, reglas, soporte, bloqueos, reportes y auditoría. | 14 / 102 | 9 / 80 | Extensión E2E de administración y pruebas CRUD; Gate S7. |
| 8 | Simulación económica, preferencias, regresión y entrega. | 9 / 111 | 5 / 85 | Resto de campañas E2E, carga, aceptación, recuperación, disponibilidad y Gate final. |

Cifras calculadas desde la [matriz CSV](plan-pruebas-v2/Matriz-Trazabilidad-TC.csv) (TC-001…TC-140): 111 candidatos Pest, de los cuales 4 están bloqueados (TC-122, TC-123, TC-130, TC-140) y 22 condicionados por pendientes Pxx; quedan 85 ejecutables. Con los ejecutables, la meta de 60 se alcanza al cerrar S5 (63); con todos los candidatos, al cerrar S4 (63). Las cifras son distribución documental de los candidatos, no compromiso de que ya pasen ni cuotas para fabricar pruebas. El total aumenta con escenarios CRUD/límite necesarios. TC-056 se reporta aparte para no contar una comprobación parcial como caso completo. Resolver dependencias Pxx y capacidad antes de comprometer pruebas; no mover sprints silenciosamente.

## 16. Evidencias, informe de ejecución y conservación

Evidencia canónica: `docs/documentacion/evidencias/sprint-NN/<run-id>/`, con catálogo ejecutado, logs/runner, cobertura, defectos, capturas necesarias, análisis SonarQube y manifiesto de entorno. Enlazar los resultados por TC desde la estructura ya prevista del sprint; evitar copias divergentes. Avance individual: `docs/avances/<integrante>/sprint-NN/avance.md`, con enlaces a la evidencia y PR/commit según P10.

El **informe de ejecución se completa después de correr las pruebas**, usando [esta plantilla](plan-pruebas-v2/PLANTILLA-Informe-Ejecucion.md). Debe contener:

1. Identificación del run, plan/versión, sprint, responsable, revisor, fechas, commit y artefacto desplegado.
2. Alcance ejecutado/excluido, cambios respecto del plan y pendientes de requisitos.
3. Entorno y datos: versiones, recursos, configuración sin secretos, dataset, reglas y reloj.
4. Preparación, comandos reales, parámetros, orden y logs con exit codes.
5. Resultado por TC/HU/RF: esperado, obtenido, estado, duración, evidencia y defecto.
6. Resumen de Pest y otras herramientas, sin duplicar IDs/datasets; skips/bloqueos diferenciados.
7. Alertas/validaciones: inventario, resultado local y remoto por estado y formulario.
8. Rendimiento, compatibilidad, usabilidad y disponibilidad con protocolos/resultados reales.
9. SonarQube: análisis, Gate, commit, política y métricas; hallazgos y tratamiento.
10. Incidentes, correcciones, repeticiones/regresión y riesgos residuales.
11. Evaluación de entrada/salida/DoD, cumplimiento/no cumplimiento por criterio y decisión de entrega.
12. Revisión, aprobación, anexos y enlaces al avance individual.

Estados permitidos: NO EJECUTADO, EN EJECUCIÓN, APROBADO, FALLIDO, BLOQUEADO y NO APLICA justificado. Conservar resultado inicial y retest por run; no editar un fallo para hacerlo desaparecer. Evidencias privadas con acceso restringido, sin credenciales ni datos reales; retención definitiva sujeta a P08. Registrar ubicación/huella de artefactos para verificar integridad.

## 17. Pendientes de aprobación que condicionan ejecución

- P12/P23: frontera exacta, anclajes temporales y comportamiento de rondas/edición. P15: normalización, empate persistente y datos insuficientes. P19: vigencia de nuevas reglas sobre solicitudes abiertas.
- P03/P05/P06/P07/P13/P14/P16/P18/P20/P22: cerrar la decisión concreta antes de aceptar casos de cobertura, agenda, apelación, técnicos adicionales, cancelación, tarifas, sanciones y estados que dependan de ella; consultar el pendiente detallado del catálogo.
- P09/P21: protocolo de carga, usabilidad, observación y cobertura/Gate. La meta de ≥60 Pest y pruebas de alertas por sprint proviene de instrucciones explícitas y no queda opcional.
- Distribución de módulos y responsabilidades nominales de pruebas, fechas/capacidad y versión instalada de herramientas. Artículo IA + Scrum de P8 aún por identificar; no es evidencia de resultados del plan.

**Entrega documental:** plan, catálogo conservando 118 TC, matriz exportable y plantillas de ejecución/alertas. No se modificaron reglas de negocio ni se implementaron o ejecutaron pruebas en esta solicitud.
