# S01-TC-075 · envío de Enter en Chromium

Fecha: 2026-10-09. Corrección: abb2b7b139aad9442d57fd64422f7009fa2a4b3a.

1. En 9b0714a la corrida completa terminó con 16/17: después de Enter sobre el botón de abrir registro, Tab enfocó Correo, no Nombre.
2. En ab71db2 se añadió una condición observable (campo de registro visible antes de Tab), sin pausas fijas. La corrida volvió a terminar con 16/17: el formulario de registro nunca apareció. Esta evidencia descarta que bastara esperar al render. Los otros 16 casos pasaron en ambos intentos.
3. Se revisó el [código oficial de Cypress 16.1.1](https://github.com/cypress-io/cypress/blob/v16.1.1/packages/server/lib/automation/commands/key_press.ts). Para Enter, la ruta CDP emite keyDown/keyUp con key y code, sin texto ni windowsVirtualKeyCode.
4. En abb2b7b, solo para Chromium, la prueba envía Input.dispatchKeyEvent con Enter completo (código 13 y retorno de carro en keyDown). Comprueba además que la activación del botón sea isTrusted=true. Mantiene Tab nativo, foco visible, orden de campos, envío por Enter y POST real con 201. Otros navegadores siguen usando cy.press.

No se modificó el frontend de producto para acomodar el test. No se llamó click(), submit(), force:true ni se añadieron reintentos de casos, sleeps o respuestas HTTP simuladas. La espera DOM del segundo intento queda como sincronización válida, pero por sí sola no corrigió el problema. La corrección de transporte de Enter puede revisarse al actualizar Cypress.

Las interrupciones de red de S01-TC-022 y 074 son las ya previstas en el catálogo: forceNetworkError, no respuestas JSON/estados de éxito fabricados. El resto consulta el backend real.

Logs y JUnit de ambos intentos fallidos se conservan. Consultar README.md para el resultado final de la tercera corrida. Revisor humano: [PENDIENTE].
