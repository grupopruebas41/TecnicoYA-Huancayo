# Decisiones del proyecto TécnicoYa Huancayo

**Fuente de mayor prioridad** (regla 3 de AGENTS.md). Una decisión solo se marca como tomada con la fecha y la persona del equipo que decidió. Los agentes proponen dos opciones con su recomendación y esperan (regla 10). La «Propuesta vigente» de las decisiones pendientes viene del análisis y de las reglas formalizadas; **no es una decisión**.

**Fuentes de las pendientes:**
- `editables/CANVAS-Analisis-MVP-TecnicoYa.md`, pendientes P01–P23.
- `editables/REGLAS-DE-NEGOCIO-FORMALIZADAS-TecnicoYa.md` §9.
- La columna «Pendiente» de `editables/plan-pruebas-v2/Matriz-Trazabilidad-TC.csv`.

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

## Decisiones pendientes

| ID | Decisión | Opción elegida | Fecha | Quién decidió |
|---|---|---|---|---|
| MOD-01 | Asignación de los módulos A–F a cada integrante (adenda P10): `a-solicitudes`, `b-matching`, `c-notificaciones`, `d-atencion`, `e-calificaciones` y `f-administracion` | pendiente | — | — |
| P01 | Moneda. Propuesta vigente: S/ sin conversión. Bloquea TC-101 (S8) | pendiente | — | — |
| P02 | Alcance de pagos y comprobante. Propuesta: método y comprobante **simulados**, sin dinero real. Bloquea TC-101 y TC-103 (S8) | pendiente | — | — |
| P03 | Distritos de cobertura. Propuesta: Huancayo, El Tambo y Chilca (`rules.json` usa 5 zonas). Afecta S1–S4 | pendiente | — | — |
| P04 | Responsable del backlog | pendiente | — | — |
| P05 | Margen de atención inmediata. Propuesta: técnico sin citas en las próximas 2 h. Condiciona TC-133 (S4) | pendiente | — | — |
| P06 | Máximo de reprogramaciones. Propuesta: 2 por solicitud. Afecta HU-S05-03 | pendiente | — | — |
| P07 | Apelaciones y promedio real. Propuesta: 5 días hábiles (provisional). Condiciona TC-079, 081, 083 (S6) y TC-033 (S3) | pendiente | — | — |
| P08 | Privacidad, retención y cierre de cuenta. Propuesta: 12 meses (provisional). Afecta S8 | pendiente | — | — |
| P09 | Muestra y ventana de demostración. Propuesta: 10 participantes; 7 días de 07:00 a 22:00. Condiciona TC-115, 116, 118 (S8) | pendiente | — | — |
| P10 | Solicitudes activas simultáneas por cliente; sin valor propuesto. **Bloquea TC-122 (S3)** | pendiente | — | — |
| P11 | Elección de candidatos y asignación (momento y plazo del cliente). Condiciona TC-089 (S7) y S4 | pendiente | — | — |
| P12 | Relojes, rondas y notificaciones. Propuesta: intervalo [inicio, vencimiento) y el reloj de 24 h no se reinicia por un job. Condiciona TC-048, 054 (S4), 077 (S6) y 105 (S8) | pendiente | — | — |
| P13 | Reglas de dos técnicos. Condiciona TC-065 (S5) y TC-077 (S6) | pendiente | — | — |
| P14 | Cancelación y reprogramación en casos límite. Condiciona TC-069, 071 (S5) y TC-089 (S7) | pendiente | — | — |
| P15 | Normalización del matching, técnico sin historial y empate. Propuesta: pesos 35/20/30/15; técnico nuevo H = 0,50; umbral de 3 servicios; Dref y Aref sin valor (`rules.json` fija 10 años y 0,5). **Bloquea TC-140**; condiciona TC-044 (S4) y TC-033 | pendiente | — | — |
| P16 | Tarifas, métodos y franjas. Condiciona TC-101, 114 (S8) y TC-133 (S4) | pendiente | — | — |
| P17 | Política de contenido y archivos. **Bloquea TC-123 y TC-130 (S3)**; condiciona TC-022 (S2) y TC-081 (S6) | pendiente | — | — |
| P18 | Umbrales y efectos de sanciones (sin sanción automática). Condiciona TC-091 (S7) | pendiente | — | — |
| P19 | Vigencia de cambios administrativos. Propuesta: congelar la versión de las reglas por solicitud. Condiciona TC-095 (S7) | pendiente | — | — |
| P20 | Persona con varios roles. Propuesta: un rol por cuenta (el código ya usa `users.role_id`) | pendiente | — | — |
| P21 | Protocolo de calidad, carga y reportes. Condiciona TC-087, 097, 103, 111, 113, 114, 115, 116, 118 y 136 | pendiente | — | — |
| P22 | Estados iniciales y verificación. El código ya usa `registered` → `sent` al enviar. Afecta TC-037 y TC-126 | pendiente | — | — |
| P23 | Anclaje de la edición de la calificación. Propuesta: `first_rated_at + 48 h`, sin reinicio. Condiciona TC-075 (S6) | pendiente | — | — |
| PERM-01 | Nombres de permisos `announcements.manage` y `technicians.verify` (propuestos en `AuthorizationSeeder`). Afecta TC-018 y TC-019 | pendiente | — | — |

**Para registrar una decisión:**
1. Pasar la fila a «Decisiones tomadas».
2. Completar la opción, la fecha y el integrante.
3. Citar la decisión desde el commit que la aplique.
