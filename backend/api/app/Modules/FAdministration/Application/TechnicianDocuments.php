<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use App\Shared\Audit\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Documentos privados de verificación (D-46): como máximo 5 vigentes (no rechazados) por técnico. */
final class TechnicianDocuments
{
    public const MAX_CURRENT = 5;

    public function __construct(private readonly OwnTechnicianProfile $profiles, private readonly AuditTrail $audit) {}

    public function store(User $user, array $data): object
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profiles->lockFor($user);
            $current = DB::table('technician_documents')->where('technician_id', $profile->id)->where('review_status', '!=', 'rejected')->count();
            if ($current >= self::MAX_CURRENT) {
                throw ValidationException::withMessages(['media_id' => __('api.document_limit')]);
            }
            $id = DB::table('technician_documents')->insertGetId([
                'technician_id' => $profile->id, 'media_id' => $data['media_id'], 'document_type' => $data['document_type'],
            ]);
            $this->audit->record($user, 'technician.document.added', null, 'technician_document', $id,
                'El técnico agrega un documento de verificación.', [], ['media_id' => $data['media_id']]);

            return DB::table('technician_documents')->find($id);
        });
    }
}
