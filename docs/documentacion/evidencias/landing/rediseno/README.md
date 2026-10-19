# Rediseño de landing y Nosotros · evidencias

Fecha de trabajo: 2026-10-19. Rama: `feature/delgado/landing/rediseno-landing`.

## Trazabilidad

- Base `e6b15df` (main, PR #22 integrado).
- `dd561cd`: pruebas en rojo; 7 fallan y 7 pasan. La falla expresa las funciones nuevas, no una modificación del servidor.
- `1fdfa27`: implementación. 161/161 Vitest en 22 archivos. Líneas globales 85,33 %, nuevo directorio landing 89,61 %. Los logs anteriores con hash dd561cd se ejecutaron sobre los cambios sin commit que después forman 1fdfa27; el log `vitest-commit` valida el HEAD confirmado.
- Build: salida 0. Audit: 0 vulnerabilidades. Sin cambios de dependencias.
- Fallos conservados: primera ejecución parcial 13/14 por selector singular de fallback (ahora hay tres tarjetas); ejecución 160/161 porque no se aplicó inicialmente el cambio del observador del video. No se relajó esa aserción. Mocks corregidos para devolver estructuras por endpoint, sin advertencias de claves duplicadas.
- Nuevas pruebas son complementos de S02-TC-084, 085 y 089; no se inflan los IDs distintos del catálogo.

## Capturas

En la carpeta superior: archivos `2026-10-19-<hash>-rediseno-<antes|despues>-<inicio|nosotros>-<ancho>.png`.

- Antes: e6b15df. La ruta Nosotros todavía mostraba la landing, por eso el baseline coincide.
- Después: 1fdfa27. Capturas de 1440 y 375 px. JSON con medidas de 1440, 1024, 768 y 375; primeros cuatro registros landing, últimos cuatro Nosotros. Ningún ancho de documento supera el viewport.
- API :3000 apagada durante esta revisión. Se muestra el error real y no se interceptan respuestas para inventar servicios o cifras. Los escenarios de catálogo disponible se cubren con datos sintéticos en Vitest. Falta la revisión visual con el backend y fotos reales del catálogo disponibles.
- Movimiento reducido activado; el video se pausa y puede aparecer sin fotograma. No se extrajeron ni fabricaron fotogramas.
- Las fotos ilustrativas locales están cargadas. Nombres del equipo sustituidos por «Integrante del equipo» exclusivamente al capturar las evidencias, conforme AGENTS §9.
- Una recaptura agotó el arranque de Edge mientras había poca RAM; se repitió secuencialmente después de Vitest y terminó. Sin Cypress, Docker o SonarQube.

## Límites y pendientes

1. Backend: specialties.image_url y carousel.reference_fee no están expuestos. Se muestran iconos/fallback y no se imprime tarifa sin dato.
2. Contactos reales, horario y textos legales definitivos: pendientes de configuración/revisión. Los placeholders son explícitos y el formulario no declara envíos.
3. Los pesos del matching son referencias explicadas; no hay consulta pública de pesos vigentes. El texto de calidad referencia el cierre S2.6, no acredita esta entrega con SonarQube.
4. Revisión humana: [PENDIENTE].
