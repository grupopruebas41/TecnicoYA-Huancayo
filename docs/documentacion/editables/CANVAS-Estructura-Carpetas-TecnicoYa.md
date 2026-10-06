# CANVAS · Estructura de carpetas del proyecto

**Proyecto:** TécnicoYa Huancayo · MVP  
**Versión:** 1.0 · **Fecha:** 5 de octubre de 2026  
**Estado:** estructura objetivo propuesta a partir del diseño aprobado y contraste con el repositorio. No acredita que todas las carpetas, dependencias o funciones estén implementadas.

## 1. Propósito y alcance

Definir dónde se ubicarán el código, la configuración, las pruebas y las evidencias del MVP para que un desarrollador junior pueda trabajar por funcionalidad sin mezclar responsabilidades. La organización conserva el monorepositorio y sus raíces actuales, y se introduce progresivamente en los ocho sprints aprobados.

Tecnologías objetivo: React, API REST Laravel, MySQL, Laravel Reverb y Echo, Docker y Docker Compose, Pest, Cypress y SonarQube. El backend será un monolito modular A–F. Los tres portales comparten una aplicación React y una API; no se crean tres aplicaciones ni bases de datos independientes.

Esta entrega solo documenta. No mueve archivos, elimina código histórico, instala dependencias, cambia el motor de datos ni modifica los alcances del plan.

> **Guía:** una carpeta organiza código. Un módulo representa responsabilidades del negocio. Un servicio de Docker es un proceso en ejecución. No son conceptos equivalentes.

## 2. Situación observada y estructura objetivo

| Área | Observado al revisar el repositorio | Objetivo del diseño |
|---|---|---|
| Backend | Existe `backend/api`; su manifiesto declara Laravel `^12.0`, PHP `^8.2` y PHPUnit. Tiene `app/Http`, `Models`, `Services` y `Providers`. | Introducir módulos A–F por incremento, manteniendo la API y contratos existentes que se validen como reutilizables. |
| Frontend | Existe `frontend/web`; declara React, Vite y Vitest. Los componentes principales están en `src` y hay carpetas `domain` y `scroll`. | Separar portales, funcionalidades y componentes compartidos; conservar y adaptar el trabajo visual existente. |
| Base de datos | El Compose actual declara PostgreSQL; los scripts históricos corresponden a ese enfoque. | MySQL como motor del diseño vigente, mediante transición planificada y comprobada. |
| Matching | El Compose declara un servicio que construye `python/api`. | Matching dentro del módulo B de Laravel según el diseño actual; conservar la implementación histórica hasta revisar su transición. |
| Tiempo real | Reverb y Echo no aparecen como dependencias directas en los manifiestos revisados. | Integrarlos con canales privados y recuperación de estado desde Sprint 4. |
| Pruebas | Se observan PHPUnit y Vitest; Pest y Cypress no aparecen como dependencias directas. | Incorporar Pest/Cypress sin asumir que los tests existentes deben eliminarse. Verificar compatibilidad antes de instalar. |
| Calidad | No se identificó una configuración SonarQube en la revisión de archivos específicos. | Incorporar configuración del analizador y entorno de calidad restringido. |
| Documentación | Existen CANVAS de análisis/diseño, diccionario, diagramas, ocho sprints y backlog. | Mantener su trazabilidad y distinguir planificación de evidencia de ejecución. |

**Entorno local previsto:** Docker Compose, conforme al CANVAS de diseño técnico. No se encontró XAMPP documentado como entorno adoptado en las fuentes revisadas. Esto no demuestra que XAMPP no esté instalado en el equipo; indica que no es una dependencia confirmada del proyecto.

Las versiones declaradas en los manifiestos describen el código inspeccionado; no fijan por sí solas toda la matriz futura de compatibilidad. Antes de incorporar nuevas dependencias se registrarán versiones compatibles de PHP, Laravel, MySQL, Node, React, Reverb, Echo, Pest, Cypress y SonarQube.

## 3. Árbol general objetivo

**Lectura:** este árbol combina raíces existentes y rutas propuestas. La tabla anterior describe las diferencias observadas. Las carpetas internas se crean cuando una historia las necesita, no como una estructura vacía completa al iniciar.

```text
Software TecnicoYa-Huancayo/
│
├── backend/
│   └── api/
│       ├── app/
│       │   ├── Modules/
│       │   │   ├── ARequests/              # Solicitudes y disponibilidad
│       │   │   ├── BMatching/              # Elegibilidad y ranking
│       │   │   ├── COffers/                # Ofertas, SLA y asignación
│       │   │   ├── DService/               # Atención y agenda
│       │   │   ├── ERatings/               # Calificaciones y apelaciones
│       │   │   └── FAdministration/        # Seguridad y administración
│       │   ├── Shared/
│       │   │   ├── Auth/
│       │   │   ├── Audit/
│       │   │   ├── Clock/
│       │   │   ├── Files/
│       │   │   └── Messaging/
│       │   └── Providers/
│       ├── bootstrap/
│       ├── config/
│       │   ├── auth.php
│       │   ├── database.php
│       │   ├── queue.php
│       │   ├── broadcasting.php
│       │   └── reverb.php
│       ├── database/
│       │   ├── migrations/
│       │   ├── seeders/
│       │   └── factories/
│       ├── routes/
│       │   ├── api.php
│       │   ├── web.php
│       │   ├── channels.php
│       │   └── console.php
│       ├── storage/
│       │   ├── app/
│       │   │   ├── private/
│       │   │   └── public/
│       │   ├── framework/
│       │   └── logs/
│       ├── tests/
│       │   ├── Unit/
│       │   ├── Feature/
│       │   ├── Fixtures/
│       │   ├── Pest.php
│       │   └── TestCase.php
│       ├── public/
│       ├── docker/
│       ├── Dockerfile
│       ├── composer.json
│       ├── composer.lock
│       ├── phpunit.xml
│       └── .env.example
│
├── frontend/
│   └── web/
│       ├── src/
│       │   ├── app/                       # Arranque, rutas y proveedores
│       │   ├── portals/
│       │   │   ├── public/                # Landing y acceso
│       │   │   ├── client/                # Páginas y layout del cliente
│       │   │   ├── technician/            # Páginas y layout técnico
│       │   │   └── admin/                 # Páginas y layout administrativo
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── requests/
│       │   │   ├── matching/
│       │   │   ├── offers/
│       │   │   ├── service/
│       │   │   ├── ratings/
│       │   │   └── administration/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   │   ├── http.js
│       │   │   └── realtime/
│       │   │       └── echo.js
│       │   ├── styles/
│       │   ├── assets/
│       │   └── main.jsx
│       ├── public/
│       │   └── media/
│       ├── cypress/
│       │   ├── e2e/
│       │   │   ├── client/
│       │   │   ├── technician/
│       │   │   ├── admin/
│       │   │   └── workflows/
│       │   ├── fixtures/
│       │   └── support/
│       ├── cypress.config.js
│       ├── vite.config.js
│       ├── Dockerfile
│       ├── package.json
│       ├── package-lock.json
│       └── .env.example
│
├── database/
│   ├── README.md
│   └── reference/
├── infrastructure/
│   ├── docker-compose.yml
│   ├── docker-compose.local.yml
│   ├── docker-compose.test.yml
│   ├── docker-compose.server.yml
│   ├── gateway/
│   ├── mysql/
│   ├── sonarqube/
│   └── scripts/
├── .devops/
│   ├── pipeline/
│   ├── config/
│   ├── hooks/
│   └── templates/
├── docs/
│   ├── documentacion/
│   │   ├── editables/
│   │   │   ├── sprints-01-08/
│   │   │   │   └── bdd/
│   │   │   └── backlog-tecnico/
│   │   ├── evidencias/
│   │   └── historico/
│   └── legacy/
├── scripts/
├── sonar-project.properties
├── .gitlab-ci.yml
├── .gitignore
├── README.md
└── TecnicoYa.code-workspace
```

Se omiten dependencias instaladas y salidas generadas, como `vendor`, `node_modules` y `dist`, para facilitar la lectura. También se omiten del árbol objetivo carpetas históricas y auxiliares cuya conservación se explica en la sección 11; omitirlas aquí no autoriza eliminarlas.

## 4. Responsabilidad de las carpetas principales

| Carpeta | Responsabilidad | Límite |
|---|---|---|
| `backend/api` | Autenticación, autorización, reglas, estados, matching, persistencia y procesos automáticos. | El servidor decide quién puede actuar y si un plazo sigue vigente. |
| `frontend/web` | Landing, tres portales, formularios, navegación, errores y actualizaciones visibles. | No decide permisos, puntuaciones oficiales ni vencimientos. |
| `backend/api/database` | Migraciones ejecutables, datos iniciales y fábricas de prueba. | Es la fuente ejecutable del esquema; evitar reconstrucciones manuales divergentes. |
| `database` | Diagramas/esquemas exportados y consultas de referencia aprobadas. | No almacena los archivos físicos del servidor MySQL ni una segunda historia de migraciones. |
| `infrastructure` | Configuración de contenedores, gateway y procedimientos operativos. | Los secretos y respaldos reales no se publican en el repositorio. |
| `.devops` | Orquestación de integración, pruebas, análisis y promoción de artefactos. | Invoca los procedimientos operativos; no duplica su lógica en varias herramientas. |
| `docs` | Fuentes, decisiones, diagramas, backlog, sprints y evidencia. | Separar propuestas, resultados ejecutados e información histórica. |
| `scripts` | Utilidades generales de mantenimiento o generación documental. | Las reglas del negocio permanecen en Laravel, no en scripts paralelos. |

## 5. Organización del backend Laravel

### 5.1 Módulos A–F

| Módulo | RF relacionados | Contenido y colaboración |
|---|---|---|
| `ARequests` | RF-01..RF-05 | Solicitud en cinco pasos, adjuntos, tarifa referencial y disponibilidad declarada. Consulta catálogo y solicita iniciar matching. |
| `BMatching` | RF-06..RF-14 | Elegibilidad, score, orden, desempate, estimaciones y búsqueda pendiente. Conserva factores y versión de reglas aplicada. |
| `COffers` | RF-15..RF-18 | Rondas, ofertas, respuesta, SLA y elección del cliente. Coordina asignación mediante el caso de uso correspondiente. |
| `DService` | RF-19..RF-22 | Participaciones, agenda, atención, reprogramación, adicional, incidencias y reporte individual. |
| `ERatings` | RF-23..RF-27 | Calificaciones/versiones, cierre sin calificar, apelaciones e historial. La explicación de criterios consulta al módulo B. |
| `FAdministration` | RF-28..RF-33 y RF-C | Identidad, permisos, catálogo, revisión técnica, comunicados, reglas, reportes, soporte y métodos/registros simulados de pago. Las intervenciones invocan al módulo dueño del flujo. |

RF-29 es transversal: cada módulo origina cambios; la entrega y autorización del tiempo real se coordinan mediante infraestructura compartida. Una desconexión de Reverb no elimina la oferta persistida ni extiende su plazo.

### 5.2 Patrón interno de un módulo

```text
COffers/
├── Http/
│   ├── Controllers/           # Entrada HTTP y llamada a casos de uso
│   ├── Requests/              # Validación de datos de entrada
│   ├── Resources/             # Proyección autorizada de respuesta
│   └── Policies/              # Permisos por recurso y relación
├── Application/
│   ├── Actions/               # AcceptOffer, AssignTechnician, ExpireRound
│   ├── Services/              # Coordinación que necesite varios casos/puertos
│   └── Jobs/                  # Adaptadores de trabajos en cola
├── Domain/
│   ├── Rules/                 # Invariantes y transiciones
│   ├── Services/              # Lógica del negocio entre conceptos
│   └── Contracts/             # Interfaces concretamente necesarias
├── Infrastructure/
│   ├── Persistence/           # Modelos Eloquent y acceso a MySQL
│   └── Notifications/         # Adaptadores de entrega específicos
└── Events/                    # Eventos del módulo
```

Los nombres de clases son orientativos; la responsabilidad debe acordarse antes de crear un archivo. Evitar duplicar una misma operación en `Actions` y `Services`. Un Job coordina la ejecución asíncrona e invoca un caso de uso; no contiene otra versión de la regla de negocio.

**Reglas de dependencia:** HTTP invoca aplicación; aplicación coordina dominio, persistencia, auditoría y eventos. Dominio no depende de React, Echo ni de controladores. Una operación de otro módulo se solicita mediante una interfaz o caso de uso definido; evitar modificar arbitrariamente sus tablas.

**Integración con Laravel:** revisar namespaces y autoload, registrar contratos en Providers y conectar Policies, listeners, rutas, canales y tareas según corresponda a la versión adoptada. Crear una ruta personalizada de carpetas no registra automáticamente estos componentes. Verificar la integración con una prueba por módulo.

La ubicación modular de Eloquent es una propuesta de organización. No exige duplicar cada modelo como entidad de dominio ni crear un repositorio por tabla. Mantener las abstracciones que aporten claridad, pruebas o sustitución de una dependencia.

### 5.3 Código compartido y rutas

| Ubicación | Uso previsto |
|---|---|
| `Shared/Auth` | Contratos y elementos comunes de identidad/permisos. F mantiene los casos de uso de administración de cuentas. |
| `Shared/Audit` | Escritura de auditoría reutilizable; F ofrece su consulta autorizada. |
| `Shared/Clock` | Reloj del servidor y sustituto determinista para pruebas de plazos. |
| `Shared/Files` | Validación, almacenamiento y acceso por finalidad, evitando duplicar la subida en cada módulo. |
| `Shared/Messaging` | Outbox, publicación y deduplicación comunes; el evento de negocio pertenece a su módulo. |
| `routes/api.php` | Entrada REST; puede delegar agrupaciones a módulos mediante registro explícito. |
| `routes/web.php` | Rutas web necesarias para la sesión SPA y configuración correspondiente; no implica vistas de los tres portales en Laravel. |
| `routes/channels.php` | Autorización de suscripciones privadas. |
| `routes/console.php` | Definición/registro de comandos y programación; invoca Jobs o casos de uso de los módulos. |

## 6. Organización del frontend React

`portals` organiza la navegación por público y rol; `features` implementa funcionalidades reutilizables. Por ejemplo, cliente y administrador pueden componer una vista de solicitud con componentes de `features/requests`, recibiendo de la API solamente los datos permitidos.

| Carpeta | Contenido |
|---|---|
| `portals/public` | Landing de diez secciones y acceso/registro; usa componentes de `features/auth`. Es la zona pública, no un cuarto rol. |
| `portals/client` | Inicio, solicitud guiada, búsqueda, seguimiento, calificación, registros simulados y soporte del cliente. |
| `portals/technician` | Ofertas, agenda, disponibilidad, servicios/tarifas, perfil, portafolio, reseñas e historial técnico. |
| `portals/admin` | Supervisión, revisión técnica, catálogo, comunicados, reglas, reportes, soporte y accesos administrativos. |
| `features/*` | Componentes, hooks y llamadas API de una capacidad del producto; evitar mantener copias independientes por portal. |
| `components` | Botones, campos, tablas, diálogos y estados comunes; sin reglas exclusivas de un rol. |
| `hooks` | Comportamientos realmente compartidos; hooks específicos permanecen en su feature. |
| `services/http.js` | Configuración de peticiones, sesión/CSRF, formato de error y correlación. |
| `services/realtime/echo.js` | Inicialización compartida de Echo; las features administran sus suscripciones y limpieza. |
| `app` | Arranque, router, proveedores y límites de error. |
| `assets` / `public/media` | Recursos importados por el build / archivos públicos del sitio. Ninguno almacena documentos privados subidos por usuarios. |

Ejemplo orientativo de una feature:

```text
features/requests/
├── api/                   # Cliente de endpoints de solicitudes
├── components/            # Pasos del formulario, resumen y línea de tiempo
├── hooks/                 # Consulta/actualización del estado de solicitud
└── validation/            # Ayuda de validación en UI; servidor revalida
```

Al cerrar sesión o cambiar de cuenta se limpian los datos privados en memoria y las suscripciones. Ocultar una ruta o botón no sustituye la Policy del backend. El estado del servidor y el estado visual del formulario deben distinguirse; React no marca una asignación como confirmada antes de la respuesta válida de Laravel.

## 7. Datos, tiempo real y procesos asíncronos

### 7.1 MySQL y archivos

- Crear migraciones versionadas en `backend/api/database/migrations`; ampliar el esquema por sprint conforme al diccionario aprobado.
- Mantener catálogo semilla separado de fixtures sintéticos de pruebas. No introducir credenciales administrativas predeterminadas en seeders compartidos.
- `database/reference` contiene exportaciones o ejemplos identificados como referencia. Los `init.sql` y `seeds.sql` históricos no deben ejecutarse como si ya fueran el esquema objetivo MySQL.
- Persistir MySQL mediante un volumen administrado por el entorno. Las copias recuperables se guardan fuera del repositorio y se referencian mediante el procedimiento operativo.
- `storage/app/private` aloja documentos, evidencias y exportaciones protegidas; cada descarga aplica autorización. Solo archivos explícitamente publicables se sirven por el área pública.
- La ruta privada, su volumen y sus copias no se exponen mediante el gateway ni un enlace público genérico.

### 7.2 Jobs y eventos por responsabilidad

| Módulo | Trabajos o casos de uso orientativos | Propósito |
|---|---|---|
| B | `PrepareMatching`, `RetryPendingMatching`, `ExpirePendingRequest` | Evaluar candidatos y gestionar disponibilidad hasta su límite. |
| C | `OpenOfferRound`, `ExpireOfferRound` | Mantener rondas y SLA con generación, versión y reloj del servidor. |
| D | `ExpireRescheduleProposal` | Vencer propuestas sin cambiar una cita no aceptada. |
| E | `CloseUnratedParticipation`, `RefreshRatingSummary` | Cerrar la ventana individual y recalcular reputación válida. |
| F / infraestructura compartida | `DeliverNotification`, `PublishOutboxEvent`, `GenerateReportExport` | Entregar avisos y reportes con permisos y recuperación. |

Se conserva una sola implementación por trabajo. La tabla indica dueño funcional; la ubicación final de adaptadores comunes se registra al implementarlos. Los cambios sensibles persisten estado, auditoría requerida y outbox de manera consistente. La publicación externa ocurre después de confirmar la transacción.

Los workers ejecutan los Jobs; el scheduler revisa vencimientos y recupera trabajo pendiente. Reverb transporta eventos y Echo actualiza la interfaz. La API y MySQL siguen siendo la fuente de verdad. Repetir un Job o recibir dos veces un evento no debe duplicar asignaciones, cierres ni notificaciones lógicas.

## 8. Entornos y servicios de Docker Compose

| Archivo propuesto | Uso |
|---|---|
| `infrastructure/docker-compose.yml` | Definición común del sistema objetivo. El archivo actual aún requiere transición desde la arquitectura histórica. |
| `docker-compose.local.yml` | Ajustes de desarrollo: React/Vite y recursos locales necesarios. |
| `docker-compose.test.yml` | Base, datos, contenedores y volúmenes aislados para automatización. |
| `docker-compose.server.yml` | Ajustes de demostración: gateway HTTPS/WSS, imágenes identificables y configuración restringida. |

Los archivos adicionales se seleccionan explícitamente al ejecutar Compose; sus nombres no implican carga automática. Documentar en el README operativo cómo combinarlos. Mantener una única definición coherente y evitar divergencia entre tres copias completas del sistema.

| Servicio previsto | Responsabilidad | Observación |
|---|---|---|
| `gateway` | Servir React compilado y dirigir API/autenticación/WebSocket. | Entrada pública de demostración. |
| `api` | Ejecutar Laravel. | Misma versión de aplicación que los workers. |
| `mysql` | Persistir negocio, sesiones y colas iniciales del diseño. | Red interna y volumen persistente; sin exposición pública en servidor. |
| `worker-domain` | Ejecutar trabajo de matching, rondas y vencimientos. | No debe quedar retrasado por exportaciones pesadas. |
| `worker-delivery` | Entrega de eventos, avisos y exportaciones. | Reintentos y fallos observables. |
| `scheduler` | Programar revisiones y recuperación. | Una instancia inicial y protección contra solapamiento. |
| `reverb` | Mantener conexiones WebSocket autorizadas. | Detrás del gateway en demostración. |
| `frontend-dev` | Ejecutar Vite en desarrollo. | No es el servidor público de demostración. |
| `test-runner` | Ejecutar las suites de prueba. | Datos y volúmenes aislados. |
| `sonarqube` | Analizar código y evaluar la puerta de calidad. | Entorno/perfil separado y acceso restringido; almacenamiento compatible propio, no la BD del negocio por omisión. |

Configurar salud de servicios y recuperación de desconexiones. Un contenedor iniciado no demuestra que MySQL esté listo ni que Laravel pueda operar. Los procedimientos de despliegue, copia y restauración se ubican en `infrastructure/scripts`; `.devops/pipeline` los invoca.

XAMPP no se añade a esta estructura como requisito. Si posteriormente se adopta, deberá documentarse como alternativa local y comprobar compatibilidad con MySQL y con el resto de procesos; no sustituye automáticamente workers, scheduler, Reverb ni Node.

## 9. Pruebas, BDD, SonarQube y evidencias

| Ubicación | Pruebas o documentos |
|---|---|
| `backend/api/tests/Unit` | Score, reglas, transiciones y cálculo de límites con reloj controlado. |
| `backend/api/tests/Feature` | API, permisos, archivos, transacciones, Jobs y eventos. Integridad/concurrencia se comprueban contra MySQL de pruebas. |
| `backend/api/tests/Fixtures` | Datos sintéticos deterministas para pruebas PHP. |
| `frontend/web/cypress/e2e/{client,technician,admin}` | Recorridos de cada rol. |
| `frontend/web/cypress/e2e/workflows` | Flujos completos entre varios roles y recuperación de conexión. |
| `frontend/web/cypress/fixtures` y `support` | Datos sintéticos y utilidades del navegador. |
| `docs/documentacion/editables/sprints-01-08/bdd` | Especificaciones Gherkin ya planificadas, vinculadas a HU y TC. |
| `docs/documentacion/evidencias/sprint-NN/TC-XXX` | Resultado real, commit, entorno, datos, logs/capturas pertinentes y defectos. |
| `sonar-project.properties` | Alcance del analizador y rutas de informes producidos por los runners. |
| `infrastructure/sonarqube` | Configuración del entorno que ejecuta el servidor de análisis. |

**Convención de organización:** los CANVAS previos proponían `cypress/e2e/sprint-NN` como ruta orientativa. Este documento organiza el código ejecutable por portal/recorrido y conserva sprint, HU y TC como metadatos y en la matriz de trazabilidad. No se duplican las pruebas en ambas estructuras; al implementarlas se actualiza el destino registrado, sin cambiar IDs ni sprints.

En PHP puede añadirse una subcarpeta por módulo dentro de Unit/Feature según el volumen real. La capitalización propuesta `Fixtures` debe normalizarse al integrar la carpeta histórica `fixtures`, evitando duplicados que se comporten de forma diferente en Windows y Linux.

Gherkin especifica comportamiento y no se ejecuta por sí solo. Pest y Cypress implementarán los escenarios correspondientes. El reloj del navegador no cambia el de PHP ni el de los workers. Los estudios de usabilidad y la observación de disponibilidad mantienen su protocolo específico y no se sustituyen por un test E2E.

SonarQube consume informes de pruebas/cobertura auténticos; no ejecuta por sí solo toda la estrategia de validación. Mantener vinculados análisis, artefacto y commit. No declarar cumplido un RNF porque su carpeta o archivo de configuración exista.

## 10. Configuración, secretos y control de versiones

- Versionar código, migraciones, lockfiles, manifiestos, `.env.example`, contratos, pruebas y documentación. Los ejemplos contienen valores ficticios.
- Mantener secretos reales fuera del repositorio y de la imagen/bundle del frontend. Echo solo recibe la configuración pública necesaria, nunca el secreto de Reverb ni credenciales MySQL.
- Excluir dependencias instaladas, cachés, logs, temporales, respaldos reales y datos privados. Revisar el `.gitignore` existente antes de introducir nuevos patrones; este documento no lo modifica.
- Los informes generados se conservan como artefactos de CI o evidencias seleccionadas según el procedimiento del proyecto; no acumular automáticamente todos los videos, capturas y datos en Git.
- Preservar el pipeline existente como punto de integración. La presencia de `.gitlab-ci.yml` no demuestra que un pipeline remoto esté configurado o ejecutándose; documentar el proveedor activo antes de publicar.
- Datos sintéticos y utilidades de reloj/fixtures solo en entornos de prueba; nunca exponer un endpoint de manipulación del tiempo en demostración.

## 11. Transición desde el repositorio actual

| Elemento actual | Tratamiento propuesto |
|---|---|
| `backend/api/app/Http`, `Models`, `Services` | Revisar comportamiento y pruebas; mover o adaptar por módulo con cambios pequeños y verificación de imports/rutas. No mantener dos implementaciones activas de una misma regla. |
| Componentes actuales en `frontend/web/src` | Extraer gradualmente hacia portales/features conservando estilos e interacciones aceptadas. |
| `python/api` | Conservar como antecedente hasta validar la sustitución del matching por Laravel. No es un servicio requerido por el nuevo diseño. |
| `domain/rules.json` y copias históricas | Mantener mientras se revisa la transición a reglas versionadas en MySQL. Documentar cuál es la fuente activa; no ejecutar versiones divergentes en paralelo. |
| SQL/Compose con PostgreSQL | Planificar migración aislada, mapeo de datos, copia recuperable y validación. No cambiar el nombre del motor y asumir compatibilidad. |
| `public`, videos en raíz y herramientas de medios | Inventariar referencias y archivos realmente utilizados antes de consolidar assets en el frontend. |
| `.runtime-python`, `.media-tools`, `tmp`, `output`, `examples` | Evaluar como utilidades o salidas de trabajo; no confundirlas con módulos desplegables ni eliminarlas automáticamente. |
| `project.yml` y metadatos `.devops` | Revisar la detección de módulos y servicios cuando cambie la arquitectura, para que el despliegue no siga levantando el stack histórico por omisión. |

El destino `docs/legacy` es una opción para referencias históricas ya desacopladas. Cualquier traslado debe preservar lo necesario para reproducirlas y corregir enlaces/importaciones. Esta entrega no ejecuta esos traslados.

## 12. Introducción progresiva en los ocho sprints

| Sprint | Carpetas y capacidades que se desarrollan |
|---|---|
| 1 | FAdministration/Shared Auth y Audit; migraciones básicas; auth, acceso y layouts de portales; pruebas de sesión y RBAC. |
| 2 | Catálogo, revisión y comunicados; Shared Files; disponibilidad/oferta técnica en A; perfiles, portafolio y landing en React. |
| 3 | ARequests para solicitud/evidencias; consultas públicas pertinentes de técnicos; formulario de cinco pasos y listados. |
| 4 | BMatching/COffers, Jobs, eventos, Clock, outbox, workers/scheduler; Reverb/Echo y bandeja de ofertas. |
| 5 | DService para agenda, atención, reprogramación y coordinación; vistas de seguimiento por rol. |
| 6 | ERatings, historial, apelaciones y criterios de matching visibles. |
| 7 | FAdministration para supervisión, reglas, reportes, cuentas y auditoría; exportaciones usando colas existentes. |
| 8 | Registros económicos simulados, preferencias y soporte; endurecimiento, suites completas, SonarQube y configuración del servidor. |

Este mapa no cambia el plan ni crea un noveno sprint. Una carpeta compartida se introduce una vez y se amplía donde haga falta. La estructura completa es una guía de destino; no obliga a crear todas las tablas y directorios antes de entregar el primer flujo funcional.

## 13. Criterios para aceptar una reorganización futura

- [ ] Se identificaron archivos actuales, responsabilidades y referencias que cambiarán.
- [ ] No se duplicó la autoridad de reglas, estados o migraciones.
- [ ] Autoload/imports, Providers, rutas, Policies, eventos, canales y scheduler funcionan en las nuevas ubicaciones.
- [ ] Build y pruebas relevantes pasan; las pruebas de datos utilizan el motor objetivo.
- [ ] Un recorrido del incremento funciona desde React hasta MySQL con permisos reales.
- [ ] Archivos privados, secretos y datos de prueba mantienen su aislamiento.
- [ ] Compose y metadatos DevOps levantan la arquitectura esperada; no se presume migración exitosa por editar archivos.
- [ ] Contratos, README, diccionario y matriz HU/TC tienen rutas vigentes.
- [ ] Se registraron evidencia, commit y revisión; se conservaron referencias históricas necesarias.

Las casillas son condiciones futuras y se dejan sin marcar. La presente documentación no ejecuta pruebas del producto.

## 14. Fuentes y control documental

- [CANVAS de análisis del MVP](CANVAS-Analisis-MVP-TecnicoYa.md): actores, alcance, RF/RNF y decisiones pendientes.
- [CANVAS de diseño técnico](CANVAS-Diseno-Tecnico-MVP-TecnicoYa.md): capas, módulos, contratos, tiempo real y entornos.
- [Diccionario de datos MySQL](CANVAS-Diccionario-Datos-MySQL-TecnicoYa.md): estructura de datos objetivo.
- [Plan de ocho sprints](sprints-01-08/CANVAS-Plan-Sprints-01-08.md) y [Backlog Técnico](CANVAS-Backlog-Tecnico-Implementacion-TecnicoYa.md): orden aprobado, historias y dependencias.
- [Manifiesto Laravel actual](../../../backend/api/composer.json), [manifiesto React actual](../../../frontend/web/package.json) y [Compose actual](../../../infrastructure/docker-compose.yml): contraste de implementación, no sustituyen las decisiones posteriores del usuario.
- Fuente 0, respuestas y aclaraciones del chat conservadas en los documentos anteriores. La solicitud más reciente fija el stack objetivo.

La organización apoya separación de responsabilidades, control de cambios, seguridad y trazabilidad de pruebas. Las normas de referencia del proyecto no prescriben estos nombres de carpetas y este documento no acredita certificación.

**Registro de esta versión:** documenta estructura objetivo, diferencias observadas, entorno local con Compose, responsabilidades A–F, portales, pruebas, servicios y transición progresiva. No modifica los archivos de ejecución ni reubica el repositorio.
