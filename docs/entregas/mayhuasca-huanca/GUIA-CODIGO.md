# Guía del código · Mayhuasca Huanca, Karen Jandre · Backend

**Área:** el backend de TécnicoYa Huancayo:
- Laravel 12, con la API `/api/v1` y la sesión de Sanctum, en `backend/api`;
- la base de datos MySQL 8.4;
- las pruebas Pest.

Esta guía explica, con el código real del repositorio, qué se construyó, dónde está cada pieza y cómo mostrarla.

---

## 1. Qué construyó el área, sprint por sprint

| Sprint | Qué se construyó en el backend |
|---|---|
| **S1 · Cuentas y catálogo** | Roles y permisos en tablas, registro de cliente y técnico, login y logout con sesión Sanctum, perfil propio con control de versión (409) y catálogo semilla. Además, el contrato de la API v1 y el catálogo de casos del S1. |
| **S2 · Catálogo y técnicos** | CRUD del catálogo (especialidades, rubros y distritos), subida segura de imágenes y documentos, verificación de técnicos con documentos, portafolio, disponibilidad semanal, tarifas con historial de versiones y comunicados por audiencia. |
| **S3 · Solicitudes** | Solicitud en borrador, edición y envío, con revalidación al enviar. Evidencias privadas, límite de solicitudes activas, idempotencia del alta y búsqueda de técnicos con su perfil público. |
| **S4 · Matching** | Elegibilidad con nueve filtros, puntaje ponderado, rondas de ofertas con plazo (SLA), respuesta del técnico, elección del cliente, espera de 24 h por disponibilidad, solicitud dirigida, bandeja de notificaciones, outbox y tiempo real con Reverb. |
| **Después del S4** | `image_url` y `reference_fee` en el catálogo público y un `DatabaseSeeder` idempotente (permisos, catálogo y distritos). |
| **Adelanto del S7** | Registro detallado en dos pasos (nombres y apellidos, teléfono, distrito, tipo de cliente, especialidades del técnico) y recuperación de contraseña con un enlace de un solo uso. |

## 2. Pull requests del área

`gh pr list --state merged --search "head:feature/mayhuasca"`:

| PR | Título | Qué cambió |
|---|---|---|
| [#6](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/6) | Sprint 1 · catálogo, contrato de API, Pest S1 y decisiones D-43 y D-44 | Roles y permisos, registro, login, perfil, catálogo semilla, contrato v1 y pruebas Pest del S1. |
| [#11](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/11) | S2: catálogo, contrato y backend del Sprint 2 | 75 archivos de backend: catálogo, medios, verificación, portafolio, disponibilidad, tarifas y comunicados. |
| [#14](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/14) | S3: catálogo, contrato y backend del Sprint 3 | Solicitudes, evidencias, revalidación al enviar, límite de activas, idempotencia y búsqueda de técnicos. |
| [#21](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/21) | Sprint 4: matching, ofertas con SLA, elección, pendiente de 24 h, notificaciones y tiempo real | 98 archivos de backend: el módulo `BMatching` completo, `CNotifications`, outbox, Reverb, el seeder E2E y 101 pruebas Pest. |
| [#29](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/29) | feat(s04): image_url y reference_fee en el catálogo público y DatabaseSeeder | Foto de la especialidad y tarifa de referencia en la API pública, con una consulta sin N+1. |
| [#31](https://github.com/grupopruebas41/TecnicoYA-Huancayo/pull/31) | feat(s07): registro detallado en 2 pasos y recuperación de contraseña | Migración 000024, reglas del registro (D-80), enlace de recuperación con límite por IP y por correo, y sus pruebas. |

## 3. Archivos clave

| # | Ruta | Para qué sirve |
|---|---|---|
| 1 | `backend/api/routes/api.php` | Todas las rutas de `/api/v1`, con su middleware (sesión, rol, permiso y límite de intentos). |
| 2 | `backend/api/app/Modules/FAdministration/Application/RegisterAccount.php` | Caso de uso del registro: usuario, perfil de cliente o de técnico, en una sola transacción. |
| 3 | `backend/api/app/Modules/FAdministration/Http/Requests/RegisterAccountRequest.php` | Validación del registro en el servidor, con mensajes en español. |
| 4 | `backend/api/app/Modules/ARequests/Application/ManageServiceRequests.php` | Crear, editar y **enviar** una solicitud de servicio. |
| 5 | `backend/api/app/Modules/ARequests/Application/SubmissionPolicy.php` | Revalida todo al enviar y aplica el límite de solicitudes activas. |
| 6 | `backend/api/app/Modules/BMatching/Application/Eligibility.php` | Decide qué técnicos pueden recibir la oferta y por qué se excluye a los demás. |
| 7 | `backend/api/app/Modules/BMatching/Domain/Scorer.php` | Fórmula del puntaje del matching. |
| 8 | `backend/api/app/Modules/BMatching/Application/MatchingFlow.php` | Orquesta el matching: preparar, abrir ronda, vencer, reintentar y cerrar. |
| 9 | `backend/api/app/Modules/BMatching/Application/OfferResponses.php` | El técnico acepta o rechaza una oferta. |
| 10 | `backend/api/app/Modules/BMatching/Application/ClientSelection.php` | El cliente elige entre los que aceptaron; se crea la participación y la cita. |
| 11 | `backend/api/app/Modules/CNotifications/Application/Outbox.php` | Guarda el evento de tiempo real en la misma transacción que el cambio. |
| 12 | `backend/api/database/migrations/2026_10_16_000022_create_matching_offers_and_participations.php` | Tablas del matching: corridas, candidatos, rondas, ofertas y participaciones. |

### 3.1 `routes/api.php`: la API y sus protecciones (líneas 30 a 34 y 60 a 71)

```php
    Route::middleware('throttle:spa-auth')->group(function () {
        Route::post('auth/register', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'register'])
            ->middleware('session.none'); // D-43
        Route::post('auth/login', [App\Modules\FAdministration\Http\Controllers\AuthController::class, 'login']);
    });
    // …
        Route::middleware('role:client')->group(function () {
            Route::get('requests', [ServiceRequestController::class, 'index']);
            Route::post('requests', [ServiceRequestController::class, 'store']);
            Route::patch('requests/{serviceRequest}', [ServiceRequestController::class, 'update'])->whereNumber('serviceRequest');
            Route::post('requests/{serviceRequest}/submission', [ServiceRequestController::class, 'submit'])->whereNumber('serviceRequest');
            Route::get('requests/{serviceRequest}/candidates', [SelectionController::class, 'candidates'])->whereNumber('serviceRequest');
            Route::post('requests/{serviceRequest}/selection', [SelectionController::class, 'select'])->whereNumber('serviceRequest');
```

- **30:** `throttle:spa-auth` limita los intentos por minuto de registro y login. El intento número N+1 recibe 429.
- **31 y 32:** `session.none` impide registrarse con una sesión abierta (decisión D-43).
- **33:** el login usa la sesión de Laravel; la API v1 no emite tokens.
- **60:** `role:client` deja este grupo solo para clientes. Un técnico o un administrador reciben 403, y esa prueba negativa existe.
- **62 y 67:** crear y enviar son pasos distintos. Primero la solicitud queda `registered` (borrador) y luego pasa a `sent`.
- **69 y 70:** el cliente ve a los técnicos que aceptaron y elige uno.
- `whereNumber`: un id que no es número ni siquiera llega al controlador.

(El fragmento omite las líneas 35 a 59 y 64 a 66.)

### 3.2 `RegisterAccount.php`: el registro en una transacción (líneas 12 a 47)

```php
    public function execute(array $data): User
    {
        try {
            return DB::transaction(function () use ($data) {
                $role = DB::table('roles')->where('code', $data['account_type'])->where('active', 1)->first();
                abort_unless($role, 503, __('api.authorization_unavailable'));
                $name = isset($data['given_names']) ? trim($data['given_names'].' '.$data['family_names']) : $data['name'];
                $user = new User;
                $user->forceFill([
                    'name' => $name, 'given_names' => $data['given_names'] ?? null, 'family_names' => $data['family_names'] ?? null,
                    'email' => $data['email'], 'password' => $data['password'], 'phone' => $data['phone'] ?? null,
                    'terms_accepted_at' => isset($data['terms_accepted']) ? now() : null,
                    'role_id' => $role->id, 'is_active' => true,
                ])->save();
                if ($data['account_type'] === 'client') {
                    DB::table('client_profiles')->insert([/* tipo, distrito, razón social y dirección */]);
                } else {
                    $this->technicianProfile($user, $name, $data);
                }
                return $user->refresh();
            });
        } catch (UniqueConstraintViolationException $error) {
            if (User::query()->where('email', $data['email'])->exists()) {
                throw ValidationException::withMessages(['email' => __('validation.unique', ['attribute' => 'correo'])]);
            }
            throw $error;
        }
    }
```

- **15:** todo ocurre en **una transacción**. Si falla el perfil, tampoco queda el usuario.
- **16 y 17:** el rol se busca en la tabla `roles` y solo puede ser `client` o `technician`, porque la validación rechaza `admin` (S01-TC-006). Si el rol no está activo, responde 503.
- **20:** el nombre para mostrar se arma con nombres y apellidos (D-75).
- **24:** la contraseña se guarda **cifrada**: el modelo `User` la convierte con `bcrypt` gracias al cast `hashed`.
- **26:** la cuenta nace activa. El técnico, además, nace `pending_verification` (ver `technicianProfile`, línea 54).
- **29 a 36:** el perfil depende del tipo de cuenta. El técnico registra su distrito base, los distritos atendidos, las especialidades y los rubros declarados.
- **40 a 45:** si dos personas registran el mismo correo a la vez, el índice único de MySQL lo detecta y se responde con un error de validación en español, no con un error SQL (S01-TC-001).

### 3.3 `ManageServiceRequests::submit`: enviar la solicitud (líneas 90 a 111)

```php
    public function submit(User $user, int $id, int $expectedVersion): array
    {
        $request = $this->lockOwnRegistered($user, $id, $expectedVersion);
        $ruleVersionId = $this->policy->check($request);
        $generation = (int) $request->search_generation + 1;
        $version = $this->bump($request, ['status' => 'sent', 'submitted_at' => now(), 'rule_version_id' => $ruleVersionId,
            'search_generation' => $generation], $user->id, 'request.submitted', 'Solicitud enviada por el cliente.', [], 'sent');
        PrepareMatching::dispatch($id, $generation)->afterCommit();
        $row = DB::table('service_requests')->find($id);

        return ['id' => $row->id, 'status' => $row->status, 'version' => $version, 'submitted_at' => $row->submitted_at];
    }

    private function lockOwnRegistered(User $user, int $id, int $expectedVersion): object
    {
        $request = DB::table('service_requests as r')->join('client_profiles as c', 'c.id', '=', 'r.client_id')
            ->where('r.id', $id)->where('c.user_id', $user->id)->lockForUpdate()->first(['r.*']);
        abort_unless($request, 404);
        abort_unless($request->status === 'registered' && (int) $request->version === $expectedVersion, 409);

        return $request;
    }
```

- **92 y 103 a 111:** se bloquea la fila (`lockForUpdate`) y solo si es **del propio cliente**. Una solicitud ajena responde 404, para no revelar que existe.
- **108:** solo se envía un borrador con la versión esperada. Otro valor responde 409.
- **93:** `SubmissionPolicy` revalida todo; se explica en el punto siguiente.
- **95 y 96:** pasa a `sent`, guarda la versión de reglas vigente (D-24) y deja un evento en la línea de tiempo.
- **97:** el matching se encola **después del commit** (`afterCommit`). Así nunca trabaja con datos que podrían revertirse.

### 3.4 `SubmissionPolicy`: revalidar y limitar (líneas 25 a 45)

```php
    public function check(object $request): int
    {
        Validator::make((array) $request, [
            'subcategory_id' => [new ActiveSubcategory('api.subcategory_unavailable')],
            'district_id' => [Rule::exists('districts', 'id')->where('active', 1)],
            'target_technician_id' => ['exclude_unless:source,profile', new TargetTechnicianOffers($request->subcategory_id)],
            'preferred_start_at' => ['exclude_unless:mode,scheduled', 'after_or_equal:now'],
        ], StoreServiceRequestRequest::sharedMessages())->validate();
        DB::table('client_profiles')->where('id', $request->client_id)->lockForUpdate()->first();
        $versionId = $this->rules->currentVersionId();
        $max = $this->rules->integer($versionId, 'max_active_requests_per_client');
        $active = DB::table('service_requests')->where('client_id', $request->client_id)->where('status', '<>', 'registered')
            ->whereNull('closed_at')->whereNull('cancelled_at')->count();
        if ($active >= $max) {
            throw new HttpResponseException(ApiResponse::error('ACTIVE_REQUEST_LIMIT', __('api.active_request_limit', ['max' => $max]), 409));
        }
        return $versionId;
    }
```

- **27 a 32:** lo que era válido al guardar el borrador puede haber cambiado. Se vuelve a comprobar:
  - que el rubro y el distrito siguen activos;
  - que el técnico de una solicitud dirigida aún ofrece ese rubro;
  - que una cita programada no está en el pasado.
- **35:** se bloquea el perfil del cliente, así que dos envíos simultáneos no pueden superar juntos el máximo.
- **36 y 37:** el máximo sale de la **versión de reglas** en la base (`rule_versions`), no de una constante en el código.
- **38 a 42:** cuenta las solicitudes activas. Si se llega al máximo, responde 409 `ACTIVE_REQUEST_LIMIT` con un mensaje en español (S03-TC-030).

### 3.5 `Eligibility::evaluate`: quién puede recibir la oferta (líneas 33 a 57)

```php
        $services = DB::table('technician_services')->whereIn('technician_id', $ids)
            ->where('subcategory_id', $request->subcategory_id)->where('active', 1)->get()->keyBy('technician_id');
        $covered = DB::table('technician_districts')->whereIn('technician_id', $ids)
            ->where('district_id', $request->district_id)->where('active', 1)->pluck('technician_id')->flip();
        $paused = DB::table('technician_pauses')->whereIn('technician_id', $ids)->whereNull('cancelled_at')
            ->where('starts_at', '<=', $now)->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->pluck('technician_id')->flip();
        $slots = DB::table('availability_slots')->whereIn('technician_id', $ids)->where('active', 1)->get()->groupBy('technician_id');
        $busy = DB::table('appointments')->whereIn('technician_id', $ids)->where('status', 'confirmed')
            ->where('starts_at', '<', $to)->where('ends_at', '>', $from)->pluck('technician_id')->flip();

        $result = [];
        foreach ($technicians as $id => $technician) {
            $result[$id] = ['technician' => $technician, 'service' => $services->get($id), 'code' => match (true) {
                $technician->status === 'suspended' => 'technician_suspended',
                $technician->status !== 'active' => 'not_active',
                $technician->verification_status !== 'approved' => 'not_verified',
                ! $technician->is_active || $technician->anonymized_at !== null => 'account_disabled',
                ! $services->has($id) => 'service_not_offered',
                ! $covered->has($id) => 'district_not_covered',
                $paused->has($id) => 'paused',
                ! $this->fitsAvailability($slots->get($id, collect()), $request, $from, $to) => 'outside_availability',
                $busy->has($id) => $request->mode === 'scheduled' ? 'schedule_conflict' : 'appointment_within_2h',
                default => null,
            }];
```

- **33 a 42:** son **seis consultas para todos los técnicos a la vez**, no una por técnico; así se evita el problema N+1. Traen los servicios del rubro, los distritos atendidos, las pausas vigentes, las franjas de disponibilidad y las citas que se cruzan con la ventana pedida.
- **46 a 56:** un `match (true)` revisa los filtros **en orden** y guarda el **primer motivo de exclusión**:
  - suspendido;
  - no activo;
  - no verificado;
  - cuenta deshabilitada;
  - no ofrece el rubro;
  - no atiende el distrito;
  - en pausa;
  - fuera de su horario;
  - con una cita que choca.
- **56:** `null` significa elegible.
- El motivo queda guardado en `matching_candidates.exclusion_code`. Así el administrador puede explicar por qué alguien no recibió la oferta (S04-TC-001 y 002).

### 3.6 `Scorer`: la fórmula del puntaje (archivo completo)

```php
/** D-20: P = wC·C + wT·T + wH·H + wE·E, con los pesos en puntos sobre 100 de la versión de reglas. */
final class Scorer
{
    public const FACTORS = ['proximity', 'price', 'history', 'experience'];

    public function score(array $factors, array $weights): array
    {
        $contributions = [];
        foreach (self::FACTORS as $factor) {
            $contributions[$factor] = (float) $weights[$factor] * (float) $factors[$factor];
        }

        return ['score' => array_sum($contributions), 'contributions' => $contributions];
    }
}
```

- **5:** la fórmula es la decisión D-20. Combina cuatro factores normalizados de 0 a 1: cercanía (C), precio (T), historial (H) y experiencia (E).
- **8:** el orden fijo de los factores.
- **15 a 22:** cada aporte es su peso por el valor del factor, y el puntaje es la suma (sobre 100).
- **Los pesos no están en el código:** vienen de la versión de reglas en la base, así que cambiar un peso es un dato nuevo y no un despliegue.
- La prueba unitaria S04-TC-014 comprueba 75 puntos con cuatro aportes calculados a mano.
- Según D-86, un técnico sin distrito base tiene C = 0 (S04-TC-138).

### 3.7 `MatchingFlow::prepare`: la orquestación (líneas 29 a 44)

```php
    public function prepare(int $requestId, int $generation): void
    {
        $started = hrtime(true);
        DB::transaction(function () use ($requestId, $generation, $started) {
            $request = $this->current($requestId, $generation, 'PrepareMatching');
            if (! $request || $request->status !== 'sent' || DB::table('matching_runs')->where('request_id', $requestId)
                ->where('search_generation', $generation)->exists()) {
                return;
            }
            $run = $this->matcher->run($request, $generation > 1 ? 'alternative' : 'submission');
            if ($run->status === 'completed') {
                $this->openFrom($request, $run);
            }
            DB::table('matching_runs')->where('id', $run->id)->update(['duration_ms' => round((hrtime(true) - $started) / 1e6, 3)]);
        });
    }
```

- **33:** `current` bloquea la solicitud y comprueba que el job sigue siendo de la **generación vigente** de la búsqueda. Un job viejo se descarta.
- **34 a 37:** es **idempotente**. Si la solicitud ya no está `sent`, o esa generación ya tiene su corrida, no hace nada. Que un job se ejecute dos veces no duplica ofertas.
- **38:** `Matcher` evalúa la elegibilidad, calcula el puntaje y el ranking, y guarda la corrida y los candidatos.
- **39 a 41:** si hubo candidatos, abre la primera ronda de ofertas con su plazo (`expires_at`).
- **42:** mide cuánto tardó, que es el requisito de rendimiento del S4.

### 3.8 `OfferResponses::respond`: el técnico responde (líneas 25 a 49)

```php
        $technicianId = $this->technicians->idFor($user);
        $requestId = DB::table('offers')->where('id', $offerId)->where('technician_id', $technicianId)->value('request_id');
        abort_unless($requestId, 404);
        $request = DB::table('service_requests')->where('id', $requestId)->lockForUpdate()->first();
        $offer = DB::table('offers')->where('id', $offerId)->first();
        $round = DB::table('offer_rounds')->where('id', $offer->round_id)->lockForUpdate()->first();
        $offer = DB::table('offers')->where('id', $offerId)->lockForUpdate()->first();

        $error = match (true) {
            (int) $offer->version !== (int) $data['expected_version'] => ['STALE_VERSION', __('api.stale_version')],
            $offer->status !== 'pending' => ['OFFER_NOT_PENDING', __('api.offer_not_pending')],
            now()->gte($offer->expires_at) => ['OFFER_EXPIRED', __('api.offer_expired')],
            $data['decision'] === 'accept' && $this->eligibility->codeFor($request, $technicianId) !== null
                => ['TECHNICIAN_UNAVAILABLE', __('api.technician_unavailable_self')],
            default => null,
        };
        if ($error) {
            return [409, ['error' => ['code' => $error[0], 'message' => $error[1]]]];
        }
        $accepted = $data['decision'] === 'accept';
        $this->flow->changeOffer($request, $offer, $accepted ? 'accepted' : 'rejected', /* … */);
        $this->flow->settle($request, $round);
```

- **26 y 27:** solo puede responder el técnico dueño de la oferta. Una oferta ajena responde 404 (S04-TC-037).
- **28 a 31:** bloqueos **en orden fijo**: solicitud, ronda y oferta. Ese orden evita interbloqueos cuando dos técnicos responden a la vez.
- **33 a 40:** cuatro reglas en orden:
  - la versión debe coincidir;
  - la oferta debe seguir pendiente;
  - **el plazo lo decide la hora del servidor**: a los 10:00 exactos ya venció, aunque el job de vencimiento no haya corrido (S04-TC-034);
  - al aceptar, se revalida que el técnico siga disponible.
- **41 y 42:** cualquier regla incumplida responde 409 con un código claro.
- **46 y 49:** se cambia la oferta y `settle` decide si la ronda queda esperando la elección del cliente.

**Aceptar no asigna:** quien elige es el cliente (S04-TC-033).

### 3.9 `ClientSelection::select`: el cliente elige (líneas 32 a 57)

```php
    public function select(User $user, int $requestId, array $data): array
    {
        $request = $this->lockOwn($user, $requestId);
        if ((int) $request->version !== (int) $data['expected_version'] || $request->status !== 'sent') {
            return $this->error('STALE_VERSION', __('api.stale_version'));
        }
        $round = $this->state->currentRound($request);
        if (! $round || $round->status !== 'awaiting_choice') {
            return $this->error('ROUND_NOT_CLOSED', __('api.round_not_closed'));
        }
        $round = DB::table('offer_rounds')->where('id', $round->id)->lockForUpdate()->first();
        $offer = DB::table('offers')->where('id', $data['offer_id'])->where('round_id', $round->id)
            ->where('status', 'accepted')->lockForUpdate()->first();
        if (! $offer) {
            throw ValidationException::withMessages(['offer_id' => __('api.offer_not_accepted')]);
        }
        DB::table('technician_profiles')->where('id', $offer->technician_id)->lockForUpdate()->first();
        $code = $this->eligibility->codeFor($request, (int) $offer->technician_id);
        if ($code !== null) {
            return $this->unavailable($user, $request, $round, $offer, $code);
        }

        return [200, $this->assign($user, $request, $round, $offer)];
    }
```

- **34 a 37:** solo el titular y solo con la versión vigente; otro valor responde 409.
- **38 a 41:** no se puede elegir mientras la ronda sigue abierta (`ROUND_NOT_CLOSED`, S04-TC-047).
- **43 a 47:** solo se elige una oferta **aceptada** de esa ronda.
- **50:** se bloquea al técnico. Si dos clientes lo eligen a la vez para el mismo horario, solo uno gana (S04-TC-045, con procesos reales).
- **51 a 54:** se revalida justo antes de asignar.
- **56:** `assign` crea la participación y la cita confirmada (S04-TC-044).

### 3.10 `Outbox::record`: tiempo real sin perder eventos (líneas 15 a 27)

```php
    public function record(string $type, string $channel, string $aggregateType, int $aggregateId, array $payload): int
    {
        $eventId = (string) Str::uuid();
        $id = DB::table('outbox_events')->insertGetId([
            'event_id' => $eventId, 'event_type' => $type, 'channel' => $channel,
            'aggregate_type' => $aggregateType, 'aggregate_id' => $aggregateId,
            'payload' => json_encode(['event_id' => $eventId, 'type' => $type] + $payload + ['occurred_at' => now()->toISOString()], JSON_THROW_ON_ERROR),
        ]);
        PublishOutboxEvent::dispatch($id)->afterCommit();

        return $id;
    }
```

- **17:** cada evento lleva un `event_id` único, que el frontend usa para deduplicar.
- **18 a 22:** el evento se **guarda en la base, dentro de la misma transacción** que el cambio de negocio. Si el cambio se revierte, el evento también.
- **21:** la carga es mínima (ids, estado y versión), sin datos personales.
- **23:** solo después del commit se publica por Reverb. Si Reverb está caído, el intento queda registrado, el barrido lo reintenta y la SPA recupera el estado por la API.

## 4. Flujo de punta a punta: registro → API → BD → matching

1. **Registro.** `POST /api/v1/auth/register`:
   1. `throttle` y `session.none` lo protegen;
   2. `RegisterAccountRequest` valida;
   3. `RegisterAccount` crea `users` y el perfil en `client_profiles` o en `technician_profiles`, más distritos y especialidades.
2. **Login.** `POST /auth/login` abre la sesión; `GET /me` devuelve el rol y los permisos.
3. **Técnico listo para recibir ofertas.** El técnico carga sus servicios con tarifa (`technician_services` y `service_rate_versions`) y su disponibilidad (`availability_slots`). Un administrador lo verifica y su estado pasa a `approved`.
4. **Solicitud.**
   1. `POST /requests` crea el borrador `registered`; acepta una `Idempotency-Key` para no duplicarlo;
   2. `POST /requests/{id}/attachments` adjunta fotos privadas;
   3. `POST /requests/{id}/submission` ejecuta `SubmissionPolicy` y cambia el estado a `sent`.
5. **Matching** (job `PrepareMatching`, después del commit):
   1. `Eligibility` filtra a los técnicos;
   2. `Scorer` y `Ranker` calculan el puntaje;
   3. `RoundOpener` crea la ronda con ofertas a los mejores (`offers`, con `expires_at`);
   4. `Outbox` guarda los eventos y la bandeja de notificaciones del técnico.
6. **Respuestas.** Cada técnico llama a `POST /offers/{id}/response`. Al cerrar la ronda, la solicitud pasa a `awaiting_choice`.
7. **Elección.** El cliente llama a `GET /requests/{id}/candidates` y luego a `POST /requests/{id}/selection`. `ClientSelection` crea `participations` y `appointments`.
8. **Sin técnicos disponibles.** La solicitud pasa a `pending_availability`. Se reintenta durante 24 h y después vence; el reloj de 24 h no se reinicia (D-21).

## 5. Pruebas del área

En el último `main` hay **350** pruebas Pest en `backend/api/tests`, organizadas por sprint:

| Carpeta | Ejemplos |
|---|---|
| `tests/Feature/Sprint01` | `TC002DuplicateEmailTest.php` (S01-TC-001, correo duplicado) · `TC008PublicAdminSignupDeniedTest.php` (S01-TC-006) · `TC010StaleWriteConflictTest.php` (S01-TC-008, 409) · `AuthorizationMatrixTest.php` |
| `tests/Feature/Sprint02` | `TC015CreateSubcategoryTest.php` · `MediaUploadTest.php` · `TC025NewRateVersionTest.php` · `TechnicianVerificationTest.php` |
| `tests/Feature/Sprint03` | `ActiveRequestLimitTest.php` (S03-TC-030 y 031) · `RequestIdempotencyTest.php` · `RequestSubmissionRevalidationTest.php` · `RequestEvidenceVisibilityTest.php` |
| `tests/Unit/Sprint04` y `tests/Feature/Sprint04` | `ScorerTest.php` (S04-TC-014) · `EligibilityTest.php` (S04-TC-001 y 002) · `OfferResponseTest.php` (S04-TC-033 y 034) · `SelectionTest.php` (S04-TC-044 y 047) · `OfferConcurrencyTest.php` (procesos reales) |
| `tests/Feature/Sprint07` | `RegistrationDetailsTest.php` (S07-TC-001 y 002, registro detallado) |

**Para correr una o dos en vivo** (PowerShell, desde `backend/api`, con la base de pruebas levantada mediante `docker compose -f docker-compose.testing.yml --env-file .env.testing up -d --wait`):

```powershell
C:\xampp\php\php.exe vendor\bin\pest tests\Unit\Sprint04\ScorerTest.php
C:\xampp\php\php.exe vendor\bin\pest tests\Feature\Sprint04\OfferResponseTest.php --filter "S04-TC-034"
```

El arranque de Pest (`tests/bootstrap.php`) usa el slot A (`tecnicoya_testing`) y nunca la base de desarrollo. La suite completa tarda unos 6 minutos: `C:\xampp\php\php.exe vendor\bin\pest`.

## 6. Cómo mostrarlo en localhost

Primero sigue el README de la raíz, en «Desarrollo local»:
- backend en `:3000`;
- frontend en `:5173`;
- `php artisan migrate` y `php artisan db:seed`;
- datos de demostración con `DemoSeeder`.

| Dónde | Qué hacer |
|---|---|
| `http://127.0.0.1:3000/api/v1/catalog/specialties` | Muestra la API pública en JSON: especialidades con `image_url`. |
| `http://127.0.0.1:3000/api/v1/catalog/carousel` | Muestra los rubros con su tarifa de referencia. |
| `http://127.0.0.1:5173/#cuenta` → «Crear una cuenta» | Registra un cliente y prueba primero un correo repetido: aparece el error en español. Muestra la tabla `users` y `client_profiles` en la base de desarrollo. |
| `#cuenta/cliente` (`demo-cliente@example.test`) | Crea y envía una solicitud de «Reparación de hardware» en Huancayo. Explica que el envío encola `PrepareMatching`. |
| Terminal en `backend/api` | Ejecuta `php artisan queue:work --stop-when-empty` para procesar el matching. Luego muestra en la base `matching_runs`, `matching_candidates` (con `exclusion_code` y puntaje) y `offers`. |
| `#cuenta/tecnico` (`demo-tecnico-computo@example.test`) | El técnico ve la oferta con el cronómetro y la acepta. |
| `#cuenta/cliente` | El cliente ve «Elige a tu técnico» y lo elige; la cita queda confirmada. |

## 7. Preguntas probables del docente

1. **¿Cómo evitan que se cree un administrador desde el registro público?**
   La validación solo acepta `client` o `technician` (S01-TC-006). Los administradores se crean con `tecnicoya:provision-admin` o desde el panel, con permiso y reconfirmando la contraseña.
2. **¿Qué pasa si dos usuarios editan lo mismo a la vez?**
   Cada fila tiene `version`. El cliente envía `expected_version` y, si no coincide, la API responde 409 sin pisar el cambio (S01-TC-008).
3. **¿Cómo funciona el puntaje del matching?**
   P = wC·C + wT·T + wH·H + wE·E (D-20), con factores de 0 a 1 y pesos sobre 100 guardados en la versión de reglas. Los empates se resuelven por promedio de calificaciones.
4. **¿Por qué el plazo de la oferta se mide en el servidor?**
   Para que nadie lo alargue cambiando la hora del celular. A los 10:00 la oferta ya venció, aunque el job de vencimiento no haya corrido (S04-TC-034).
5. **¿Cómo evitan duplicados por un reintento de red?**
   Con `Idempotency-Key`: la misma clave y el mismo cuerpo devuelven la misma respuesta sin repetir la escritura. La misma clave con otro cuerpo responde 409 (S03-TC-031).
6. **¿Qué es el outbox y por qué lo usan?**
   El evento de tiempo real se guarda en la misma transacción que el cambio y se publica después del commit. Nunca se avisa de algo que se revirtió, y si Reverb falla se reintenta.
7. **¿Cómo prueban la concurrencia?**
   Con procesos PHP reales que eligen o responden a la vez (`OfferConcurrencyTest.php` y `SelectionConcurrencyTest.php`), sobre MySQL con aislamiento READ COMMITTED y bloqueos en orden fijo.
8. **¿Dónde se ven los datos privados?**
   Las fotos de evidencia son privadas y solo las ve el titular o el técnico notificado. La dirección exacta solo la ve el técnico asignado (S04-TC-052). Los eventos de tiempo real no llevan datos personales.

## 8. Nota de honestidad

El código de esta área se desarrolló con apoyo de agentes de IA (Claude Code y Codex) a partir de los prompts de `PROMPTS.md`. La integrante:
- revisó los cambios;
- verificó las pruebas, la cobertura y la mutación de cada PR;
- integró los cambios a `main` mediante pull requests.

Cada avance en `docs/avances/mayhuasca/` registra qué propuso la IA, qué se aceptó y qué se corrigió.
