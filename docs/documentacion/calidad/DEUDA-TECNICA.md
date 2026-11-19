# Deuda técnica de SonarQube · cierre de los Sprints 4 y 5

- **Fecha:** 2026-11-18.
- **Análisis:** `sprint-05` sobre la rama `feature/pimentel/cierre-sonar/s05`.
- **Código nuevo:** desde la versión `sprint-03` (2026-10-16), así que cubre el Sprint 4 y el Sprint 5.
- **Pedido:** Pimentel pidió corregir de verdad, sin marcar falsos positivos. Esta lista es lo que queda **solo en mantenibilidad**:
  - de severidad Medium, Low o Info;
  - ninguno con impacto en fiabilidad o seguridad, salvo S5693, ya revisado;
  - ninguno de severidad High.
- **Corregido en este cierre:** los 49 hallazgos de fiabilidad, los 45 de mantenibilidad High y los mecánicos de JavaScript. El detalle está en los commits de la rama y en `evidencias/sprint-05/cierre/sonar/README.md`.

## Pendientes por regla

| Regla | Cuántos | Qué pide | Por qué queda |
|---|---|---|---|
| javascript:S6819 | 68 | `<output>` en vez de `role="status"` | Es un cambio de marcado en casi todas las pantallas, y muchas pruebas buscan `getByRole('status')`. `<output>` también tiene el rol `status`, pero no es mecánico: requiere revisar estilos de párrafo y bloque en cada aviso. Va con la ronda de axe (punto 3). |
| css:S4666 | 63 | Selectores duplicados en las hojas | La mayoría son bloques de «correcciones» agregados al final de cada hoja durante las fases. Fusionarlos cambia el orden de la cascada y necesita capturas antes y después de cada pantalla. |
| javascript:S7718 | 55 | Nombrar `error_` al parámetro de `catch` | Es una convención de estilo de la regla que choca con el nombre `error` usado en todo el proyecto. No aporta claridad; se propone desactivarla en el perfil de calidad, con decisión del equipo. |
| javascript:S3358 | 51 | Ternarios anidados | Están casi todos en JSX (texto del estado, clase, ícono). Separarlos uno por uno pide una prueba de pantalla por caso. |
| javascript:S4624 | 15 | Plantillas de texto anidadas | Igual que S3358, en textos visibles. |
| php:S3358 | 13 | Ternarios anidados en PHP | Están en respuestas de la API (estados y textos). Cambiarlos sin pruebas de cada rama arriesga el contrato. |
| javascript:S8980 | 13 | `act()` redundante en pruebas | Son pruebas; quitar el `act` puede volver inestables las que usan reloj controlado. Se revisará cuando se toquen esas pruebas. |
| php:S1172 | 9 | Parámetro sin usar | Casi todos son el `$attribute` de las reglas de validación con closure de Laravel, que la firma exige. |
| css:S7924 | 7 | Contraste mínimo de texto | Requieren medir con los dos temas; quedan para la ronda de axe (punto 3), donde se medirá el contraste real. |
| php:S1142 | 7 | Más de 3 `return` por método | Son retornos tempranos de validación, una forma más clara que anidar condiciones. |
| php:S1135 | 7 | Comentarios TODO | Marcan lo pendiente de los Sprints 6 a 8 (calificaciones, ganancias y asesoría), ya registrado en `DECISIONES.md`. |
| javascript:S8783 | 4 | `force: true` en Cypress | Son Cypress del Sprint 5; se revisan al ejecutar las Cypress en el workflow `e2e-cierre` (punto 2). |
| php:S112 | 4 | Excepciones genéricas | Están en comandos de consola y guardas de siembra, donde el mensaje basta. Una excepción propia por caso no aporta. |
| javascript:S7776 | 4 | Usar `Set` en listas constantes | Mecánico, pero cambia `includes` por `has` en módulos compartidos con la portada. Queda para la próxima ronda junto con S6479. |
| javascript:S6479 | 3 | Índice como `key` | Las listas son fijas (filas de resumen); dar una clave estable pide un identificador que hoy no existe en los datos. |
| javascript:S6481 | 2 | Valor del contexto nuevo en cada render | Necesita `useMemo` en `PanelShell`. Es seguro, pero conviene medirlo con el perfilador. |
| php:S1448 | 1 | `ManageUsers` con 26 métodos | Separar la clase cambia sus dependencias e inyecciones en varios controladores. |
| javascript:S1481, S6754, S7744, S7770 y S9020 | 5 | Variable sin usar, `useState` sin destructurar, objeto vacío, `String` directo y `findByRole` | Mecánicos y pequeños; quedan para la próxima ronda. |
| php:S5693 | 1 | Límite de tamaño de la subida | **Revisado y aceptado por Pimentel** (D-46, 5 MB). En el último análisis sigue `OPEN` en SonarQube: hay que volver a aceptarlo en la interfaz. |

Total: **332 hallazgos de mantenibilidad** en el código nuevo, de severidad Medium, Low o Info, más S5693.
