# S1.5 · Cypress integrado · Slot B

Fecha: 2026-10-09. Rama: feature/delgado/f-administracion/s01. PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/7

## Resultado final

**17/17 casos Cypress aprobados**, sin pendientes ni omitidos, en Cypress 16.1.1 / Chrome 156 headless / Node 24.19.0. Los IDs de los seis JUnit se compararon con CATALOGO-S01.csv: coinciden exactamente con S01-TC-015–025 y S01-TC-072–077.

| Comando | Revisión | Resultado / evidencia |
|---|---|---|
| git fetch origin | main avanzó 6dfec52 → a04b677 (PR #6 integrado) | Salida 0 |
| git merge origin/main | 9b0714a | Merge completado; cuatro conflictos de nombres resueltos solo en frontend |
| npm test -- --maxWorkers=1 --no-file-parallelism | 9b0714a | Salida 0, 92/92 en 17 archivos; vitest-integrado.txt |
| npm run build | 9b0714a | Salida 0; build-integrado.txt |
| node scripts/run-e2e.mjs --sprint 01 --slot B --junit | 9b0714a | Salida 1, 16/17; e2e-integrado-01.txt + intento-01-junit/ |
| Mismo comando, tras sincronizar el render | ab71db2 | Salida 1, 16/17; e2e-integrado-02.txt + intento-02-junit/ |
| Mismo comando, tras corregir Enter nativo | abb2b7b | **Salida 0, 17/17**; e2e-integrado-03.txt + final-junit/ |

No se repitió una prueba sin cambio para ocultar un fallo. Ambos intentos fallidos permanecen. El frontend de producto en abb2b7b es idéntico al verificado por Vitest/build en 9b0714a; entre ambos solo cambió accessibility.cy.js.

## Merge y corrección

Conflictos en catalog.cy.js, portals.cy.js, validation.cy.js y forms.test.jsx: ambas ramas ya tenían los mismos IDs; diferían los títulos/posición del TC heredado. Se conservaron los IDs exactos, las aserciones y el nuevo S01-TC-076. Ninguna resolución manual en backend; su árbol coincide con origin/main.

El único caso fallido fue S01-TC-075: Enter de cy.press no activó el botón en Chromium. La espera de render no bastó. Se corrigió el transporte nativo de la tecla con CDP (código 13 y retorno de carro), manteniendo Tab nativo, foco visible, registro por Enter, isTrusted=true y POST real 201. No se llamó click/submit ni se alteró el producto. Ver [diagnóstico y fuente de Cypress](DIAGNOSTICO-TECLADO.md).

No se fabricaron respuestas HTTP. S01-TC-022 y 074 conservan únicamente la interrupción de red prevista en el catálogo (forceNetworkError). Sin sleeps ni reintentos automáticos de casos.

## Entorno y pendientes

- MySQL ya estaba healthy; no se levantó ni recreó desde el worktree.
- Base tecnicoya_b_testing; API 8002, web 5175. Sin Pest concurrente del slot B.
- Antes del arranque: bloqueos global y B libres, sin contenedor SonarQube en ejecución. El arrancador gestionó exclusión y limpieza. Al finalizar, ambos bloqueos estaban liberados.
- Revisión humana y Quality Gate: **[PENDIENTE]**; esta entrega completa la verificación S1.5, no el cierre de todo el sprint.
- precondiciones.txt, vitest-postmerge.txt y build-postmerge.txt conservan el intento anterior a la integración del PR #6; son antecedentes, no la validación final.
