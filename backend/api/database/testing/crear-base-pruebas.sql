-- Base de datos exclusiva para las pruebas automatizadas (Pest) de TécnicoYa.
-- Separada de la base de desarrollo. RefreshDatabase borra y recrea sus tablas en cada ejecución.
--
-- Uso (XAMPP, con MySQL/MariaDB iniciado):
--   1. Reemplazar CAMBIAR_ESTA_CLAVE por una clave propia (no la publiques ni la subas al repositorio).
--   2. C:\xampp\mysql\bin\mysql.exe -u root -h 127.0.0.1 < database\testing\crear-base-pruebas.sql
--      (o pegar el contenido en phpMyAdmin > SQL).
--   3. Copiar .env.testing.example a .env.testing y poner la misma clave en DB_PASSWORD.

CREATE DATABASE IF NOT EXISTS tecnicoya_testing
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usuario con permisos solo sobre la base de pruebas (no sobre la de desarrollo ni otras).
CREATE USER IF NOT EXISTS 'tecnicoya_test'@'localhost' IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';
CREATE USER IF NOT EXISTS 'tecnicoya_test'@'127.0.0.1' IDENTIFIED BY 'CAMBIAR_ESTA_CLAVE';
GRANT ALL PRIVILEGES ON tecnicoya_testing.* TO 'tecnicoya_test'@'localhost';
GRANT ALL PRIVILEGES ON tecnicoya_testing.* TO 'tecnicoya_test'@'127.0.0.1';
FLUSH PRIVILEGES;
