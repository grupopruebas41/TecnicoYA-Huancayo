# Quality Gate «TecnicoYa»

**Creado:** 2026-10-09 por Claude Code (paso 1.7 del plan). **Instancia:** SonarQube Community Build **26.9.0.129388** local, perfil `quality` de `infrastructure/docker-compose.quality.yml`. **Proyecto:** `tecnicoya-huancayo`.

Este documento no contiene tokens ni contraseñas. Las credenciales están solo en `infrastructure/.env.quality.local`, que Git ignora.

## 1. Condiciones (sobre código nuevo)

| Condición pedida | Métrica | Falla si | Umbral |
|---|---|---|---|
| Cobertura ≥ 70 % | `new_coverage` | es menor que | 70 |
| Líneas duplicadas < 3 % | `new_duplicated_lines_density` | es mayor que | 3 |
| Confiabilidad A | `new_reliability_rating` | es peor que | A (1) |
| Seguridad A | `new_security_rating` | es peor que | A (1) |
| Mantenibilidad A | `new_maintainability_rating` | es peor que | A (1) |
| 100 % de hotspots revisados | `new_security_hotspots_reviewed` | es menor que | 100 |

**Límites del producto:**
- **Duplicación:** SonarQube solo ofrece «menor que» y «mayor que». Con «mayor que 3», un valor de **exactamente 3,0 %** aprueba, así que el Gate aplica en la práctica «≤ 3 %», no «< 3 %».
- **Condiciones sin valor:** SonarQube no evalúa una condición cuando su métrica no tiene valor. Con 0 hotspots en el código nuevo no hay porcentaje de revisados, así que la condición de hotspots no aparece en el resultado. Eso no es un fallo.

## 2. Periodo de código nuevo

**Elección:** «versión anterior» (`PREVIOUS_VERSION`). El código nuevo son los cambios desde el último análisis cuya `sonar.projectVersion` es distinta de la actual.

**Por qué:**
- **Línea base:** con esta opción, el único análisis anterior (`8997de8`, versión `sprint-01`, del 2026-10-06 a las 20:31 UTC, que cerró el Sprint 1) queda como línea base. El análisis del 2026-10-09 se etiquetó `sprint-00`, así que su código nuevo es **todo lo que se hizo después: S2, S3 y las correcciones de S0** (3964 líneas nuevas). Es justo el código que nunca se había medido (DEF-21).
- **Funciona por sprint:** si cada cierre de sprint analiza con `sonar.projectVersion=sprint-NN`, el Gate de ese cierre mide solo lo que entró en ese sprint. Así se cumple la DoD «Gate aprobado sobre el commit integrado del sprint».
- **Alternativas descartadas:**
  - **«Número de días»:** es una ventana móvil; el mismo commit puede aprobar hoy y fallar mañana.
  - **«Rama de referencia»:** necesita analizar varias ramas, y Community Build solo analiza `main`.
  - **«Desde la versión del Sprint 3»:** no se puede elegir porque esa versión todavía no existe como análisis. Cuando exista, `PREVIOUS_VERSION` da el mismo efecto.

**Regla de uso:** antes del análisis de cierre de cada sprint, poner `sonar.projectVersion=sprint-NN` en `sonar-project.properties`. Si se repite el análisis con la misma versión, la línea base no se mueve.

## 3. Cómo se creó (reproducible)

Script idempotente [`scripts/configurar-quality-gate.mjs`](../../../scripts/configurar-quality-gate.mjs). Con SonarQube en `UP`:

```powershell
node scripts/configurar-quality-gate.mjs
```

1. **Credenciales:** lee la contraseña de administración de `infrastructure/.env.quality.local` y no la imprime.
2. **Gate:** crea el Gate `TecnicoYa` si no existe (`api/qualitygates/create`). Agrega o corrige las 6 condiciones (`create_condition` y `update_condition`) y borra cualquier otra.
3. **Asignación:** se lo asigna al proyecto (`api/qualitygates/select`).
4. **Periodo:** fija el periodo de código nuevo (`api/new_code_periods/set`, `type=PREVIOUS_VERSION`).
5. **Comprobación:** imprime el Gate, sus condiciones, el proyecto asignado y el periodo.

**Equivalente manual en la interfaz:**
1. *Quality Gates → Create* con el nombre `TecnicoYa`.
2. *Add condition → On new code*, una vez por cada fila de la tabla 1.
3. *Projects → tecnicoya-huancayo → Without/With → Select*.
4. *Project Settings → New Code → Previous version*.

## 4. Análisis completo (orden)

Desde la raíz del repositorio:

1. **Cobertura del backend:** `cd backend/api && composer test:sonar`. Necesita MySQL de pruebas, slot A. Genera `test-results/clover.xml` con rutas relativas a la raíz.
2. **Cobertura del frontend:** `cd frontend/web && npm run test:coverage`. Genera `coverage/lcov.info`, que `posttest:coverage` normaliza.
3. **Arrancar SonarQube:** `wsl -d docker-desktop -u root -- sysctl -w vm.max_map_count=524288` y luego `docker compose -f infrastructure/docker-compose.quality.yml --env-file infrastructure/.env.quality.local --profile quality up -d sonarqube`. Esperar `api/system/status = UP`.
4. **Bloquear Cypress:** crear `tmp/e2e-cypress.lock` (regla 12b) para que ninguna corrida E2E arranque mientras SonarQube está arriba.
5. **Analizar:** `./scripts/run-quality.ps1 -ScannerPath tmp/sonar-cli/sonar-scanner-8.1.0.6389/bin/sonar-scanner.bat -JavaHome '<Java 21>'`.
6. **Exportar:** `node scripts/report-quality.mjs <carpeta>/sonar` y después `node scripts/exportar-sonar-anonimo.mjs <carpeta>/sonar/issues.json <carpeta>/sonar/issues-anonimo.json`. El `issues.json` crudo no se versiona.
7. **Parar:** `docker compose … --profile quality stop`, nunca `down -v`. Borrar el bloqueo de Cypress.

## 5. Resultado del 2026-10-09 (main `0f2d1cd`, versión `sprint-00`)

**Gate: FALLA (ERROR).** Evidencias en [`evidencias/sprint-00/calidad/`](../evidencias/sprint-00/calidad/).

| Condición | Valor | Estado |
|---|---|---|
| Cobertura de código nuevo ≥ 70 % | **66,1 %** | ❌ ERROR |
| Duplicación de código nuevo ≤ 3 % | 1,89 % | ✅ OK |
| Confiabilidad de código nuevo | A | ✅ OK |
| Seguridad de código nuevo | A | ✅ OK |
| Mantenibilidad de código nuevo | A | ✅ OK |
| Hotspots revisados = 100 % | sin valor (0 hotspots) | no evaluada |

**Medidas globales:**
- Cobertura total 58,8 % (antes 0 %).
- 4344 líneas de código.
- 0 bugs, 0 vulnerabilidades y 0 hotspots.
- 109 code smells: 32 críticos, 62 mayores y 15 menores.
- Duplicación total 1,5 %.

**Cobertura de código nuevo por directorio:**

| Directorio | Líneas nuevas por cubrir | Cobertura nueva |
|---|---|---|
| `backend/api/app` | 638 | **97,8 %** |
| `frontend/web/src` | 24 | **74,8 %** |
| `backend/api/database` | 302 | 0 % |
| `backend/api/routes` | 22 | 0 % |
| `backend/api/config` | 2 | 0 % |

**Causa del rojo (DEF-35):**
- `phpunit.xml` limita la cobertura a `<source><include><directory>app</directory>`.
- Las migraciones, los seeders, las rutas y la configuración se ejecutan en cada prueba, pero PCOV no los instrumenta y SonarQube los cuenta como no cubiertos.
- Hay dos maneras de corregirlo y las dos cambian qué se mide, así que quedan como decisión **COV-01** en `DECISIONES.md`. No se cambió el Gate ni se excluyó nada para hacerlo pasar.
