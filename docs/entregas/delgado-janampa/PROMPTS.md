# Prompts utilizados · Delgado Janampa, Jesus Oscar

**Área de responsabilidad:** Frontend (React + Vite, Vitest y Cypress)  
**Proyecto:** TécnicoYa Huancayo · Pruebas y Calidad de Software 2026-2 · Universidad Continental  
**PR principales del área:** #20 (frontend S4), #22, #23 (DEF-47), #24 (landing y Nosotros), #25 (vitrina 3D), #27 (pulido visual), #30 (inicio de sesión). Ramas feature/delgado/...

Los prompts se ejecutaron con agentes de IA (Claude Code y Codex) sobre el repositorio; cada resultado se revisó en el navegador y se integró por pull request. Se agrupan por el área a la que pertenece el trabajo.

Las rutas personales se reemplazaron por `<carpeta-proyecto>`.

## Parte 1 · Prompts de los Sprints 1 a 4 (plan de trabajo)

### Prompt 1.4   CODEX   Deuda del frontend

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/f-administracion/s00 (desde main con 1.2 integrado) · Empieza: en paralelo con 1.3_

```text
Lee AGENTS.md y docs/documentacion/sprints/ENTORNO-PARALELO.md. Eres el agente de frontend. Trabaja solo en frontend/web.
1. DEF-18: npm audit reporta 7 vulnerabilidades (2 críticas, 2 altas, 3 moderadas). Corrígelas con npm audit fix y, si hace falta, actualizando paquetes concretos. No uses --force sin mostrarme antes qué cambiaría.
2. DEF-08: agrega type="button" o type="submit" a los 7 botones dentro de formularios que señaló SonarQube (regla S9011).
3. DEF-10: la expresión regular del correo en forms.jsx tiene posible retroceso superlineal. Limita la longitud de la entrada y simplifica la expresión. Agrega pruebas Vitest con valores límite.
4. Configura la cobertura de Vitest (@vitest/coverage-v8, reporte lcov y texto) y el reporte JUnit para el script de conteo. Agrega el lcov a sonar-project.properties si corresponde.
5. Lista los textos visibles que sigan en inglés en las pantallas v1 y tradúcelos.
6. Ejecuta npm test, npm run build y npm audit. Guarda las salidas en docs/documentacion/evidencias/sprint-00/frontend/.
Un commit por punto (fix(s00): …). Actualiza HANDOFF-codex.md. Push de la rama y PR. Dime qué cerraste y el resultado de cada comando.
```

### Prompt S1.4   CODEX   Pantallas del sprint y pruebas Vitest

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/f-administracion/s01 (desde main actualizado) · Empieza: existe docs/api/contrato-S01.md · En paralelo con S1.2 y S1.3_

```text
Lee AGENTS.md, HANDOFF-claude.md, HANDOFF-codex.md, docs/api/contrato-S01.md y docs/documentacion/plan-pruebas-v3/sprint-01/CASOS-S01.md. El contrato está en la rama feature/mayhuasca/f-administracion/s01: tráelo con git fetch y git checkout feature/mayhuasca/f-administracion/s01 -- docs/api/contrato-S01.md docs/documentacion/plan-pruebas-v3/sprint-01/ (sin traer código del backend).
Construye las pantallas del Sprint 1 sobre /api/v1 con la sesión Sanctum existente (reutiliza src/features/administration/http.js), en src/features/administration:
registro de cliente y de técnico (queda Pendiente de verificación), inicio y cierre de sesión con redirección por rol, rutas protegidas por rol, perfil propio con aviso de conflicto 409, catálogo público, mensajes en español.
Reglas de interfaz:
- Textos en español. Alerta de éxito y de error en cada operación CRUD; ante 422 o 500 no hay falso éxito y se conserva lo escrito.
- Validación en el cliente que replique la del servidor (doble validación), sin reemplazarla. Confirmación antes de eliminar.
- Estados de carga y estados vacíos honestos: nunca datos ficticios ni de la demo.
- Accesible con teclado, labels asociados, foco visible y botones con type explícito.
- No toques backend/. Si el contrato no alcanza, escribe la necesidad en HANDOFF-codex.md para Claude Code y, mientras tanto, simula la respuesta solo dentro de las pruebas.
Primero escribe los casos Vitest del catálogo (S01-TC-…) en rojo y haz commit «test(s01): pruebas Vitest en rojo»; después implementa hasta verde con commits «feat(s01): …».
Ejecuta npm test (con cobertura), npm run build y npm audit. Guarda la salida en docs/documentacion/evidencias/sprint-01/vitest-verde.txt. Escribe docs/avances/delgado/sprint-01/avance.md según la adenda P10, con el registro de uso de IA (Codex, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Actualiza HANDOFF-codex.md, push de la rama y PR hacia main con capturas de las pantallas nuevas.
```

### Prompt S1.5   CODEX   Pruebas Cypress contra el backend real

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/f-administracion/s01 · Empieza: integraste el PR de S1.3 · Slot B_

```text
Lee AGENTS.md y los HANDOFF. El backend del Sprint 1 ya está en main: actualiza tu rama con git fetch y git merge origin/main y resuelve conflictos solo en frontend/.
Implementa los casos Cypress del catálogo (S01-TC-…) en frontend/web/cypress/e2e/sprint-01/:
- Contra el backend real y la base del slot B, con el arrancador node scripts/run-e2e.mjs --sprint 01 (TECNICOYA_SLOT=B). Si el arrancador necesita seeders del sprint, pídelos a Claude Code en HANDOFF-codex.md o agrégalos solo si el prompt S1.3 no los creó.
- No uses cy.intercept para inventar respuestas del servidor; solo para provocar fallos de red o 500 en los casos de alertas.
- Plazos visibles con cy.clock. Selectores estables (data-testid o roles accesibles).
- Sin reintentos automáticos que oculten fallos.
Ejecuta en Chrome y Edge (y en Firefox si está instalado). Corre también los Cypress de los sprints anteriores (regresión).
Guarda el resumen de la terminal en docs/documentacion/evidencias/sprint-01/cypress/ y las capturas o videos de los fallos, si los hubo. Commit «test(s01): pruebas Cypress del Sprint 1». Actualiza HANDOFF-codex.md, push y actualiza el PR.
```

### Prompt S2.4   CODEX   Pantallas del sprint y pruebas Vitest

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/f-administracion/s02 (desde main actualizado) · Empieza: existe docs/api/contrato-S02.md · En paralelo con S2.2 y S2.3_

```text
Lee AGENTS.md, HANDOFF-claude.md, HANDOFF-codex.md, docs/api/contrato-S02.md y docs/documentacion/plan-pruebas-v3/sprint-02/CASOS-S02.md. El contrato está en la rama feature/mayhuasca/f-administracion/s02: tráelo con git fetch y git checkout feature/mayhuasca/f-administracion/s02 -- docs/api/contrato-S02.md docs/documentacion/plan-pruebas-v3/sprint-02/ (sin traer código del backend).
Construye las pantallas del Sprint 2 sobre /api/v1 con la sesión Sanctum existente (reutiliza src/features/administration/http.js), en src/features/catalog, src/features/technician y src/features/admin:
landing conectada al catálogo v1 (carrusel por subcategoría, sin datos de la demo y con los códigos del catálogo sembrado); panel administrador: categorías y subcategorías, comunicados, verificación de técnicos; panel técnico: mi perfil y portafolio, disponibilidad y zona, servicios y tarifas, pausa; carrusel de comunicados en el inicio de cada rol.
Reglas de interfaz:
- Textos en español. Alerta de éxito y de error en cada operación CRUD; ante 422 o 500 no hay falso éxito y se conserva lo escrito.
- Validación en el cliente que replique la del servidor (doble validación), sin reemplazarla. Confirmación antes de eliminar.
- Estados de carga y estados vacíos honestos: nunca datos ficticios ni de la demo.
- Accesible con teclado, labels asociados, foco visible y botones con type explícito.
- No toques backend/. Si el contrato no alcanza, escribe la necesidad en HANDOFF-codex.md para Claude Code y, mientras tanto, simula la respuesta solo dentro de las pruebas.
Primero escribe los casos Vitest del catálogo (S02-TC-…) en rojo y haz commit «test(s02): pruebas Vitest en rojo»; después implementa hasta verde con commits «feat(s02): …».
Ejecuta npm test (con cobertura), npm run build y npm audit. Guarda la salida en docs/documentacion/evidencias/sprint-02/vitest-verde.txt. Escribe docs/avances/delgado/sprint-02/avance.md según la adenda P10, con el registro de uso de IA (Codex, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Actualiza HANDOFF-codex.md, push de la rama y PR hacia main con capturas de las pantallas nuevas.
```

### Prompt S2.5   CODEX   Pruebas Cypress contra el backend real

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/f-administracion/s02 · Empieza: integraste el PR de S2.3 · Slot B_

```text
Lee AGENTS.md y los HANDOFF. El backend del Sprint 2 ya está en main: actualiza tu rama con git fetch y git merge origin/main y resuelve conflictos solo en frontend/.
Implementa los casos Cypress del catálogo (S02-TC-…) en frontend/web/cypress/e2e/sprint-02/:
- Contra el backend real y la base del slot B, con el arrancador node scripts/run-e2e.mjs --sprint 02 (TECNICOYA_SLOT=B). Si el arrancador necesita seeders del sprint, pídelos a Claude Code en HANDOFF-codex.md o agrégalos solo si el prompt S2.3 no los creó.
- No uses cy.intercept para inventar respuestas del servidor; solo para provocar fallos de red o 500 en los casos de alertas.
- Plazos visibles con cy.clock. Selectores estables (data-testid o roles accesibles).
- Sin reintentos automáticos que oculten fallos.
Ejecuta en Chrome y Edge (y en Firefox si está instalado). Corre también los Cypress de los sprints anteriores (regresión).
Guarda el resumen de la terminal en docs/documentacion/evidencias/sprint-02/cypress/ y las capturas o videos de los fallos, si los hubo. Commit «test(s02): pruebas Cypress del Sprint 2». Actualiza HANDOFF-codex.md, push y actualiza el PR.
```

### Prompt S3.4   CODEX   Pantallas del sprint y pruebas Vitest

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/a-solicitudes/s03 (desde main actualizado) · Empieza: existe docs/api/contrato-S03.md · En paralelo con S3.2 y S3.3_

```text
Lee AGENTS.md, HANDOFF-claude.md, HANDOFF-codex.md, docs/api/contrato-S03.md y docs/documentacion/plan-pruebas-v3/sprint-03/CASOS-S03.md. El contrato está en la rama feature/mayhuasca/a-solicitudes/s03: tráelo con git fetch y git checkout feature/mayhuasca/a-solicitudes/s03 -- docs/api/contrato-S03.md docs/documentacion/plan-pruebas-v3/sprint-03/ (sin traer código del backend).
Construye las pantallas del Sprint 3 sobre /api/v1 con la sesión Sanctum existente (reutiliza src/features/administration/http.js), en src/features/requests y src/features/search:
asistente Nueva solicitud en 5 pasos (especialidad, subcategoría, descripción y fotos, ubicación, resumen y envío) con pantalla de espera honesta, sin asignaciones ficticias; aviso de resultado incierto si se pierde la respuesta (TC-125); Buscar técnicos con filtros; perfil público con portafolio; Solicitar servicio con el técnico precargado; Mis solicitudes con pestañas.
Reglas de interfaz:
- Textos en español. Alerta de éxito y de error en cada operación CRUD; ante 422 o 500 no hay falso éxito y se conserva lo escrito.
- Validación en el cliente que replique la del servidor (doble validación), sin reemplazarla. Confirmación antes de eliminar.
- Estados de carga y estados vacíos honestos: nunca datos ficticios ni de la demo.
- Accesible con teclado, labels asociados, foco visible y botones con type explícito.
- No toques backend/. Si el contrato no alcanza, escribe la necesidad en HANDOFF-codex.md para Claude Code y, mientras tanto, simula la respuesta solo dentro de las pruebas.
Primero escribe los casos Vitest del catálogo (S03-TC-…) en rojo y haz commit «test(s03): pruebas Vitest en rojo»; después implementa hasta verde con commits «feat(s03): …».
Ejecuta npm test (con cobertura), npm run build y npm audit. Guarda la salida en docs/documentacion/evidencias/sprint-03/vitest-verde.txt. Escribe docs/avances/delgado/sprint-03/avance.md según la adenda P10, con el registro de uso de IA (Codex, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Actualiza HANDOFF-codex.md, push de la rama y PR hacia main con capturas de las pantallas nuevas.
```

### Prompt S3.5   CODEX   Pruebas Cypress contra el backend real

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/a-solicitudes/s03 · Empieza: integraste el PR de S3.3 · Slot B_

```text
Lee AGENTS.md y los HANDOFF. El backend del Sprint 3 ya está en main: actualiza tu rama con git fetch y git merge origin/main y resuelve conflictos solo en frontend/.
Implementa los casos Cypress del catálogo (S03-TC-…) en frontend/web/cypress/e2e/sprint-03/:
- Contra el backend real y la base del slot B, con el arrancador node scripts/run-e2e.mjs --sprint 03 (TECNICOYA_SLOT=B). Si el arrancador necesita seeders del sprint, pídelos a Claude Code en HANDOFF-codex.md o agrégalos solo si el prompt S3.3 no los creó.
- No uses cy.intercept para inventar respuestas del servidor; solo para provocar fallos de red o 500 en los casos de alertas.
- Plazos visibles con cy.clock. Selectores estables (data-testid o roles accesibles).
- Sin reintentos automáticos que oculten fallos.
Ejecuta en Chrome y Edge (y en Firefox si está instalado). Corre también los Cypress de los sprints anteriores (regresión).
Guarda el resumen de la terminal en docs/documentacion/evidencias/sprint-03/cypress/ y las capturas o videos de los fallos, si los hubo. Commit «test(s03): pruebas Cypress del Sprint 3». Actualiza HANDOFF-codex.md, push y actualiza el PR.
```

### Prompt S4.4   CODEX   Pantallas del sprint y pruebas Vitest

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/b-matching/s04 (desde main actualizado) · Empieza: existe docs/api/contrato-S04.md · En paralelo con S4.2 y S4.3_

```text
Lee AGENTS.md, HANDOFF-claude.md, HANDOFF-codex.md, docs/api/contrato-S04.md y docs/documentacion/plan-pruebas-v3/sprint-04/CASOS-S04.md. El contrato está en la rama feature/mayhuasca/b-matching/s04: tráelo con git fetch y git checkout feature/mayhuasca/b-matching/s04 -- docs/api/contrato-S04.md docs/documentacion/plan-pruebas-v3/sprint-04/ (sin traer código del backend).
Construye las pantallas del Sprint 4 sobre /api/v1 con la sesión Sanctum existente (reutiliza src/features/administration/http.js), en src/features/offers:
técnico: solicitudes entrantes con cronómetro del SLA, aceptar y rechazar; cliente: espera, ofertas recibidas, elegir técnico, aviso de Pendiente de disponibilidad; actualización en tiempo real con Laravel Echo y recuperación del estado al reconectar.
Reglas de interfaz:
- Textos en español. Alerta de éxito y de error en cada operación CRUD; ante 422 o 500 no hay falso éxito y se conserva lo escrito.
- Validación en el cliente que replique la del servidor (doble validación), sin reemplazarla. Confirmación antes de eliminar.
- Estados de carga y estados vacíos honestos: nunca datos ficticios ni de la demo.
- Accesible con teclado, labels asociados, foco visible y botones con type explícito.
- No toques backend/. Si el contrato no alcanza, escribe la necesidad en HANDOFF-codex.md para Claude Code y, mientras tanto, simula la respuesta solo dentro de las pruebas.
Primero escribe los casos Vitest del catálogo (S04-TC-…) en rojo y haz commit «test(s04): pruebas Vitest en rojo»; después implementa hasta verde con commits «feat(s04): …».
Ejecuta npm test (con cobertura), npm run build y npm audit. Guarda la salida en docs/documentacion/evidencias/sprint-04/vitest-verde.txt. Escribe docs/avances/delgado/sprint-04/avance.md según la adenda P10, con el registro de uso de IA (Codex, modelo, fecha, qué se aceptó y qué se corrigió) y el revisor como [PENDIENTE]. Actualiza HANDOFF-codex.md, push de la rama y PR hacia main con capturas de las pantallas nuevas.
```

### Prompt S4.5   CODEX   Pruebas Cypress contra el backend real

_Carpeta: ..\TecnicoYa-cx · Rama: feature/delgado/b-matching/s04 · Empieza: integraste el PR de S4.3 · Slot B_

```text
Lee AGENTS.md y los HANDOFF. El backend del Sprint 4 ya está en main: actualiza tu rama con git fetch y git merge origin/main y resuelve conflictos solo en frontend/.
Implementa los casos Cypress del catálogo (S04-TC-…) en frontend/web/cypress/e2e/sprint-04/:
- Contra el backend real y la base del slot B, con el arrancador node scripts/run-e2e.mjs --sprint 04 (TECNICOYA_SLOT=B). Si el arrancador necesita seeders del sprint, pídelos a Claude Code en HANDOFF-codex.md o agrégalos solo si el prompt S4.3 no los creó.
- No uses cy.intercept para inventar respuestas del servidor; solo para provocar fallos de red o 500 en los casos de alertas.
- Plazos visibles con cy.clock. Selectores estables (data-testid o roles accesibles).
- Sin reintentos automáticos que oculten fallos.
Ejecuta en Chrome y Edge (y en Firefox si está instalado). Corre también los Cypress de los sprints anteriores (regresión).
Guarda el resumen de la terminal en docs/documentacion/evidencias/sprint-04/cypress/ y las capturas o videos de los fallos, si los hubo. Commit «test(s04): pruebas Cypress del Sprint 4». Actualiza HANDOFF-codex.md, push y actualiza el PR.
```

## Parte 2 · Prompts del rediseño y del adelanto del Sprint 7 (octubre 2026)

### 2026-10-20 · PR #24 · Hero centrado, cabecera con recuadro y fondo fijo

```text
Corrección visual del PR #24 (rama feature/delgado/landing/rediseno-landing) en TecnicoYa-cx.
Trabaja solo en frontend/web. No toques backend/, no hagas push a main, no fuerces push.
Haz commit en la MISMA rama para que se actualice el PR #24.

Referencia: el hero ANTERIOR (el del prototipo previo a tu rediseño) es el que le gusta al equipo.
Recupera ese estilo y combínalo con lo bueno del rediseño actual.

1. HERO (centrado, como el diseño anterior)
   - Todo el contenido centrado horizontalmente (texto y botones), no alineado a la izquierda.
   - Arriba: una etiqueta tipo "pill" con borde fino y fondo translúcido:
     "Para tu hogar. Para tu negocio. Para Huancayo."
   - Título grande en la fuente serif itálica (la misma del "cerca de ti." actual), en 4 líneas:
       "El técnico" / "indicado."  → color crema/blanco
       "Aquí, en" / "Huancayo."   → color dorado (el acento actual)
     Tamaño responsivo con clamp(), sin desbordar en móvil.
   - Subtítulo centrado, 2 líneas, opacidad suave:
     "Conectamos hogares y MYPES con técnicos independientes verificados.
      Cuéntanos la falla y encuentra a quien puede resolverla."
   - Dos botones centrados:
       "Encontrar un técnico ↗" (relleno crema) → lleva a #servicios
       "Crear mi cuenta" (contorno) → /registro (o la ruta de registro existente)
   - QUITA del hero el buscador "¿Qué necesitas? / ¿Dónde?" y el mensaje de error del catálogo.
     Si el buscador sigue siendo útil, muévelo al inicio de la sección #servicios.
   - Animación de entrada sutil (fade + translateY escalonado) respetando prefers-reduced-motion.

2. CABECERA
   - Izquierda: logo TécnicoYa / HUANCAYO (igual que ahora).
   - Centro: los enlaces dentro de UN recuadro tipo pill (borde redondeado completo,
     borde fino semitransparente, fondo translúcido con backdrop-filter: blur),
     en UNA sola fila y SOLO estos 5:
       Servicios (#servicios) · Cómo funciona (#proceso) · Para técnicos (#tecnicos)
       · Nosotros (#nosotros) · Preguntas (#preguntas)
     Nada de "Encabezado", "Inicio", "Confianza", "Testimonios", "Empezar", "Contacto".
   - Derecha: SOLO el botón "Iniciar sesión" (relleno crema). Elimina "Crear cuenta" de la cabecera
     (el registro ya está en el botón del hero).
   - Al hacer scroll la cabecera se queda fija con un fondo algo más sólido para legibilidad.
   - En móvil (<= 900px): el recuadro se convierte en menú hamburguesa; "Iniciar sesión" queda visible.
   - Revisa que los dos iconos pequeños que aparecen arriba al centro (sobre el menú)
     no sean parte de la app; si lo son, quítalos.

3. IMAGEN DE FONDO ESTÁTICA
   - La imagen del hero debe quedar FIJA detrás de toda la página: al hacer scroll las secciones
     pasan por encima y la imagen se sigue viendo, sin moverse.
   - Elimina cualquier parallax, zoom o animación (Ken Burns) de la imagen.
   - Implementación: una capa position: fixed; inset: 0; z-index: -1 con la imagen en
     object-fit: cover (no uses background-attachment: fixed porque falla en iOS).
   - Overlay oscuro encima de la imagen para que el texto se lea bien.
   - Las secciones de abajo deben tener fondo semitransparente (por ejemplo rgba del token
     de fondo al 80–88 % + blur suave), para que se note la imagen detrás y no se vean opacas.
     Usa los tokens de tokens.css y mantén el contraste WCAG AA del texto.

4. ERROR DEL CATÁLOGO
   - En la revisión local aparece "No pudimos cargar el catálogo" con el backend corriendo en
     127.0.0.1:3000. Verifica que el proxy de Vite y las rutas que usas (/api/v1/catalog/...)
     sean las mismas que en main. No modifiques el backend; si el fallo es del backend, repórtalo.

5. PRUEBAS Y ENTREGA
   - Actualiza/agrega pruebas Vitest: hero centrado con los textos exactos, cabecera con solo
     los 5 enlaces y solo "Iniciar sesión", ausencia de "Crear cuenta" en la cabecera,
     capa de fondo fija presente, menú móvil.
   - npm run test, npm run lint y npm run build deben pasar.
   - No ejecutes Cypress (poca RAM).
   - Al final dame: archivos cambiados, conteo de pruebas Vitest y confirmación del push a la rama.
```

### 2026-10-20 · PR #24 · Video de fondo que se pausa fuera del hero

```text
Ajuste del fondo del hero en el PR #24 (misma rama feature/delgado/landing/rediseno-landing).
Solo frontend/web. No toques backend/, no hagas push a main, no fuerces push. Commit en la misma rama.

El equipo aprobó todo lo demás. Solo cambia el comportamiento del VIDEO de fondo:

1. Conserva la animación de entrada tal como estaba: al cargar la página el video se reproduce
   con su zoom de entrada y retroceso. NO la elimines ni la modifiques.
   (Si en el commit anterior quitaste ese zoom por mi indicación de "sin animación", restáuralo.)

2. Mientras el hero (cabecera con TécnicoYa, el menú, "Iniciar sesión", el título y los botones)
   esté visible en pantalla, el video sigue reproduciéndose normalmente.

3. Cuando el usuario baja y el hero sale de la vista (al llegar a #servicios / Especialidades
   y las demás secciones):
   - el video se PAUSA (video.pause()), sin zoom, sin parallax, sin movimiento;
   - queda como fondo FIJO detrás de las secciones (capa position: fixed; inset: 0; z-index: -1;
     object-fit: cover), mostrando el fotograma en pausa (o el poster si aún no cargó);
   - las secciones siguen con su fondo semitransparente para que se vea la imagen detrás.

4. Si el usuario vuelve a subir al hero, el video se reanuda (video.play()) desde donde quedó.
   El zoom de entrada solo ocurre una vez, en la carga inicial.

5. Implementación:
   - Usa IntersectionObserver sobre la sección del hero (threshold aprox. 0.15).
     No uses listeners de scroll pesados.
   - El video debe tener muted, playsInline y poster (una imagen WebP del mismo plano)
     para que en móvil o si falla la carga se vea la imagen estática.
   - Con prefers-reduced-motion: no se reproduce el video, se muestra solo el poster fijo.
   - Limpia el observer al desmontar el componente.

6. Pruebas Vitest: mockea IntersectionObserver y HTMLMediaElement.play/pause y verifica que
   se pausa al salir el hero, se reanuda al volver y que con reduced-motion no se reproduce.
   npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
   Al final dame: archivos cambiados, conteo de pruebas Vitest y confirmación del push.
```

### 2026-10-21 · PR #24 · Restaurar la intro del video

```text
Corrección en el PR #24 (misma rama feature/delgado/landing/rediseno-landing).
Solo frontend/web. No toques backend/, no hagas push a main, no fuerces push. Commit en la misma rama.

Todo lo demás está aprobado (cabecera con recuadro pill, hero centrado, fondo fijo que se pausa
al bajar). NO cambies nada de eso.

Lo que se perdió y hay que RESTAURAR es la secuencia de intro al cargar la página:

1. Fase 1 – Video solo:
   - Al cargar, el video ocupa toda la pantalla y se reproduce SIN nada encima:
     sin cabecera, sin menú, sin "Iniciar sesión", sin título, sin botones, sin overlay oscuro.

2. Fase 2 – El video se va al fondo:
   - Tras la duración de la intro (la misma que tenía antes), el video hace la transición
     de zoom y retroceso hacia atrás y se oscurece con el overlay, quedando como fondo.

3. Fase 3 – Aparece el contenido:
   - Recién cuando termina esa transición aparecen, con fade + translateY escalonado:
     cabecera (logo, recuadro del menú, Iniciar sesión) → etiqueta pill → título →
     subtítulo → botones.

4. Recupera la implementación original:
   - Busca en el historial cómo estaba hecha antes de tu rediseño
     (por ejemplo: git log -p -- frontend/web/src en main o en el tag v0.3-antes-retiro-prototipo,
     buscando el componente del hero/intro, keyframes o estados como "intro").
   - Reutiliza los mismos tiempos, keyframes y estilo de transición; adáptalos al hero nuevo.

5. Reglas adicionales:
   - La intro corre solo una vez por carga de página. Al volver a subir al hero no se repite:
     el video solo se reanuda (como ya funciona).
   - Durante la intro el scroll puede quedar bloqueado; libéralo al terminar.
   - Si el video tarda en cargar o falla, usa el poster y salta directo a la Fase 3
     (sin quedarse en pantalla vacía). Pon un tiempo máximo de espera.
   - Con prefers-reduced-motion: sin intro, se muestra directamente la Fase 3 con el poster.
   - Mantén IntersectionObserver de pausa/reanudación ya implementado.

6. Pruebas Vitest (con timers falsos y mocks de video):
   - al montar no se ve la cabecera ni el título;
   - tras la intro aparecen cabecera y título;
   - reduced-motion muestra el contenido de inmediato;
   - si el video falla, el contenido aparece tras el tiempo máximo.
   npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
   Al final dame: de qué commit/archivo recuperaste la intro, archivos cambiados,
   conteo de pruebas Vitest y confirmación del push.
```

### 2026-10-21 · PR #24 · Mapa 3D y vitrina de especialidades

```text
Mejora de dos secciones en el PR #24 (misma rama feature/delgado/landing/rediseno-landing).
Solo frontend/web. No toques backend/, no hagas push a main, no fuerces push. Commit en la misma rama.
No cambies el hero, la cabecera, la intro del video ni el fondo fijo (ya están aprobados).

==================================================
A) SECCIÓN "AQUÍ, EN HUANCAYO" – MAPA CON EFECTO 3D
==================================================
Las tres zonas (El Tambo, Huancayo, Chilca) deben "sobresalir" en 3D al pasar el mouse:
- Contenedor con perspective: 1000px; cada polígono con transform-style: preserve-3d.
- En hover/focus la zona se eleva: translateZ(40px) + translateY(-8px) + leve rotateX(8deg),
  sombra proyectada abajo (drop-shadow) que crece, borde y nombre en dorado (token de acento),
  relleno un poco más claro. Las otras dos zonas bajan a opacidad 0.6.
- Simula grosor: una capa duplicada del polígono, desplazada unos px hacia abajo y más oscura
  (el "canto" de la pieza), que se ve al elevarse.
- Al entrar a la vista, las tres piezas aparecen escalonadas desde abajo (una sola vez).
- Tooltip o texto bajo el mapa con el nombre de la zona activa.
- Accesible: cada zona es enfocable con teclado (tabIndex=0, aria-label) y el efecto también
  funciona con focus. En táctil: tap activa la zona.
- prefers-reduced-motion: solo cambio de color, sin desplazamientos.
- El texto "Zonas no disponibles por el momento" debe desaparecer cuando el catálogo de distritos
  cargue bien (ver punto C). Mantén la nota "Mapa ilustrativo, sin límites geográficos...".

==================================================
B) SECCIÓN "ESPECIALIDADES" – VITRINA CON CARRUSEL
==================================================
QUITA de esta sección el buscador ("¿Qué necesitas? / ¿Dónde?" y su botón). La landing no busca:
solo muestra. Reemplázalo por una vitrina inspirada en un carrusel de producto:

Layout escritorio (2 columnas):
- IZQUIERDA – la especialidad activa:
  * imagen grande con esquinas redondeadas (image_url de la especialidad si viene del API;
    si no, la imagen de su primera subcategoría como fallback);
  * nombre de la especialidad en la serif del sitio, número "01 / 06" en dorado;
  * descripción breve (del catálogo; si no hay, una frase genérica por especialidad);
  * "Desde S/ X" solo si el API trae reference_fee (si no, no muestres precio inventado);
  * botón "Ver técnicos de <especialidad>" que lleva a registro/login.
- DERECHA – mini carrusel de sus 3 subespecialidades:
  * 3 tarjetas verticales apiladas: la central al frente (escala 1, opacidad 1), las laterales
    detrás y desplazadas (escala 0.85, opacidad 0.55, blur leve), con perspectiva 3D.
  * rotación automática cada 3 s: la tarjeta de un lado pasa al centro con transición suave
    (transform + opacity, ~600 ms, ease-out).
  * cada tarjeta: imagen de la subcategoría (frontend/web/public/media/services/subcategorias/
    o carousel_media_id/URL del API cuando exista) y su nombre sobre un degradado inferior.
  * leyenda debajo: "Subespecialidades disponibles" + puntos indicadores (3).
  * pausa al pasar el mouse o al enfocar; clic en una lateral la trae al centro.

Navegación entre especialidades:
- Flechas ‹ › y una fila de chips/pestañas con el nombre de cada especialidad.
- Al cambiar de especialidad: la imagen izquierda hace crossfade + leve desplazamiento,
  el texto entra escalonado y el mini carrusel se reinicia con las 3 subespecialidades nuevas.
- Avance automático de especialidad cada ~9 s (después de un ciclo completo del mini carrusel),
  con barra de progreso fina en dorado bajo los chips. Pausa en hover/focus o si la pestaña
  del navegador está oculta (visibilitychange).
- Swipe en táctil.

Móvil (<= 900px): una columna: chips deslizables arriba, imagen de la especialidad, texto,
y debajo el mini carrusel con las 3 tarjetas.

Datos:
- Usa SOLO el catálogo real (GET /api/v1/catalog/specialties y subcategorías asociadas).
  No inventes especialidades ni subespecialidades. Si una especialidad trae menos o más de 3
  subcategorías, el carrusel se adapta (1 tarjeta: sin rotación; >3: rota por todas).
- Para las imágenes locales, crea un mapa por slug en un archivo de constantes, con fallback
  a una imagen genérica. Imágenes con loading="lazy", width/height y alt descriptivo.
- Estados: cargando (skeleton con la misma forma), error (un solo mensaje y un solo botón
  "Reintentar"; ahora salen DOS mensajes y DOS botones, deja uno) y vacío.

Accesibilidad: aria-roledescription="carrusel", aria-live="polite" en la especialidad activa,
botones con aria-label, navegación con flechas del teclado. prefers-reduced-motion: sin
rotación automática, cambios sin animación.

==================================================
C) ERROR DEL CATÁLOGO (bloquea A y B)
==================================================
Con el backend corriendo en http://127.0.0.1:3000 desde la carpeta principal, la landing de
TecnicoYa-cx muestra "No pudimos cargar el catálogo" y "El servicio no está disponible".
- Compara vite.config.js, .env.development (sin imprimir secretos) y la base URL del cliente HTTP
  de esta rama contra main. El proxy debe apuntar a 127.0.0.1:3000 para /api.
- Revisa en la consola de Vite si aparece ECONNREFUSED o 404 y con qué ruta.
- Si la causa está en el frontend, corrígela. Si es del backend (ruta inexistente o error 500),
  NO lo toques: repórtame la ruta y el código de estado.

==================================================
D) PRUEBAS Y ENTREGA
==================================================
Vitest (timers falsos, mocks de IntersectionObserver y del API):
- la sección Especialidades ya no tiene selects ni botón de búsqueda;
- muestra la especialidad activa con sus subespecialidades reales;
- el mini carrusel rota, se pausa en hover y responde a clic;
- flechas y chips cambian de especialidad;
- reduced-motion desactiva la rotación;
- error muestra un solo mensaje y un solo botón;
- zonas del mapa enfocables y con estado activo.
npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
Al final dame: causa del error del catálogo, archivos cambiados, conteo de pruebas Vitest
y confirmación del push.
```

### 2026-10-21 · PR #24 · Página Nosotros (submenú, mapa del tesoro, testimonios 3D)

```text
Mejoras visuales de la página "Nosotros" en el PR #24 (misma rama feature/delgado/landing/rediseno-landing).
Solo frontend/web. No toques backend/, no hagas push a main, no fuerces push. Commit en la misma rama.
No cambies la landing principal (hero, intro de video, especialidades, mapa) salvo lo indicado.

==================================================
1) SUBMENÚ (Quiénes somos · Cómo verificamos · Tu seguridad · Testimonios · Equipo · Contacto)
==================================================
Estado inicial (sobre la foto del hero):
- La barra debe ser TRANSPARENTE: sin fondo sólido, para que la imagen del hero se vea completa
  de arriba a abajo (ahora la corta en una franja verde).
- El hero debe empezar detrás de la cabecera y del submenú (que la imagen suba hasta arriba).
- Los enlaces deben leerse sobre la foto: texto crema con text-shadow suave y, detrás de los
  enlaces, un degradado oscuro superior muy sutil (de rgba oscuro 0.55 a transparente) en vez
  de una barra sólida.
Estado al hacer scroll (cuando pasa a la sección 2):
- El submenú queda fijo y se convierte en una "píldora" centrada flotante, distinta del fondo:
  fondo vidrio (rgba crema 0.08–0.12 + backdrop-filter: blur(14px)), borde fino dorado
  semitransparente, sombra suave. No del mismo verde que la sección.
- Enlace activo según la sección visible (IntersectionObserver): texto dorado + subrayado
  animado o pastilla resaltada. Hover con transición.
- En móvil: chips deslizables horizontalmente.

==================================================
2) HERO DE NOSOTROS ("SOMOS TÉCNICOYA" / "Conectamos talento técnico local con quien lo necesita.")
==================================================
- La etiqueta "SOMOS TÉCNICOYA" se pierde: colócala dentro de una pastilla con fondo oscuro
  translúcido + blur y borde dorado, texto dorado claro (sube la luminosidad del acento lo
  necesario para cumplir contraste AA sobre la foto).
- Título rediseñado: "Conectamos talento técnico local" en sans crema con peso fuerte, y
  "con quien lo necesita." en la serif itálica en DORADO (igual que el resto del sitio), con
  text-shadow para separarlo de la foto. Tamaño con clamp().
- Overlay en degradado de izquierda (oscuro 0.75) a derecha (0.15) para que el texto resalte
  sin tapar a los técnicos de la foto. Añade un subtítulo corto y una línea dorada decorativa.
- Entrada animada escalonada (pastilla → título → subtítulo), respeta prefers-reduced-motion.

==================================================
3) PALETA Y CONTRASTE GENERAL DE LA PÁGINA
==================================================
Ahora todo es el mismo verde oscuro y las secciones se funden. Define en tokens.css (sin romper
la landing) una alternancia:
- secciones A: verde petróleo oscuro actual;
- secciones B: un tono más claro / cálido (verde-gris o crema muy oscuro) con textura sutil;
- tarjetas: un nivel más claro que su sección, borde dorado al 20 % y sombra;
- acento dorado para kickers, números e iconos; un segundo acento (terracota o turquesa suave)
  solo para detalles (puntos, líneas, hover).
- Separadores entre secciones (línea dorada fina, curva o degradado) para que se note el "encaje".
- La sección 2 ("Que encontrar ayuda no sea otro problema") debe distinguirse claramente del
  submenú y de la sección siguiente. Todo el texto con contraste WCAG AA.

==================================================
4) MISIÓN · VISIÓN · VALORES COMO "MAPA DEL TESORO"
==================================================
Reemplaza las 3 tarjetas estáticas por un recorrido interactivo:
- Un "mapa" con tres paradas (01 Misión, 02 Visión, 03 Valores) marcadas con un punto/insignia
  (y una X o brújula en la parada final de Valores).
- Entre paradas, un camino de GUIONES (SVG path con stroke-dasharray) que serpentea.
- Botones "Siguiente →" y "← Anterior" (y clic en cada parada):
  al avanzar, los guiones se van dibujando/arrastrando desde la parada actual hasta la siguiente
  (animar stroke-dashoffset ~1.2 s), un marcador pequeño viaja por el camino
  (getPointAtLength o offset-path) y al llegar aparece la tarjeta con el texto de esa parada
  (fade + scale). Al retroceder, el camino se "borra" en sentido inverso.
- Textos (mantener los actuales):
  Misión: "Conectar a hogares y MYPES con talento técnico local mediante información clara y atención trazable."
  Visión: "Hacer más confiable y accesible la búsqueda de servicios técnicos en Huancayo."
  Valores: "Confianza, transparencia y reconocimiento del talento local." (puedes mostrar los
  tres valores como chips que aparecen uno por uno).
- Indicador de progreso 1/3, 2/3, 3/3. Navegación con teclado (flechas) y aria-live.
- Móvil: el camino pasa a ser vertical.
- prefers-reduced-motion: sin dibujo animado, el camino aparece completo y cambia la tarjeta.

==================================================
5) TESTIMONIOS – CARRUSEL 3D
==================================================
- Título: "Testimonios" (quita "de ejemplo" del título). Debajo, en texto pequeño y discreto:
  "Historias ilustrativas con personajes ficticios." (OBLIGATORIO mantener este aviso; también
  conserva "Valoración ficticia" en cada tarjeta). Quita el subtítulo "Historias ilustrativas"
  duplicado.
- Carrusel 3D tipo "coverflow" o anillo: tarjeta central al frente y grande, las laterales
  rotadas (rotateY ±35°), más pequeñas, con reflejo/sombra y profundidad (perspective).
- Avance automático cada 5 s con pausa en hover/focus, flechas, puntos indicadores, swipe en
  táctil y arrastre con mouse. Al cambiar, la tarjeta gira suavemente a su posición.
- La tarjeta central: foto, comillas grandes decorativas en dorado, cita, nombre · distrito ·
  especialidad y estrellas. Las laterales muestran solo foto y nombre.
- Arregla los controles actuales (el botón "Reanudar" se ve cortado): usa un botón de
  pausa/reproducir con icono y aria-label.
- prefers-reduced-motion: sin autoplay, transición simple.

==================================================
6) ELIMINAR "EMPIEZA AHORA"
==================================================
- Elimina por completo la sección "UNA SOLUCIÓN MÁS CERCA / Empieza ahora." con sus botones
  "Pedir un técnico" y "Soy técnico" de la página Nosotros. Quita también su enlace del
  submenú si existe y sus estilos/pruebas sin uso.

==================================================
7) PRUEBAS Y ENTREGA
==================================================
Vitest:
- submenú sin fondo sólido al inicio y con clase de estado "scrolled" tras el scroll;
  enlace activo según sección;
- mapa: Siguiente/Anterior cambian Misión → Visión → Valores, indicador 1/3–3/3, teclado;
- testimonios: título "Testimonios", aviso de ficticio presente, carrusel avanza/pausa;
- la sección "Empieza ahora" ya no existe;
- reduced-motion desactiva animaciones/autoplay.
npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
Al final dame: archivos cambiados, conteo de pruebas Vitest y confirmación del push.
```

### 2026-10-21 · PR #24 · Controles del carrusel de testimonios

```text
Corrección funcional del carrusel de Testimonios (página Nosotros) en el PR #24
(misma rama feature/delgado/landing/rediseno-landing). Solo frontend/web.
No toques backend/, no hagas push a main, no fuerces push. Commit en la misma rama.
El diseño 3D está aprobado: NO cambies estilos ni layout, solo el funcionamiento.

Problemas reportados en el navegador:
- Las flechas ← → no hacen nada al hacer clic.
- El botón Pausar/Reanudar no responde.
- El carrusel no avanza automáticamente.

1. Diagnostica primero por qué no reciben clics:
   - Revisa si las tarjetas laterales rotadas en 3D, un pseudo-elemento, un overlay o la capa del
     fondo fijo están encima de los controles (z-index / transform crea nuevo stacking context).
     Solución: controles con position: relative; z-index alto; tarjetas laterales y decoraciones
     con pointer-events: none salvo el área clicable; el contenedor 3D no debe tapar la barra.
   - Revisa si el handler de hover/focus del contenedor pausa el autoplay cuando el mouse está
     sobre los controles (pausa permanente). La pausa por hover debe aplicarse solo sobre las
     tarjetas, no sobre la barra de controles.
   - Revisa estado obsoleto en setInterval (closure con índice viejo) y que el intervalo se
     reinicie correctamente al cambiar de diapositiva o al reanudar.

2. Comportamiento esperado:
   - Avance automático cada 3000 ms, en bucle (después de la 3 vuelve a la 1).
   - Flecha → siguiente, flecha ← anterior (también en bucle). Al usarlas, el contador
     "N de 3" y los puntos se actualizan y el temporizador de 3 s se reinicia.
   - Puntos indicadores clicables para ir a cada testimonio.
   - Botón "Pausar" detiene el autoplay y cambia a "Reanudar"; "Reanudar" lo vuelve a iniciar.
     aria-pressed y aria-label correctos.
   - Hover sobre las tarjetas pausa temporalmente; al salir continúa (solo si el usuario no
     pulsó Pausar).
   - Pausa si la pestaña está oculta (visibilitychange).
   - Teclado: flechas izquierda/derecha cuando el carrusel tiene foco.
   - prefers-reduced-motion: sin autoplay (botón muestra "Reanudar"), flechas sí funcionan.
   - Limpia intervalos al desmontar.

3. Pruebas Vitest (timers falsos):
   - avanza solo a los 3000 ms y hace bucle 3 → 1;
   - flechas cambian el índice y el contador "N de 3";
   - Pausar detiene el avance y Reanudar lo reanuda;
   - clic en un punto va a ese testimonio;
   - los controles son clicables (fireEvent/userEvent sobre los botones reales).
   npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
   Al final dame: causa raíz encontrada, archivos cambiados, conteo de pruebas Vitest y
   confirmación del push.
```

### 2026-10-21 · PR #24 · Escala del hero y la cabecera

```text
Ajuste final de tamaño en el hero de la landing (PR #24, misma rama
feature/delgado/landing/rediseno-landing). Solo frontend/web. No toques backend/,
no hagas push a main, no fuerces push. Commit en la misma rama.
No cambies colores, fuentes, la intro del video, el fondo fijo ni el resto de secciones.

1. TÍTULO DEL HERO: más grande y llenando más el ancho
   - Pasa de 4 líneas a 2 líneas:
       Línea 1: "El técnico indicado."   (crema)
       Línea 2: "Aquí, en Huancayo."     (dorado)
     Misma serif itálica, centrado.
   - Ancho máximo del bloque de texto ~1200px (o 88vw); quita el max-width estrecho actual.
   - font-size: clamp(3rem, 8.5vw, 8.5rem); line-height ~0.95; letter-spacing -0.01em.
   - En móvil (<= 640px) puede volver a partir en 3–4 líneas, sin desbordar.
   - Subtítulo: font-size clamp(1.05rem, 1.6vw, 1.4rem), max-width ~760px.
   - Etiqueta pill "Para tu hogar. Para tu negocio. Para Huancayo.": ~20 % más grande
     (font-size y padding).
   - Botones "Encontrar un técnico" y "Crear mi cuenta": ~20 % más grandes
     (padding 1.05rem 2.2rem, font-size ~1.1rem).
   - Ajusta los espacios verticales para que el conjunto quede centrado y ocupe ~70–75 %
     de la altura de la pantalla en escritorio (1366×768 y 1920×1080), sin que los botones
     queden cortados abajo.

2. CABECERA ~20 % MÁS GRANDE
   - Altura de la cabecera ~88–96px.
   - Logo: círculo "t" ~56px, "TécnicoYa" ~1.5rem, "HUANCAYO" proporcional.
   - Recuadro pill del menú: font-size ~1.05rem, padding de enlaces más amplio,
     altura ~56px.
   - Botón "Iniciar sesión": font-size ~1.1rem, padding ~0.95rem 2rem.
   - Ancho del contenedor de la cabecera ~1400px para que no se vea apretada.
   - Mantén el comportamiento al hacer scroll y el menú hamburguesa en móvil.
   - Aplica la misma cabecera agrandada en la página Nosotros para que sean iguales.

3. Verificación
   - Revisa visualmente a 1366, 1536, 1920 y 390 px de ancho que nada desborde ni se superponga.
   - Actualiza Vitest si alguna prueba depende de los textos partidos en líneas.
   npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
   Al final dame: archivos cambiados, conteo de pruebas Vitest y confirmación del push.
```

### 2026-10-21 · PR #24 · Navegación sin hash

```text
Corrección de navegación en la landing y en Nosotros (PR #24, misma rama
feature/delgado/landing/rediseno-landing). Solo frontend/web. No toques backend/,
no hagas push a main, no fuerces push. Commit en la misma rama.
No cambies diseño ni animaciones.

Problema: al hacer clic en el menú (Servicios, Cómo funciona, Para técnicos, Nosotros,
Preguntas) la URL queda con #servicios, #proceso, etc. Al recargar (F5), el navegador salta
directo a esa sección y no se ve el hero ni la intro del video.

Comportamiento esperado:
1. Clic en un enlace del menú (cabecera, submenú de Nosotros y menú móvil):
   - preventDefault y desplazamiento suave a la sección
     (element.scrollIntoView({ behavior: 'smooth' }) compensando la altura de la cabecera fija
     con scroll-margin-top en las secciones).
   - NO dejar el hash en la URL (no usar location.hash; si hace falta, history.replaceState
     con la ruta sin hash).
   - En móvil, cerrar el menú hamburguesa después del clic.
   - "Nosotros" lleva a la página /nosotros (si es ruta propia); los enlaces del submenú de
     Nosotros también hacen scroll suave sin hash.
2. Al recargar o abrir la página:
   - Siempre empezar arriba, en el hero, con la intro del video.
   - window.history.scrollRestoration = 'manual' y window.scrollTo(0, 0) al montar.
   - Si la URL llega con un hash (por ejemplo, un enlace antiguo /#servicios), limpiarlo con
     history.replaceState y quedarse arriba.
3. Al navegar entre la landing y /nosotros con el router, la nueva página también empieza
   arriba (scroll al inicio en el cambio de ruta).
4. Accesibilidad: después del scroll, mover el foco al encabezado de la sección destino
   (tabIndex=-1) sin provocar un segundo salto. Respeta prefers-reduced-motion
   (behavior: 'auto' en vez de 'smooth').
5. Centraliza esto en un helper/hook (por ejemplo scrollToSection y useScrollToTopOnLoad)
   y úsalo en todos los menús.

Pruebas Vitest:
- clic en un enlace llama a scrollIntoView y no deja hash en la URL;
- al montar con un hash en la URL, se limpia y se hace scrollTo(0, 0);
- scrollRestoration queda en 'manual';
- el menú móvil se cierra tras el clic.
npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
Al final dame: archivos cambiados, conteo de pruebas Vitest y confirmación del push.
```

### 2026-10-21 · PR #24 · Resolver conflicto con main

```text
El PR #24 (rama feature/delgado/landing/rediseno-landing) tiene conflicto con main en
docs/documentacion/sprints/HANDOFF-codex.md. Resuélvelo en TecnicoYa-cx.
No toques backend/, no hagas push a main, no uses push --force ni rebase (no reescribas historia).

1. git fetch origin
2. git merge origin/main   (merge commit, no rebase)
3. En HANDOFF-codex.md conserva AMBOS contenidos: lo que llegó de main (PR #23 / DEF-47 y
   cualquier otra entrada) y tus entradas del PR #24, en orden cronológico, sin duplicar
   secciones ni dejar marcadores <<<<<<< ======= >>>>>>>.
4. Si aparecen otros conflictos, resuélvelos conservando los cambios de ambos lados y avísame
   cuáles fueron. Si alguno es de código (no docs), detente y explícame antes de decidir.
5. Verifica: npm run test, npm run lint y npm run build en frontend/web. No ejecutes Cypress.
6. git commit (mensaje: "merge: integra main en rediseño de landing") y git push a la misma rama.
7. Actualiza la descripción del PR #24: el equipo ya hizo la revisión visual con la API :3000
   encendida; cambia "revisor [PENDIENTE]" por "Pimentel Chumbes James"; agrega en la lista
   de cambios: hero centrado, intro de video, fondo fijo pausado, vitrina de especialidades,
   mapa 3D, página Nosotros (submenú, mapa del tesoro MVV, testimonios 3D), navegación sin hash.
8. Al final dame: archivos con conflicto, conteo de Vitest y confirmación del push.
```

### 2026-10-23 · PR #25 · Vitrina 3D de subespecialidades

```text
Nueva tarea de frontend sobre la landing (el PR #24 ya está integrado en main).
Trabaja en TecnicoYa-cx. Solo frontend/web. No toques backend/, no hagas push a main,
no fuerces push. No instales dependencias nuevas sin permiso.

0. Preparación:
   git fetch origin
   git checkout main && git pull
   git checkout -b feature/delgado/landing/vitrina-carrusel

1. QUITAR EL CONTADOR
   En la sección "¿Qué necesitas resolver?" elimina por completo el bloque de cifras
   "3 especialidades · 30 subespecialidades · 0 distritos" (marcado, estilos, pruebas y lógica
   que solo sirva para eso). El encabezado queda: título + frase de la derecha, y debajo los chips.

2. NUEVO CARRUSEL DE SUBESPECIALIDADES (columna derecha)
   El actual muestra una sola tarjeta plana: se ve simple. Reemplázalo por un carrusel
   "abanico 3D de cartas" con más profundidad y movimiento:

   Composición:
   - Se ven 5 tarjetas verticales a la vez (proporción ~3:4): la central al frente (escala 1,
     nítida), dos a cada lado detrás, en abanico: rotateY ±25°/±40°, translateX escalonado,
     translateZ negativo, escala 0.88 / 0.76, opacidad 0.75 / 0.4, blur 0 / 2px / 4px.
     Contenedor con perspective: 1400px y transform-style: preserve-3d.
   - Sombra y reflejo suave bajo la tarjeta central (pseudo-elemento con degradado).
   - Tarjeta central: imagen, degradado inferior, número "03 / 10" en dorado arriba a la
     derecha, nombre de la subespecialidad en la fuente del sitio y, si el API trae
     reference_fee, "Desde S/ X" (si no viene, no mostrar precio).

   Animación:
   - Avance automático cada 3 s: el abanico gira, la tarjeta que sale se desplaza hacia el
     fondo y la siguiente avanza al centro (transform + opacity + filter, ~700 ms,
     cubic-bezier(.22,.8,.2,1)).
   - Efecto "tilt" en la tarjeta central: se inclina levemente siguiendo el mouse
     (máx. ±8°) con un brillo que se desplaza sobre la imagen; vuelve a su sitio al salir.
   - Al cambiar de especialidad (chips o flechas superiores): las cartas se "barajan" — las
     actuales caen y se desvanecen escalonadas y las nuevas entran repartiéndose en abanico.
   - Barra de progreso fina en dorado bajo el carrusel que se llena en los 3 s.

   Controles:
   - Reemplaza los 10 puntos por miniaturas pequeñas redondeadas (tira deslizable) con la
     activa resaltada en dorado; clic en miniatura o en una carta lateral la lleva al centro.
   - Flechas ‹ › y contador "1 / 10". Arrastre con mouse y swipe en táctil.
   - Pausa en hover/focus y con la pestaña oculta. Teclado: flechas izquierda/derecha.
   - Elimina el título "Subespecialidades disponibles" suelto; usa un kicker pequeño en dorado
     "SUBESPECIALIDADES" alineado con el carrusel.

   Datos:
   - Solo subespecialidades reales del catálogo de la especialidad activa (pueden ser 10 o
     más/menos; con 1 no hay rotación, con 2–4 el abanico se adapta).
   - No repetir la imagen: si la foto grande de la izquierda (image_url de la especialidad,
     o su fallback) es la misma que la de una subespecialidad, la izquierda usa la imagen
     propia de la especialidad en public/media/ o una imagen distinta por slug;
     si no existe, que el carrusel arranque en una subespecialidad con otra foto.
   - Imágenes con loading="lazy", width/height y alt; precarga la siguiente.

   Móvil (<= 900px): el abanico se reduce a 3 cartas visibles, la tira de miniaturas se
   desliza horizontalmente y el tilt se desactiva.
   prefers-reduced-motion: sin autoplay, sin tilt ni barajado; cambio por fundido simple.

3. PRUEBAS Y ENTREGA
   Vitest (timers falsos):
   - el bloque de cifras ya no existe;
   - el carrusel muestra la subespecialidad activa con su nombre y "N / total";
   - avanza solo a los 3000 ms y hace bucle;
   - flechas, miniaturas y clic en carta lateral cambian la activa;
   - pausa en hover y con visibilitychange;
   - al cambiar de especialidad se cargan sus subespecialidades;
   - la imagen de la izquierda no es igual a la de la tarjeta central inicial;
   - reduced-motion desactiva autoplay.
   npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
   Guarda evidencias en docs/documentacion/evidencias/landing/ (no en frontend/web/evidencias).
   Haz push de la rama, abre PR a main y dame: enlace, archivos cambiados y conteo Vitest.
```

### 2026-10-26 · PR #25 · Corrección del abanico 3D

```text
Corrección del PR #25 (rama feature/delgado/landing/vitrina-carrusel) en TecnicoYa-cx.
Solo frontend/web. No toques backend/, no hagas push a main, no fuerces push. Commit en la misma rama.

Revisión en navegador real (Chrome, 1366px, backend :3000 con catálogo real):
- El abanico 3D NO se ve: la columna derecha queda vacía. Solo aparece la tira de miniaturas
  (que sí muestra fotos), las flechas y "3 / 9".
- El kicker "SUBESPECIALIDADES" es muy pequeño y casi no se lee.

1. Diagnostica y corrige por qué no se ven las cartas. Revisa en este orden:
   - Altura del contenedor del abanico: si las cartas son position:absolute, el escenario
     necesita altura propia (por ejemplo aspect-ratio o height: clamp(360px, 38vw, 520px)).
   - overflow:hidden del padre recortando las cartas trasladadas en Z/X.
   - opacity 0 / visibility inicial que nunca pasa a visible (clase de "entrada" o barajado que
     no se dispara, IntersectionObserver o animación que no termina).
   - loading="lazy" en imágenes dentro de elementos con opacidad 0 o fuera de vista que nunca
     cargan: la carta central y las dos vecinas deben usar loading="eager".
   - transform-style/perspective mal ubicados que envían las cartas detrás del fondo fijo
     (z-index negativo o stacking context del fondo).
   - Que las cartas usen la misma URL de imagen que las miniaturas.
   Explícame la causa raíz que encontraste.

2. Resultado esperado en escritorio: en la columna derecha se ven 5 cartas en abanico
   (central grande y nítida, 2 por lado detrás), alineadas verticalmente con la foto de la
   especialidad de la izquierda, con la tira de miniaturas debajo. Altura del abanico similar
   a la foto de la izquierda.

3. Kicker "SUBESPECIALIDADES" más grande y notorio:
   - font-size ~0.95–1.05rem, letter-spacing 0.2em, peso 700, dorado más claro
     (contraste AA sobre el fondo), con una línea dorada corta a cada lado o una pastilla
     con borde dorado. Colocado ARRIBA del abanico, no abajo junto a las miniaturas.
   - Debajo del kicker, el nombre de la subespecialidad activa en grande (serif itálica,
     ~1.8–2.2rem, crema) que cambia con fundido al rotar.

4. Verificación visual obligatoria (no solo Vitest):
   - Con npm run dev y el backend :3000, toma capturas con Playwright (Chromium ya instalado
     en el equipo, no instales navegadores) a 1366, 1920 y 390 px de la sección
     "¿Qué necesitas resolver?" mostrando el abanico con imágenes visibles.
   - Agrega una prueba que verifique que el escenario del abanico tiene altura > 0 en
     el CSS/estilo y que la carta central usa loading="eager".
   npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
   Guarda capturas en docs/documentacion/evidencias/landing/.
   Al final dame: causa raíz, archivos cambiados, conteo Vitest y confirmación del push.
```

### 2026-10-26 · PR #25 · Escala y encuadre de secciones

```text
Ajuste de escala y encuadre antes de integrar el PR #25
(misma rama feature/delgado/landing/vitrina-carrusel) en TecnicoYa-cx.
Solo frontend/web. No toques backend/, no hagas push a main, no fuerces push. Commit en la misma rama.
El carrusel de subespecialidades está aprobado: no cambies su diseño, solo su escala general.

Problema 1 – Todo se ve "con demasiado zoom" en escritorio (1366–1920 px al 100 % del navegador):
títulos, imágenes, tarjetas y cabecera muy grandes; al bajar, las secciones no caben en pantalla.

Reduce la escala global ~15–20 % en la landing y en Nosotros (sin cambiar colores ni estilo):
- Cabecera: altura ~72px; logo circular ~44px; "TécnicoYa" ~1.25rem; enlaces del menú ~0.95rem;
  botón "Iniciar sesión" ~0.95rem con padding ~0.7rem 1.5rem. Submenú de Nosotros ~0.88rem.
- Contenedor principal: max-width ~1200px (hoy se estira casi al borde), con padding lateral
  clamp(16px, 4vw, 48px).
- Tipografía de secciones (ejemplos: "¿Eres técnico? Recibe trabajos cerca de ti.",
  "Testimonios", "Detrás de TécnicoYa."): h2 con font-size clamp(2rem, 3.6vw, 3.25rem);
  kickers ~0.78rem; párrafos ~1rem–1.05rem. "Recibe trabajos cerca de ti." no debe partir
  "ti." solo en una línea (ajusta ancho o tamaño).
- Hero: título principal clamp(2.75rem, 6.5vw, 6.25rem) (un poco menor que ahora), conservando
  2 líneas en escritorio.
- Padding vertical de secciones: clamp(56px, 8vh, 96px) (hoy es excesivo).
- Imágenes y tarjetas proporcionales: la foto de "¿Eres técnico?" máx. ~520px de ancho;
  carrusel de testimonios: tarjeta central máx. ~560px de ancho y cartas laterales más pequeñas
  para que la tarjeta completa (foto + texto + controles) quepa en 1366×768.
  Tarjetas de Equipo más compactas (avatar ~64px).
- Meta: en 1366×768 cada sección principal (Especialidades, Cómo funciona, Para técnicos,
  Testimonios, Equipo, Preguntas) debe verse COMPLETA en una pantalla, debajo de la cabecera.

Problema 2 – Al hacer clic en el menú la sección no queda bien encuadrada
(ej. "Para técnicos" queda cortada; en Nosotros, "Equipo" queda debajo del submenú).
- Calcula el desplazamiento descontando la altura REAL de la cabecera fija y, en Nosotros,
  también la del submenú fijo (medidas con getBoundingClientRect, no valores fijos).
- Si la sección cabe en el alto disponible (viewport − cabecera − submenú), céntrala
  verticalmente en ese espacio. Si es más alta, alinéala justo debajo de la cabecera/submenú
  con ~16px de margen.
- Para las últimas secciones (Equipo, Contacto, Preguntas) agrega espacio inferior suficiente
  (o pie de página) para que puedan llegar a la posición calculada.
- Recalcula en resize y después de que carguen imágenes/fuentes (para que no quede corrido).
- Mantén: sin hash en la URL, scroll suave (auto con reduced-motion), foco en el encabezado.
- El enlace activo del menú/submenú debe coincidir con la sección encuadrada.

Problema 3 – Detrás del submenú de Nosotros, al hacer scroll, se ve una franja de la foto de fondo
cortada (sobre "Equipo"). El submenú flotante debe quedar sobre el fondo de la sección, sin
franja recortada: elimina el fondo/espacio rectangular detrás de la píldora o dale el mismo
fondo de la sección.

Verificación obligatoria:
- Capturas con Playwright (Chromium ya instalado, no instales navegadores) a 1366×768 y
  1920×1080 de: hero, Especialidades, Para técnicos, Testimonios y Equipo, cada una tomada
  DESPUÉS de hacer clic en su enlace del menú. Debe verse la sección completa y centrada.
  Y una a 390 px (móvil).
- Vitest: el cálculo del desplazamiento descuenta cabecera + submenú y centra cuando cabe.
npm run test, npm run lint y npm run build deben pasar. No ejecutes Cypress.
Guarda capturas en docs/documentacion/evidencias/landing/.
Al final dame: archivos cambiados, conteo Vitest y confirmación del push.
```

### 2026-10-26 · PR #27 · Pulido visual de landing y Nosotros

```text
TAREA: pulido visual de la landing y Nosotros.
git checkout main && git pull
git checkout -b feature/delgado/landing/pulido-visual
Solo frontend/web. Reglas de siempre (sin push a main, sin --force, sin dependencias nuevas,
sin Cypress, sin abrir .env). Conserva lo aprobado: intro de video, fondo fijo con pausa,
hero centrado, abanico 3D, carrusel de testimonios, mapa del tesoro MVV, navegación sin hash.
Revisión hecha en Chrome 1366–1920 px, zoom 100 %.

================================================================
A) CORRECCIONES GLOBALES (resuelven varios puntos a la vez)
================================================================
A1. Contenedor: TODA sección usa el mismo contenedor centrado (max-width ~1200px, padding lateral
    clamp(16px,4vw,48px)). Hoy varias secciones tienen el texto pegado al borde izquierdo (x=0):
    hero de Nosotros, pie de página, Términos/Privacidad, tarjetas de especialidades, etc.
A2. Franjas de fondo: entre algunas secciones (debajo de "Para técnicos", entre Preguntas y
    "Empieza ahora", entre Contacto y el pie en Nosotros) aparece una franja grande con la foto
    de fondo SIN oscurecer. El overscroll/overlay oscuro debe estar en la propia capa fija del
    fondo (no por sección), y no debe haber huecos vacíos entre secciones.
A3. Cabecera y submenú: al hacer scroll, la cabecera fija y la píldora del submenú deben tener
    fondo propio (vidrio oscuro: rgba del fondo ~0.85 + backdrop-filter: blur(14px)) para que el
    contenido que pasa por detrás NO se lea encima del logo/menú (hoy el texto del hero de
    Nosotros se superpone al logo). La píldora del submenú nunca debe tapar el kicker ni el título
    de la sección.
A4. Encuadre al hacer clic en el menú / submenú (reemplaza el criterio de centrado actual):
    - Cada sección principal tiene min-height: calc(100svh - altura real de cabecera [- submenú]) y
      su contenido centrado verticalmente dentro.
    - El clic alinea el BORDE SUPERIOR de la sección justo debajo de la cabecera (+ submenú en
      Nosotros), medidos con getBoundingClientRect. Así no se ve nada de la sección anterior.
    - Excepción: "Cómo funciona" encuadra juntos los dos bloques "Más simple, paso a paso" y
      "Técnicos verificados, tarifas claras…" (envuélvelos en un mismo contenedor objetivo) y los
      centra en pantalla.
    - Aplica a: Servicios, Cómo funciona, Para técnicos, Preguntas (landing) y Quiénes somos,
      Cómo verificamos, Tu seguridad, Testimonios, Equipo, Contacto (Nosotros).
    - Mantén sin hash, smooth (auto con reduced-motion), recálculo en resize y tras cargar imágenes.

================================================================
B) LANDING
================================================================
B1. Botón "Iniciar sesión" de la cabecera más pequeño: font-size ~0.9rem, padding ~0.55rem 1.25rem,
    altura ~40px (proporcional al menú).
B2. "Cómo funciona": además del encuadre A4, separa mejor los 4 pasos (gap mayor; el texto de un
    paso no debe tocar el siguiente), título de paso ~1.15rem y descripción ~0.95rem.
    Los íconos ✓ ◇ ↗ de "Perfiles revisados…" con separación entre ítems y el botón
    "Conoce más sobre nosotros" con margen superior.
B3. "Para técnicos" (¿Eres técnico?): ~10–15 % más grande (foto máx. ~600px, título y viñetas
    un poco mayores), bloque centrado vertical y horizontalmente en su sección. Viñetas con
    íconos dorados en lugar de puntos.
B4. "Preguntas" (Resolvemos tus dudas): más grande y que llene el espacio: columna izquierda con
    título + breve texto + botón de contacto; derecha con acordeón ~1.1rem, filas con más altura
    (padding ~18px), icono +/− dorado animado en lugar del triángulo, respuesta con fundido.
    Sin el hueco con la foto debajo (A2).
B5. "Una solución más cerca / Empieza ahora" (SOLO en la landing): más grande (título
    clamp(2.5rem,5vw,4rem), subtítulo ~1.15rem, botones más grandes) dentro de una tarjeta
    destacada con borde dorado sutil y degradado.
B6. Pie de página (landing y Nosotros, mismo componente): rediseño dentro del contenedor:
    - 4 columnas en escritorio: Marca (logo + "Talento local. Soluciones cerca." + "Huancayo 2026"),
      Navegación (Servicios, Nosotros, Preguntas frecuentes, Volver arriba ↑), Contacto, Legal.
    - Títulos de columna en kicker dorado ~0.78rem; enlaces ~0.95rem con hover dorado.
    - Términos y Privacidad: no como <details> desplegados a lo ancho; ponlos en la columna Legal
      como enlaces que abren un pequeño modal/panel con el texto actual (mismo contenido).
    - Barra inferior fina: "© 2026 TécnicoYa · Proyecto académico – Universidad Continental".
    - Móvil: columnas apiladas.

================================================================
C) NOSOTROS
================================================================
C1. Hero ("SOMOS TÉCNICOYA / Conectamos talento técnico local con quien lo necesita."):
    dentro del contenedor (no pegado al borde izquierdo), título ~20 % más pequeño
    (clamp(2.5rem,5.5vw,5rem)), párrafo ~1.05rem, max-width del bloque ~720px.
    Submenú en esta posición inicial con el mismo estilo de píldora que al hacer scroll.
C2. "Quiénes somos" (Que encontrar ayuda no sea otro problema): encuadre A4 sin mezclarse con el
    hero. Mantén el diseño.
C3. "Cómo verificamos": los números de la lista (1–4) hoy se montan sobre el borde de la imagen.
    Grid de 2 columnas con gap ~56px; lista como pasos con número en círculo dorado, título corto y
    texto; la nota "El trabajo lo realiza el técnico independiente…" como callout aparte.
C4. "La persona indicada" y "Tu confianza merece cuidado" (Tu seguridad):
    - El submenú no debe tapar el kicker "RECOMENDACIONES CON CRITERIO" (A3/A4).
    - Barra de pesos 35/30/20/15: más alta (~72px), esquinas redondeadas, etiquetas con mejor
      contraste (el texto oscuro sobre el dorado claro), leyenda debajo en ~0.85rem.
    - Tarjetas de seguridad: padding interno ~24px (hoy el texto toca el borde), ícono en círculo
      dorado arriba, título ~1.15rem, texto ~0.95rem, misma altura entre tarjetas, gap ~20px.
C5. Testimonios: encuadre A4; el aviso "Pagos simulados en esta versión…" de la sección anterior
    no debe verse detrás del submenú.
C6. Tarjetas de especialidades (Cómputo / Refrigeración comercial / Electricidad):
    - Usa la imagen real por especialidad (image_url del API o el mismo mapa de imágenes locales
      por slug que usa la vitrina); el rombo con "Imagen no disponible" solo si de verdad no hay.
    - Padding interno ~24px, título ~1.3rem, "Explorar servicios →" como enlace pequeño (~0.95rem)
      con flecha animada en hover; tarjeta con hover que eleva y hace zoom suave a la imagen.
C7. "Calidad que se comprueba": 3 tarjetas con número/ícono grande dorado arriba ("60+",
    "CI", "✓"), título, texto, padding y gap uniformes; la fuente "informe de cierre S2.6" como
    nota pequeña centrada debajo de las tarjetas. Mantén los textos honestos actuales.
C8. Contacto (Estamos cerca): tarjeta del formulario con padding ~28px; label "Tu mensaje"
    dentro de la tarjeta con margen; textarea sin doble borde (un solo borde con foco dorado);
    nota y botón "Preparar correo" alineados. Columna izquierda con ícono por dato.
    Los datos REEMPLAZAR/example.invalid: muéstralos como "Por confirmar" en estilo atenuado con
    una etiqueta pequeña "Datos por confirmar"; centraliza los valores en un archivo de constantes
    de contacto para cambiarlos en un solo lugar. No inventes números ni correos.
C9. Entre Contacto y el pie de Nosotros no debe haber franja de foto (A2); pie según B6.

================================================================
D) VERIFICACIÓN Y ENTREGA
================================================================
- Capturas con Playwright (Chromium ya instalado, sin instalar navegadores) a 1366×768 y
  1920×1080: hero landing, y el resultado DESPUÉS de hacer clic en cada enlace del menú y del
  submenú de Nosotros; también pie de página y una vista a 390 px. Revisa tú mismo cada captura
  antes de entregar: nada pegado al borde, sin franjas, sin texto bajo la cabecera.
- Vitest: encuadre (alinea bajo cabecera+submenú; caso especial Cómo funciona), pie con modal de
  Términos/Privacidad, constantes de contacto, tarjetas con imagen por slug.
- npm run test, npm run lint y npm run build en verde.
- Evidencias en docs/documentacion/evidencias/landing/. Actualiza HANDOFF-claude.md.
Abre PR a main y dame: enlace, lista de puntos B1–C9 resueltos, conteo Vitest y qué revisar.
```

### 2026-10-26 · PR #27 · Empieza ahora, submenú oculto y hueco de cabecera

```text
Correcciones adicionales en la rama feature/delgado/landing/pulido-visual (mismo PR).
Solo frontend/web. Reglas de siempre. No cambies lo ya aprobado.

1) "UNA SOLUCIÓN MÁS CERCA / Empieza ahora." (landing) – CAMBIAR EL DISEÑO
   El recuadro centrado actual se ve plano y deja un gran espacio vacío arriba. Rediseña:
   - Quita el espacio vacío superior: la sección se ajusta a su contenido
     (padding vertical clamp(56px, 8vh, 96px)); esta sección NO usa el min-height de pantalla
     completa del encuadre.
   - Layout de dos caminos, dentro del contenedor (~1200px):
     · Encabezado arriba a la izquierda: kicker "UNA SOLUCIÓN MÁS CERCA", título
       "Empieza ahora." (serif itálica dorada en "ahora.") y la frase
       "Tu hogar y tu negocio merecen seguir en marcha."
     · Debajo, dos tarjetas grandes lado a lado:
       a) "Necesito un técnico" – imagen de fondo (reusa una imagen existente de
          public/media, ej. un hogar/negocio) con degradado oscuro, 3 viñetas cortas con
          íconos dorados (Describe la falla · Recibe recomendaciones · Sigue la atención),
          botón crema "Pedir un técnico ↗".
       b) "Soy técnico" – imagen de técnico (public/media/landing/tecnico-taller.webp u otra
          existente), 3 viñetas (Clientes de tu zona · Tú pones tu tarifa · Construye
          reputación), botón contorno dorado "Registrarme como técnico".
     · Tarjetas con borde dorado sutil, esquinas ~24px, hover que eleva la tarjeta,
       hace zoom suave a la imagen e ilumina el borde.
   - Animación de entrada al aparecer (fade + translateY escalonado), respeta reduced-motion.
   - Móvil: tarjetas apiladas.
   - Mantén los destinos actuales de los botones (registro cliente / registro técnico).

2) SUBMENÚ DE NOSOTROS – OCULTO SOBRE EL HERO
   - Mientras el hero de Nosotros ("SOMOS TÉCNICOYA / Conectamos talento…") esté en pantalla,
     el submenú (Quiénes somos · Cómo verificamos · …) NO se muestra.
   - Cuando el hero sale de la vista (IntersectionObserver), el submenú aparece con
     fade + slide-down (~250 ms) pegado bajo la cabecera; al volver al hero se oculta de nuevo.
   - Oculto = no ocupa espacio ni recibe foco (visibility hidden / inert), y aria-hidden mientras
     no se ve. reduced-motion: aparece sin animación.
   - El cálculo de encuadre (A4) debe considerar la altura del submenú solo cuando estará visible
     tras el desplazamiento (al saltar a una sección, siempre estará visible).

3) HUECO ENTRE CABECERA Y SUBMENÚ
   Hoy entre la cabecera y la barra del submenú queda una franja (se ve la foto de fondo cortada)
   y además el submenú tiene una banda de ancho completo con borde inferior: se ve mal.
   - Une cabecera + submenú en un único bloque fijo: el submenú va inmediatamente debajo de la
     cabecera, sin espacio entre ellos, con el MISMO fondo (vidrio oscuro + blur) y un solo borde
     inferior fino al final del bloque.
   - Dentro de ese bloque, la píldora de enlaces centrada (padding vertical ~8px), sin banda
     adicional ni segundo borde.
   - Verifica que ninguna franja de la foto aparezca entre cabecera, submenú y la sección.

Verificación:
- Capturas Playwright (1366×768 y 1920×1080): sección Empieza ahora; Nosotros arriba del todo
  (sin submenú); Nosotros tras bajar del hero (submenú visible, sin hueco); y tras clic en
  Quiénes somos y Testimonios. Revisa cada captura antes de entregar.
- Vitest: submenú oculto con hero visible y visible al salir; tarjetas de Empieza ahora con sus
  enlaces correctos.
- npm run test, lint y build en verde. Push a la misma rama y dame el resumen.
```

### 2026-10-26 · PR #29 catálogo y PR #30 encuadre del inicio de sesión

```text
Ya integré los PR #27 y #28 en main. Corrí DistrictSeeder en mi BD de desarrollo.

1. Sigue con feature/mayhuasca/catalogo/campos-landing como planeaste (cherry-picks, evidencia,
   reference_fee, DatabaseSeeder idempotente, Pest, contrato y PR).

2. En paralelo, PR pequeño de frontend: feature/delgado/auth/encuadre-login.
   La pantalla #cuenta (Iniciar sesión / registro) se ve desordenada en 1366–1920 px:
   - gran espacio vacío arriba entre la cabecera y el contenido;
   - el aviso de error y el botón "Reintentar conexión" quedan sueltos FUERA de la tarjeta,
     a todo el ancho;
   - la tarjeta (formulario + panel "Tu solución empieza aquí") no cabe en la pantalla.
   Corrige:
   - cabecera igual de compacta que la landing (logo + "Volver al inicio" pequeño);
   - tarjeta centrada vertical y horizontalmente en el alto disponible, max-width ~1080px,
     que quepa completa en 1366×768 (formulario a la izquierda, panel de marca a la derecha
     más angosto, ~40 %);
   - el error de conexión y "Reintentar" DENTRO de la tarjeta, sobre el formulario, como aviso
     compacto con ícono;
   - campos y botones de tamaño proporcional al resto del sitio; mismo tratamiento para
     la vista de registro y para el estado "Comprobando tu sesión…";
   - móvil: panel de marca oculto o reducido arriba, formulario a ancho completo.
   Mantén los data-cy que usan las pruebas Cypress S1–S4. Capturas Playwright 1366×768,
   1920×1080 y 390 px (con y sin error de conexión). Vitest + lint + build en verde. PR propio.

3. Cuando yo integre esos dos PR: registra D-73 a D-79 y arranca la Fase 1.
```

### 2026-10-26 · PR #30 deslizamiento del login (Parte A) y PR #31 registro detallado (Parte B)

```text
Ajustes a la pantalla de sesión. Integré el PR #29; el PR #30 aún NO está integrado.

===================== PARTE A – en la rama del PR #30 (feature/delgado/auth/encuadre-login) =====================
Primero: git fetch origin && git merge origin/main (sin rebase), resuelve HANDOFF-claude.md
conservando ambas entradas.

1. Quita el enlace subrayado "Crear una cuenta" que está debajo de "Ingresar", y el enlace
   "Iniciar sesión" debajo de "Registrarme". El cambio de modo queda solo en el botón del
   panel verde ("Crear una cuenta ↗" / "Ya tengo una cuenta ↗").
2. Animación de deslizamiento entre modos:
   - Inicio de sesión: formulario a la izquierda, panel verde a la derecha (como ahora).
   - Al pulsar "Crear una cuenta", el panel verde se desliza hacia la IZQUIERDA (~600 ms,
     cubic-bezier(.65,0,.35,1)) y el formulario de registro aparece a la DERECHA con fundido;
     la curva del panel se invierte para mirar hacia el formulario. "Ya tengo una cuenta" hace
     el recorrido inverso.
   - El texto del panel cambia según el modo (registro: "¿Ya tienes cuenta? / Vuelve a tu
     espacio." con botón "Ya tengo una cuenta").
   - Mantén #cuenta como ruta; el modo se refleja en el estado (y en la URL sin recargar si
     ya se hace así). Foco al primer campo del formulario visible tras la animación.
   - prefers-reduced-motion: cambio sin deslizamiento. Móvil: sin deslizamiento lateral,
     la franja del panel arriba cambia su texto y el formulario cambia con fundido.
3. Botón "Mostrar / Ocultar contraseña" (ícono de ojo, aria-pressed, aria-label) en todos los
   campos de contraseña.
Mantén los data-cy y el orden de Tab que usa S01-TC-075 (si cambia el orden por quitar el
enlace, ajusta la prueba Cypress y dilo). Capturas Playwright 1366 y 390 px de ambos modos y de
un fotograma intermedio de la animación. Vitest + lint + build en verde. Push y avísame.

===================== PARTE B – PR nuevo desde main (después de integrar #30) =====================
Rama: feature/mayhuasca/auth/registro-detallado (backend + frontend).
Objetivo: el registro debe recoger los datos que necesita el matching para recomendar técnicos
cercanos (cercanía 35 % del puntaje, D-63/D-64).

Registro en 2 pasos con indicador de progreso (1 de 2 / 2 de 2):
 Paso 1 – "¿Quién eres?": dos tarjetas grandes seleccionables con ícono:
   "Necesito un técnico" (cliente) y "Soy técnico".
 Paso 2 – "Tus datos":
   Cliente: nombres, apellidos (NOMBRES-01: name se compone como nombre para mostrar),
     correo, teléfono (formato Perú, 9 dígitos que empiezan en 9), distrito principal
     (select desde GET /catalog/districts), tipo (Hogar o MYPE; si es MYPE: razón social
     opcional), dirección de referencia opcional (texto, privada), contraseña con medidor de
     seguridad y confirmación, aceptación de Términos y Privacidad (casilla obligatoria que
     abre el texto actual).
   Técnico: lo mismo (sin tipo de cliente), más distrito base (base_district_id), distritos
     que atiende (multiselección, incluye el base), especialidades que ofrece (multiselección
     desde el catálogo, al menos 1), años de experiencia (0–50), WhatsApp opcional.
     Al terminar: "Tu cuenta quedó pendiente de verificación. Sube tus documentos desde tu panel."
 - Validación en vivo por campo, botones "Atrás" y "Crear cuenta", sin perder lo escrito al
   volver al paso 1.
Backend:
 - Ampliar POST /auth/register (sin romper el contrato: campos nuevos con reglas por tipo de
   cuenta); migración para el distrito principal del cliente (client_profiles.district_id) y
   nombres/apellidos si no existen; técnico: base_district_id, technician_districts y
   especialidades declaradas (sin crear servicios ni tarifas, que siguen en su panel).
 - El distrito del cliente queda como valor por defecto en el asistente de nueva solicitud.
 - Registro de admin sigue prohibido por esta vía (TC-008).
Recuperar contraseña:
 - "¿Olvidaste tu contraseña?" en el inicio de sesión → formulario de correo → respuesta
   siempre neutra ("Si el correo existe, te enviamos un enlace") → enlace firmado de un solo uso
   con vencimiento de 60 min → pantalla para la nueva contraseña (con medidor) → cierra las
   demás sesiones (auth_version). En desarrollo MAIL_MAILER=log: el enlace queda en el log.
   Throttling por IP y por correo. Auditado para cuentas admin (D-44).
Pruebas:
 - Pest rojo → verde: reglas por tipo de cuenta, distrito inválido/inactivo rechazado,
   especialidades obligatorias para técnico, teléfono, términos, idempotencia del correo,
   restablecimiento (respuesta neutra, token vencido, token reutilizado, sesiones cerradas,
   throttling). Vitest: pasos, validaciones, medidor, conservación de datos al volver.
 - Asigna IDs según la convención acordada (propón en el PR a qué sprint corresponden).
 - Actualiza los seeders E2E y las pruebas Cypress S1 que llenan el registro si cambian sus
   campos; no ejecutes Cypress sin avisarme.
 - Capturas Playwright de ambos pasos (cliente y técnico) y del flujo de recuperación.
 - CONTRATO-API.md, DECISIONES.md (registra la decisión de campos de registro) y HANDOFF.
Abre el PR y dame: enlace, migraciones, endpoints, conteos Pest/Vitest y qué probar.

Después de integrar la PARTE B: registra D-73 a D-79 y arranca la Fase 1 del panel admin.
```
