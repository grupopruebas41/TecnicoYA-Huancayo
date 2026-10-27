# Avance · Mayhuasca · registro detallado y recuperación de contraseña

## Datos de la tarea

- **Integrante:** Mayhuasca (backend) y Delgado (frontend). Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 7 (D-73), con IDs S07-TC. El conteo del S1, ya cerrado, no cambia.
- **Módulo:** F-Administración, cuenta y acceso.
- **HU/RF:** HU-01 y HU-02 (registro de cliente y de técnico) y RF-01 y RF-02. Su uso en la cercanía del matching sigue D-63 y D-64. RNF-SEG para la recuperación.
- **Fecha:** 2026-10-26.
- **Rama:** `feature/mayhuasca/auth/registro-detallado`, creada desde `main` `01b93ee`.
- **Decisiones:** D-73 a D-79 (plan del panel) y D-80 (campos del registro y recuperación), registradas en este PR.

## Commits

- `d4fb090`: decisiones D-73 a D-80.
- `c172023`: Pest en rojo (S07-TC-001 a 016).
- `880b410`: Vitest en rojo (S07-TC-017 a 029).
- `2fd0b6e`: S07-TC-030 en rojo.
- `b839954`: implementación del backend.
- `ec19c4d`: implementación del frontend.
- `f3e9ffb`: Cypress del S1 y del S3 y seeder E2E.
- `1e3a00b`: corrección del sobre `data` y ajustes visuales.

## Cambios

- **Backend:**
  - `POST /auth/register` acepta nombres y apellidos, teléfono, términos, el distrito principal del cliente, y para el técnico el distrito base, los distritos que atiende, las especialidades y la experiencia.
  - `/me` devuelve los nombres y el distrito principal.
  - Endpoints nuevos `POST /auth/password/forgot` y `POST /auth/password/reset`.
  - Una migración (detalle en el contrato S07).
- **Frontend:**
  - Asistente de registro en 2 pasos.
  - «¿Olvidaste tu contraseña?» y la pantalla `#cuenta/restablecer`.
  - La nueva solicitud se precarga con el distrito del cliente.
- **Cypress:** las del S1 y el S3 que llenan el registro se adaptaron con `fillRegistration()`. No se ejecutaron.
- **Seeder E2E:** `Sprint01E2ESeeder` ahora siembra los distritos.

## Pruebas

- **Pest completo:** 289/289 (16 S07) en el slot A.
- **Vitest:** 252/252 (14 S07).
- **Lint y build:** aprobados.
- **Pruebas anteriores adaptadas sin cambiar su ID:**
  - S01-TC-072 y 083 (Vitest);
  - complementos S01-TC-075 y 084;
  - S02-TC-089;
  - `Sprint01::registrationPayload()`.
  - Motivo: el registro cambió por D-80.
- **Errores encontrados con las capturas reales:**
  - las respuestas de recuperación no traían el sobre `data`;
  - los chips de distritos y especialidades se veían enormes por la especificidad del CSS.

## Evidencias

`docs/documentacion/evidencias/sprint-07/`: registros en rojo y en verde, capturas a 1366 y 390 px con la API simulada en Playwright y el script de captura.

## Pendientes

- Ejecutar las Cypress del S1 y el S3 en la regresión del cierre S4.6.
- Correr `php artisan migrate` en la base de desarrollo.
- **SonarQube:** no aplica; corresponde al cierre del sprint.

## Revisión

- **Revisor:** Pimentel Chumbes James.

## Ajuste: rubros por especialidad · 2026-10-26

- **Commits:**
  - `9d460cc` Pest en rojo;
  - `253adec` backend;
  - `209a5fc` Vitest en rojo;
  - `3421c9a` frontend;
  - `239e373` ancho del panel.
- **Backend:** `subcategory_ids` obligatorio para el técnico (activo, de una especialidad declarada y activa, al menos uno por especialidad). Se guarda en `technician_declared_subcategories` (migración aditiva `000025`) sin servicios ni tarifas. Se devuelve en `/me` y en el perfil propio con `has_rate`.
- **Frontend:**
  - selector en dos niveles con buscador, Seleccionar/Quitar todas, contador, error por especialidad, confirmación al desmarcar, resumen, foco y Reintentar;
  - «Servicios y tarifas» con los rubros pendientes de tarifa;
  - chips con la casilla en línea.
- **DEF-48** (corregido): salir de un campo vacío insertaba su error y movía el contenido entre `mousedown` y `mouseup`, así que el clic se perdía. Lo detectaron las capturas reales. S07-TC-045 falla sin el arreglo y pasa con él.
- **Pruebas:**
  - Pest 294/294;
  - Vitest 262/262; lint y build aprobados;
  - S07-TC-031 a 035 (Pest) y 036 a 045 (Vitest). S07-TC-035 ya pasaba y queda como regresión.



- **Herramienta y modelo:** Claude Code (Claude Opus 5.5).
- **Fecha:** 2026-10-26.
- **Aceptado:** migración, reglas, controlador, componentes, pruebas y documentación.
- **Corregido:**
  - en las pruebas nuevas: `$this` dentro de `state()` de la factory, los IDs leídos antes de sembrar, la entrada sin rol de S07-TC-017 y el detector heurístico de español con la 429;
  - en el código: el sobre `data` de las respuestas de recuperación, el `pointer-events` del radio que bloqueaba a Cypress y la especificidad del CSS de los chips.
- **Revisión humana:** Pimentel Chumbes James.
