# Sprint 1: aprovisionamiento, sesión SPA y E2E

Rama: `codex/sprint-01`. No se modifica el catálogo TC ni el Módulo A.

## Requisitos y ejecución secuencial

Docker Desktop activo, PHP 8.2 con PDO MySQL, dependencias Composer instaladas, Node 24, dependencias npm instaladas y Chrome. La base aislada es **tecnicoya_testing**, usuario **tecnicoya_test**. La contraseña se obtiene de `backend/api/.env.testing`, ignorado por Git.

Desde la raíz, en PowerShell:

```powershell
Set-Location backend/api
docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait
C:/xampp/php/php.exe artisan test --no-ansi
# Esperar a que Pest termine antes de seguir.
Set-Location ../..
node scripts/run-sprint01-e2e.mjs
```

No ejecutar Pest mientras Cypress esté activo: `RefreshDatabase` recrea la base de pruebas. El arranque E2E usa puertos exclusivos 8001/5174, rechaza puertos ocupados y configuración Laravel cacheada, migra únicamente la base de pruebas, carga fixtures y cierra sus procesos al terminar. No ejecuta `migrate:fresh` ni migra desarrollo. El archivo temporal `tmp/sprint01-e2e.lock` evita dos arranques E2E simultáneos; no sustituye la obligación de ejecutar Pest y Cypress en secuencia.

`PHP_BINARY` permite indicar otro ejecutable PHP. `E2E_BROWSER` permite elegir otro navegador instalado. El navegador usa movimiento reducido para probar formularios sin depender de la intro de video. Esto no cambia la experiencia normal ni sus pruebas existentes. Las contraseñas sintéticas cambian en cada ejecución y viajan por variables de entorno, nunca como argumentos ni archivos versionados. Las capturas automáticas y videos E2E están desactivados.

## Trazabilidad

| Identificador | Comprobación |
|---|---|
| S01-SEC-ADMIN | Alta por consola, contraseña oculta, auditoría atómica, duplicado, confirmación y rollback ante fallo de auditoría (Pest) |
| TC-001 | Registro desde React, respuesta real 201 y alerta de éxito; datos inválidos no se envían |
| TC-002 | Correo duplicado: respuesta real 422 y validación de campo visible |
| TC-005 | Inicio real de los tres roles, identidad tras recarga, logout; error de credenciales en español |
| TC-006 | Reutilizar cookie tras cerrar sesión devuelve 401 por HTTP |
| TC-009 / TC-010 | Guardado del perfil y alerta; conflicto real 409 frente a una segunda edición, recarga explícita |
| TC-012 | Catálogo MySQL, filtro de subcategorías, exclusión de inactivos (Pest); alerta de red sin catálogo inventado (Cypress) |
| TC-137 | No persistir contraseña/token en storage; cookie de sesión inaccesible a JavaScript |
| S01-SEC-CSRF | HTTP sin CSRF devuelve 419; no se deshabilita el middleware |

Los archivos documentales de plantilla no se alteraron. Las nuevas pruebas ejecutables usan `cy.env()` porque Cypress 16 eliminó `Cypress.env()`: [documentación de Cypress](https://docs.cypress.io/api/commands/env).

## Uso de las pantallas

`/#cuenta` y `/#plataforma` usan `/api/v1` y sesiones Sanctum. `/#catalogo` consume el catálogo público de esa API. `/#demo` conserva la demostración histórica. No se declara implementado el resto de los portales de sprints posteriores.

La cookie CSRF se solicita antes de cada escritura. Laravel decide identidad, permisos y versión; los controles React complementan la validación del servidor. Una respuesta 409 no sobrescribe los datos: el usuario puede recargar el perfil.

Para desarrollo, configurar la conexión de la API a su propia base, respaldarla antes de migrarla, ejecutar las semillas de autorización/catálogo y arrancar Laravel y Vite. Vite redirige `/api` y `/sanctum` al backend configurado por `API_URL` (predeterminado 127.0.0.1:3000). Si se usa `VITE_API_URL`, frontend y API deben usar el mismo nombre de host y estar declarados en CORS y Sanctum. No mezclar localhost y 127.0.0.1.

## Administrador por consola

Desde `backend/api`, con conexión y semillas verificadas:

```powershell
C:/xampp/php/php.exe artisan tecnicoya:provision-admin --email=administrador@tu-dominio.pe --name="Administrador"
```

Ingresar y confirmar la contraseña en los prompts ocultos. El comando no admite contraseña como argumento, no sobrescribe cuentas, no expone una ruta HTTP y revierte el alta si falla la auditoría. No existe una contraseña administrativa predeterminada.
