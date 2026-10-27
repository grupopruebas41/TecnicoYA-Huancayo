# Avance · Pimentel · Comunicados en carrusel (bloque B, Fase 3 adelantada)

## Datos de la tarea

- **Integrante:** Pimentel (integración), con backend de Mayhuasca y frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC.
- **Módulo:** F-Administración (comunicados) y C-Notificaciones (carrusel de cliente y técnico).
- **HU/RF:** HU-S02-03 (RF-C04 y RF-C09) ampliada; RNF de accesibilidad y de seguridad (iframe de Genially).
- **Fecha:** 2026-10-26 y 2026-10-27.
- **Rama:** `feature/pimentel/admin/comunicados-carrusel`, creada desde `main` después de integrar el PR #32.
- **Decisiones:** D-83 y D-84 (esta reemplaza a D-51), nuevas. El 2026-10-27 Pimentel confirmó los dos valores de D-83: mínimo móvil de 810 × 540 y tolerancia del 1 %.

## Commits

- `0d54c67`: Pest en rojo (S07-TC-078 a 087).
- `da854c4` y `685c060`: restauran `tests/Support/Sprint07.php`. El commit en rojo lo había sobrescrito al agregar `jpeg()`, y las pruebas del S1 se quedaron sin `clientPayload()`.
- `62a90bf`: API.
- `4f03b4a`: Vitest en rojo (S07-TC-088 a 097), con esqueletos vacíos.
- `7ec18ca`: frontend.
- `58ca594` y `3d549eb`: ajustes vistos en las capturas (input oculto que desbordaba a lo ancho, margen bajo el carrusel, «Quitar imagen», selector de audiencia del orden, lectura de la imagen y especificidad de los botones).

## Ajuste del PR #33 (2026-10-27, D-84)

- **Commits:**
  - `aa3b168` y `6a57f7f`: Pest en rojo (S07-TC-098 a 104) y corrección de dos expectativas mías;
  - `5e8b6a7`: API;
  - `c9302aa`: Vitest en rojo (S07-TC-105 a 108);
  - `610b83d`: SPA;
  - `3eea65b` y `968fe50`: ajustes vistos en las capturas.
- **Editar en cualquier estado:**
  - `PATCH` acepta publicados con su versión y audita `announcement.published_edited` con antes y después;
  - sin `source`, valida contra el origen guardado, lo que permite reemplazar la imagen o el Genially;
  - el editor de un vigente avisa «Los cambios se verán de inmediato en los paneles».
- **Restaurar:** el retirado se ve en solo lectura con «Restaurar como borrador» (`POST …/restoration`).
- **Eliminar:**
  - `DELETE …/permanent` con la confirmación ELIMINAR, solo para borradores, vencidos y retirados;
  - retira las imágenes sin otro uso, renumera el carrusel y audita la foto previa;
  - el menú lo muestra deshabilitado con el motivo en vigentes y programados.
- **Listado:** «Mostrar retirados», desmarcado por defecto; un clic en la tarjeta abre el editor; el menú de la última fila se abre hacia arriba.
- **Pruebas ajustadas sin cambiar su ID:**
  - S02-TC-026: un publicado ahora se edita (200);
  - S07-TC-094, S02-TC-079 (complemento) y la Cypress S02-TC-066, sin ejecutar: marcan «Mostrar retirados».
- **Suites en `968fe50`:**
  - Pest 323/323 y Vitest 296/296;
  - lint y build aprobados; audits limpios;
  - 12 capturas D-84 (`evidencias/sprint-07/2026-10-27-968fe50-*-d84-*`).

## Cambios

- **Backend:**
  - migración `000027`;
  - finalidad de media `announcement` (JPG o WebP de hasta 600 KB);
  - `AnnouncementImages`, que comprueba las medidas en el servidor;
  - `GeniallyUrl`, que normaliza el enlace;
  - `PUT /admin/announcements/order` y `DELETE /admin/announcements/{id}/publication`;
  - el listado del administrador agrega la fase y las posiciones; el panel recibe las URLs de imagen en el orden del carrusel.
  - Contrato S07, §8.
- **Frontend:** módulo `src/features/announcements/`:
  - `AnnouncementEditor`: dos columnas, secciones plegables, tarjetas, chips, atajos, selector de imagen con guía y recorte, y vista previa en vivo de escritorio y móvil con zona segura;
  - `AnnouncementList`: cuadrícula, menú «⋯» y filtros;
  - `CarouselOrder`: orden con arrastrar y soltar, botones o teclado;
  - `AnnouncementCarousel`.
  - `RoleAnnouncements` usa el carrusel y no muestra nada si no hay comunicados.
- **Pruebas S2 adaptadas sin cambiar su ID:**
  - Vitest: S02-TC-078, 079 y 087 (complementos);
  - Cypress, sin ejecutar: S02-TC-065 a 068.

## Pruebas

- **Pest:** S07-TC-078 a 087.
- **Vitest:** S07-TC-088 a 097.
- **Suites completas en `3d549eb`** (evidencias `sprint-07/2026-10-27-3d549eb-*`):
  - Pest 316/316 (43 IDs S07 en el log);
  - Vitest 292/292 (54 IDs S07 según `contar-pruebas-sprint.mjs`);
  - lint y build aprobados; `npm audit` y `composer audit` sin vulnerabilidades.
- **Capturas:** 35, de 1366 y 390 px en tema claro y oscuro, con la API real del slot A y datos sintéticos; ninguna desborda a lo ancho. El script está en las evidencias.
- **Cypress:** no se ejecutó.

## Pendientes

- Ejecutar las Cypress S02-TC-065 a 068 en la regresión del cierre S4.6.
- En la base de desarrollo: `php artisan migrate` (000027).

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-26.
- **Qué se aceptó:** migración, API, componentes y pruebas.
- **Qué se corrigió:**
  - la sobrescritura del helper de pruebas `Sprint07.php`;
  - el texto de movimiento duplicado en el orden;
  - `readImage` dejó de usar `image.decode()`, que Chrome rechazó con una JPEG válida al recortar;
  - la especificidad de los botones del carrusel frente a los estilos heredados del S2.
- **2026-10-27 (D-84), qué se corrigió:**
  - dos expectativas de mis pruebas: el orden de las claves del JSON de MySQL y el enlace de Genially sin el nombre;
  - la casilla «Mostrar retirados», que una regla global de label ponía en columna;
  - el editor, que se abría a media página;
  - el menú, que salía del contenido en la última fila.
- **Revisó:** Pimentel Chumbes James.

## Revisión

- **Revisor:** Pimentel Chumbes James.
