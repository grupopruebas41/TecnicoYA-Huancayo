# Evidencias · Panel del administrador, Fase A1 (base y menú)

- **Fecha:** 2026-11-24.
- **Rama:** `feature/pimentel/admin/a1-base`.
- **Datos:** solo sintéticos (`@example.test`). Las contraseñas se generan al vuelo y no se guardan.

## Pruebas

| Suite | Resultado | Commit |
|---|---|---|
| Pest completa (slot A, `tecnicoya_testing`) | 545 de 546 en la primera corrida; la falla era S01-TC-063, que fija la lista exacta de permisos del administrador y no tenía los 3 de D-119. Se adaptó con la explicación en el código y pasa | `12263e4` y `51008f9` |
| Pest de la fase (S07-TC-144 a 152 y 166) | 10 de 10, más las adaptadas S02-TC-020 y S04-TC-136 | `db92077` |
| Vitest completa | 534 de 534; lint sin avisos y build correcto | `6e5069d` |
| Vitest de la fase (S07-TC-153 a 162) | 10 de 10. S07-TC-161 pasó desde el inicio: fija los 8 ajustes que el administrador ya tenía | `b36bd42` |
| `composer audit` y `npm audit --omit=dev --audit-level=high` | Sin avisos | `12263e4` |
| e2e-cierre en la rama, run `45399494547` | **107 casos, 0 fallos**: S01 17, S02 17, S03 17, S04 18, S05 35 y S07 3. JUnit del S07 en `e2e/` | `12263e4` |

## Rojo

- **Pest (`2d74b51`):** los 9 casos fallaron por lo esperado: falta de permisos, distritos, versión 4 de las reglas y `badges`, y demo-admin sin volver a su primera visita.
- **Vitest (`dee78c3`):** fallaron 9 de 10, además de S07-TC-057 y S07-TC-129, adaptadas al menú nuevo.

## Capturas (`b36bd42`)

Hay 23 capturas con demo-admin (`DemoSeeder`) a 1366 y 390 px, en tema claro y oscuro:
- la primera visita: bienvenida y pasos 1 y 5 del tutorial, con el tema predeterminado de una cuenta nueva;
- Inicio;
- Solicitudes;
- una sección en preparación (Emparejamiento en vivo);
- Ayuda;
- el menú completo: la barra lateral a 1366 px y el cajón a 390 px.

**Mediciones (`…-capturas.json`):** sin desborde, con el contenido centrado, sin texto partido en vertical y sin imágenes rotas en todas las pantallas de la fase.

**Excepción:** Solicitudes a 390 px, pantalla del bloque C que esta fase no cambió. La tabla desborda y los botones «Ver la solicitud N» miden menos de 44 px. Se registra como **DEF-81** y se corrige en la Fase A3.

**Visto en las capturas y corregido (`b36bd42`):** el paso 1 del tutorial resaltaba solo el grupo General.

**Script:** `capturas.mjs`. Usa el slot A y no se ejecuta a la vez que Pest ni Cypress.
