<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Aprobación documentada de un técnico pendiente (RN-24): revisión, documentos revisados, habilitación y
 * auditoría en una sola transacción.
 */
final class ReviewTechnician
{
    public function __construct(private readonly AuditTrail $audit) {}

    public function approve(User $reviewer, int $technicianId, array $data): object
    {
        return DB::transaction(function () use ($reviewer, $technicianId, $data) {
            $profile = DB::table('technician_profiles')->lockForUpdate()->find($technicianId);
            abort_unless($profile, 404);
            abort_unless((int) $profile->version === (int) $data['expected_version'] && $profile->status === 'pending_verification', 409);
            $checklist = $this->checklist($profile);
            $missing = array_keys(array_filter($checklist, fn (bool $ok) => ! $ok));
            if ($missing !== []) {
                throw ValidationException::withMessages(['decision' => __('api.review_requirements', ['missing' => implode(', ', $missing)])]);
            }

            $now = now();
            $reviewId = DB::table('technician_reviews')->insertGetId([
                'technician_id' => $profile->id, 'reviewer_id' => $reviewer->id, 'decision' => 'approve',
                'reason' => $data['reason'], 'checklist' => json_encode($checklist, JSON_THROW_ON_ERROR), 'reviewed_at' => $now,
            ]);
            $documents = DB::table('technician_documents')->where('technician_id', $profile->id)->pluck('id');
            foreach ($documents as $documentId) {
                DB::table('review_documents')->insert(['review_id' => $reviewId, 'document_id' => $documentId]);
            }
            DB::table('technician_documents')->whereIn('id', $documents)
                ->update(['review_status' => 'approved', 'reviewed_by' => $reviewer->id, 'reviewed_at' => $now]);
            DB::table('technician_profiles')->where('id', $profile->id)->update([
                'status' => 'active', 'verification_status' => 'approved', 'verified_at' => $now,
                'verified_by' => $reviewer->id, 'version' => $profile->version + 1, 'updated_at' => $now,
            ]);
            $this->audit->record($reviewer, 'technician.review', 'technicians.verify', 'technician_profile', $profile->id,
                $data['reason'], ['status' => $profile->status], ['status' => 'active', 'review_id' => $reviewId]);

            return DB::table('technician_reviews')->find($reviewId);
        });
    }

    /** Requisitos de RN-24 que deben existir antes de habilitar; claves en español para el mensaje. */
    private function checklist(object $profile): array
    {
        return [
            'teléfono' => DB::table('users')->where('id', $profile->user_id)->whereNotNull('phone')->exists(),
            'servicios con tarifa' => DB::table('technician_services')->where('technician_id', $profile->id)->where('active', 1)->exists(),
            'zona de atención' => DB::table('technician_districts')->where('technician_id', $profile->id)->where('active', 1)->exists(),
            'experiencia declarada' => $profile->experience_years !== null,
            'evidencia documental' => DB::table('technician_documents')->where('technician_id', $profile->id)->exists(),
        ];
    }
}
