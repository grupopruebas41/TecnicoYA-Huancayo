<?php

namespace App\Modules\FAdministration\Application;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Panel del técnico, Fase T2 (D-104 y D-107): datos del Inicio en una sola llamada, solo del propio técnico y con datos
 * reales. Las ofertas se siguen leyendo de GET /offers (su contrato del S4); aquí van los conteos, los indicadores, las
 * visitas de hoy por franja, el progreso del perfil con sus tareas, las insignias y el estado de la verificación.
 * «Mi día» solo da el distrito, nunca la dirección exacta.
 */
final class TechnicianHome
{
    public const TIMEZONE = 'America/Lima';

    /** D-107: documentos obligatorios (se reconocen por su tipo declarado). */
    public const REQUIRED_DOCUMENTS = [
        'identity' => ['label' => 'Documento de identidad', 'match' => ['identidad', 'dni']],
        'certificate' => ['label' => 'Certificado o constancia técnica', 'match' => ['certificado', 'constancia']],
    ];

    /** D-107: «Respuesta rápida» = mediana de las últimas 10 respuestas ≤ 2 min, con al menos 5 respondidas. */
    public const FAST_RESPONSE_SECONDS = 120;

    public const FAST_RESPONSE_MINIMUM = 5;

    public const FIRST_JOBS = 5;

    public function for(int $technicianId, ?string $avatarUrl): array
    {
        $profile = DB::table('technician_profiles')->where('id', $technicianId)->first();
        $now = CarbonImmutable::now('UTC');
        $dayStart = $now->setTimezone(self::TIMEZONE)->startOfDay()->utc();
        $dayEnd = $dayStart->addDay();
        $since = $now->subDays(30);

        $offers = DB::table('offers')->where('technician_id', $technicianId);
        $pending = (clone $offers)->where('status', 'pending')->where('expires_at', '>', $now)->count();
        $recent = (clone $offers)->where('available_at', '>=', $since)->whereIn('status', ['accepted', 'rejected', 'expired'])
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $accepted = (int) ($recent['accepted'] ?? 0);
        $answered = $accepted + (int) ($recent['rejected'] ?? 0);
        $closed = $answered + (int) ($recent['expired'] ?? 0);

        $visits = $this->visits($technicianId, $dayStart, $dayEnd);
        $next = DB::table('appointments as a')->join('service_requests as r', 'r.id', '=', 'a.request_id')
            ->join('subcategories as s', 's.id', '=', 'r.subcategory_id')->join('districts as d', 'd.id', '=', 'r.district_id')
            ->where('a.technician_id', $technicianId)->where('a.status', 'confirmed')->where('a.starts_at', '>=', $now)
            ->orderBy('a.starts_at')->first(['a.request_id', 'a.starts_at', 's.name as subcategory', 'd.name as district']);

        $tasks = $this->tasks($technicianId, $profile, $avatarUrl);
        $done = count(array_filter($tasks, fn (array $task) => $task['done']));
        $percent = (int) round($done / count($tasks) * 100);
        $documents = $this->documents($technicianId);

        return [
            'verification' => $this->verification($profile, $documents),
            'offers' => ['pending' => $pending],
            'indicators' => [
                'jobs_today' => count($visits),
                'offers_answered' => $answered,
                // Aceptadas ÷ (respondidas + vencidas) en los últimos 30 días; null si no hubo ofertas.
                'acceptance_rate' => $closed > 0 ? (int) round($accepted / $closed * 100) : null,
                'period_days' => 30,
                'next_visit' => $next ? [
                    'request_id' => (int) $next->request_id, 'starts_at' => CarbonImmutable::parse($next->starts_at, 'UTC')->toISOString(),
                    'subcategory' => $next->subcategory, 'district' => $next->district,
                ] : null,
            ],
            'today' => $visits,
            'progress' => ['percent' => $percent, 'done' => $done, 'total' => count($tasks), 'tasks' => $tasks],
            'badges' => $this->badges($technicianId, $profile, $percent),
            'generated_at' => $now->toISOString(),
        ];
    }

    /** Franja de una hora local: Mañana 08–12, Tarde 12–18 y Noche 18–21 (las mismas del pedido). */
    public static function slot(CarbonImmutable $startsAt): string
    {
        $hour = (int) $startsAt->setTimezone(self::TIMEZONE)->format('G');

        return $hour < 12 ? 'morning' : ($hour < 18 ? 'afternoon' : 'night');
    }

    private function visits(int $technicianId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        return DB::table('appointments as a')->join('participations as p', 'p.id', '=', 'a.participation_id')
            ->join('service_requests as r', 'r.id', '=', 'a.request_id')->join('subcategories as s', 's.id', '=', 'r.subcategory_id')
            ->join('specialties as e', 'e.id', '=', 's.specialty_id')->join('districts as d', 'd.id', '=', 'r.district_id')
            ->where('a.technician_id', $technicianId)->where('a.status', 'confirmed')
            ->where('a.starts_at', '>=', $from)->where('a.starts_at', '<', $to)->orderBy('a.starts_at')
            ->get(['a.request_id', 'a.starts_at', 'a.ends_at', 'p.status', 's.name as subcategory', 'e.name as specialty', 'd.name as district'])
            ->map(function (object $row) {
                $start = CarbonImmutable::parse($row->starts_at, 'UTC');

                return [
                    'request_id' => (int) $row->request_id, 'starts_at' => $start->toISOString(),
                    'ends_at' => CarbonImmutable::parse($row->ends_at, 'UTC')->toISOString(), 'slot' => self::slot($start),
                    'status' => $row->status, 'specialty' => $row->specialty, 'subcategory' => $row->subcategory, 'district' => $row->district,
                ];
            })->values()->all();
    }

    /** Tareas concretas del perfil; cada una dice a qué sección lleva. */
    private function tasks(int $technicianId, object $profile, ?string $avatarUrl): array
    {
        $published = DB::table('portfolio_items')->where('technician_id', $technicianId)->where('status', 'published')->count();
        $documents = $this->documents($technicianId);
        $missing = array_diff(array_keys(self::REQUIRED_DOCUMENTS), $documents['present']);

        return [
            ['code' => 'about', 'label' => 'Escribe «Sobre mí» con al menos 40 caracteres', 'section' => 'profile-pro',
                'done' => mb_strlen(trim((string) $profile->bio)) >= 40],
            ['code' => 'base_district', 'label' => 'Elige tu distrito base', 'section' => 'profile-pro', 'done' => $profile->base_district_id !== null],
            ['code' => 'services', 'label' => 'Agrega un servicio con su tarifa', 'section' => 'services',
                'done' => DB::table('technician_services')->where('technician_id', $technicianId)->where('active', 1)->where('reference_fee', '>', 0)->exists()],
            ['code' => 'zones', 'label' => 'Define tus zonas de atención', 'section' => 'zones',
                'done' => DB::table('technician_districts')->where('technician_id', $technicianId)->where('active', 1)->exists()],
            ['code' => 'availability', 'label' => 'Define tus horarios de atención', 'section' => 'zones',
                'done' => DB::table('availability_slots')->where('technician_id', $technicianId)->where('active', 1)->exists()],
            ['code' => 'portfolio', 'label' => $published >= 2 ? 'Tienes 2 trabajos o más en tu portafolio'
                : sprintf('Agrega %d %s a tu portafolio', 2 - $published, 2 - $published === 1 ? 'trabajo publicado' : 'trabajos publicados'),
                'section' => 'portfolio', 'done' => $published >= 2],
            ['code' => 'documents', 'label' => $missing === [] || $profile->verification_status === 'approved' ? 'Sube tus documentos de verificación'
                : 'Sube: '.implode(' y ', array_map(fn ($key) => self::REQUIRED_DOCUMENTS[$key]['label'], $missing)),
                'section' => 'verification', 'done' => $profile->verification_status === 'approved' || $missing === []],
            ['code' => 'photo', 'label' => 'Agrega tu foto de perfil', 'section' => 'account', 'done' => $avatarUrl !== null],
        ];
    }

    /** Tipos obligatorios presentes (no rechazados), por coincidencia con el tipo declarado. */
    private function documents(int $technicianId): array
    {
        $types = DB::table('technician_documents')->where('technician_id', $technicianId)->where('review_status', '!=', 'rejected')
            ->pluck('document_type')->map(fn ($type) => mb_strtolower((string) $type));
        $present = [];
        foreach (self::REQUIRED_DOCUMENTS as $key => $required) {
            if ($types->contains(fn ($type) => collect($required['match'])->contains(fn ($word) => str_contains($type, $word)))) {
                $present[] = $key;
            }
        }

        return ['present' => $present, 'rejected' => DB::table('technician_documents')->where('technician_id', $technicianId)->where('review_status', 'rejected')->exists()];
    }

    /** Estado para el menú: aprobado, observado, falta un documento o en revisión (D-106). */
    private function verification(object $profile, array $documents): array
    {
        $missing = array_values(array_map(fn ($key) => self::REQUIRED_DOCUMENTS[$key]['label'],
            array_diff(array_keys(self::REQUIRED_DOCUMENTS), $documents['present'])));
        [$state, $label] = match (true) {
            $profile->verification_status === 'approved' => ['approved', 'Aprobado'],
            $profile->verification_status === 'rejected' => ['observed', 'Observado'],
            $missing !== [] => ['missing', 'Falta un documento'],
            default => ['in_review', 'En revisión'],
        };

        return ['state' => $state, 'label' => $label, 'missing' => $profile->verification_status === 'approved' ? [] : $missing];
    }

    private function badges(int $technicianId, object $profile, int $percent): array
    {
        $responses = DB::table('offers')->where('technician_id', $technicianId)->whereNotNull('responded_at')
            ->whereIn('status', ['accepted', 'rejected'])->orderByDesc('responded_at')->limit(10)->get(['available_at', 'responded_at'])
            ->map(fn (object $row) => CarbonImmutable::parse($row->available_at, 'UTC')->diffInSeconds(CarbonImmutable::parse($row->responded_at, 'UTC'), true))
            ->sort()->values();
        $median = $responses->isEmpty() ? null : ($responses->count() % 2
            ? $responses[intdiv($responses->count(), 2)]
            : ($responses[$responses->count() / 2 - 1] + $responses[$responses->count() / 2]) / 2);
        $completed = DB::table('participations')->where('technician_id', $technicianId)->where('status', 'completed')->count();

        return [
            ['code' => 'verified', 'label' => 'Verificado', 'earned' => $profile->verification_status === 'approved',
                'hint' => $profile->verification_status === 'approved' ? 'Tus documentos están aprobados.' : 'Se obtiene cuando aprobamos tus documentos.'],
            ['code' => 'complete_profile', 'label' => 'Perfil completo', 'earned' => $percent === 100,
                'hint' => "Tu perfil está al {$percent} %."],
            ['code' => 'fast_response', 'label' => 'Respuesta rápida',
                'earned' => $responses->count() >= self::FAST_RESPONSE_MINIMUM && $median !== null && $median <= self::FAST_RESPONSE_SECONDS,
                'hint' => $responses->count() < self::FAST_RESPONSE_MINIMUM
                    ? sprintf('Responde %d ofertas más para medirla.', self::FAST_RESPONSE_MINIMUM - $responses->count())
                    : 'Mediana de tus últimas respuestas: '.self::duration((int) round($median)).'.'],
            ['code' => 'first_jobs', 'label' => 'Primeros 5 trabajos', 'earned' => $completed >= self::FIRST_JOBS,
                'hint' => $completed >= self::FIRST_JOBS ? "{$completed} trabajos completados." : sprintf('Llevas %d de %d trabajos completados.', $completed, self::FIRST_JOBS)],
        ];
    }

    private static function duration(int $seconds): string
    {
        return $seconds < 60 ? "{$seconds} s" : sprintf('%d min %02d s', intdiv($seconds, 60), $seconds % 60);
    }
}
