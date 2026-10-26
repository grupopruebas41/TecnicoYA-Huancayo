# Avance · Mayhuasca · campos del catálogo público para la landing

## Datos de la tarea

- **Integrante:** Mayhuasca (backend). La ejecuta Claude Code.
- **Sprint y módulo:** Sprint 4 · F-Administración, catálogo público.
- **HU/RF:** HU-S02-01 · RF-C08. Atiende los pedidos de Codex del 2026-10-19: `image_url` y `reference_fee`.
- **Fecha:** 2026-10-26.
- **Rama:** `feature/mayhuasca/catalogo/campos-landing`, creada desde `main` `16cf3cb`.

## Commits

- `9d8a068` y `6b94db0`: cherry-pick de `045618f` y `be6708e` (S04-TC-133, `image_url` de la especialidad), que venían de la rama local sin publicar `feature/pimentel/ui/rediseno-visual`.
- Commit `docs`: la evidencia de S04-TC-133 pasa de `evidencias/ui/` a `evidencias/sprint-04/catalogo/`.
- `e0415f5`: S04-TC-134 a 136 en rojo.
- `ac293d8`: implementación.

## Cambios

- **Carrusel:** `GET /catalog/carousel` devuelve `reference_fee` como texto con 2 decimales, o `null`. Se arma con una sola consulta.
- **Seeder:** `DatabaseSeeder` nuevo, que llama a los seeders idempotentes de permisos, catálogo y distritos. No crea cuentas.
- **Contrato:** S4 v1.3 (§13).
- **Prueba anterior modificada:** S02-TC-022 compara la lista exacta de campos del carrusel y ahora incluye `reference_fee`.

## Pruebas

- **Rojo:**
  - S04-TC-134 falla porque el campo no existe;
  - S04-TC-136 falla porque no existe `DatabaseSeeder`;
  - S02-TC-022 falla por el campo nuevo;
  - S04-TC-135 ya pasaba y se conserva como regresión contra N+1.
- **Verde:** Pest completo 273/273 (2540 aserciones) en el slot A. `composer audit` sin avisos.

## Evidencias

En `docs/documentacion/evidencias/sprint-04/catalogo/`:
- `2026-10-19-e6b15df-s04-tc-133-rojo.txt` y `2026-10-19-be6708e-pest-verde.txt`;
- `2026-10-26-e0415f5-s04-tc-134-136-rojo.txt`;
- `2026-10-26-ac293d8-pest-completo.txt`.

## Base de desarrollo

Desde `backend/api`, con el `.env` de desarrollo: `C:\xampp\php\php.exe artisan db:seed`. No borra datos.

## Cierre

- **SonarQube:** no aplica; corresponde al cierre del sprint.
- **Revisor:** [PENDIENTE].

## Uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5).
- **Fecha:** 2026-10-26.
- **Aceptado:** pruebas, controlador, seeder y contrato.
- **Corregido:** la fecha del nombre de la evidencia en rojo.
- **Revisión humana:** [PENDIENTE].
