<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Perfil técnico completo para su propio dueño (contrato S2 §5.1): incluye borradores, documentos, pausa y la
 * última revisión. Nunca incluye correo, teléfono ni contraseña.
 */
final class OwnProfileView
{
    public function __construct(private readonly Portfolio $portfolio, private readonly TechnicianDirectory $directory) {}

    public function for(int $technicianId): array
    {
        $profile = DB::table('technician_profiles')->find($technicianId);
        $review = DB::table('technician_reviews')->where('technician_id', $technicianId)->orderByDesc('reviewed_at')->orderByDesc('id')->first();

        return [
            'id' => $profile->id, 'display_name' => $profile->display_name, 'bio' => $profile->bio,
            'experience_years' => $profile->experience_years, 'base_district_id' => $profile->base_district_id, 'status' => $profile->status,
            'verification_status' => $profile->verification_status, 'version' => (int) $profile->version,
            'last_review' => $review ? [
                'decision' => $review->decision, 'reason' => $review->reason, 'reviewed_at' => Carbon::parse($review->reviewed_at)->toISOString(),
            ] : null,
            'services' => DB::table('technician_services as t')->join('subcategories as s', 's.id', '=', 't.subcategory_id')
                ->where('t.technician_id', $technicianId)->orderBy('s.display_order')
                ->get(['t.subcategory_id', 's.name as subcategory_name', 't.reference_fee', 't.currency', 't.current_rate_version', 't.active'])
                ->map(fn ($row) => [
                    'subcategory_id' => $row->subcategory_id, 'subcategory_name' => $row->subcategory_name, 'reference_fee' => $row->reference_fee,
                    'currency' => $row->currency, 'rate_version' => (int) $row->current_rate_version, 'active' => (bool) $row->active,
                ])->all(),
            'declared_subcategories' => $this->declared($technicianId),
            'availability' => $this->availability($technicianId),
            'portfolio' => $this->portfolio->ownItems($technicianId),
            'documents' => $this->directory->documents($technicianId),
        ];
    }

    /** D-80: rubros declarados al registrarse; has_rate indica si ya tienen un servicio activo con tarifa. */
    private function declared(int $technicianId): array
    {
        return DB::table('technician_declared_subcategories as d')->join('subcategories as s', 's.id', '=', 'd.subcategory_id')
            ->join('specialties as p', 'p.id', '=', 's.specialty_id')
            ->leftJoin('technician_services as t', fn ($join) => $join->on('t.subcategory_id', '=', 'd.subcategory_id')
                ->on('t.technician_id', '=', 'd.technician_id')->where('t.active', 1))
            ->where('d.technician_id', $technicianId)->orderBy('p.display_order')->orderBy('s.display_order')->orderBy('s.id')
            ->get(['d.subcategory_id', 's.name as subcategory_name', 's.specialty_id', 'p.name as specialty_name', 't.subcategory_id as rated'])
            ->map(fn ($row) => [
                'subcategory_id' => (int) $row->subcategory_id, 'subcategory_name' => $row->subcategory_name,
                'specialty_id' => (int) $row->specialty_id, 'specialty_name' => $row->specialty_name, 'has_rate' => $row->rated !== null,
            ])->all();
    }

    private function availability(int $technicianId): array
    {
        $pause = DB::table('technician_pauses')->where('technician_id', $technicianId)->whereNull('cancelled_at')
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))->orderBy('starts_at')->first();
        $iso = fn (?string $value) => $value === null ? null : Carbon::parse($value)->toISOString();

        return [
            'slots' => DB::table('availability_slots')->where('technician_id', $technicianId)->where('active', 1)
                ->orderBy('weekday')->orderBy('local_start')->get()
                ->map(fn ($slot) => ['weekday' => $slot->weekday, 'start' => substr($slot->local_start, 0, 5), 'end' => substr($slot->local_end, 0, 5)])
                ->all(),
            'district_ids' => DB::table('technician_districts')->where('technician_id', $technicianId)->where('active', 1)
                ->orderBy('district_id')->pluck('district_id')->all(),
            'pause' => $pause ? ['starts_at' => $iso($pause->starts_at), 'ends_at' => $iso($pause->ends_at), 'reason' => $pause->reason] : null,
        ];
    }
}
