# Sprint 1 · Implementación mínima del backend

Fecha: 6 de octubre de 2026 (America/Lima). Rama: `codex/sprint-01`. Base de trabajo: `389643c`. Se ejecutaron las diez pruebas existentes solicitadas, sin modificar ningún archivo de `backend/api/tests` ni el catálogo TC-001…TC-140. No se modificó el Módulo A.

## Resultado y salidas por grupo

Comando desde `backend/api`: `php artisan test --no-ansi`. `--no-ansi` solo elimina colores para guardar las salidas. Se ejecutó la suite completa después de cada grupo; no se excluyeron ni desactivaron pruebas.

| Grupo | Commit | Resultado real | Salida completa |
|---|---|---|---|
| Inicial | Base `389643c` más las seis migraciones sin commit | 10 fallidas, 21 aprobadas; 174 aserciones; 40,72 s | Observado al iniciar; los fallos eran seeders inexistentes |
| (a) Migraciones y seeders | `f7cc011` | 9 fallidas, 22 aprobadas; 187 aserciones; 44,48 s | [grupo-a-pest.txt](grupo-a-pest.txt) |
| (b) Sanctum y autenticación | `fb8c87d` | 9 fallidas, 22 aprobadas; 211 aserciones; 42,02 s | [grupo-b-pest.txt](grupo-b-pest.txt) |
| (c) Perfil/versiones | `040cbf1` | 8 fallidas, 23 aprobadas; 243 aserciones; 50,20 s | [grupo-c-pest.txt](grupo-c-pest.txt) |
| (d) Middleware/permisos | `6bf6a56` | 8 fallidas, 23 aprobadas; 247 aserciones; 29,21 s | [grupo-d-pest.txt](grupo-d-pest.txt) |
| (e) Español | Commit que incorpora este informe | **31 aprobadas; 282 aserciones; 35,69 s** | [grupo-e-pest.txt](grupo-e-pest.txt) |

Las diez pruebas del Sprint 1 aprobadas son TC-002, TC-003, TC-004, TC-006, TC-007, TC-008, TC-009, TC-010, TC-011 y TC-137. Las **21 anteriores siguen aprobadas**: 5 de AnnouncementsTest y 16 de MarketplaceTest. No se cambiaron sus expectativas para conseguir este resultado.

## Entorno y protección de datos

- Docker Desktop activo; motor Docker respondió con versión 29.8.0. C: tenía 55,56 GB libres en la comprobación inicial.
- Se ejecutó `docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait`; `tecnicoya-mysql-test` quedó `healthy` y se comprobó otra vez al finalizar las pruebas.
- PHP CLI 8.2.12; MySQL de pruebas definido por Compose como 8.4. Sanctum 4.3.3 se añadió mediante Composer y quedó fijado en el lockfile.
- Pest usa `tecnicoya_testing`, usuario `tecnicoya_test` y la protección ya existente de `Tests\TestCase`. RefreshDatabase solo recreó el esquema de pruebas.
- **No se migró la base de desarrollo ni se ejecutó migrate:fresh sobre ella.** No se realizó un respaldo de desarrollo porque no se intervino esa base. Antes de aplicar estas migraciones allí, es obligatorio obtener y verificar su respaldo, probar la conversión en una copia y revisar los usuarios existentes.
- No hubo push, merge ni despliegue. No se generaron usuarios administradores con contraseñas compartidas.

## Cambios implementados

1. Se conservaron y completaron las seis migraciones pendientes; se añadió `audit_entries` conforme a T67. AuthorizationSeeder carga tres roles, el permiso mínimo `catalog.manage` y su concesión inicial al administrador; mapea únicamente usuarios antiguos con `role_id` nulo desde `users.role`, con auditoría. No asigna tipos de cliente inventados ni sobrescribe perfiles antiguos. CatalogSeeder carga las 3 especialidades y 30 subcategorías (11/9/10), sin precios inventados ni sobrescritura de decisiones administrativas posteriores.
2. API de sesión SPA bajo `/api/v1/auth/register`, `/login` y `/logout`: correo normalizado, registro cliente/técnico, técnico pendiente y no disponible, rol asignado por servidor, contraseña bcrypt, sesión rotada y cierre que la invalida. Se mantienen las rutas históricas para regresión; la nueva API no expide ni acepta tokens personales.
3. GET/PATCH `/api/v1/me`: representación explícita sin secretos; edición de nombre/teléfono desde la identidad autenticada; campos privilegiados prohibidos; bloqueo de fila y comparación de `users.version` en transacción.
4. `account.active` comprueba cuenta y rol vigentes; `permission` consulta concesiones explícitas y niega por defecto. No hay permiso universal por ser administrador. Las denegaciones de permisos se registran sin datos de credenciales. `/me` devuelve los códigos efectivos.
5. `lang/es/api.php`, `auth.php` y `validation.php` cubren los mensajes y reglas de validación usados por el incremento. Idioma y fallback predeterminados en español.

## Contratos y configuración aclarados

- La guía manual §6 pide errores con `message/errors`; el diseño técnico general §6 define `error/meta`. Las respuestas v1 incluyen ambos, con los mismos mensajes/campos y un identificador de correlación. No se modificaron las pruebas para imponer uno solo.
- TC-006 descarta el gestor de sesiones en memoria y reproduce una cookie. `SESSION_DRIVER=array` perdía ese almacén al descartar el gestor; por eso **phpunit.xml usa ahora `database`**. Se actualizó también `.env.testing.example`. No se alteró el caso TC-006. El valor del XML se aplica en el runner; una variable de proceso impuesta externamente podría sobrescribirlo.
- Los límites técnicos de autenticación se centralizan en `config/security.php`: valor inicial 10 intentos/minuto por IP, consistente con la ruta histórica; configurable mediante entorno. No se introdujeron valores de matching, SLA o ventanas de negocio.
- Se conserva el mínimo histórico de contraseña de 8 caracteres. Se limita a 72 bytes por la capacidad de bcrypt para evitar truncamiento. Nombre conserva el rango histórico 2–100; teléfono usa el tamaño 20 del esquema y formato telefónico básico.
- CORS y dominios de Sanctum permiten explícitamente los orígenes locales 127.0.0.1:5173 y localhost:5173, configurables por entorno. CSRF permanece activo en HTTP real; Pest no acredita por sí solo la comprobación de CSRF del navegador.
- El catálogo semilla es base de datos; esta entrega mínima no incorpora publicación de imágenes ni CRUD/lectura pública del catálogo. Tampoco migra la interfaz React a la nueva autenticación ni implementa módulos de otros sprints.

## Comprobaciones adicionales y límites

- `composer validate --strict`: aprobado.
- Laravel Pint, únicamente sobre los PHP del cambio: aprobado.
- Análisis AST de funciones/callbacks de los PHP del cambio: 76 funciones, máximo 40 líneas; ninguna supera 150.
- `git diff --check`: sin errores de espacios. Git solo avisó de conversión LF/CRLF.
- Verificado que no hay diff de los archivos de pruebas ni de la documentación del Módulo A respecto de `389643c`.
- `composer audit`: **3 avisos en 2 paquetes preexistentes**, sin resolver en este incremento mínimo: Laravel (PKSA-d5tc-s1qs-h781, severidad baja) y league/commonmark (PKSA-m2dq-1fhr-29b1, media; PKSA-m4t9-vsgq-8khn, alta). Requieren actualización compatible y regresión antes de declarar la entrega segura para publicación. Fuentes del auditor: [Laravel](https://github.com/advisories/GHSA-jh5r-qr3c-85q8), [CommonMark HTML](https://github.com/advisories/GHSA-97jj-33gv-5xf9), [CommonMark tablas](https://github.com/advisories/GHSA-3q6v-r5mr-hxv8).
- SonarQube/Quality Gate, Cypress y verificación en navegador: **no ejecutados en esta tarea**. No se declara completada toda la Definition of Done del Sprint 1 ni certificación ISO por aprobar estas 31 pruebas.
- Auditoría: existe el esquema y se registran la inicialización de permisos, el mapeo de roles y denegaciones sensibles; el endurecimiento de privilegios MySQL append-only y el aprovisionamiento administrativo completo quedan fuera de las diez pruebas solicitadas.

Fuentes de implementación: reglas del proyecto, guía manual Sprint 1 §6 y §§7–12, diseño técnico §6 y diccionario T67. Sanctum SPA se contrastó con la [documentación oficial de Laravel 12](https://laravel.com/framework/docs/12.x/sanctum#spa-authentication).
