# Contrato de API · adelanto del Sprint 7

| Campo | Valor |
|---|---|
| Versión | 1.0 (2026-10-26) |
| Autor | Claude Code |
| Revisor | [PENDIENTE] |
| Base | `main` `01b93ee` (rama `feature/mayhuasca/auth/registro-detallado`) |
| Decisiones | D-73 (adelanto del S7 con IDs S07-TC), D-75 (nombres y apellidos) y D-80 (campos del registro y recuperación de contraseña) |
| Catálogo de casos | [CATALOGO-S07.csv](CATALOGO-S07.csv): S07-TC-001 a 016 en Pest y S07-TC-017 a 030 en Vitest |

Todas las rutas van bajo `/api/v1`, usan la sesión SPA de Sanctum y siguen las mismas convenciones que el contrato v1 (S1 a S4):
- el sobre `data` en las respuestas correctas;
- `error`, `errors` y `message` en español en los errores.

## 1. `POST /auth/register` **[cambia]**

Este endpoint es la ampliación del registro del S1 (D-80). Su respuesta 201 no cambia y sigue sin aceptarse una sesión activa (D-43). Las cuentas `admin` siguen prohibidas por esta vía (TC-008).

| Campo | Cliente | Técnico | Regla |
|---|---|---|---|
| `given_names`, `family_names` | obligatorio | obligatorio | De 2 a 50 caracteres cada uno. Componen `name` (D-75). |
| `name` | alternativa | alternativa | Se sigue aceptando si no se envían nombres y apellidos (lo usan las pruebas del S1). No se puede enviar junto con ellos. |
| `email` | obligatorio | obligatorio | Igual que en el S1. Se normaliza a minúsculas y es único sin distinguir mayúsculas. |
| `phone` | obligatorio | obligatorio | `^9\d{8}$`: celular peruano de 9 dígitos que empieza en 9. |
| `password`, `password_confirmation` | obligatorio | obligatorio | Igual que en el S1: al menos 8 caracteres, como máximo 72 bytes, y confirmación. |
| `account_type` | `client` | `technician` | — |
| `terms_accepted` | obligatorio | obligatorio | `accepted`. Se guarda `users.terms_accepted_at`. |
| `client_type` | obligatorio | prohibido | `household` o `mype`. |
| `district_id` | obligatorio | prohibido | Distrito **activo**. Se guarda en `client_profiles.district_id`. |
| `business_name` | opcional, solo MYPE | prohibido | Hasta 180 caracteres. |
| `reference_address` | opcional | prohibido | Hasta 255 caracteres. Es **privada**: se guarda en `client_profiles.default_address` y no se devuelve. |
| `base_district_id` | prohibido | obligatorio | Distrito activo (D-64). |
| `district_ids` | prohibido | obligatorio | Lista de distritos activos y distintos. El distrito base **siempre** se agrega (`technician_districts`). |
| `specialty_ids` | prohibido | obligatorio | De 1 a 10 especialidades activas y distintas (`technician_specialties`). **No** crea servicios ni tarifas; eso sigue en el panel del técnico. |
| `experience_years` | prohibido | obligatorio | Entero de 0 a 50. |
| `whatsapp` | prohibido | opcional | Mismo formato que `phone`. |

**Ejemplo de técnico:**

```json
{ "account_type": "technician", "given_names": "Ana Lucía", "family_names": "Quispe Rojas", "email": "ana@example.test",
  "phone": "987654321", "password": "…", "password_confirmation": "…", "terms_accepted": true,
  "base_district_id": 2, "district_ids": [2, 1], "specialty_ids": [10], "experience_years": 4 }
```

Los errores devuelven 422 con el campo afectado, por ejemplo `district_id`, `district_ids.0`, `specialty_ids.0`, `phone`, `terms_accepted` o `business_name`. El mensaje del teléfono es «El teléfono debe tener 9 dígitos y empezar en 9.».

## 2. `GET /me` **[cambia]**

La respuesta agrega `given_names` y `family_names` (pueden ser `null` en cuentas anteriores).

Para el cliente agrega `client_profile: {client_type, district_id}`. El distrito principal precarga la nueva solicitud del asistente S3. La dirección de referencia **no** se expone.

## 3. `POST /auth/password/forgot` **[nuevo]**

| | |
|---|---|
| Cuerpo | `{ "email": "…" }` |
| Respuesta | **202** `{ "data": { "message": "Si el correo existe, te enviamos un enlace para restablecer tu contraseña." } }`, **siempre la misma**, exista o no la cuenta |
| Envío | Solo para cuentas activas y no anonimizadas, con el broker de Laravel: un pedido por minuto por cuenta y el resto también responde 202. El token es aleatorio, de un solo uso y se guarda con hash en `password_reset_tokens`. Vence a los **60 min**. |
| Enlace | `{SPA_URL}/#cuenta/restablecer?token=…&email=…`. Correo en español. En desarrollo, `MAIL_MAILER=log` deja el enlace en `storage/logs`. |
| Límites | `throttle:password-forgot`: **10 por IP por minuto** (`PASSWORD_RESET_PER_IP_PER_MINUTE`) y **3 por correo cada 15 min** (`PASSWORD_RESET_PER_EMAIL`). Al superarlos responde 429 «Hay demasiados intentos. Espera antes de volver a intentarlo.» |
| Auditoría | `auth.password_reset_requested` solo para administradores (D-44), sin token. |

## 4. `POST /auth/password/reset` **[nuevo]**

| | |
|---|---|
| Cuerpo | `{ "email", "token", "password", "password_confirmation" }`, con las reglas de contraseña del registro |
| Respuesta | **200** `{ "data": { "message": "Tu contraseña se actualizó. Inicia sesión con la nueva contraseña." } }` |
| Efectos | Cambia la contraseña, renueva `remember_token`, incrementa `auth_version` y **borra todas las sesiones** de la cuenta, como la suspensión de D-32. El token se consume. |
| Errores | 422 en `token` con «El enlace no es válido o venció. Pide uno nuevo.» si el token está vencido, usado, es ajeno o es inventado. 422 en `password` si no cumple las reglas, y en ese caso el token **no** se consume. |
| Límites | `throttle:spa-auth` (igual que el inicio de sesión). |
| Auditoría | `auth.password_reset` solo para administradores (D-44), sin token ni contraseña. |

## 5. Datos

Migración `2026_10_26_000024_add_registration_details`:
- `users`: `given_names`, `family_names` y `terms_accepted_at`;
- `client_profiles`: `district_id`, FK a `districts`;
- tabla `technician_specialties` (`technician_id`, `specialty_id`, `created_at`);
- tabla `password_reset_tokens`, si no existe.

`Sprint01E2ESeeder` llama ahora también a `DistrictSeeder`, porque el registro de las Cypress del S1 necesita distritos activos.
