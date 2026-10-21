# Relevo: corrección visual PR #24

Fecha: 2026-10-20. Rama: `feature/delgado/landing/rediseno-landing`.
Base de implementación: `ab7c374` (pruebas en rojo: 6 fallidas, 158 aprobadas).
Revisor: [PENDIENTE].

## Cambios
Hero centrado en cuatro líneas serif, pill y accesos pedidos. Buscador y errores trasladados a Servicios. Cabecera con cinco enlaces en pill, acceso de sesión independiente y menú móvil. Imagen fija obtenida del primer fotograma del video local existente, con overlay y secciones translúcidas. Se desmonta VideoExperience de la entrada de la aplicación. Sin cambios en backend ni fuera de frontend/web.

Se configura ESLint (el proyecto no tenía script lint) para sintaxis y errores estructurales JS/JSX. No sustituye SonarQube ni certifica accesibilidad. Registro de uso de IA: Codex, implementación y revisión automatizada; revisión humana [PENDIENTE].

## Validación
- `npm run test -- --coverage --maxWorkers=2 --reporter=dot`: 164/164, 22 archivos. Líneas global 85,39 %, landing 90,21 %.
- `npm run lint`: aprobado, cero advertencias.
- `npm run build`: aprobado.
- `npm audit`: cero vulnerabilidades.
- Sin Cypress ni Docker. Revisión visual con Edge headless a 1440, 1024, 768 y 375 px: sin desbordamiento horizontal; fondo fixed, cero videos, login visible en móvil. Capturas adjuntas.
- La corrida previa de cobertura con concurrencia predeterminada registró dos timeouts de 5 s (S03-TC-075 y S04-TC-107). Se conserva coverage-timeouts.txt. La corrida final limita trabajadores, sin alterar aserciones ni timeouts y sin retries.
- Se corrigió el aislamiento de la nueva prueba del registro: evita la navegación diferida de jsdom, comprueba href e intención real de registro. No se relajaron aserciones.

## Catálogo
El proxy y cliente HTTP coinciden con origin/main. Proxy /api y /sanctum: API_URL o http://127.0.0.1:3000. Cliente: /api/v1/catalog/*. La consulta directa a http://127.0.0.1:3000/api/v1/catalog/specialties rechazó la conexión en esta sesión. No permite atribuir un fallo al backend. Levantar la API local y volver a comprobar catálogo; no se editaron variables de entorno ni backend. El aviso con reintento permanece en Servicios, no en el hero.

La cabecera no contiene iconos adicionales encima del menú; solo monograma y control hamburguesa.

PR: https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/24
