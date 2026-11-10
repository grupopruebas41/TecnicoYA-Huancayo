# Plan · Panel del técnico (fases T0 a T5)

- **Fecha:** 2026-11-10.
- **Autor:** Claude Code. Hace backend y frontend según D-72.
- **Estado:** Fase T0 lista para revisión. Este documento no incluye código de producto.
- **Base revisada:** `main` en `9c3675d`, con el PR #54 (Fase 6 del cliente) ya integrado.
- **Modo:** rápido, con las mismas reglas que las fases 4 a 6 del cliente:
  - un PR por fase, con backend y frontend juntos;
  - Pest y Vitest para lo nuevo;
  - Cypress escritas, sin ejecutar;
  - capturas a 1366 y 390 px en tema claro.
- **Orden acordado:** SonarQube y el cierre del cliente (Fase 7) van al final, una sola vez para el cliente y el técnico. Ver la §9.
- **Plazo:** de 4 a 5 días para las fases T1 a T5, con un día por fase y la T5 como colchón.

## 1. Numeración

### IDs de prueba: se sigue el catálogo S05 desde S05-TC-275

**Por qué el S05:**
- Es el sprint en curso.
- El panel del cliente (fases 1 a 6) ya usa ese catálogo, y el contador `contar-pruebas-sprint.mjs` y las evidencias se agrupan por sprint.

**Por qué no se abre un catálogo nuevo:**
- El panel del técnico mezcla módulos de varios sprints: ofertas (B, S4), notificaciones (C), perfil y verificación (F, S2) y desempeño.
- Un catálogo S06 adelantaría IDs del Sprint 6 (atención y calificaciones), que todavía no empieza.

**Cómo se marca:**
- La columna `hu` de cada fila nueva lleva `HU-TEC-<fase>`.
- La columna `decision` cita la D- que aplica.
- El último ID integrado es S05-TC-274.

### Decisiones y defectos

- **Decisiones:** sigue en **D-104**. D-103 queda aprobada en este mismo PR.
- **Defectos:** sigue en **DEF-62**.

## 2. Decisiones que se registran al empezar

Se registran en `DECISIONES.md` como aprobadas por Pimentel el 2026-11-10, en el prompt del panel del técnico.

| ID | Decisión |
|---|---|
| D-103 | Valores de la Fase 6 (Premium IoT): **aprobada** tal como se propuso |
| D-104 | TEC-01 · Alcance del panel del técnico: (a) sin interruptor «Disponible ahora / En pausa»; (b) estadísticas de desempeño calculadas con los datos reales de las ofertas; (c) barra de progreso del perfil e insignias de logro; (d) el administrador recibe el panel de la cuenta y la campana nuevos, pero no bienvenida ni tutorial por ahora; (e) IDs en el catálogo S05 desde S05-TC-275 |

### Preguntas abiertas: decisiones propuestas

Las tres se registran como **propuestas**. Las aplico como indica cada recomendación salvo que decidas otra cosa antes de la fase que la usa.

**D-105 · Dónde se guardan los ajustes de accesibilidad, la bienvenida y el tutorial de los demás roles** (fase T1)
- **A (recomendada):** columnas nuevas en `users`.
  - Columnas: `accessibility_prefs`, `onboarding_completed_at`, `tour_completed_at` y `offer_alert_prefs`.
  - Endpoint común `GET/PUT /me/preferences` para los tres roles.
  - `/client/me/preferences` sigue funcionando sobre las mismas columnas, así que el contrato no cambia.
  - La migración copia los datos de `client_profiles` y deja las columnas viejas sin uso hasta el cierre.
- **B:** columnas iguales en `technician_profiles`, más un endpoint propio. El administrador guardaría sus ajustes solo en el equipo.
- **Riesgo de A:** toca el panel del cliente. Las pruebas S05-TC-240 a 253 lo cubren.

**D-106 · Estados de cada documento de verificación** (fase T4)

La base solo tiene tres estados (`pending`, `approved` y `rejected`). Lo pedido son cuatro: recibido, en revisión, aprobado y observado.
- **A (recomendada), sin migración:**
  - `pending` se muestra como «Recibido» mientras el técnico no pida la revisión, y como «En revisión» desde que la pide o desde que el perfil entra a la cola.
  - `approved` se muestra como «Aprobado».
  - `rejected` se muestra como «Observado», con la nota del revisor.
- **B:** columna `received_at` y estado `in_review` explícito, con migración y cambio en la cola del administrador.

**D-107 · «Qué falta» en la verificación y umbrales de las insignias** (fases T2 y T4)

Documentos obligatorios. Hoy no hay una lista de documentos exigidos:
- **A (recomendada):** «Documento de identidad» y «Certificado o constancia técnica».
- **B:** basta con un documento.

Insignias propuestas. Son cálculos sobre datos reales y nunca se guardan:
- **«Perfil completo»:** el 100 % de las tareas del perfil.
- **«Respuesta rápida»:** la mediana de respuesta de las últimas 10 ofertas respondidas es de 2 minutos o menos, con al menos 5 respondidas.
- **«Primeros 5 trabajos»:** 5 participaciones `completed`.
- **«Verificado»:** perfil `approved`.

## 3. Inventario del panel actual del técnico

### Frontend

| Pieza | Dónde | Estado actual |
|---|---|---|
| Entrada del rol | `AccountApp.jsx` | El técnico usa `PanelShell` **sin `modern`**, con dos secciones: Inicio (`Sprint02Portal`) y Mi perfil (`ProfilePage`). Abajo tiene «Contraer menú» y «Cerrar sesión». El avatar abre el menú antiguo |
| Inicio | `Sprint02Portal.jsx` | `RoleAnnouncements`, `Notifications` (avisos en la página), `OffersInbox` y `TechnicianPanel`, todo apilado en una sola página |
| Ofertas | `offers/OffersInbox.jsx`, `OfferCountdown.jsx` | Lista de ofertas con cuenta regresiva en texto, aceptar con idempotencia y rechazar con motivo (`ConfirmDialog`). Muestra `ConnectionStatus` («Sin conexión en tiempo real…») dentro de la página |
| Mi espacio técnico | `administration/TechnicianPanel.jsx` | Pestañas `s02` del Sprint 2: perfil (bio, forma de trabajo, garantía, años, distrito base), documentos (lista y subida), portafolio (CRUD con imágenes), disponibilidad y zona (`AvailabilityEditor`), servicios y tarifas (`ServicesEditor`). Estilo sin rediseñar |
| Panel de la cuenta | `panel/AccountPanel.jsx` | Solo el cliente. Pestañas fijas (`ACCOUNT_TABS`): Mi cuenta, Mis direcciones, Accesibilidad, Comunicación y Apariencia |
| Campana | `panel/NotificationBell.jsx`, `notificationView.jsx` | Común a todos los roles. El diseño nuevo (agrupación, contexto y vacío) ya sirve para cualquier rol; las categorías de `NotificationContext` son del cliente |
| «Aa», bienvenida y tutorial | `quickAccessibility.jsx`, `client/ClientOnboarding.jsx`, `shellContext.js` | Solo con `modern`. Los ajustes se guardan en `client_profiles`. El tutorial es específico del cliente (pasos fijos) |
| Perfil público | `matching/TechnicianProfile.jsx` | Diseño de la Fase 3. Se reutiliza para la vista previa |

### Backend (`/api/v1`)

| Área | Endpoints existentes | Datos disponibles |
|---|---|---|
| Ofertas (S4) | `GET /offers?status=&page=`, `GET /offers/{id}` y `POST /offers/{id}/response` (idempotente) | `OfferView`: estado, ronda (`kind`), `available_at`, `expires_at` (10 min), `responded_at`, tarifa de referencia, subcategorías (D-96), distrito, franja preferida, urgencia, síntomas y evidencias. La dirección va en `null` salvo si el trabajo está asignado a ese técnico (SEC-S04-05) |
| Trabajos | **Ninguno para el técnico** | Las tablas `participations` (`assigned`, `in_progress`, `completed` y `cancelled`, con `assigned_at`, `started_at` y `completed_at`) y `appointments` (`starts_at`, `ends_at`, `confirmed` o `cancelled`) ya existen. **No hay transiciones** a «en curso» ni a «completado»: son del módulo D (Sprint 6) |
| Perfil propio | `GET/PATCH /technicians/me/profile`, `POST verification-request`, `POST documents`, `PUT availability` (franjas por día y distritos, hasta 20), `PUT services` (tarifa e `includes`) y CRUD de `portfolio` | `OwnProfileView` trae perfil, documentos, portafolio, servicios y disponibilidad. `portfolio_images` ya tiene `stage` (antes o después) y `caption`. `portfolio_items` **no tiene orden** |
| Verificación | Perfil y documentos con `pending`, `approved` o `rejected`; revisión del administrador con nota | **No se notifica** al técnico cuando el administrador decide |
| Notificaciones | `GET /notifications`, `read` y `read-all` (middleware `technician.not_suspended`) | El técnico ya recibe `offer.*`, `request.assigned` y `request.cancelled`. Faltan los avisos de verificación |
| Cuenta | `GET/PATCH /me` y `POST /me/password` | No existe «cerrar mis otras sesiones» (solo `admin/users/{user}/sessions`) |
| Estadísticas | Ninguna | Se pueden calcular con `offers` (`available_at`, `responded_at` y `status`) y `participations` |

### Datos de demostración

`DemoSeeder` (solo con `APP_ENV=local`) crea:
- tres técnicos verificados, con perfil v2 y portafolio;
- `demo-tecnico-pendiente`.

Ninguno tiene ofertas, trabajos ni citas.

## 4. Fases

### T1 · Base común: barra superior, cuenta y campana (técnico y administrador)

**Frontend**
- **Barra superior:** `PanelShell` pasa a `modern` para los tres roles, con:
  - ☰ junto al logo, guardado en `users.sidebar_collapsed` (ya existe);
  - sin «Contraer menú» ni «Cerrar sesión» abajo;
  - campana, «Aa» y avatar.
- **Panel de la cuenta:** `AccountPanel` recibe las pestañas por rol, en lugar de la constante fija:
  - **Técnico:** Mi cuenta, Seguridad, Accesibilidad, Avisos (vacía hasta la T5, sin enlace roto: muestra «Próximamente») y Apariencia.
  - **Administrador:** Mi cuenta, Seguridad, Accesibilidad y Apariencia.
- **Seguridad:** cambiar contraseña con la actual (reutiliza el formulario de `ProfilePage`) y «Cerrar las otras sesiones».
- **Indicador de conexión:** un solo indicador discreto en la barra superior, que reemplaza a `ConnectionStatus` y a los avisos «Sin conexión en tiempo real» dentro de las páginas.

**Backend**
- `POST /me/sessions/revoke-others`: sube `auth_version` y regenera la sesión actual. Se audita.
- `GET/PUT /me/preferences` para los tres roles, según D-105.
- Avisos de verificación (`technician.verification.approved` y `rejected`) desde la revisión del administrador.
- Categorías del técnico en `NotificationContext`.

**Migración:** `000037_add_user_preferences` (D-105 A).

### T2 · Menú del técnico e Inicio

**Menú**
- **TRABAJO:**
  - Inicio;
  - Ofertas, con contador y un punto que late;
  - Mis trabajos;
  - Mi agenda.
- **MI NEGOCIO:**
  - Perfil profesional, con su porcentaje;
  - Servicios y tarifas;
  - Portafolio;
  - Zonas y disponibilidad;
  - Verificación, con su estado.
- **MI DESEMPEÑO:**
  - Estadísticas;
  - Calificaciones «Próximamente (S6)»;
  - Ganancias «Próximamente (S8)».
- **AYUDA:**
  - Cómo funciona;
  - Preguntas frecuentes del técnico;
  - Reportar un problema «Próximamente»;
  - Privacidad y términos.
- **Abajo:** solo «Ir al sitio».

Hasta su fase, cada sección se apoya en el editor actual (`TechnicianPanel`), dentro del nuevo marco. Así ningún enlace queda vacío.

**Inicio**
- Saludo por franja horaria, con la insignia de verificación.
- **Oferta en vivo (`OfferSpotlight`):**
  - anillo SVG de 10 minutos que pasa de verde a ámbar (5 min) y a rojo (2 min), con el tiempo también en texto y `aria-live` cada minuto;
  - especialidad, subcategorías, distrito, franja, tarifa y urgencia;
  - Aceptar y Rechazar reutilizan la lógica de `OffersInbox`.
- Si hay varias ofertas, van en una lista por vencimiento. Si no hay, una ilustración.
- **Indicadores:** trabajos de hoy, ofertas respondidas, tasa de aceptación y próxima visita.
- **Mi día:** línea de tiempo por franja.
- **Completa tu perfil:** progreso, tareas concretas e insignias (D-107).
- **Comunicados:** el carrusel, más pequeño y al final.
- Las animaciones respetan `reduce_motion` y `prefers-reduced-motion`.

**Backend:** `GET /technicians/me/home` devuelve, en una sola llamada:
- verificación y conteo de ofertas pendientes;
- los indicadores de hoy;
- las visitas de hoy;
- el progreso con sus tareas;
- las insignias.

Las ofertas se siguen leyendo de `GET /offers`.

### T3 · Ofertas, Mis trabajos y Agenda

- **Ofertas:** la misma tarjeta del Inicio, con historial de vencidas y rechazadas (`GET /offers?status=`; no hace falta endpoint nuevo).
- **Mis trabajos:**
  - `GET /technicians/me/jobs?tab=assigned|in_progress|completed|cancelled&q=&page=`, con `counts` por pestaña;
  - `GET /technicians/me/jobs/{request}`: la dirección solo sale si la participación de ese técnico está en `assigned`, `in_progress` o `completed`; un trabajo ajeno responde 404;
  - en pantalla, tarjetas con estado (ícono y texto), franja, distrito y una línea de tiempo resumida, además de búsqueda, paginación, skeleton y estados vacíos.
- **Mi agenda:** `GET /technicians/me/agenda?week=YYYY-MM-DD`.
  - Devuelve las citas de la semana y las franjas Mañana 08–12, Tarde 12–18 y Noche 18–21.
  - La edición usa `PUT /technicians/me/availability`, que ya existe: cada franja se traduce a `weekday`, `local_start` y `local_end`. Los distritos se editan en la misma pantalla.
- **Límite:** sin acciones de «Iniciar» o «Completar», porque esa transición es del módulo D (Sprint 6). Las pestañas «En curso» y «Completados» se llenan con los datos de demostración.

### T4 · Mi negocio, desempeño y verificación

- **Perfil profesional:** el formulario actual rediseñado (límites de D-101), con una vista previa en vivo que reutiliza `TechnicianProfile` sobre los datos locales, sin llamar al endpoint público.
- **Servicios y tarifas:** tarjetas por subcategoría con la tarifa y «qué incluye», sobre `PUT services`, que ya existe.
- **Portafolio:**
  - «antes» y «después» con `stage`;
  - el `caption` pasa a ser obligatorio como texto alternativo en las imágenes nuevas;
  - orden con `PATCH /technicians/me/portfolio/order`;
  - retiro con confirmación.
- **Zonas y disponibilidad:** el editor de la agenda en modo de configuración.
- **Verificación:**
  - `GET /technicians/me/verification`: estados de D-106 y lo que falta según D-107;
  - botón para subir el documento que falta;
  - los documentos solo los ve su dueño y el revisor (prueba negativa con otro técnico y con un cliente).
- **Estadísticas:** `GET /technicians/me/stats?period=week|month` (8 semanas o 6 meses).
  - Indicadores: tasa de aceptación (aceptadas ÷ respondidas o vencidas), tiempo medio de respuesta (`responded_at − available_at`), trabajos completados y ofertas vencidas.
  - Gráficos SVG con su resumen en texto.
  - Solo datos del propio técnico.

**Migración:** `000038_add_portfolio_order` (`portfolio_items.position`).

### T5 · Accesibilidad, bienvenida y tutorial del técnico

- **Ajustes:** los 8 del cliente, en la cuenta (D-105).
- **Pestaña «Avisos»** (`offer_alert_prefs`):
  - sonido corto con Web Audio;
  - vibración con `navigator.vibrate`, si existe;
  - destello que respeta «Reducir animaciones»;
  - «Leer la oferta en voz alta» con `speechSynthesis` es-PE;
  - en modo simple, Aceptar y Rechazar extragrandes.
  - El plazo de 10 minutos no cambia.
- **Bienvenida:** reutiliza `ClientOnboarding`, generalizada con las tarjetas por rol, más «Avisos de ofertas más notorios». Guarda los ajustes y nunca la tarjeta elegida (Ley 29733).
- **Primeros pasos:** perfil, documentos, zonas y horarios, y servicios con tarifa. Se calculan en `/technicians/me/home` y desaparecen al completarlos.
- **Tutorial de 5 pasos:** el motor del cliente, ya corregido (desplazamiento, menú expandido o cajón abierto, burbuja dentro de la pantalla), con pasos por rol. Se repite desde Ayuda › Cómo funciona.
- **Base WCAG 2.1 AA** en todo el panel:
  - «Saltar al contenido» y foco visible;
  - etiquetas y errores anunciados;
  - objetivos de 44 px o más;
  - contraste AA;
  - estado siempre con ícono y texto.

### Datos de demostración (repartidos entre las fases)

Clase nueva `DemoTechnicianActivity`, que llama `DemoSeeder` (solo con `APP_ENV=local`). Para un técnico demo verificado crea:
- ofertas pendientes y vencidas;
- trabajos en los cuatro estados;
- citas de esta semana;
- un portafolio con varios trabajos (antes y después);
- un documento en revisión.

Los clientes de esas solicitudes son los demo y van rotulados «(demostración)». `demo-tecnico-pendiente` queda sin bienvenida ni tutorial vistos y con los «Primeros pasos» incompletos.

## 5. Endpoints nuevos o cambiados

| Fase | Método y ruta | Tipo |
|---|---|---|
| T1 | `GET/PUT /me/preferences` | Nuevo, para los tres roles (D-105). `/client/me/preferences` se mantiene |
| T1 | `POST /me/sessions/revoke-others` | Nuevo, auditado |
| T1 | Avisos `technician.verification.*` | Nuevo tipo en la bandeja |
| T2 | `GET /technicians/me/home` | Nuevo |
| T3 | `GET /technicians/me/jobs` y `GET /technicians/me/jobs/{request}` | Nuevos |
| T3 | `GET /technicians/me/agenda` | Nuevo; la edición sigue en `PUT availability` |
| T4 | `GET /technicians/me/verification` | Nuevo |
| T4 | `GET /technicians/me/stats` | Nuevo |
| T4 | `PATCH /technicians/me/portfolio/order` | Nuevo |
| T4 | `POST/PATCH /technicians/me/portfolio` | Cambiado: `caption` obligatorio en imágenes nuevas (las existentes siguen válidas) |

**Lo que se conserva:**
- Ningún endpoint del S4 cambia de forma.
- Todo lo nuevo lleva `role:technician` y responde 403 al cliente y al administrador. Lo ajeno responde 404.

## 6. Migraciones

| Migración | Fase | Contenido |
|---|---|---|
| `2026_11_11_000037_add_user_preferences` | T1 | `users.accessibility_prefs`, `onboarding_completed_at`, `tour_completed_at` y `offer_alert_prefs`; copia los datos desde `client_profiles` |
| `2026_11_13_000038_add_portfolio_order` | T4 | `portfolio_items.position`, con el valor inicial según `created_at` |

Las dos corren en MySQL y en SQLite. Los CHECK solo se crean con la guarda de MySQL (DEF-53).

## 7. IDs previstos por fase

Son rangos orientativos desde **S05-TC-275**; el catálogo fija los definitivos.

| Fase | Rango | Pest | Vitest | Cypress (escritas) |
|---|---|---|---|---|
| T1 | S05-TC-275 a 292 | 7 (preferencias por rol, cerrar otras sesiones, aviso de verificación, 403 y 404) | 8 (barra, pestañas por rol, Seguridad, indicador único) | 3 |
| T2 | S05-TC-293 a 310 | 5 (`home`: indicadores, progreso, insignias y permisos) | 10 (menú, Próximamente, anillo con reloj falso, aceptar y rechazar, vacío, reducir animaciones) | 3 |
| T3 | S05-TC-311 a 330 | 8 (pestañas y conteos, dirección solo si está asignado, ajeno 404, búsqueda, agenda) | 9 (pestañas, búsqueda, skeleton, vacío, edición de franjas) | 3 |
| T4 | S05-TC-331 a 352 | 9 (estadísticas por período, verificación sin fuga a otros, orden del portafolio, `caption` obligatorio) | 10 (vista previa en vivo, servicios, portafolio, estados de documentos, gráficos con texto) | 3 |
| T5 | S05-TC-353 a 370 | 3 (preferencias de avisos, Primeros pasos) | 12 (bienvenida, tutorial, avisos con `vi.useFakeTimers`, voz simulada, modo simple) | 3 |

**Total previsto:** unas 32 Pest, 49 Vitest y 15 Cypress escritas.

## 8. Riesgos

| Riesgo | Efecto | Mitigación |
|---|---|---|
| Las Cypress S01 a S04 usan `data-cy="logout"` y el menú viejo del técnico y del administrador | Al pasar a `modern`, fallarían en el cierre | Se conservan los `data-cy` (el pie de la cuenta lleva `data-cy="logout"`) y se ajustan los ayudantes de Cypress en la T1. Se ejecutan en el cierre |
| Las ofertas demo vencen 10 minutos después de sembrarlas | Al probar en local no se vería ninguna oferta en vivo | Comando local `tecnicoya:demo-offer {email}`, que crea una oferta fresca para un técnico demo. Se niega fuera de `local` |
| Mover las preferencias a `users` (D-105 A) | Regresión en el panel del cliente | La migración copia los datos, `/client/me/preferences` se mantiene y S05-TC-240 a 253 siguen en la suite |
| No hay transiciones de trabajo (módulo D) | «En curso» y «Completados» solo se llenan con la demo | Se dice en pantalla y en el relevo; las transiciones llegan en el Sprint 6 |
| Exposición de la dirección o de documentos | Fuga de datos personales | Pruebas negativas en cada endpoint nuevo: otro técnico, cliente y administrador sin permiso |
| Ruido del anillo y de los avisos (sonido o destello) | Accesibilidad | Todo respeta «Reducir animaciones» y `prefers-reduced-motion`, el sonido está apagado por defecto y el texto siempre está presente |
| Tamaño del PR por fase | La revisión se alarga | Se separa la UI por archivos (`features/technician/*`) y se reutilizan los componentes del cliente |
| Plazo de 4 a 5 días | Retraso | Si una fase se alarga, se recorta la animación, nunca las pruebas negativas |

## 9. Qué se reutiliza del cliente

- **`PanelShell` con `modern`:** ☰, «Saltar al contenido», menú agrupado, `soon` con `aria-disabled` y contadores (`badges`).
- **`AccountPanel`:** diálogo, avatar grande, pestañas con ícono y animación, temas y «Cerrar sesión» al pie. Solo cambian las pestañas, que llegan por rol.
- **`NotificationBell`, `notificationView` y la página de Notificaciones:** se generaliza `ClientPanel` › `NotificationsPage`.
- **«Aa»:** `QuickAccessibility`, `useAccessibility` y `useReader`.
- **Bienvenida y tutorial:** `ClientOnboarding` y el motor del tutorial, con los pasos por rol.
- **Otros:** `Pagination`, `RequestTimeline`, los íconos de especialidad, `ConfirmDialog`, `TechnicianProfile` (vista previa), `AnnouncementCarousel` y `OfferCountdown` (base del anillo).

**Lo que no se duplica:** el técnico y el administrador no tienen una copia de la barra, la campana ni el panel de la cuenta. Solo pasan otra configuración.

## 10. Pendiente para el cierre común (cliente y técnico)

**Calidad:**
- SonarQube del Sprint 4 y del Sprint 5, más el código del técnico.
- Workflow «e2e-cierre» en GitHub Actions y ejecución de todas las Cypress (las del cliente, Fases 1 a 6, y las del técnico).
- vitest-axe y cypress-axe.
- Mutación en Linux.

**Funciones:**
- Promociones con audiencia «clientes Premium» y Reverb en el panel de sensores.
- Bienvenida y tutorial del administrador.

**Documentación:**
- Catálogo, contrato (§11 a §16), avances e INFORME-SPRINT-04 y 05.
- Resumen para el informe Word.
