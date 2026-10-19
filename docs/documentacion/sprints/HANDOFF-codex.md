# HANDOFF · Codex (frontend)

Archivo de relevo de Codex (regla 12 de AGENTS.md). Se actualiza al terminar cada tarea o antes de quedarse sin límite de uso. Al empezar, leer también [HANDOFF-claude.md](HANDOFF-claude.md).

> Relevo de la raíz incorporado aquí el 2026-10-09, según la regla 12 y el pedido de Claude Code.

## Plantilla de entrada (copiar arriba, la más reciente primero)

```markdown
## AAAA-MM-DD HH:MM · Sprint NN · <tarea>

- **Rama:** feature/delgado/<módulo>/sNN · **Base:** <commit>
- **Commits:** <hash> <mensaje> (uno por línea)
- **Pruebas:** Vitest <aprobadas>/<total> · Cypress <aprobadas>/<total> (slot B) · fallidas: <lista o «ninguna»>
- **IDs SNN-TC-NNN cubiertos:** <lista o rango>
- **Evidencias:** docs/documentacion/evidencias/sprint-NN/<archivo>
- **Qué falta:** <lista>
- **Bloqueos:** <lista o «ninguno»>
- **Pedidos a Claude Code:** <contrato de API, seeders E2E, datos, correcciones>
```

## Entradas

## 2026-10-19 · Landing · integración de main tras PR #20

- Rama feature/delgado/landing/fix-carrusel, PR #22. Merge sin rebase ni force; conflictos limitados a este HANDOFF y avance de Delgado S04, conservando todas las entradas de ambos lados y su orden cronológico. Sin cambios manuales de código.
- Validación después del merge: npm test con un worker, 150/150 (21 archivos); npm run build aprobado. Evidencias 2026-10-19-74827ed-merge-*.txt en evidencias/landing; hash corresponde al HEAD previo con merge preparado. CI pendiente de verificar tras push. Revisor [PENDIENTE].


## 2026-10-18 · Landing · catálogo y disposición responsive

PR #22: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/22. Evidencias c1fb8bb; CI en checks del último push.

- Rama feature/delgado/landing/fix-carrusel desde origin/main 4c56cd7. S4.5 limpio y conservado en su rama/PR #20; no se mezcló aquí. Commits fb1d945 (rojo), dec9aa9 (implementación).
- Modificados App.jsx, ServiceCarousel.jsx, Sprint02Landing.test.jsx; nuevo landing.css limitado a la landing. Diez secciones, 2,5 s y pausas conservadas. Comparación de estilos con cced99e: no estaban borrados; el marcado v1 requería ajustar cabecera, interlineado y alturas.
- **Pedido exacto a Claude Code:** GET /api/v1/catalog/specialties debe devolver image_url (string|null) derivado de specialties.hero_media_id solo para medio público, clean y no retirado. Hoy devuelve únicamente id/code/name/description. Ya se soporta este campo opcional; mientras falta se muestran especialidades sin imagen y aviso honesto. El carrusel de subcategorías sigue viniendo de /catalog/carousel. Backend intacto.
- Capturas antes/después 1440 y 375; medidas también 1024/768, sin overflow ni secciones solapadas. Fuente backend real :3000 mediante proxy de lectura CORS, explicado en docs/documentacion/evidencias/landing/README.md.
- Vitest rojo 3 fallos esperados; verde final 121/121, cobertura de líneas 82,91 %. Build aprobado, audit 0. Sin Cypress por RAM <1 GiB, sin Docker/Pest. Revisor [PENDIENTE].

## 2026-10-17 · S4.5 · Integración preparada; ejecución E2E pendiente de RAM

- Rama feature/delgado/b-matching/s04, PR #20. Merge f0612cf (main 4c56cd7); fixes 8b5c811; Cypress 345bf88. Contrato v1.1 y catálogo de main conservados al resolver conflictos de documentos.
- Vitest 146/146; líneas globales 84,22 %, ofertas 92,17 %, realtime 91,83 %. Build y audit salida 0; cero vulnerabilidades. Evidencias: docs/documentacion/evidencias/sprint-04/cypress/.
- Cypress S04 y regresiones S01–03 NO ejecutadas: RAM menor de 1 GiB (0,59/0,94/0,73). Usuario avisado; no arrancar hasta disponer de memoria suficiente. Preparados 17/18; eso no equivale a aprobados. S04-TC-086,087,089,100 pasan de skip a implementados, pendientes de ejecución.
- Registradas tareasSprint04; correos completos para openRoundFor, aislamiento del reloj e IDs devueltos por tarea. Reverb usa VITE_REVERB_*; auth nativa y perfil ID adaptados sin cambios del backend. Tras 409, claves nuevas para respuesta y alternativas.
- **Pedido preciso a Claude Code (S04-TC-094):** falta tarea de replay de evento real. Debe localizar un evento de solicitud del cliente sintético, devolver event_id/request_id/version/canal y publicarlo dos veces por Reverb con el MISMO event_id y versión, sin modificar el negocio. Respetar slot/guarda *_testing. Hoy tareasSprint04 solo ofrece serverClock, runJobs y openRoundFor. No hace falta cuenta nueva ni endpoint HTTP del producto. Se mantiene skip hasta tener esta operación.
- Continuación: comprobar memoria y bloqueo global; correr S04 y luego S01,S02,S03 de a uno, preservar fallos y documentar los del backend sin tocarlo. Revisar CI del último push. Revisor [PENDIENTE]. Informe completo en evidencias/sprint-04/cypress/README.md.


## 2026-10-16 · S4.4 · Frontend de matching

- Rama feature/delgado/b-matching/s04; base 38c9c14. Fuentes S4 de origin/feature/mayhuasca/b-matching/s04 importadas; leídos ambos HANDOFF y D-60–71. Se conserva nota de D-26 de main.
- Commits: 757abe1 rojo (fallo de importación, 0 ejecutados); b5b8891 implementación; e9d7504 Cypress preparado; dac617f recuperación de ofertas vencidas.
- Pantallas: ofertas técnico y SLA del servidor, candidatos/selección/pendiente/alternativas, notificaciones after_id, Echo/Reverb con deduplicación y recuperación, distrito base del técnico. D-60 creación idempotente y D-61 retiro de media no vinculada.
- Vitest **142/142**, 20 archivos; **13 IDs distintos S04-TC-101–113**. Líneas global **84,26 %**. Build 0, audit 0 vulnerabilidades. Prueba S03-TC-074 de creación incierta actualizada por D-60; explicación/fallos conservados en evidencias.
- Cypress: **no ejecutado**, 18 IDs representados; 13 specs con pasos y 5 skip bloqueados (086,087,089,094,100), no cuentan. No Docker, Pest ni SonarQube. Backend sin modificaciones.
- Pedidos a Claude Code: fixtures aislados para 60 s, dos aceptaciones, busy/conflicto y dirección antes/después; tarea de republicar mismo event_id; restaurar fixtures/reloj entre casos. Confirmar envoltura data de broadcasting/auth y technician_profile.id en /me. Detalle y configuración VITE_REVERB_* en evidencias/sprint-04/frontend/README.md.
- Evidencias: docs/documentacion/evidencias/sprint-04/frontend/. Avance: docs/avances/delgado/sprint-04/avance.md. PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/20; CI iniciada, consultar checks del último commit. Evidencias en d3aead5. Revisor [PENDIENTE]. S4.4 queda con esos 5 preparativos E2E pendientes; no se declara cierre del sprint.


## 2026-10-16 · RETIRO-01 · Frontend

- Rama feature/delgado/infra/retiro-prototipo; base cced99e. Commits: 60cc4a7 dependencias DEP-01; f23ed61 prueba en rojo; ee4cb8a retiro y estilos v1.
- Retirados #demo, componentes históricos, cliente token, seis archivos de pruebas históricos y src/domain completo (incluido rules.json). Ninguna prueba retirada tenía ID SNN-TC. auth.css movido a features/administration; Announcements y TechnicianProfile v1 ya eran independientes.
- Conservados marketplace.css por uso compartido v1, VideoExperience activo y ScrollServices desconectado del runtime. No se tocó backend.
- laravel-echo 2.6.1 y pusher-js 8.6.0 instalados sin uso todavía.
- Vitest: rojo esperado 3/4; verde 117/117 (146 anteriores menos 30 históricos más 1 complemento). Cobertura líneas 82,66 %, ramas 72,77 %. Build y npm audit salida 0; 0 vulnerabilidades.
- Evidencias: docs/documentacion/evidencias/sprint-04/retiro-frontend/ (logs, JUnit y LCOV anonimizados). Avance: docs/avances/delgado/sprint-04/avance.md.
- Pedidos a Claude Code: ejecutar regresión Cypress del retiro S01–S03 e integrar ambos retiros; respaldo confirmado en origin mediante v0.3-antes-retiro-prototipo (cced99e). No ejecuté Cypress, Docker ni SonarQube.
- PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/18. CI iniciada al publicar; estado actualizado en los checks del PR. Commit de evidencias 54669f9. Revisor: [PENDIENTE].



## 2026-10-15 · S3.5 · Integración frontend y regresiones aprobadas

- Rama feature/delgado/a-solicitudes/s03, slot B; merge e91e6bb de origin/main c1918f4 (PR #14 y #16), sin conflictos ni rebase. Dependencias locales sincronizadas con composer install; no se editaron archivos backend. MySQL compartido ya estaba healthy; no se levantó Compose desde el worktree.
- Pausa previa con 0,82 GiB registrada. El usuario indicó iniciar después; se notificaron avisos de RAM (675/624/833 MB en distintas corridas). Cypress siempre secuencial y con bloqueo global. Sin Pest ni SonarQube locales.
- Cypress finales: S03 **17/17** (a900605, S03-TC-052–068); S01 **17/17** (5da90c3); S02 **17/17** (7fcbb9d). JUnit y comprobación de IDs en evidencias/sprint-03/cypress/.
- Correcciones de pruebas, sin cambiar aserciones esperadas: 32d7609 cabeceras SPA y teclado; b8bf770 ruta /admin/specialties; 868e0f3 sincronización del foco; a900605 Enter y Espacio nativos CDP en Chrome; 5da90c3 output con rol implícito; 7fcbb9d dialog nativo. No quedan it.only ni reintentos configurados.
- Corridas fallidas conservadas: S03 15/17, 15/17, 16/17 y 16/17, más diagnóstico aislado TC-063; S01 16/17 por selector [role=status]; S02 15/17 por [role=dialog]. No se atribuyeron a backend: corregidos los helpers y selectores, las respuestas reales aprobaron. No hay nuevo defecto backend para REGISTRO-DEFECTOS.
- Vitest con cobertura: primera ejecución forks incompleta (139 aprobadas; 2 workers no arrancaron a tiempo). Con --maxWorkers=1 --pool=threads, aislamiento por archivo conservado: **146/146, 23 archivos, salida 0**. No se relajaron tiempos/aserciones ni se agregaron reintentos. Líneas: global 83,42 %, requests 84,67 %, matching 83,92 %.
- npm run build: salida 0. npm audit: salida 0, sin vulnerabilidades. Código validado 7fcbb9d. Evidencias anonimizadas, JUnit, LCOV y resumen de IDs en docs/documentacion/evidencias/sprint-03/cypress/.
- PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/15 . CI del push de esta entrega: comprobar checks del PR; resultado se comunica al usuario al finalizar.
- Pendiente: revisión humana [PENDIENTE], integración y cierre S3.6/SonarQube por el equipo. Se conservan los pedidos previos sobre creación incierta y limpieza de medios sin vínculo; no bloquean los 17 recorridos del contrato.


## 2026-10-15 · S3.5 · Merge completo; pausa por RAM

- Rama: feature/delgado/a-solicitudes/s03, slot B. Merge e91e6bb de origin/main c1918f4 sin conflictos; incluye PR #14 y #16 (DEF-43).
- Leídos AGENTS, ambos HANDOFF y ENTORNO-PARALELO. Contrato S3 conservado.
- Comprobación previa con os.freemem(): 0,82 GiB libres, inferior al umbral de 1 GiB del arrancador. Se avisó al usuario y no se inició Cypress, por su instrucción explícita.
- Pendiente: comprobar memoria de nuevo y dependencias locales contra composer.lock actualizado; ejecutar S03 (17 casos), S01 y S02 secuencialmente; Vitest/cobertura, build y audit; evidencias, push y CI PR #15. No se levantó Docker ni se modificó backend manualmente.
- No se atribuyen resultados anteriores al merge. Revisor: [PENDIENTE].


## 2026-10-15 · Sprint 03 · S3.4 frontend listo para integración

- **PR:** [#15](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/15). **CI comprobada:** commit 156be13, backend/frontend/conteo aprobados en [ejecución 38694503334](https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/38694503334). [Estado del último commit](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/15/checks).

- **Rama/base:** feature/delgado/a-solicitudes/s03 / af074b5; slot B. Bloqueo anterior resuelto: fuentes de Mayhuasca 402f1a8 importadas (solo docs del sprint y DECISIONES).
- **Commits:** b916280 pruebas y contratos (error de sintaxis conservado); 85e058e rojo real 13/13; 00381c9 implementación verde; 557c913 Cypress preparados; fce1653 rojo alertas; 4ca269c alertas verdes.
- **Pantallas:** asistente accesible, evidencias privadas, resumen Referencial, idempotencia/recuperación, búsqueda/perfil sin contacto, técnico precargado, Mis solicitudes y alerta de límite de activas del servidor. Registro y correcciones con mensajes de éxito/error; confirmación de retiro.
- **Pruebas:** 146/146 Vitest (23 archivos), 13 IDs S03-TC-069–081, complementos sin inflar IDs; líneas solicitudes 84,67 %, búsqueda 83,92 %, global 83,42 %. Build 0; npm audit 0 vulnerabilidades. Sin pruebas fallidas al final.
- **Cypress:** 17 IDs S03-TC-052–068 preparados y node --check correcto; NO ejecutados. Sin Docker/Pest/SonarQube.
- **Evidencias:** docs/documentacion/evidencias/sprint-03/frontend/; avance actualizado, revisión [PENDIENTE].
- **Pedidos al backend:** confirmar política de limpieza para /media sin vincular (no hay DELETE); POST /requests no tiene idempotencia, así que una creación incierta obliga a consultar Mis solicitudes, sin reenvío automático. No se inventaron endpoints. Detalle en README de evidencias.
- **Qué falta:** revisión e integración del backend #14 y luego S3.5 con Cypress real; cierre Sonar S3.6. No tocar el prototipo antes de D-26.



## 2026-10-15 · Sprint 03 · S3.4 bloqueado por fuentes sin publicar

- **Rama:** feature/delgado/a-solicitudes/s03; base origin/main af074b5; slot B.
- **Revisión:** AGENTS, ambos HANDOFF y DECISIONES; D-11, D-12, D-13, D-23 y D-25 disponibles. D-53 en adelante y las resoluciones SOL-01/SOL-02/BUSQ-01/PARAM-01 no están publicadas en main.
- **Bloqueo comprobado:** git fetch origin correcto; git ls-remote --heads origin '*s03*' sin resultados. El checkout de origin/feature/mayhuasca/a-solicitudes/s03 falla con invalid reference. No existen plan-pruebas-v3/sprint-03/CONTRATO-API.md ni CATALOGO-S03.csv.
- **Cambios:** solo este relevo y el avance; sin código ni pruebas inventadas. Los documentos históricos S03 no sustituyen el contrato vigente (AGENTS §3).
- **Pruebas:** no ejecutadas; sin cambios de producto que validar. Cypress y Docker no ejecutados.
- **Pedido a Claude Code:** publicar la rama feature/mayhuasca/a-solicitudes/s03 con el contrato, catálogo de IDs exactos y decisiones resueltas para SOL-01, SOL-02, BUSQ-01 y PARAM-01. Indicar cualquier ruta o nombre alternativo si corresponde.
- **Siguiente paso:** importar solo documentos del sprint, leer las decisiones desde la referencia publicada y ejecutar S3.4 con commit rojo/verde. PR de implementación pendiente de desbloqueo. Revisor: [PENDIENTE].



## 2026-10-14 · Sprint 03 · deuda Sonar del frontend S2

- **Rama:** feature/delgado/f-administracion/s02-sonar; base origin/main 0a5977f.
- **Commits:** 226e04c (3 pruebas en rojo); 0d282d0 (refactor en verde); e0d009b (documentación/evidencias).
- **PR:** [#12](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/12), abierto hacia main. [CI vigente](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/12/checks): en ejecución al publicar este relevo; consultar el resultado del último SHA.
- **Alcance:** solo administration/ y components/. S6819: 6 ubicaciones; S3776: 3; S3358: 9; S7718: 15; S1788: 1. S6825: ninguna dentro del alcance.
- **Pruebas:** Vitest 119/119, 21 archivos; build aprobado. Cobertura líneas administración 86,75 %, global 82,93 %. Sin Cypress, Docker ni SonarQube local, según instrucción.
- **Evidencias:** docs/documentacion/evidencias/sprint-03/sonar-frontend/ (fecha/hash, JUnit, lcov, rojo, verde, build y comprobación estática).
- **Limitación:** el HANDOFF-claude publicado no contiene todavía la lista completa S2; se corrigieron patrones verificados localmente. No se afirma Quality Gate ni cierre oficial de incidencias.
- **Qué falta:** CI del nuevo PR, revisión humana [PENDIENTE] y análisis oficial coordinado; integrar después de S2.6, imputado a S3.
- **Pedidos a Claude Code:** contrastar con exportación anonimizada S2 y confirmar cierre de incidencias tras integrar. El prototipo permanece congelado (D-26).



## 2026-10-13 · Sprint 02 · S2.5 integración slot B

- Rama feature/delgado/f-administracion/s02; TECNICOYA_SLOT=B. Merge 6cadc8b de origin/main f7c524e (PR #11), sin rebase; conflicto del contrato resuelto con v1.1 exacto de main.
- Commits: 719cc2a pruebas v1.1 en rojo; cce69aa reproducción roja del aviso de retiro; 0bb4438 implementación verde; 1651099 observación de login/identidad. PR #10: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10.
- Implementado: referencia orientativa 0–100000/máximo 2 decimales; fecha opcional no futura UTC; subcategoría opcional/inactiva; manejo del rechazo de fuentes; video decorativo fuera de tabulación; aviso de retiro persistente (DEF-41 cerrado).
- **Cypress S2: 15/17**, último intento completo 08, salida 1; fallan **S02-TC-061 y 071** (subidas). Diagnósticos con Buffer y archivo PNG físico: 7/9, mismos fallos. CSRF responde 204; después hay aviso de resultado incierto y no se observa POST /api/v1/media. **DEF-42 abierto**, causa todavía sin atribuir. Las pruebas no simulan éxito ni tienen reintentos para ocultarlo. Solo S02-TC-067 simula 500 porque lo exige el CSV.
- **Regresión S1: 17/17**, salida 0, sin cambios en sus pruebas. **Vitest 116/116**; líneas administración 86,77 %, global 82,89 %. Build salida 0; npm audit salida 0, sin vulnerabilidades. 14 IDs Vitest S2 distintos; los complementos no agregan IDs.
- **DEF-40 abierto para Claude Code:** Portfolio::present omite subcategory_id. Devolverlo en portafolio propio, documentar contrato y comprobar ida/vuelta e id inactivo con Pest. Codex no modificó backend.
- **Pedido adicional a Claude Code, DEF-42:** revisar preflight y recepción multipart/trazas de la API para /media. RAM libre observada 303–893 MB; no se afirma que sea la causa. S2.5 no está aprobado: resolver subidas y repetir los 17.
- Evidencias: docs/documentacion/evidencias/sprint-02/cypress/README.md, salidas, JUnit y lcov; todos los intentos retenidos y rutas anonimizadas. Detalles de cada corrección de pruebas en el README.
- Sin MySQL iniciado desde worktree, sin Pest o SonarQube local. Archivos sintéticos en backend/api/storage sin versionar. Quality Gate y revisión humana [PENDIENTE] para S2.6.
- Push realizado a feature/delgado/f-administracion/s02, nunca a main. a9574f5 conserva diagnóstico/fixture; c05f61e publica evidencias. CI de GitHub Actions iniciada tras el push; estado actualizado en https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10/checks. La CI no ejecuta Cypress ni SonarQube y no cierra DEF-42.

## 2026-10-10 · Sprint 02 · S2.4 frontend

- Rama feature/delgado/f-administracion/s02, slot B, base origin/main 1bfb8f4. Solo docs del sprint importados desde rama Mayhuasca 2140555; backend intacto.
- Commits: 3495ed8 pruebas Vitest en rojo; 4a35589 implementación verde. PR #10: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10
- Landing con 10 secciones, catálogo/carrusel v1 sin datos demo; panel admin de catálogo, comunicados y verificación; panel técnico con perfil/documentos/portafolio, disponibilidad, zonas, pausa y tarifas; comunicados al inicio de roles. Confirmaciones, versiones, errores y lectura tras resultado incierto.
- Vitest: 112/112, salida 0; 14 IDs S02-TC-076–089 exactos, seis complementos sin inflar IDs. Líneas administración 86,40 %, global 82,66 %. Build salida 0. npm audit salida 0, 0 vulnerabilidades.
- Cypress: 17 casos S02-TC-059–075 preparados, node --check correcto. NO EJECUTADO, como Docker/Pest/SonarQube. S02-TC-067 usa 500 simulado porque el CSV lo prescribe. No se acredita integración ni cierre del sprint.
- Evidencias: docs/documentacion/evidencias/sprint-02/frontend/. Avance: docs/avances/delgado/sprint-02/avance.md. Revisor [PENDIENTE].
- Ajustes de pruebas: S1 conserva aserciones y aísla el componente nuevo del portal; carrusel legado conservado para regresión D-26; S02-TC-083 comprueba descripción accesible para evitar selector ambiguo de errores.
- Pendiente S2.5: integrar backend S2.3, merge sin rebase, ejecutar Cypress con bloqueo global y slot B. No se ejecutó todavía ni se modificó el arrancador.
- Pedidos a Claude Code: completar/confirmar Sprint02E2ESeeder (no existía en 2140555), cuentas sintéticas y contraseña vía arrancador; pendiente completo para aprobación, otro para rechazo, al menos dos subcategorías con foto del mismo rubro para teclado. Confirmar límites de tarifa orientativa y reglas completas de subcategory_id/performed_on del portafolio: contrato §5.5/§7.4 incompleto. D-46 a D-52 leídas en la rama backend y aplicadas según contrato, sin copiar DECISIONES por fuera del alcance autorizado.
- Bloqueo de cierre: integración real/API y revisión humana pendientes, no de la compilación frontend.


## 2026-10-10 · Sprint 02 · CI GitHub Actions (D-39)

- Rama feature/pimentel/f-administracion/s02-ci desde origin/main 30f130e; solo configuración común y documentación.
- Workflow PHP 8.2/PCOV/MySQL 8.4 + Node 24, Pest/Vitest, build, auditorías, artefactos y conteo informativo de JUnit frescos.
- Cypress y SonarQube permanecen locales en el cierre; CI verde no sustituye la DoD.
- Commits: 3d28cd7 (workflow/documentación), 352288b (dotenv efímero y fallo ante advertencias). PR #9: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/9
- Validación remota: https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/38028328415, tres jobs aprobados. Pest 102/102 (1047 aserciones), Vitest 92/92, build aprobado, ambas auditorías sin vulnerabilidades. Conteo S01 78 IDs CI, sin Cypress; no acredita cierre completo.
- Evidencias: docs/documentacion/evidencias/sprint-02/ci/2026-10-10-352288b-resultado.md. Advertencias iniciales dotenv resueltas sin tocar pruebas. No se ejecutaron suites ni Docker locales.
- Pendiente: revisión/integración por el equipo. Cypress y Quality Gate siguen locales; sin bloqueos.
- Revisión humana: [PENDIENTE].

## 2026-10-09 · Sprint 01 · S1.5 completado

- Rama feature/delgado/f-administracion/s01, slot B. origin/main a04b677 (PR #6 integrado); merge 9b0714a, sin rebase.
- Cuatro conflictos de títulos resueltos solo en frontend con IDs del catálogo y aserciones intactas. Backend coincide con origin/main.
- Vitest sobre merge: 92/92 (17 archivos), salida 0. Build: salida 0.
- Cypress: 16/17 en 9b0714a y ab71db2; fallo único S01-TC-075. Sincronizar render no bastó. abb2b7b completa Enter por CDP en Chromium, comprueba isTrusted=true y conserva recorrido por teclado/POST real.
- **Final abb2b7b: 17/17, salida 0**, seis specs; IDs S01-TC-015–025 y 072–077 cotejados con CSV. Sin omitidos/reintentos automáticos/respuestas de servidor fabricadas. Producto no cambió después del merge.
- MySQL ya healthy; no se levantó/recreó. Bloqueo global respetado, global y B liberados al final. No se ejecutó Pest ni SonarQube.
- Evidencias: docs/documentacion/evidencias/sprint-01/cypress/README.md (tres logs, tres conjuntos JUnit, diagnóstico); avance de Delgado actualizado. PR #7: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/7
- Pendiente: revisión humana [PENDIENTE], S1.6 y Quality Gate/cierre de sprint. Sin bloqueos de S1.5.


## 2026-10-09 · Sprint 01 · S1.5 pendiente de PR #6

- Rama feature/delgado/f-administracion/s01; código probado da68664, slot B.
- Fetch aprobado. Merge origin/main: Already up to date; main sigue en 6dfec52e. Sin conflictos.
- GitHub confirma PR #6 abierto, merged=false (head 5b9126b). Se pidió al usuario aviso tras integrarlo; no se fusiona por cuenta propia.
- npm test: 92/92 (17 archivos); npm run build: salida 0. MySQL healthy, bloqueos global/slot B libres; no se modificaron.
- Cypress NO EJECUTADO: faltó la precondición de backend integrado. Los 17 casos S01-TC-015–025 y 072–077 siguen pendientes.
- Evidencia: docs/documentacion/evidencias/sprint-01/cypress/. Avance actualizado. No se editaron frontend/backend ni pruebas en este paso.
- Continuar con fetch/merge cuando PR #6 esté integrado; volver a verificar Vitest/build, MySQL y bloqueo, ejecutar node scripts/run-e2e.mjs --sprint 01 --slot B --junit.


## 2026-10-09 · Sprint 01 · S1.4 frontend

- **Rama:** feature/delgado/f-administracion/s01. **Base:** origin/main 6dfec52e. Worktree TecnicoYa-cx, slot B.
- **Commits:** 9e184da (tests en rojo); 72872a8 (implementación verde y Cypress preparado); evidencia/relevo en commit documental posterior.
- **PR:** https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/7
- **Fuentes:** AGENTS, ambos handoffs, DECISIONES, contrato y catálogo S1 leídos. Solo los dos documentos S1 se importaron desde Mayhuasca 5b9126b; nada de backend.
- **Pruebas:** rojo 75/92; verde **92/92**, 17 archivos. Módulo administración 96,27 % líneas; global frontend 82,97 %. Build salida 0; npm audit 0 vulnerabilidades. Un trabajador Vitest, sin concurrencia de suites.
- **IDs planificados Vitest:** S01-TC-026–033 y 078–085 (16 únicos). Hay complementos unitarios de IDs Cypress que NO acreditan E2E ni se suman a esos 16.
- **Cypress:** S01-TC-072–077 preparados, más los 11 anteriores con nombres alineados al CSV. **NO EJECUTADO**, solo node --check. Docker, Pest y SonarQube NO ejecutados.
- **Entrega:** registro cliente/técnico, pending visible, login/logout, rutas #cuenta/{cliente,tecnico,administrador} resueltas con /me, perfil versionado/409, recuperación de resultado incierto, CSRF, 429 español, rechazo D-43 y catálogo honesto. DEF-36 corregido; no se modificó registro central de defectos.
- **Evidencias:** docs/documentacion/evidencias/sprint-01/frontend/README.md; logs, JUnit y LCOV anonimizados. Avance: docs/avances/delgado/sprint-01/avance.md; revisor [PENDIENTE].
- **Qué falta:** S1.5 tras integrar backend en main: actualizar rama y ejecutar node scripts/run-e2e.mjs --sprint 01 --slot B. Sonar/Quality Gate y revisión humana en cierre. No se declara cerrado S1.
- **Pedidos a Claude Code:** integrar contrato/implementación backend, registrar D-43/D-44 desde su rama y reanalizar DEF-36 en Sonar. Mantener backend separado de este PR. Los títulos antiguos seguían en main: se alinearon al catálogo sin cambiar las aserciones de las pruebas anteriores.
- **Bloqueos:** ninguno para S1.4; integración E2E pendiente por orden explícita del usuario.


## 2026-10-09 · Sprint 00 · integración, Cypress slot B y DEF-13 web

- Rama: codex/s00-frontend. Main integrado: 1660d8b. Merge: b188cb0, sin conflictos.
- Commits de código: b1d467b (USER node, COPY --chown); 152e145 (no descargar binario Cypress en build de producción).
- Se leyeron AGENTS.md, ENTORNO-PARALELO.md y ambos handoffs. Specs y configuración de Cypress idénticas a origin/main, comprobado con git diff.
- Validación después del merge: npm ci salida 0; npm test 63/63 (10 archivos), salida 0; npm run build salida 0; npm audit 0 vulnerabilidades, salida 0.
- E2E: node scripts/run-e2e.mjs --sprint 01 --slot B --junit, salida 0, Cypress 16.1.1 / Chrome 156, 11/11: catálogo 2, portales 6, validación 3. Base tecnicoya_b_testing, API 8002, web 5175. Sin Pest concurrente ni cambios en slot A.
- DEF-13 web: imagen tecnicoya-web-s00:frontend construida; USER node, UID efectivo 1000; HTML y bundle JS HTTP 200 (229191 bytes), HTTP interno 200. Contenedores temporales retirados. La imagen probada usa el código 152e145; los inputs de runtime no cambiaron en b188cb0 (diff comprobado).
- Incidencias preservadas: E2E previo al merge no arrancó por script ausente; primer build detenido tras descarga para aplicar omisión del binario Cypress; primer sondeo HTTP falló (ResponseEnded), diagnóstico posterior sin proxy e instancia arrancada aprobado. No se borraron esas evidencias ni se cambiaron pruebas para pasarlas.
- Evidencias: docs/documentacion/evidencias/sprint-00/frontend/postmerge-*.txt y XML; docker-web-final.txt y docker-web-runtime.txt. No contienen secretos.
- IDs: pruebas de regresión existentes, sin crear ni renumerar IDs SNN-TC-NNN; 63 y 11 son pruebas ejecutadas, no cuotas acreditadas del plan v3.
- PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/1
- Pendiente: revisión humana e integración del PR; SonarQube y cierre formal del registro por Claude Code. No se afirma Quality Gate aprobado ni sprint terminado.
- Bloqueos de esta tarea: resueltos. Pedidos a Claude Code: confirmar cierre de DEF-13 web en el registro con estas evidencias; reanalizar DEF-08 y DEF-10 y registrar DEF-18.


## Historial importado de la raíz (Fase 1 y comprobaciones previas al merge)

# Handoff Codex — frontend S00

Fecha: 2026-10-09. Worktree: TecnicoYa-cx. Rama: codex/s00-frontend, base main d361c63.

## Entregado
- DEF-18: 0 vulnerabilidades npm, sin --force.
- DEF-08: type=submit en los siete botones señalados.
- DEF-10: validación de correo acotada a 254 y 16 pruebas de borde.
- Vitest: JUnit separado de Pest, cobertura V8 texto/LCOV y ruta Sonar; normalización de rutas para análisis desde la raíz.
- Traducción de estados, permisos y errores estándar en v1, 9 pruebas adicionales.
- npm test 63/63; build correcto; npm audit 0; cobertura de líneas 61.82%.

## Evidencia y límites
Ver docs/documentacion/evidencias/sprint-00/frontend/README.md y salidas adyacentes. Seis puntos en commits separados fix(s00). No se tocaron backend, base de datos ni slot A. Fuera de frontend/web solo se escribieron las evidencias, este handoff y la propiedad LCOV solicitada en sonar-project.properties.

AGENTS.md no encontrado. ENTORNO-PARALELO.md leído en carpeta principal. La indicación actual de ejecutar audit fix prevalece sobre su prohibición anterior.

## Para integración
- Usar npm ci con Node compatible (probado 24.19.0).
- Ejecutar npm run test:coverage antes del análisis de SonarQube desde la raíz.
- No mezclar el JUnit frontend con la cuota de TC Pest: el contador actual lee exclusivamente backend/api/test-results/junit.xml.
- Reanalizar Sonar para confirmar el cierre de S9011 y regex; Quality Gate no medido en esta tarea.
- Revisar conjuntamente con el PR backend S00 antes de fusionar; sin merge automático.
## Revalidación solicitada — 2026-10-09

- Código verificado: b1d467b (DEF-13 web). Rama: codex/s00-frontend.
- Se ejecutaron git fetch origin y git merge origin/main: main remoto continúa en d361c63; no hubo cambios ni conflictos. AGENTS.md se leyó íntegro desde la carpeta principal (commit local de reglas deabac5), no desde main remoto. También se leyó la plantilla HANDOFF-codex de esa carpeta; HANDOFF-claude no encontrado allí.
- Se conservaron las specs y configuración Cypress de la rama frontend sin edición. Las nuevas specs de Claude aún no se pueden integrar desde origin/main.
- npm ci: salida 0. npm test: 63/63, salida 0. npm run build: salida 0. npm audit: 0 vulnerabilidades, salida 0.
- E2E slot B: comando solicitado ejecutado, salida 1 por MODULE_NOT_FOUND (scripts/run-e2e.mjs no existe). No se inició Cypress ni se modificó la base. También faltan backend/api/.env.testing y vendor/autoload.php en el worktree B.
- Petición al equipo: integrar/publicar el PR de entorno y reglas en main; preparar manualmente .env.testing del slot B según ENTORNO-PARALELO.md, sin compartir secretos. Después instalar las dependencias backend del worktree y repetir el E2E con el arrancador integrado.
- Evidencias de esta revisión: docs/documentacion/evidencias/sprint-00/frontend/revalidacion-*.txt e integracion-main.txt. Cada archivo identifica fecha y commit; rutas de usuario anonimizadas.
- DEF-13: Dockerfile cambiado a USER node. La comprobación de construcción y HTTP se añadirá al terminar docker-web.txt.
- No se ejecutó SonarQube; no se declara Quality Gate ni compatibilidad E2E aprobada.
Verificacion Docker final (commit 152e145): build aprobado; usuario node, UID 1000; HTTP 200 para HTML y bundle (229191 bytes); HTTP interno 200. Se preservo el fallo inicial ResponseEnded y se verifico sin proxy despues del arranque. Contenedores temporales retirados.


## 2026-10-15 · Actualización CI S3.4

Commit comprobado: 7103c44. Ejecución: https://github.com/grupopruebas41/TecnicoYA-Huancayo/actions/runs/38734429455. Frontend aprobado (Vitest, build y npm audit); Pest aprobado. Backend falla en composer audit: symfony/http-foundation (PKSA-xmwy-rmx5-m7h4, CVE-2026-108082) y symfony/yaml (PKSA-xz3r-9gp4-4m1z, CVE-2026-109413), según el reporte de CI. Conteo omitido por dependencia fallida. No se modificó backend ni se reintentó para ocultar el fallo. Pedido a Claude Code: revisar y actualizar las dependencias afectadas en su rama, validar Pest/audit y publicar la corrección. La ejecución anterior aprobada no acredita el estado actual. Revisión humana: [PENDIENTE].
