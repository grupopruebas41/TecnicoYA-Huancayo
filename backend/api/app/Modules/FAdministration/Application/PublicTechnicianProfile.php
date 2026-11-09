<?php

namespace App\Modules\FAdministration\Application;

use App\Modules\BMatching\Application\AvailableToday;
use App\Modules\BMatching\Application\SampleReviews;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Perfil público de un técnico habilitado (RF-C06). Por lista blanca de campos: nunca documentos, WhatsApp, teléfono,
 * correo, dirección ni distrito base (RN-22, TC-034).
 * D-101 (propuesta, Fase 3): verificado, forma de trabajo, garantía, «qué incluye» cada servicio, especialidades,
 * distritos, semana de disponibilidad por franjas, favorito del cliente de la sesión y reseñas de ejemplo, que van
 * aparte de las calificaciones reales (Sprint 6).
 */
final class PublicTechnicianProfile
{
    /** Franjas de la semana visual: Mañana 08–12, Tarde 12–18 y Noche 18–21 (hora de Lima). */
    public const BANDS = ['morning' => ['08:00:00', '12:00:00'], 'afternoon' => ['12:00:00', '18:00:00'], 'night' => ['18:00:00', '21:00:00']];

    public const DAYS = [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'];

    public function __construct(private readonly Portfolio $portfolio) {}

    public function show(int $technicianId, ?int $clientUserId = null): array
    {
        $profile = DB::table('technician_profiles')->where('id', $technicianId)->where('status', 'active')
            ->first(['id', 'display_name', 'bio', 'work_style', 'warranty_text', 'provider_type', 'experience_years', 'verification_status']);
        abort_unless($profile, 404);
        $services = $this->services($profile->id);

        return [
            'id' => $profile->id,
            'display_name' => $profile->display_name,
            'bio' => $profile->bio,
            'work_style' => $profile->work_style,
            'warranty_text' => $profile->warranty_text,
            'provider_type' => $profile->provider_type,
            'experience_years' => (int) $profile->experience_years,
            'verified' => $profile->verification_status === 'approved',
            'specialties' => collect($services)->unique('specialty_id')
                ->map(fn (array $s) => ['id' => $s['specialty_id'], 'name' => $s['specialty_name']])->values()->all(),
            'services' => array_map(fn (array $s) => array_diff_key($s, array_flip(['specialty_id', 'specialty_name'])), $services),
            'districts' => DB::table('technician_districts as d')->join('districts as x', 'x.id', '=', 'd.district_id')
                ->where('d.technician_id', $profile->id)->where('d.active', 1)->where('x.active', 1)->orderBy('x.name')
                ->get(['x.id', 'x.name'])->map(fn (object $d) => ['id' => (int) $d->id, 'name' => $d->name])->all(),
            'availability' => ['week' => $this->week($profile->id), 'available_today' => AvailableToday::for($profile->id, now())],
            'portfolio' => $this->portfolio->publicGallery($profile->id),
            'favorite' => $clientUserId !== null && DB::table('client_favorite_technicians')
                ->where('client_user_id', $clientUserId)->where('technician_id', $profile->id)->exists(),
            'rating' => ['average' => null, 'count' => 0],
            'sample_rating' => SampleReviews::profileSummary($profile->id),
            'reviews' => SampleReviews::list($profile->id),
        ];
    }

    private function services(int $technicianId): array
    {
        return DB::table('technician_services as t')
            ->join('subcategories as s', 's.id', '=', 't.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->where('t.technician_id', $technicianId)->where('t.active', 1)->where('s.active', 1)->where('p.active', 1)
            ->orderBy('p.display_order')->orderBy('s.display_order')
            ->get(['t.subcategory_id', 's.name as subcategory_name', 't.reference_fee', 't.currency', 't.includes', 'p.id as specialty_id', 'p.name as specialty_name'])
            ->map(fn (object $service) => (array) $service + ['specialty_id' => (int) $service->specialty_id])->all();
    }

    /** Franjas semanales activas y vigentes desde hoy; una banda cuenta si alguna franja se superpone con ella. */
    private function week(int $technicianId): array
    {
        $today = CarbonImmutable::now(AvailableToday::TIMEZONE)->toDateString();
        $slots = DB::table('availability_slots')->where('technician_id', $technicianId)->where('active', 1)->where('kind', 'weekly')
            ->where(fn ($q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', $today))
            ->get(['weekday', 'local_start', 'local_end'])->groupBy('weekday');

        return array_map(fn (int $weekday) => [
            'weekday' => $weekday,
            'day' => self::DAYS[$weekday],
            'bands' => array_values(array_filter(array_keys(self::BANDS), fn (string $band) => $slots->get($weekday, collect())
                ->contains(fn (object $slot) => $slot->local_start < self::BANDS[$band][1] && $slot->local_end > self::BANDS[$band][0]))),
        ], array_keys(self::DAYS));
    }
}
