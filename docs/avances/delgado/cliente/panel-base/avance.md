# Avance · Delgado · Panel del cliente sobre PanelShell (D-87 a D-91, DEF-49)

## Datos de la tarea

- **Integrante:** Delgado (frontend). Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 5 (D-87), con IDs S05-TC.
- **Módulos:** A-Solicitudes, B-Matching y C-Notificaciones (pantallas del cliente).
- **HU/RF:** HU-S03-04 (RF-C06), HU-S05-05 parcial (RF-19, [TC-067]), HU-S08-03 parcial (RF-C09, [TC-106]) y HU-01 (RF-01).
- **Fecha:** 2026-10-27.
- **Rama:** `feature/delgado/cliente/panel-base`, rebasada sobre `feature/mayhuasca/cliente/cercania` (PR #38) porque la API todavía no está en `main`.
- **Plan:** `docs/documentacion/sprints/PLAN-PANEL-CLIENTE.md`. **Decisiones:** D-87 a D-91.

## Commits

- `750c463`: Vitest en rojo (S05-TC-025 a 040) y su evidencia.
- `4eed58b`: SPA del panel del cliente y arreglo de DEF-49.
- Después: evidencias, catálogo y relevo.

## Cambios

- **`ClientPanel` (nuevo):**
  - menú General (Inicio), Servicios (Nueva solicitud, Buscar técnicos, Mis solicitudes) y Cuenta (Notificaciones, Mi perfil), con la etiqueta «Gestión del cliente»;
  - contadores de solicitudes por elegir y notificaciones sin leer;
  - bloqueo del menú mientras el asistente guarda;
  - la búsqueda de la portada abre «Buscar técnicos».
- **Inicio (`ClientHome`):** comunicados, resumen real, solicitudes en curso, técnicos cerca y accesos por rubro. Cada bloque carga y falla por su cuenta. Sin próxima cita ni calificaciones.
- **Búsqueda:** `sort=proximity` cuando hay distrito, «Tarifa máxima» y tarjetas con iniciales, distancia y «Desde S/». Conserva un solo botón por tarjeta y `data-cy=technician-card`.
- **Mis solicitudes:** pestañas con contador, estados con texto y color, y `openId` desde el Inicio. La línea de tiempo (`RequestTimeline`) va dentro de `RequestTracking`, que ya se recarga con `request.updated`.
- **Notificaciones (`NotificationsPage`):** filtros, marcar una o todas como leídas, alertas y tiempo real.
- **Mi perfil (`ClientDetails`):** distrito principal y dirección de referencia, con doble validación.
- **`PanelShell`:** `initialSection`, `initialIntent`, `locked`, `bellKey` e iconos `plus`, `search` y `bell`.
- **DEF-49:** `NotificationBell` lee `items` y `unread_count`, se recarga con `notification.created` y suma «Ver todas».
- **`RequestPhase`:** suma «Registrada». El listado del S4 trae `phase` también para los borradores y antes mostraba «Estado pendiente de consulta».
- **Asistente:** colores de `requests.css` pasados a tokens del tema; tarjeta en el panel.
- **Retirado:** `ClientPortal.jsx` y su rama en `Sprint02Portal`.

## Pruebas adaptadas sin cambiar su ID

- **S07-TC-060 y 071:** la bandeja simulada usa la forma real (DEF-49).
- **S03-TC-080 complemento y S02-TC-089 (rediseño):** montan `ClientPanel` en lugar de `ClientPortal`. S02-TC-089 espera además `sort=proximity`, porque el filtro trae distrito.
- **S01-TC-016 y 076:** suman *mocks* del Inicio del cliente y del tiempo real, como ya hacían con `Sprint02Portal`; las aserciones no cambian.
- **Cypress, adaptadas sin ejecutar:**
  - ayudante `openMyRequests()`, usado antes de «Ver solicitud #N» en `sprint-03/request-submission`, `sprint-04/helpers` (openRequest), `realtime` y `selection` (3);
  - `support/sprint01.js` acepta el menú «Gestión del cliente» para abrir Mi perfil.
- **Correcciones a la prueba nueva antes del verde:**
  - la simulación de `makeEcho` no tenía `disconnect`;
  - S05-TC-039 esperaba «Solicitud dirigida a…», cuando el asistente dice «Técnico elegido: …»;
  - S05-TC-040 se rehízo como prueba directa de `PanelShell` bloqueado, porque llegar a un guardado real exigía recorrer el asistente entero.

## Pruebas

- **Rojo en `750c463`:** 16/16 fallidas (`evidencias/sprint-05/2026-10-27-vitest-rojo.txt`).
- **En `4eed58b`:** Vitest 325/325, lint y build aprobados y `npm audit` con 0 vulnerabilidades.
- **Conteo:** S05 con 24 Pest y 16 Vitest (40). Falta Cypress del S5.
- **Capturas:** 31, con la API real del slot A (siembra E2E del S4, cliente `e2e-client-match`). Script: `2026-10-27-4eed58b-panel-cliente-capturas.mjs`.
  - Inicio, búsqueda, nueva solicitud, Mis solicitudes, detalle con línea de tiempo, notificaciones y perfil, en claro y oscuro, a 1366 y 390 px, más el cajón móvil;
  - el guardado del distrito desde Mi perfil, de punta a punta;
  - ninguna desborda a lo ancho y no hubo errores de página;
  - «Sin conexión en tiempo real» aparece porque el entorno de capturas no levanta Reverb.
- **Cypress:** no se ejecutó.

## Pendientes

- Integrar el PR #38 y después este PR (se reapunta solo a `main` si se borra la rama del backend al integrar).
- Regresión Cypress S1 a S4 con los ayudantes adaptados.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-27.
- **Qué se aceptó:** componentes, estilos, pruebas y adaptaciones.
- **Qué se corrigió:**
  - la calificación de la tarjeta quedó unida al texto de experiencia y rompía S03-TC-078; ahora va en su propio elemento;
  - el script de capturas guardaba el perfil antes de que respondiera el `PATCH` del tema y recibía un 409 correcto; ahora espera esa respuesta;
  - las primeras capturas eran de página completa y dejaban la barra lateral fija en mitad de la imagen; se rehicieron a tamaño de ventana.
- **Revisó:** [PENDIENTE].

## Revisión

- **Revisor:** [PENDIENTE].

## Rediseño tras la revisión del PR #39 (2026-10-28)

- **Base:** `merge origin/main` en `d505b96` (el PR #38 ya integrado).
- **Commits:**
  - `c2e7cd6`: Vitest en rojo (S05-TC-041 a 049) y DEF-50 registrado;
  - `7fc7002`: rediseño y arreglo de DEF-50;
  - `96b0bbf`: ajustes vistos en las capturas.
- **DEF-50:** las opciones de los `<select>` eran ilegibles en tema claro, porque la regla global `option{background:#1d2629}` de la portada se combinaba con el texto oscuro. La corrige `.panel-shell option` con los tokens del tema.
- **Pantallas:**
  - **Inicio:** saludo con nombres y distrito; resumen con iconos y estado vacío con acción; «Tu última solicitud» con su siguiente paso; técnicos cerca en tarjetas; «¿Qué necesitas hoy?» con la imagen de cada especialidad; carrusel de hasta 320 px.
  - **Asistente:** stepper con progreso, descripción de cada paso, especialidad y subcategoría como tarjetas (radios nativos) y Atrás/Siguiente fijos abajo.
  - **Búsqueda:** paginación «‹ Anterior · 1 2 3 · Siguiente ›» y tarjetas con tarifa y distancia arriba.
  - **Perfil del técnico:** cabecera con «Verificado», experiencia y distritos, servicios «Referencial S/ X» con nota orientativa, galería y estados vacíos formales. «Solicitar servicio» queda fijo abajo en móvil.
  - **Mis solicitudes:** el rubro como título, el siguiente paso y fotos ampliables en un visor accesible.
  - **Seguimiento:** pasos Registrada → Asignada según la fase, «¿Qué pasa ahora?» con su acción, historial y el aviso de tiempo real como chip.
  - **Notificaciones:** agrupadas por día (Hoy, Ayer, fecha), con ícono por tipo, punto de no leída y filtros en chips.
- **Animaciones:** de 150 a 250 ms; se desactivan con `prefers-reduced-motion`.
- **Ajustes de las capturas:**
  - el título del paso del asistente ya no muestra un recuadro al recibir el foco;
  - el botón primario de «¿Qué pasa ahora?» se volvió legible en tema claro;
  - el resumen mostraba la franja como en la base («2026-10-29 20:00:00.000000») y ahora va en hora de Lima;
  - en móvil, las pestañas se desplazan en una fila.
- **Pruebas adaptadas sin cambiar su ID:**
  - S03-TC-069, 074 y 080 complementos y S03-TC-070: tarjetas en lugar de `<select>`;
  - S04-TC-108 complemento: lee la frase de estado, porque «Asignada» también es un paso;
  - S05-TC-032, 035 y 039: rediseño.
- **Cypress, adaptadas sin ejecutar:** 11 llamadas `select[name=specialty_id|subcategory_id]` pasan a radios (`check()`). En S03-TC-053, la subcategoría vacía se obtiene cambiando de especialidad.
- **Resultados en `96b0bbf`:** Vitest 334/334; lint, build y `npm audit` limpios. Conteo S05: 24 Pest y 25 Vitest.
- **Entorno:** el equipo se había reiniciado y Docker Desktop no corría. Se inició y se levantó solo la base de pruebas del slot A.

## Inicio del cliente aprobado (2026-10-28)

- **Decisiones registradas:** D-92 (PEDIDO-01, Parte B, todavía sin programar) y D-93 (RECO-00: buscador con IA en pausa, atajos por problema mientras tanto).
- **Commits:**
  - `266bb9c`: rojo (Pest S05-TC-050 a 054; Vitest S05-TC-055 a 060 y reescritura de 027, 028, 029, 034 y 046);
  - `b9dfa35`: implementación;
  - `b7a95b4`: corrección de la regresión de listas vista en las capturas.
- **Backend:** `GET /client/home` (solo clientes), con el distrito, los técnicos elegibles de la zona, el «desde S/ X» por especialidad con tarifas vigentes y las subcategorías activas. Número fijo de consultas y sin datos privados. Contrato S5 §7.
- **Inicio, en este orden y debajo del carrusel:**
  - bienvenida con nombres, distrito, técnicos de la zona y «Perfil completo X %» (se oculta al 100 %);
  - «¿Qué se malogró?», con 8 atajos de `homeContent.js` mapeados a subcategorías reales (se ocultan si la subcategoría no existe o está inactiva) que abren el asistente en el paso 3;
  - «Tu pedido en curso», con mini stepper y su acción, junto a «Precios de referencia» (dos columnas en escritorio);
  - «Técnicos cerca de ti» (3 tarjetas, «Ver perfil» abre el perfil);
  - «Consejo del mes» (rota según el mes en Lima) y «Tu seguridad».
- **Comportamiento:** entrada escalonada de 200 ms (sin ella con movimiento reducido), esqueleto y error con «Reintentar» por sección.
- **Se quitaron:** «¿Qué necesitas hoy?», los contadores sueltos, «Solicitudes en curso» y «Tu última solicitud».
- **Pruebas reescritas con su ID**, porque el Inicio aprobado reemplaza al de la Parte A: S05-TC-027, 028, 029, 034 y 046.
- **Ajustes antes del verde:**
  - S05-TC-054 mide las consultas después de una petición de calentamiento;
  - S05-TC-055 compara la etiqueta del atajo y no su ícono decorativo.
- **Resultados:**
  - Pest 381/381 en `b9dfa35` y Vitest 340/340 en `b7a95b4`;
  - lint, build, `composer audit` y `npm audit` limpios;
  - conteo S05: 29 Pest y 31 Vitest (60 IDs).
