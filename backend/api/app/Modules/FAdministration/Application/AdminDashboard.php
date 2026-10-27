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

    public function snapshot(): array
    {
        $now = CarbonImmutable::now();
        $counts = DB::table('service_requests')->groupBy('status')->selectRaw('status, COUNT(*) as total')->pluck('total', 'status');
        $byStatus = collect(self::REQUEST_STATUSES)->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)])->all();

        return [
            'requests_by_status' => $byStatus,
            'requests_total' => array_sum($byStatus),
            'technicians_pending_verification' => DB::table('technician_profiles')->where('verification_status', 'pending')->count(),
            // Bloque C (D-85): contador del menú «Comunicados» y últimos eventos para el Inicio.
            'announcements_active' => DB::table('announcements')->where('status', 'published')->whereNull('retired_at')
                ->where('starts_at', '<=', $now)->where('ends_at', '>', $now)->count(),
            'recent_events' => $this->recentEvents(),
            'new_users' => ['last_7_days' => $this->newUsers($now->subDays(7)), 'last_30_days' => $this->newUsers($now->subDays(30))],
            // Las calificaciones llegan en el Sprint 6: no hay datos que promediar.
            'ratings' => ['available' => false, 'average' => null, 'count' => 0, 'available_from' => 'Sprint 6'],
            'generated_at' => $now->toISOString(),
        ];
    }

    /** Últimos 5 eventos hechos por una persona en el panel (sin sesiones ni la siembra de permisos); acción, motivo, actor y fecha. */
    private function recentEvents(): array
    {
        return DB::table('audit_entries as a')->leftJoin('users as actor', 'actor.id', '=', 'a.actor_id')
            ->whereNotNull('a.actor_id')->where('a.action', 'not like', 'auth.%')->where('a.action', 'not like', 'authorization.%')
            ->orderByDesc('a.id')->limit(5)
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
