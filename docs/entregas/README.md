# Entregas por integrante

Cada integrante tiene una rama propia de entrega, creada desde `main` el 2026-10-27. Esas ramas **no se integran a `main`**. Cada una contiene solo la carpeta de su integrante, `docs/entregas/<integrante>/`, con dos archivos:
- **`PROMPTS.md`:** los prompts con los que se trabajó con los agentes de IA, sin cambios;
- **`GUIA-CODIGO.md`:** guía del código del área, escrita a partir del repositorio real. Incluye:
  - lo construido por sprint y sus PR;
  - los archivos clave, con fragmentos explicados línea por línea;
  - el flujo de punta a punta;
  - las pruebas y los comandos para correrlas;
  - cómo mostrarlo en localhost;
  - las preguntas probables del docente;
  - una nota de honestidad sobre el uso de IA.

| Integrante | Área | Rama | Carpeta |
|---|---|---|---|
| Delgado Janampa, Jesus Oscar | Frontend (React + Vite, Vitest, Cypress) | [`frontend-Delgado-Janampa-Jesus-Oscar`](https://github.com/grupopruebas41/TecnicoYA-Huancayo/tree/frontend-Delgado-Janampa-Jesus-Oscar/docs/entregas/delgado-janampa) | `docs/entregas/delgado-janampa/` |
| Mayhuasca Huanca, Karen Jandre | Backend (Laravel 12, API `/api/v1`, Pest) | [`backend-Mayhuasca-Huanca-Karen-Jandre`](https://github.com/grupopruebas41/TecnicoYA-Huancayo/tree/backend-Mayhuasca-Huanca-Karen-Jandre/docs/entregas/mayhuasca-huanca) | `docs/entregas/mayhuasca-huanca/` |
| Pimentel Chumbes, James | Base de datos, Docker, integración, calidad y panel del administrador | [`bd-docker-integracion-Pimentel-Chumbes-James`](https://github.com/grupopruebas41/TecnicoYA-Huancayo/tree/bd-docker-integracion-Pimentel-Chumbes-James/docs/entregas/pimentel-chumbes) | `docs/entregas/pimentel-chumbes/` |

## Cómo levantar la demo

Necesitas:
- PHP 8.2 (XAMPP, `C:\xampp\php\php.exe`) con Composer;
- Node 24;
- MySQL 8.4 con la base `tecnicoya`. El MySQL/MariaDB de XAMPP no se usa.

El detalle está en la sección «Desarrollo local» del [README](../../README.md) de la raíz.

```powershell
# 1. Backend en http://127.0.0.1:3000
cd backend/api
copy .env.example .env                  # completa DB_PASSWORD y las claves de Reverb; .env no se versiona
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed                     # permisos, catálogo y distritos
$env:TECNICOYA_DEMO_PASSWORD = '<elige una de 12 caracteres o más>'
php artisan db:seed --class=DemoSeeder  # cuentas demo-*@example.test, fotos y comunicados de ejemplo
php artisan storage:link
php artisan serve --port=3000

# 2. Frontend en http://127.0.0.1:5173 (otra terminal)
cd frontend/web
copy .env.example .env
npm ci
npm run dev

# 3. Opcional: cola (matching), tiempo real y tareas programadas, cada una en su terminal, desde backend/api
php artisan queue:work
php artisan reverb:start
php artisan schedule:work
```

**Cuentas de demostración:** todas usan la contraseña de `TECNICOYA_DEMO_PASSWORD`.

| Cuenta | Rol |
|---|---|
| `demo-admin@example.test` | Administrador |
| `demo-cliente@example.test` | Cliente hogar |
| `demo-mype@example.test` | Cliente MYPE |
| `demo-tecnico-computo@example.test` | Técnico verificado (Cómputo) |
| `demo-tecnico-refrigeracion@example.test` | Técnico verificado (Refrigeración) |
| `demo-tecnico-electricidad@example.test` | Técnico verificado (Electricidad) |
| `demo-tecnico-pendiente@example.test` | Técnico por verificar |

**Recorrido sugerido:**
1. Landing en `/` y `/nosotros`.
2. Inicio de sesión en `#cuenta`.
3. El cliente crea y envía una solicitud.
4. `php artisan queue:work --stop-when-empty` ejecuta el matching.
5. El técnico acepta la oferta.
6. El cliente elige al técnico.
7. El administrador revisa Estadísticas, Usuarios, Solicitudes y Comunicados.

**Pruebas:**
- Pest, desde `backend/api`, con la base de pruebas: `docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait`.
- Vitest, con `npm test` en `frontend/web`.
- Cypress, con `node scripts/run-e2e.mjs --sprint NN --slot A --junit`, uno a la vez y con al menos 1,5 GB de RAM libre.

Cada guía trae los comandos para correr una o dos pruebas en vivo.
