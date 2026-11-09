# Imágenes de demostración del portafolio

El `DemoSeeder` (solo con `APP_ENV=local`) busca aquí las fotos del portafolio de los técnicos de demostración. Si no hay ninguna, los trabajos quedan sin fotos y el panel muestra ilustraciones propias.

- **Nombre:** `<alias>-<n>-antes.<ext>` y `<alias>-<n>-despues.<ext>`.
  - `<alias>`: `demo-tecnico-refrigeracion` (Rosa Quispe) o `demo-tecnico-computo` (Diego Huamán).
  - `<n>`: número del trabajo, desde 1, en el orden de `DemoTechnicianProfiles.php`.
  - `<ext>`: `webp`, `png` o `jpg`.
- **Ejemplo:** `demo-tecnico-computo-1-antes.webp` y `demo-tecnico-computo-1-despues.webp`.
- **Origen:** imágenes generadas por el equipo o propias. Nunca fotos de terceros ni de personas reales.
- **Idempotencia:** el seeder no duplica trabajos ya creados. Para que tome fotos nuevas, borra antes esos trabajos o usa una base limpia.
