# CANVAS DE ADENDA · P10 · Estructura y trabajo por integrante

**Fecha:** 5 de octubre de 2026. **Documento afectado:** [estructura de carpetas](../CANVAS-Estructura-Carpetas-TecnicoYa.md), §§3, 9, 10 y 12. Solo se documentan las incorporaciones; no se reestructura el código ni se crean ramas en esta entrega.

## Qué se agrega

### Evidencia individual de avance

Añadir al árbol de documentación:

```text
docs/
├── avances/
│   ├── README.md                      # Convención y matriz de asignaciones aprobada
│   ├── delgado/
│   │   ├── README.md                  # Módulos asignados y enlaces a PR
│   │   └── sprint-NN/
│   │       └── avance.md              # Trabajo real y enlaces a resultados
│   ├── mayhuasca/
│   │   ├── README.md
│   │   └── sprint-NN/
│   │       └── avance.md
│   └── pimentel/
│       ├── README.md
│       └── sprint-NN/
│           └── avance.md
└── documentacion/
    └── evidencias/
        └── sprint-NN/
            ├── TC-XXX/                # Resultado canónico de pruebas
            └── calidad/               # Análisis, Gate y commit del incremento
```

`sprint-NN` representa 01–08 y se crea cuando exista avance real. No rellenar carpetas con capturas, resultados o aprobaciones ficticias. Las evidencias de pruebas se conservan una sola vez en la ruta canónica y se enlazan desde cada avance individual.

Contenido mínimo de `avance.md`: integrante; sprint; módulo aprobado; HU/RF/RNF y tarea; objetivo; cambios y archivos; rama; commit/PR; pruebas previstas y ejecutadas diferenciadas; enlace al resultado SonarQube; revisor; fecha; pendientes y bloqueos; enlace a decisiones. Si hubo asistencia IA, registrar uso y revisión humana sin incluir datos sensibles.

### Asignación modular

| Integrante | Módulos A–F asignados | Responsable de aprobar distribución |
|---|---|---|
| Delgado Janampa, Jesus Oscar | **Pendiente de identificación en las fuentes revisadas** | Equipo / responsable del proyecto |
| Mayhuasca Huanca, Karen Jandre | **Pendiente de identificación en las fuentes revisadas** | Equipo / responsable del proyecto |
| Pimentel Chumbes, James | **Pendiente de identificación en las fuentes revisadas** | Equipo / responsable del proyecto |

No se deduce la asignación a partir del rol de usuario (cliente/técnico/admin): cada módulo puede atravesar varios portales. Confirmar dueño y revisor de ARequests, BMatching, COffers, DService, ERatings y FAdministration antes de repartir sus tareas. Si ya existe una distribución acordada, transcribirla con su fuente; no reemplazarla por una propuesta automática.

### Ramas por integrante y módulo

Convención solicitada: `feature/<integrante>/<modulo>`; nombres en minúsculas, sin espacios ni tildes. Esta convención específica sustituye cualquier prefijo genérico de ramas de trabajo para este proyecto.

| Integrante | Patrón, no rama creada |
|---|---|
| Delgado | `feature/delgado/<modulo-asignado>` |
| Mayhuasca | `feature/mayhuasca/<modulo-asignado>` |
| Pimentel | `feature/pimentel/<modulo-asignado>` |

Slugs de módulos: `a-solicitudes`, `b-matching`, `c-notificaciones`, `d-atencion`, `e-calificaciones`, `f-administracion`. Utilizar solo los asignados al integrante. Para tareas simultáneas del mismo módulo se puede extender el patrón con `/hu-sNN-XX`; acordar una convención única sin cambiar el dueño del módulo.

Flujo: actualizar desde la rama de integración acordada → crear rama por integrante/módulo → implementar HU y pruebas → PR/MR con evidencia → revisión de otro integrante y Gate aprobado → integrar → registrar avance. Confirmar la rama de integración existente; esta adenda no crea `develop` ni renombra `main`.

Cambios en contratos compartidos, autenticación, auditoría o migraciones requieren coordinación con los módulos consumidores y revisión cruzada. Las ramas no son copias permanentes de la aplicación ni autorizan editar módulos ajenos sin coordinación. Proteger la rama de integración conforme al proveedor de repositorio que el equipo confirme; PR/MR expresa el mismo punto de control.

## Qué se modifica

- §3: añadir `docs/avances` al árbol propuesto.
- §9: distinguir avance individual de evidencia canónica del sprint y enlazarlos por HU/TC/commit.
- §10: incorporar ramas por integrante/módulo y revisión cruzada antes de integración.
- §12: cada tarea del sprint identifica integrante, módulo y revisor; la distribución aún no documentada queda pendiente de confirmación.

## Qué se elimina

- La ambigüedad de evidencias sin autor, sprint o commit y el uso de ramas personales indefinidas que acumulan todo el trabajo sin revisión.
- No se elimina `docs/documentacion/evidencias`, no se duplican backend/frontend por integrante y no se borra ningún archivo o historial.

**Impacto:** organizativo y de trazabilidad. No altera RBAC del aplicativo, módulos funcionales ni reglas de negocio.
