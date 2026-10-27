# Guía del código · Delgado Janampa, Jesus Oscar · Frontend

**Área:** Frontend de TécnicoYa Huancayo (React 18 + Vite 8, en `frontend/web`), con sus pruebas Vitest y Cypress.

Esta guía explica, con el código real del repositorio, qué se construyó, dónde está cada pieza y cómo mostrarla.

---

## 1. Qué construyó el área, sprint por sprint

| Sprint | Qué se construyó en el frontend |
|---|---|
| **S0** | Base segura del frontend: servidor web sin privilegios de administrador, cobertura de Vitest y Cypress apuntando a su propio slot de pruebas. |
| **S1 · Cuentas** | Inicio de sesión y registro con la cookie de sesión de Laravel (Sanctum), validación en el navegador, mensajes de error en español y portales por rol: cliente, técnico y administrador. |
| **S2 · Catálogo y paneles** | Landing pública, catálogo de especialidades, panel del técnico (servicios, tarifas, disponibilidad y portafolio) y paneles del administrador (catálogo, verificación de técnicos y comunicados). |
| **S3 · Solicitudes** | Asistente de solicitud en pasos: rubro, distrito, descripción, fotos, fecha y resumen. También «Mis solicitudes» y la búsqueda de técnicos con su perfil público. |
| **S4 · Matching y tiempo real** | Bandeja de ofertas del técnico con cronómetro, pantalla del cliente para elegir entre los técnicos que aceptaron, y tiempo real con Echo y Reverb: deduplicación de eventos y recuperación al reconectar. |
| **Después del S4 · Landing** | Rediseño de la landing con la página «Nosotros», abanico 3D de subespecialidades, pulido visual y nueva pantalla de inicio de sesión. |
| **Adelanto del S7** | Pantallas del registro en dos pasos y de la recuperación de contraseña. Base común de los paneles con menú lateral, tema claro u oscuro y perfil. Panel del administrador: Inicio, Estadísticas, Usuarios, Solicitudes y Comunicados en carrusel. Por la decisión D-72, esta parte la hizo Claude Code en ramas de integración. |

## 2. Pull requests del área

`gh pr list --state merged --search "head:feature/delgado"` y el PR #1 del Sprint 0 (rama `codex/s00-frontend`):

| PR | Título | Qué cambió |
|---|---|---|
| [#1](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/1) | fix(s00): seguridad y cobertura frontend; web sin root y E2E slot B | El contenedor web corre sin root. Se agregaron cobertura en Vitest y Cypress en el slot B. |
| [#7](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/7) | feat(s01): cuentas v1, validación y pruebas frontend | Login, registro, perfil y portales por rol, con `http.js`, validación y sus pruebas Vitest y Cypress del S1. |
| [#10](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/10) | feat(s02): landing y paneles administrativos y técnicos v1 | Landing, catálogo, panel del técnico y paneles de catálogo, verificación y comunicados. |
| [#12](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/12) | fix(s03): accesibilidad y mantenibilidad del frontend v1 | Correcciones de los hallazgos de SonarQube: HTML semántico, ayudas extraídas y nombres accesibles. |
| [#15](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/15) | feat(s03): solicitudes y búsqueda de técnicos en frontend v1 | Asistente de solicitud, fotos de evidencia, «Mis solicitudes» y búsqueda de técnicos. |
| [#18](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/18) | refactor(s04): retira prototipo frontend y prepara Echo | Retiro de la demo antigua `#demo` con `localStorage` y preparación de Laravel Echo. |
| [#20](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/20) | feat(s04): frontend de ofertas selección y tiempo real | Bandeja de ofertas, cronómetro, elección del cliente, Echo con Reverb y deduplicación. |
| [#22](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/22) | fix(s02): especialidades visibles y landing responsive | Se arregló la vitrina de especialidades y la landing en móvil. |
| [#23](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/23) | fix(s02): corrige DEF-47 al editar subcategorias | El editor de rubros ya no envía `specialty_id`, que es inmutable. |
| [#24](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/24) | feat(s02): rediseña landing y añade Nosotros | Nueva landing con diez secciones, la página «Nosotros» y tokens de color. |
| [#25](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/25) | feat(landing): vitrina 3D de subespecialidades | Abanico 3D de cartas con teclado, arrastre y autoplay que se pausa. |
| [#27](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/27) | feat(landing): pulido visual de landing y Nosotros | Ajustes de escala, encuadre y navegación sin `#` en las secciones. |
| [#30](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/30) | feat(auth): encuadre de la pantalla de sesión | Pantalla de inicio de sesión con dos paneles que se deslizan. |

**Frontend del adelanto del S7**, integrado en PR de otras ramas (D-72): el registro en dos pasos ([#31](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/31)), los paneles ([#32](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/32)), los comunicados en carrusel ([#33](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/33)), Usuarios y Estadísticas ([#34](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/34)) y la reconfirmación de contraseña al crear un administrador ([#35](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/35)).

## 3. Archivos clave

| # | Ruta | Para qué sirve |
|---|---|---|
| 1 | `frontend/web/src/App.jsx` | Enrutador principal: decide si se ve la landing o la cuenta. |
| 2 | `frontend/web/src/features/administration/http.js` | Única puerta hacia la API: cookies, CSRF, errores en español y hora del servidor. |
| 3 | `frontend/web/src/features/administration/SessionForm.jsx` | Inicio de sesión y paso al registro. |
| 4 | `frontend/web/src/features/administration/AccountApp.jsx` | Después del login, lee `/me` y arma el panel según el rol y los permisos. |
| 5 | `frontend/web/src/features/requests/useWizardFlow.js` | Lógica del asistente de solicitud: catálogo, pasos, borrador y envío. |
| 6 | `frontend/web/src/features/offers/OffersInbox.jsx` | Bandeja del técnico: aceptar o rechazar con idempotencia y plazo. |
| 7 | `frontend/web/src/features/offers/RequestTracking.jsx` | Seguimiento de la solicitud del cliente, la elección del técnico y la búsqueda alternativa. |
| 8 | `frontend/web/src/features/realtime/connection.js` | Conexión de Echo con Reverb y recuperación al reconectar. |
| 9 | `frontend/web/src/features/realtime/eventDedupe.js` | Evita aplicar dos veces el mismo evento o una versión vieja. |
| 10 | `frontend/web/src/landing/navigation.js` | Desplazamiento a cada sección por debajo de la cabecera fija. |
| 11 | `frontend/web/src/ServiceCarousel.jsx` | Abanico 3D de subespecialidades de la landing. |
| 12 | `frontend/web/src/features/panel/PanelShell.jsx` | Estructura común de los paneles: menú agrupado, tema y perfil. |

### 3.1 `App.jsx`: qué pantalla se muestra (líneas 104 a 122)

```jsx
  const account =
    route.startsWith("#cuenta") ||
    ["#plataforma", "#catalogo"].includes(route);
  if (account)
    return (
      <div className="account-page">
        <header className="header">
          <a className="brand" href="#inicio">
            <span className="monogram">t</span>TécnicoYa
          </a>
          <a className="button glass" href="#inicio">
            Volver al inicio
          </a>
        </header>
        <main id="contenido">
          {route === "#catalogo" ? <Catalog /> : <AccountApp />}
        </main>
      </div>
    );
```

- **104 a 106:** si la ruta empieza con `#cuenta`, o es `#plataforma` o `#catalogo`, estamos en la zona de cuenta y no en la landing.
- **107:** solo en ese caso se dibuja la página de cuenta.
- **109 a 117:** cabecera reducida, con la marca y un botón para volver al inicio.
- **118:** `id="contenido"` es el destino del enlace «Ir al contenido», pensado para quien navega con teclado.
- **119:** `#catalogo` muestra el catálogo público; las demás rutas de cuenta pasan a `AccountApp`, que decide según la sesión.
- **Fuera de este fragmento**, en la línea 124, el resto de rutas (`/` y `/nosotros`) muestran `PublicSite`, que es la landing.

### 3.2 `http.js`: cómo se llama a la API (líneas 49 a 59 y 15 a 28)

```js
export async function request(path, body, method = body ? 'POST' : 'GET', options = {}) {
  const headers = {...options.headers};
  if (!['GET', 'HEAD'].includes(method)) {
    await send('/sanctum/csrf-cookie');
    const cookie = document.cookie.split('; ').find(item => item.startsWith('XSRF-TOKEN='));
    if (!cookie) throw new ApiError('No se pudo preparar la sesión segura. Permite las cookies y vuelve a intentarlo.', 419);
    headers['X-XSRF-TOKEN'] = decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
  }
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
  return send(`/api/v1${path}`, {method, headers, ...(body !== undefined ? {body: multipart ? body : JSON.stringify(body)} : {})});
}
```

- **49:** si se envía un cuerpo, el método por defecto es POST; si no, GET.
- **51 y 52:** toda escritura pide primero la cookie CSRF de Sanctum. Así Laravel sabe que la petición viene de nuestra SPA.
- **53 a 55:** se lee la cookie `XSRF-TOKEN` y se copia en la cabecera `X-XSRF-TOKEN`. Si el navegador bloquea las cookies, se avisa en español (419).
- **57 y 58:** las fotos van como `FormData`; todo lo demás va como JSON.
- **59:** todas las rutas cuelgan de `/api/v1`.

Dentro de `send` hay tres detalles importantes:
- **Línea 19:** `credentials: 'include'` manda la cookie de sesión, y `AbortSignal.timeout(15000)` corta la petición a los 15 s.
- **Línea 23:** sin red, la respuesta es «No pudimos confirmar el resultado…» con estado 0. Las pantallas usan ese estado 0 para consultar el estado real en vez de repetir la operación.
- **Línea 28:** se guarda la diferencia con `meta.server_time`. Así los cronómetros usan la hora del servidor, no la del celular.

### 3.3 `SessionForm.jsx`: iniciar sesión (líneas 48 a 60)

```jsx
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    data.email = data.email.trim().toLowerCase();
    const invalid = validateAccount(data, false);
    setErrors(invalid); setSuccess(''); setError('');
    if (Object.keys(invalid).length) { setError('Revisa los campos indicados.'); form.elements.namedItem(Object.keys(invalid)[0])?.focus(); return; }
    setBusy(true);
    try {
      await request('/auth/login', data);
      form.reset();
```

- **49:** evita que el navegador recargue la página.
- **50:** si ya hay un envío en curso, ignora el doble clic.
- **52 y 53:** toma los campos del formulario y normaliza el correo: sin espacios y en minúsculas.
- **54:** primera validación, en el navegador. El servidor vuelve a validar todo, porque hay doble validación.
- **56:** si hay errores, muestra la alerta y **mueve el foco al primer campo con error** (accesibilidad).
- **57 a 59:** marca el formulario como ocupado y llama a `POST /auth/login` a través de `request`.
- **60:** si todo sale bien, limpia el formulario. La contraseña no queda en pantalla.

### 3.4 `AccountApp.jsx`: el panel según el rol (líneas 41 a 65)

```jsx
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setBlocked(false);
    request('/me').then(result => { if (active) setUser(result.data); }).catch(error => {
      if (!active) return;
      setUser(null); setBlocked(error.status === 403);
      if (error.status !== 401) setError(error.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  useEffect(() => {
    if (loading) return;
    // El servidor decide el rol. Cambiar el hash nunca concede permisos.
    const redirect = () => {
      const hash = window.location.hash;
      if (!user && isTokenRoute(hash)) return;
      if (hash === '#cuenta' || hash === '#plataforma' || hash.startsWith('#cuenta/')) {
        const destination = routes[user?.role?.code] || '#cuenta';
        if (hash !== destination) window.location.replace(destination);
      }
    };
```

- **44:** al abrir la cuenta se pide `GET /me`. Si hay sesión, llega el usuario con su rol y sus permisos.
- **46:** un 403 significa una cuenta bloqueada, que tiene su propia pantalla.
- **47:** un 401 (sin sesión) no es un error, así que se muestra el login sin alerta.
- **42 y 49:** la bandera `active` evita actualizar la pantalla si el usuario ya salió de ella.
- **53:** principio de seguridad: **el rol lo decide el servidor**. Escribir `#cuenta/administrador` a mano no da permisos.
- **56:** los enlaces de recuperación y activación (`#cuenta/restablecer`, `#cuenta/activar`) funcionan sin sesión.
- **58:** redirige a la ruta de su rol: `#cuenta/cliente`, `#cuenta/tecnico` o `#cuenta/administrador`.
- **Más abajo, en las líneas 99 a 107:** el menú del administrador solo muestra las secciones permitidas, con `can('users.manage')` y otras parecidas.

### 3.5 `useWizardFlow.js`: el asistente de solicitud (líneas 10 a 34 y 78 y 79)

```js
  useEffect(() => {
    let active = true;
    Promise.all([
      request("/catalog/specialties"),
      request("/catalog/districts"),
    ])
      .then(async ([a, b]) => {
        let choices = a.data;
        if (target) {
          const groups = await Promise.all(
            a.data.map((x) =>
              request("/catalog/subcategories?specialty_id=" + x.id),
            ),
          );
          choices = a.data.filter((x, i) =>
            groups[i].data.some((s) =>
              target.services.some((t) => +t.subcategory_id === +s.id),
            ),
          );
        }
        if (active) {
          setSpecialties(choices);
          setDistricts(b.data);
        }
      })
```

- **12 a 15:** carga a la vez las especialidades y los distritos del catálogo público.
- **18:** `target` existe cuando el cliente llega desde el perfil de un técnico, es decir, una solicitud dirigida.
- **19 a 28:** en ese caso solo deja las especialidades en las que **ese técnico** ofrece algún rubro.
- **30 a 33:** guarda las opciones. `active` evita escribir si la pantalla ya se cerró.
- **78 y 79** (`creationAttempt.current ??= createRegistrationAttempt()`): crean una sola vez la clave de idempotencia del alta. Si la red falla y el cliente reintenta, el servidor no crea dos solicitudes (S03-TC-031).

### 3.6 `OffersInbox.jsx`: el técnico responde una oferta (líneas 28 a 66)

```jsx
  async function respond(decision) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setMessage("");
    attempt.current ??= {
      key: crypto.randomUUID(),
      body: {
        decision,
        expected_version: offer.version,
        reason: decision === "reject" ? reason : null,
      },
    };
    try {
      await request(
        `/offers/${offer.id}/response`,
        attempt.current.body,
        "POST",
        { headers: { "Idempotency-Key": attempt.current.key } },
      );
```

- **29 y 30:** un candado (`lock`) impide dos respuestas por doble clic.
- **34 a 41:** el intento se arma una sola vez, con una `Idempotency-Key` aleatoria y la `expected_version` de la oferta. Si alguien cambió la oferta, el servidor responde 409 en vez de pisar el cambio.
- **43 a 48:** `POST /offers/{id}/response` envía la decisión con la clave de idempotencia.
- **Líneas 57 a 62:** sin red (estado 0), la pantalla muestra «No pudimos confirmar tu respuesta. Comprobando…» y vuelve a leer la oferta. No supone éxito ni error.
- **Líneas 63 a 65:** con un 409 (versión vieja), se descarta el intento y se recarga.

### 3.7 `connection.js`: tiempo real con reconexión (líneas 40 a 58)

```js
  const connection = echo.connector.pusher.connection;
  let lost = false;
  const state = ({ current }) => {
    onStatus(current === "connected");
    if (
      current === "disconnected" ||
      current === "unavailable" ||
      current === "failed"
    )
      lost = true;
    if (current === "connected" && lost) {
      lost = false;
      onRecover();
    }
  };
  connection.bind("state_change", state);
  onStatus(connection.state === "connected");
  const channel = echo.private(name);
  for (const event of events) channel.listen("." + event, onEvent);
```

- **43:** informa a la pantalla si hay conexión, para mostrar «Conexión en tiempo real activa.» o el aviso de desconexión.
- **44 a 49:** si se cae la conexión, lo recuerda en `lost`.
- **50 a 53:** al volver la conexión, llama a `onRecover()`, que **recarga desde la API**. Los eventos que se perdieron mientras no había conexión no se pierden para el usuario.
- **57:** se suscribe a un canal **privado**, como `requests.15` o `technicians.4`. Laravel autoriza el canal en `/broadcasting/auth`.
- **58:** escucha cada tipo de evento, como `.request.updated`.

### 3.8 `eventDedupe.js`: el mismo evento no se aplica dos veces (archivo completo, 18 líneas)

```js
export function createEventDedupe() {
  const seen = new Set(),
    versions = new Map();
  return (event, currentVersion = 0) => {
    if (!event?.event_id || seen.has(event.event_id)) return false;
    seen.add(event.event_id);
    if (seen.size > 200) seen.delete(seen.values().next().value);
    const key = event.offer_id
      ? `offer:${event.offer_id}`
      : `request:${event.request_id}`;
    if (event.version != null) {
      if (event.version <= Math.max(currentVersion, versions.get(key) || 0))
        return false;
      versions.set(key, event.version);
    }
    return true;
  };
}
```

- **2 y 3:** `seen` guarda los `event_id` ya vistos; `versions` guarda la última versión vista de cada oferta o solicitud.
- **5:** un evento sin `event_id` o repetido se descarta.
- **7:** solo se recuerdan los últimos 200, para no llenar la memoria.
- **8 a 10:** la clave es la oferta o, si no hay oferta, la solicitud.
- **11 a 14:** si el evento trae una versión igual o menor que la que ya se muestra, se ignora, porque sería un dato viejo.
- **16:** solo si pasa todo, la pantalla recarga el recurso.

Lo prueban la Vitest S04-TC-103 y la Cypress S04-TC-094 (evento repetido tras reconectar).

### 3.9 `navigation.js`: dónde parar al desplazarse (líneas 61 a 81)

```js
export function calculateScrollTarget({
  sectionRect,
  headerRect = null,
  subnavRect = null,
  viewportHeight,
  scrollY,
  mode = "top",
}) {
  const fixedBottom = Math.max(
    0,
    headerRect?.bottom || 0,
    subnavRect?.bottom || 0,
  );
  const availableHeight = Math.max(0, viewportHeight - fixedBottom);
  const sectionHeight = Math.max(0, sectionRect.height);
  const desiredTop = mode === "center" && sectionHeight <= availableHeight
    ? fixedBottom + (availableHeight - sectionHeight) / 2
    : fixedBottom;

  return Math.max(0, sectionRect.top + scrollY - desiredTop);
}
```

- **69 a 73:** calcula dónde termina lo fijo, sea la cabecera o el submenú.
- **74:** alto que queda visible debajo de lo fijo.
- **76 a 78:** en modo `center`, si la sección cabe, la centra en ese espacio; si no cabe, la deja pegada bajo la cabecera.
- **80:** convierte esa posición en el desplazamiento de la página, nunca negativo.

Es una función pura y por eso se prueba sin navegador (S02-TC-090).

## 4. Flujo de punta a punta: landing → login → panel

1. **Landing (`/`).** `App.jsx` muestra `PublicSite`.
   - `useCatalog()` pide `/catalog/specialties` y `/catalog/carousel` para la vitrina.
   - Los botones de la cabecera usan `navigation.js` para desplazarse sin dejar `#` en la URL.
2. **Clic en «Ingresar».** Lleva a `#cuenta`. `App.jsx` detecta la ruta y monta `AccountApp`.
3. **¿Hay sesión?** `AccountApp` pide `GET /me` y recibe 401, así que muestra `SessionForm`.
4. **Login.** `SessionForm.submit`:
   1. valida en el navegador;
   2. llama a `request('/auth/login')`, que pide la cookie CSRF y envía el cuerpo con `X-XSRF-TOKEN`;
   3. Laravel abre la sesión en una cookie `HttpOnly`, que JavaScript no puede leer.
5. **Redirección por rol.** `AccountApp` recibe el usuario.
   - El segundo `useEffect` lleva a `#cuenta/cliente`, `#cuenta/tecnico` o `#cuenta/administrador`, según `user.role.code`.
6. **Panel.** `PanelShell` muestra el menú agrupado y la sección elegida. En el caso del administrador:
   - Inicio con accesos rápidos;
   - Estadísticas, Usuarios, Verificación, Solicitudes, Catálogo y Comunicados, solo las que permite su lista `permissions`.
7. **Tiempo real.** En las pantallas de ofertas y solicitudes, `useRealtimeResource` (`Realtime.jsx`):
   - conecta con Reverb mediante `connection.js`;
   - filtra los eventos con `eventDedupe.js`;
   - recarga por la API al reconectar.

## 5. Pruebas del área

| Tipo | Dónde | Ejemplos de ID |
|---|---|---|
| Vitest | `frontend/web/src/**/*.test.js(x)`: 39 archivos y 309 pruebas en el último `main` | `http.test.js` (S01-TC-082 CSRF y errores) · `SessionForm.test.jsx` (S01-TC-083, 429 en español) · `sprint03.test.jsx` (S03-TC-069 a 071, asistente) · `offers/sprint04.test.jsx` (S04-TC-101 cronómetro, 102 desfase, 103 deduplicación) · `landing/navigation.test.jsx` (S02-TC-090 y 091) · `admin/admin.test.jsx` (S07-TC-129 a 143) |
| Cypress | `frontend/web/cypress/e2e/sprint-01` a `sprint-04`, contra Laravel y MySQL reales | `sprint-01/portals.cy.js` (S01-TC-015 registro, S01-TC-019 cookie de una sesión cerrada) · `sprint-04/offers.cy.js` (S04-TC-083 aceptar no asigna, 084 rechazo con confirmación, 085 plazo del servidor) · `sprint-04/realtime.cy.js` (S04-TC-093 a 095) |

**Para correr una o dos en vivo** (PowerShell, desde la raíz del repositorio):

```powershell
cd frontend/web
npx vitest run src/features/administration/http.test.js -t "S01-TC-082"
npx vitest run src/features/offers/sprint04.test.jsx -t "S04-TC-103"
```

Cypress se corre solo uno a la vez, con el arrancador, que levanta la API, la base del slot A y Vite. Necesita la base de pruebas en Docker y unos 1,5 GB de RAM libre:

```powershell
node scripts/run-e2e.mjs --sprint 04 --slot A --spec "cypress/e2e/sprint-04/offers.cy.js"
```

Otros comandos útiles: `npm test` (todas las Vitest), `npm run lint` y `npm run build`.

## 6. Cómo mostrarlo en localhost

Antes de empezar, sigue el README de la raíz, en la sección «Desarrollo local»:
- backend en `http://127.0.0.1:3000`;
- frontend con `npm run dev` en `http://127.0.0.1:5173`;
- datos de demostración con `php artisan db:seed --class=DemoSeeder`, después de definir `TECNICOYA_DEMO_PASSWORD`.

| Página | Qué hacer |
|---|---|
| `http://127.0.0.1:5173/` | Mira la intro de video y la vitrina 3D. Muévela con las flechas del teclado y comprueba que se pausa al pasar el mouse. Usa el menú: baja a cada sección sin dejar `#` en la URL. |
| `http://127.0.0.1:5173/nosotros` | Recorre los bloques y el carrusel de testimonios de ejemplo. |
| `#cuenta` | Prueba primero un error: deja el correo vacío y verás el mensaje en español con el foco en el campo. Luego entra con `demo-cliente@example.test`. |
| `#cuenta/cliente` | Crea una solicitud con el asistente: rubro, distrito, descripción, foto opcional y resumen. Después ábrela en «Mis solicitudes». |
| `#cuenta/tecnico` | Entra con `demo-tecnico-computo@example.test`, mira «Servicios y tarifas» y la bandeja de ofertas. |
| `#cuenta/administrador` | Entra con `demo-admin@example.test`. Recorre el menú agrupado, Estadísticas (7, 30 y 90 días), Usuarios y Comunicados. Cambia el tema claro u oscuro desde el avatar. |
| Celular (o 390 px en las herramientas del navegador) | El menú pasa a un panel deslizable y no hay desplazamiento horizontal. |

## 7. Preguntas probables del docente

1. **¿Por qué no guardan el token en `localStorage`?**
   Usamos la sesión de Laravel Sanctum en una cookie `HttpOnly`, que JavaScript no puede leer, con protección CSRF (`X-XSRF-TOKEN`). Un script inyectado no puede robar la sesión. Lo prueba S01-TC-082.
2. **¿Qué pasa si el usuario cambia la URL a `#cuenta/administrador`?**
   Nada: el rol viene de `GET /me` y `AccountApp` redirige a la ruta de su rol real. Además, cada endpoint del administrador verifica el permiso en el servidor y responde 403.
3. **¿Cómo evitan respuestas duplicadas por doble clic o por mala señal?**
   Hay tres protecciones:
   - un candado en el botón;
   - una `Idempotency-Key` que se reutiliza al reintentar;
   - `expected_version`, que hace responder 409 si algo cambió.

   Con red caída, la pantalla consulta el estado real antes de decir nada.
4. **¿Por qué el cronómetro usa la hora del servidor?**
   Porque la hora del celular puede estar adelantada o atrasada. `http.js` guarda la diferencia con `meta.server_time` (S04-TC-102).
5. **¿Qué hace la deduplicación de eventos?**
   Descarta un `event_id` repetido o una versión igual o anterior a la mostrada (S04-TC-103 y Cypress S04-TC-094).
6. **¿Cómo validan los formularios?**
   Dos veces: en el navegador, para dar una respuesta inmediata, y en Laravel, que es la autoridad. Los mensajes del servidor se muestran por campo, con `aria-invalid` y `aria-describedby`.
7. **¿Qué diferencia hay entre Vitest y Cypress aquí?**
   - Vitest prueba componentes y funciones con la API simulada: es rápido y corre en la CI.
   - Cypress prueba el sistema completo (Laravel, MySQL y Reverb reales) en un navegador. Se corre local, uno a la vez, por la memoria.
8. **¿Qué hicieron de accesibilidad?**
   - Botones con `type` y nombre accesible, foco visible y foco en el primer error.
   - Navegación por teclado (el asistente se completa sin mouse, S03-TC-063).
   - Respeto de «movimiento reducido».
   - Contadores del menú con texto para lectores de pantalla.

## 8. Nota de honestidad

El código de esta área se desarrolló con apoyo de agentes de IA (Codex y Claude Code) a partir de los prompts de `PROMPTS.md`. Desde el 2026-10-26, por la decisión D-72, Claude Code asumió también el frontend.

El integrante:
- revisó los cambios;
- verificó las pruebas y las evidencias de cada PR;
- integró los cambios a `main` mediante pull requests.

Cada avance en `docs/avances/` registra qué propuso la IA, qué se aceptó y qué se corrigió.
