-- Slot B de pruebas (Codex): segunda base en el mismo contenedor MySQL de pruebas.
-- La imagen oficial ejecuta este archivo solo al crear el volumen, después de crear
-- MYSQL_DATABASE (tecnicoya_testing, slot A) y MYSQL_USER (tecnicoya_test).
-- Ver docs/documentacion/sprints/ENTORNO-PARALELO.md.

CREATE DATABASE IF NOT EXISTS tecnicoya_b_testing
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- El mismo usuario de pruebas opera las dos bases; no recibe permisos sobre otras.
GRANT ALL PRIVILEGES ON tecnicoya_b_testing.* TO 'tecnicoya_test'@'%';
FLUSH PRIVILEGES;
