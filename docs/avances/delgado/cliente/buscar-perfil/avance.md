# Avance · Fase 3 del panel final: Buscar técnicos y perfil del técnico modernos

| Campo | Valor |
|---|---|
| Integrante | Delgado Janampa, Jesus Oscar (lo ejecuta Claude Code según D-72) |
| Sprint | 5 (adelanto, D-87) |
| Módulo | `b-matching` (pantallas del cliente) y perfil del técnico |
| HU/RF y tarea | HU-S03-04 (RF-C06) y HU-S02-05 (RF-33): Buscar técnicos moderno, favoritos, perfil público con seis secciones y edición del técnico |
| Rama | `feature/delgado/cliente/buscar-perfil`, apilada sobre `feature/mayhuasca/cliente/perfil-publico-v2` |
| Commit/PR | Ver el historial de la rama y su PR |
| Fecha | 2026-11-09 |
| Revisor | [PENDIENTE] |
| Enlace a SonarQube | No aplica todavía: SonarQube corre al cierre del sprint (regla 12b) |
| Decisiones | D-101, propuesta y pendiente de confirmar ([DECISIONES.md](../../../../documentacion/sprints/DECISIONES.md)); contrato S5 §11 |

## Cambios

- **Buscar técnicos:**
  - encabezado con «¿Qué se malogró?» y las tres especialidades como tarjetas grandes con ícono;
  - barra fija de chips: zona, servicio, tarifa máxima, calificación mínima y «Disponible hoy»;
  - orden por cercanía, precio o experiencia, con el aviso honesto de cada uno.
- **Tarjetas:**
  - portada por especialidad, avatar grande y «Verificado»;
  - estrellas reales, de ejemplo con la marca «Ejemplo», o «Nuevo»;
  - «Desde S/», distritos y distancia.
- **Favoritos y estados:** el corazón guarda o quita con su alerta y vuelve atrás si falla; skeleton al cargar y estado vacío con sugerencias.
- **Perfil:**
  - portada, avatar, verificado, experiencia, zonas y calificación;
  - «Solicitar servicio» fijo arriba, y abajo en el celular;
  - seis secciones: Sobre mí, Servicios con «qué incluye», Disponibilidad en tabla, Portafolio con visor accesible, Calificaciones con barras y la marca «Ejemplo · datos de demostración», y Confianza.
- **Visor:** muestra antes y después con textos alternativos; las flechas cambian de trabajo, Tab no sale del diálogo y Esc lo cierra y devuelve el foco. Sin fotos, muestra ilustraciones propias.
- **Técnico:** edita su forma de trabajo, su garantía y «qué incluye» cada servicio, con límites validados en el cliente.
- **Datos E2E del S5:** la técnica de perfil completo, más Rosa Quispe y Diego Huamán con la ficha del DemoSeeder.

## Pruebas

| Prevista | Ejecutada | Resultado |
|---|---|---|
| Rojo S05-TC-197 a 214 | `cd82f1c` | 14 Vitest en rojo; 4 Cypress escritas |
| Verde | `3730504` | 14 en verde |
| Rojo y verde de la 1.ª ronda de capturas (S05-TC-215) | `5bf1047` y `77fbc4f` | Rojo, luego verde |
| Rojo y verde de la 2.ª ronda de capturas (S05-TC-216) | `d2b0267` y `e76749d` | Rojo, luego verde |
| Vitest completo | Local | 418/418 |
| Lint, build y `npm audit` | Local | Aprobados; 0 vulnerabilidades |
| Capturas (1366 y 390, claro y oscuro) | `2026-11-09-e76749d-buscar-perfil-*`, 48 | Sin desborde, sin objetivos de menos de 44 px ni textos recortados |
| Cypress S05-TC-211 a 214 | Ver el relevo | Se ejecuta solo con 1,5 GB libres |

**Pruebas cambiadas, con motivo:**

- **S05-TC-030:** la tarjeta suma el corazón.
- **S03-TC-078:** «Sin calificaciones aún» pasa a «Nuevo», como pide la revisión del equipo.
- **S02-TC-081:** el cuerpo de servicios suma `includes`.
- **S05-TC-049:** «Solicitar servicio» va en la barra fija.
- **Cypress S03-TC-064, 065 y 066:** el rubro se elige con las tarjetas de especialidad, la sección se llama «Portafolio» y el botón de la tarjeta se busca por su texto.

**Defectos vistos en las capturas y corregidos:**

- **Primera ronda:** los chips salían en columna, el nombre quedaba sobre la portada, la portada del perfil era una franja angosta y el corazón quedaba cortado en el celular.
- **Segunda ronda:** `.panel-content label` y el botón fijo antiguo de `client.css` seguían ganando por especificidad.

## Registro de uso de IA

| Campo | Valor |
|---|---|
| Herramienta y modelo | Claude Code, Claude Opus 5.5 |
| Fecha | 2026-11-09 |
| Qué se aceptó | [PENDIENTE] |
| Qué se corrigió | [PENDIENTE] |
| Quién lo revisó | [PENDIENTE] |
