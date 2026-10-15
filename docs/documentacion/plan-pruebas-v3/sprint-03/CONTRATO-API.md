# Contrato de API · Sprint 3

**Versión:** 1.0 · **Fecha:** 2026-10-15 · **Autor:** Claude Code (S3.1) · **Revisor:** [PENDIENTE]
**Implementación:** las rutas [cambia] y [nuevo] ya responden en la rama desde `20dcc34` (S3.3), sin cambios en el contrato. Llegarán a `main` con el PR de S3.3.
**Base:** `backend/api` en la rama `feature/mayhuasca/a-solicitudes/s03`.
**Catálogo de casos:** [CATALOGO-S03.csv](CATALOGO-S03.csv), con 81 casos (51 Pest, 17 Cypress y 13 Vitest).
**Decisiones aplicadas:** D-11, D-12, D-13, D-15, D-18, D-23, D-24, D-25, D-32, D-46, D-47, D-52 y **D-55 a D-58** (2026-10-15).

> **Estado de las rutas:**
> - **[existe]**: ya responde en `main`.
> - **[cambia]**: existe, pero en S3.3 se agregan reglas.
> - **[nuevo]**: se implementa en S3.3.
>
> Con este contrato Codex construye pantallas y Vitest (S3.4). Cypress queda para cuando se integre el PR de S3.3 (S3.5).

## 1. Reglas comunes

Siguen vigentes las del [contrato del Sprint 1](../sprint-01/CONTRATO-API.md) §1 y del [Sprint 2](../sprint-02/CONTRATO-API.md) §1:
- prefijo `/api/v1`;
- sesión SPA de Sanctum con CSRF (`X-XSRF-TOKEN`);
- respuesta correcta: `{ "data": …, "meta": { "request_id", "server_time" } }`;
- error: `message`, `errors`, `error.code`, `error.message`, `error.fields` y `meta`;
- **un fallo de red no es ni éxito ni fracaso: se vuelve a leer el estado**.

**Códigos nuevos o con más usos en S3:**

| Estado | `error.code` | Cuándo |
|---|---|---|
| 409 | `STALE_VERSION` | `expected_version` obsoleta. También cuando la solicitud ya no está `registered` (corregir, adjuntar, retirar o enviar una `sent`) y cuando se reutiliza una `Idempotency-Key` con otro cuerpo. Mensaje: «La información cambió. Actualiza y vuelve a intentarlo.» |
| 409 | `ACTIVE_REQUEST_LIMIT` | **[nuevo]** Envío que superaría el máximo de solicitudes activas (D-11; N = 3 en la versión de reglas vigente, D-58). Mensaje: «Alcanzaste el máximo de 3 solicitudes activas. Podrás enviar otra cuando alguna se cierre.» El número sale de la versión de reglas. |
| 422 | `VALIDATION_FAILED` | Campo inválido, con `error.fields.<campo>` en español. En S3 **también al enviar**, si la subcategoría, el distrito, el técnico objetivo o el inicio programado dejaron de ser válidos (§4.6). |
| 404 | `NOT_FOUND` | Solicitud, adjunto o archivo **ajeno o inexistente**: nunca se revela que existe. |

**Estados de la solicitud (D-13).** No existe `draft`.

| `status` | Texto en pantalla | Editable | Cuenta para el límite de D-11 |
|---|---|---|---|
| `registered` | Registrada | Sí: corregir, adjuntar y retirar fotos | No |
| `sent` | Enviada | **No**: no se corrige, no se retiran fotos ni se elimina | Sí |

Los estados posteriores (ofertas, asignación, etc.) llegan en S4. En S3 la pantalla no muestra asignaciones ni ofertas ficticias (CANVAS §2).

## 2. Tabla de decisión rol × ruta

Actores:
- **A:** anónimo;
- **C:** cliente;
- **C2:** otro cliente;
- **T:** técnico;
- **Adm:** administrador;
- **S:** cuenta suspendida (`users.is_active=false`, D-32).

| Ruta | A | C (titular) | C2 | T | Adm | S |
|---|---|---|---|---|---|---|
| `POST /media` con `purpose=evidence` | 401 | 201 / 422 | — | 403 | 403 | 403 |
| `GET /media/{id}` de una evidencia | 404 | 200 | 404 | 404 | 404 (aunque tenga `technicians.verify`) | 404 |
| `POST /requests`, `GET /requests` | 401 | 201 / 200 | 201 / 200 (las suyas) | 403 | 403 | 403 |
| `GET /requests/{id}` | 401 | 200 | 404 | 404 | 404 | 403 |
| `PATCH /requests/{id}`, `POST/DELETE …/attachments`, `POST …/submission` | 401 | 2xx / 409 / 422 | 404 | 403 | 403 | 403 |
| `GET /technicians`, `GET /technicians/{id}` | 401 | 200 | 200 | 200 | 200 | 403 |

## 3. Datos de apoyo [existe]

El asistente usa, sin cambios:

| Endpoint | Paso | Origen |
|---|---|---|
| `GET /catalog/specialties` | Paso 1 | S1 |
| `GET /catalog/subcategories?specialty_id=` | Paso 2 | S1 |
| `GET /catalog/districts` | Paso 4 | S2 §3.2 |

Solo devuelven elementos activos.

## 4. Solicitudes (módulo ARequests)

### 4.1 Los cinco pasos y qué ruta usa cada uno (RT-05)

| Paso | Campos | Validación en el cliente y el servidor |
|---|---|---|
| 1. Especialidad | `specialty_id` (solo en la SPA; filtra el paso 2) | Obligatoria |
| 2. Subcategoría | `subcategory_id` | Obligatoria, activa y de rubro activo |
| 3. Descripción y fotos | `description`; fotos con `POST /media` y luego `…/attachments` | Descripción de **20 a 1000** caracteres sin contar los espacios de los extremos (D-12). Fotos JPG, PNG o WebP de **hasta 5 MB**, **máximo 5** por solicitud (D-12) |
| 4. Ubicación y horario | `district_id`, `address`, `mode` (`asap` o `scheduled`), `preferred_start_at` y `preferred_end_at` | Distrito activo (D-15); dirección de **5 a 255** caracteres (D-56); en `scheduled`, inicio y fin obligatorios, con **inicio ≥ hora del servidor** (D-55) y fin posterior al inicio |
| 5. Resumen y envío | `summary_confirmed=true` y `Idempotency-Key` | Ver §4.6 |

**Cuándo se registra:** el registro (`POST /requests`) necesita los datos de los pasos 2 y 4 y la descripción. Las fotos se adjuntan a una solicitud ya registrada.

**Flujo recomendado para la SPA:**
1. Pasos 1 a 4 en el estado local.
2. Al salir del paso 4 (o al llegar al resumen), `POST /requests`.
3. Fotos (paso 3 revisitado o resumen) con `POST /media` + `POST …/attachments`.
4. Correcciones con `PATCH`.
5. Envío.

Si el usuario vuelve atrás después de registrar, la SPA corrige con `PATCH` (solo `description`, `address` y `district_id`). **Cambiar la subcategoría, el origen o la modalidad exige registrar otra solicitud.**

### 4.2 `POST /media` con `purpose=evidence` [nuevo]

Solo clientes. `multipart/form-data` con `purpose=evidence` y `file`. El tipo real se comprueba por contenido (`finfo`), la imagen se limpia de EXIF (D-47) y se guarda **privada** (`visibility=private`, disco `local`).

```http
POST /api/v1/media
Content-Type: multipart/form-data; boundary=…

purpose=evidence
file=<foto.jpg>
```

```json
{ "data": { "id": 57, "purpose": "evidence", "visibility": "private", "mime_type": "image/jpeg",
  "byte_size": 183442, "url": "http://127.0.0.1:8001/api/v1/media/57" }, "meta": { … } }
```

**Errores:**
- 422 en `file`:
  - «El archivo debe ser una imagen JPG, PNG o WebP.»;
  - «El archivo no debe superar 5 MB.»;
  - «La imagen está dañada o no es válida.»
- 403 si el rol no es cliente.

Subir una foto no la vincula: hace falta §4.5.

### 4.3 `POST /requests` [cambia]

```json
{ "subcategory_id": 4, "description": "La computadora no enciende desde ayer por la tarde.", "district_id": 1,
  "address": "Calle sintética 456, referencia de prueba", "mode": "scheduled",
  "preferred_start_at": "2026-10-16T14:00:00Z", "preferred_end_at": "2026-10-16T16:00:00Z",
  "source": "profile", "target_technician_id": 12 }
```

**Respuesta 201:** el detalle de §4.8.

**Reglas:**
- `source=automatic` ignora `target_technician_id`, que queda `null`.
- `source=profile` exige un técnico **activo** que **ofrezca activamente** la subcategoría.
- `client_id`, `status` y `reference_fee` están prohibidos (422).

**Errores 422** (campo y mensaje):

| Campo | Mensaje |
|---|---|
| `description` | Debe tener al menos 20 caracteres / no debe superar 1000 caracteres |
| `address` | De 5 a 255 caracteres |
| `district_id` | «El distrito está fuera de cobertura.» |
| `subcategory_id` | «La subcategoría elegida no está disponible. Elige otra del catálogo.» |
| `target_technician_id` | «El técnico elegido no ofrece esa subcategoría o no está habilitado.» |
| `preferred_start_at` | Obligatorio en programada / debe ser igual o posterior a la hora actual |
| `preferred_end_at` | Obligatorio / posterior al inicio |

### 4.4 `PATCH /requests/{id}` [cambia]

Corrección del resumen antes del envío. Solo `description`, `address` y `district_id`, con las mismas reglas de §4.3.

```json
{ "description": "La computadora no enciende y huele a quemado.", "expected_version": 2 }
```

**Respuesta 200:** el detalle con `version` + 1.

**Errores:**
- 409 si la versión es vieja o la solicitud ya está `sent`;
- 422 por campo;
- 422 por campos prohibidos (`subcategory_id`, `source`, `mode`, fechas, `status`…).

### 4.5 `POST /requests/{id}/attachments` y `DELETE /requests/{id}/attachments/{media}` [cambia]

```json
{ "media_id": 57, "caption": "Vista del puerto dañado", "expected_version": 2 }
```

**Respuesta 201:**

```json
{ "data": { "request_id": 31, "media_id": 57, "version": 3 }, "meta": { … } }
```

**Reglas:**
- `media_id` debe ser una evidencia **propia**, privada, revisada, no retirada y que no esté en otra solicitud.
- `caption` es opcional, de hasta 180 caracteres.
- **Máximo 5 adjuntos por solicitud** (D-12). La sexta da 422 en `media_id`: «La solicitud ya tiene el máximo de 5 fotos.»

**Retirar:** `DELETE …/attachments/57` con `{ "expected_version": 3 }` responde **204**.
- 409 si la versión es vieja o la solicitud está `sent` (la foto sigue vinculada);
- 404 si no es tuya o no está adjunta.

**Confirmación previa obligatoria en la SPA (CRUD-03):** cancelar no envía el `DELETE`.

### 4.6 `POST /requests/{id}/submission` [cambia]

**Cabecera obligatoria:** `Idempotency-Key`, de 1 a 255 caracteres. La SPA genera **una clave por intento de envío** y **la reutiliza en los reintentos** de ese intento.

```http
POST /api/v1/requests/31/submission
Idempotency-Key: 6f1c2b8e-4c1a-4f5e-9d0e-0c7a1b2c3d4e
```

```json
{ "expected_version": 3, "summary_confirmed": true }
```

**Respuesta 202:**

```json
{ "data": { "id": 31, "status": "sent", "version": 4, "submitted_at": "2026-10-15T15:02:11.000000Z" }, "meta": { … } }
```

**Qué revalida el servidor al enviar**, aunque fuera válido al registrar (SEC-S03-03):
1. Subcategoría activa y de rubro activo: si no, 422 en `subcategory_id`.
2. Distrito activo: si no, 422 en `district_id` («fuera de cobertura»).
3. En `source=profile`, técnico activo que aún ofrece la subcategoría: si no, 422 en `target_technician_id`. **Nunca se sustituye por otro técnico.**
4. En `scheduled`, que el inicio no haya pasado (D-55): si pasó, 422 en `preferred_start_at`.
5. Límite de activas (D-11, D-58): si el cliente ya tiene N solicitudes `sent`, 409 `ACTIVE_REQUEST_LIMIT`.

**Al enviar:**
- la solicitud pasa a `sent`, guarda `submitted_at` y `rule_version_id` (la versión de reglas vigente, D-24) y registra un solo evento `request.submitted`;
- en S3 **no** se crean ofertas: el matching se conecta en S4.

**Idempotencia:**

| Situación | Respuesta |
|---|---|
| Misma clave y mismo cuerpo | La **misma respuesta guardada** (202), sin otro evento. También si ya llegó al límite |
| Misma clave con otro cuerpo | 409 |
| Otra clave sobre una solicitud ya enviada (doble clic real) | 409 |
| Sin clave o con más de 255 caracteres | 422 en `idempotency_key` |

- La clave va **ligada al usuario y a la solicitud**.
- Un envío que falla (422 o 409) **no consume la clave**: se puede reintentar con ella tras corregir.

**Resultado incierto** (corte de red o timeout, TC-125):
1. La SPA no muestra éxito ni error definitivo.
2. Lee `GET /requests/{id}`: si está `sent`, el envío se hizo.
3. Si sigue `registered`, ofrece reintentar **con la misma clave**.

### 4.7 `GET /requests` [existe]

Solo las solicitudes del cliente de la sesión, de la más nueva a la más antigua. **Sin descripción ni dirección.**

```json
{ "data": [ { "id": 31, "status": "sent", "mode": "asap", "source": "automatic",
  "created_at": "2026-10-15 15:00:02.000000", "submitted_at": "2026-10-15 15:02:11.000000", "version": 4 } ], "meta": { … } }
```

### 4.8 `GET /requests/{id}` [existe]

Solo el titular (C2, T y Adm reciben 404).

```json
{ "data": { "id": 31, "status": "registered", "version": 3,
  "subcategory": { "id": 4, "name": "Mantenimiento de laptops" }, "district": { "id": 1, "name": "Huancayo" },
  "description": "La computadora no enciende y huele a quemado.", "address": "Calle sintética 456, referencia de prueba",
  "mode": "asap", "preferred_start_at": null, "preferred_end_at": null,
  "source": "profile", "target_technician_id": 12,
  "reference_fee": { "amount": "80.00", "currency": "PEN", "source": "subcategory", "is_reference": true, "is_payment": false },
  "attachments": [ { "media_id": 57, "position": 1, "caption": "Vista del puerto dañado", "url": "http://127.0.0.1:8001/api/v1/media/57" } ],
  "submitted_at": null }, "meta": { … } }
```

`reference_fee`:
- es una **referencia orientativa** (D-52), fotografiada al registrar; no cambia si el catálogo cambia;
- la SPA la muestra como «Referencial S/ 80,00», **nunca como total ni cobro**;
- con `amount=null`, muestra «Sin tarifa referencial».

La SPA muestra las fotos con `url`; son privadas y solo el titular las descarga.

## 5. Técnicos (consulta pública con sesión)

### 5.1 `GET /technicians` [nuevo]

Búsqueda de técnicos. **No es el matching**: no hay ranking, puntaje ni ofertas (RT-02).

**Parámetros de consulta** (todos opcionales):

| Parámetro | Regla | Error |
|---|---|---|
| `specialty_id` | Entero; especialidad activa | 422 |
| `subcategory_id` | Entero; subcategoría activa. Si viene con `specialty_id`, debe pertenecer a ella | 422 |
| `district_id` | Entero; distrito activo (D-15) | 422 |
| `min_rating` | Número de 1 a 5 | 422 si 0, 6 o no numérico |
| `page` | Entero ≥ 1; por defecto 1 | 422 |
| `per_page` | Entero de 1 a 50; por defecto 12 | 422 si 0 o 51 |
| Cualquier otro | — | 422 «Filtro no permitido.» |

**Quién aparece:** técnico con
- `status=active` y `verification_status=approved`;
- cuenta activa;
- **sin pausa vigente** (D-57);
- al menos un servicio activo en una subcategoría y un rubro activos que coincidan con los filtros;
- con `district_id`, cobertura activa en ese distrito.

**Calificación (D-18):** promedio de las calificaciones vigentes. Hasta S6 no hay calificaciones, así que `rating.average` es `null` y `rating.count` es `0`. Con `min_rating`, **un técnico sin calificaciones no aparece**: la respuesta es 200 con la lista vacía.

**Orden:** por `display_name` y luego por `id`, ascendentes. Es estable y **no** es un ranking.

```http
GET /api/v1/technicians?specialty_id=1&subcategory_id=4&district_id=1&page=1&per_page=12
```

```json
{ "data": { "items": [ { "id": 12, "display_name": "Técnico Sintético Uno", "provider_type": "independent",
    "experience_years": 6,
    "services": [ { "subcategory_id": 4, "subcategory_name": "Mantenimiento de laptops", "reference_fee": "80.00", "currency": "PEN" } ],
    "districts": [ { "id": 1, "name": "Huancayo" } ],
    "rating": { "average": null, "count": 0 } } ],
  "pagination": { "page": 1, "per_page": 12, "total": 1, "last_page": 1 } }, "meta": { … } }
```

**Nunca incluye:** correo, `whatsapp`, teléfono, `user_id`, documentos, dirección ni estado de verificación (SEC-S03-02).

**Sin coincidencias:** `items: []` y `total: 0`. La SPA muestra un estado vacío en español.

### 5.2 `GET /technicians/{id}` [existe]

Perfil público (S2 §3.5): bio, servicios con tarifa referencial, portafolio público y `reviews: []` (las reseñas se conectan en S6, con estado vacío honesto). Responde 404 si el técnico no está activo.

**Un técnico en pausa sigue accesible por enlace (D-57)**, aunque no salga en la búsqueda.

Botón **«Solicitar servicio»** (HU-S03-05):
1. Abre el asistente con `source=profile` y `target_technician_id={id}`.
2. Solo ofrece las subcategorías de `services`.
3. Si al enviar responde 422 en `target_technician_id`, la SPA lo informa y **no cambia de técnico por su cuenta**.

## 6. Reglas versionadas (D-58) [nuevo]

Las tablas mínimas `rule_parameters`, `rule_versions` y `rule_values` (§8.1 a §8.3 de las reglas formalizadas) llevan la **versión 1** sembrada con `max_active_requests_per_client = 3`. No hay endpoint ni pantalla hasta S7. La SPA solo ve:
- el efecto del límite (409 `ACTIVE_REQUEST_LIMIT`);
- `rule_version_id` en la base, que no se expone en el detalle de S3.

## 7. Datos E2E (S3.3, para el S3.5 de Codex)

`Sprint03E2ESeeder`, con contraseñas entregadas por el arrancador como en S1 y S2. Prepara:
- **Clientes:**
  - un cliente sin solicitudes;
  - un cliente con **3 solicitudes `sent`** (para S03-TC-068);
  - un cliente con una `registered` y una `sent` (S03-TC-067).
- **Técnicos:**
  - dos técnicos habilitados de rubros distintos, con servicios, distritos y portafolio público; uno de ellos con WhatsApp y documentos (S03-TC-065);
  - un técnico **en pausa** (no debe salir en la búsqueda).
- **Catálogo:** al menos dos subcategorías por rubro, todas con `reference_fee`.

## 8. Cambios respecto a lo que ya existía

| Qué | Antes | S3.3 |
|---|---|---|
| `POST /media` | Sin `evidence` | `purpose=evidence` para clientes, privada |
| Descripción | Sin límites | 20 a 1000 (D-12) |
| Dirección | Sin límites (`text`) | 5 a 255 (D-56) |
| Inicio programado | Cualquier fecha | ≥ hora del servidor (D-55) |
| Adjuntos | Sin máximo | Máximo 5 (D-12) |
| Envío | Sin revalidar | Revalida subcategoría, distrito, técnico, inicio y límite de activas; guarda `rule_version_id` |
| `GET /technicians` | No existía | Búsqueda con filtros y paginación |
