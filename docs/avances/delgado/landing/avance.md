# Avance · Delgado · rediseño de landing y Nosotros

- Fecha: 2026-10-19. Módulo: frontend público, HU-S02-01 / S02-TC-084, 085 y 089; integración de búsqueda HU-S03.
- Rama: `feature/delgado/landing/rediseno-landing`, desde `origin/main`, solo frontend y documentación.
- Cambio solicitado por el equipo: diez secciones (Header, Hero, Especialidades, Cómo funciona, Confianza, CTA técnicos, Zonas, FAQ, CTA final, Footer). Testimonios pasa a Nosotros. La cabecera tiene los cinco enlaces solicitados y dos accesos; no diez enlaces a todas las secciones. TC-089 conserva verificación exacta de orden, cantidad, IDs y visibilidad y comprueba la nueva navegación.
- Nuevos tokens con tema claro preparado, sin selector; cabecera móvil con foco y Escape; hero y filtros reales, estado de red, contadores; especialidades activas y subcategorías; carrusel 2500 ms y pausas; mapa SVG ilustrativo, FAQ y CTA.
- Nosotros: doce bloques, navegación fija, verificación, seguridad, tarifas, testimonios de ejemplo, equipo, calidad documentada S2 y contacto no operativo rotulado. Formularios no simulan envíos. Pesos del matching rotulados como referencia, no configuración vigente.
- Los filtros se conservan en sessionStorage (solo IDs de catálogo), no credenciales. Las sesiones siguen en Sanctum. Se consumen al abrir la búsqueda del cliente. El registro de técnico queda preseleccionado.
- Imágenes: siete recursos generados, prompts en public/media/landing y public/media/nosotros, WebP entre 113 986 y 198 356 bytes. Imágenes ilustrativas, no evidencia real de servicios.
- Pruebas: commit dd561cd en rojo (7 fallan / 7 pasan). Suite intermedia 160/160; prueba adicional de vuelta al hero detectó modificación no aplicada, se conserva fallo 160/161. Resultado final y cobertura en evidencias/landing/rediseno. Sin Cypress por RAM menor de 1 GiB, sin Docker ni backend.
- Evidencias visuales: antes y después en 1440/375; dimensiones revisadas también en 1024/768. API de desarrollo :3000 no disponible: capturas muestran estado real de error, sin inyectar catálogo ficticio. Antes de la tarea #nosotros abría la landing: el baseline representa esa ausencia. Nombres del equipo anonimizados solo al capturar evidencia; la UI incluye los nombres autorizados por el usuario.
- Pedidos backend: `GET /catalog/specialties` necesita `image_url` de la imagen propia, pública/revisada; `GET /catalog/carousel` necesita `reference_fee` nullable (D-52). No se infiere una foto de especialidad a partir de subcategorías ni una tarifa. Falta un contrato público si se decide mostrar pesos vigentes, por ahora solo referencia explicada.
- SonarQube: no ejecutado en esta tarea; el texto de calidad cita el cierre histórico S2, no certifica el nuevo código.
- Revisor y aprobación: [PENDIENTE]. PR y CI se registran en HANDOFF.

## Uso de IA

- Herramientas: Codex (modelo no expuesto por el entorno), generación de imágenes integrada. Fecha: 2026-10-19.
- Aceptado: componentes, estilos, pruebas, recursos visuales y textos basados en el contrato y pedido del equipo.
- Corregido: selector de pruebas al mostrar las tres especialidades a la vez; mocks del catálogo por endpoint; retorno del observador del video al cambiar de página; separación en componentes de menos de 150 líneas.
- Validación: pruebas automatizadas, build, audit y revisión visual. Revisión humana: [PENDIENTE].

## Publicación

- PR #24: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/24
- Commits: dd561cd (rojo), 1fdfa27 (verde), ee755ad (contraste), 182f25f (evidencias).
- Resultado final local: 161/161, cobertura global de líneas 85,33 %, landing 89,61 %, build aprobado y audit 0 vulnerabilidades.
- CI de 182f25f: backend, frontend y conteo aprobados: https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/39331002647
- Integración y revisión humana: [PENDIENTE].
