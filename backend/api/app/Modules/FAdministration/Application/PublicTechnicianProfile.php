<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Support\Facades\DB;

/**
 * Perfil público de un técnico habilitado (RF-C06): bio, servicios con tarifa referencial y portafolio.
 * Por lista blanca de campos: nunca documentos, WhatsApp ni teléfono (RN-22). Reseñas públicas: Sprint 6.
 */
final class PublicTechnicianProfile
{
    public function __construct(private readonly Portfolio $portfolio) {}

    public function show(int $technicianId): array
    {
        $profile = DB::table('technician_profiles')->where('id', $technicianId)->where('status', 'active')
            ->first(['id', 'display_name', 'bio', 'provider_type', 'experience_years']);
        abort_unless($profile, 404);

        return [
            'id' => $profile->id,
            'display_name' => $profile->display_name,
            'bio' => $profile->bio,
            'provider_type' => $profile->provider_type,
            'experience_years' => (int) $profile->experience_years,
            'services' => $this->services($profile->id),
            'portfolio' => $this->portfolio->publicGallery($profile->id),
            'reviews' => [],
        ];
    }

    private function services(int $technicianId): array
    {
        return DB::table('technician_services as t')
            ->join('subcategories as s', 's.id', '=', 't.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->where('t.technician_id', $technicianId)->where('t.active', 1)->where('s.active', 1)->where('p.active', 1)
            ->orderBy('s.display_order')
            ->get(['t.subcategory_id', 's.name as subcategory_name', 't.reference_fee', 't.currency'])
            ->map(fn (object $service) => (array) $service)->all();
    }
}
