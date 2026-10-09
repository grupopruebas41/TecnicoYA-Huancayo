# S00 — Evidencias frontend (2026-10-09)

Worktree: TecnicoYa-cx. Rama: codex/s00-frontend. Base: main d361c63.
AGENTS.md no encontrado en ninguno de los dos worktrees ni en directorios superiores consultados. Se leyó ENTORNO-PARALELO.md de la carpeta principal; se respetó aislamiento y no se ejecutaron Pest, Cypress ni comandos Docker.

## Resultados medidos

| Comando | Resultado | Archivo |
|---|---|---|
| npm test | 63/63, 10 archivos; salida 0 | npm-test.txt |
| npm run build | Correcto, Vite 8.3.4; salida 0 | npm-build.txt |
| npm audit | 0 vulnerabilidades; salida 0 | npm-audit.txt |
| npm run test:coverage | 63/63; salida 0 | npm-coverage.txt |

Cobertura: líneas 61.82% (353/571), sentencias 54.84%, ramas 52.30%, funciones 51.40%. Se incluyen fuentes sin pruebas; no se relajó el Quality Gate. No se ejecutó SonarQube: el cierre de sus alertas requiere reanálisis por el responsable de calidad.
JUnit: frontend/web/test-results/junit.xml; copia de esta ejecución: junit.xml. LCOV: frontend/web/coverage/lcov.info (ignorado por Git), con 25 rutas normalizadas y comprobadas existentes desde la raíz. El hook posttest:coverage normaliza automáticamente las rutas para sonar-project.properties.

## Cambios por punto

1. DEF-18: npm audit fix --ignore-scripts redujo el informe a seis vulnerabilidades. Actualización explícita, sin --force: Vite 8.3.4, Vitest 5.0.3, plugin-react 6.1.2. Después, coverage-v8 5.0.3. Node usado: 24.19.0; engines declara Node 22.12+, 24 o 26+. Las 38 pruebas originales siguen pasando.
2. DEF-08: siete submit explícitos: Auth (1), AccountPanel (1), Announcements (1), Marketplace (2), SessionForm (1), ProfileForm (1). No cambian las acciones de envío.
3. DEF-10: límite 254 en formulario y validador, alineado a RegisterAccountRequest y LoginRequest; separación por @ y puntos, sin regex con cuantificadores superpuestos. 16 pruebas: 253/254 aceptados, 255/100000 rechazados, formatos inválidos, alias y límite del input. El servidor sigue validando el formato definitivo.
4. Cobertura V8 texto/LCOV y JUnit configurados. El contador scripts/contar-casos-tc.php solo consume el JUnit de Pest y clasifica TC backend; no se modifica ni se suman pruebas frontend a esa cuota. El JUnit frontend queda disponible para integrar un consumidor específico sin alterar backend.
5. Traducciones v1 (AccountApp y errores HTTP):

| Texto/código previo | Texto mostrado |
|---|---|
| approved | Verificación aprobada |
| rejected | Verificación rechazada |
| announcements.manage | Administrar los comunicados |
| technicians.verify | Revisar y habilitar técnicos |
| código de permiso desconocido | Permiso adicional habilitado |
| estado desconocido | Estado no disponible |
| Unauthenticated. | Tu sesión venció. Inicia sesión nuevamente. |
| This action is unauthorized. | No tienes permiso para realizar esta acción. |
| Too Many Attempts. | Demasiados intentos. Espera un momento antes de volver a intentarlo. |
| CSRF token mismatch. | La sesión de seguridad venció. Recarga la página e inténtalo nuevamente. |
| Server Error | El servicio no está disponible. Inténtalo nuevamente más tarde. |
| The given data was invalid. | Revisa los campos indicados. |

pending, catalog.manage y los roles ya tenían etiquetas en español y se conservaron. Los nombres de catálogo son contenido del servidor. Los mensajes personalizados y errores de campos se conservan: Laravel debe enviarlos en español; no se intenta traducir texto arbitrario. Nueve pruebas nuevas cubren etiquetas y conservación de errores españoles.
6. Salidas archivadas y HANDOFF-codex.md creado (no existía).

## Límites de verificación

No se ejecutó E2E, contenedor de build ni SonarQube. npm advirtió que el postinstall de Cypress no fue aprobado: no se instaló un navegador ni se modificaron sus specs. Build y Vitest sí fueron ejecutados. La integración con el cambio de backend en feature/pimentel/f-administracion/s00 queda para revisión del PR; esta rama parte de main y no incorpora cambios ajenos.
