# Primer análisis SonarQube — Sprint 1

Fecha: 6 de octubre de 2026. Servidor Community Build 26.9.0.129388 en Docker Compose, perfil `quality`. Scanner CLI 8.1.0.6389 nativo Windows, Java 21.0.10. Revisión de aplicación: `8997de82108539a7c5010cb5d98484cff6f846fd`; configuración de calidad aún sin commit durante el análisis.

## Resultado y límite del Quality Gate

El scanner terminó con `EXECUTION SUCCESS` y `QUALITY GATE STATUS: PASSED`. La API devolvió `status: OK` y `conditions: []`: es la primera línea base y no se evaluaron condiciones de código nuevo. No se cambiaron reglas, perfiles ni umbrales para obtener ese resultado. **No equivale a ausencia de defectos ni a cumplimiento completo de calidad.**

| Métrica | Resultado |
|---|---|
| Líneas de código | 2521 |
| Incidencias abiertas | 114 |
| Bugs clasificados por SonarQube | 7 |
| Code smells / mantenibilidad | 107 |
| Vulnerabilidades detectadas | 0 |
| Hotspots | 0 |
| Cobertura mostrada | 0,0 %: sin informes Clover/LCOV importados |
| Duplicación | 0,0 % |
| Fiabilidad | C |
| Seguridad / mantenibilidad | A / A |
| Esfuerzo estimado por SonarQube | 754 minutos; no es una estimación Scrum |

## Hallazgos por revisar, sin correcciones

Los 7 bugs corresponden a botones dentro de formularios sin `type` explícito (`javascript:S9011`). Dos están en las pantallas nuevas; los otros cinco pertenecen al código histórico. Son clasificaciones del analizador, no siete fallos funcionales demostrados en las pruebas.

| Archivo | Línea |
|---|---|
| `frontend/web/src/features/administration/ProfileForm.jsx` | 40 |
| `frontend/web/src/features/administration/SessionForm.jsx` | 53 |
| `frontend/web/src/AccountPanel.jsx` | 11 |
| `frontend/web/src/Announcements.jsx` | 38 |
| `frontend/web/src/Auth.jsx` | 5 |
| `frontend/web/src/Marketplace.jsx` | 53 |
| `frontend/web/src/Marketplace.jsx` | 70 |

La mantenibilidad señala principalmente llaves e indentación, ternarios anidados, semántica accesible de mensajes, nombres de variables de excepción y simplificación de expresiones. En código nuevo también observa:

- La expresión regular del correo en `features/administration/forms.jsx:18` por posible retroceso superlineal: revisar límites y validación antes de admitir entradas arbitrariamente grandes.
- Cuatro retornos en `ProvisionAdmin::handle` frente al umbral de tres del perfil.
- Excepción genérica en `ProvisionAdministrator` en lugar de una específica.

Estos hallazgos **no se corrigieron**, por instrucción del usuario. Los 0 hallazgos de vulnerabilidad no sustituyen una prueba de seguridad. El scanner no ejecutó análisis de dependencias.

## Advertencias y alcance

No se importaron informes PHPUnit ni cobertura: las ejecuciones Pest/Cypress se acreditan con sus propios archivos de salida. El analizador JS encontró configuraciones TypeScript bajo `examples/` y advirtió sobre una extensión AdonisJS ausente; no analizó archivos de esos ejemplos y sí completó los 37 archivos JS de su alcance. PHP completó 75 archivos. No se ocultaron estas advertencias.

El alcance se limita a las rutas de `sonar-project.properties`; el servicio Python histórico y los documentos no están incluidos. Community Build contiene una línea base local, sin integración de PR/CI configurada por esta tarea.

## Evidencia

- `sonar/gate.json`, `sonar/measures.json`: gate y medidas.
- `sonar/issues-anonimo.json`: detalle de las 114 incidencias (reglas, archivos, líneas y mensajes), sin autores ni correos. Se genera con `node scripts/exportar-sonar-anonimo.mjs`. El exporte crudo `issues.json` contenía correos y ya no se versiona (DEF-17).
- `sonar/hotspots.json`, `sonar/analyses.json`: revisión de hotspots e identificación del análisis.
- `sprint01-next-4-sonar-analysis.txt`: salida íntegra del scanner.

Panel local cuando el servicio está iniciado: [TécnicoYa en SonarQube](http://127.0.0.1:9000/dashboard?id=tecnicoya-huancayo). No hay token en estos documentos.
