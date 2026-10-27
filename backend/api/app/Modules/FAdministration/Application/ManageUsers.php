<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use App\Shared\Http\ApiResponse;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Usuarios del panel (bloque C, D-85; permiso users.manage, D-74). El administrador nunca define contraseñas: el alta
 * envía un enlace de activación (broker `activations`) y «restablecer acceso» invalida la contraseña y envía el enlace
 * de restablecimiento. Bloquear (D-32) y cerrar sesiones borran las sesiones y suben auth_version. Eliminar es
 * anonimizar: se borran los datos personales y se conservan las solicitudes. Ninguna acción toca la propia cuenta
 * ni deja el sistema sin administradores activos. La auditoría guarda motivo, estados y campos, nunca contraseñas.
 */
final class ManageUsers
{
    public const STATUSES = ['active', 'blocked', 'pending_activation', 'anonymized'];

    public const ROLES = ['client', 'technician', 'admin'];

    /** Campos editables que se auditan con su valor anterior y el nuevo. */
    private const TRACKED = ['given_names', 'family_names', 'email', 'phone', 'district_id', 'client_type', 'business_name', 'reference_address'];

    public function __construct(private readonly AuditTrail $audit, private readonly RegisterAccount $register) {}

    public function list(array $filters): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = (int) ($filters['per_page'] ?? 20);
        $query = $this->base();
        if (($filters['q'] ?? '') !== '') {
            $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], mb_strtolower(trim($filters['q']))).'%';
            $query->where(fn (Builder $q) => $q->whereRaw('LOWER(u.name) LIKE ?', [$like])->orWhereRaw('LOWER(u.email) LIKE ?', [$like]));
        }
        $query->when($filters['role'] ?? null, fn (Builder $q, string $role) => $q->where('r.code', $role));
        $this->filterStatus($query, $filters['status'] ?? null);
        $query->when($filters['district_id'] ?? null, fn (Builder $q, $district) => $q->whereRaw('COALESCE(cp.district_id, tp.base_district_id) = ?', [(int) $district]));
        $query->when($filters['created_from'] ?? null, fn (Builder $q, string $from) => $q->where('u.created_at', '>=', Carbon::parse($from)->startOfDay()));
        $query->when($filters['created_to'] ?? null, fn (Builder $q, string $to) => $q->where('u.created_at', '<=', Carbon::parse($to)->endOfDay()));
        $total = (clone $query)->count();
        $rows = $query->orderByDesc('u.created_at')->orderByDesc('u.id')->offset(($page - 1) * $perPage)->limit($perPage)->get();

        return ['items' => $rows->map(fn (object $row) => $this->present($row))->all(), 'page' => $page, 'per_page' => $perPage, 'total' => $total];
    }

    public function detail(int $id): array
    {
        $row = $this->base()->where('u.id', $id)->first();
        abort_unless($row, 404);
        $client = DB::table('client_profiles')->where('user_id', $id)->first();
        $technician = DB::table('technician_profiles')->where('user_id', $id)->first();
        $requests = DB::table('service_requests as s')
            ->join('subcategories as sc', 'sc.id', '=', 's.subcategory_id')->join('districts as d', 'd.id', '=', 's.district_id')
            ->when($client, fn (Builder $q) => $q->where('s.client_id', $client->id))
            ->when(! $client && $technician, fn (Builder $q) => $q->whereIn('s.id', DB::table('participations')->where('technician_id', $technician->id)->select('request_id')))
            ->when(! $client && ! $technician, fn (Builder $q) => $q->whereRaw('1 = 0'))
            ->orderByDesc('s.created_at')->orderByDesc('s.id')->limit(20)
            ->get(['s.id', 's.status', 's.created_at', 'sc.name as subcategory', 'd.name as district']);
        $audit = DB::table('audit_entries as a')->leftJoin('users as actor', 'actor.id', '=', 'a.actor_id')
            ->where('a.subject_type', 'user')->where('a.subject_id', $id)->orderByDesc('a.id')->limit(20)
            ->get(['a.action', 'a.reason', 'a.occurred_at', 'actor.name as actor']);

        return [
            'user' => $this->present($row),
            'client' => $client ? ['client_type' => $client->client_type, 'business_name' => $client->business_name,
                'reference_address' => $client->default_address] : null,
            'technician' => $technician ? ['id' => (int) $technician->id, 'status' => $technician->status,
                'verification_status' => $technician->verification_status, 'experience_years' => (int) $technician->experience_years] : null,
            'requests' => $requests->map(fn (object $r) => ['id' => (int) $r->id, 'status' => $r->status, 'subcategory' => $r->subcategory,
                'district' => $r->district, 'created_at' => Carbon::parse($r->created_at)->toISOString()])->all(),
            'audit' => $audit->map(fn (object $a) => ['action' => $a->action, 'reason' => $a->reason, 'actor' => $a->actor,
                'occurred_at' => Carbon::parse($a->occurred_at)->toISOString()])->all(),
        ];
    }

    public function create(User $actor, array $data): array
    {
        $user = DB::transaction(function () use ($actor, $data) {
            $user = $data['account_type'] === 'admin' ? $this->createAdmin($data)
                : $this->register->execute(array_diff_key($data, ['reason' => true]) + ['password' => Str::password(40)]);
            DB::table('users')->where('id', $user->id)->update(['invited_at' => now(), 'activated_at' => null]);
            $this->audit->record($actor, 'user.created', 'users.manage', 'user', $user->id, $data['reason'], [],
                ['id' => $user->id, 'role' => $data['account_type']]);

            return $user->refresh();
        });
        $this->sendActivation($user);

        return $this->find($user->id);
    }

    public function update(User $actor, int $id, array $data): array
    {
        DB::transaction(function () use ($actor, $id, $data) {
            $user = $this->lockTarget($actor, $id, (int) $data['expected_version'], allowSelf: true);
            $client = DB::table('client_profiles')->where('user_id', $id)->first();
            $technician = DB::table('technician_profiles')->where('user_id', $id)->first();
            $before = [
                'given_names' => $user->given_names, 'family_names' => $user->family_names, 'email' => $user->email, 'phone' => $user->phone,
                'district_id' => $client ? $this->int($client->district_id) : ($technician ? $this->int($technician->base_district_id) : null),
                'client_type' => $client?->client_type, 'business_name' => $client?->business_name, 'reference_address' => $client?->default_address,
            ];
            $after = array_merge($before, array_intersect_key($data, array_flip(self::TRACKED)));
            if (isset($after['district_id'])) {
                $after['district_id'] = (int) $after['district_id'];
            }

            $userChanges = array_intersect_key($after, array_flip(['given_names', 'family_names', 'email', 'phone']));
            $userChanges['name'] = trim(($after['given_names'] ?? '').' '.($after['family_names'] ?? '')) ?: $user->name;
            DB::table('users')->where('id', $id)->update($userChanges + ['version' => $user->version + 1, 'updated_at' => now()]);
            if ($client) {
                DB::table('client_profiles')->where('id', $client->id)->update([
                    'district_id' => $after['district_id'], 'client_type' => $after['client_type'],
                    'business_name' => $after['client_type'] === 'mype' ? $after['business_name'] : null,
                    'default_address' => $after['reference_address'], 'version' => $client->version + 1,
                ]);
            } elseif ($technician && isset($data['district_id'])) {
                DB::table('technician_profiles')->where('id', $technician->id)->update(['base_district_id' => $after['district_id'], 'version' => $technician->version + 1]);
            }
            $fields = array_values(array_filter(self::TRACKED, fn (string $field) => ($before[$field] ?? null) !== ($after[$field] ?? null)));
            $this->audit->record($actor, 'user.updated', 'users.manage', 'user', $id, $data['reason'],
                array_intersect_key($before, array_flip($fields)), array_intersect_key($after, array_flip($fields)));
        });

        return $this->find($id);
    }

    public function block(User $actor, int $id, array $data): array
    {
        DB::transaction(function () use ($actor, $id, $data) {
            $user = $this->lockTarget($actor, $id, (int) $data['expected_version']);
            if (! $user->is_active) {
                throw $this->conflict('USER_ALREADY_BLOCKED', 'api.user_already_blocked');
            }
            $this->assertNotLastAdmin($user);
            DB::table('users')->where('id', $id)->update(['is_active' => false, 'auth_version' => $user->auth_version + 1,
                'version' => $user->version + 1, 'updated_at' => now()]);
            DB::table('sessions')->where('user_id', $id)->delete(); // D-32
            $this->audit->record($actor, 'user.blocked', 'users.manage', 'user', $id, $data['reason'], ['status' => $this->status($user)], ['status' => 'blocked']);
        });

        return $this->find($id);
    }

    public function unblock(User $actor, int $id, array $data): array
    {
        DB::transaction(function () use ($actor, $id, $data) {
            $user = $this->lockTarget($actor, $id, (int) $data['expected_version']);
            if ($user->is_active) {
                throw $this->conflict('USER_NOT_BLOCKED', 'api.user_not_blocked');
            }
            DB::table('users')->where('id', $id)->update(['is_active' => true, 'version' => $user->version + 1, 'updated_at' => now()]);
            $unblocked = clone $user;
            $unblocked->is_active = true;
            $this->audit->record($actor, 'user.unblocked', 'users.manage', 'user', $id, $data['reason'], ['status' => 'blocked'],
                ['status' => $this->status($unblocked)]);
        });

        return $this->find($id);
    }

    /** Invalida la contraseña y las sesiones y envía el enlace de restablecimiento (o el de activación si está pendiente). */
    public function resetAccess(User $actor, int $id, array $data): array
    {
        $user = DB::transaction(function () use ($actor, $id, $data) {
            $user = $this->lockTarget($actor, $id, (int) $data['expected_version']);
            DB::table('users')->where('id', $id)->update(['password' => bcrypt(Str::password(40)), 'remember_token' => null,
                'auth_version' => $user->auth_version + 1, 'version' => $user->version + 1, 'updated_at' => now()]);
            DB::table('sessions')->where('user_id', $id)->delete();
            $this->audit->record($actor, 'user.access_reset', 'users.manage', 'user', $id, $data['reason'], [], ['status' => $this->status($user)]);

            return User::query()->findOrFail($id);
        });
        if ($this->pending($user)) {
            $this->sendActivation($user);
        } else {
            $user->sendPasswordResetNotification(Password::broker()->createToken($user));
        }

        return $this->find($id);
    }

    public function closeSessions(User $actor, int $id, array $data): array
    {
        $closed = DB::transaction(function () use ($actor, $id, $data) {
            $user = $this->lockTarget($actor, $id, (int) $data['expected_version']);
            $closed = DB::table('sessions')->where('user_id', $id)->delete();
            DB::table('users')->where('id', $id)->update(['auth_version' => $user->auth_version + 1, 'version' => $user->version + 1, 'updated_at' => now()]);
            $this->audit->record($actor, 'user.sessions_closed', 'users.manage', 'user', $id, $data['reason'], [], ['closed_sessions' => $closed]);

            return $closed;
        });

        return $this->find($id) + ['closed_sessions' => $closed];
    }

    public function resendActivation(User $actor, int $id, string $reason): array
    {
        $user = DB::transaction(function () use ($actor, $id, $reason) {
            $user = $this->lockTarget($actor, $id, null);
            if (! $this->pending($user)) {
                throw $this->conflict('USER_ALREADY_ACTIVE', 'api.user_already_active');
            }
            $this->audit->record($actor, 'user.activation_sent', 'users.manage', 'user', $id, $reason);

            return User::query()->findOrFail($id);
        });
        $this->sendActivation($user);

        return $this->find($id);
    }

    /** Eliminar = anonimizar (D-85): sin datos personales, sin acceso y con las solicitudes conservadas. */
    public function anonymize(User $actor, int $id, array $data): array
    {
        DB::transaction(function () use ($actor, $id, $data) {
            $user = $this->lockTarget($actor, $id, (int) $data['expected_version']);
            $this->assertNotLastAdmin($user);
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            DB::table('users')->where('id', $id)->update([
                'name' => 'Usuario eliminado', 'given_names' => null, 'family_names' => null, 'email' => "anonimo-$id@anonimo.invalid",
                'phone' => null, 'password' => bcrypt(Str::password(40)), 'remember_token' => null, 'avatar_media_id' => null,
                'is_active' => false, 'anonymized_at' => now(), 'auth_version' => $user->auth_version + 1, 'version' => $user->version + 1,
                'updated_at' => now(),
            ]);
            DB::table('client_profiles')->where('user_id', $id)->update(['business_name' => null, 'default_address' => null]);
            DB::table('technician_profiles')->where('user_id', $id)->update(['display_name' => 'Técnico eliminado', 'bio' => null, 'whatsapp' => null]);
            DB::table('sessions')->where('user_id', $id)->delete();
            $this->audit->record($actor, 'user.anonymized', 'users.manage', 'user', $id, $data['reason'],
                ['status' => $this->status($user), 'role' => $this->role($user)], ['status' => 'anonymized']);
        });

        return $this->find($id);
    }

    public function find(int $id): array
    {
        $row = $this->base()->where('u.id', $id)->first();
        abort_unless($row, 404);

        return $this->present($row);
    }

    private function base(): Builder
    {
        return DB::table('users as u')->join('roles as r', 'r.id', '=', 'u.role_id')
            ->leftJoin('client_profiles as cp', 'cp.user_id', '=', 'u.id')->leftJoin('technician_profiles as tp', 'tp.user_id', '=', 'u.id')
            ->leftJoin('districts as d', 'd.id', '=', DB::raw('COALESCE(cp.district_id, tp.base_district_id)'))
            ->select(['u.id', 'u.name', 'u.given_names', 'u.family_names', 'u.email', 'u.phone', 'u.is_active', 'u.invited_at', 'u.activated_at',
                'u.anonymized_at', 'u.created_at', 'u.version', 'r.code as role', 'd.id as district_id', 'd.name as district_name']);
    }

    private function filterStatus(Builder $query, ?string $status): void
    {
        if ($status === 'anonymized') {
            $query->whereNotNull('u.anonymized_at');

            return;
        }
        $query->whereNull('u.anonymized_at');
        $pending = fn (Builder $q) => $q->whereNotNull('u.invited_at')->whereNull('u.activated_at');
        match ($status) {
            'blocked' => $query->where('u.is_active', false),
            'pending_activation' => $query->where('u.is_active', true)->where($pending),
            'active' => $query->where('u.is_active', true)->whereNot($pending),
            default => null,
        };
    }

    private function present(object $row): array
    {
        return [
            'id' => (int) $row->id, 'name' => $row->name, 'given_names' => $row->given_names, 'family_names' => $row->family_names,
            'email' => $row->email, 'phone' => $row->phone, 'role' => $row->role, 'status' => $this->status($row),
            'district' => $row->district_id === null ? null : ['id' => (int) $row->district_id, 'name' => $row->district_name],
            'created_at' => Carbon::parse($row->created_at)->toISOString(), 'version' => (int) $row->version,
        ];
    }

    /** Prioridad: anonimizado, bloqueado, pendiente de activación y activo. */
    private function status(object $row): string
    {
        return match (true) {
            $row->anonymized_at !== null => 'anonymized',
            ! $row->is_active => 'blocked',
            $this->pending($row) => 'pending_activation',
            default => 'active',
        };
    }

    private function pending(object $row): bool
    {
        return $row->invited_at !== null && $row->activated_at === null;
    }

    private function role(object $user): ?string
    {
        return DB::table('roles')->where('id', $user->role_id)->value('code');
    }

    /** Bloquea la fila del usuario y aplica las reglas comunes: existe, no es la propia cuenta, no está anonimizado y la versión coincide. */
    private function lockTarget(User $actor, int $id, ?int $expectedVersion, bool $allowSelf = false): object
    {
        if (! $allowSelf && $actor->id === $id) {
            throw $this->conflict('USER_SELF_ACTION', 'api.user_self_action');
        }
        $user = DB::table('users')->where('id', $id)->lockForUpdate()->first();
        abort_unless($user, 404);
        if ($user->anonymized_at !== null) {
            throw $this->conflict('USER_ANONYMIZED', 'api.user_anonymized');
        }
        abort_if($expectedVersion !== null && (int) $user->version !== $expectedVersion, 409);

        return $user;
    }

    /** Un administrador activo no se bloquea ni se elimina si es el último (también ante una carrera entre dos). */
    private function assertNotLastAdmin(object $user): void
    {
        $adminRole = DB::table('roles')->where('code', 'admin')->value('id');
        if ((int) $user->role_id !== (int) $adminRole || ! $user->is_active) {
            return;
        }
        $others = DB::table('users')->where('role_id', $adminRole)->where('id', '!=', $user->id)->where('is_active', true)
            ->whereNull('anonymized_at')->lockForUpdate()->count();
        if ($others === 0) {
            throw $this->conflict('USER_LAST_ADMIN', 'api.user_last_admin');
        }
    }

    private function createAdmin(array $data): User
    {
        $user = new User;
        $user->forceFill([
            'name' => trim($data['given_names'].' '.$data['family_names']), 'given_names' => $data['given_names'], 'family_names' => $data['family_names'],
            'email' => $data['email'], 'phone' => $data['phone'] ?? null, 'password' => Str::password(40),
            'role_id' => DB::table('roles')->where('code', 'admin')->value('id'), 'is_active' => true,
        ])->save();

        return $user;
    }

    private function sendActivation(User $user): void
    {
        $user->notify(new AccountActivation(Password::broker('activations')->createToken($user)));
    }

    private function conflict(string $code, string $message): HttpResponseException
    {
        return new HttpResponseException(ApiResponse::error($code, __($message), 409));
    }

    private function int(mixed $value): ?int
    {
        return $value === null ? null : (int) $value;
    }
}
