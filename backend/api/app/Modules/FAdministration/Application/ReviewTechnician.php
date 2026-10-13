<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Modules\FAdministration\Domain\VerificationChecklist;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Revisión documentada de un técnico pendiente (RN-24, D-13, D-50): aprobar exige la checklist completa y
 * habilita; rechazar exige motivo y deja al técnico pendiente con verificación «rejected». Revisión, documentos,
 * perfil y auditoría van en una sola transacción. Solo se revisa lo que está pendiente de verificación (409).
 */
final class ReviewTechnician
{
    public function __construct(private readonly AuditTrail $audit, private readonly VerificationChecklist $checklist) {}

    public function decide(User $reviewer, int $technicianId, array $data): object
    {
        return DB::transaction(function () use ($reviewer, $technicianId, $data) {
            $profile = DB::table('technician_profiles')->lockForUpdate()->find($technicianId);
            abort_unless($profile, 404);
            abort_unless((int) $profile->version === (int) $data['expected_version']
                && $profile->status === 'pending_verification' && $profile->verification_status === 'pending', 409);
            $approve = $data['decision'] === 'approve';
            $checklist = $this->checklist->for($profile);
            $missing = array_keys(array_filter($checklist, fn (bool $ok) => ! $ok));
            if ($approve && $missing !== []) {
                throw ValidationException::withMessages(['decision' => __('api.review_requirements', ['missing' => implode(', ', $missing)])]);
            }

            $now = now();
            $reviewId = DB::table('technician_reviews')->insertGetId([
                'technician_id' => $profile->id, 'reviewer_id' => $reviewer->id, 'decision' => $data['decision'],
                'reason' => $data['reason'], 'checklist' => json_encode($checklist, JSON_THROW_ON_ERROR), 'reviewed_at' => $now,
            ]);
            $documents = DB::table('technician_documents')->where('technician_id', $profile->id)->where('review_status', 'pending')->pluck('id');
            foreach ($documents as $documentId) {
                DB::table('review_documents')->insert(['review_id' => $reviewId, 'document_id' => $documentId]);
            }
            DB::table('technician_documents')->whereIn('id', $documents)->update([
                'review_status' => $approve ? 'approved' : 'rejected', 'reviewed_by' => $reviewer->id, 'reviewed_at' => $now,
            ]);
            $after = $approve
                ? ['status' => 'active', 'verification_status' => 'approved', 'verified_at' => $now, 'verified_by' => $reviewer->id]
                : ['verification_status' => 'rejected'];
            DB::table('technician_profiles')->where('id', $profile->id)->update($after + ['version' => $profile->version + 1, 'updated_at' => $now]);
            $this->audit->record($reviewer, 'technician.review', 'technicians.verify', 'technician_profile', $profile->id, $data['reason'],
                ['status' => $profile->status, 'verification_status' => $profile->verification_status],
                ['decision' => $data['decision'], 'review_id' => $reviewId]);

            return DB::table('technician_reviews')->find($reviewId);
        });
    }
}
