<?php

namespace App\Modules\FAdministration\Application;

use App\Modules\FAdministration\Domain\VerificationChecklist;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Lecturas para verificar técnicos (contrato S2 §9.1 y §9.2). Por lista blanca de campos: nunca correo,
 * teléfono, contraseña ni el contenido o la ruta de los archivos.
 */
final class TechnicianDirectory
{
    /** Estado de la bandeja => condición sobre technician_profiles. */
    public const FILTERS = [
        'pending' => ['status' => 'pending_verification', 'verification_status' => 'pending'],
        'rejected' => ['status' => 'pending_verification', 'verification_status' => 'rejected'],
        'active' => ['status' => 'active'],
        'suspended' => ['status' => 'suspended'],
    ];

    public function __construct(private readonly VerificationChecklist $checklist) {}

    public function inbox(?string $filter): array
    {
        return DB::table('technician_profiles as t')
            ->when($filter !== null, fn ($q) => $q->where(collect(self::FILTERS[$filter])->mapWithKeys(fn ($v, $k) => ["t.$k" => $v])->all()))
            ->orderBy('t.created_at')->orderBy('t.id')
            ->get(['t.id', 't.display_name', 't.status', 't.verification_status', 't.experience_years', 't.created_at', 't.version'])
            ->map(fn (object $row) => [
                'id' => $row->id, 'display_name' => $row->display_name, 'status' => $row->status,
                'verification_status' => $row->verification_status, 'experience_years' => $row->experience_years,
                'documents_count' => DB::table('technician_documents')->where('technician_id', $row->id)->count(),
                'created_at' => Carbon::parse($row->created_at)->toISOString(), 'version' => (int) $row->version,
            ])->all();
    }

    public function card(int $technicianId): array
    {
        $profile = DB::table('technician_profiles')->find($technicianId);
        abort_unless($profile, 404);

        return [
            'id' => $profile->id, 'display_name' => $profile->display_name, 'bio' => $profile->bio,
            'experience_years' => $profile->experience_years, 'status' => $profile->status,
            'verification_status' => $profile->verification_status, 'version' => (int) $profile->version,
            'checklist' => $this->checklist->for($profile),
            'services' => DB::table('technician_services as t')->join('subcategories as s', 's.id', '=', 't.subcategory_id')
                ->where('t.technician_id', $profile->id)->where('t.active', 1)->orderBy('s.display_order')
                ->get(['t.subcategory_id', 's.name as subcategory_name', 't.reference_fee'])->map(fn ($row) => (array) $row)->all(),
            'districts' => DB::table('technician_districts as t')->join('districts as d', 'd.id', '=', 't.district_id')
                ->where('t.technician_id', $profile->id)->where('t.active', 1)->orderBy('d.id')
                ->get(['d.id', 'd.name'])->map(fn ($row) => (array) $row)->all(),
            'documents' => $this->documents($profile->id),
            'reviews' => DB::table('technician_reviews')->where('technician_id', $profile->id)->orderByDesc('reviewed_at')->orderByDesc('id')
                ->get(['decision', 'reason', 'reviewed_at'])
                ->map(fn ($row) => ['decision' => $row->decision, 'reason' => $row->reason, 'reviewed_at' => Carbon::parse($row->reviewed_at)->toISOString()])
                ->all(),
        ];
    }

    /** Documentos del técnico con la URL de descarga controlada por MediaController. */
    public function documents(int $technicianId): array
    {
        return DB::table('technician_documents')->where('technician_id', $technicianId)->orderBy('id')
            ->get(['id', 'document_type', 'review_status', 'media_id'])
            ->map(fn ($row) => (array) $row + ['url' => url("/api/v1/media/{$row->media_id}")])->all();
    }
}
