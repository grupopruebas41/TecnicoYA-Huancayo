# Avance individual por integrante (adenda P10)

Cada integrante registra aquí **su trabajo real** de cada sprint. Las evidencias de pruebas se guardan una sola vez, en la ruta canónica `docs/documentacion/evidencias/sprint-NN/`, y desde aquí solo se enlazan.

## Estructura

```text
docs/avances/
├── README.md                 # esta convención
├── delgado/sprint-NN/avance.md
├── mayhuasca/sprint-NN/avance.md
└── pimentel/sprint-NN/avance.md
```

Las carpetas `sprint-NN` se crean **cuando existe avance real**, nunca vacías ni con contenido ficticio.

## Asignación de módulos

Pendiente de decisión: MOD-01 en [DECISIONES.md](../documentacion/sprints/DECISIONES.md). No se deduce del rol de usuario. Mientras no se decida, el reparto es por capa (regla 1 de AGENTS.md): Delgado frontend, Mayhuasca backend, Pimentel base de datos, Docker e integración.

## Ramas

`feature/<integrante>/<módulo>/sNN`:
- integrante: `delgado`, `mayhuasca` o `pimentel`;
- módulo: `a-solicitudes`, `b-matching`, `c-notificaciones`, `d-atencion`, `e-calificaciones` o `f-administracion`.

Integración solo por Pull Request, con revisión de otro integrante y Quality Gate aprobado.

## Contenido mínimo de `avance.md`

```markdown
# Avance · <integrante> · Sprint NN

- **Integrante:** <apellido>
- **Sprint / módulo:** NN / <módulo>
- **HU / RF / tarea:** HU-SNN-XX · RF-XX · <tarea>
- **Objetivo:** <una línea>
- **Cambios y archivos:** <lista>
- **Rama / commits / PR:** feature/<integrante>/<módulo>/sNN · <hash> · #<PR>
- **Pruebas previstas:** <IDs SNN-TC-NNN>
- **Pruebas ejecutadas:** <aprobadas>/<total> · enlace a evidencias/sprint-NN/…
- **SonarQube:** <enlace o identificador del análisis> · Quality Gate <estado>
- **Revisor:** [PENDIENTE]
- **Fecha:** AAAA-MM-DD
- **Pendientes y bloqueos:** <lista>
- **Decisiones relacionadas:** enlace a DECISIONES.md (Pxx / D-xx)

## Uso de IA
| Herramienta y modelo | Fecha | Qué se aceptó | Qué se corrigió | Quién lo revisó |
|---|---|---|---|---|
| <p. ej., Claude Code / Codex> | AAAA-MM-DD | … | … | [PENDIENTE] |
```

Los agentes **no** rellenan revisores ni aprobaciones: dejan `[PENDIENTE]` para que el integrante lo complete (regla 11 de AGENTS.md).
