<?php

namespace App\Modules\FAdministration\Application;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Indicadores del Inicio del administrador (Fase 1 del panel, adelanto parcial de HU-S07-01 / TC-087, D-73).
 * Solo conteos agregados, sin datos personales. Los filtros y las alertas del dashboard quedan para el Sprint 7.
 */
final class AdminDashboard
{
    /** Diccionario de estados de service_requests (CHECK chk_requests_status), en orden de ciclo de vida. */
    public const REQUEST_STATUSES = ['registered', 'sent', 'pending_availability', 'assigned', 'in_progress', 'completed',
        'closed', 'unrated', 'cancelled', 'expired'];

    private const ROLES = ['client', 'technician', 'admin'];

    /** Fase A2: días de la serie del Inicio y de los indicadores de 30 días. */
    private const SERIES_DAYS = 30;

    /** Lima no tiene horario de verano: su día empieza a las 05:00 UTC. */
    private const LIMA_OFFSET_HOURS = 5;

    public function __construct(private readonly OperationalAlerts $alerts, private readonly AdminTasks $tasks) {}

    public function snapshot(): array
    {
        $now = CarbonImmutable::now();
        $counts = DB::table('service_requests')->groupBy('status')->selectRaw('status, COUNT(*) as total')->pluck('total', 'status');
        $byStatus = collect(self::REQUEST_STATUSES)->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)])->all();
        $pending = DB::table('technician_profiles')->where('verification_status', 'pending')->count();

        return [
            'requests_by_status' => $byStatus,
            'requests_total' => array_sum($byStatus),
            'technicians_pending_verification' => $pending,
            // Fase A1 (D-118): contadores del menú; las alertas son null sin umbrales en la versión vigente de las reglas.
            'badges' => [
                'verification_pending' => $pending,
                'requests_unassigned' => array_sum(array_intersect_key($byStatus, array_flip(OperationalAlerts::UNASSIGNED))),
                'operational_alerts' => $this->alerts->counts()['total'] ?? null,
            ],
            // Bloque C (D-85): contador del menú «Comunicados» y últimos eventos para el Inicio.
            'announcements_active' => DB::table('announcements')->where('status', 'published')->whereNull('retired_at')
                ->where('starts_at', '<=', $now)->where('ends_at', '>', $now)->count(),
            'recent_events' => $this->recentEvents(),
            // Fase A2 (panel de control): indicadores, serie de 30 días y tareas pendientes de D-118.
            'kpis' => $this->kpis($now, array_sum(array_intersect_key($byStatus, array_flip(OperationalAlerts::UNASSIGNED)))),
            'series' => $this->series($now),
            'tasks' => $this->tasks->list(),
            'new_users' => ['last_7_days' => $this->newUsers($now->subDays(7)), 'last_30_days' => $this->newUsers($now->subDays(30))],
            // Las calificaciones llegan en el Sprint 6: no hay datos que promediar.
            'ratings' => ['available' => false, 'average' => null, 'count' => 0, 'available_from' => 'Sprint 6'],
            'generated_at' => $now->toISOString(),
        ];
    }

    /**
     * Fase A2: indicadores del Inicio. «Hoy» es el día de Lima; el tiempo medio de asignación va del envío a la
     * asignación del técnico, en minutos, con las asignaciones de los últimos 30 días (null sin datos).
     */
    private function kpis(CarbonImmutable $now, int $searching): array
    {
        $average = DB::table('participations as p')->join('service_requests as s', 's.id', '=', 'p.request_id')
            ->where('p.slot', 'primary')->where('p.assigned_at', '>=', $now->subDays(self::SERIES_DAYS))->whereNotNull('s.submitted_at')
            ->value(DB::raw('AVG(TIMESTAMPDIFF(SECOND, s.submitted_at, p.assigned_at))'));

        return [
            'requests_today' => DB::table('service_requests')->where('submitted_at', '>=', $this->limaDayStart($now))->count(),
            'searching_now' => $searching,
            'technicians_verified' => DB::table('technician_profiles')->where('status', 'active')->where('verification_status', 'approved')->count(),
            'avg_assignment_minutes' => $average === null ? null : (int) round((float) $average / 60),
            'premium_clients' => DB::table('client_profiles as c')->join('users as u', 'u.id', '=', 'c.user_id')->where('c.plan', 'premium')
                ->whereNull('u.anonymized_at')->count(),
            'iot_open_alerts' => DB::table('iot_alerts')->where('kind', 'threshold')->whereNull('resolved_at')->count(),
        ];
    }

    /** Serie de los últimos 30 días de Lima (hoy incluido), con ceros explícitos; cuatro consultas agrupadas. */
    private function series(CarbonImmutable $now): array
    {
        $from = $this->limaDayStart($now)->subDays(self::SERIES_DAYS - 1);
        $day = fn (string $column) => 'DATE(DATE_SUB('.$column.', INTERVAL '.self::LIMA_OFFSET_HOURS.' HOUR))';
        $count = fn ($query, string $column) => $query->where($column, '>=', $from)->groupByRaw($day($column))
            ->selectRaw($day($column).' as day, COUNT(*) as total')->pluck('total', 'day');
        $created = $count(DB::table('service_requests'), 'submitted_at');
        $assigned = $count(DB::table('participations')->where('slot', 'primary'), 'assigned_at');
        $cancelled = $count(DB::table('service_requests')->where('status', 'cancelled'), 'cancelled_at');
        $expired = $count(DB::table('service_requests')->where('status', 'expired'), 'closed_at');

        return ['days' => self::SERIES_DAYS, 'items' => collect(range(0, self::SERIES_DAYS - 1))->map(function (int $offset) use ($from, $created, $assigned, $cancelled, $expired) {
            $date = $from->subHours(self::LIMA_OFFSET_HOURS)->addDays($offset)->toDateString();

            return ['date' => $date, 'created' => (int) ($created[$date] ?? 0), 'assigned' => (int) ($assigned[$date] ?? 0),
                'cancelled' => (int) ($cancelled[$date] ?? 0), 'expired' => (int) ($expired[$date] ?? 0)];
        })->all()];
    }

    /** Inicio del día de hoy en Lima, en UTC. */
    private function limaDayStart(CarbonImmutable $now): CarbonImmutable
    {
        return $now->utc()->subHours(self::LIMA_OFFSET_HOURS)->startOfDay()->addHours(self::LIMA_OFFSET_HOURS);
    }

    /** Últimas 10 acciones hechas por una persona en el panel (sin sesiones ni la siembra de permisos); acción, motivo, actor y fecha. */
    private function recentEvents(): array
    {
        return DB::table('audit_entries as a')->leftJoin('users as actor', 'actor.id', '=', 'a.actor_id')
            ->whereNotNull('a.actor_id')->where('a.action', 'not like', 'auth.%')->where('a.action', 'not like', 'authorization.%')
            ->orderByDesc('a.id')->limit(10)
            ->get(['a.action', 'a.reason', 'a.subject_type', 'a.occurred_at', 'actor.name as actor'])
            ->map(fn (object $row) => ['action' => $row->action, 'reason' => $row->reason, 'subject_type' => $row->subject_type,
                'actor' => $row->actor, 'occurred_at' => CarbonImmutable::parse($row->occurred_at)->toISOString()])->all();
    }

    private function newUsers(CarbonImmutable $since): array
    {
        $counts = DB::table('users as u')->join('roles as r', 'r.id', '=', 'u.role_id')
            ->where('u.created_at', '>=', $since)->whereNull('u.anonymized_at')
            ->groupBy('r.code')->selectRaw('r.code, COUNT(*) as total')->pluck('total', 'code');
        $byRole = collect(self::ROLES)->mapWithKeys(fn (string $role) => [$role => (int) ($counts[$role] ?? 0)])->all();

        return $byRole + ['total' => array_sum($byRole)];
    }
}
