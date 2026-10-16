# RETIRO-01 · Frontend · 2026-10-16

Rama: feature/delgado/infra/retiro-prototipo. Base cced99e; implementación ee4cb8a.
Fuente leída: ANALISIS-S04.md de origin/feature/mayhuasca/b-matching/s04. El retiro figura en §5 (no §4 en esta versión).

## Resultados

| Verificación | Resultado |
| --- | --- |
| Línea base con dependencias | 146/146 Vitest, salida 0 |
| Rojo: enlace #demo | 3 aprobadas, 1 fallida por ausencia de Hero; fallo esperado |
| Verde con cobertura | 117/117, 17 archivos, salida 0 |
| Cobertura | líneas 82,66 %, sentencias 76,82 %, ramas 72,77 %, funciones 77,01 % |
| Build | salida 0, Vite 8.3.4 |
| npm audit | salida 0, 0 vulnerabilidades |

La corrida verde registrada con HEAD f23ed61 incluye los cambios de trabajo confirmados inmediatamente después en ee4cb8a. JUnit y LCOV corresponden a esos mismos cambios; no se repitió la corrida ni se ocultaron fallos.
Se retiran 30 pruebas exclusivas del prototipo sin IDs SNN-TC; se añade un complemento a S02-TC-089 (no suma un ID distinto). 146 - 30 + 1 = 117.

## Alcance y conservación

- Retirados Marketplace, Auth, AccountPanel, marketplace-api, LegacyServiceCarousel y los componentes raíz Announcements/TechnicianProfile, sus seis archivos de pruebas históricos y src/domain completo, incluido rules.json.
- App deja de reconocer #demo como portal; cae en la landing normal. El enlace de demo desaparece con Auth.
- auth.css se mueve a features/administration; se eliminan sus selectores exclusivos del contenedor demo. SessionForm importa el archivo local.
- Comunicados y perfil público ya tenían implementaciones v1 independientes en main; no se copió lógica histórica a ellas.
- marketplace.css se conserva: v1 usa notice, muted y estilos compartidos de formularios/tablas. La condición de borrarlo solo si no se usa no se cumple.
- VideoExperience sigue siendo el envoltorio activo de main, sin dependencia de demo. ScrollServices permanece desconectado del runtime, con sus pruebas.
- laravel-echo ^2.6.1 y pusher-js ^8.6.0 instalados (60cc4a7), sin integración en tiempo real todavía.
- Backend sin cambios. Cypress, Docker y SonarQube no ejecutados. La regresión E2E del retiro corresponde a Claude Code.
- Etiqueta prototipo-historico: no se publicó desde esta rama; confirmar su publicación con el equipo responsable.

Revisor: [PENDIENTE]. Los logs usan fecha UTC; las rutas locales están anonimizadas.
