<?php

namespace App\Modules\FAdministration\Application;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Estadísticas del panel (bloque C, D-85; permiso dashboard.view). Solo agregados SQL de datos reales, sin datos
 * personales, con un número fijo de consultas (S07-TC-125). La ventana es de 7, 30 o 90 días contados hasta hoy
 * (UTC, config/app.php). Las alertas del dashboard (TC-087 y TC-088) quedan para el Sprint 7.
 */
final class AdminStatistics
{
    public const RANGES = [7, 30, 90];

    private const TECHNICIAN_STATUSES = ['pending_verification', 'active', 'inactive', 'suspended'];

    private const ROLES = ['client', 'technician', 'admin'];

    public function snapshot(int $days): array
    {
        $now = CarbonImmutable::now();
        $from = $now->startOfDay()->subDays($days - 1);

        return [
            'range' => ['days' => $days, 'from' => $from->toDateString(), 'to' => $now->toDateString()],
            'requests_per_day' => $this->perDay($from, $days),
            'requests_by_specialty' => $this->grouped($from, 'specialties as g', 'g.id', '=', 'sc.specialty_id'),
            'requests_by_district' => $this->grouped($from, 'districts as g', 'g.id', '=', 's.district_id'),
            'funnel' => $this->funnel($from),
            'offers' => $this->offers($from),
            'technicians_by_status' => $this->technicians(),
            'new_users_by_role' => $this->newUsers($from),
            'active_announcements_by_audience' => $this->announcements($now),
            'generated_at' => $now->toISOString(),
        ];
    }

    private function perDay(CarbonImmutable $from, int $days): array
    {
        $counts = DB::table('service_requests')->where('created_at', '>=', $from)
            ->groupByRaw('DATE(created_at)')->selectRaw('DATE(created_at) as day, COUNT(*) as total')->pluck('total', 'day');

        return collect(range(0, $days - 1))->map(function (int $offset) use ($from, $counts) {
            $date = $from->addDays($offset)->toDateString();

            return ['date' => $date, 'total' => (int) ($counts[$date] ?? 0)];
        })->all();
    }

    /** Solicitudes del rango por especialidad o distrito, de mayor a menor; solo los grupos con datos. */
    private function grouped(CarbonImmutable $from, string $table, string $first, string $operator, string $second): array
    {
        return DB::table('service_requests as s')->join('subcategories as sc', 'sc.id', '=', 's.subcategory_id')
            ->join($table, $first, $operator, $second)->where('s.created_at', '>=', $from)
            ->groupBy('g.id', 'g.name')->orderByDesc('total')->orderBy('g.name')
            ->get(['g.id', 'g.name', DB::raw('COUNT(*) as total')])
            ->map(fn (object $row) => ['id' => (int) $row->id, 'name' => $row->name, 'total' => (int) $row->total])->all();
    }

    /** Embudo de las solicitudes creadas en el rango: enviadas, con ofertas, asignadas y terminadas. */
    private function funnel(CarbonImmutable $from): array
    {
        $row = DB::table('service_requests as s')->where('s.created_at', '>=', $from)->selectRaw(
            'COALESCE(SUM(s.submitted_at IS NOT NULL), 0) as sent,
             COALESCE(SUM(EXISTS (SELECT 1 FROM offers o WHERE o.request_id = s.id)), 0) as with_offers,
             COALESCE(SUM(EXISTS (SELECT 1 FROM participations p WHERE p.request_id = s.id)), 0) as assigned,
             COALESCE(SUM(EXISTS (SELECT 1 FROM participations p WHERE p.request_id = s.id AND p.status = ?)
                 OR s.status IN (?, ?, ?)), 0) as completed', ['completed', 'completed', 'closed', 'unrated'])->first();

        return ['sent' => (int) $row->sent, 'with_offers' => (int) $row->with_offers, 'assigned' => (int) $row->assigned, 'completed' => (int) $row->completed];
    }

    /** Tasa de aceptación sobre las ofertas respondidas o vencidas y tiempo medio hasta la respuesta, en segundos. */
    private function offers(CarbonImmutable $from): array
    {
        $row = DB::table('offers')->where('created_at', '>=', $from)->selectRaw(
            "COUNT(*) as total, COALESCE(SUM(status = 'accepted'), 0) as accepted, COALESCE(SUM(status = 'rejected'), 0) as rejected,
             COALESCE(SUM(status = 'expired'), 0) as expired,
             AVG(CASE WHEN responded_at IS NOT NULL AND status IN ('accepted', 'rejected') THEN TIMESTAMPDIFF(SECOND, available_at, responded_at) END) as avg_response")->first();
        $decided = (int) $row->accepted + (int) $row->rejected + (int) $row->expired;

        return [
            'total' => (int) $row->total, 'accepted' => (int) $row->accepted, 'rejected' => (int) $row->rejected, 'expired' => (int) $row->expired,
            'acceptance_rate' => $decided === 0 ? null : round((int) $row->accepted / $decided, 3),
            'avg_response_seconds' => $row->avg_response === null ? null : (int) round((float) $row->avg_response),
        ];
    }

    private function technicians(): array
    {
        $counts = DB::table('technician_profiles')->groupBy('status')->selectRaw('status, COUNT(*) as total')->pluck('total', 'status');

        return collect(self::TECHNICIAN_STATUSES)->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)])->all();
    }

    private function newUsers(CarbonImmutable $from): array
    {
        $counts = DB::table('users as u')->join('roles as r', 'r.id', '=', 'u.role_id')->where('u.created_at', '>=', $from)
            ->whereNull('u.anonymized_at')->groupBy('r.code')->selectRaw('r.code, COUNT(*) as total')->pluck('total', 'code');
        $byRole = collect(self::ROLES)->mapWithKeys(fn (string $role) => [$role => (int) ($counts[$role] ?? 0)])->all();

        return $byRole + ['total' => array_sum($byRole)];
    }

    /** Comunicados publicados y vigentes ahora, por audiencia. */
    private function announcements(CarbonImmutable $now): array
    {
        $counts = DB::table('announcements as a')->join('announcement_audiences as aud', 'aud.announcement_id', '=', 'a.id')
            ->join('roles as r', 'r.id', '=', 'aud.role_id')->where('a.status', 'published')->whereNull('a.retired_at')
            ->where('a.starts_at', '<=', $now)->where('a.ends_at', '>', $now)
            ->groupBy('r.code')->selectRaw('r.code, COUNT(DISTINCT a.id) as total')->pluck('total', 'code');

        return ['client' => (int) ($counts['client'] ?? 0), 'technician' => (int) ($counts['technician'] ?? 0)];
    }
}
