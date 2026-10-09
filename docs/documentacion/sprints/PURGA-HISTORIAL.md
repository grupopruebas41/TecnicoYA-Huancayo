# Purga del historial: datos personales (DEF-17)

> **Preparado, no ejecutado** (decisión D-09: no purgar por ahora). La purga reescribe el historial publicado, es **irreversible** para los clones que no se actualicen y obliga a todos los integrantes a clonar de nuevo. AGENTS.md prohíbe a los agentes el `push --force` y reescribir historial publicado: **lo ejecuta una persona del equipo** (Pimentel, integración), con acuerdo previo de los tres.

## Qué se purga

| Archivo | Dato personal | Commit que lo introdujo | Situación en la rama s00 |
|---|---|---|---|
| `docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json` | Correo institucional (autor de commits en el exporte de SonarQube) | `d361c63` | Retirado del árbol e ignorado (`**/sonar/issues.json`); reemplazado por `issues-anonimo.json` |
| `docs/documentacion/fuentes/proyecto-final.pdf` | Códigos de alumno en la portada | `04c3e2d` | **Sigue en el árbol** hasta recibir la versión sin códigos (decisión D-08) |
| `docs/documentacion/informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx` | Códigos de alumno | `ed41073` | Retirado del árbol e ignorado (decisión D-07) |

**Antes de purgar, decide qué pasa con el PDF y el Word en el árbol actual.** `filter-repo` borra la ruta en **todos** los commits, también en el último. Si quieres conservar una versión sin códigos, súbela **después** de la purga con otro nombre, por ejemplo `proyecto-final-sin-codigos.pdf`.

## Requisitos

1. Acuerdo de los tres integrantes y una hora sin trabajo en curso. Antes, integrar o cerrar todos los PR abiertos (ver Limitaciones).
2. Todos suben sus ramas y avisan; después **nadie hace push** hasta terminar.
3. Instalar `git-filter-repo`, que no está instalado en este PC: `py -m pip install --user git-filter-repo`. Comprobar con `git filter-repo --version`.
4. Permiso de administrador en GitHub para desactivar temporalmente la protección de `main` (si existe) y para el push forzado.

## Procedimiento

Todo se hace en una carpeta nueva, **no** en la de trabajo.

```powershell
# 1. Respaldo completo e intocable del repositorio publicado (todas las ramas y etiquetas)
cd C:\Users\<usuario>\Documents
git clone --mirror https://github.com/grupopruebas41/TecnicoYA-Huancayo.git TecnicoYa-respaldo-AAAAMMDD.git
# Guardar esta carpeta fuera del repositorio (y, si es posible, una copia comprimida aparte).

# 2. Clon espejo de trabajo para la purga
git clone --mirror https://github.com/grupopruebas41/TecnicoYA-Huancayo.git TecnicoYa-purga.git
cd TecnicoYa-purga.git

# 3. Retirar las tres rutas de TODO el historial
git filter-repo --invert-paths `
  --path docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json `
  --path docs/documentacion/fuentes/proyecto-final.pdf `
  --path docs/documentacion/informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx

# 4. Verificar que ninguna rama contiene ya esas rutas (cada comando debe salir vacío)
git log --all --format=%h -- docs/documentacion/evidencias/sprint-01/continuacion/sonar/issues.json
git log --all --format=%h -- docs/documentacion/fuentes/proyecto-final.pdf
git log --all --format=%h -- docs/documentacion/informe-final/Proyecto-final-TecnicoYa-capitulos-01-al-13.docx

# 5. Guardar la correspondencia de hashes (filter-repo la deja en filter-repo/commit-map)
copy filter-repo\commit-map ..\commit-map-purga-AAAAMMDD.txt

# 6. filter-repo elimina el remoto por seguridad: volver a agregarlo y publicar (push forzado coordinado)
git remote add origin https://github.com/grupopruebas41/TecnicoYA-Huancayo.git
git push --force --mirror origin
```

`--mirror` también fuerza las ramas `feature/*`. Por eso el paso 2 de los requisitos exige que todos hayan subido su trabajo antes.

## Qué hace cada integrante después

1. **No hacer push desde el clon antiguo.** Un push o un PR desde el clon antiguo **reintroduce** los archivos y los commits viejos.
2. Mover la carpeta de trabajo antigua a un nombre de respaldo y **clonar de nuevo**:
   ```powershell
   git clone https://github.com/grupopruebas41/TecnicoYA-Huancayo.git "Software TecnicoYa-Huancayo"
   ```
3. Volver a copiar a mano los archivos no versionados: `backend/api/.env`, `backend/api/.env.testing` y, en el worktree de Codex, su `.env.testing`. Ejecutar `composer install` y `npm ci`.
4. Recrear el worktree de Codex (`git worktree add ..\TecnicoYa-cx main`) desde el clon nuevo y borrar el antiguo.
5. Si alguien tenía cambios sin subir, exportarlos del clon antiguo como parche (`git diff > cambios.patch`) y aplicarlos en el nuevo (`git apply cambios.patch`). **No hacer `cherry-pick` de commits antiguos.**

## Efectos y limitaciones

- **Todos los hashes cambian** desde `ed41073` (05-10): 33 de los 37 commits actuales de esta rama, entre ellos `8997de8`, `7e97432`, `d361c63` y `fa6de02`. Las evidencias y documentos que citan hashes (`Matriz-Trazabilidad-TC.csv`, `INFORME.md`, `HALLAZGOS-SONAR.md`, `REGISTRO-DEFECTOS.csv`, `analyses.json` de SonarQube, informes de sprint y el informe Word) quedarán desactualizados. Hay que corregirlos con la tabla `commit-map` y un commit `docs`.
- **Cachés de GitHub:** los commits antiguos pueden seguir accesibles por su hash directo (URL `/commit/<hash>`) mientras GitHub no haga recolección de basura. Para que desaparezcan antes, hay que pedirlo a GitHub Support ("Remove sensitive data", indicando los hashes `d361c63`, `04c3e2d` y `ed41073`).
- **Forks y clones:** la purga no alcanza a forks, clones ni descargas ZIP hechos por terceros. El repositorio es **público**, así que debe tratarse como ya expuesto.
- **PR abiertos:** las referencias `refs/pull/*` las gestiona GitHub y no se reescriben. Un PR abierto conserva los commits antiguos y se vuelve inconsistente. Hay que integrar o cerrar todos los PR **antes** y recrear después los que sigan vigentes.
- **SonarQube y otros servicios:** los análisis guardan la revisión `8997de8`. Tras la purga, el siguiente análisis usará los hashes nuevos.
- **Medida inmediata y reversible, independiente de la purga:** **poner el repositorio en privado** mientras dure el curso (GitHub → Settings → General → Danger Zone → Change visibility). Reduce la exposición desde ya; la purga elimina el dato del historial.
