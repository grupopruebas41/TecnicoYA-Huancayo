# Reglas de programación del proyecto

**Proyecto:** TécnicoYa Huancayo · MVP  
**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026  
**Aplicación:** preparación del Sprint 1 y desarrollo de los ocho sprints aprobados.  
**Estado:** documento ampliado a partir de las reglas del usuario. Define políticas; no acredita que los controles estén configurados o que el código existente ya los cumpla.

## 1. Propósito y autoridad de las fuentes

Desarrollar el MVP con comportamiento verificable, seguridad, privacidad y código mantenible, evitando completar requisitos por inferencia.

- Las instrucciones explícitas más recientes del usuario prevalecen sobre documentos anteriores.
- Fuente 0, aclaraciones, CANVAS de análisis, diseño técnico, diccionario, backlog y plan de sprints determinan el alcance. Ante contradicciones, registrar la diferencia y resolverla antes de implementar el comportamiento afectado.
- Ninguna decisión marcada como pendiente se convierte en requisito aprobado por conveniencia técnica. Registrar pregunta, alternativas, impacto y resolución; continuar con el trabajo independiente.
- No incorporar nuevas funciones, estados, roles, tablas de negocio, tecnologías ni servicios externos sin una necesidad trazable y una decisión documentada.
- Las herramientas de IA siguen las mismas reglas: deben distinguir hechos, propuestas y resultados comprobados. No pueden inventar permisos, plazos, datos de usuarios ni evidencias de pruebas.
- Se conservan ocho sprints más la Iteración 0. Estas reglas no autorizan ampliar el MVP.

**Cambio respecto al plan anterior:** por la nueva instrucción del usuario, las pruebas y el Quality Gate son condiciones de cada PR desde el Sprint 1. La conexión del análisis con CI y el bloqueo de integración deben prepararse antes del primer merge. El Sprint 8 conserva la regresión global, el endurecimiento y la validación final; no es el primer momento en que se aplica calidad. Esta anticipación debe reflejarse en la planificación técnica, sin mover los RF ni inventar estimaciones.

## 2. Normativas y evidencia de aplicación

Las normas orientan controles y evidencias; ninguna regla de estilo ni herramienta garantiza por sí sola conformidad o certificación. El límite de 150 líneas, BDD, SOLID y los criterios del PR son políticas del proyecto, no obligaciones textuales atribuidas a las ISO.

| Referencia | Aplicación práctica en el proyecto | Evidencia prevista |
|---|---|---|
| ISO/IEC 25010 | Requisitos de calidad medibles, mantenibilidad, comportamiento correcto y comprobación de atributos no funcionales | RF/RNF, pruebas, métricas y resultados |
| ISO/IEC 27001 | Control de acceso, protección de secretos, gestión de riesgos y cambios | Matriz de permisos, revisión de seguridad y registros |
| ISO/IEC 27701 | Minimización de datos, acceso por finalidad y tratamiento controlado de información personal | Inventario de datos, políticas aprobadas y pruebas de visibilidad |
| ISO/IEC/IEEE 29119-2 | Planificación, ejecución y seguimiento de las pruebas | Plan, ejecuciones, defectos y cierre |
| ISO/IEC/IEEE 29119-3 | Documentación y trazabilidad de las pruebas | Escenarios, TC, resultados y evidencia por commit |
| ISO/IEC/IEEE 29119-4 | Selección de técnicas de diseño de pruebas | Casos de límites, particiones, decisiones y transiciones cuando apliquen |

Las fichas oficiales consultadas identifican ISO/IEC 25010:2023, ISO/IEC 27001:2022, ISO/IEC 27701:2025 y las partes 2, 3 y 4 de ISO/IEC/IEEE 29119:2021. La edición adoptada en el expediente académico debe quedar registrada; no se reescriben retrospectivamente referencias previas sin revisión. Fuentes: [25010](https://www.iso.org/standard/78176.html), [27001](https://www.iso.org/standard/27001), [27701](https://www.iso.org/standard/27701), [29119-2](https://www.iso.org/standard/79428.html), [29119-3](https://www.iso.org/standard/79429.html) y [29119-4](https://www.iso.org/standard/79430.html).

ISO 9001 y los demás marcos ya previstos siguen vigentes en sus documentos de proceso. Esta lista no los sustituye ni añade obligaciones normativas sin evaluar su aplicabilidad.

## 3. Convenciones de nombres y formato

Se utilizarán identificadores técnicos en inglés, nombres del dominio coherentes con el diccionario y textos visibles en español. No renombrar identificadores existentes sin evaluar contratos y migraciones.

| Elemento | Convención del proyecto | Ejemplo |
|---|---|---|
| Clase PHP y modelo Eloquent | `PascalCase`; modelo singular | `Technician`, `AssignTechnician` |
| Método, variable y función PHP/JS | `camelCase`, nombre que exprese intención | `calculateScore`, `expiresAt` |
| Componente React y archivo del componente | `PascalCase` | `TechnicianCard.jsx` |
| Hook React | Prefijo `use` | `useNotifications` |
| Tabla MySQL | `snake_case`, plural, según diccionario | `technician_profiles` |
| Columna y clave foránea | `snake_case`, FK consistente con entidad | `technician_id`, `created_at` |
| Campos JSON de API | Convención del contrato, inicialmente `snake_case` | `expires_at`, `expected_version` |
| Constante técnica y variable de entorno | `UPPER_SNAKE_CASE` | `APP_URL` |
| Ruta REST | Recursos y contratos del diseño; no inventar variantes | `/api/v1/requests` |

- Laravel Pint mantendrá el formato PHP; ESLint y un formateador acordado mantendrán JavaScript/React. Sus configuraciones se versionan y ejecutan en CI.
- Utilizar tipos de parámetros y retorno en el PHP nuevo cuando correspondan. En JavaScript, documentar contratos no evidentes mediante JSDoc; no introducir TypeScript como cambio implícito de tecnología.
- Los comentarios explican motivos, restricciones y decisiones; no repiten cada instrucción ni contienen datos personales o secretos.
- No añadir dependencias, interfaces o capas sin una necesidad concreta. Registrar motivo, compatibilidad y mantenimiento esperado de cada dependencia incorporada.

## 4. Tamaño de funciones y principios SOLID

- **Ninguna función o método escrito para el proyecto tendrá más de 150 líneas.** Incluye funciones anónimas, callbacks, componentes y hooks.
- Para medirlo, se cuenta desde el inicio de la declaración hasta su cierre, incluyendo comentarios y líneas en blanco dentro de ese intervalo. La regla se aplica al código propio de aplicación y pruebas, no al contenido de `vendor`, `node_modules` o artefactos compilados.
- Las 150 líneas son un máximo, no un objetivo. Dividir por responsabilidad; no comprimir instrucciones en una línea ni fragmentar artificialmente para evadir la regla.
- Verificar este límite mediante análisis por función en CI; una revisión manual puede detectar incumplimientos mientras se configura el control, pero no debe presentarse como automatización existente.
- Aplicar SOLID: responsabilidades acotadas, contratos sustituibles, interfaces pequeñas y dependencias inyectadas cuando sea útil probar o sustituir reloj, persistencia o notificaciones.
- Controladores coordinan HTTP; servicios/casos de uso ejecutan operaciones; el dominio determina reglas; infraestructura resuelve persistencia y comunicación.
- React presenta y solicita acciones. No decide permisos, ranking definitivo, vencimientos ni estados válidos del servicio.
- No duplicar reglas de negocio en React. La demostración histórica en almacenamiento local debe identificarse como demo; no sustituye a la API real.

## 5. BDD antes de implementar

Cada historia debe tener, antes del código de producción:

1. Identificador, actor, RF/RNF, objetivo y límites del alcance.
2. Criterios Dado/Cuando/Entonces y escenarios Gherkin revisados.
3. Casos TC vinculados, datos de prueba y resultado esperado.
4. Reglas pendientes identificadas; las que cambien el resultado deben resolverse antes de implementar ese comportamiento.

- Cubrir el flujo exitoso y, cuando apliquen, entradas inválidas, permisos insuficientes, acceso a recursos ajenos, estados incompatibles, vencimientos y concurrencia.
- Redactar escenarios observables desde el negocio; evitar describir selectores CSS o métodos internos como criterio de aceptación.
- Automatizar en Pest las reglas y contratos de backend, y en Cypress los recorridos críticos de interfaz. No es necesario ejecutar la misma comprobación en todos los niveles.
- Un archivo `.feature` no acredita automatización. Debe existir un ejecutor o una prueba trazable que implemente cada expectativa automatizable.
- Los defectos corregidos deben incorporar una prueba de regresión cuando su comportamiento pueda reproducirse automáticamente. Los casos manuales llevan procedimiento y resultado documentado.

## 6. Parámetros de negocio: una fuente de verdad

- SLA, pesos del matching, número de técnicos por ronda, ventanas y demás parámetros de negocio se consultan en las tablas de configuración aprobadas. No se fijan en controladores, componentes, jobs, constantes ni variables de entorno.
- Los valores iniciales aprobados se cargan mediante datos semilla versionados. Eso inicializa la tabla; no permite que el código de ejecución omita su consulta.
- Los fixtures de pruebas pueden contener valores explícitos, identificados como datos sintéticos y cargados en la configuración de la prueba. No constituyen otra fuente de valores de producción.
- El acceso a parámetros se centraliza en un servicio/repositorio. Si hay caché, debe conservar la versión e invalidarse de manera controlada.
- Validar tipos, rangos, unidades y coherencia del conjunto antes de publicar una versión. En matching, respetar la suma y reglas de pesos definidas en las fuentes.
- Cada cambio de configuración conserva autor, motivo, valores permitidos anteriores/nuevos, fecha y versión. El algoritmo registra qué versión utilizó.
- Un parámetro ausente o inválido genera un error controlado y alerta operativa. No utilizar un valor fijo silencioso ni cambiar automáticamente las reglas vigentes.
- La aplicación de cambios a solicitudes abiertas queda sujeta a la decisión pendiente P19; no asumir retroactividad.
- Distinguir reglas de negocio de configuración técnica: hosts, puertos y credenciales pertenecen al entorno; constantes matemáticas o de protocolo no son parámetros comerciales.

## 7. Autenticación, autorización y validación de API

**Toda ruta tendrá una política de acceso explícita y validará las entradas que reciba.** Las rutas protegidas verificarán identidad, cuenta habilitada, rol/permisos y relación con el recurso. Las rutas públicas deben declararse y justificarse expresamente.

- Registro, login, emisión de cookie CSRF, catálogo público y salud pueden funcionar sin sesión conforme a su contrato. No son una excepción a validación, límites de uso o protección de datos.
- Usar middleware y Policies/Gates de Laravel. Ocultar un botón o proteger una ruta React no constituye autorización de backend.
- Comprobar propiedad, participación o permiso sobre cada recurso y archivo. Conocer su identificador no concede acceso.
- El rol administrador no otorga acceso ilimitado: cada acción sensible exige el permiso correspondiente. El registro público nunca crea administradores.
- Validar campos de cuerpo, ruta, consulta y cabeceras pertinentes mediante contratos y Form Requests. Rechazar o ignorar de forma explícita los campos no permitidos; nunca asignarlos masivamente al modelo.
- El navegador no puede asignar roles, verificación del técnico, autoría, estados internos, ranking ni permisos.
- Mantener sesión SPA con Sanctum, CSRF, rotación al autenticar e invalidación al salir. No almacenar credenciales de sesión en `localStorage`.
- Aplicar límites de uso a operaciones expuestas a abuso, especialmente autenticación y carga de archivos. Sus valores técnicos deben documentarse y configurarse, no improvisarse en cada endpoint.
- Mantener códigos HTTP y errores consistentes con el contrato; no devolver SQL, rutas del servidor, claves ni trazas de depuración.

## 8. Secretos, privacidad y archivos

- Ninguna contraseña, token o clave real se versiona, ni siquiera dentro de pruebas, capturas, logs, archivos de ejemplo o documentación.
- Los secretos de infraestructura se inyectan mediante variables de entorno o el mecanismo de secretos del despliegue. `.env.example` solo contiene nombres y ejemplos sin credenciales utilizables.
- Las contraseñas de usuarios se almacenan como hash mediante el mecanismo aprobado de Laravel, nunca en texto plano ni en variables de entorno. No se confunden con la contraseña técnica de conexión a la base.
- No exponer secretos en variables `VITE_*`: su contenido es público. Si un secreto se filtra, revocarlo/rotarlo; borrarlo del último commit no elimina la exposición.
- Solicitar, almacenar y devolver solo los datos necesarios para la finalidad autorizada. Utilizar API Resources o listas explícitas de campos; no serializar modelos completos por defecto.
- Mantener separados documentos privados de verificación, evidencias de solicitudes y fotografías comerciales públicas. Validar tipo real, tamaño, cantidad y finalidad de cada archivo según la política aprobada.
- Los archivos privados se descargan mediante acceso autorizado; una URL difícil de adivinar no sustituye permisos.
- No registrar contraseñas, cookies, tokens, cuerpos completos de documentos o información personal innecesaria en logs y auditoría.
- Usar datos sintéticos en desarrollo y pruebas. La política de retención/anonimización sigue pendiente hasta su definición; no inventar plazos ni borrar evidencias automáticamente.

## 9. Integridad de datos, tiempo y concurrencia

- Mantener esquema, claves, tipos y restricciones alineados al diccionario. Los cambios se realizan mediante migraciones versionadas; no editar migraciones ya aplicadas en entornos compartidos.
- Utilizar consultas parametrizadas y listas permitidas para columnas de ordenación/filtro. Aplicar claves foráneas, unicidad y restricciones necesarias también en MySQL.
- Los importes utilizan decimales exactos conforme al diccionario; no `float` para dinero. Identificadores grandes e importes se serializan según el contrato de API.
- Almacenar tiempos en UTC y mostrar la zona acordada al usuario. El reloj del servidor determina plazos; el cronómetro React es informativo.
- Probar límites temporales con reloj controlado; no esperar minutos u horas reales en pruebas automatizadas.
- Ejecutar cambios relacionados en transacciones. Para aceptación, asignación, cierre y cambios concurrentes, aplicar bloqueos/versiones e idempotencia según el caso de uso.
- Validar transiciones de estado en backend y probar intentos incompatibles. No permitir que un PATCH genérico evite el ciclo de vida del servicio.
- Registrar plazos y configuración aplicada según el diseño. No reiniciar un SLA al refrescar la pantalla, reconectar Echo o reintentar un job.
- No modificar datos de producción para “hacer pasar” pruebas; no usar borrado de volúmenes o `migrate:fresh` como procedimiento de despliegue.

## 10. Auditoría de acciones sensibles

Se auditarán como mínimo las suspensiones/bloqueos, cambios de permisos, verificación de técnicos, reasignaciones administrativas, anulación o ajuste de calificaciones, resolución de apelaciones y cambios de reglas.

- Registrar actor, acción, recurso, fecha UTC, motivo cuando corresponda, resultado e identificador de correlación. Guardar solo los cambios de campos necesarios y permitidos.
- La acción sensible y su registro durable deben confirmarse de forma atómica, o mediante el mecanismo transaccional aprobado. Si no puede garantizarse el registro, no confirmar silenciosamente la operación.
- No confundir auditoría de negocio con logs técnicos. Los intentos denegados se registran cuando resultan relevantes para seguridad, sin guardar secretos ni datos excesivos.
- La aplicación no ofrecerá operaciones ordinarias para editar o borrar auditoría. Su consulta exige un permiso específico.
- Las tareas automáticas identificarán al sistema como actor y conservarán correlación con la operación que las originó.

## 11. Colas, programador y tiempo real

- Los jobs serán idempotentes: repetir una entrega no debe duplicar asignaciones, notificaciones persistidas o cierres.
- Comprobar estado, versión y vencimiento al ejecutar; un job atrasado no debe afectar una generación posterior de la solicitud.
- Publicar eventos después de confirmar la transacción y usar el outbox previsto para conservar publicaciones pendientes. No anunciar como confirmado un cambio que podría revertirse.
- Configurar reintentos, timeout y tratamiento de fallos por tipo de trabajo. Un reintento técnico no equivale a una nueva ronda de negocio.
- Reverb transporta eventos; MySQL y la API conservan la verdad del estado. Al reconectar, React recupera el estado autorizado y descarta eventos obsoletos o duplicados.
- Usar canales privados autorizados para información de usuarios. Evitar datos personales completos en eventos; cerrar suscripciones y limpiar datos locales al salir o perder permisos.
- No conceder un nuevo plazo por una caída del navegador o una reconexión. El comportamiento ante indisponibilidad del sistema se documenta y prueba conforme a la regla aprobada.

## 12. Frontend accesible y manejo de errores

- Separar componentes de presentación, acceso a API y estado de interfaz. Limpiar suscripciones, temporizadores y peticiones cuando deje de corresponder mantenerlos.
- Mostrar estados de carga, vacío, éxito y error. No presentar éxito hasta recibir confirmación válida del backend.
- Prevenir envíos accidentales repetidos en la interfaz sin sustituir la idempotencia del servidor.
- Mantener etiquetas de formularios, navegación por teclado, foco visible, mensajes asociados al campo y adaptación móvil.
- Respetar movimiento reducido y pausar animaciones fuera de pantalla cuando corresponda al diseño aprobado. La información esencial debe poder leerse sin depender de la animación.
- Escapar texto y evitar HTML arbitrario. No mostrar contactos, documentos o información de otra sesión almacenada previamente en el navegador.

## 13. Pruebas, trazabilidad y resultados

- Mantener la cadena **RF/RNF → HU → escenario → TC → prueba → ejecución/commit → evidencia**. Los identificadores existentes no se renumeran sin control de cambios.
- Ejecutar pruebas con datos aislados y reproducibles. No depender del orden entre casos, de servicios externos reales ni de esperas arbitrarias para simular vencimientos.
- Probar autorización también con recursos de otro usuario, no solo con roles distintos.
- Probar las condiciones de carrera e idempotencia de operaciones críticas cuando se implementen; una prueba feliz secuencial no acredita concurrencia segura.
- Usar dobles de prueba en límites apropiados, manteniendo pruebas de integración real para MySQL, transacciones y contratos donde el comportamiento dependa de ellos.
- Cada ejecución registra versión del código, entorno, fecha, esperado, obtenido y resultado. NO EJECUTADO, FALLIDO y APROBADO son estados distintos; no convertir cobertura documental en evidencia de ejecución.
- Los informes de cobertura deben proceder de pruebas reales. No excluir código propio solo para elevar el porcentaje ni cambiar umbrales para aprobar un PR fallido.

## 14. Pull Requests, CI y Quality Gate

Cada PR debe incluir:

1. Problema resuelto, historia y RF/RNF relacionados, alcance y resultado observable.
2. Escenarios afectados, pruebas nuevas/actualizadas o justificación de que las existentes cubren el cambio; comandos y resultados reales.
3. Impacto en permisos, privacidad, auditoría, configuración, esquema y contratos.
4. Instrucciones de migración/recuperación cuando corresponda y documentación actualizada.
5. Resultado aprobado del Quality Gate asociado al código exacto que se propone integrar, con enlace o evidencia verificable.
6. Revisión de otra persona del equipo antes del merge; si no hay revisor disponible, no declarar esa revisión como realizada.

La CI comprueba formato, lint, límite de funciones, pruebas pertinentes, detección de secretos, dependencias y análisis de SonarQube. Los controles exigidos deben estar configurados como condiciones de integración; tenerlos escritos en este documento no los activa.

El PR no se integra con pruebas obligatorias fallidas, análisis pendiente o Gate fallido. No se utiliza el resultado de otro commit. Cualquier modificación posterior exige volver a evaluar los controles afectados y obtener un resultado válido sobre la revisión final.

Para cambios exclusivamente documentales, la validación pertinente puede comprobar enlaces, estructura y coherencia; no es obligatorio inventar pruebas funcionales sin relación con el cambio. El PR registra qué se verificó y cómo se satisface el control de calidad aplicable.

### Configuración pendiente antes del primer merge

- Definir y versionar la política del Gate, alcance de análisis, medida de código nuevo, umbrales y tratamiento de hallazgos. No atribuir a ISO un porcentaje que no exige.
- El diseño anterior propone 70 % en el núcleo de matching/notificación/calificación, con detalles pendientes P21. Esta ampliación no cambia ese valor por 80 % ni lo extiende a todo el repositorio sin decisión.
- Mantener revisión de hallazgos de seguridad y análisis de dependencias además de SonarQube; el Gate no sustituye todos los controles de seguridad.
- **Verificar edición y capacidad de SonarQube:** la guía de I0 propone Community Build y la documentación oficial consultada limita su análisis de ramas a la rama principal. No asumir que eso proporciona análisis nativo de cada PR. Elegir/configurar una opción compatible o un mecanismo de análisis previo aislado con trazabilidad al commit, definición de código nuevo y validación del resultado equivalente. No comprar ni cambiar servicios automáticamente. Un análisis realizado solo después del merge no satisface esta regla. [Limitación documentada de Community Build](https://docs.sonarsource.com/sonarqube-community-build/user-guide/viewing-projects/retrieving-projects).

Estas decisiones son requisitos de preparación de la CI, no autorizaciones para omitir el Gate. Las condiciones medibles y el estado resultante deben quedar registrados. [Funcionamiento de Quality Gates](https://docs.sonarsource.com/sonarqube-server/2026.1/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates).

## 15. Dependencias, despliegue y operación

- Versionar lockfiles y registrar versiones compatibles; actualizar dependencias en cambios revisables, con sus pruebas.
- Separar desarrollo, pruebas y producción, incluyendo bases, cuentas y secretos. Conceder a procesos y usuarios solo los permisos necesarios.
- Preparar imágenes y configuración reproducibles; no publicar servidores de desarrollo como infraestructura de producción.
- Probar migraciones en un entorno equivalente; cambios destructivos requieren respaldo, recuperación viable y decisión expresa.
- Mantener HTTPS/WSS y depuración desactivada en producción. No exponer bases de datos ni herramientas de administración al público por defecto.
- Registrar fallos de jobs y servicios con datos mínimos y correlación; definir una acción de recuperación. Un error capturado y descartado no constituye manejo de errores.

## 16. Definition of Done de un cambio

- [ ] Requisito y escenarios definidos antes del código; pendientes bloqueantes resueltos.
- [ ] Código cumple convenciones, responsabilidades y máximo de 150 líneas por función.
- [ ] Parámetros de negocio provienen de configuración persistida y versionada.
- [ ] Permisos, validación, privacidad y auditoría comprobados según el cambio.
- [ ] Pruebas pertinentes pasan y su evidencia corresponde al commit final.
- [ ] Formato, análisis, secretos, dependencias y Quality Gate satisfacen las políticas vigentes.
- [ ] Contratos, migraciones, diccionario y documentación se actualizaron si cambiaron.
- [ ] PR revisado; no contiene funciones ajenas al alcance ni resultados declarados sin evidencia.

Las excepciones no se conceden silenciosamente. Si una regla no puede cumplirse, registrar el impedimento y una propuesta concreta para decisión del responsable del proyecto; no rebajar controles ni alterar el alcance por cuenta propia.

## 17. Aplicación inicial al Sprint 1

Antes de integrar su primer incremento:

1. Incorporar estas reglas a la revisión del equipo y vincularlas desde su checklist de PR.
2. Preparar CI, elección/configuración de SonarQube y política de calidad conforme a la sección 14.
3. Revisar escenarios existentes de registro, técnico pendiente, sesión y RBAC; conservar los TC aprobados.
4. Resolver los pendientes de negocio que bloqueen la historia concreta, sin asumir nuevos permisos o estados.
5. Comprobar que las pruebas usan datos y base separados del producto y que el administrador inicial no depende de una credencial compartida.

No se cambia aquí el backlog, se implementa CI ni se inicia el Sprint 1. Esta entrega establece las reglas para ejecutar esos trabajos de manera trazable.

### Documentos internos relacionados

- [Análisis del MVP](CANVAS-Analisis-MVP-TecnicoYa.md).
- [Diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md).
- [Diccionario de datos](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md).
- [Backlog técnico](CANVAS-Backlog-Tecnico-Implementacion-TecnicoYa.md).
- [Plan de sprints](sprints-01-08/CANVAS-Plan-Sprints-01-08.md).
- [Guía de Iteración 0](CANVAS-Iteracion-00-Guia-Manual-TecnicoYa.md).
