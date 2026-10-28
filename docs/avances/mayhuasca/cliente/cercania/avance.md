# Avance · Mayhuasca · API del panel del cliente (D-87 a D-91)

## Datos de la tarea

- **Integrante:** Mayhuasca (backend). Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 5 (D-87), con IDs S05-TC.
- **Módulos:** A-Solicitudes (listado y línea de tiempo), B-Matching (búsqueda por cercanía), C-Notificaciones (leídas) y F-Administración (perfil del cliente).
- **HU/RF:** HU-S03-04 (RF-C06), HU-S05-05 parcial (RF-19, [TC-067]), HU-S08-03 parcial (RF-C09, [TC-106]) y HU-01 (RF-01).
- **Fecha:** 2026-10-27.
- **Rama:** `feature/mayhuasca/cliente/cercania`, creada desde `main` `c7dc292` (después del PR #37).
- **Plan:** [PLAN-PANEL-CLIENTE.md](../../../../documentacion/sprints/PLAN-PANEL-CLIENTE.md). **Decisiones:** D-87 a D-91 (todas en la opción A, confirmadas por Pimentel) y ASES-01 pendiente.

## Commits

- `e9fd62c`: plan de la Fase 0 (copiado de `77f5ec1`, en `feature/delgado/cliente/panel-base`).
- `cb95a4b`: Pest en rojo (S05-TC-001 a 024) y S04-TC-143 con `unread_count`.
- `3eef886`: API.
- Después: documentación y evidencias.

## Cambios

- **`GET /technicians`:** `sort=proximity` (mismo distrito, km D-64 y resto, sin puntaje), `distance` en cada tarjeta y `max_fee`. El origen es el `district_id` del filtro o el distrito principal del cliente. Archivos: `TechnicianSearch`, `SearchTechniciansRequest` y `TechnicianSearchController`.
- **`GET /requests`:** suma `subcategory`, `district` y `updated_at`.
- **`GET /requests/{id}`:** el titular recibe `timeline`, desde `ClientTimeline`, con lista fija de tipos y textos.
- **Notificaciones:** `POST /notifications/{id}/read` y `POST /notifications/read-all`, solo del dueño; `state`, `type` y `unread_count` en la bandeja.
- **`PATCH /me`:** `district_id` y `reference_address` solo para clientes. `GET /me` y `PATCH /me` devuelven la dirección a su dueño (`AccountData::from(..., private: true)`).
- **Mensajes:** 6 nuevos en `lang/es/api.php`.
- **Sin migraciones ni dependencias nuevas.**
- **Pruebas del S4 ajustadas sin cambiar su ID:**
  - S04-TC-143 espera `unread_count` (campo aditivo de D-90);
  - S04-TC-142 deja `timeline` fuera de su comparación de forma (la cubren S05-TC-010 y 011).
- **Prueba nueva ajustada antes del verde:** S05-TC-002 y 003 comparan los km con `toEqual`, porque JSON serializa `1.0` como `1`.
- **Documentos:** DECISIONES (D-87 a D-91 y ASES-01), contrato `plan-pruebas-v3/sprint-05/CONTRATO-API.md`, catálogo `CATALOGO-S05.csv` (24 IDs) y DEF-49 (abierto; se corrige en el PR del frontend).

## Pruebas

- **Rojo en `cb95a4b`:** 19 fallidas. Seis S05 pasaban como guardas o por otra causa, y así queda explicado en la evidencia.
- **Suite completa en `3eef886`:** Pest 376/376, con 4313 aserciones; `composer audit` sin avisos.
- **Conteo:** S05 con 24 IDs Pest aprobados. La meta del S5 se completa con el frontend y el resto del sprint.
- **Evidencias:** `docs/documentacion/evidencias/sprint-05/2026-10-27-cb95a4b-pest-rojo.txt`, `2026-10-27-3eef886-pest-completo.txt` y `2026-10-27-3eef886-composer-audit.txt`.
- **Cypress:** no se ejecutó (no se pidió).
- **SonarQube:** no se ejecutó (solo en el cierre del sprint).

## Pendientes

- El PR del frontend (`feature/delgado/cliente/panel-base`): panel del cliente sobre `PanelShell` y corrección de DEF-49.
- `REGISTRO-DEFECTOS.md` no lleva DEF-47 a 49; el CSV sí, y es la fuente de verdad.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-27.
- **Qué se aceptó:** consultas de cercanía, línea de tiempo, marca de leída, validaciones, mensajes y pruebas.
- **Qué se corrigió:**
  - devolver la dirección en todas las respuestas de cuenta rompía S07-TC-001, que exige que el registro no la devuelva; ahora solo `GET /me` y `PATCH /me` la incluyen;
  - los km de la distancia se comparan por valor.
- **Revisó:** [PENDIENTE].

## Revisión

- **Revisor:** [PENDIENTE].
- **SonarQube:** [PENDIENTE] (cierre del sprint).
