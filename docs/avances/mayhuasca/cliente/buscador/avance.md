# Avance · Mayhuasca · Buscador «¿Qué se malogró?» con diccionario e IA opcional (D-94)

## Datos de la tarea

- **Integrante:** Mayhuasca (backend) con frontend de Delgado. Lo ejecuta Claude Code según D-72.
- **Sprint:** adelanto del Sprint 5 (D-87), con IDs S05-TC.
- **Módulos:** B-Matching (buscador), F-Administración (Catálogo › Palabras clave) y el panel del cliente.
- **HU/RF:** HU-S03-01 (RF-01), HU-S07-02 (catálogo administrable) y HU-01 (Mi perfil).
- **Fecha:** 2026-10-28.
- **Rama:** `feature/mayhuasca/cliente/buscador`, desde `main` `4b4060b` (con el PR #39).
- **Decisiones:** D-94 (RECO-01) reemplaza a D-93 (RECO-00).

## Commits

- `1ae5eb3`: Pest en rojo (S05-TC-061 a 076), con la interfaz `SuggestionProvider`.
- `6d1eafe`: backend.
- `991ccde`: Vitest en rojo (S05-TC-077 a 084; S05-TC-029 y 055 adaptadas).
- `3549146`: frontend.
- `587c06a`: las siembras E2E cargan el diccionario.
- `fa0f93d`: DEF-51 en rojo (S05-TC-085).
- `07649f6`: corrección de DEF-51 y acciones cortas en Palabras clave.
- `4fd96b1`: documentación, evidencias y capturas.
- **Ajuste del panel de sugerencias** (pedido sobre el PR #40, solo frontend):
  - el problema: la lista flotaba debajo de los chips y la tarjeta «Tu pedido en curso» la tapaba;
  - `7466b2b`: Vitest en rojo (S05-TC-086 y 087; S05-TC-077 adaptada). En S05-TC-077 solo cambia el texto esperado de cada fila, que ahora tiene dos líneas (subcategoría y especialidad) en lugar de «Especialidad › Subcategoría»;
  - `7821a2d`: el panel va justo debajo del campo y dentro del flujo de la página. Tiene encabezado, filas de 56 px con el ícono de la especialidad, «Más probable» y flecha, el pie «¿No es ninguno? Elegir categoría», filas de carga y el mensaje sin resultados. Se cierra con Escape, con un clic fuera o al vaciar el campo, y abre con una animación de 180 ms que respeta `prefers-reduced-motion`. Se aplica en el Inicio y en el paso 1 de Nueva solicitud;
  - después, en móvil, «Más probable» pasa debajo del texto para que la subcategoría no se parta a mitad de palabra (visto en las capturas).

## Cambios

- **Datos:** migración `000029` con tres tablas:
  - `subcategory_keywords`;
  - `keyword_misses`, sin usuario, IP ni datos personales;
  - `keyword_suggestions`, con las frases que resolvió la IA, pendientes de aprobación.
- **Diccionario:** `KeywordSeeder` es idempotente, está en `DatabaseSeeder` y en las siembras E2E, y carga de 10 a 13 frases por cada una de las 30 subcategorías en español de Huancayo.
- **Motor:**
  - `QueryNormalizer`: tildes, signos, palabras vacías, singular simple y sinónimos;
  - `KeywordEngine`: frases compuestas primero y sin contar dos veces una palabra; una frase «general» vale la mitad sin un objeto de la misma especialidad; nivel alta (8 o más), media (4 o más) o baja; hasta 3 resultados.
- **IA:** interfaz `SuggestionProvider` con `KeywordProvider` (por defecto), `LlmProvider` (anthropic, openai o gemini por HTTP, sin dependencias nuevas) y `FakeSuggestionProvider` para las pruebas. `SuggestionService` hace el flujo híbrido:
  - la IA solo se consulta con nivel bajo o sin coincidencias, y recibe solo el texto y la lista cerrada;
  - los ids fuera de la lista se descartan;
  - caché de 24 horas por consulta;
  - ante cualquier error, responde el diccionario;
  - la clave nunca va a logs ni respuestas.
- **API:** `GET /catalog/suggestions` (30 consultas por minuto e IP) y 8 rutas administrativas con `catalog.manage`, auditadas. Contrato S5 §8.
- **Frontend:**
  - `ProblemSearch`: combobox accesible con *debounce* de 300 ms, flechas, Enter y Escape, «Más probable», estado sin resultados y chips;
  - el buscador está en el Inicio y en el paso 1 del asistente;
  - Catálogo › Palabras clave: frases, probar una frase, búsquedas sin resultado y frases sugeridas por la IA;
  - Mi perfil: las cuentas antiguas completan nombres y apellidos;
  - íconos de línea de una sola familia en todo el panel.
- **`.env.example`:** `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_TIMEOUT` y `SUGGESTIONS_PER_MINUTE`, sin valores secretos. `AI_MODEL` no tiene valor por defecto.

## Pruebas

- **Rojo:**
  - Pest 16/16 fallidas (`2026-10-28-buscador-pest-rojo.txt`);
  - Vitest: 10 fallidas, las 8 nuevas y las 2 adaptadas (`2026-10-28-buscador-vitest-rojo.txt`).
- **Verde:**
  - Pest 397/397 (`6d1eafe`) y Vitest 348/348 (`3549146`); lint, build y `npm audit` limpios;
  - DEF-51 (visto en las capturas): en tema claro, el primario del panel quedaba blanco sobre blanco al pasar el cursor. S05-TC-085 en rojo (`fa0f93d`) y en verde con `07649f6`: Vitest 349/349, lint y build limpios;
  - conteo S05: 45 Pest y 40 Vitest (85 IDs); faltan las 14 Cypress del S5.
- **Capturas:** 71 con la API real del slot A, claro y oscuro a 1366 y 390 px, sin desborde ni errores de página (`2026-10-28-07649f6-buscador-*`).
- **Ajustes de las pruebas nuevas antes del verde:**
  - el acceso al contenedor desde una función de Pest usa `app()` en vez de `$test->app`, que es protegido;
  - para devolver `catalog.manage` al rol se reinserta la fila, porque el seeder no vuelve a asignar un permiso que ya existe;
  - en Vitest, el *mock* del administrador recibe dos argumentos y no tres;
  - los `<label>` que envolvían un `<select>` pasaron a `htmlFor`, porque si no, el nombre accesible incluía el texto de las opciones (corrección del componente, no de la prueba).
- **Pruebas anteriores adaptadas sin cambiar su ID:** S05-TC-029 y 055. Los atajos ahora son chips y el buscador elige la subcategoría.
- **`composer audit`:** desde el 2026-10-28 hay un aviso de severidad media para `symfony/mime` 7.4.17 (CVE-2026-45070, se corrige en 7.4.22). Es ajeno a este cambio y también afecta a `main`; el parche queda pendiente de autorización.
- **Panel de sugerencias:**
  - rojo: 3 fallidas (`2026-10-28-4fd96b1-panel-sugerencias-vitest-rojo.txt`);
  - verde: Vitest 351/351, lint y build limpios (`2026-10-28-7821a2d-panel-sugerencias-vitest-verde.txt`);
  - 12 capturas con 3 sugerencias abiertas, en el Inicio y en el asistente, en claro y oscuro, a 1366 y 390 px (`2026-10-28-7821a2d-panel-sugerencias-*`);
  - medido en cada captura: el panel queda debajo del campo, hay 12 px hasta los chips, la tarjeta siguiente empieza debajo del panel, ninguna fila está tapada ni recortada y no hay desborde horizontal;
  - conteo S05: 45 Pest y 42 Vitest (87 IDs).
- **Cypress:** no se ejecutó.

## Pendientes

- Autorizar el parche de `symfony/mime`.
- Configurar `AI_PROVIDER`, `AI_API_KEY` y `AI_MODEL` si se quiere activar la IA.
- `REGISTRO-DEFECTOS.md` sigue sin DEF-47 a 50; el CSV sí los tiene.

## Registro de uso de IA

- **Herramienta y modelo:** Claude Code (Claude Opus 5.5), 2026-10-28.
- **Qué se aceptó:** motor, proveedor de IA, rutas, componentes, diccionario inicial y pruebas.
- **Qué se corrigió:** lo indicado en «Ajustes de las pruebas nuevas antes del verde».
- **Revisó:** [PENDIENTE].

## Revisión

- **Revisor:** [PENDIENTE].
