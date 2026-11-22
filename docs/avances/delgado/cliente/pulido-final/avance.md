# Avance · Pulido final del panel del cliente

| Campo | Valor |
|---|---|
| Integrante | Delgado (lo ejecuta Claude Code por pedido de Pimentel) |
| Sprint | 5 (cierre común S4-S5) |
| Módulo | Panel del cliente: `a-solicitudes`, `b-matching` y Premium (Mi hogar / Mi negocio) |
| HU/RF y tarea | Pulido visual y de accesibilidad de 13 pantallas del cliente; defectos DEF-76 a DEF-79 |
| Rama | `feature/delgado/cliente/pulido-final`, desde `main` `c4da798` |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-22 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica: SonarQube corre en el cierre del sprint (regla 12b) |
| Decisiones | CLI-09 (propuesta, pendiente) en [DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md) |

## Cambios

- **Común:**
  - contenido centrado con el mismo ancho (1200 px);
  - encabezado con ícono en un cuadro de color, título, descripción y acción a la derecha;
  - tarjetas con borde suave y elevación;
  - estados como etiqueta de color, con ícono y texto;
  - cuadrículas que llenan el ancho;
  - precios como «S/ 50,00» y fechas como «4 dic · 09:00» o «hace 12 días»;
  - entrada escalonada, desactivada con «Reducir animaciones»;
  - estados vacíos con una ilustración SVG propia;
  - objetivos de 44 px.
- **Pantallas:**
  - Inicio;
  - Buscar técnicos (DEF-77);
  - perfil público (DEF-79);
  - Mis solicitudes y su detalle («Desde alerta IoT»);
  - Técnicos favoritos;
  - Mis equipos (imagen por tipo de equipo y, si falta el archivo, una ilustración);
  - Sensores IoT («Sin datos», DEF-76);
  - Alertas;
  - Promociones;
  - Garantías;
  - Novedades (DEF-78);
  - Preguntas frecuentes;
  - Privacidad y términos.
- **Backend:**
  - estado `no_data` del sensor;
  - siembra demo con 24 h vigentes;
  - datos nuevos para las tarjetas: tipo y estado del equipo y último servicio; rango de la alerta; técnico y días de la garantía; vigencia de la promoción; especialidad y `from_iot_alert`.

## Pruebas

| Prevista | Ejecutada | Resultado |
|---|---|---|
| Pest S05-TC-380 a 387 (rojo) | `5e634fd`, `c05a030` | 6 de 7 en rojo; S05-TC-382 ya pasaba: es la verificación de `iot-simulate` que pidió Pimentel. S05-TC-387 en rojo |
| Vitest S05-TC-388 a 403 (rojo) | `385a5d0` | La suite no carga: faltan los módulos nuevos |
| Verde | Rama | Vitest 518/518, lint sin avisos y build correcto. Pest y e2e-cierre en el relevo |
| Cypress S05-TC-404 a 406 | e2e-cierre | Ver el PR |

Pruebas adaptadas, con la explicación en el código:

- S05-TC-049, 057, 059, 113, 164, 200, 204, 229, 230, 234, 269, 270, 273 y 214;
- S03-TC-079.

Los cambios: precio con coma decimal, subcategorías como chips, un solo rótulo de ejemplo por página, confirmación al quitar un favorito y el acordeón con `aria-expanded`.

## Pendientes

- Las imágenes de `frontend/web/public/img/equipos/`, que genera el equipo. Mientras falten, cada equipo muestra su ilustración.
- La foto propia del equipo tiene prioridad (`photo_url`), pero todavía no hay subida.
- CLI-09: «Responde en ~N min».
- La limpieza de las reglas viejas de `search.css`, en el pulido del técnico.

## Registro de uso de IA

| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Revisó |
|---|---|---|---|---|
| Claude Code (Claude Opus 5.5) | 2026-11-22 | Diseño, código, pruebas, capturas y documentación | Se encontraron otros 3 choques de clases CSS (mini pasos, tabla del perfil y ícono de Confianza); además, la etiqueta «kicker» con poco contraste | [PENDIENTE] |
