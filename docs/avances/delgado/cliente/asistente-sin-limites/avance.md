# Avance · Panel del cliente final, Fase 1 (frontend)

| Campo | Valor |
|---|---|
| Integrante | Delgado Janampa, Jesus Oscar |
| Sprint | 5 (adelanto, D-87) |
| Módulo | `a-solicitudes` |
| HU/RF y tarea | HU-S03-01, HU-S03-06 y RF-01: asistente por especialidad, sin límite de trabajos (D-95) |
| Rama | `feature/delgado/cliente/asistente-sin-limites`, apilada sobre `feature/mayhuasca/cliente/fix-pedido-mis-solicitudes` |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-04 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | D-95 ([DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md)) |

## Cambios

- **Asistente (`OrderWizard`, `OrderSteps`, `orderModel`):**
  - sin aviso amarillo ni contador de rubros;
  - se pueden marcar las 3 especialidades y cualquier cantidad de subcategorías;
  - una pestaña por especialidad en el paso 3, con los síntomas de todos sus trabajos;
  - una tarjeta por especialidad en el paso 5, con «Se crearán N solicitudes, una por especialidad»;
  - el pie resume especialidades y trabajos;
  - pantalla de bloqueo con 3 pedidos activos y enlace a Mis solicitudes.
- **Errores:** `Notice` muestra la referencia aparte y en tamaño pequeño, con texto normal sobre fondo de error (contraste medido de 14,24:1 en claro y 12,04:1 en oscuro).
- **Perfil público:** estado vacío si el técnico no tiene descripción.
- **Mis solicitudes:** solo lo que exige D-95 (todas las subcategorías en el título). El rediseño es de la Fase 2.

## Pruebas

| Prevista | Ejecutada | Resultado |
|---|---|---|
| Vitest completo | Local | Ver la evidencia `fase1-frontend` |
| Lint, build y `npm audit` | Local | Aprobados, sin vulnerabilidades |
| Capturas (1366 y 390, claro y oscuro) | 52 más 8 repetidas tras corregir el botón de bloqueo | Sin desborde ni recortes |
| Cypress S05-TC-146 y 147 | **Escritas, sin ejecutar** | Menos de 1,5 GB libres |

**Pruebas cambiadas, con motivo:**

- S05-TC-104 a 114, S05-TC-029 y S05-TC-080: textos y modelo del asistente por D-95.
- S03-TC-068 (Cypress, sin ejecutar): el mensaje del límite ahora habla de pedidos.

**Defecto visto en las capturas y corregido:** el botón «Ver Mis solicitudes» no se leía en tema claro (S05-TC-138).

## Pendientes

- Ejecutar las Cypress cuando haya memoria.
- Quitar el `override` de `minimatch` cuando `eslint` admita una versión corregida.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-04 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
