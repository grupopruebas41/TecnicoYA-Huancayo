# Avance · Pimentel · Comunicados en carrusel (bloque B, Fase 3 adelantada)

## Datos de la tarea

- **Integrante:** Pimentel (integración), con backend de Mayhuasca y frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC.
- **Módulo:** F-Administración (comunicados) y C-Notificaciones (carrusel de cliente y técnico).
- **HU/RF:** HU-S02-03 (RF-C04 y RF-C09) ampliada; RNF de accesibilidad y de seguridad (iframe de Genially).
- **Fecha:** 2026-10-26 y 2026-10-27.
- **Rama:** `feature/pimentel/admin/comunicados-carrusel`, creada desde `main` después de integrar el PR #32.
- **Decisiones:** D-83, nueva. Tiene dos valores **[PENDIENTE de confirmar]**: el mínimo de la imagen móvil y la tolerancia de la proporción.

## Commits

- `0d54c67`: Pest en rojo (S07-TC-078 a 087).
- `da854c4` y `685c060`: restauran `tests/Support/Sprint07.php`. El commit en rojo lo había sobrescrito al agregar `jpeg()`, y las pruebas del S1 se quedaron sin `clientPayload()`.
- `62a90bf`: API.
- `4f03b4a`: Vitest en rojo (S07-TC-088 a 097), con esqueletos vacíos.
- `7ec18ca`: frontend.
- `58ca594` y `3d549eb`: ajustes vistos en las capturas (input oculto que desbordaba a lo ancho, margen bajo el carrusel, «Quitar imagen», selector de audiencia del orden, lectura de la imagen y especificidad de los botones).

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

- **Confirmar en D-83:**
  - el mínimo de la imagen móvil: 810 × 540, o 1080 × 720;
  - la tolerancia de proporción: 1 %, o 0 %.
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
- **Revisó:** [PENDIENTE].

## Revisión

- **Revisor:** [PENDIENTE].
