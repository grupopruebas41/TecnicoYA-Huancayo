# Decisiones del proyecto TécnicoYa Huancayo

**Fuente de mayor prioridad** (regla 3 de AGENTS.md). Una decisión solo se marca como tomada con la fecha y la persona del equipo que decidió. Los agentes proponen dos opciones con su recomendación y esperan (regla 10). La «Propuesta vigente» de las decisiones pendientes viene del análisis y de las reglas formalizadas; **no es una decisión**.

**Fuentes de las pendientes:**
- `editables/CANVAS-Analisis-MVP-TecnicoYa.md`, pendientes P01–P23.
- `editables/REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md` §9.
- La columna «Pendiente» de `editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv`.
- [HOJA-DE-DECISIONES.md](HOJA-DE-DECISIONES.md): opciones, efectos y recomendaciones de D-10 a D-41.

## Decisiones tomadas

| ID | Decisión | Opción elegida | Fecha | Quién decidió |
|---|---|---|---|---|
| D-01 | Plan vigente | I0 + 8 sprints de `editables/sprints-01-08`. Los PDF 08–17 (10 iteraciones con PostgreSQL, Python y LLM) son históricos y no prevalecen | 2026-10-09 | Pimentel |
| D-02 | Motor de base de datos del producto | MySQL 8.4 en todos los entornos (DEF-12, commit `508eb4b`) | 2026-10-09 | Pimentel |
| D-03 | Meta de pruebas | ≥ 60 IDs distintos aprobados **por sprint**: ≥ 36 Pest, ≥ 14 Cypress y ≥ 10 Vitest. Los bloqueados y las pruebas del prototipo no cuentan | 2026-10-09 | Pimentel |
| D-04 | Identificadores de prueba | `SNN-TC-NNN` al inicio de la descripción y `[TC-0xx]` si deriva del catálogo base | 2026-10-09 | Pimentel |
| D-05 | Reparto entre agentes | Claude Code: backend y Pest. Codex: frontend, Vitest y Cypress. Ramas `feature/<integrante>/<módulo>/sNN` | 2026-10-09 | Pimentel |
| D-06 | Entorno de pruebas en paralelo | Un contenedor MySQL con dos slots: A (`tecnicoya_testing`, 8001/5174) y B (`tecnicoya_b_testing`, 8002/5175) | 2026-10-09 | Pimentel |
| D-07 | DEF-17, Word con códigos de alumno | Retirar `informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx` del repositorio | 2026-10-09 | Pimentel |
| D-08 | DEF-17, PDF con códigos de alumno | Reemplazar `fuentes/proyecto-final.pdf` por una versión sin códigos que entregará el equipo; hasta entonces sigue en el árbol | 2026-10-09 | Pimentel |
| D-09 | DEF-17, purga del historial | **No ejecutarla por ahora.** Queda preparada en `PURGA-HISTORIAL.md` | 2026-10-09 | Pimentel |
| D-10 | META-01 · Meta de pruebas | Opción A: se ratifica D-03, ≥ 60 IDs por sprint (≥ 36 Pest, ≥ 14 Cypress, ≥ 10 Vitest) | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-11 | P10 · Solicitudes activas por cliente | Opción A con **N = 3**. Cuentan desde `sent` hasta el cierre o la cancelación; `registered` no cuenta. N se guarda como parámetro de reglas versionado. Desbloquea TC-122 | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-12 | P17 · Contenido de la solicitud (parte S3) | Opción A: descripción de **20 a 1000 caracteres**; fotos **JPG, PNG o WebP**, **hasta 5 MB** cada una y **como máximo 5 por solicitud**. Desbloquea TC-123 y TC-130. Portafolio, documentos y respuestas a reseñas siguen pendientes (P17-S6) | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-13 | P22 · Estados iniciales y verificación | Opción A: `registered` es la solicitud guardada y editable; `sent`, la enviada, que no se modifica ni se elimina. El rechazo de verificación se registra como decisión «rechazada» con motivo en la revisión y el técnico sigue sin recibir ofertas | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-14 | P20 · Persona con varios roles | Opción A: un rol por cuenta (`users.role_id`) | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-15 | P03 · Distritos de cobertura | Opción A: Huancayo, El Tambo y Chilca como semilla, ampliables por el administrador (`/admin/districts`). `rules.json` no prevalece | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-16 | PERM-01 · Nombres de permisos | Opción A: `announcements.manage` y `technicians.verify` tal como están en `AuthorizationSeeder` | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-17 | P04 · Responsable del backlog | Opción A: una persona fija; la persona se nombra en D-40 | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-18 | P07 (parte S3) · Promedio para el filtro de búsqueda | Opción A: promedio de las calificaciones vigentes (excluye las anuladas por apelación); un técnico sin calificaciones no pasa un filtro de calificación mínima | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-19 | MATCH-01 · Dónde se programa el matching | Opción A: PHP dentro de Laravel (módulo `BMatching`); el servicio Python no se usa | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-20 | P15 · Normalización, técnico sin historial y empate | Opción A: normalización relativa por ejecución (`Dref` = mayor distancia y `Aref` = mayor experiencia entre los elegibles de esa ejecución); con 3 o más servicios y ninguna reseña, H = 0,50; el empate persistente se muestra como empate; el tiempo estimado sale de las duraciones reales del técnico con historial suficiente y, si no lo tiene, se muestra «Nuevo, sin estimación». Desbloquea TC-140 | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-21 | P12 · Relojes, rondas y notificaciones | Opción A: intervalo [inicio, vencimiento); el SLA empieza cuando la oferta está en la bandeja aunque falle el correo; el reloj de 24 h no se reinicia por un job | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-22 | P11 · Elección del cliente | Opción A: el cliente elige al cerrarse la ronda; no hay un plazo nuevo y la disponibilidad se revalida al elegir | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-23 | P05 · Atención inmediata | Opción A: técnico sin citas en las próximas 2 h | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-24 | P19 · Vigencia de cambios administrativos | Opción A: cada solicitud conserva la versión de reglas con la que se envió | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-25 | P16 · Tarifas, citas y métodos de pago | Opción A: el técnico declara su tarifa por subcategoría (versionada) y el catálogo no fija precio; el técnico define la duración de sus franjas; el administrador carga los métodos de pago simulados; no se guardan datos bancarios | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-26 | PROTO-01 · Retiro del prototipo histórico | Opción B **con ajuste**: se retiran `/api/*` con token (salvo `GET /api/health`), la demo `#demo`, `marketplace:tick`, `marketplace:admin`, el servicio Python y pytest **solo cuando las pantallas v1 de S2 y S3 pasen sus pruebas Cypress**. Hasta entonces siguen congelados. El código queda en el historial de Git con una etiqueta | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-27 | P13 · Dos técnicos | Opción A: cada participación es independiente y el servicio se cierra cuando todas están cerradas o sin calificar | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-28 | P14 · Cancelación y reprogramación | Opción A: no se cancela durante la atención (se registra una incidencia); una cita que vence sin respuesta mantiene la original; las reservas se liberan al cancelar | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-29 | P06 · Reprogramaciones | Opción A: 2 cambios aceptados por solicitud, en total aunque haya dos técnicos | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-30 | P23 · Edición de la calificación | Opción A: `first_rated_at + 48 h`, sin reinicio al editar | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-31 | P07 (resto) · Plazo de apelación | Opción B: 5 días **calendario**; el número de apelaciones está en D-41 | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-32 | P18 · Sanciones | Opción A: solo manuales, con motivo y auditoría; al bloquear se cierran las sesiones y no se aceptan nuevas solicitudes, y las atenciones en curso siguen | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-33 | P21 · Protocolo de calidad y carga | Opción A: k6 con escenarios sintéticos; Chrome, Edge y Firefox actuales; cobertura en líneas por módulo ≥ 70 %. Umbrales: los de **RNF-01** (matching ≤ 3 s) y **RNF-02** (200 usuarios concurrentes) | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-34 | P08 · Retención y cierre de cuenta | Opción A: 12 meses desde el cierre, con anonimización; no se cierra una cuenta con servicios abiertos. Sin validación legal | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-35 | P09 · Demostración | Opción A: 10 participantes; 7 días de 07:00 a 22:00 | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-36 | P01 · Moneda | Opción A: soles (S/), sin conversión | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-37 | P02 · Pagos y comprobante | Opción A: solo método de pago y comprobante simulados, con aviso claro de simulación | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-38 | MOD-01 · Dueño de cada módulo | Opción A, dos módulos fijos por integrante: **Mayhuasca** `a-solicitudes` y `b-matching`; **Pimentel** `c-notificaciones` y `f-administracion`; **Delgado** `d-atencion` y `e-calificaciones`. El dueño responde por su módulo y otro integrante revisa sus PR. Las ramas siguen la regla 5 de AGENTS.md (backend `mayhuasca`, frontend `delgado`, común `pimentel`) | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-39 | CI-01 · Plataforma de CI | Opción A: GitHub Actions por ahora. Si el docente exige el GitLab del laboratorio, se cambia a la opción C (GitHub Actions y espejo al GitLab) | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-40 | P04 · Nombre del responsable del backlog | Pimentel | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-41 | P07 · Número de apelaciones | Una sola apelación por reseña | 2026-10-09 | Decidido por el equipo (Delgado, Mayhuasca y Pimentel) |
| D-42 | COV-01 · Cobertura de `database/`, `routes/` y `config/` (DEF-35) | Opción A: ampliar `<source>` de `backend/api/phpunit.xml` a `database`, `routes` y `config`; no se excluye nada en SonarQube | 2026-10-09 | Pimentel |
| D-43 | S01-A · Registro con sesión abierta | Opción A: `POST /api/v1/auth/register` con una sesión activa se rechaza con 403 y el mensaje «Ya tienes una sesión activa. Cierra sesión para crear otra cuenta.»; no se crea usuario ni perfil y la sesión no cambia (S01-TC-086) | 2026-10-09 | Pimentel |
| D-44 | S01-B · Auditoría de accesos | Opción A: se auditan en `audit_entries` los inicios de sesión exitosos y fallidos y los cierres de sesión de cuentas administradoras, sin contraseña ni datos de sesión (SEC-S01-05; S01-TC-087). Los demás roles no se auditan en S1 | 2026-10-09 | Pimentel |
| D-45 | S01-C · Alcance de la mutación en el cierre de S1 | No se corre la mutación del módulo `FAdministration` completo (848 mutantes, unas 2,8 h). Basta la de las 12 clases del Sprint 1 (`04-mutacion.txt`) y, tras reforzar S01-TC-010, una nueva corrida solo de `CatalogController` (27/27). La rama de cierre es `feature/pimentel/f-administracion/s01-cierre` | 2026-10-09 | Pimentel |
| D-46 | P17-S2 · Archivos de portafolio y documentos | Opción A, igual que D-12: imágenes de portafolio y de catálogo **JPG, PNG o WebP de hasta 5 MB**, **como máximo 5 por trabajo**; documentos de verificación **PDF, JPG o PNG de hasta 5 MB**, **como máximo 5 vigentes por técnico**. Desbloquea TC-022 (S02-TC-039) | 2026-10-10 | Pimentel |
| D-47 | MEDIA-01 · Revisión de imágenes públicas | Opción A: revisión automática al subir. Se comprueba el tipo real por contenido (`finfo`) y la estructura de la imagen, y se quitan los metadatos EXIF; el archivo queda `scan_status = clean`. Las imágenes de portafolio y catálogo son públicas; los documentos, privados. Sin bandeja de moderación en S2 | 2026-10-10 | Pimentel |
| D-48 | TARIFA-01 · Límites de la tarifa referencial del técnico | Opción A: de **S/ 1,00 a S/ 5 000,00**, ambos incluidos, con **2 decimales como máximo** | 2026-10-10 | Pimentel |
| D-49 | FRANJA-01 · Franjas y pausa | Opción A: las franjas de un mismo día **no se solapan**; las **contiguas** (fin de una = inicio de otra) se permiten; cada franja dura **al menos 30 minutos** y no cruza la medianoche. La pausa empieza en el minuto actual o después; su fin, si existe, es posterior al inicio | 2026-10-10 | Pimentel |
| D-50 | VERIF-01 · Rechazo y suspensión del técnico | Opción A: el rechazo deja `status = pending_verification` y `verification_status = rejected`, con motivo; el técnico corrige y pide una nueva revisión, que vuelve a `pending`. La suspensión (D-32) solo se aplica a un técnico activo y se levanta a mano, con motivo, volviendo a `active`. En S2 solo backend; la pantalla de suspensión es del Sprint 7 | 2026-10-10 | Pimentel |
| D-51 | COM-01 · Edición de comunicados publicados | Opción A: solo se editan los borradores; un comunicado publicado se retira o se duplica, para conservar lo que vieron los usuarios | 2026-10-10 | Pimentel |
| D-52 | CAT-01 · `subcategories.reference_fee` | Opción A: se mantiene como **referencia orientativa no vinculante**, coherente con la Fuente 0 y RF-04 (S03-TC-031). No contradice D-25: el precio lo declara el técnico por subcategoría y el catálogo no fija precio | 2026-10-10 | Pimentel |

## Decisiones pendientes

| ID | Decisión | Opción elegida | Fecha | Quién decidió |
|---|---|---|---|---|
| P17-S6 | Límites de comentarios de calificación y respuestas a reseñas (portafolio y documentos quedaron en D-46) | pendiente | — | — |

**Para registrar una decisión:**
1. Pasar la fila a «Decisiones tomadas».
2. Completar la opción, la fecha y el integrante.
3. Citar la decisión desde el commit que la aplique.
