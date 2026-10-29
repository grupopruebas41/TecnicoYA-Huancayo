# Avance · Mayhuasca · Pedido con varios rubros y rediseño del asistente (D-92, PEDIDO-01)

## Datos de la tarea

- **Integrante:** Mayhuasca (backend), con el frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 5 (D-87), con IDs S05-TC.
- **Módulos:** A-Solicitudes (pedido y envío atómico), B-Matching (urgencia en la oferta) y el panel del cliente (asistente y Mis solicitudes).
- **HU/RF:** HU-S03-01 a 03 y 06 (RF-01 y RF-03), HU-S04-01 (oferta).
- **Fecha:** 2026-10-28.
- **Rama:** `feature/mayhuasca/cliente/pedido-multiple`, desde `main` `b799ab0` (con el PR #40).
- **Decisiones:** D-92 (PEDIDO-01), D-11, D-12, D-55, D-58 y D-94.

## Commits

- `99ca9ff`: Pest en rojo (S05-TC-088 a 102).
- `1026e27`: backend.
- `87e3af6`: Vitest en rojo (S05-TC-103 a 114; S05-TC-029, 045 y 080 y el complemento de S03-TC-080 adaptados).
- `f9e58c5`: frontend.
- `8fdcb4f`: ajustes vistos en las capturas.
- `afa87c5`: Cypress adaptadas (sin ejecutar).
- Después: documentación, evidencias y capturas.

## Cambios

- **Datos:** migración `000030`:
  - `service_orders`;
  - en `service_requests`: `order_id`, `urgency`, `brand`, `model`, `address_reference` y `time_slot`;
  - `subcategory_symptoms` y `request_symptoms`;
  - `SymptomSeeder`, idempotente, en `DatabaseSeeder` y en las siembras E2E, con 4 a 6 problemas por subcategoría.
- **API (contrato S5 §9):**
  - `GET /orders/quota`;
  - `POST /orders` con `Idempotency-Key` obligatoria;
  - `GET /catalog/subcategories/{id}/symptoms`;
  - `subcategory_count` y `reference_fee` en el catálogo;
  - pedido, urgencia, equipo, franja, referencia y síntomas en Mis solicitudes, en el detalle y en la oferta del técnico.
- **Envío atómico (`ServiceOrders`):**
  - bloquea al cliente y aplica D-11 al pedido entero (409 con el cupo, sin crear nada);
  - crea un borrador por rubro y lo envía con el flujo del S3 (`SubmissionPolicy`, versión de reglas y `PrepareMatching` después del commit), todo dentro de la transacción de `Idempotency`.
- **Asistente nuevo (`OrderWizard`):**
  - stepper con pasos completados, barra fija con resumen vivo y transición de 200 ms que respeta `prefers-reduced-motion`;
  - paso 1: el buscador agrega y avisa «Agregado»; especialidades en casillas con ícono de línea, sin fotos;
  - paso 2: subcategorías agrupadas, filtro, contador, «Desde S/» y límite de 3 rubros o el cupo, con su motivo; quitar una especialidad con rubros pide confirmación;
  - paso 3: pestañas por rubro con síntomas, descripción, marca, modelo, urgencia y fotos (arrastrar y soltar, vista previa, hasta 5 y retirar con confirmación);
  - paso 4: distrito del perfil, dirección, referencia y «Lo antes posible» o fecha y franja;
  - paso 5: tarjetas con «Editar», aviso de N solicitudes y «Enviar pedido»;
  - confirmación con los N seguimientos.
- **Mis solicitudes:** agrupa las solicitudes del mismo pedido.
- **Asistente anterior (`RequestWizard`):** queda para la solicitud dirigida (un solo rubro, D-92) y para continuar borradores. Usa íconos de línea en lugar de fotos y ya no tiene el buscador ni `preset`.

## Pruebas

- **Rojo:**
  - Pest: 15 de 15 fallidas (`2026-10-28-b799ab0-pedido-pest-rojo.txt`);
  - Vitest: 16 fallidas, las 12 nuevas y las 4 adaptadas (`2026-10-28-1026e27-pedido-vitest-rojo.txt`).
- **Verde:**
  - Pest 412/412 en `1026e27`;
  - Vitest 363/363, lint y build limpios (`2026-10-28-87e3af6-pedido-vitest-verde.txt`).
- **Auditorías:** esta rama sale de `main`, sin los parches del PR #41.
  - `npm audit` marca `systeminformation` (alta, de Cypress);
  - `composer.lock` sigue con `symfony/mime` 7.4.17;
  - los dos avisos se resuelven al integrar el #41 y actualizar la rama con `main`.
- **Conteo S05:** 60 Pest y 54 Vitest (114 IDs). Faltan las 14 Cypress del S5.
- **Ajustes de las pruebas nuevas antes del verde:**
  - S05-TC-092: `Queue::fake` registra el trabajo al instante y no respeta `afterCommit`, así que no comprueba que se descarte con el rollback. Se quitó esa aserción; la atomicidad se verifica en las tablas;
  - S05-TC-096: `Queue::fake` también intercepta `dispatch_sync`, así que el matching se llama directamente (`MatchingFlow::prepare`). La ruta de la bandeja del técnico es `/offers`;
  - S05-TC-108: los textos de retirar foto pasan a «Retirar foto N» y «Quitaste la foto.», los que ya usan las Cypress.
- **Pruebas anteriores adaptadas sin cambiar su ID:**
  - de forma: S01-TC-010 y S04-TC-133, 140 y 142, con los campos nuevos (aditivos);
  - de comportamiento: S05-TC-029, 045 y 080 y el complemento de S03-TC-080 (D-92).
- **Cypress (sin ejecutar):**
  - `toDescription` recorre el asistente nuevo;
  - `toSummary` registra el borrador por la API y lo continúa en el asistente anterior;
  - S03-TC-053 y 063 y S04-TC-087 y 099 pasan al pedido (`sendOrder`).
- **Capturas:** 48 con la API real del slot A, en claro y oscuro, a 1366 y 390 px (`2026-10-28-f9e58c5-pedido-*`):
  - cubren los cinco pasos, la confirmación y Mis solicitudes;
  - cada combinación envía un pedido real de 3 rubros;
  - las medidas no muestran desborde horizontal ni elementos recortados, y la barra queda visible.
- **Ajustes vistos en las capturas:**
  - `styles.css` apila todo `label` en columna;
  - el botón principal en claro se veía pálido;
  - faltaba espaciado en los pasos 2 y 4;
  - el grupo del pedido no ocupaba todo el ancho.

## Pendientes

- Las 14 Cypress del S5 para el pedido: falta escribirlas y ejecutarlas.
- La edición del catálogo de síntomas desde el panel (S7).
- Integrar el PR #41 (parches de seguridad) y luego actualizar esta rama con `main` (merge).

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-28.
- **Qué se aceptó:** migración, caso de uso, rutas, asistente, estilos, síntomas sembrados y pruebas.
- **Qué se corrigió:** lo indicado en «Ajustes de las pruebas nuevas antes del verde» y en «Ajustes vistos en las capturas».
- **Revisó:** [PENDIENTE].

## Revisión

- **Revisor:** [PENDIENTE].
