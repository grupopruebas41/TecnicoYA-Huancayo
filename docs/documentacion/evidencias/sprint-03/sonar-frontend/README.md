# Correcciones de frontend posteriores al cierre S2

Fecha: 2026-10-14. Rama: feature/delgado/f-administracion/s02-sonar. Base: 0a5977f (PR #10 integrado). Imputación: Sprint 3, por indicación del usuario.

## Alcance y resultados

Solo código en frontend/web/src/features/administration/ y components/. Sin backend, prototipo congelado, Docker ni Cypress. No se modificaron dependencias del proyecto.

| Regla | Ubicaciones corregidas por inspección local | Detalle |
|---|---:|---|
| S6819 | 6 | Cinco estados pasan a output en AccountApp, Catalog (2), forms y SessionForm; ConfirmDialog usa dialog con nombre accesible, foco, Escape y bloqueo mientras confirma. CSS adaptado. |
| S6825 | 0 | No hay elementos enfocables con aria-hidden en el alcance permitido. El emblema decorativo de SessionForm es un span no enfocable. No se tocó VideoExperience ni el prototipo. |
| S3776 | 3 | logout, ProfileForm.submit y validateAccount: helpers conservan reconciliación, errores y validaciones. Antes 17; después ninguna supera 15. |
| S3358 | 9 | Ternarios anidados de AnnouncementsAdmin (1), CatalogAdmin (4), SessionForm (1), TechnicianPanel (3) sustituidos por helpers/condiciones simples. |
| S7718 | 15 | 11 capturas y 4 callbacks catch usan error; dos capturas se trasladaron a helpers. |
| S1788 | 1 | ApiError aplica el valor por defecto de fields en el cuerpo, manteniendo el orden público de argumentos y el tratamiento de null. |

El HANDOFF-claude publicado en main solo enumera la deuda S1 de AccountApp y Catalog, no la lista completa S2. Los números anteriores son ubicaciones comprobadas en código, **no cierres certificados por SonarQube**. Se verificaron S3776 con eslint-plugin-sonarjs y S3358/S1788 con ESLint en tmp, sin modificar package.json ni lockfiles. El resto se revisó en el código. Versiones locales: ESLint 9.39.5; eslint-plugin-sonarjs 4.2.2. El análisis oficial y Quality Gate quedan pendientes del cierre coordinado con Claude Code.

## Validación

- Rojo 226e04c: 3 fallos esperados de semántica; pruebas nuevas complementan S01-TC-084 y S02-TC-079, no agregan IDs al catálogo.
- Verde 0d282d0: 119/119 pruebas en 21 archivos, ninguna omitida.
- Líneas: global 82,93 %; administración 86,75 %. Administración: sentencias 83,10 %, ramas 76,72 %, funciones 82,06 %.
- Build: aprobado. Aviso informativo de tiempos de callbacks de Vite; sin errores.
- Estática local: 13 avisos S3776/S3358/S1788 antes; 0 después. Reportes JSON adjuntos.
- Sin Cypress, Docker ni análisis SonarQube. La CI de GitHub validará además backend y auditorías en sus propios ejecutores.
- Revisor: [PENDIENTE]. Integrar después del cierre S2.6.
